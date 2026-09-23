// Component for selecting slides within the slide viewer for attendees, with previous/next buttons and direct slide number input.

// All this component does is manage slide selection for attendees; it does not actaully show the slides

// All polls are optional; ignoring the poll will count as no response.
// After the final slide, there needs to be some indication that the presentation has ended.
export default function SlideSelectorAttendee({ slidesFormat, selectedSlide, setSelectedSlide, onFinish }) {
    const slideCount = slidesFormat?.length || 0;
    const isLastSlide = selectedSlide === (slideCount || 1) - 1;
    return (
        // Slide selector component for attendees.
        // Only allow the attendee to go forward; when reaching the end of the presentation, 
        // the "Next" button will be replaced by an 'end presentation' button, closing the slide, and signaling the end of the presentation.
        // The attendee's finished_viewing state will be updated once they reach the end of the presentation, and they will no longer be able to
        // access the presentation with that attendee ID.
        <div className="d-flex flex-column align-items-center justify-content-center gap-2 mb-3">
            <div className="d-flex align-items-center gap-1">

                <input
                    className="form-control text-center"
                    type="text"
                    value={selectedSlide + 1}
                    readOnly
                    style={{ width: "80px" }}
                />
                <span> / {slideCount || 0}</span>
            </div>
            {/* Next slide button */}
            <div>
                <button
                    className="btn btn-outline-primary"
                    onClick={() => {
                        if (!isLastSlide)
                            setSelectedSlide(prev => prev + 1);
                        else {
                            // End of presentation logic here
                            // After viewing, set finished_viewing state for the attendee to true.
                            onFinish();
                        }
                    }}
                >
                    {!isLastSlide ? "Next Slide" : "Finish Presentation"}
                </button>
            </div>
        </div>

    );
}