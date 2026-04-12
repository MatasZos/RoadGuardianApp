import { QUICK_REPLIES, STATUS_LABELS } from "./constants";
import { prettify } from "./utils";
import { styles } from "./styles";

export default function ChatSidebar({
  open,
  onClose,
  email,
  conversations,
  selectedConversation,
  messages,
  chatText,
  setChatText,
  newChatEmail,
  setNewChatEmail,
  chatLoading,
  chatError,
  selectedIncidentContext,
  onSelectConversation,
  onStartChat,
  onSendMessage,
}) {
  return (
    <>
      <button onClick={() => onClose(!open)} style={styles.chatButton}>💬</button>

      <div style={{ ...styles.chatSidebar, transform: open ? "translateX(0)" : "translateX(100%)" }}>
        <div style={styles.chatHeader}>
          <strong>Rider Messages</strong>
          <button onClick={() => onClose(false)} style={styles.closeBtn}>✕</button>
        </div>

        {selectedIncidentContext && (
          <div style={styles.incidentChatHeader}>
            <div style={{ fontWeight: 700 }}>
              Active incident chat: {prettify(selectedIncidentContext.type)}
            </div>
            <div style={{ color: "#cbd5e1", fontSize: "0.85rem", marginTop: 4 }}>
              Rider: {selectedIncidentContext.userName} • Status:{" "}
              {STATUS_LABELS[selectedIncidentContext.status] || selectedIncidentContext.status}
            </div>
            <div style={styles.quickReplyWrap}>
              {QUICK_REPLIES.map((reply) => (
                <button key={reply} style={styles.quickReplyBtn} onClick={() => setChatText(reply)}>
                  {reply}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={styles.newChatBox}>
          <input
            style={styles.chatInput}
            placeholder="Start chat by email"
            value={newChatEmail}
            onChange={(e) => setNewChatEmail(e.target.value)}
          />
          <button style={styles.startBtn} onClick={onStartChat}>Start</button>
        </div>

        {chatError && <div style={styles.chatError}>{chatError}</div>}

        <div style={styles.chatBody}>
          {/* Conversation list */}
          <div style={styles.chatList}>
            {conversations.length === 0 ? (
              <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>No conversations yet</p>
            ) : (
              conversations.map((conv) => {
                const otherUser = conv.participants.find((p) => p !== email) || "Unknown";
                const isActive  = String(selectedConversation?._id) === String(conv._id);
                return (
                  <button
                    key={String(conv._id)}
                    style={{ ...styles.chatListItem, ...(isActive ? styles.chatListItemActive : {}) }}
                    onClick={() => onSelectConversation(conv)}
                  >
                    <div style={{ fontWeight: "700", color: "#fff" }}>{otherUser}</div>
                    <div style={styles.chatListSnippet}>{conv.lastMessage || "No messages yet"}</div>
                  </button>
                );
              })
            )}
          </div>

          {/* Message panel */}
          <div style={styles.chatPanel}>
            {!selectedConversation ? (
              <div style={styles.emptyChat}>Select a conversation</div>
            ) : (
              <>
                <div style={styles.messagesArea}>
                  {messages.length === 0 ? (
                    <p style={{ color: "#94a3b8" }}>No messages yet</p>
                  ) : (
                    messages.map((msg, i) => {
                      const isMine = msg.senderEmail === email;
                      return (
                        <div
                          key={i}
                          style={{ display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start", gap: "4px" }}
                        >
                          <div style={{ ...styles.messageBubble, ...(isMine ? styles.myMessageBubble : styles.otherMessageBubble) }}>
                            {msg.text}
                          </div>
                          <span style={styles.messageMeta}>{isMine ? "You" : msg.senderEmail}</span>
                        </div>
                      );
                    })
                  )}
                </div>

                <div style={styles.messageInputRow}>
                  <input
                    style={styles.chatInput}
                    placeholder="Type a message..."
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") onSendMessage(); }}
                  />
                  <button style={styles.startBtn} onClick={onSendMessage} disabled={chatLoading}>
                    {chatLoading ? "..." : "Send"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
