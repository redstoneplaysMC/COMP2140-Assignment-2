// import { useState } from "react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
// import { SlidePreviewer } from "./SlidePreviewer";

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
            <p className="lead">Original Markdown</p>
            <div className="px-4">
                <textarea
                    className="form-control"
                    value={testMarkdown}
                    readOnly
                    style={{ height: "400px" }}
                />

            </div>
            <p className="lead">Parsed MD</p>
            <div className="px-4">
                <textarea
                    className="form-control"
                    value={parsed ? JSON.stringify(parsed, null, 2) : ""}
                    readOnly
                    style={{ height: "400px" }}
                />

            </div>

            <p className="lead">Intermediate form</p>
            <div className="px-4">
                <textarea
                    className="form-control"
                    value={intermediate ? JSON.stringify(intermediate, null, 2) : ""}
                    readOnly
                    style={{ height: "400px" }}
                />

            </div>

            <p className="lead">Slides format</p>
            <div className="px-4">
                <textarea
                    className="form-control"
                    value={slidesFormat ? JSON.stringify(slidesFormat, null, 2) : ""}
                    readOnly
                    style={{ height: "400px" }}
                />

            </div>

            <p className="lead">FODP format</p>
            <div className="px-4">
                <textarea
                    className="form-control"
                    value={outputFodp || ""}
                    readOnly
                    style={{ height: "400px" }}
                />

            </div>

        </div>
    );
}