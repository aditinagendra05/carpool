import axios from "axios";

const BASE_URL = "http://localhost:5000/api/pool";

export const joinPool = async (data) => {
  const res = await axios.post(`${BASE_URL}/join`, data);
  return res.data;
};

export const getPool = async (poolId) => {
  const res = await axios.get(`${BASE_URL}/${poolId}`);
  return res.data;
};