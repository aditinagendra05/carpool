import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./History.css";

const BASE_URL = "http://localhost:5001/api/history";

const getHeaders = () => {
  const token = localStorage.getItem("cp_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function History() {
  const navigate = useNavigate();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(BASE_URL, { headers: getHeaders() });
        setRides(res.data);
      } catch (err) {
        setError("Failed to load ride history.");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="history-container">
      <header className="history-header">
        <button className="btn-back" onClick={() => navigate("/dashboard")}>
          ← Back
        </button>
        <h1 className="history-title">🕘 Ride History</h1>
      </header>

      <main className="history-main">
        {loading && <div className="history-loading">Loading...</div>}
        {error && <div className="alert alert-error">{error}</div>}

        {!loading && rides.length === 0 && (
          <div className="history-empty">
            <span>🚗</span>
            <p>No past rides yet.</p>
            <p>Complete a pool ride and it will appear here.</p>
          </div>
        )}

        {rides.map((ride, i) => (
          <div key={ride._id || i} className="ride-card">
            <div className="ride-card-header">
              <span className="ride-vehicle">
                {ride.vehicleType === "car" ? "🚗 Car" : "🛺 Auto"}
              </span>
              <span className="ride-date">
                {new Date(ride.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            <div className="ride-route">
              <div className="ride-stop">
                <span className="ride-dot origin" />
                <span>BMS College of Engineering</span>
              </div>
              <div className="ride-line" />
              <div className="ride-stop">
                <span className="ride-dot dest" />
                <span>National College Metro Station</span>
              </div>
            </div>

            <div className="ride-meta">
              <span>🪑 {ride.seats} seat{ride.seats > 1 ? "s" : ""}</span>
              <span className="ride-status">✅ Completed</span>
            </div>

            {ride.members && ride.members.length > 0 && (
              <div className="ride-members">
                <p className="ride-members-label">Pool members</p>
                <div className="ride-members-list">
                  {ride.members.map((m, j) => (
                    <span key={j} className="ride-member-tag">
                      {m.name} ({m.seats} seat{m.seats > 1 ? "s" : ""})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </main>
    </div>
  );
}