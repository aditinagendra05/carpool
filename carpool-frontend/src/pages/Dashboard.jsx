import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { joinPool } from "../services/PoolService";
import "./Dashboard.css";

const VEHICLES = [
  { id: "auto", label: "Auto", icon: "🛺", capacity: 3, desc: "Up to 3 people" },
  { id: "car",  label: "Car",  icon: "🚗", capacity: 4, desc: "Up to 4 people" },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState("auto");
  const [people, setPeople] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);

  const maxSeats = VEHICLES.find(v => v.id === vehicle)?.capacity ?? 4;

  useEffect(() => {
    const stored = localStorage.getItem("cp_pool_history");
    if (stored) setHistory(JSON.parse(stored));
  }, []);

  const handleVehicleChange = (id) => {
    setVehicle(id);
    setPeople(1);
  };

  const handleJoin = async () => {
    setError("");
    setLoading(true);
    try {
      const seatsToBook = Number(people);
      const data = await joinPool({
        userId: user?._id || user?.id,
        vehicleType: vehicle,
        seats: seatsToBook,
      });

      // Save to history
      const entry = {
        poolId: data._id,
        vehicleType: vehicle,
        seats: seatsToBook,
        date: new Date().toISOString(),
        status: data.status,
      };
      const prev = JSON.parse(localStorage.getItem("cp_pool_history") || "[]");
      const updated = [entry, ...prev].slice(0, 20);
      localStorage.setItem("cp_pool_history", JSON.stringify(updated));
      setHistory(updated);

      navigate("/waiting", { state: { poolId: data._id } });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to join pool. Try again.");
      setLoading(false);
    }
  };

  return (
    <div className="dash-container">
      {/* Header */}
      <header className="dash-header">
        <div className="dash-logo">
          <span>🚗</span>
          <span className="dash-logo-text">Carpool<span>BMS</span></span>
        </div>
        <div className="dash-user">
          <span className="dash-user-name">{user?.name}</span>
          <button
            className="btn-history"
            onClick={() => setShowHistory(true)}
            title="View ride history"
          >
            🕓 History
          </button>
          <button className="btn-logout" onClick={logout}>Sign out</button>
        </div>
      </header>

      {/* History Modal */}
      {showHistory && (
        <div className="history-overlay" onClick={() => setShowHistory(false)}>
          <div className="history-modal" onClick={e => e.stopPropagation()}>
            <div className="history-modal-header">
              <h3>Ride History</h3>
              <button className="history-close" onClick={() => setShowHistory(false)}>✕</button>
            </div>
            {history.length === 0 ? (
              <div className="history-empty">
                <span>🚗</span>
                <p>No rides yet</p>
              </div>
            ) : (
              <div className="history-list">
                {history.map((h, i) => (
                  <div key={i} className="history-item">
                    <div className="history-icon">
                      {h.vehicleType === "car" ? "🚗" : "🛺"}
                    </div>
                    <div className="history-info">
                      <div className="history-route">
                        BMS College → National College Metro
                      </div>
                      <div className="history-meta">
                        {h.vehicleType.charAt(0).toUpperCase() + h.vehicleType.slice(1)}
                        &nbsp;·&nbsp;
                        {h.seats} {h.seats === 1 ? "seat" : "seats"}
                        &nbsp;·&nbsp;
                        {new Date(h.date).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </div>
                    </div>
                    <span className={`history-status ${h.status}`}>
                      {h.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <main className="dash-main">
        {/* Route banner */}
        <div className="route-banner">
          <div className="route-stop origin">
            <span className="route-dot origin-dot" />
            <div>
              <div className="route-label">From</div>
              <div className="route-name">BMS College of Engineering</div>
            </div>
          </div>
          <div className="route-line">
            <div className="route-line-track" />
            <span className="route-distance">4.2 km</span>
          </div>
          <div className="route-stop dest">
            <span className="route-dot dest-dot" />
            <div>
              <div className="route-label">To</div>
              <div className="route-name">National College Metro Station</div>
            </div>
          </div>
        </div>

        <div className="dash-sections">
          {/* Vehicle selector */}
          <section className="dash-section">
            <h2 className="section-title">Choose vehicle</h2>
            <div className="vehicle-grid">
              {VEHICLES.map(v => (
                <button
                  key={v.id}
                  className={`vehicle-card${vehicle === v.id ? " selected" : ""}`}
                  onClick={() => handleVehicleChange(v.id)}
                >
                  <span className="vehicle-icon">{v.icon}</span>
                  <span className="vehicle-label">{v.label}</span>
                  <span className="vehicle-cap">{v.desc}</span>
                  {vehicle === v.id && <span className="vehicle-check">✓</span>}
                </button>
              ))}
            </div>
          </section>

          {/* Seat count */}
          <section className="dash-section">
            <h2 className="section-title">Number of seats</h2>
            <div className="people-selector">
              {Array.from({ length: maxSeats }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  className={`people-btn${people === n ? " selected" : ""}`}
                  onClick={() => setPeople(n)}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="people-hint">
              {people} {people === 1 ? "seat" : "seats"} selected
            </p>
          </section>

          {/* Summary */}
          <div className="dash-summary">
            <div className="summary-row">
              <span>Vehicle</span>
              <span>{VEHICLES.find(v => v.id === vehicle)?.icon} {vehicle.charAt(0).toUpperCase() + vehicle.slice(1)}</span>
            </div>
            <div className="summary-row">
              <span>Seats</span>
              <span>{people} {people === 1 ? "seat" : "seats"}</span>
            </div>
            <div className="summary-row">
              <span>Capacity</span>
              <span>{maxSeats} seats max</span>
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button className="btn-join" onClick={handleJoin} disabled={loading}>
            {loading
              ? <><span className="btn-spinner-dark" />Finding pool…</>
              : "🔍 Find Pool"}
          </button>
        </div>
      </main>
    </div>
  );
}