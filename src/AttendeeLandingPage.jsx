import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import MessagePopup from "./MessagePopup"

// Allow the attendee to choose a display name, and create a unique attendeeID for this presentation.

// Base URL for the REST API and headers for authentication
const baseURL = import.meta.env.VITE_RESTAPI_LINK;
const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${import.meta.env.VITE_RESTAPI_ACCESS_TOKEN}`
};


// Local server URL for parsing markdown
// if the server doesnt exist then the parsing functionality will not work.
export default function AttendeeLandingPage() {
    // Define state variables and other constants
    const [uploadMessage, setUploadMessage] = useState(null);
    const [searchParams] = useSearchParams();
    const presentationId = searchParams.get("presentationId");
    const [presentation, setPresentation] = useState(null);
    const [attendeeName, setAttendeeName] = useState("");
    const navigate = useNavigate();

    // Function to fetch attendee IDs from the REST API. This will be used to manage attendees for the presentation.
    const fetchAttendeeIds = async () => {
        try {
            const response = await fetch(`${baseURL}/attendee`, {
                headers
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch attendee IDs: ${response.status}`);
            }
            const data = await response.json();
            console.log("Fetched attendee IDs:", data.data);
            return data.data;
        } catch (error) {
            console.error("Failed to load attendee IDs:", error);
            setUploadMessage("Failed to load attendee IDs.");
            return [];
        }
    };

    // Function to trigger markdown conversion
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
        return {
            presentation: foundPresentation,
        };
    };

    // Effect to load slides whenever the presentation ID changes
    useEffect(() => {
        const initialise = async () => {
            fetchPresentation();
            await fetchAttendeeIds();
        };

        initialise();
    }, [presentationId]);

    return (
        <div className="mb-4">
            <h1>PresentLive Attendee Landing Page</h1>
            <hr />
            <p> Attending presentation: {" "}
                <span className="text-primary">
                    {presentation?.title ?? "Loading..."}
                </span>
            </p>
            {/* Input field for attendee name and join button */}
            <div className="mt-3">
                <input type="text"
                    placeholder="Enter your name"
                    className="w-25" value={attendeeName}
                    onChange={(e) => setAttendeeName(e.target.value)} />
            </div>

            <button
                className="btn btn-primary mt-3"
                onClick={async () => {
                    console.log(`Joining presentation as ${attendeeName}`);
                    try {
                        if (!attendeeName) {
                            throw new Error("Attendee name is required");
                        }
                        const attendees = await fetchAttendeeIds();
                        console.log("Created attendee:", attendees);
                        // map attendee ids to find the lowest vacant attendee id
                        const attendeeIds = attendees.map(att => att.attendee_id);
                        let lowestVacantAttendeeId = 1;
                        while (attendeeIds.includes(lowestVacantAttendeeId)) {
                            lowestVacantAttendeeId++;
                        }
                        console.log("Lowest vacant attendee ID:", lowestVacantAttendeeId);

                        const response = await fetch(`${baseURL}/attendee`, {
                            method: "POST",
                            headers,
                            body: JSON.stringify({
                                display_name: attendeeName,
                                finished_viewing: false,
                                presentation_id: Number(presentationId),
                                attendee_id: lowestVacantAttendeeId // This will be set by the server

                            })
                        });

                        if (!response.ok) {
                            throw new Error(
                                `Failed to create attendee: ${response.status}`
                            );
                        }

                        const data = await response.json();
                        console.log("Created attendee:", data);
                        navigate(
                            `/attendee-viewer/${presentationId}?attendeeId=${encodeURIComponent(data.attendee_id)}`
                        );

                    } catch (error) {
                        console.error("Failed to join presentation:", error);
                        setUploadMessage(`Failed to join presentation: ${error.message}.`);
                    }
                }}
            >
                Join Presentation
            </button>

            {/* Handle the upload message popup. */}
            {
                uploadMessage && (
                    <MessagePopup
                        message={uploadMessage}
                        onClose={() => setUploadMessage(null)}
                    />
                )
            }
        </div >
    );
}