import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getUserHistory } from "../services/PoolService";
import "./History.css";
import "./Dashboard.css";

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

export default function History() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = user?._id || user?.id;
    getUserHistory(id)
      .then(setPools)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const myId = user?._id || user?.id;

  return (
    <div className="history-container">
      <header className="dash-header">
        <div className="dash-logo">
          <span>🚗</span>
          <span className="dash-logo-text">Carpool<span>BMS</span></span>
        </div>
        <div className="dash-user">
          <span className="dash-user-name">{user?.name}</span>
          <button className="btn-logout" onClick={() => navigate("/dashboard")}>← Dashboard</button>
          <button className="btn-logout" onClick={logout}>Sign out</button>
        </div>
      </header>

      <main className="history-main">
        <div className="history-title">
          <h1>Your Ride History</h1>
          <p>All your completed carpool sessions</p>
        </div>

        {loading && (
          <div className="history-loading">
            {[1,2,3].map(i => <div key={i} className="skeleton" />)}
          </div>
        )}

        {!loading && pools.length === 0 && (
          <div className="history-empty">
            <span>🗂️</span>
            <p>No completed rides yet.<br />Join a pool to get started!</p>
            <button className="btn-logout" onClick={() => navigate("/dashboard")}>Find a pool</button>
          </div>
        )}

        {!loading && pools.length > 0 && (
          <div className="history-list">
            {pools.map((pool, idx) => (
              <div key={pool._id} className="history-card">
                <div className="hc-top">
                  <div className="hc-vehicle">
                    {pool.vehicleType === "car" ? "🚗 Car" : "🛺 Auto"}
                  </div>
                  <span className="hc-date">{formatDate(pool.updatedAt)}</span>
                </div>

                <div className="hc-route">
                  <span className="hc-dot origin" />
                  <span>BMS College of Engineering</span>
                  <span className="hc-arrow">→</span>
                  <span className="hc-dot dest" />
                  <span>National College Metro Station</span>
                </div>

                <div className="hc-members">
                  {pool.users.map((u, i) => {
                    const name = u.userId?.name || "User";
                    const isMe = (u.userId?._id || u.userId) === myId;
                    return (
                      <div key={i} className="hc-member">
                        <div className="hc-avatar" style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                          {name[0].toUpperCase()}
                        </div>
                        <span className={isMe ? "hc-you" : ""}>{isMe ? "You" : name}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="hc-stats">
                  <div className="hc-stat">
                    <span className="hc-stat-label">People</span>
                    <span className="hc-stat-val">{pool.totalSeats}</span>
                  </div>
                  <div className="hc-stat">
                    <span className="hc-stat-label">Capacity</span>
                    <span className="hc-stat-val">{pool.capacity}</span>
                  </div>
                  <div className="hc-stat">
                    <span className="hc-stat-label">Status</span>
                    <span className="hc-stat-val">🔒 Closed</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}