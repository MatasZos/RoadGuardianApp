"use client";

import { useState } from "react";

export default function AiChat() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hey — ask me anything." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: data.error || "AI error." },
        ]);
        return;
      }

      setMessages((m) => [...m, { role: "assistant", content: data.text }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginTop: 20, background: "#0f0f0f", padding: 16, borderRadius: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>AI Assistant</div>

      <div style={{ background: "#141414", borderRadius: 10, padding: 10, height: 220, overflowY: "auto" }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <strong style={{ opacity: 0.7 }}>{m.role === "user" ? "You" : "AI"}:</strong>{" "}
            <span>{m.content}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 10,
            border: "none",
            background: "#1e1e1e",
            color: "#fff",
          }}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button
          onClick={send}
          disabled={loading}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "none",
            background: "#3498db",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}