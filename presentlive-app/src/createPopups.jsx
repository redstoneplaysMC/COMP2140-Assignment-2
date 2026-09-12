console.log("CREATE POPUPS LOADED");

function CreatePresentationPopup({
    newPresentation,
    setNewPresentation,
    onClose,
    onCreate }) {
    return (
        <div className="popup">
            <div className="row">
                <div className="col-md-3">
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
                    /></div>
                <div className="col-md-3">

                    <label className="form-label">Description</label>
                    <input
                        className="form-control"
                        type="text"
                        value={newPresentation.description}
                        onChange={(e) =>
                            setNewPresentation(prev => ({
                                ...prev,
                                description: e.target.value
                            }))
                        }
                    /> </div>
                <div className="col-md-3">
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
                <div className="col-md-3 mt-3">
                    <div className="d-flex flex-column gap-2">
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
        </div >
    );
}

export default CreatePresentationPopup;