import { createContext, useContext, useState, useCallback } from "react";
import "./Toast.css";

const ToastContext = createContext();

const ICONS = { success: "✅", error: "❌", info: "ℹ️", warning: "⚠️" };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((msg, type = "info", duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev =>
        prev.map(t => t.id === id ? { ...t, removing: true } : t)
      );
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 260);
    }, duration);
  }, []);

  const remove = (id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, removing: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 260);
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}${t.removing ? " removing" : ""}`}>
            <span className="toast-icon">{ICONS[t.type]}</span>
            <span className="toast-msg">{t.msg}</span>
            <button className="toast-close" onClick={() => remove(t.id)}>×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);