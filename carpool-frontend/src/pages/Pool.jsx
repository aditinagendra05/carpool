import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getPool, sendMessage, getMessages } from "../services/PoolService";
import "./Pool.css";

export default function Pool() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const poolId = location.state?.poolId;

  const [pool, setPool] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const chatPollRef = useRef(null);

  useEffect(() => {
    if (!poolId) { navigate("/dashboard"); return; }
    getPool(poolId).then(setPool).catch(console.error);
  }, [poolId]);

  // Poll chat
  useEffect(() => {
    if (!poolId) return;
    const fetchMsgs = () =>
      getMessages(poolId)
        .then(setMessages)
        .catch(console.error);
    fetchMsgs();
    chatPollRef.current = setInterval(fetchMsgs, 3000);
    return () => clearInterval(chatPollRef.current);
  }, [poolId]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!msg.trim() || sending) return;
    setSending(true);
    try {
      await sendMessage(poolId, user?._id || user?.id, msg.trim());
      setMsg("");
      const data = await getMessages(poolId);
      setMessages(data);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const myId = user?._id || user?.id;

  return (
    <div className="pool-container">
      {/* Sidebar */}
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
              <span>Total people</span>
              <span>{pool.totalSeats}</span>
            </div>
          </div>
        )}

        <div className="pool-members">
          <p className="pm-title">Members</p>
          {pool?.users?.map((u, i) => {
            const name = u.userId?.name || "User";
            const isMe = (u.userId?._id || u.userId) === myId;
            return (
              <div key={i} className="pm-item">
                <div className="pm-avatar" style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                  {name[0].toUpperCase()}
                </div>
                <div className="pm-info">
                  <span className="pm-name">{name} {isMe && <span className="pm-you">you</span>}</span>
                  <span className="pm-seats">{u.seats} seat{u.seats > 1 ? "s" : ""}</span>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Chat */}
      <main className="pool-chat">
        <div className="chat-header">
          <div>
            <h2>Group Chat</h2>
            <p>{pool?.users?.length || 0} members · {pool?.vehicleType === "car" ? "🚗 Car" : "🛺 Auto"}</p>
          </div>
        </div>

        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-empty">
              <span>💬</span>
              <p>No messages yet. Say hi to your pool!</p>
            </div>
          )}
          {messages.map((m, i) => {
            const isMe = (m.senderId?._id || m.senderId) === myId;
            const senderName = m.senderId?.name || "User";
            const prevMsg = messages[i - 1];
            const showName = !isMe && (!prevMsg || (prevMsg.senderId?._id || prevMsg.senderId) !== (m.senderId?._id || m.senderId));
            return (
              <div key={i} className={`msg-row ${isMe ? "me" : "them"}`}>
                {!isMe && (
                  <div className="msg-avatar" style={{ background: AVATAR_COLORS[getUserIndex(pool, m.senderId) % AVATAR_COLORS.length] }}>
                    {senderName[0].toUpperCase()}
                  </div>
                )}
                <div className="msg-body">
                  {showName && <span className="msg-sender">{senderName}</span>}
                  <div className="msg-bubble">{m.text}</div>
                  <span className="msg-time">{formatTime(m.createdAt)}</span>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <form className="chat-input-row" onSubmit={handleSend}>
          <input
            className="chat-input"
            type="text"
            placeholder="Type a message…"
            value={msg}
            onChange={e => setMsg(e.target.value)}
            disabled={sending}
          />
          <button className="chat-send" type="submit" disabled={!msg.trim() || sending}>
            {sending ? <span className="btn-spinner-sm" /> : "↑"}
          </button>
        </form>
      </main>
    </div>
  );
}

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
  return pool.users.findIndex(u => (u.userId?._id || u.userId) === sid) ?? 0;
}

function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}