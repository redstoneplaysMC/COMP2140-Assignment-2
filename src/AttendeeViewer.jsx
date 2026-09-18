// import { useState } from "react";
import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import SlidePreviewer from "./SlidePreviewer";
import SlideSelectorAttendee from "./SlideSelectorAttendee";
import MessagePopup from "./MessagePopup"

// TODO:
// If published, inside of view you can get the link to open as an attendee.
// Also track poll responses here; the responses should be fetched from poll-responses.
// Attendees and stuff will be handled inside AttendeeViewer.jsx, which will be routed separately.
// Will need a button to generate a link.
// Requires an attendeeID, and the attendee is capable of viewing slides and submitting poll responses.
// The slide must be published first.

// Attendee will need to submit a displayName and an attendeeID before they can access the presentation. 
// It is assumed that an attendee can only view one presentation.

// Base URL for the REST API and headers for authentication
const baseURL = import.meta.env.VITE_RESTAPI_LINK;
const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${import.meta.env.VITE_RESTAPI_ACCESS_TOKEN}`
};

// Slide viewer. This should only be accessible with a valid attendee ID.
function SlideViewer({ slidesFormat, selectedSlide, setSelectedSlide, presentationId, scale }) {
    return (<>
        {/* <p className="small">Slide Viewer {`(Editor mode)`}</p> */}
        <div className="row">
            <div className="border rounded bg-light px-4 pt-4 pb-2">
                <div
                    className="border bg-white shadow-sm mx-auto"
                    style={{
                        aspectRatio: "16 / 9",
                        maxWidth: "900px",
                        padding: "20px",
                        transform: `scale(${scale})`,
                        transformOrigin: "top left"
                    }}
                >
                    <SlidePreviewer
                        slide={slidesFormat?.[selectedSlide] ?? null}
                        presentationId={presentationId}
                    />
                </div>
                <div className="py-3">
                    <SlideSelectorAttendee
                        selectedSlide={selectedSlide}
                        setSelectedSlide={setSelectedSlide}
                        slidesFormat={slidesFormat}
                    />
                </div>
            </div>
        </div>
    </>
    );
}


// Local server URL for parsing markdown
// if the server doesnt exist then the parsing functionality will not work.
export default function AttendeeViewer() {
    // Define state variables and other constants
    const [uploadMessage, setUploadMessage] = useState(null);
    const [slidesFormat, setSlidesFormat] = useState(null);
    const [selectedSlide, setSelectedSlide] = useState(0);
    const [searchParams] = useSearchParams();
    const containerRef = useRef(null);
    const [presentation, setPresentation] = useState(null);

    const [availableWidth, setAvailableWidth] = useState(900);
    const scale = availableWidth / 900;

    const { presentationId } = useParams();
    const attendeeId = searchParams.get("attendeeId");

    console.log(presentationId); // "4"
    console.log(attendeeId);     // "12"
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

        } catch (error) {
            console.error("Failed to load slides:", error);
            setUploadMessage("Failed to load slides for presentation ID " + presentationId);
        }
    };

    // Effect to load slides whenever the presentation ID changes
    useEffect(() => {
        const initialise = async () => {
            fetchPresentation();
            await fetchAttendeeIds();
            await loadSlides();
        };

        initialise();
    }, [presentationId]);

    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                setAvailableWidth(containerRef.current.clientWidth);
            }
        };

        updateWidth();

        const observer = new ResizeObserver(updateWidth);

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div className="mb-4">
            <h1>PresentLive Slide Viewer</h1>
            <hr />
            <p>Viewing slides and poll responses for presentation: {" "}
                <span className="text-primary">
                    {presentation?.title ?? "Loading..."}
                </span>
            </p>
            <Link to="/">
                Back to Home
            </Link>
            <hr />

            <SlideViewer
                slidesFormat={slidesFormat}
                selectedSlide={selectedSlide}
                setSelectedSlide={setSelectedSlide}
                presentationId={presentationId}
                scale={scale}
            />
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