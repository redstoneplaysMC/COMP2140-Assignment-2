export default function MessagePopup({ message, onClose }) {
    return (
        <div className="popup text-center py-3">
            <p>{message}</p>

            <button className="mt-3" onClick={onClose}>
                OK
            </button>
        </div>
    );
}