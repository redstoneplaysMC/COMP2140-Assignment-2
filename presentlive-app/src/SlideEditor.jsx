// import { useState } from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
// import { convertToFodp } from "./deckConverter";

export default function SlideEditor() {
    const [parsed, setParsed] = useState(null);

    useEffect(() => {
        const parseMarkdown = async () => {
            const response = await fetch("http://localhost:3000/parse-md", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    markdown: ""
                })
            });

            const result = await response.json();

            console.log(result);

            setParsed(result);
        };
        parseMarkdown();
    }, []);

    return (
        <div>
            <p>Slide Editor</p>

            <pre>
                {parsed && JSON.stringify(parsed, null, 2)}
            </pre>

            <Link to="/">
                Back to Home
            </Link>
        </div>
    );
}