import { useState } from "react";
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

  const maxSeats = VEHICLES.find(v => v.id === vehicle)?.capacity ?? 4;

  const handleJoin = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await joinPool({
        userId: user?._id || user?.id,
        vehicleType: vehicle,
        seats: Number(people),
      });
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
          <button className="btn-logout" onClick={() => navigate("/history")}>
            📋 History
          </button>
          <button className="btn-logout" onClick={logout}>Sign out</button>
        </div>
      </header>

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
                  onClick={() => { setVehicle(v.id); setPeople(Math.min(people, v.capacity)); }}
                >
                  <span className="vehicle-icon">{v.icon}</span>
                  <span className="vehicle-label">{v.label}</span>
                  <span className="vehicle-cap">{v.desc}</span>
                  {vehicle === v.id && <span className="vehicle-check">✓</span>}
                </button>
              ))}
            </div>
          </section>

          {/* People count */}
          <section className="dash-section">
            <h2 className="section-title">Number of people</h2>
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
            <p className="people-hint">{people} {people === 1 ? "person" : "people"} travelling</p>
          </section>

          {/* Summary */}
          <div className="dash-summary">
            <div className="summary-row">
              <span>Vehicle</span>
              <span>{VEHICLES.find(v => v.id === vehicle)?.icon} {vehicle.charAt(0).toUpperCase() + vehicle.slice(1)}</span>
            </div>
            <div className="summary-row">
              <span>Passengers</span>
              <span>{people} {people === 1 ? "person" : "people"}</span>
            </div>
            <div className="summary-row">
              <span>Capacity</span>
              <span>{maxSeats} seats max</span>
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button
            className="btn-join"
            onClick={handleJoin}
            disabled={loading}
          >
            {loading ? <><span className="btn-spinner-dark" />Finding pool…</> : "🔍 Find Pool"}
          </button>
        </div>
      </main>
    </div>
  );
}