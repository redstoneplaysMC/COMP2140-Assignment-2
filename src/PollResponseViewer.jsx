// Poll response handler. The component responsible for managing and displaying poll responses for a given presentation.
// Generates a link for attendees to view the slides. The attendees will post to the poll response endpoint, which will be viewed here.

// Add function to create the link.

import { useState, useEffect } from "react";
// Get presentation ID from URL search parameters
import { useSearchParams } from "react-router-dom";

const baseURL = import.meta.env.VITE_RESTAPI_LINK;
const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${import.meta.env.VITE_RESTAPI_ACCESS_TOKEN}`
};

export default function PollResponseHandler({ presentation }) {
    const [searchParams] = useSearchParams();
    const presentationId = searchParams.get("presentationId");
    const [pollResponses, setPollResponses] = useState([]);
    const [uploadMessage, setUploadMessage] = useState(null);
    const [loading, setLoading] = useState(false);

    // add a function to make a link for attendees to view the slides
    const generateAttendeeLink = () => {
        return `${window.location.origin}/attendee-landing-page?presentationId=${presentationId}`;
    };

    const fetchPollResponses = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${baseURL}/poll_response`, {
                headers
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch poll responses: ${response.status}`);
            }
            const data = await response.json();
            console.log("Fetched poll responses:", data.data);
            setPollResponses(data.data);
        } catch (error) {
            console.error("Failed to load poll responses:", error);
            setUploadMessage("Failed to load poll responses.");
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        if (presentationId) {
            fetchPollResponses();
        }
    }, [presentationId]);

    return (
        <div>
            {/* <h1>Poll Response Handler</h1> */}
            <br />
            <p>This component will manage and display poll responses for presentation {presentationId}.</p>
            <div>
                {presentation?.published_status ? (
                    <p>The presentation is published.</p>
                ) : (
                    <p>The presentation is not published.</p>
                )}
            </div>

            {/* Attendee link for the presentation. Inside of an alert, and only appear if the presentation is published. */}
            {presentation?.published_status && (
                <div className="alert alert-secondary mt-3 mb-3">
                    Attendee link: <a href={generateAttendeeLink()} target="_blank" rel="noopener noreferrer">{generateAttendeeLink()}</a>
                </div>
            )}
            {/* Attendee link: <a href={generateAttendeeLink()} target="_blank" rel="noopener noreferrer">{generateAttendeeLink()}</a> */}
            {loading && <p>Loading poll responses...</p>}
            {uploadMessage && <p>{uploadMessage}</p>}
            <ul>
                {pollResponses.map((response) => (
                    <li key={response.poll_response_id}>
                        Poll ID: {response.poll_id}, Attendee ID: {response.attendee_id}, Response: {response.response}
                    </li>
                ))}
            </ul>
        </div >
    );
}