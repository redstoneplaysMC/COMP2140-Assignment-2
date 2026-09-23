import { useState } from "react";

export default function createAISlide({
    onClose,
    onCreate
}) {
    const [topic, setTopic] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleCreate() {
        if (!topic.trim()) {
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await fetch(
                "http://localhost:3000/api/generate-presentation",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        topic: topic.trim(),
                    }),
                }
            );

            if (!response.ok) {
                throw new Error("Failed to generate presentation");
            }

            const data = await response.json();

            onCreate(data.markdown);
        } catch (err) {
            console.error(err);
            setError("Failed to generate AI content.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="popup">
            <h5 className="popup-header">Create AI Slide</h5>

            <div className="row">
                <div className="col-12 mt-3">
                    <label className="form-label">
                        What should the slide be about?
                    </label>

                    <textarea
                        className="form-control"
                        rows="5"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g. Explain the benefits of renewable energy"
                    />
                </div>
            </div>

            {error && (
                <div className="alert alert-danger mt-3">
                    {error}
                </div>
            )}

            <div className="row">
                <div className="col-12 mt-3">
                    <div className="d-flex gap-2 justify-content-center">
                        <button
                            onClick={handleCreate}
                            disabled={!topic.trim() || loading}
                        >
                            {loading ? "Generating..." : "Generate"}
                        </button>

                        <button
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
