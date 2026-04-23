/* eslint-disable react/prop-types */
import { useContext, useMemo, useState } from "react";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";
import { FiMessageSquare, FiSend, FiX } from "react-icons/fi";

const ChatBubble = ({ role, text }) => {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed border",
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

const AiChatbot = () => {
  const { url } = useContext(StoreContext);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi! Ask me things like: “Suggest dinner under ₹200”.",
    },
  ]);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  const send = async () => {
    if (!canSend) return;
    const text = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setLoading(true);
    try {
      const res = await axios.post(`${url}/api/ai/chat`, { message: text });
      if (res.data?.success) {
        setMessages((prev) => [...prev, { role: "assistant", text: res.data.reply || "…" }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: res.data?.message || "AI is not configured right now." },
        ]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "AI request failed." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-[120] w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg active:scale-95 transition-all"
          style={{ background: "linear-gradient(135deg,#e94560,#f97316)" }}
          aria-label="Open AI Chatbot"
        >
          <FiMessageSquare className="w-6 h-6" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-[130] w-[92vw] max-w-sm rounded-2xl border border-white/10 bg-brand-card shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div>
              <p className="text-sm font-bold text-white">BiteBlitz AI</p>
              <p className="text-[10px] text-brand-muted mt-0.5">Menu suggestions · budget picks</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-200 hover:border-brand-accent/40"
              aria-label="Close chatbot"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>

          <div className="h-80 overflow-y-auto px-4 py-3 space-y-3 bg-brand-card">
            {messages.map((m, idx) => (
              <ChatBubble key={idx} role={m.role} text={m.text} />
            ))}
            {loading && <ChatBubble role="assistant" text="Thinking…" />}
          </div>

          <div className="p-3 border-t border-white/10 bg-brand-card">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={2}
                placeholder="Ask something…"
                className="flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 placeholder:text-brand-muted outline-none focus:border-brand-accent/60"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
              />
              <button
                onClick={send}
                disabled={!canSend}
                className="w-11 h-11 rounded-xl flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
                style={{ background: "linear-gradient(135deg,#e94560,#f97316)" }}
                aria-label="Send"
              >
                <FiSend className="w-4.5 h-4.5" />
              </button>
            </div>
            <p className="mt-2 text-[10px] text-brand-muted">
              Tip: Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default AiChatbot;

