import axios from "axios";

const BASE_URL = `${import.meta.env.VITE_API_URL}/api/pool`;
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

export const closePool = async (poolId) => {
  const res = await axios.post(`${BASE_URL}/${poolId}/close`, {}, { headers: getHeaders() });
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

export const getUserHistory = async (userId) => {
  const res = await axios.get(`${BASE_URL}/history/${userId}`, { headers: getHeaders() });
  return res.data;
};

export const leavePool = async (poolId, userId) => {
  const res = await axios.post(
    `${BASE_URL}/${poolId}/leave`,
    { userId },
    { headers: getHeaders() }
  );
  return res.data;
};