import { useState, useEffect } from "react";

const baseURL = import.meta.env.VITE_RESTAPI_LINK;
const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${import.meta.env.VITE_RESTAPI_ACCESS_TOKEN}`
};

// Component to render a normal slide (non-poll)
function NormalSlide({ slideBody }) {

    function renderRuns(runs) {
        return runs?.map((run, index) => {
            if (run.type === "strong") {
                return (
                    <strong key={index}>
                        {renderRuns(run.runs)}
                    </strong>
                );
            }

            return (
                <span key={index}>
                    {run.value}
                </span>
            );
        });
    }

    function renderListItems(items, ordered) {
        const List = ordered ? "ol" : "ul";

        return (
            <List>
                {items?.map((item, index) => (
                    <li key={index}>
                        {renderRuns(item.runs)}

                        {item.items?.length > 0 &&
                            renderListItems(item.items, item.ordered)
                        }
                    </li>
                ))}
            </List>
        );
    }

    function renderBlock(block, index) {
        switch (block.kind) {

            case "heading": {
                const level = Math.min(Math.max(block.level || 1, 1), 6);
                const Heading = `h${level}`;

                return (
                    <Heading key={index}>
                        {renderRuns(block.runs)}
                    </Heading>
                );
            }

            case "paragraph":
                return (
                    <p key={index}>
                        {renderRuns(block.runs)}
                    </p>
                );

            case "quote":
                return (
                    <blockquote key={index}>
                        {renderRuns(block.runs)}
                    </blockquote>
                );

            case "list":
                return (
                    <div key={index}>
                        {renderListItems(block.items, block.ordered)}
                    </div>
                );

            case "note":
                return (
                    <p key={index}>
                        {block.text}
                    </p>
                );

            default:
                return null;
        }
    }

    return (
        <div>
            {slideBody.blocks?.map(renderBlock)}
        </div>
    );
}


// Component to render a poll slide. Poll slides cannot have formatting (not implemented)
function PollSlide({
    slide,
    slideBody,
    selectedOption,
    setSelectedOption,
    attendeeId,
    presentationId,
    validAttendee
}) {
    const [submitted, setSubmitted] = useState(false);
    const slideId = slide?.slide_id;
    useEffect(() => {
        // Check if the attendee has already submitted a response for this poll slide,
        // for this presentation and this slide.
        const checkExistingResponse = async () => {
            try {
                const response = await fetch(`${baseURL}/poll_response`, {
                    method: "GET",
                    headers
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch poll response");
                }

                const data = await response.json();

                const existingResponse = data.data.find(
                    response =>
                        response.attendee_id === Number(attendeeId) &&
                        response.slide_id === slideId &&
                        response.presentation_id === Number(presentationId)
                );
                setSubmitted(!!existingResponse);

            } catch (error) {
                console.error("Failed to check existing poll response:", error);
            }
        };

        if (validAttendee && slide?.is_poll) {
            checkExistingResponse();
        }
    }, [attendeeId, slideId, presentationId, validAttendee]);
    // UseEffect for checking existing poll response, 
    // upon mounting and when attendeeId, slide ID, or validAttendee changes.


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
                    // Disable the submit button if the attendee is not valid, no option is selected, or the response has already been submitted.
                    disabled={!validAttendee || selectedOption === null || submitted}
                    onClick={async () => {
                        console.log("Submitting poll response:", selectedOption);
                        try {
                            console.log("POST URL:", `${baseURL}/poll_response`);
                            const response = await fetch(`${baseURL}/poll_response`, {
                                method: "POST",
                                headers,
                                body: JSON.stringify({
                                    presentation_id: Number(presentationId),
                                    attendee_id: Number(attendeeId),
                                    slide_id: Number(slide.slide_id),
                                    option: selectedOption
                                })
                            }
                            );

                            if (!response.ok) {
                                throw new Error(`Failed to submit poll response: ${response.status}`);
                            }
                            setSubmitted(true);
                            // Here you would typically make an API call to submit the response
                        } catch (error) {
                            console.error("Failed to submit poll response:", error);
                        }
                    }
                    }
                >
                    Submit
                </button>
                {/* {submitted
                    ? <p>Response Submitted for slide {slide.slide_id}.</p>
                    : null
                } */}
            </div>
        </div >
    );
}

// Slide upon completing the presentation in attendee mode.
function CompletedSlide() {
    return (
        <div className="text-center">
            <h2>Presentation Complete</h2>
            <hr />
            <p>Your responses have been submitted successfully.</p>
            <p className="text-primary">
                You may now close this tab.
            </p>
        </div>
    );
}

// Slide previewer function, decides whether to render a normal slide or a poll slide based on the slide data.
// Also describes the logic for validating the attendee and handling slide rendering.
export default function SlidePreviewer({ slide, presentationId, attendeeId, completed }) {
    const [selectedOption, setSelectedOption] = useState(null)
    const validAttendee =
        attendeeId !== null &&
        attendeeId !== undefined &&
        attendeeId !== "" &&
        Number.isInteger(Number(attendeeId)) &&
        Number(attendeeId) > 0;
    let slideBody;
    // console.log("validAttendee, attendeeId ?", validAttendee, attendeeId)
    if (completed) {
        return <CompletedSlide />;
    }

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

    if (slide.is_poll) {
        return (
            <PollSlide
                slide={slide}
                slideBody={slideBody}
                selectedOption={selectedOption}
                setSelectedOption={setSelectedOption}
                attendeeId={attendeeId}
                presentationId={presentationId}
                validAttendee={validAttendee}
            />
        );
    }
    return <NormalSlide slideBody={slideBody} />;
}



