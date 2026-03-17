import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { joinPool } from "../services/PoolService";

export default function Dashboard() {
  const [vehicle, setVehicle] = useState("auto");
  const [people, setPeople] = useState(1);
  const navigate = useNavigate();

  
const handleJoin = async () => {
  try {
    const data = await joinPool({
      userId: "123", // temp (later from auth)
      vehicleType: vehicle,
      seats: Number(people)
    });

    navigate("/Waiting", { state: { poolId: data._id } });
  } catch (err) {
    console.error(err);
  }
};

  return (
    <div style={{ padding: "20px" }}>
      <h2>Dashboard</h2>

      <h3>Select Vehicle</h3>
      <button onClick={() => setVehicle("auto")}>Auto</button>
      <button onClick={() => setVehicle("car")}>Car</button>

      <h3>Number of People</h3>
      <input
        type="number"
        value={people}
        onChange={(e) => setPeople(e.target.value)}
      />

      <br /><br />
      <button onClick={handleJoin}>Join Pool</button>
    </div>
  );
}