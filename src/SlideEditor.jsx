import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SlidePreviewer from "./SlidePreviewer";
import MessagePopup from "./MessagePopup";
import SlideSelector from "./SlideSelector";
import CreateAISlide from "./CreateAISlide";

const defaultPollMarkdown = `
---
<!--poll-->
{title}
{question}
{option1}
{option2}
{option3}`;

const baseURL = import.meta.env.VITE_RESTAPI_LINK;

const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${import.meta.env.VITE_RESTAPI_ACCESS_TOKEN}`
};

const header_localserver = {
    "Content-Type": "application/json"
};

const serverURL = "http://localhost:3000";

function DebugEditors({
    parsed,
    intermediate,
    slidesFormat,
    showParsedDebugEditor,
    setShowParsedDebugEditor,
    showIntermediateEditor,
    setShowIntermediateEditor,
    showSlideFormatEditor,
    setShowSlideFormatEditor
}) {
    return (
        <>
            <p className="lead mt-4">Debug Editors</p>

            <div className="px-4">
                <button
                    className="btn btn-outline-secondary w-100 mt-3"
                    onClick={() =>
                        setShowParsedDebugEditor(!showParsedDebugEditor)
                    }
                >
                    {showParsedDebugEditor
                        ? "Hide parsedMD"
                        : "Show parsedMD"}
                </button>

                {showParsedDebugEditor && (
                    <textarea
                        className="form-control mt-2"
                        value={parsed ? JSON.stringify(parsed, null, 2) : ""}
                        readOnly
                        style={{ height: "400px" }}
                    />
                )}
            </div>

            <div className="px-4">
                <button
                    className="btn btn-outline-secondary w-100 mt-3"
                    onClick={() =>
                        setShowIntermediateEditor(!showIntermediateEditor)
                    }
                >
                    {showIntermediateEditor
                        ? "Hide intermediate format"
                        : "Show intermediate format"}
                </button>

                {showIntermediateEditor && (
                    <textarea
                        className="form-control"
                        value={
                            intermediate
                                ? JSON.stringify(intermediate, null, 2)
                                : ""
                        }
                        readOnly
                        style={{ height: "400px" }}
                    />
                )}
            </div>

            <div className="px-4">
                <button
                    className="btn btn-outline-secondary w-100 mt-3"
                    onClick={() =>
                        setShowSlideFormatEditor(!showSlideFormatEditor)
                    }
                >
                    {showSlideFormatEditor
                        ? "Hide slides format"
                        : "Show slides format"}
                </button>

                {showSlideFormatEditor && (
                    <textarea
                        className="form-control"
                        value={
                            slidesFormat
                                ? JSON.stringify(slidesFormat, null, 2)
                                : ""
                        }
                        readOnly
                        style={{ height: "400px" }}
                    />
                )}
            </div>
        </>
    );
}

async function uploadSlides(
    presentation,
    slidesFormat,
    markdownInput,
    publishedStatus,
    presentationId,
) {
    if (publishedStatus) {
        throw new Error(
            "Cannot edit a published presentation."
        );
    }

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
        const errorText =
            await presentationResponse.text();

        console.error(
            "Presentation API error:",
            errorText
        );

        throw new Error(
            `Failed to update presentation: ${presentationResponse.status}`
        );
    }

    const response = await fetch(
        `${baseURL}/slide`,
        { headers }
    );

    const result = await response.json();
    const existingSlides = result.data;

    await Promise.all(
        existingSlides
            .filter(
                slide =>
                    slide.presentation_id ===
                    Number(presentationId)
            )
            .map(slide =>
                fetch(
                    `${baseURL}/slide/${slide.id}`,
                    {
                        method: "DELETE",
                        headers
                    }
                )
            )
    );

    console.log("Uploading slides:", slidesFormat);

    await Promise.all(
        slidesFormat.map(slide => {
            const {
                id,
                created_at,
                updated_at,
                ...slideData
            } = slide;

            return fetch(`${baseURL}/slide`, {
                method: "POST",
                headers,
                body: JSON.stringify(slideData)
            }).then(slideResponse => {
                if (!slideResponse.ok) {
                    return slideResponse
                        .text()
                        .then(errorText => {
                            console.error(
                                "Slide API error:",
                                errorText
                            );

                            console.error(
                                "Slide sent:",
                                slideData
                            );

                            throw new Error(
                                `Failed to upload slide ${slide.slide_id}: ${slideResponse.status}`
                            );
                        });
                }
            });
        })
    );

    // setUploadMessage(
    //     "Upload success: uploaded with presentation ID " +
    //     presentationId
    // );
};

function MarkdownEditor({
    markdownInput,
    setMarkdownInput,
    publishedStatus,
    convertMarkdown,
    addPollTemplate,
    loadSlides,
    publishPresentation,
    slidesFormat,
    addAISlide,
    onUploadSlides,
}) {
    // Markdown editor component for editing and managing presentation slides.
    // The component receives several props for managing the markdown input, published status, slide conversion, and API interactions.
    // It provides buttons for converting markdown to slides, adding polls, loading slides from the API, uploading slides, and publishing the presentation.
    // Return the JSX for the markdown editor and associated buttons.
    return (
        <div className="px-4">
            <p className="lead">
                {publishedStatus ? "Markdown (Published)" : "Markdown Editor"}
            </p>

            <textarea
                className="form-control"
                value={markdownInput}
                onChange={(e) => setMarkdownInput(e.target.value)}
                readOnly={publishedStatus}
                style={{ height: "400px" }}
            />

            <button
                className="btn btn-info mt-3 mx-2"
                onClick={convertMarkdown}
                disabled={publishedStatus}
            >
                Convert Markdown to slides
            </button>

            <button
                className="btn btn-primary mt-3 mx-2"
                onClick={addPollTemplate}
                disabled={publishedStatus}
            >
                Add Poll
            </button>

            <button
                className="btn btn-primary mt-3 mx-2"
                onClick={loadSlides}
            >
                Load Slides from API
            </button>

            <button
                className="btn btn-primary mt-3 mx-2"
                onClick={
                    onUploadSlides
                }
                disabled={
                    publishedStatus ||
                    !slidesFormat ||
                    slidesFormat.length === 0
                }
            >
                Save slides to API
            </button>

            <button
                className="btn btn-info mt-3 mx-2"
                onClick={addAISlide}
                disabled={publishedStatus}
            >
                Generate Slide with AI
            </button>

            <button
                className="btn btn-warning mt-3 mx-2"
                onClick={() => {
                    if (
                        window.confirm(
                            "Are you sure you want to publish this presentation? You will no longer be able to edit it."
                        )
                    ) {
                        publishPresentation();
                    }
                }}
                disabled={publishedStatus}
            >
                Publish Presentation
            </button>

            <div className="alert alert-secondary mt-3 mb-3">
                {publishedStatus
                    ? "Presentation published. Go to Homepage -> View slides to see poll results and the presentation link."
                    : "Presentation unpublished. Please SAVE TO API and Publish to make the presentation available to attendees."
                }
            </div>
        </div>
    );
}


export default function SlideEditor() {
    const [uploadMessage, setUploadMessage] = useState(null);
    const [error, setError] = useState(null);

    const [markdownInput, setMarkdownInput] = useState("");
    const [currentMarkdown, setCurrentMarkdown] = useState(markdownInput);

    const [parsed, setParsed] = useState(null);
    const [intermediate, setIntermediate] = useState(null);
    const [slidesFormat, setSlidesFormat] = useState(null);
    const [selectedSlide, setSelectedSlide] = useState(0);

    const [searchParams] = useSearchParams();
    const presentationId = searchParams.get("presentationId");

    const [convertRequested, setConvertRequested] = useState(false);
    const [presentation, setPresentation] = useState(null);

    const [showParsedDebugEditor, setShowParsedDebugEditor] = useState(false);
    const [showIntermediateEditor, setShowIntermediateEditor] = useState(false);
    const [showSlideFormatEditor, setShowSlideFormatEditor] = useState(false);

    const [publishedStatus, setPublishedStatus] = useState(false);

    const [showAIPopup, setShowAIPopup] = useState(false);

    const convertMarkdown = () => {
        setCurrentMarkdown(markdownInput);
        setConvertRequested(true);
    };

    const addPollTemplate = () => {
        setMarkdownInput(markdownInput + defaultPollMarkdown);
    };

    // Function to add a slide via AI.
    const addAISlide = () => {
        setShowAIPopup(true);
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

        const foundPresentation = presentations.find(
            presentation =>
                Number(presentation.presentation_id) ===
                Number(presentationId)
        );

        if (!foundPresentation) {
            throw new Error(
                `Presentation ${presentationId} not found`
            );
        }

        setPresentation(foundPresentation);
        setPublishedStatus(foundPresentation.published_status || false);
        setMarkdownInput(foundPresentation.original_markdown || "");

        return {
            presentation: foundPresentation
        };
    };


    const parseMarkdown = async (markdown) => {
        try {
            const response = await fetch(`${serverURL}/parse-md`, {
                method: "POST",
                headers: header_localserver,
                body: JSON.stringify({ markdown })
            });

            if (!response.ok) {
                setUploadMessage("Failed to convert to markdown.");
                throw new Error(
                    `Markdown parsing failed: ${response.status}`
                );
            }

            const result = await response.json();

            setParsed(result);
            setUploadMessage("Markdown converted to slide format.");

            return result;

        } catch (error) {
            console.error("Failed to parse markdown:", error);
            setError(
                "Unable to connect to the Markdown conversion server."
            );
            return null;
        }
    };


    const generateIntermediate = async (parsed) => {
        try {
            const response = await fetch(
                `${serverURL}/create-intermediate-json`,
                {
                    method: "POST",
                    headers: header_localserver,
                    body: JSON.stringify({ parsed })
                }
            );

            const result = await response.json();

            console.log(result);

            setIntermediate(result);
            setUploadMessage(
                "Intermediate JSON generated successfully."
            );
            setError(null);

            return result;

        } catch (error) {
            console.error(
                "Failed to generate intermediate JSON:",
                error
            );

            setUploadMessage(
                "Failed to generate intermediate JSON."
            );

            setError(
                "Unable to connect to the intermediate JSON generation server."
            );

            return null;
        }
    };


    const handleUploadSlides = async () => {
        try {
            await uploadSlides(
                presentation,
                slidesFormat,
                markdownInput,
                publishedStatus,
                presentationId
            );

            setUploadMessage(
                "Upload success: uploaded with presentation ID " +
                presentationId
            );
        } catch (error) {
            console.error(error);
            setUploadMessage("Upload failed");
        }
    };


    // const generateFodp = async () => {
    //     const response = await fetch(`${serverURL}/create-fodp`, {
    //         method: "POST",
    //         headers: header_localserver,
    //         body: JSON.stringify({ intermediate })
    //     });

    //     const result = await response.json();

    //     setOutputFodp(result);

    //     return result;
    // };


    const generateSlidesFormat = async () => {
        const response = await fetch(
            `${serverURL}/create-slides-format`,
            {
                method: "POST",
                headers: header_localserver,
                body: JSON.stringify({
                    intermediate,
                    presentationId
                })
            }
        );

        const result = await response.json();

        setSlidesFormat(result);

        return result;
    };


    const loadSlides = async () => {
        console.log(
            "Loading slides for presentation ID:",
            presentationId
        );

        try {
            const slidesResponse = await fetch(
                `${baseURL}/slide`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${import.meta.env.VITE_RESTAPI_ACCESS_TOKEN}`
                    }
                }
            );

            if (!slidesResponse.ok) {
                throw new Error(
                    `Slides GET failed: ${slidesResponse.status}`
                );
            }

            const slides = await slidesResponse.json();

            const presentationSlides = slides.data
                .filter(
                    slide =>
                        slide.presentation_id ===
                        Number(presentationId)
                )
                .sort(
                    (a, b) =>
                        a.slide_position - b.slide_position
                );

            // console.log(
            //     "Slides for presentation:",
            //     presentationSlides
            // );

            setSlidesFormat(presentationSlides);

            setUploadMessage(
                "Loaded slides for presentation ID " +
                presentationId
            );

        } catch (error) {
            console.error("Failed to load slides:", error);

            setUploadMessage(
                "Failed to load slides for presentation ID " +
                presentationId
            );
        }
    };

    const publishPresentation = async () => {
        try {
            const response = await fetch(
                `${baseURL}/presentation/${presentation.id}`,
                {
                    method: "PATCH",
                    headers,
                    body: JSON.stringify({
                        published_status: true
                    })
                }
            );

            if (!response.ok) {
                const errorText = await response.text();

                console.error(
                    "Presentation API error:",
                    errorText
                );

                throw new Error(
                    `Failed to publish presentation: ${response.status}`
                );
            }

            setPublishedStatus(true);
            setUploadMessage(
                "Presentation published successfully"
            );

        } catch (error) {
            console.error(error);
            setUploadMessage(
                "Failed to publish presentation"
            );
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
            // generateFodp(intermediate);
            generateSlidesFormat(intermediate);
        }
    }, [convertRequested, intermediate]);


    useEffect(() => {
        fetchPresentation();
    }, []);


    useEffect(() => {
        const initialise = async () => {
            const result = await fetchPresentation();
            const presentation = result.presentation;

            await loadSlides(presentation);

            if (presentation.published_status) {
                const parsedResult = await parseMarkdown(
                    presentation.original_markdown
                );

                await generateIntermediate(parsedResult);
            }
        };

        initialise();
    }, [presentationId]);


    return (
        <div className="mb-4">
            <h1>PresentLive Slide Editor</h1>
            <hr />

            <p>
                Editing slides for presentation:{" "}
                <span className="text-primary">
                    {presentation?.title ?? "Loading..."}
                </span>
            </p>

            <Link to="/">
                Back to Home
            </Link>

            <hr />

            <h4>Slide Preview</h4>

            <div className="row">
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
                            slide={
                                slidesFormat?.[selectedSlide] ?? null
                            }
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

            <hr />

            <MarkdownEditor
                markdownInput={markdownInput}
                setMarkdownInput={setMarkdownInput}
                publishedStatus={publishedStatus}
                convertMarkdown={convertMarkdown}
                addAISlide={addAISlide}
                addPollTemplate={addPollTemplate}
                loadSlides={loadSlides}
                publishPresentation={publishPresentation}
                slidesFormat={slidesFormat}
                onUploadSlides={handleUploadSlides}
            />

            <hr />

            <DebugEditors
                parsed={parsed}
                intermediate={intermediate}
                slidesFormat={slidesFormat}
                showParsedDebugEditor={showParsedDebugEditor}
                setShowParsedDebugEditor={setShowParsedDebugEditor}
                showIntermediateEditor={showIntermediateEditor}
                setShowIntermediateEditor={setShowIntermediateEditor}
                showSlideFormatEditor={showSlideFormatEditor}
                setShowSlideFormatEditor={setShowSlideFormatEditor}
            />

            {uploadMessage && (
                <MessagePopup
                    message={uploadMessage}
                    onClose={() => setUploadMessage(null)}
                />
            )}

            {error && (
                <div
                    className="alert alert-danger mt-3"
                    role="alert"
                >
                    {error}
                </div>
            )}
            {showAIPopup && (
                <CreateAISlide
                    onClose={() => setShowAIPopup(false)}
                    onCreate={(aiSlideContent) => {
                        setMarkdownInput(
                            markdownInput + "\n---\n" + aiSlideContent
                        );
                        setShowAIPopup(false);
                    }}
                />
            )}
        </div>
    );
}
