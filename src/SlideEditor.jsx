// import { useState } from "react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SlidePreviewer from "./SlidePreviewer";
import MessagePopup from "./MessagePopup"
import SlideSelector from "./SlideSelector";

let testMarkdown = `---
title: Riverside Library — Design Brief
author: A. Student
---

# Riverside Library

A design brief for the reading floors, the entrance and the garden.

^ Every block kind in the language appears in this deck, and nothing else does.

---

## Headings are formatting

A heading may appear anywhere on a slide, any number of times, and none of
them opens or titles anything.

### A smaller heading, mid-slide

Body text continues underneath it, in the same slide.

## A second heading at the top level

The first heading on the slide took the title. This one is body content,
because a slide has one title and the rest is what is on it.

---

## Paragraphs

Consecutive non-blank lines
form a single paragraph, joined
with a space between them.

A blank line ends it and starts another.

---

## Bullet lists

- The ground floor holds the collection
  - Reference along the north wall
  - Lending along the south
    - Large print at the near end
- The first floor holds study space
- The garden level holds the café

---

## Numbered lists

1. Survey the existing structure
2. Agree the floor plan
3. Order the shelving
4. Fit out and hand over

---

## Quotes

> A library is not a warehouse for books. It is a room in which a town keeps
> its attention.

The quote above is content on the slide, not a note about it.

---

## Inline formatting

Plain text, **bold**, _italic_, and ~~struck through~~.

Runs nest in any combination: **bold with _italic_ inside**, and
~~struck text carrying **bold**~~ as well.

- A list item with **bold** in it
- One using the other markers: __bold__ and *italic*

---

## Nesting

Runs nest inside list items, and lists nest inside list items.

1. Survey the structure
   - **North** wall first
   - Then the ~~south~~ *garden* elevation
2. Agree the plan

A nested list keeps its own markers, so this one is numbered inside bullets.

- Order the shelving
  1. Confirm the supplier
  2. Agree the delivery window
- Fit out and hand over

---

## Speaker notes

^ A note before the visible content.

The slide shows this paragraph and nothing else.

^ Notes may sit anywhere on the slide.
^ Each note line becomes its own paragraph in the notes pane.

---

A slide needs no heading. This one is a single paragraph, and it is legal.

---
<!-- poll: true-->
abcd
`

const defaultPollMarkdown = `<!--poll-->
{title}
{question}
{option1}
{option2}
{option3}`

let pollTestMarkdown = `Hello! Please answer the following poll on the next slide:
---
<!--poll-->
{title}
{question}
{option1}
{option2}
{option3}
---
Thank you for answering!`

export default function SlideEditor() {
    const baseURL = import.meta.env.VITE_RESTAPI_LINK;
    const [slidesFormat, setSlidesFormat] = useState(null);
    const [uploadMessage, setUploadMessage] = useState(null);
    const [selectedSlide, setSelectedSlide] = useState(0);
    const [markdownInput, setMarkdownInput] = useState(pollTestMarkdown);
    const [currentMarkdown, setCurrentMarkdown] = useState(markdownInput);
    const [parsed, setParsed] = useState(null);
    const [intermediate, setIntermediate] = useState(null);
    const [outputFodp, setOutputFodp] = useState(null);
    const [searchParams] = useSearchParams();
    const presentationId = searchParams.get("presentationId");
    const [convertRequested, setConvertRequested] = useState(false);
    const convertMarkdown = () => {
        setCurrentMarkdown(markdownInput);
        setConvertRequested(true);
    };
    const [presentation, setPresentation] = useState(null);

    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${import.meta.env.VITE_RESTAPI_ACCESS_TOKEN}`
    };

    const fetchPresentation = async () => {
        const response = await fetch(`${baseURL}/presentation`, {
            method: "GET",
            headers
        });

        if (!response.ok) {
            throw new Error(
                `Failed to fetch presentations: ${response.status}`
            );
        }

        const presentationsResponse = await response.json();
        const presentations = presentationsResponse.data;
        // console.log("Presentations: " + JSON.stringify(presentations))
        const foundPresentation = presentations.find(
            presentation =>
                Number(presentation.presentation_id) === Number(presentationId)
        );

        if (!foundPresentation) {
            throw new Error(
                `Presentation ${presentationId} not found`
            );
        }

        setPresentation(foundPresentation);
        setMarkdownInput(foundPresentation.original_markdown || "");

        return {
            presentation: foundPresentation,
        };
    };

    const parseMarkdown = async () => {
        const response = await fetch("http://localhost:3000/parse-md", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                markdown: currentMarkdown
            })
        });

        const result = await response.json();

        setParsed(result);
    };

    const generateIntermediate = async () => {
        const response = await fetch("http://localhost:3000/create-intermediate-json", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                parsed: parsed
            })
        });

        const result = await response.json();
        console.log(result);
        setIntermediate(result);
    };

    const generateFodp = async () => {
        const response = await fetch("http://localhost:3000/create-fodp", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                intermediate: intermediate
            })
        });

        const result = await response.json();
        // console.log(result);
        setOutputFodp(result);
        return result;
    };

    const generateSlidesFormat = async () => {
        const response = await fetch("http://localhost:3000/create-slides-format", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                intermediate: intermediate,
                presentationId: presentationId
            })
        });

        const result = await response.json();
        console.log(result);
        setSlidesFormat(result);
    };

    const loadSlides = async () => {
        console.log("Loading slides for presentation ID:", presentationId);

        try {
            // Get the slides
            const slidesResponse = await fetch(
                `${import.meta.env.VITE_RESTAPI_LINK}/slide`,
                {
                    headers: {
                        Authorization: `Bearer ${import.meta.env.VITE_RESTAPI_ACCESS_TOKEN}`
                    }
                }
            );

            if (!slidesResponse.ok) {
                throw new Error(
                    `Slides GET failed: ${slidesResponse.status}`
                );
            }

            const slides = await slidesResponse.json();

            console.log("All slides:", slides.data);

            // Only keep slides belonging to this presentation
            const presentationSlides = slides.data
                .filter(slide => slide.presentation_id === Number(presentationId))
                .sort((a, b) => a.slide_position - b.slide_position);

            console.log("Slides for presentation:", presentationSlides);

            setSlidesFormat(presentationSlides);
            // setMarkdownInput(presentation.original_markdown);
            setUploadMessage("Loaded slides for presentation ID " + presentationId);
        } catch (error) {
            console.error("Failed to load slides:", error);
            setUploadMessage("Failed to load slides for presentation ID " + presentationId);
        }
    };

    const uploadSlides = async () => {

        try {
            // Get existing slides
            const response = await fetch(`${baseURL}/slide`, { headers });
            const result = await response.json();
            const existingSlides = result.data;
            console.log("Existing slides:", existingSlides);

            // Delete existing slides for this presentation
            for (const slide of existingSlides) {
                if (slide.presentation_id === Number(presentationId)) {
                    await fetch(`${baseURL}/slide/${slide.id}`, {
                        method: "DELETE",
                        headers
                    });
                }
            }

            // Update presentation with the current markdown
            const presentationResponse = await fetch(
                `${baseURL}/presentation/${presentation.id}`,
                {
                    method: "PATCH",
                    headers,
                    body: JSON.stringify({
                        original_markdown: markdownInput
                    })
                }
            );

            if (!presentationResponse.ok) {
                const errorText = await presentationResponse.text();
                console.error("Presentation API error:", errorText);

                throw new Error(
                    `Failed to update presentation: ${presentationResponse.status}`
                );
            }
            setUploadMessage("Upload success: uploaded with presentation ID " + presentationId);

            // Upload new slides
            for (const slide of slidesFormat) {
                const {
                    id,
                    created_at,
                    updated_at,
                    ...slideData
                } = slide;

                const slideResponse = await fetch(`${baseURL}/slide`, {
                    method: "POST",
                    headers,
                    body: JSON.stringify(slideData)
                });

                if (!slideResponse.ok) {
                    const errorText = await slideResponse.text();

                    console.error("Slide API error:", errorText);
                    console.error("Slide sent:", slideData);

                    throw new Error(
                        `Failed to upload slide ${slide.slide_id}: ${slideResponse.status}`
                    );
                }
            }

        } catch (error) {
            console.error(error);
            setUploadMessage("Upload failed");
        }
    };

    useEffect(() => {
        if (convertRequested) {
            parseMarkdown(currentMarkdown);
        }
    }, [convertRequested, currentMarkdown]);

    useEffect(() => {
        if (convertRequested && parsed) {
            generateIntermediate(parsed);
        }
    }, [convertRequested, parsed]);

    useEffect(() => {
        if (convertRequested && intermediate) {
            generateFodp(intermediate);
            generateSlidesFormat(intermediate);
        }
    }, [convertRequested, intermediate]);



    // UseEffects: run whenever this function is called, 
    // and when the dependencies change. The dependencies are the second argument to useEffect, in an array.

    // useEffect(() => {
    //     parseMarkdown(currentMarkdown);
    // }, [currentMarkdown]);

    // useEffect(() => {
    //     if (parsed) {
    //         generateIntermediate(parsed);
    //     }
    // }, [parsed]);

    // useEffect(() => {
    //     if (intermediate) {
    //         generateFodp(intermediate);
    //         generateSlidesFormat(intermediate);
    //     }
    // }, [intermediate]);

    useEffect(() => {
        loadSlides();
    }, [presentationId]);

    useEffect(() => {
        fetchPresentation();
    }, []);

    return (
        <div className="mb-4">
            <h1>PresentLive Slide Editor</h1>
            <Link to="/">
                Back to Home
            </Link>
            <hr />
            <h4>Slide Preview</h4>
            <div className="row">
                {/* Slide preview */}
                <div className="border rounded bg-light px-4 pt-4 pb-2">
                    <div
                        className="border bg-white shadow-sm mx-auto"
                        style={{
                            aspectRatio: "16 / 9",
                            maxWidth: "900px",
                            padding: "20px"
                        }}
                    >
                        <SlidePreviewer
                            slide={slidesFormat?.[selectedSlide] ?? null}
                            presentationId={presentationId}
                        />
                    </div>
                    <div className="py-3">
                        <SlideSelector
                            selectedSlide={selectedSlide}
                            setSelectedSlide={setSelectedSlide}
                            slidesFormat={slidesFormat}
                        />
                    </div>
                </div>
            </div>
            <button
                className="btn btn-secondary"
                onClick={loadSlides}
            >
                Load from API
            </button>
            <div className="px-4">
                <p className="lead">Original Markdown</p>

                <textarea
                    className="form-control"
                    value={markdownInput}
                    onChange={(e) => setMarkdownInput(e.target.value)}
                    style={{ height: "400px" }}
                />

                <button
                    className="btn btn-primary mt-2"
                    onClick={convertMarkdown}
                >
                    Convert to Preview
                </button>
            </div>
            <div className="px-4">
                <p className="lead">parsedMD</p>
                <textarea
                    className="form-control"
                    value={parsed ? JSON.stringify(parsed, null, 2) : ""}
                    readOnly
                    style={{ height: "400px" }}
                />
            </div>

            {/* Display the intermediate format for debugging purposes */}
            <div className="px-4">
                <p className="lead">Intermediate format</p>
                <textarea
                    className="form-control"
                    value={intermediate ? JSON.stringify(intermediate, null, 2) : ""}
                    readOnly
                    style={{ height: "400px" }}
                />

            </div>
            {/* Display the slides format for debugging purposes */}
            <div className="px-4">
                <p className="lead">Slides format</p>
                <textarea
                    className="form-control"
                    value={slidesFormat ? JSON.stringify(slidesFormat, null, 2) : ""}
                    readOnly
                    style={{ height: "400px" }}
                />

            </div>
            <button
                className="btn btn-primary mt-3"
                onClick={
                    () => {
                        console.log("slidesFormat:", slidesFormat);
                        uploadSlides();
                    }
                }
                disabled={!slidesFormat || slidesFormat.length === 0}
            >
                {/* Later, use PUT instead of POST if the slide is already present, or just fail it */}
                Save slides
            </button>

            {/* Handle the upload message popup. */}
            {
                uploadMessage && (
                    <MessagePopup
                        message={uploadMessage}
                        onClose={() => setUploadMessage(null)}
                    />
                )
            }
        </div >
    );
}