"use client";

import { useState, useRef, useEffect } from "react";
import { Card, Form, Button, InputGroup, Spinner, Stack } from "react-bootstrap";

export default function AssistantChat() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hey — I'm your RoadGuardian assistant. Ask me anything about your bike, the road, or what to do in an emergency.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  // Keep the latest message in view.
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    setMessages((current) => [...current, { role: "user", content: text }]);
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
        setMessages((current) => [
          ...current,
          {
            role: "assistant",
            content: data.error || "Sorry, the AI is unreachable right now.",
            isError: true,
          },
        ]);
        return;
      }

      setMessages((current) => [
        ...current,
        { role: "assistant", content: data.text },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "Network error — check your connection and try again.",
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <Card className="shadow-sm mt-3">
      <Card.Header className="d-flex align-items-center gap-2 py-3">
        <div className="rg-ai-avatar">
          <i className="bi bi-robot"></i>
        </div>
        <div>
          <div className="fw-semibold">AI Assistant</div>
          <small className="text-body-secondary">Quick help for riders</small>
        </div>
      </Card.Header>

      <Card.Body className="p-0">
        <div
          ref={scrollRef}
          className="px-3 py-3"
          style={{ height: 280, overflowY: "auto" }}
        >
          <Stack gap={3}>
            {messages.map((message, i) => (
              <ChatBubble key={i} message={message} />
            ))}

            {loading && (
              <div className="d-flex align-items-center gap-2 text-body-secondary small">
                <Spinner animation="grow" size="sm" />
                <Spinner animation="grow" size="sm" />
                <Spinner animation="grow" size="sm" />
              </div>
            )}
          </Stack>
        </div>
      </Card.Body>

      <Card.Footer className="p-3">
        <InputGroup>
          <Form.Control
            as="textarea"
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about maintenance, safety, an emergency..."
            disabled={loading}
            style={{ resize: "none" }}
          />
          <Button
            variant="primary"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
          >
            {loading ? (
              <Spinner animation="border" size="sm" />
            ) : (
              <>
                <i className="bi bi-send-fill"></i>
                <span className="visually-hidden">Send</span>
              </>
            )}
          </Button>
        </InputGroup>
      </Card.Footer>

      <style>{`
        .rg-ai-avatar {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--bs-primary), #6610f2);
          color: white;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
        }
      `}</style>
    </Card>
  );
}

function ChatBubble({ message }) {
  const isUser = message.role === "user";
  const isError = message.isError;

  return (
    <div className={`d-flex ${isUser ? "justify-content-end" : "justify-content-start"}`}>
      <div
        className={`px-3 py-2 rounded-3 ${
          isUser
            ? "bg-primary text-white"
            : isError
              ? "bg-danger-subtle text-danger-emphasis border border-danger-subtle"
              : "bg-body-tertiary"
        }`}
        style={{ maxWidth: "85%", whiteSpace: "pre-wrap" }}
      >
        {!isUser && !isError && (
          <div className="small text-body-secondary fw-semibold mb-1">
            <i className="bi bi-robot me-1"></i>Assistant
          </div>
        )}
        {isError && (
          <div className="small fw-semibold mb-1">
            <i className="bi bi-exclamation-triangle-fill me-1"></i>Error
          </div>
        )}
        <div>{message.content}</div>
      </div>
    </div>
  );
}
