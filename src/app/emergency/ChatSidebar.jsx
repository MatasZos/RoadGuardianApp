"use client";

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
  onSelectConversation,
  onStartChat,
  onSendMessage,
}) {
  return (
    <>
      {!open && (
        <button onClick={() => onClose(true)} style={styles.chatButton}>
          💬
        </button>
      )}

      <div
        style={{
          ...styles.chatSidebar,
          transform: open ? "translateX(0)" : "translateX(100%)",
        }}
      >
        <div style={styles.chatHeader}>
          <strong>Rider Messages</strong>
          <button onClick={() => onClose(false)} style={styles.closeBtn}>
            ✕
          </button>
        </div>

        <div style={styles.chatBody}>
          {/* LEFT */}
          <div style={styles.chatList}>
            {conversations.map((conv) => {
              const otherUser =
                conv.participants.find((p) => p !== email) || "Unknown";

              return (
                <button
                  key={conv._id}
                  style={styles.chatListItem}
                  onClick={() => onSelectConversation(conv)}
                >
                  {otherUser}
                </button>
              );
            })}
          </div>

          {/* RIGHT */}
          <div style={styles.chatPanel}>
            <div style={styles.messagesArea}>
              {messages.map((msg, i) => {
                const isMine = msg.senderEmail === email;

                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: isMine ? "flex-end" : "flex-start",
                      gap: "4px",
                    }}
                  >
                    <div
                      style={{
                        ...styles.messageBubble,
                        ...(isMine
                          ? styles.myMessageBubble
                          : styles.otherMessageBubble),
                      }}
                    >
                      {msg.text}
                    </div>

                    <span style={styles.messageMeta}>
                      {isMine ? "You" : msg.senderEmail}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={styles.messageInputRow}>
              <input
                style={styles.chatInput}
                placeholder="Type a message..."
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSendMessage()}
              />

              <button style={styles.startBtn} onClick={onSendMessage}>
                {chatLoading ? "..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
