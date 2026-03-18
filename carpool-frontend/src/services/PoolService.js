import axios from "axios";

const BASE_URL = "http://localhost:5000/api/pool";

const getHeaders = () => {
  const token = localStorage.getItem("cp_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const joinPool = async (data) => {
  const res = await axios.post(`${BASE_URL}/join`, data, { headers: getHeaders() });
  return res.data;
};

export const getPool = async (poolId) => {
  const res = await axios.get(`${BASE_URL}/${poolId}`, { headers: getHeaders() });
  return res.data;
};

export const sendMessage = async (poolId, senderId, text) => {
  const res = await axios.post(
    `${BASE_URL}/${poolId}/messages`,
    { senderId, text },
    { headers: getHeaders() }
  );
  return res.data;
};

export const getMessages = async (poolId) => {
  const res = await axios.get(`${BASE_URL}/${poolId}/messages`, { headers: getHeaders() });
  return res.data;
};