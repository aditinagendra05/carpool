import axios from "axios";

const BASE_URL = "http://localhost:5001/api/pool";

const api = axios.create({ baseURL: BASE_URL });

// Attach token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("cp_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If token expired/invalid, clear storage and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("cp_token");
      localStorage.removeItem("cp_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export const joinPool = async (data) => {
  const res = await api.post("/join", data);
  return res.data;
};

export const getPool = async (poolId) => {
  const res = await api.get(`/${poolId}`);
  return res.data;
};

export const closePool = async (poolId) => {
  const res = await api.post(`/${poolId}/close`, {});
  return res.data;
};

export const sendMessage = async (poolId, senderId, text) => {
  const res = await api.post(`/${poolId}/messages`, { senderId, text });
  return res.data;
};

export const getMessages = async (poolId) => {
  const res = await api.get(`/${poolId}/messages`);
  return res.data;
};

export const getHistory = async (userId) => {
  const res = await api.get(`/history/${userId}`);
  return res.data;
};