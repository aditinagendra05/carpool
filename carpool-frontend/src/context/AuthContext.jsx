import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

const BASE = "http://localhost:5001/api/auth";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("cp_user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("cp_token") || null;
  });

  const [loading, setLoading] = useState(false);

  const register = async (name, email, password) => {
    const res = await axios.post(`${BASE}/register`, { name, email, password });
    const { token: t, user: u } = res.data;
    setToken(t);
    setUser(u);
    localStorage.setItem("cp_token", t);
    localStorage.setItem("cp_user", JSON.stringify(u));
    return u;
  };

  const login = async (email, password) => {
    const res = await axios.post(`${BASE}/login`, { email, password });
    const { token: t, user: u } = res.data;
    setToken(t);
    setUser(u);
    localStorage.setItem("cp_token", t);
    localStorage.setItem("cp_user", JSON.stringify(u));
    return u;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("cp_token");
    localStorage.removeItem("cp_user");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, register, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);