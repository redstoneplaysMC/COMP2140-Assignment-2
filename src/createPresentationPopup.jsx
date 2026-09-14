export default function CreatePresentationPopup({
    newPresentation,
    setNewPresentation,
    onClose,
    onCreate }) {
    return (
        <div className="popup">
            <h5 className="popup-header">Create Presentation</h5>

            {/* Title + Presenter */}
            <div className="row">
                <div className="col-md-6 mt-3">
                    <label className="form-label">Title</label>
                    <input
                        className="form-control"
                        type="text"
                        value={newPresentation.title}
                        onChange={(e) =>
                            setNewPresentation(prev => ({
                                ...prev,
                                title: e.target.value
                            }))
                        }
                    />
                </div>

                <div className="col-md-6 mt-3">
                    <label className="form-label">Presenter Name</label>
                    <input
                        className="form-control"
                        type="text"
                        value={newPresentation.presenter_name}
                        onChange={(e) =>
                            setNewPresentation(prev => ({
                                ...prev,
                                presenter_name: e.target.value
                            }))
                        }
                    />
                </div>
            </div>

            {/* Description */}
            <div className="row">
                <div className="col-12 mt-3">
                    <label className="form-label">Description</label>
                    <textarea
                        className="form-control"
                        rows="5"
                        value={newPresentation.description}
                        onChange={(e) =>
                            setNewPresentation(prev => ({
                                ...prev,
                                description: e.target.value
                            }))
                        }
                    />
                </div>
            </div>

            {/* Buttons */}
            <div className="row">
                <div className="col-12 mt-3">
                    <div className="d-flex gap-2 justify-content-center">
                        <button
                            onClick={() => {
                                console.log("Popup newPresentation:", newPresentation);
                                onCreate(newPresentation);
                            }}
                        >
                            Create
                        </button>

                        <button onClick={onClose}>
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}