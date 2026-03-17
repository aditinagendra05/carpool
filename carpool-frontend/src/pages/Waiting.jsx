import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getPool } from "../services/PoolService";

export default function Waiting() {
  const navigate = useNavigate();
  const location = useLocation();
  const poolId = location.state?.poolId;

  const [pool, setPool] = useState(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await getPool(poolId);
        setPool(data);

        if (data.status === "matched") {
          navigate("/pool", { state: { poolId } });
        }
      } catch (err) {
        console.error(err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Finding people...</h2>

      {pool && (
        <div>
          <p>Vehicle: {pool.vehicleType}</p>
          <p>Total People: {pool.totalSeats}</p>
        </div>
      )}
    </div>
  );
}