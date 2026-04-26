import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getPool, sendMessage, getMessages, closePool } from "../services/PoolService";
import "./Pool.css";

const AVATAR_COLORS = [
  "linear-gradient(135deg,#4f6ef7,#7c5cfc)",
  "linear-gradient(135deg,#3ecf8e,#2ab57a)",
  "linear-gradient(135deg,#f7934f,#e06b2a)",
  "linear-gradient(135deg,#f74f6e,#c72d4e)",
  "linear-gradient(135deg,#7b97ff,#4f6ef7)",
];

function getUserIndex(pool, senderId) {
  if (!pool?.users) return 0;
  const sid = senderId?._id || senderId;
  const idx = pool.users.findIndex(
    (u) => (u.userId?._id || u.userId) === sid
  );
  return Math.max(0, idx);
}

function formatTime(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function Pool() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const poolId = location.state?.poolId;

  const [pool, setPool]       = useState(null);
  const [messages, setMessages] = useState([]);
  const [msg, setMsg]         = useState("");
  const [sending, setSending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [closed, setClosed]   = useState(false);

  const bottomRef   = useRef(null);
  const pollRef     = useRef(null);
  const timerRef    = useRef(null);
  const closedAtRef = useRef(null); // stable ref so timer doesn't need pool state

  const myId = user?._id || user?.id;

  // ── redirect if no poolId ──
  useEffect(() => {
    if (!poolId) navigate("/dashboard");
  }, [poolId, navigate]);

  // ── single polling loop: fetches both pool + messages every 3s ──
  const fetchAll = useCallback(async () => {
    try {
      const [poolData, msgs] = await Promise.all([
        getPool(poolId),
        getMessages(poolId),
      ]);

      setPool(poolData);
      setMessages(msgs);

      // start countdown timer once we have closedAt
      if (poolData.closedAt && !closedAtRef.current) {
        closedAtRef.current = new Date(poolData.closedAt);
        startTimer(closedAtRef.current);
      }

      if (poolData.status === "closed") {
        setClosed(true);
        clearInterval(pollRef.current);
        clearInterval(timerRef.current);
        setTimeout(() => navigate("/dashboard"), 2000);
      }
    } catch (err) {
      console.error("Poll error:", err);
    }
  }, [poolId, navigate]);

  useEffect(() => {
    if (!poolId) return;
    fetchAll(); // immediate first load
    pollRef.current = setInterval(fetchAll, 3000);
    return () => {
      clearInterval(pollRef.current);
      clearInterval(timerRef.current);
    };
  }, [fetchAll, poolId]);

  // ── countdown timer (started once closedAt is known) ──
  const startTimer = (closedAt) => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const remaining = closedAt - new Date();
      if (remaining <= 0) {
        setTimeLeft("0:00");
        setClosed(true);
        clearInterval(timerRef.current);
        clearInterval(pollRef.current);
        setTimeout(() => navigate("/dashboard"), 2000);
      } else {
        const m = Math.floor(remaining / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        setTimeLeft(`${m}:${s.toString().padStart(2, "0")}`);
      }
    }, 1000);
  };

  // ── auto-scroll on new messages ──
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── send message ──
  const handleSend = async (e) => {
    e.preventDefault();
    const text = msg.trim();
    if (!text || sending || closed) return;

    setSending(true);
    setMsg(""); // clear input immediately for better UX

    try {
      await sendMessage(poolId, myId, text);
      // fetch latest messages right after sending
      const msgs = await getMessages(poolId);
      setMessages(msgs);
    } catch (err) {
      console.error("Send error:", err);
      setMsg(text); // restore text if send failed
    } finally {
      setSending(false);
    }
  };

  // ── close pool ──
  const handleClose = async () => {
    if (!window.confirm("Close this pool for everyone?")) return;
    try {
      await closePool(poolId);
      setClosed(true);
      clearInterval(pollRef.current);
      clearInterval(timerRef.current);
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      console.error("Close error:", err);
    }
  };

  return (
    <div className="pool-container">
      {/* Closed overlay */}
      {closed && (
        <div className="pool-closed-overlay">
          <div className="pool-closed-card">
            <span className="closed-icon">🔒</span>
            <h2>Pool Closed</h2>
            <p>Redirecting to dashboard…</p>
          </div>
        </div>
      )}

      {/* ── Sidebar ── */}
      <aside className="pool-sidebar">
        <div className="pool-sidebar-header">
          <button className="btn-back" onClick={() => navigate("/dashboard")}>← Back</button>
          <div className="pool-logo">🚗 CarpoolBMS</div>
        </div>

        <div className="pool-matched-badge">
          <span className="matched-dot" />
          Pool Matched
        </div>

        <div className="pool-route">
          <div className="pr-stop">
            <span className="pr-dot origin" />
            <div>
              <div className="pr-label">From</div>
              <div className="pr-name">BMS College</div>
            </div>
          </div>
          <div className="pr-line" />
          <div className="pr-stop">
            <span className="pr-dot dest" />
            <div>
              <div className="pr-label">To</div>
              <div className="pr-name">National College Metro</div>
            </div>
          </div>
        </div>

        {pool && (
          <div className="pool-details">
            <div className="pd-row">
              <span>Vehicle</span>
              <span>{pool.vehicleType === "car" ? "🚗 Car" : "🛺 Auto"}</span>
            </div>
            <div className="pd-row">
              <span>Total seats</span>
              <span>{pool.totalSeats}</span>
            </div>
            {timeLeft && (
              <div className="pd-row">
                <span>Closes in</span>
                <span className="timer-text">{timeLeft}</span>
              </div>
            )}
          </div>
        )}

        <div className="pool-members">
          <p className="pm-title">Members</p>
          {pool?.users?.map((u, i) => {
            const name  = u.userId?.name || "User";
            const isMe  = (u.userId?._id || u.userId) === myId;
            return (
              <div key={i} className="pm-item">
                <div
                  className="pm-avatar"
                  style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                >
                  {name[0].toUpperCase()}
                </div>
                <div className="pm-info">
                  <span className="pm-name">
                    {name} {isMe && <span className="pm-you">you</span>}
                  </span>
                  <span className="pm-seats">{u.seats} seat{u.seats > 1 ? "s" : ""}</span>
                </div>
              </div>
            );
          })}
        </div>

        <button className="btn-close-pool" onClick={handleClose} disabled={closed}>
          🔒 Close Pool
        </button>
      </aside>

      {/* ── Chat ── */}
      <main className="pool-chat">
        <div className="chat-header">
          <div>
            <h2>Group Chat</h2>
            <p>
              {pool?.users?.length || 0} members
              &nbsp;·&nbsp;
              {pool?.vehicleType === "car" ? "🚗 Car" : "🛺 Auto"}
            </p>
          </div>
          {timeLeft && (
            <div className="chat-timer">
              <span className="timer-icon">⏱</span>
              <span className="timer-val">{timeLeft}</span>
              <span className="timer-label">remaining</span>
            </div>
          )}
        </div>

        <div className="chat-messages">
          {messages.length === 0 && !closed && (
            <div className="chat-empty">
              <span>💬</span>
              <p>No messages yet. Say hi to your pool!</p>
            </div>
          )}

          {messages.map((m, i) => {
            const isMe       = (m.senderId?._id || m.senderId) === myId;
            const senderName = m.senderId?.name || "User";
            const prevMsg    = messages[i - 1];
            const showName   = !isMe && (
              !prevMsg ||
              (prevMsg.senderId?._id || prevMsg.senderId) !==
              (m.senderId?._id || m.senderId)
            );

            return (
              <div key={m._id || i} className={`msg-row ${isMe ? "me" : "them"}`}>
                {!isMe && (
                  <div
                    className="msg-avatar"
                    style={{
                      background:
                        AVATAR_COLORS[
                          getUserIndex(pool, m.senderId) % AVATAR_COLORS.length
                        ],
                    }}
                  >
                    {senderName[0].toUpperCase()}
                  </div>
                )}
                <div className="msg-body">
                  {showName && (
                    <span className="msg-sender">{senderName}</span>
                  )}
                  <div className="msg-bubble">{m.text}</div>
                  <span className="msg-time">{formatTime(m.createdAt)}</span>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {closed ? (
          <div className="chat-closed-bar">🔒 This pool has been closed</div>
        ) : (
          <form className="chat-input-row" onSubmit={handleSend}>
            <input
              className="chat-input"
              type="text"
              placeholder="Type a message…"
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              disabled={sending || closed}
              autoComplete="off"
            />
            <button
              className="chat-send"
              type="submit"
              disabled={!msg.trim() || sending || closed}
            >
              {sending ? <span className="btn-spinner-sm" /> : "↑"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}