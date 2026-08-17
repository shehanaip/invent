import { useEffect, useRef, useState } from "react";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODELS = [
  "openai/gpt-oss-20b",
  "openai/gpt-oss-120b",
  "qwen/qwen3.6-27b",
];

const SYSTEM_PROMPT = `You are InventIQ, a smart assistant inside the INVENT inventory management system (web dashboard).

You help with inventory, stock, products, orders, billing, suppliers, customers, logistics, tracking, cash flow and reports.

Rules:
- Be clear, friendly, and practical
- Keep answers short for a chat panel
- Prefer simple language
- Use Bangladeshi business context when useful (BDT / ৳)`;

const QUICK_PROMPTS = [
  "How do I track low stock?",
  "Tips for managing orders",
  "Explain cash flow",
  "How to reduce out-of-stock?",
];

async function callGroq(history, userText) {
  if (!GROQ_API_KEY) {
    throw new Error(
      "Missing VITE_GROQ_API_KEY in .env — add your Groq key and restart Vite."
    );
  }
  const messages = [{ role: "system", content: SYSTEM_PROMPT }];
  history.slice(-8).forEach((m) => {
    if (m.id === "welcome") return;
    messages.push({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.text,
    });
  });
  messages.push({ role: "user", content: userText });

  let lastError = null;
  for (const model of GROQ_MODELS) {
    try {
      const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        lastError = data?.error?.message || `HTTP ${res.status}`;
        continue;
      }
      const text = data?.choices?.[0]?.message?.content || "";
      if (text.trim()) return text.trim();
      lastError = "Empty response";
    } catch (err) {
      lastError = err.message || String(err);
    }
  }
  throw new Error(lastError || "Could not reach InventIQ");
}

export default function InventIQChat({ dark = true }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      text: "Hi! I'm InventIQ ✨\nAsk me about stock, orders, suppliers, cash flow, or how to use INVENT.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [pos, setPos] = useState({ x: null, y: null });
  const dragRef = useRef({
    dragging: false,
    moved: false,
    offsetX: 0,
    offsetY: 0,
  });
  const listRef = useRef(null);

  useEffect(() => {
    const place = () => {
      const size = window.innerWidth <= 600 ? 56 : 64;
      const margin = 20;
      setPos((prev) => {
        if (prev.x != null && prev.y != null) {
          return {
            x: Math.max(8, Math.min(window.innerWidth - size - 8, prev.x)),
            y: Math.max(8, Math.min(window.innerHeight - size - 8, prev.y)),
          };
        }
        return {
          x: window.innerWidth - size - margin,
          y: window.innerHeight - size - margin,
        };
      });
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, []);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, sending, open]);

  useEffect(() => {
    const onMove = (e) => {
      if (!dragRef.current.dragging) return;
      if (e.cancelable) e.preventDefault();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const size = window.innerWidth <= 600 ? 56 : 64;
      let x = clientX - dragRef.current.offsetX;
      let y = clientY - dragRef.current.offsetY;
      x = Math.max(8, Math.min(window.innerWidth - size - 8, x));
      y = Math.max(8, Math.min(window.innerHeight - size - 8, y));
      if (Math.abs(x - (pos.x ?? x)) > 4 || Math.abs(y - (pos.y ?? y)) > 4) {
        dragRef.current.moved = true;
      }
      setPos({ x, y });
    };
    const onUp = () => {
      dragRef.current.dragging = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [pos.x, pos.y]);

  const startDrag = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragRef.current.dragging = true;
    dragRef.current.moved = false;
    dragRef.current.offsetX = clientX - (pos.x ?? 0);
    dragRef.current.offsetY = clientY - (pos.y ?? 0);
  };

  const onFabClick = () => {
    if (dragRef.current.moved) return;
    setOpen((v) => !v);
  };

  const sendMessage = async (preset) => {
    const text = (preset || input).trim();
    if (!text || sending) return;
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", text },
    ]);
    setInput("");
    setSending(true);
    try {
      const reply = await callGroq(messages, text);
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "assistant", text: reply },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: "assistant",
          text:
            "Sorry — I couldn't reply right now.\n" +
            (err.message || "Unknown error"),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  // Panel position near FAB on desktop; CSS handles mobile full-width
  const panelPos = {};
  if (pos.x != null && pos.y != null && window.innerWidth > 600) {
    const panelW = Math.min(380, window.innerWidth - 24);
    const panelH = Math.min(520, window.innerHeight - 120);
    let left = pos.x + 64 - panelW;
    let top = pos.y - panelH - 12;
    left = Math.max(12, Math.min(window.innerWidth - panelW - 12, left));
    top = Math.max(12, Math.min(window.innerHeight - panelH - 12, top));
    panelPos.left = left;
    panelPos.top = top;
  }

  return (
    <>
      {open && (
        <div
          className={`inventiq-panel ${dark ? "dark" : "light"}`}
          style={panelPos}
        >
          <div className="inventiq-header">
            <div className="inventiq-avatar">
              <i className="fas fa-robot"></i>
            </div>
            <div className="inventiq-header-text">
              <div className="inventiq-title">InventIQ</div>
              <div className="inventiq-sub">Smart inventory assistant</div>
            </div>
            <button
              className="inventiq-close"
              onClick={() => setOpen(false)}
              title="Close"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="inventiq-messages" ref={listRef}>
            {messages.map((m) => (
              <div
                key={m.id}
                className={`inventiq-row ${
                  m.role === "user" ? "user" : "bot"
                }`}
              >
                <div
                  className={`inventiq-bubble ${
                    m.role === "user" ? "user" : "bot"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {sending && (
              <div className="inventiq-typing">
                <i className="fas fa-spinner fa-spin"></i> InventIQ is
                thinking…
              </div>
            )}
          </div>

          {messages.length <= 2 && (
            <div className="inventiq-quick">
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q}
                  className="inventiq-chip"
                  onClick={() => sendMessage(q)}
                  disabled={sending}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <div className="inventiq-inputbar">
            <input
              className="inventiq-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask about inventory..."
              disabled={sending}
            />
            <button
              className="inventiq-send"
              onClick={() => sendMessage()}
              disabled={sending || !input.trim()}
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      )}

      <button
        className="inventiq-fab"
        style={{
          left: pos.x ?? undefined,
          top: pos.y ?? undefined,
          right: pos.x == null ? 20 : undefined,
          bottom: pos.y == null ? 20 : undefined,
        }}
        onMouseDown={startDrag}
        onTouchStart={startDrag}
        onClick={onFabClick}
        title="InventIQ — drag to move"
      >
        <i className={`fas ${open ? "fa-times" : "fa-robot"}`}></i>
      </button>
    </>
  );
}
