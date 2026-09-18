import { useState } from "react";

// Component to render a normal slide (non-poll)
function NormalSlide({ slideBody }) {
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

// Component to render a poll slide. Poll slides cannot have formatting (not implemented)
function PollSlide({ slideBody, selectedOption, setSelectedOption, validAttendee }) {
    // Render poll slide
    return (
        <div>
            <h2>{slideBody.name}</h2>
            <hr />
            <p>{slideBody.pollQuestion}</p>
            <div className="mb-2 mt-4">
                <i className="text-muted">Please select an option.</i>
            </div>
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

// Slide previewer function, decides whether to render a normal slide or a poll slide based on the slide data.
// Also describes the logic for validating the attendee and handling slide rendering.
export default function SlidePreviewer({ slide, presentationId, attendeeId }) {
    const [selectedOption, setSelectedOption] = useState(null)
    const validAttendee =
        attendeeId !== null &&
        attendeeId !== undefined &&
        attendeeId !== "" &&
        Number.isInteger(Number(attendeeId)) &&
        Number(attendeeId) > 0;
    let slideBody;

    if (!slide) {
        return <p>No slide selected.</p>;
    }

    if (Number(slide.presentation_id) !== Number(presentationId)) {
        return <p>Slide does not belong to this presentation.</p>;
    }

    try {
        slideBody = JSON.parse(slide.body);
    } catch (error) {
        console.error("Could not parse slide body:", error);
        return <p>Invalid slide data.</p>;
    }

    console.log("Slide body:", slideBody);
    if (slide.is_poll) {
        return <PollSlide slideBody={slideBody}
            selectedOption={selectedOption}
            setSelectedOption={setSelectedOption}
            validAttendee={validAttendee} />;
    }

    return <NormalSlide slideBody={slideBody} />;
}



