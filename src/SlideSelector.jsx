{/* Slide selector */ }
export default function SlideSelector({ slidesFormat, selectedSlide, setSelectedSlide }) {
    const slideCount = slidesFormat?.length || 0;
    return (
        <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
            <button
                className="btn btn-outline-secondary"
                disabled={selectedSlide === 0}
                onClick={() => setSelectedSlide(prev => prev - 1)}
            >
                Previous
            </button>

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