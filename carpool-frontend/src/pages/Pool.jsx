import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getPool } from "../services/PoolService";

export default function Pool() {
  const location = useLocation();
  const poolId = location.state?.poolId;

  const [pool, setPool] = useState(null);

  useEffect(() => {
    const fetchPool = async () => {
      const data = await getPool(poolId);
      setPool(data);
    };

    fetchPool();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Pool Matched 🎉</h2>

      {pool && (
        <>
          <p>Vehicle: {pool.vehicleType}</p>
          <p>Total People: {pool.totalSeats}</p>

          <h3>Users:</h3>
          <ul>
            {pool.users.map((u, i) => (
              <li key={i}>{u.userId} ({u.seats})</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
