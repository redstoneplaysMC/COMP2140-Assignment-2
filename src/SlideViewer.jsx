// import { useState } from "react";
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SlidePreviewer from "./SlidePreviewer";
import SlideSelector from "./SlideSelector";
import MessagePopup from "./MessagePopup"
import PollResponseViewer from "./PollResponseViewer";

// This is the component responsible for viewing slides of a presentation. It contains
// the slide previewer, slide selector, and handles fetching and displaying poll responses:
// It acts as a display for PollResponseViewer.

// TODO:
// If published, inside of view you can get the link to open as an attendee.
// Also track poll responses here; the responses should be fetched from poll-responses.
// Attendees and stuff will be handled inside AttendeeViewer.jsx, which will be routed separately.
// Will need a button to generate a link.


// Base URL for the REST API and headers for authentication
const baseURL = import.meta.env.VITE_RESTAPI_LINK;
const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${import.meta.env.VITE_RESTAPI_ACCESS_TOKEN}`
};
// Local server URL for parsing markdown
// if the server doesnt exist then the parsing functionality will not work.
export default function SlideEditor() {
    // Define state variables and other constants
    const [uploadMessage, setUploadMessage] = useState(null);
    const [slidesFormat, setSlidesFormat] = useState(null);
    const [selectedSlide, setSelectedSlide] = useState(0);
    const [searchParams] = useSearchParams();
    const presentationId = searchParams.get("presentationId");
    const containerRef = useRef(null);
    const [presentation, setPresentation] = useState(null);

    const [availableWidth, setAvailableWidth] = useState(900);
    const scale = availableWidth / 900;

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
            <div>{presentation?.published_status
                ? <p>Viewing slides and poll responses for presentation: {" "}
                    <span className="text-primary">
                        {presentation?.title ?? "Loading..."}
                    </span>
                </p>
                : <p>Viewing unpublished slides for presentation: {" "}
                    <span className="text-primary">
                        {presentation?.title ?? "Loading..."}
                    </span>
                </p>

            }
            </div>

            <Link to="/">
                Back to Home
            </Link>
            <hr />
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
                        <SlideSelector
                            selectedSlide={selectedSlide}
                            setSelectedSlide={setSelectedSlide}
                            slidesFormat={slidesFormat}
                        />
                    </div>
                </div>
            </div>
            <div className="mt-4">
                {/* if presentation exists: */}
                {presentation && (
                    <>
                        {console.log("the current presentation:", presentation)}
                        <PollResponseViewer presentation={presentation} />
                    </>
                )}
            </div>
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