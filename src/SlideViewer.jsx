import { useState } from "react";
import { Link } from "react-router-dom";

export default function SlideViewer({ rows = 3, cols = 4 }) {
    const [booking, setBooking] = useState({
        customer: { name: "" },
        selected: [],
    });

    const toggleSeat = (r, c) => {
        const id = `${r}-${c}`;
        setBooking(prev => ({
            ...prev,
            selected: prev.selected.includes(id)
                ? prev.selected.filter(x => x !== id)
                : [...prev.selected, id],
        }));
    };

    const handleName = (e) => {
        booking.customer.name = e.target.value;
        setBooking(booking);
    };

    return (
        <div>
            <input value={booking.customer.name} onChange={handleName} />
            <div style={{
                display: "grid",
                gridTemplateColumns: `repeat(${cols}, 32px)`,
            }}>
                {Array.from({ length: rows }).map((_, r) =>
                    Array.from({ length: cols }).map((_, c) => (
                        <div
                            key={`${r}-${c}`}
                            onClick={() => toggleSeat(r, c)}
                            style={{
                                width: 32, height: 32, border: "1px solid #999",
                                background: booking.selected.includes(`${r}-${c}`) ? "#2a7" : "#fff",
                            }}
                        />
                    ))
                )}
            </div>
            <p>Seats selected: {booking.selected.length}</p>

            <Link to="/">
                Back to Home
            </Link>
        </div>
    );
}