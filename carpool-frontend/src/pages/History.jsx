import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getHistory } from "../services/PoolService";
import "./History.css";

const AVATAR_COLORS = [
  "linear-gradient(135deg,#4f6ef7,#7c5cfc)",
  "linear-gradient(135deg,#3ecf8e,#2ab57a)",
  "linear-gradient(135deg,#f7934f,#e06b2a)",
  "linear-gradient(135deg,#f74f6e,#c72d4e)",
  "linear-gradient(135deg,#7b97ff,#4f6ef7)",
];

function formatDate(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-line medium" />
      <div className="skeleton-line short" />
      <div className="skeleton-line" style={{ width: "80%" }} />
    </div>
  );
}

export default function History() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const userId = user?._id || user?.id;
    if (!userId) return;
    getHistory(userId)
      .then(setRides)
      .catch(() => setError("Failed to load history."))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="history-container">
      {/* Reuse dashboard header style */}
      <header className="dash-header">
        <div className="dash-logo">
          <span>🚗</span>
          <span className="dash-logo-text">Carpool<span>BMS</span></span>
        </div>
        <div className="dash-user">
          <button className="btn-logout" onClick={() => navigate("/dashboard")}>← Dashboard</button>
          <button className="btn-logout" onClick={logout}>Sign out</button>
        </div>
      </header>

      <main className="history-main">
        <div className="history-title">
          <h1>Ride History</h1>
          {!loading && <span className="history-count">{rides.length} ride{rides.length !== 1 ? "s" : ""}</span>}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="history-skeleton">
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : rides.length === 0 ? (
          <div className="history-empty">
            <span>🛺</span>
            <h3>No rides yet</h3>
            <p>Your completed pool rides will appear here</p>
            <button className="btn-find-ride" onClick={() => navigate("/dashboard")}>
              Find a ride
            </button>
          </div>
        ) : (
          rides.map((ride, idx) => (
            <RideCard key={ride._id} ride={ride} delay={idx * 0.07} currentUserId={user?._id || user?.id} />
          ))
        )}
      </main>
    </div>
  );
}

function RideCard({ ride, delay, currentUserId }) {
  const totalPeople = ride.totalSeats ?? 0;
  const members = ride.users ?? [];

  return (
    <div className="ride-card" style={{ animationDelay: `${delay}s` }}>
      <div className="ride-card-top">
        <div className="ride-vehicle">
          <span>{ride.vehicleType === "car" ? "🚗" : "🛺"}</span>
          <span>{ride.vehicleType === "car" ? "Car" : "Auto"}</span>
        </div>
        <span className="ride-status-badge">✓ Completed</span>
      </div>

      <div className="ride-route">
        <span className="rr-dot origin" />
        <span className="rr-label">BMS College</span>
        <span className="rr-arrow">→</span>
        <span className="rr-dot dest" />
        <span className="rr-label">National College Metro</span>
      </div>

      <div className="ride-meta">
        <div className="ride-meta-item">
          <span className="ride-meta-icon">👥</span>
          <span>{totalPeople} {totalPeople === 1 ? "person" : "people"}</span>
        </div>
        <div className="ride-meta-item">
          <span className="ride-meta-icon">🗓</span>
          <span>{formatDate(ride.updatedAt)}</span>
        </div>
        <div className="ride-meta-item">
          <span className="ride-meta-icon">💺</span>
          <span>{ride.capacity} seat capacity</span>
        </div>
      </div>

      {members.length > 0 && (
        <div className="ride-members">
          {members.slice(0, 5).map((u, i) => {
            const name = u.userId?.name || "User";
            const isMe = (u.userId?._id || u.userId) === currentUserId;
            return (
              <div
                key={i}
                className="rm-avatar"
                style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                title={isMe ? `${name} (you)` : name}
              >
                {name[0].toUpperCase()}
              </div>
            );
          })}
          <span className="rm-names">
            {members.map((u, i) => {
              const name = u.userId?.name || "User";
              const isMe = (u.userId?._id || u.userId) === currentUserId;
              return isMe ? "You" : name;
            }).join(", ")}
          </span>
        </div>
      )}
    </div>
  );
}