// import { useState } from "react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SlidePreviewer from "./SlidePreviewer";
import MessagePopup from "./MessagePopup"

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

export default function SlideEditor() {
    const [parsed, setParsed] = useState(null);
    const [intermediate, setIntermediate] = useState(null);
    const [outputFodp, setOutputFodp] = useState(null);
    const [slidesFormat, setSlidesFormat] = useState(null);
    const [searchParams] = useSearchParams();
    const [uploadMessage, setUploadMessage] = useState(null);
    const [selectedSlide, setSelectedSlide] = useState(0);
    const presentationId = searchParams.get("presentationId");

    const parseMarkdown = async () => {
        const response = await fetch("http://localhost:3000/parse-md", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                markdown: testMarkdown
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
        console.log(result);
        setOutputFodp(result);
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

    const uploadSlides = async () => {
        try {
            const baseURL = import.meta.env.VITE_RESTAPI_LINK;
            const headers = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${import.meta.env.VITE_RESTAPI_ACCESS_TOKEN}`
            };

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

            // Upload new slides
            for (const slide of slidesFormat) {
                const response = await fetch(`${baseURL}/slide`, {
                    method: "POST",
                    headers,
                    body: JSON.stringify(slide)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error("API error:", errorText);
                    console.error("Slide sent:", slide);

                    throw new Error(
                        `Failed to upload slide ${slide.slide_id}: ${response.status}`
                    );
                }
            }

            setUploadMessage("Upload success: uploaded with presentation ID " + presentationId);

        } catch (error) {
            console.error(error);
            setUploadMessage("Upload failed");
        }
    };

    // UseEffects

    useEffect(() => {
        parseMarkdown();
    }, []);

    useEffect(() => {

        if (parsed) {
            generateIntermediate(parsed);
        }
    }, [parsed]);

    useEffect(() => {

        if (intermediate) {
            generateFodp(intermediate);
        }
    }, [intermediate]);

    useEffect(() => {

        if (intermediate) {
            generateSlidesFormat(intermediate);
        }
    }, [intermediate]);

    return (
        <div className="mb-4">
            <h1>PresentLive editor Slide Editor</h1>
            <Link to="/">
                Back to Home
            </Link>
            <h4>Slide Preview</h4>
            {/* <SlidePreviewer
                slide={slidesFormat && slidesFormat.length > 0 ? slidesFormat[0] : null}
                presentationId={presentationId}
            /> */}


            <div className="row">
                {/* Slide preview */}
                <div className="border rounded bg-light p-4">
                    <div
                        className="border bg-white shadow-sm mx-auto"
                        style={{
                            aspectRatio: "16 / 9",
                            maxWidth: "900px",
                            padding: "40px"
                        }}
                    >
                        <SlidePreviewer
                            slide={slidesFormat?.[selectedSlide] ?? null}
                            presentationId={presentationId}
                        />
                    </div>
                </div>
            </div>
            {/* Slide selector */}
            <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
                <button
                    className="btn btn-outline-secondary"
                    disabled={selectedSlide === 0}
                    onClick={() => setSelectedSlide(prev => prev - 1)}
                >
                    Previous
                </button>

                <input
                    className="form-control text-center"
                    type="number"
                    min="1"
                    max={slidesFormat?.length || 1}
                    value={selectedSlide + 1}
                    onChange={(e) => {
                        const slideNumber = Number(e.target.value);

                        if (
                            slideNumber >= 1 &&
                            slideNumber <= slidesFormat.length
                        ) {
                            setSelectedSlide(slideNumber - 1);
                        }
                    }}
                    style={{ width: "80px" }}
                />

                <span> / {slidesFormat?.length || 0}</span>

                <button
                    className="btn btn-outline-secondary"
                    disabled={
                        selectedSlide === (slidesFormat?.length || 1) - 1
                    }
                    onClick={() => setSelectedSlide(prev => prev + 1)}
                >
                    Next
                </button>
            </div>


            <div className="px-4">
                <p className="lead">Original Markdown</p>
                <textarea
                    className="form-control"
                    value={testMarkdown}
                    readOnly
                    style={{ height: "400px" }}
                />

            </div>
            {/* <div className="px-4">
                <p className="lead">Parsed MD</p>
                <textarea
                    className="form-control"
                    value={parsed ? JSON.stringify(parsed, null, 2) : ""}
                    readOnly
                    style={{ height: "400px" }}
                />

            </div>

            <div className="px-4">
                <p className="lead">Intermediate form</p>
                <textarea
                    className="form-control"
                    value={intermediate ? JSON.stringify(intermediate, null, 2) : ""}
                    readOnly
                    style={{ height: "400px" }}
                />

            </div> */}

            <div className="px-4">
                <p className="lead">Slides format</p>
                <textarea
                    className="form-control"
                    value={slidesFormat ? JSON.stringify(slidesFormat, null, 2) : ""}
                    readOnly
                    style={{ height: "400px" }}
                />

            </div>

            {/* <div className="px-4">
                <p className="lead">FODP format</p>
                <textarea
                    className="form-control"
                    value={outputFodp || ""}
                    readOnly
                    style={{ height: "400px" }}
                />

            </div> */}

            <p className="lead">Upload Slides to API</p>
            <button
                onClick={
                    () => {
                        console.log("slidesFormat:", slidesFormat);
                        uploadSlides();
                    }
                }
                disabled={!slidesFormat || slidesFormat.length === 0}
            >
                {/* Later, use PUT instead of POST if the slide is already present, or just fail it */}
                Upload Slides
            </button>

            {/* Handle the upload message popup. */}
            {uploadMessage && (
                <MessagePopup
                    message={uploadMessage}
                    onClose={() => setUploadMessage(null)}
                />
            )}

        </div >
    );
}