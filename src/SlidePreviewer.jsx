export default function SlidePreviewer({ slide, presentationId }) {
    if (!slide) {
        return <p>No slide selected.</p>;
    }

    if (Number(slide.presentation_id) !== Number(presentationId)) {
        return <p>Slide does not belong to this presentation.</p>;
    }

    let slideBody;

    try {
        slideBody = JSON.parse(slide.body);
    } catch (error) {
        console.error("Could not parse slide body:", error);
        return <p>Invalid slide data.</p>;
    }

    console.log("Slide body:", slideBody);

    return (
        <div>
            {slideBody.blocks?.map((block, index) => (
                <div key={index}>
                    {block.kind === "heading" && (
                        <h2>
                            {block.runs?.map(run => run.value).join("")}
                        </h2>
                    )}

                    {block.kind === "paragraph" && (
                        <p>
                            {block.runs?.map(run => run.value).join("")}
                        </p>
                    )}

                    {block.kind === "quote" && (
                        <blockquote>
                            {block.runs?.map(run => run.value).join("")}
                        </blockquote>
                    )}

                    {block.kind === "note" && (
                        <p>
                            {block.text}
                        </p>
                    )}
                </div>
            ))}
        </div>
    );
}