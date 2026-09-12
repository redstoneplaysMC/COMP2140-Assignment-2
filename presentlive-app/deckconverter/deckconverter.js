const fs = require("fs")
const path = require("path");
const { parsePresentMD } = require("./presentMDparser");
const { TextDecoder } = require("util");

/**
 * front matter that is required to generate the slides
*/
const xml_libaries = 
`xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0"
xmlns:presentation="urn:oasis:names:tc:opendocument:xmlns:presentation:1.0"
xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"
xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0"
xmlns:dc="http://purl.org/dc/elements/1.1/"
xmlns:meta="urn:oasis:names:tc:opendocument:xmlns:meta:1.0"
office:version="1.2"
office:mimetype="application/vnd.oasis.opendocument.presentation"`

/**
 * Traverses a runs object to get text stored inside. 
 * 
*/
function getRunText(runs) {
    let text = "";

    for (const run of runs) {
        if (run.type === "text") {
            text += run.value;
        }

        // Run tree: recursively visit nested runs
        if (run.runs) {
            text += getRunText(run.runs);
        }
    }

    return text;
}

/**
 * Remove any directives that are denoted by <--!draft-->, as parsed by presentMDParser
*/
function removeDrafts(parsed){
    outputParsed = {
        blocks: []
    }

    let isDraft = false;

    for (const block of parsed.blocks) {
        switch (block.kind) {
            case "directive":
                if (block.key === "draft"){
                    isDraft = true;
                } else if (!isDraft) {
                    outputParsed.blocks.push(block);
                }
                break;

            case "separator":
                if (!isDraft) {
                    outputParsed.blocks.push(block);
                }
                isDraft = false;
                break;

            default:
                if (!isDraft) {
                    outputParsed.blocks.push(block);
                }
                break;
        }
    };
    return outputParsed
}

/**
 * Generate an Agenda by traversing parsed XML object 
*/
function createAgenda(parsed){
    const agenda = {
        kind: "list",
        ordered: true,
        items: []
    };

    const summary = [
        {
            kind: "heading",
            level: 1,
            runs: [{
                type: "text",
                value: "Agenda"
            }]
        }, agenda]
    
    for (const block of parsed.blocks) {
        if (block.level < 3 && block.kind === "heading") {
            // console.log(block.runs[0].value)
            agenda.items.push({
              "runs": [
                {
                  type: "text",
                  value: block.runs[0].value
                }
              ],
              "items": []
            }
        )
    }};
    return summary;
}

/**
 * Taking the parsed XML object from PresentMDParser, convert to intermediate JSON format.
*/
function createIntermediateJSON(parsed) {
    const summary = {
        title: null,
        author: null,
        backgroundColor: null,
        color: null,
        layout: null,
        slide_count: 0,
        slides: [],
    };
    function createSlide() { // Basic slide template
        return {
            name: null,
            layout: "",
            blocks: [],
            slide_index: 0
        };
    }
    function unsupportedValue(WarnText) { // Replacement for unsupported value
        return {
            kind: "unsupported",
            text: `Unsupported: ${WarnText} omitted`
         }
    }
    parsed = removeDrafts(parsed);
    agenda = createAgenda(parsed);
    currentSlide = createSlide();
    for (const block of parsed.blocks) {
        switch(block.kind) { //switch for block kind
            case "directive":
                switch (block.key){
                    case "agenda":
                        currentSlide.name = "Agenda";
                        currentSlide.blocks.push(...agenda);
                        break;
                    case "backgroundColor":
                        currentSlide.backgroundColor = block.value
                        break;
                    case "layout":
                        currentSlide.layout = block.value
                        break; 
                    default:
                        // [Unsupported: --- Omitted]
                        currentSlide.blocks.push(unsupportedValue("Unknown directive"));
                        break;
                }
                break;

            case "frontmatter":
                summary.title = block.settings?.title;
                summary.author = block.settings?.author;
                summary.backgroundColor = block.settings?.backgroundColor;
                summary.color = block.settings?.color;
                summary.layout = block.settings?.layout;
                break;

            case "heading":
                if (block.level > 3) {
                    currentSlide.blocks.push(
                        unsupportedValue(`Heading level ${block.level}`));
                } else {
                    if (!currentSlide.name) {
                        currentSlide.name = block.runs[0].value;
                    }
                    currentSlide.blocks.push(block);
                }
                break;

            case "paragraph":
            case "quote":
            case "note":
            case "list":
                currentSlide.blocks.push(block);
                break;

            case "separator":
                // Separator still makes a slide even though draft was removed: fix this
                summary.slide_count++;
                summary.slides.push(currentSlide);
                currentSlide = createSlide();
                currentSlide.slide_index = summary.slide_count;
                break;
            }
    }
    
    // Add the final slide, if not present.
    if (currentSlide.blocks.length > 0) {
        summary.slide_count++;
        currentSlide.slide_index = summary.slide_count;
        summary.slides.push(currentSlide);
    }
    return summary;
}

/**
 * Generator function for XML format.
 * Accounts for XML escape sequences and indentation, and is recursive for nested Lists.
 * Returns <prefix name additional> value <prefix name> 
*/
function fodpCreateNamespace(
    prefix, 
    name, 
    value, 
    additional="",
    depth = 0
) {
    const attributes = additional ? ` ${additional}` : "";
    const indentation = "  ".repeat(depth);
    function fodpEscapeText(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }
    if (Array.isArray(value)) {
        const children = value
            .map(child => {
                if (child === null) {
                    return ""
                }
                if (typeof child === "string") {
                    return indentation + fodpEscapeText(child);
                }
                return fodpCreateNamespace(
                        child.prefix,
                        child.name, 
                        child.value,
                        child.additional,
                        depth + 1
                    )
                }
            ).join("\n");
        return `${indentation}<${prefix}:${name}${attributes}>\n`+
            `${children}\n` +
            `${indentation}</${prefix}:${name}>`
    }
    return value
        ? `${indentation}<${prefix}:${name}${attributes}>${fodpEscapeText(value)}</${prefix}:${name}>`
        : `${indentation}<${prefix}:${name}${attributes}/>`
}

/**
 * PageLayout style generator
*/
function fodpPageLayout(name) {
    return {
        prefix:"style", 
        name:"page-layout", 
        additional: `style:name="${name}"`,
        value: [
            {
                prefix: "style",
                name: "page-layout-properties",
                value: null,
                additional:
                    "fo:page-width=\"25.4cm\" " + 
                    " fo:page-height=\"14.29cm\" " + 
                    " style:print-orientation=\"landscape\""
            }
        ]
    }   
}

/**
 * Default FODP Style generator
*/
function fodpStyle(name, style, family, value) {
    return {
        prefix:"style", 
        name:style, 
        additional: `style:name="${name}" style:family="${family}"`,
        value: value
    }   
}

// master Style generator
function fodpMasterStyle(name, layoutName) {
    return {
        prefix:"style", 
        name:"master-page", 
        additional: `style:name="${name}" style:page-layout-name="${layoutName}"`,
        value: null
    }   
}

// paragraph style generator
function fodpParagraphStyle(name, paragraphProperties, textProperties) {
    return {
        prefix: "style",
        name: "style",
        additional:
            `style:name="${name}" style:family="paragraph"`,
        value: [
            {
                prefix: "style",
                name: "paragraph-properties",
                additional: paragraphProperties,
                value: null
            },
            {
                prefix: "style",
                name: "text-properties",
                additional: textProperties,
                value: null
            }
        ]
    };
}

// Color page style generator.
function fodpDrawingPageStyle(name, fillColor) {
    return fodpStyle(name, "style", "drawing-page", [
        {
            prefix: "style",
            name: "drawing-page-properties",
            value: null,
            additional: 
                `draw:fill="solid" draw:fill-color="${fillColor}"`
        }
    ]);   
}

// Text style generator (fonts)
function fodpTextStyle(name, textProperties) {
    return fodpStyle(name, "style", "text", [
        {
            prefix: "style",
            name: "text-properties",
            value: null,
            additional: textProperties
        }
    ]);   
}

/**
 * List style generator, defines how the bullets should look in XML Format.
*/
function fodpListStyle(name, type, levels) {
    // Constructor to make a list
    function fodpBulletChar(level) {
        switch (level) {
            case 1:
                return "•";
            case 2:
                return "-";
            default:
                return "•";
        }
    }
    return {
        prefix: "text",
        name: "list-style",
        additional: `style:name="${name}"`,
        value: levels.map(level => ({
            prefix: "text",
            name: `list-level-style-${type}`,
            additional: type === "bullet"
                ? `text:level="${level}" text:bullet-char="${fodpBulletChar(level)}"`
                : `text:level="${level}" text:num-format="1" style:num-suffix="."`,
            value: [
                {
                    prefix: "style",
                    name: "list-level-properties",
                    additional: 
                        `text:space-before="${0.9 * (level-1)}cm" ` + 
                        'text:min-label-width="0.7cm"',
                    value: null
                }
            ]
        }))
    };
}

//Get the background Style name from the slide, if exists otherwise return default.
function fodpGetBackgroundStyleName(slide) {
    return (slide == null || slide.backgroundColor == null)
        ? "dp-default-bg"
        : `dp-bg-${slide.slide_index}`;
}

/**
 * Converts runs into XML format.
 * @param {*} runs 
 * @returns XML format of the run text.
 */
function fodpGetRunText(runs) {
    return runs.map(run => {
        if (run.type === "text") {
            return run.value;
        }

        let styleName;

        switch (run.type) {
            case "strong":
                styleName = "t-bold";
                break;

            case "em":
                styleName = "t-italic";
                break;

            case "strike":
                styleName = "t-strike";
                break;

            default:
                return fodpGetRunText(run.runs || []);
        }

        return {
            prefix: "text",
            name: "span",
            additional: `text:style-name="${styleName}"`,
            value: fodpGetRunText(run.runs || [])
        };
    }).flat();
}

// Recursive function entry point
function fodpList(list) {
    return {
        prefix: "text",
        name: "list",
        additional: list.ordered
            ? 'text:style-name="L-number"'
            : 'text:style-name="L-bullet"',
        value: list.items.map(item => fodpListItem(item))
    };
}

/**
 * ListItem
 * @param {*} item 
 * @returns XML format for a listItem.
 */
function fodpListItem(item) {
    return {
        prefix: "text",
        name: "list-item",
        value: [
            {
                prefix: "text",
                name: "p",
                additional: 'text:style-name="p-body"',
                value: fodpGetRunText(item.runs)
            },
            ...(item.items.length > 0
                ? [
                    {
                        prefix: "text",
                        name: "list",
                        value: item.items.map(child => fodpListItem(child))
                    }
                ]
                : [])
        ]
    };
}

/**
 * Convert input block into XML Format, to parse into fodpNamespaceGenerator()
 * @param {*} block Intermediate Json input block
 * @returns FODP format of that block.
 */
function fodpBlock(block) {
    switch (block.kind) {

        case "paragraph":
            return {
                prefix: "text",
                name: "p",
                additional: 'text:style-name="p-body"',
                value: fodpGetRunText(block.runs)
            };
        
        case "heading":
            return {
                prefix: "text",
                name: "p",
                additional: `text:style-name="p-heading${block.level}"`,
                value: fodpGetRunText(block.runs)
            };

        case "list":
            return fodpList(block);

        case "quote":
            return {
                prefix: "text",
                name: "p",
                additional: 'text:style-name="p-quote"',
                value: fodpGetRunText(block.runs)
            };

        default:
            return null;
    }
}

/**
 * Put slide into a presentationNotes XML.
 * @param {*} slide 
 * @returns presentationNotes
 */
function fodpPresentationNotes(slide) {
    const notes = slide.blocks.filter(block => block.kind === "note");

    if (notes.length === 0) {
        return null;
    }

    return {
        prefix: "presentation",
        name: "notes",
        value: [
            {
                prefix: "draw",
                name: "frame",
                additional:
                    'presentation:class="notes" ' +
                    'svg:x="1.0cm" svg:y="1.0cm" ' +
                    'svg:width="18.6cm" svg:height="5cm"',
                value: [
                    {
                        prefix: "draw",
                        name: "text-box",
                        value: notes.map(note => ({
                            prefix: "text",
                            name: "p",
                            additional: 'text:style-name="p-notes"',
                            value: note.text
                        }))
                    }
                ]
            }
        ]
    };
}

/**
 * 
 * @param {*} slide 
 * @returns title slide XML
 */
function fodpTitleSlide(slide) {
    return {
        prefix: "draw",
        name: "page",
        additional:
            `draw:name="${slide.name}" ` +
            `draw:master-page-name="Title" ` +
            `draw:style-name="${fodpGetBackgroundStyleName(slide)}"`,

        value: [
            // Title frame
            {
                prefix: "draw",
                name: "frame",
                additional:
                    'presentation:class="title" ' +
                    'svg:x="1.4cm" svg:y="4.0cm" ' +
                    'svg:width="22.6cm" svg:height="2.5cm"',
                value: [
                    {
                        prefix: "draw",
                        name: "text-box",
                        value: [
                            {
                                prefix: "text",
                                name: "p",
                                additional: 'text:style-name="p-title"',
                                value: getRunText(
                                    slide.blocks.find(block => block.kind === "heading")?.runs || []
                                )
                            }
                        ]
                    }
                ]
            },
            // Subtitle frame
            {
                prefix: "draw",
                name: "frame",
                additional:
                    'presentation:class="subtitle" ' +
                    'svg:x="1.4cm" svg:y="6.4cm" ' +
                    'svg:width="22.6cm" svg:height="1.5cm"',
                value: [
                    {
                        prefix: "draw",
                        name: "text-box",
                        value: [
                            {
                                prefix: "text",
                                name: "p",
                                additional: 'text:style-name="p-subtitle"',
                                value: getRunText(
                                    slide.blocks.find(block => block.kind === "heading")?.runs || []
                                )
                            }
                        ]
                    }
                ]
            },
            // Notes would go here
            fodpPresentationNotes(slide)
        ]
    };
}

/**
 * 
 * @param {*} slide 
 * @returns Section slide XML 
 */
function fodpSectionSlide(slide) {
    return {
        prefix: "draw",
        name: "page",
        additional:
            `draw:name="${slide.name}" ` +
            `draw:master-page-name="Section" ` +
            `draw:style-name="${fodpGetBackgroundStyleName(slide)}"`,

        value: [
            // Title frame
            {
                prefix: "draw",
                name: "frame",
                additional:
                    'presentation:class="section" ' +
                    'svg:x="1.4cm" svg:y="4.5cm" ' +
                    'svg:width="22.6cm" svg:height="2.5cm"',
                value: [
                    {
                        prefix: "draw",
                        name: "text-box",
                        value: [
                            {
                                prefix: "text",
                                name: "p",
                                additional: 'text:style-name="p-section-title"',
                                value: getRunText(
                                    slide.blocks.find(block => block.kind === "heading")?.runs || []
                                )
                            }
                        ]
                    }
                ]
            },
            fodpPresentationNotes(slide)
        ]
    };
}

/**
 * Default slide, uses the default template to make a slide, given a slide.
 * The slide will have a title and a body, which is defined in fodpBlock.
 * @param {*} slide 
 * @returns Default Slide XML
 */
function fodpDefaultSlide(slide) {
    const body = slide.blocks
        .filter(block => block.kind !== "heading" || block.level === 3) //Remove heading level 1 & 2
        .map(fodpBlock)
        .filter(block => block !== null);
    return {
        prefix: "draw",
        name: "page",
        additional:
            `draw:name="${slide.name}" ` +
            `draw:master-page-name="Default" ` +
            `draw:style-name="${fodpGetBackgroundStyleName(slide)}"`,
        value: [ // Title frame
            {
                prefix: "draw",
                name: "frame",
                additional:
                    'presentation:class="title" ' +
                    'svg:x="1.4cm" svg:y="1.0cm" ' +
                    'svg:width="22.6cm" svg:height="2.5cm"',
                value: [
                    {
                        prefix: "draw",
                        name: "text-box",
                        value: [
                            {
                                prefix: "text",
                                name: "p",
                                additional: 'text:style-name="p-title"',
                                value: getRunText(
                                    slide.blocks.find(block => block.kind === "heading")?.runs || []
                                )
                            }
                        ]
                    }
                ]
            },
            {
                prefix: "draw",
                name: "frame",
                additional:
                    'presentation:class="default" ' +
                    'svg:x="1.4cm" svg:y="3.8cm" ' +
                    'svg:width="22.6cm" svg:height="7.8cm"',
                value: [
                    {
                        prefix: "draw",
                        name: "text-box",
                        value: body
                    }
                ]
            },
            fodpPresentationNotes(slide)
            // Notes would go here
        ]
    };
}

/**
 * Switcher for the desired slide. Also handles assumedLayout logic: 
 *  i.e. the assumed Layout preset incase the slide does not specify a layout.
 * @param {*} slide Input Slide
 * @param {*} assumedLayout The default layout, if no layout is specified.
 * @returns the formatted slide
 */
function fodpSlideParser(slide, assumedLayout="") {
    // Default layout is specified in the front-matter. 
    if (!slide.layout) {
        slide.layout = assumedLayout;
    }
    switch (slide.layout) {
        case "title":
            return fodpTitleSlide(slide);

        case "section":
            return fodpSectionSlide(slide);

        case "default":
            return fodpDefaultSlide(slide);

        default:
            return fodpDefaultSlide(slide);
    }
}

/**
 * The primary function to generate the FODP from intermediate JSON.
 * @param {*} intermediateJSON 
 * @returns the complete FODP file, in XML format
 */
function createFodpMain(intermediateJSON) {
    const backgroundStyles = [
    fodpDrawingPageStyle(
        fodpGetBackgroundStyleName(null),
        "#1e3a5f"
    ),
    ...intermediateJSON.slides
        .filter(slide => slide.backgroundColor != null)
        .map(slide =>
            fodpDrawingPageStyle(
                fodpGetBackgroundStyleName(slide),
                slide.backgroundColor
            )
        )
    ];

    // Style settings
    fodp = fodpCreateNamespace("office", "document", [
        null,
        {
            prefix:"office",
            name:"meta",
            value: [
                {   
                    prefix: "dc",
                    name: "title",
                    value: intermediateJSON.title
                },
                {
                    prefix: "dc",
                    name: "creator",
                    value: intermediateJSON.author
                }
            ]
        },
        null, 
        {
            prefix:"office", 
            name:"styles"
        },
        null, 
        {
            prefix:"office", 
            name:"automatic-styles",
            value: [ // Automatic Styles
                fodpPageLayout("PM-default"),
                fodpPageLayout("PM-title"),
                fodpPageLayout("PM-section"),
                null,
                ...backgroundStyles,
                null,
                fodpParagraphStyle("p-title",'fo:text-align="center"','fo:font-size="32pt" fo:font-weight="bold" fo:color="#ffffff"'),
                fodpParagraphStyle("p-subtitle",'fo:text-align="center"','fo:font-size="20pt" fo:color="#ffffff"'),
                fodpParagraphStyle("p-body",'fo:text-align="left" fo:margin-bottom="0.25cm"','fo:font-size="18pt" fo:color="#ffffff"'),
                fodpParagraphStyle("p-heading3",'fo:text-align="left" fo:margin-bottom="0.25cm"','fo:font-size="18pt" fo:font-weight="bold" fo:color="#ffffff"'),
                fodpParagraphStyle(
                    "p-section-title",'fo:text-align="center"','fo:font-size="36pt" fo:font-weight="bold" fo:color="#ffffff"'
                ),
                fodpParagraphStyle(
                    "p-quote",'fo:text-align="left" fo:margin-left="0.8cm" fo:margin-right="0.8cm" fo:margin-bottom="0.25cm"',
                    'fo:font-size="18pt" fo:font-style="italic" fo:color="#ffffff"'
                ),
                fodpParagraphStyle(
                    "p-notes",'fo:text-align="left"',
                    'fo:font-size="18pt" fo:color="#ffffff"'
                ),
                null,
                fodpTextStyle("t-bold", `fo:font-weight="bold"`),
                fodpTextStyle("t-italic", `fo:font-style="italic"`),
                fodpTextStyle("t-strike", `style:text-line-through-style="solid"`), 
                null,
                fodpListStyle("L-bullet", "bullet", [1, 2]),
                fodpListStyle("L-number","number",[1])
            ]
        },
        null,
        {
            prefix:"office", 
            name:"master-styles",
            value: [ // Master styles for page layout
                fodpMasterStyle("Default", "PM-default"),
                fodpMasterStyle("Title", "PM-title"),
                fodpMasterStyle("Section", "PM-section")
            ]
        },
        null,
        {
            prefix: "office", 
            name: "body",
            value: [{ // Body
                prefix: "office",
                name: "presentation",
                value: intermediateJSON.slides.map(slide => (
                    fodpSlideParser(slide, intermediateJSON.layout)
                ))
            }
            ]
        }
    ]
    , xml_libaries)
    fodp = `<?xml version="1.0" encoding="UTF-8"?>\n` + fodp
    return fodp;
}

// Check arguments, making sure that the command-line arguments are valid
function checkArgs(){
    if (process.argv.length !== 4 && process.argv.length !== 5) {
        throw new Error("Usage: node converter.js <input> <output> [--model]");
    }
    if (process.argv.length === 5 && process.argv[4] !== "--model") {
        throw new Error("Unknown option");
    }
    return process.argv.length === 5;
}

/**
 * Check that the .md file is valid, or throws an error.
 * The file is valid if front matter is formatted properly,
 * and markdown doesn't return empty.
 * @param {*} inputPath 
 * @returns 
 */
function checkValidMDFile(inputPath) {
    let markdown;

    try {
        markdown = new TextDecoder("utf-8", { fatal: true })
            .decode(fs.readFileSync(inputPath));
    } catch {
        throw new Error("Deck is not valid UTF-8");
    }

    const fenceCount = markdown
        .split(/\r?\n/)
        .filter(line => line.trim() === "---")
        .length;
    if (fenceCount === 1) {
        throw new Error("Unterminated frontmatter");
    }

    return markdown;
}

/**
 * Generate the FODP file and write it to the path specified in arg.
 * @param {*} inputPath 
 * @param {*} outputFolder 
 * @param {*} modelFlag 
 * @returns whether the file was successfuly written.
 */
function writeFodpToOutput(inputPath, outputFolder, modelFlag=false){
    try {
        const inputName = path.parse(inputPath).name; // Silently fails?
        const intermediatePath = path.join(
            outputFolder,
            `${inputName}.model.json`
        );

        const outputPath = path.join(
            outputFolder,
            `${inputName}.fodp`
        );
        const markdown = checkValidMDFile(inputPath);
        // const markdown = fs.readFileSync(inputPath, 'utf8');
        const parsed = parsePresentMD(markdown);
        const intermediate = createIntermediateJSON(parsed);
        const fodp = createFodpMain(intermediate);
        if (markdown.trim().length === 0) {throw new Error("Deck is empty")}   
        if (intermediate.slides.length === 0) {throw new Error("Deck contains no slides")}
        fs.writeFileSync(outputPath, fodp);
            if (modelFlag) {
                fs.writeFileSync(intermediatePath, JSON.stringify(intermediate, null, 2));
            }
        return true;
    } catch (error) { // Somehow the code ends up here in the gradescope env, i suspect it is due to path being wrong
        console.error("Failed to load!")
        console.error(error.message);
        return false;        
    }
}

if (require.main === module) {

    try {
        const modelFlag = checkArgs();
        const inputPath = process.argv[2];
        const outputDir = process.argv[3];
        const stats = fs.statSync(inputPath);

        if (stats.isDirectory()) {
            const files = fs.readdirSync(inputPath);
            const mdfiles = files.filter(file => path.extname(file) === ".md");
            console.log(`${mdfiles.length} decks to convert`);
            const results = mdfiles.map(file => { // Failing inside here
                const inputFile = path.join(inputPath, file);
                return writeFodpToOutput(inputFile, outputDir, modelFlag);
            });
            const convertSuccesses = results.filter(result => result).length;
            const convertFailures = results.filter(result => !result).length;
            console.log(`${convertSuccesses} decks converted`);
            console.log(`${convertFailures} decks could not be converted`);
        } else {
            writeFodpToOutput(
                inputPath,
                outputDir,
                modelFlag
            );
            // console.log("Single-file conversion:", success);
        }
    } catch (error) {
        console.error(`${error.message}`);
    }
}

module.exports = {
    checkValidMDFile,
    parsePresentMD,
    createIntermediateJSON,
    createFodpMain,
    writeFodpToOutput
};

// node .\deckconverter.js ./inputdecks outputdecks --model
// node .\deckconverter.js C:\COMP2140\assessments\inputdecks outputdecks --model