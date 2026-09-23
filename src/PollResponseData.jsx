// Presentationid is required, as it will be used to fetch and display the poll responses.
// For a given presentation, the poll responses will be fetched and displayed.

// BARCHART for the summed responses.
// Table for each individual attendee, clicking on an attendee will show the following string:

// Alice
// Question: What do you think?
// Response: Yes
// Question: Which option do you prefer?
// Response: Option 2

// Get all 4 entities; attendees, pollResponse, presentation and slides.
// Presentation is given; get all attendees, pollResponse and slides with matching presentationId
// For each slide, if it is a poll Slide, get all responses related to that slide.
// If requested, (given an attendee), get all responses related to that attendee.


// This was basically vibecoded since it was a quick implementation to visualize poll responses without a full-fledged charting library.

import { useEffect, useState } from "react";

const baseURL = import.meta.env.VITE_RESTAPI_LINK;
const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${import.meta.env.VITE_RESTAPI_ACCESS_TOKEN}`
};

function PollResponseBarChart({ pollSlides, pollResponses }) {
    // State to keep track of the currently selected poll slide.
    const [selectedPollSlide, setSelectedPollSlide] = useState(0);
    // If there are no poll slides, display a message indicating that no poll responses are available.
    if (pollSlides.length === 0) {
        return <p>No poll responses available.</p>;
    }

    // Get the currently selected poll slide and its details.
    const slide = pollSlides[selectedPollSlide];
    const slideBody = JSON.parse(slide.body);
    const question = slideBody.pollQuestion;
    const options = slideBody.pollOptions || [];
    const responseCounts = options.map((option) => {
        const count = pollResponses.filter(
            response =>
                response.slide_id === slide.slide_id &&
                response.presentation_id === slide.presentation_id &&
                response.option === option
        ).length;

        return {
            option,
            count
        };
    });
    const maxCount = Math.max(
        ...responseCounts.map(response => response.count),
        1
    );

    return (
        <div className="w-75 mx-auto">
            {/* Dropdown to select the poll slide to view responses for. */}
            <p>Select a poll slide to view its responses:</p>
            <select
                className="form-control w-50 mx-auto mb-3"
                value={selectedPollSlide}
                onChange={(event) =>
                    setSelectedPollSlide(Number(event.target.value))
                }
            >
                {pollSlides.map((slide, index) => {
                    const slideBody = JSON.parse(slide.body);

                    return (
                        <option key={slide.slide_id} value={index}>
                            {slideBody.pollQuestion}
                        </option>
                    );
                })}
            </select>
            <hr />
            <div className="mb-4">
                {/* <p className="mb-3">{question}</p> */}
                {/* Render the response counts as a bar chart. */}
                {responseCounts.map((response) => (
                    <div
                        key={response.option}
                        className="d-flex align-items-center mb-3"
                    >
                        <span
                            style={{
                                width: "50%",
                                flexShrink: 0
                            }}
                        >
                            {response.option}
                        </span>

                        <div
                            className="progress flex-grow-1"
                            style={{
                                height: "20px",
                                maxWidth: "400px"
                            }}
                        >
                            <div
                                className="progress-bar"
                                role="progressbar"
                                style={{
                                    width: `${(response.count / maxCount) * 100}%`
                                }}
                            />
                        </div>

                        <span className="ml-2 mx-4">
                            {response.count}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function AttendeeResponseTable({ pollSlides, pollResponses, selectedAttendee }) {
    return (
        <table
            className="table table-bordered"
            style={{ tableLayout: "fixed" }}
        >
            <thead>
                <tr>
                    <th style={{ width: "60%" }}>Question</th>
                    <th style={{ width: "40%" }}>Response</th>
                </tr>
            </thead>

            <tbody>
                {pollSlides.map(slide => {
                    const slideBody = JSON.parse(slide.body);

                    const response = pollResponses.find(
                        pollResponse =>
                            pollResponse.attendee_id === selectedAttendee.attendee_id &&
                            pollResponse.slide_id === slide.slide_id &&
                            pollResponse.presentation_id === slide.presentation_id
                    );

                    return (
                        <tr key={slide.slide_id}>
                            <td>{slideBody.pollQuestion}</td>
                            <td>{response?.option ?? "No response"}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}

// Component for displaying a table of attendees and their poll responses.
function AttendeeResponses({ attendees, pollSlides, pollResponses }) {
    const [selectedAttendee, setSelectedAttendee] = useState(null);

    return (
        // Layout for attendee selector and selected attendee responses. 
        // Row is required for bootstrap to recognize the column structure correctly.
        <div className="row">
            {/* Attendee list */}
            <div className="col-md-4">
                <p className="lead" style={{ height: "28px" }}>
                    Attendee Selector
                </p>
                <hr />
                <div
                    style={{
                        height: "400px",
                        overflowY: "auto"
                    }}
                >
                    {attendees.map(attendee => (
                        <button
                            key={attendee.attendee_id}
                            className="btn btn-outline-primary w-100 mb-2"
                            onClick={() => setSelectedAttendee(attendee)}
                        >
                            {attendee.display_name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Selected attendee responses */}
            <div className="col-md-8">
                {selectedAttendee && (
                    <div>
                        <p className="lead" style={{ height: "28px" }}>
                            {selectedAttendee.display_name}
                        </p>
                        <hr />

                        <AttendeeResponseTable
                            pollSlides={pollSlides}
                            pollResponses={pollResponses}
                            selectedAttendee={selectedAttendee}
                        />
                    </div>
                )}

            </div>
        </div>
    );
}

// Main component for fetching and displaying poll response data for a given presentation.
export default function PollResponseData({ presentationId }) {
    const [attendees, setAttendees] = useState([]);
    const [pollResponses, setPollResponses] = useState([]);
    const [slides, setSlides] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [
                    attendeesResponse,
                    pollResponsesResponse,
                    slidesResponse
                ] = await Promise.all([
                    fetch(`${baseURL}/attendee`, {
                        method: "GET",
                        headers
                    }),
                    fetch(`${baseURL}/poll_response`, {
                        method: "GET",
                        headers
                    }),
                    fetch(`${baseURL}/slide`, {
                        method: "GET",
                        headers
                    })
                ]);

                if (
                    !attendeesResponse.ok ||
                    !pollResponsesResponse.ok ||
                    !slidesResponse.ok
                ) {
                    throw new Error("Failed to fetch poll response data");
                }

                const attendeesData = await attendeesResponse.json();
                const pollResponsesData =
                    await pollResponsesResponse.json();
                const slidesData = await slidesResponse.json();

                setAttendees(
                    attendeesData.data.filter(
                        attendee =>
                            attendee.presentation_id ===
                            Number(presentationId)
                    )
                );

                setPollResponses(
                    pollResponsesData.data.filter(
                        pollResponse =>
                            pollResponse.presentation_id ===
                            Number(presentationId)
                    )
                );

                setSlides(
                    slidesData.data.filter(
                        slide =>
                            slide.presentation_id ===
                            Number(presentationId)
                    )
                );

            } catch (error) {
                console.error(
                    "Failed to fetch poll response data:",
                    error
                );
            }
        };

        fetchData();
    }, [presentationId]);

    const pollSlides = slides.filter(slide => slide.is_poll);

    return (
        < div >
            {/* Render the poll response bar chart */}
            < PollResponseBarChart
                pollSlides={pollSlides}
                pollResponses={pollResponses}
            />
            <hr />

            {/* Render the attendee table */}
            <AttendeeResponses
                attendees={attendees}
                pollSlides={pollSlides}
                pollResponses={pollResponses}
            />
        </div >
    );
}