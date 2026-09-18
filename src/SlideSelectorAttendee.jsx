// Component for selecting slides within the slide viewer for attendees, with previous/next buttons and direct slide number input.

// All polls are optional; ignoring the poll will count as no response.
// After the final slide, there needs to be some indication that the presentation has ended.
export default function SlideSelectorAttendee({ slidesFormat, selectedSlide, setSelectedSlide }) {
    const slideCount = slidesFormat?.length || 0;
    return (
        // Slide selector component for attendees.
        // Only allow the attendee to go forward; when reaching the end of the presentation, 
        // the "Next" button will be replaced by an 'end presentation' button, closing the slide, and signaling the end of the presentation.
        // The attendee's finished_viewing state will be updated once they reach the end of the presentation, and they will no longer be able to
        // access the presentation with that attendee ID.
        <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
            <input
                className="form-control text-center"
                type="number"
                min="1"
                max={slideCount || 1}
                value={selectedSlide + 1}
                onChange={(e) => {
                    const slideNumber = Number(e.target.value);
                    if (
                        slideNumber >= 1 &&
                        slideNumber <= slideCount
                    ) {
                        setSelectedSlide(slideNumber - 1);
                    }
                }}
                style={{ width: "80px" }}
            />

            <span> / {slideCount || 0}</span>

            <button
                className="btn btn-outline-secondary"
                disabled={
                    selectedSlide === (slideCount || 1) - 1
                }
                onClick={() => setSelectedSlide(prev => prev + 1)}
            >
                Next
            </button>
        </div>

    );
}