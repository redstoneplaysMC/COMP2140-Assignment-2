import { useState } from "react";

export default function SlidePreviewer({ slide,
    presentationId,
    attendeeId }) {
    const [selectedOption, setSelectedOption] = useState(null)
    const validAttendee =
        attendeeId !== null &&
        attendeeId !== undefined &&
        attendeeId !== "" &&
        Number.isInteger(Number(attendeeId)) &&
        Number(attendeeId) > 0;

    if (!slide) {
        return <p>No slide selected.</p>;
    }

    if (Number(slide.presentation_id) !== Number(presentationId)) {
        return <p>Slide does not belong to this presentation.</p>;
    }

    let slideBody;

    try {
        slideBody = JSON.parse(slide.body);
    } catch (error) {
        console.error("Could not parse slide body:", error);
        return <p>Invalid slide data.</p>;
    }

    console.log("Slide body:", slideBody);

    // Render poll slide
    if (slide.is_poll) {
        return (
            <div>
                <h2>{slideBody.name}</h2>
                <hr />
                <p>{slideBody.pollQuestion}</p>
                <p className="mt-4">Please select an option.</p>
                <div className="mt-2">
                    {slideBody.pollOptions?.map((option, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => setSelectedOption(option)}
                            className={`btn ${selectedOption === option
                                ? "btn-primary"
                                : "btn-outline-primary"
                                } me-2 mb-2`}
                        >
                            {option}
                        </button>
                    ))}
                </div>
                <div className="mt-4">
                    <button
                        type="button"
                        className="btn btn-success btn-sm"
                        disabled={!validAttendee || selectedOption === null}
                    >
                        Submit
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            {slideBody.blocks?.map((block, index) => (
                <div key={index}>
                    {block.kind === "heading" && (
                        <h2>
                            {block.runs?.map(run => run.value).join("")}
                        </h2>
                    )}

                    {block.kind === "paragraph" && (
                        <p>
                            {block.runs?.map(run => run.value).join("")}
                        </p>
                    )}

                    {block.kind === "quote" && (
                        <blockquote>
                            {block.runs?.map(run => run.value).join("")}
                        </blockquote>
                    )}

                    {block.kind === "note" && (
                        <p>
                            {block.text}
                        </p>
                    )}
                </div>
            ))}
        </div>
    );
}


