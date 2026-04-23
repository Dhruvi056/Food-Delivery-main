/* eslint-disable react/prop-types */
import { useContext, useMemo, useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";
import { FiMessageSquare, FiSend, FiX, FiHeadphones } from "react-icons/fi";

// ── Message bubble ────────────────────────────────────────────────────────────
const ChatBubble = ({ role, text }) => {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed border whitespace-pre-wrap break-words",
          isUser
            ? "bg-brand-accent text-white border-brand-accent/40"
            : "bg-white/5 text-slate-200 border-white/10",
        ].join(" ")}
      >
        {text}
      </div>
    </div>
  );
};

// ── Mode config ───────────────────────────────────────────────────────────────
const MODES = {
  food: {
    id: "food",
    icon: "🍕",
    label: "Food Suggestions",
    endpoint: "/api/ai/chat",
    placeholder: 'Ask me… "Suggest something spicy under ₹200"',
    welcome: "Hi! I'm BiteBlitz AI. Ask me to suggest dishes, find options by budget, or explore the menu! 🍔",
  },
  support: {
    id: "support",
    icon: "🎧",
    label: "Support",
    endpoint: "/api/ai/support",
    placeholder: 'Ask me… "Where is my order?" or "Can I cancel?"',
    welcome: "Hi! I'm BiteBlitz Support. I can help with your orders, cancellations, refunds, and delivery questions. 📦",
  },
};

// ── Main Component ────────────────────────────────────────────────────────────
const AiChatbot = () => {
  const { url } = useContext(StoreContext);
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("food");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [histories, setHistories] = useState({
    food: [{ role: "assistant", text: MODES.food.welcome }],
    support: [{ role: "assistant", text: MODES.support.welcome }],
  });
  const bottomRef = useRef(null);

  const currentMode = MODES[mode];
  const messages = histories[mode];

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const riderRoutes = ['/rider-dashboard', '/deliveries', '/earnings'];
  if (riderRoutes.some(route => location.pathname.startsWith(route))) {
    return null;
  }

  const switchMode = (newMode) => {
    setMode(newMode);
    setInput("");
  };

  const send = async () => {
    if (!canSend) return;
    const text = input.trim();
    setInput("");
    setHistories((prev) => ({
      ...prev,
      [mode]: [...prev[mode], { role: "user", text }],
    }));
    setLoading(true);

    try {
      const userId = localStorage.getItem("userId");
      const res = await axios.post(`${url}${currentMode.endpoint}`, {
        message: text,
        userId: userId || undefined,
      });

      const reply = res.data?.success
        ? (res.data.reply || res.data.data?.summary || "…")
        : (res.data?.message || "I'm having trouble responding right now.");

      setHistories((prev) => ({
        ...prev,
        [mode]: [...prev[mode], { role: "assistant", text: reply }],
      }));
    } catch {
      setHistories((prev) => ({
        ...prev,
        [mode]: [
          ...prev[mode],
          { role: "assistant", text: "Something went wrong. Please try again." },
        ],
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-[120] w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg active:scale-95 transition-all hover:scale-105"
          style={{ background: "linear-gradient(135deg,#e94560,#f97316)" }}
          aria-label="Open AI Assistant"
        >
          <FiMessageSquare className="w-6 h-6" />
        </button>
      )}

      {/* Chat modal */}
      {open && (
        <div className="fixed bottom-6 right-6 z-[130] w-[92vw] max-w-sm h-[500px] max-h-[85vh] rounded-2xl border border-white/10 bg-brand-card shadow-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-4 pt-3 pb-0 border-b border-white/10 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-bold text-white">BiteBlitz AI</p>
                <p className="text-[10px] text-brand-muted mt-0.5">
                  {currentMode.icon} {currentMode.label}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-200 hover:border-brand-accent/40"
                aria-label="Close"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            {/* Mode toggle */}
            <div className="flex gap-1 mb-3 bg-white/5 rounded-xl p-1">
              {Object.values(MODES).map((m) => (
                <button
                  key={m.id}
                  onClick={() => switchMode(m.id)}
                  className={[
                    "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200",
                    mode === m.id
                      ? "bg-brand-accent text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200",
                  ].join(" ")}
                >
                  <span>{m.icon}</span>
                  <span className="hidden sm:inline">{m.label}</span>
                  <span className="sm:hidden">{m.id === "food" ? "Food" : "Help"}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-brand-card">
            {messages.map((m, idx) => (
              <ChatBubble key={idx} role={m.role} text={m.text} />
            ))}
            {loading && <ChatBubble role="assistant" text="Thinking…" />}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/10 bg-brand-card shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                placeholder={currentMode.placeholder}
                className="flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 placeholder:text-brand-muted outline-none focus:border-brand-accent/60"
              />
              <button
                onClick={send}
                disabled={!canSend}
                className="w-11 h-11 rounded-xl flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
                style={{ background: "linear-gradient(135deg,#e94560,#f97316)" }}
                aria-label="Send"
              >
                <FiSend className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-2 text-[10px] text-brand-muted">
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default AiChatbot;
