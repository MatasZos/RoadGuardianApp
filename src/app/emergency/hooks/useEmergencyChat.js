import { useEffect, useState } from "react";
import { getAblyClient } from "@/lib/ablyClient";

// Encapsulates the conversation/messages state and Ably wiring used by the
// chat sidebar on the emergency page. Returns a flat object the page can
// thread straight into <ChatSidebar />.
export function useEmergencyChat({ email, setChatOpen }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatText, setChatText] = useState("");
  const [newChatEmail, setNewChatEmail] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");

  async function loadConversations() {
    if (!email) return;
    const res = await fetch("/api/conversations", {
      headers: { "x-user-email": email },
      cache: "no-store",
    });
    const data = await res.json().catch(() => []);
    setConversations(Array.isArray(data) ? data : []);
  }

  async function loadMessages(conversationId) {
    if (!email || !conversationId) return;
    const res = await fetch(
      `/api/messages?conversationId=${encodeURIComponent(conversationId)}`,
      { headers: { "x-user-email": email }, cache: "no-store" }
    );
    const data = await res.json().catch(() => []);
    setMessages(Array.isArray(data) ? data : []);
  }

  // Open the panel with a conversation, creating one server-side if these
  // two users have never spoken before.
  async function startOrOpenConversation(otherUserEmail, presetText = "") {
    if (!email || !otherUserEmail) return;
    const lower = otherUserEmail.trim().toLowerCase();
    if (!lower || lower === email) return;

    setChatOpen(true);
    setChatError("");

    let conversation =
      conversations.find((c) => c.participants?.includes(lower)) || null;

    if (!conversation) {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: email, otherUserEmail: lower }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setChatError(data.error || "Could not start chat.");
        return;
      }
      conversation = data;
      await loadConversations();
    }

    setSelectedConversation(conversation);
    await loadMessages(String(conversation._id));
    if (presetText) setChatText(presetText);
  }

  async function handleStartChat() {
    setChatError("");
    const otherUserEmail = newChatEmail.trim().toLowerCase();
    if (!email) return;
    if (!otherUserEmail) {
      setChatError("Enter an email address to start a chat.");
      return;
    }
    if (otherUserEmail === email) {
      setChatError("You cannot message yourself.");
      return;
    }

    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userEmail: email, otherUserEmail }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setChatError(data.error || "Could not start chat.");
      return;
    }

    await loadConversations();
    setSelectedConversation(data);
    setNewChatEmail("");
    await loadMessages(String(data._id));

    // Notify both sides so the new conversation appears immediately.
    try {
      const ably = getAblyClient();
      await ably.channels
        .get(`user:${otherUserEmail}`)
        .publish("new-conversation", {
          conversationId: String(data._id),
          with: email,
        });
      await ably.channels.get(`user:${email}`).publish("conversation-updated", {
        conversationId: String(data._id),
      });
    } catch (err) {
      console.error("ABLY start chat publish error:", err);
    }
  }

  async function handleSelectConversation(conversation) {
    setSelectedConversation(conversation);
    await loadMessages(String(conversation._id));
    setChatError("");
  }

  async function handleSendMessage() {
    const text = chatText.trim();
    if (!text || !selectedConversation || !email) return;

    const otherUser = selectedConversation.participants.find(
      (p) => p !== email
    );
    if (!otherUser) {
      setChatError("Could not determine who to send this message to.");
      return;
    }

    setChatLoading(true);
    setChatError("");

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId: String(selectedConversation._id),
        senderEmail: email,
        receiverEmail: otherUser,
        text,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setChatLoading(false);

    if (!res.ok) {
      setChatError(data.error || "Could not send message.");
      return;
    }

    setChatText("");
    await loadConversations();
    await loadMessages(String(selectedConversation._id));

    // Realtime fan-out: the conversation channel for the message itself,
    // plus a "conversation-updated" ping on each user's channel so both
    // sides' conversation lists refresh.
    try {
      const ably = getAblyClient();
      const convChannel = ably.channels.get(
        `conversation:${selectedConversation._id}`
      );
      await convChannel.publish("new-message", {
        conversationId: String(selectedConversation._id),
        senderEmail: email,
        receiverEmail: otherUser,
        text,
      });
      await ably.channels.get(`user:${email}`).publish("conversation-updated", {
        conversationId: String(selectedConversation._id),
      });
      await ably.channels
        .get(`user:${otherUser}`)
        .publish("conversation-updated", {
          conversationId: String(selectedConversation._id),
        });
    } catch (err) {
      console.error("ABLY send publish error:", err);
    }
  }

  // Per-user channel: someone started a new chat with us, or sent a message.
  useEffect(() => {
    if (!email) return;
    const channel = getAblyClient().channels.get(`user:${email}`);
    const handler = (msg) => {
      if (msg?.name === "conversation-updated" || msg?.name === "new-conversation") {
        loadConversations();
      }
    };
    channel.subscribe(handler);
    return () => channel.unsubscribe(handler);
  }, [email]);

  // Per-conversation channel: refresh messages when the active chat moves.
  useEffect(() => {
    const id = selectedConversation?._id;
    if (!id || !email) return;
    const channel = getAblyClient().channels.get(`conversation:${id}`);
    const handler = (msg) => {
      if (msg?.name === "new-message") {
        loadMessages(id);
        loadConversations();
      }
    };
    channel.subscribe(handler);
    return () => channel.unsubscribe(handler);
  }, [selectedConversation?._id, email]);

  return {
    conversations,
    selectedConversation,
    messages,
    chatText,
    setChatText,
    newChatEmail,
    setNewChatEmail,
    chatLoading,
    chatError,
    loadConversations,
    startOrOpenConversation,
    handleStartChat,
    handleSelectConversation,
    handleSendMessage,
  };
}
