// import { useState } from "react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SlidePreviewer from "./SlidePreviewer";
import MessagePopup from "./MessagePopup"
import SlideSelector from "./SlideSelector";
import testMarkdown from "../test_data/testMarkdown.md?raw";

const defaultPollMarkdown = `<!--poll-->
{title}
{question}
{option1}
{option2}
{option3}
---`

// Base URL for the REST API and headers for authentication
const baseURL = import.meta.env.VITE_RESTAPI_LINK;
const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${import.meta.env.VITE_RESTAPI_ACCESS_TOKEN}`
};
// Local server URL for parsing markdown
// if the server doesnt exist then the parsing functionality will not work.
const serverURL = "http://localhost:3000";

export default function SlideEditor() {
    // Define state variables and other constants
    const [uploadMessage, setUploadMessage] = useState(null);
    const [error, setError] = useState(null);

    const [markdownInput, setMarkdownInput] = useState("");
    const [currentMarkdown, setCurrentMarkdown] = useState(markdownInput);
    const [parsed, setParsed] = useState(null);
    const [intermediate, setIntermediate] = useState(null);
    const [slidesFormat, setSlidesFormat] = useState(null);
    const [selectedSlide, setSelectedSlide] = useState(0);
    const [outputFodp, setOutputFodp] = useState(null);
    const [searchParams] = useSearchParams();
    const presentationId = searchParams.get("presentationId");
    const [convertRequested, setConvertRequested] = useState(false);
    const [presentation, setPresentation] = useState(null);
    const [showParsedDebugEditor, setShowParsedDebugEditor] = useState(false);
    const [showIntermediateEditor, setShowIntermediateEditor] = useState(false);
    const [showSlideFormatEditor, setShowSlideFormatEditor] = useState(false);
    const [publishedStatus, setPublishedStatus] = useState(false);

    // Function to trigger markdown conversion
    const convertMarkdown = () => {
        try {
            setCurrentMarkdown(markdownInput);
            setUploadMessage("Markdown converted to slide format.");
            setConvertRequested(true);

        } catch (error) {
            console.error("Error converting markdown:", error);
            setUploadMessage("Failed to convert markdown.");
            setError("Unable to connect to the Markdown conversion server. Please make sure the server is running.");
        }
    };

    // Function to add a poll template to the markdown input
    const addPollTemplate = () => {
        setMarkdownInput(markdownInput + "\n" + defaultPollMarkdown);
    };

    // Function to fetch the presentation data from the REST API. 
    // The presentation ID is obtained from the URL search parameters, 
    // which sets the presentation variable.
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
                Number(presentation.presentation_id) === Number(presentationId)
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
            presentation: foundPresentation,
        };
    };

    // Fetch from the local server to parse markdown from md to JSON-like format.
    const parseMarkdown = async (markdown) => {
        try {
            const response = await fetch(`${serverURL}/parse-md`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ markdown })
            });

            if (!response.ok) {
                throw new Error(`Markdown parsing failed: ${response.status}`);
            }

            const result = await response.json();
            setParsed(result);
            return result;

        } catch (error) {
            console.error("Failed to parse markdown:", error);
            setError("Unable to connect to the Markdown conversion server.");
            return null;
        }
    };

    // Function to generate the intermediate JSON-like format from the parsed markdown.
    const generateIntermediate = async (parsed) => {
        const response = await fetch(`${serverURL}/create-intermediate-json`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ parsed: parsed })
        });

        const result = await response.json();
        console.log(result);
        setIntermediate(result);
        return result;
    };

    const generateFodp = async () => {
        const response = await fetch(`${serverURL}/create-fodp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ intermediate: intermediate })
        });
        const result = await response.json();
        setOutputFodp(result);
        return result;
    };

    const generateSlidesFormat = async () => {
        const response = await fetch(`${serverURL}/create-slides-format`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                intermediate: intermediate,
                presentationId: presentationId
            })
        });

        const result = await response.json();
        console.log(result);
        setSlidesFormat(result);
        return result;
    };

    // Function to load slides for the current presentation; slides only
    const loadSlides = async () => {
        console.log("Loading slides for presentation ID:", presentationId);
        try {
            // Get the slides from the REST API
            const slidesResponse = await fetch(
                `${import.meta.env.VITE_RESTAPI_LINK}/slide`,
                { headers: { Authorization: `Bearer ${import.meta.env.VITE_RESTAPI_ACCESS_TOKEN}` } }
            );
            if (!slidesResponse.ok) {
                throw new Error(
                    `Slides GET failed: ${slidesResponse.status}`
                );
            }
            const slides = await slidesResponse.json();
            // Only show slides belonging to this presentation
            const presentationSlides = slides.data
                .filter(slide => slide.presentation_id === Number(presentationId))
                .sort((a, b) => a.slide_position - b.slide_position);
            console.log("Slides for presentation:", presentationSlides);
            setSlidesFormat(presentationSlides);
            setUploadMessage("Loaded slides for presentation ID " + presentationId);
            console.log("published? " + publishedStatus);

        } catch (error) {
            console.error("Failed to load slides:", error);
            setUploadMessage("Failed to load slides for presentation ID " + presentationId);
        }
    };

    // Function to upload slides in the current presentation to the REST API
    const uploadSlides = async () => {
        try {
            // Update presentation with the current markdown; use patch to soft update instead of deleting and recreating the presentation
            if (publishedStatus) {
                console.error("Cannot edit a published presentation.");
                throw new Error("Cannot edit a published presentation.");
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
                const errorText = await presentationResponse.text();
                console.error("Presentation API error:", errorText);
                throw new Error(
                    `Failed to update presentation: ${presentationResponse.status}`
                );
            }

            // Get existing slides with matching presentation ID
            const response = await fetch(`${baseURL}/slide`, { headers });
            const result = await response.json();
            const existingSlides = result.data;
            console.log("Existing slides:", existingSlides);

            // Delete existing slides for this presentation, with matching presentationID (overwrite)
            // Use Promise.all to delete all existing slides for this presentation concurrently 
            // and only proceed once all deletions are complete
            await Promise.all(
                existingSlides
                    .filter(slide => slide.presentation_id === Number(presentationId))
                    .map(slide =>
                        fetch(`${baseURL}/slide/${slide.id}`, {
                            method: "DELETE",
                            headers
                        })
                    )
            );

            // Upload new slides for this presentation:
            // Use Promise.all to upload all new slides for this presentation concurrently,
            // like the deletion step above
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
                            return slideResponse.text().then(errorText => {
                                console.error("Slide API error:", errorText);
                                console.error("Slide sent:", slideData);
                                throw new Error(
                                    `Failed to upload slide ${slide.slide_id}: ${slideResponse.status}`
                                );
                            });
                        }
                    });
                })
            );
            setUploadMessage("Upload success: uploaded with presentation ID " + presentationId);

        } catch (error) {
            console.error(error);
            setUploadMessage("Upload failed");
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
                console.error("Presentation API error:", errorText);
                throw new Error(
                    `Failed to publish presentation: ${response.status}`
                );
            }
            setPublishedStatus(true);
            setUploadMessage("Presentation published successfully");
        } catch (error) {
            console.error(error);
            setUploadMessage("Failed to publish presentation");
        }
    };

    // Effect to handle markdown conversion and slide generation
    useEffect(() => {
        if (convertRequested) {
            parseMarkdown(currentMarkdown);
        }
    }, [convertRequested, currentMarkdown]);

    // Effect to handle intermediate slide generation after parsing
    useEffect(() => {
        if (convertRequested && parsed) {
            generateIntermediate(parsed);
        }
    }, [convertRequested, parsed]);

    // Effect to handle final slide generation after intermediate slides are ready, and to 
    // make a FODP format in case that is required (from assignment 1)
    useEffect(() => {
        if (convertRequested && intermediate) {
            generateFodp(intermediate);
            generateSlidesFormat(intermediate);
        }
    }, [convertRequested, intermediate]);

    // Effect to fetch the presentation details when the component mounts
    useEffect(() => {
        fetchPresentation();
    }, []);

    // Effect to load slides whenever the presentation ID changes
    useEffect(() => {
        const initialise = async () => {
            const result = await fetchPresentation();
            const presentation = result.presentation;

            await loadSlides(presentation);

            console.log("Published status:", presentation.published_status);

            if (presentation.published_status) {
                const parsedResult = await parseMarkdown(presentation.original_markdown);
                await generateIntermediate(parsedResult);
            }
        };

        initialise();
    }, [presentationId]);

    return (
        <div className="mb-4">
            <h1>PresentLive Slide Editor</h1>
            <hr />
            <p>Editing slides for presentation: {" "}
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
            <hr />
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

                {/* Editor control buttons */}
                <button
                    className="btn btn-primary mt-3 mx-2"
                    onClick={
                        () => {
                            console.log("Converting markdown to slide format...");
                            convertMarkdown();
                        }
                    }
                    disabled={publishedStatus}
                >
                    Convert Markdown to slides
                </button>
                <button
                    className="btn btn-primary mt-3 mx-2"
                    onClick={
                        () => {
                            console.log("Adding poll template...");
                            addPollTemplate();
                        }
                    }
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
                        () => {
                            console.log("slidesFormat:", slidesFormat);
                            uploadSlides();
                        }
                    }
                    disabled={publishedStatus || !slidesFormat || slidesFormat.length === 0}
                >
                    {/* Later, use PUT instead of POST if the slide is already present, or just fail it */}
                    Save slides to API
                </button>
                <button
                    className="btn btn-warning mt-3 mx-2"
                    onClick={() => {
                        if (window.confirm(
                            "Are you sure you want to publish this presentation? You will no longer be able to edit it."
                        )) {
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

            <hr />


            {/* Debug Editors */}
            <p className="lead mt-4">Debug Editors</p>

            <div className="px-4">
                <button
                    className="btn btn-outline-secondary w-100 mt-3"
                    onClick={() => setShowParsedDebugEditor(!showParsedDebugEditor)}
                >
                    {showParsedDebugEditor ? "Hide parsedMD" : "Show parsedMD"}
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

            {/* Display the intermediate format for debugging purposes */}
            <div className="px-4">
                <button
                    className="btn btn-outline-secondary w-100 mt-3"
                    onClick={() => setShowIntermediateEditor(!showIntermediateEditor)}
                >
                    {showIntermediateEditor ? "Hide intermediate format" : "Show intermediate format"}
                </button>

                {showIntermediateEditor && (
                    <textarea
                        className="form-control"
                        value={intermediate ? JSON.stringify(intermediate, null, 2) : ""}
                        readOnly
                        style={{ height: "400px" }}
                    />
                )}

            </div>
            {/* Display the slides format for debugging purposes */}
            <div className="px-4">
                <button
                    className="btn btn-outline-secondary w-100 mt-3"
                    onClick={() => setShowSlideFormatEditor(!showSlideFormatEditor)}
                >
                    {showSlideFormatEditor ? "Hide slides format" : "Show slides format"}
                </button>
                {showSlideFormatEditor && (
                    <textarea
                        className="form-control"
                        value={slidesFormat ? JSON.stringify(slidesFormat, null, 2) : ""}
                        readOnly
                        style={{ height: "400px" }}
                    />
                )}
            </div>
            {/* Handle the upload message popup. */}
            {
                uploadMessage && (
                    <MessagePopup
                        message={uploadMessage}
                        onClose={() => setUploadMessage(null)}
                    />
                )
            }
            {/* Display error message if any */}
            {error && (
                <div className="alert alert-danger mt-3" role="alert">
                    {error}
                </div>
            )}
        </div >
    );
}