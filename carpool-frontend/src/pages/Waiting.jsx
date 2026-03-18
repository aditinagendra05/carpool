import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getPool } from "../services/PoolService";
import "./Waiting.css";

export default function Waiting() {
  const navigate = useNavigate();
  const location = useLocation();
  const poolId = location.state?.poolId;
  const [pool, setPool] = useState(null);
  const [dots, setDots] = useState("");
  const intervalRef = useRef(null);

  // Animate dots
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? "" : d + "."), 500);
    return () => clearInterval(t);
  }, []);

  // Poll for match
  useEffect(() => {
    if (!poolId) { navigate("/dashboard"); return; }

    const fetchPool = async () => {
      try {
        const data = await getPool(poolId);
        setPool(data);
        if (data.status === "matched") {
          clearInterval(intervalRef.current);
          setTimeout(() => navigate("/pool", { state: { poolId } }), 800);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchPool();
    intervalRef.current = setInterval(fetchPool, 3000);
    return () => clearInterval(intervalRef.current);
  }, [poolId]);

  const capacity = pool?.vehicleType === "car" ? 4 : 3;
  const current = pool?.totalSeats ?? 0;
  const progress = Math.min((current / capacity) * 100, 100);
  const isMatched = pool?.status === "matched";

  return (
    <div className="wait-container">
      <div className="wait-card">
        {/* Status badge */}
        <div className={`wait-badge ${isMatched ? "matched" : "searching"}`}>
          <span className={`wait-badge-dot ${isMatched ? "" : "pulsing"}`} />
          {isMatched ? "Match found!" : `Searching${dots}`}
        </div>

        {/* Animated icon */}
        <div className="wait-icon-wrap">
          <div className="wait-rings">
            <div className="ring r1" />
            <div className="ring r2" />
            <div className="ring r3" />
          </div>
          <span className="wait-icon">
            {pool?.vehicleType === "car" ? "🚗" : "🛺"}
          </span>
        </div>

        <div className="wait-text">
          <h2>{isMatched ? "Pool matched!" : "Finding your group"}</h2>
          <p>
            {isMatched
              ? "Heading to your pool…"
              : "We're matching you with others on the same route"}
          </p>
        </div>

        {pool && (
          <div className="wait-info">
            {/* Route */}
            <div className="wait-route">
              <span className="wr-dot origin" />
              <span className="wr-label">BMS College</span>
              <span className="wr-arrow">→</span>
              <span className="wr-dot dest" />
              <span className="wr-label">National College Metro</span>
            </div>

            {/* Progress */}
            <div className="wait-progress-wrap">
              <div className="wait-progress-header">
                <span>Seats filled</span>
                <span className="wp-count">{current} / {capacity}</span>
              </div>
              <div className="wait-progress-bar">
                <div
                  className="wait-progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Users */}
            {pool.users?.length > 0 && (
              <div className="wait-users">
                <p className="wu-label">In your pool</p>
                <div className="wu-list">
                  {pool.users.map((u, i) => (
                    <div key={i} className="wu-item" style={{ animationDelay: `${i * 0.08}s` }}>
                      <div className="wu-avatar">
                        {(u.userId?.name || "U")[0].toUpperCase()}
                      </div>
                      <div className="wu-info">
                        <span className="wu-name">{u.userId?.name || "User"}</span>
                        <span className="wu-seats">{u.seats} seat{u.seats > 1 ? "s" : ""}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="wait-vehicle-tag">
              {pool.vehicleType === "car" ? "🚗 Car" : "🛺 Auto"}
              <span>·</span>
              <span>{current} {current === 1 ? "person" : "people"}</span>
            </div>
          </div>
        )}

        <button className="btn-cancel" onClick={() => navigate("/dashboard")}>
          Cancel & go back
        </button>
      </div>
    </div>
  );
}