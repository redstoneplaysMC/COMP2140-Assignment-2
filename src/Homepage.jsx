import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CreatePresentationPopup from "./createPopups";

const RESTAPI_LINK = import.meta.env.VITE_RESTAPI_LINK;
const RESTAPI_ACCESS_TOKEN = import.meta.env.VITE_RESTAPI_ACCESS_TOKEN;

export default function Homepage() {

    const [query, setQuery] = useState("");
    const [presentations, setPresentations] = useState([]);
    const [showPopup, setShowPopup] = useState(false);
    const [newPresentation, setNewPresentation] = useState({
        title: "",
        description: "",
        presenter_name: "",
        published_status: false
    });
    const navigate = useNavigate();

    function getNextPresentationId() {
        // Function to get the next presentation ID.
        const usedIds = new Set(
            presentations.map(presentation => presentation.presentation_id)
        );
        let id = 1;
        while (usedIds.has(id)) { id++; }
        return id;
    }

    async function getPresentations() { // Due to being an async function, you cannot put this inside return
        // This is essentially a promise: run await to get the result: but that only works inside another async.
        const response = await fetch(
            `${RESTAPI_LINK}/presentation`,
            {
                headers: {
                    Authorization: `Bearer ${RESTAPI_ACCESS_TOKEN}`
                },
            });
        const result = await response.json();
        if (!response.ok) {
            console.log(result);
            return;
        }
        setPresentations(result.data);
    }

    async function makePresentation(newPresentation) {
        const presentationID = getNextPresentationId();

        const response = await fetch(
            `${RESTAPI_LINK}/presentation`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${RESTAPI_ACCESS_TOKEN}`
                },
                body: JSON.stringify({
                    title: newPresentation.title,
                    description: newPresentation.description,
                    presenter_name: newPresentation.presenter_name,
                    published_status: newPresentation.published_status,
                    presentation_id: presentationID
                })
            }
        );

        if (!response.ok) {
            const result = await response.json();
            console.log(result);
            return;
        }

        await getPresentations();
    }

    async function deletePresentation(id) {
        const response = await fetch(
            `${RESTAPI_LINK}/presentation/${id}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${RESTAPI_ACCESS_TOKEN}`
                }
            }
        );

        if (!response.ok) {
            console.log("could not delete presentation.");
            return;
        }

        await getPresentations();
    }

    useEffect(() => { // useEffect uses the function at the specified location; calls at the initialization
        getPresentations();
    }, []);

    return (
        <section className="container text-center py-5">
            <div className="mb-4">
                <h1 className="display-4">Welcome to PresentLive!</h1>
                <hr />
                <p className="">
                    Edit <code>src/App.jsx</code> and save to test <code>HMR</code>
                </p>
                <input type='text'
                    value={query}
                    onChange={(e) => setQuery(e.target.value)} />
                <p>Searching for: {query || "nothing yet"}</p>
            </div>
            <div className="mb-4">
                <p className="lead">Slide Deck selector</p>
                <div
                    className="table-responsive"
                    style={{
                        maxHeight: "500px",
                        overflowY: "auto"
                    }}>
                    <table className="table table-striped table-hover">
                        <thead className="sticky-top">
                            <tr>
                                <th>Pid</th>
                                <th>Title</th>
                                <th>Description</th>
                                <th>Presenter</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {presentations.map(presentation => (
                                <tr key={presentation.id}>
                                    <td>{presentation.presentation_id}</td>
                                    <td>{presentation.title}</td>
                                    <td>{presentation.description}</td>
                                    <td>{presentation.presenter_name}</td>
                                    <td>{presentation.published_status ? "Published" : "Not Published"}</td>
                                    <td>
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() =>
                                                navigate(`/slide-viewer?presentationId=${presentation.presentation_id}`)
                                            }
                                        >
                                            View
                                        </button>
                                        <button className="btn btn-warning btn-sm ms-2"
                                            onClick={() =>
                                                navigate(`/slide-editor?presentationId=${presentation.presentation_id}`)
                                            }
                                        >
                                            Edit
                                        </button>
                                        <button className="btn btn-danger btn-sm ms-2"
                                            onClick={() => deletePresentation(presentation.id)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button
                        className="btn btn-primary btn-sm ms-2"
                        onClick={() => setShowPopup(true)}>
                        Create a new presentation
                    </button>
                    {showPopup && (
                        <CreatePresentationPopup
                            newPresentation={newPresentation}
                            setNewPresentation={setNewPresentation}
                            onClose={() => setShowPopup(false)}
                            onCreate={async (presentation) => { // Define the function as asynchronous because order matters here.
                                console.log("Presentation:", presentation);
                                await makePresentation(presentation);
                                setShowPopup(false);
                            }}
                        />
                    )}
                </div>
            </div>
        </section >
    );
}