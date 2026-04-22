"use client";

import { QUICK_REPLIES, STATUS_LABELS } from "./constants";
import { prettify } from "./utils";
import { styles } from "./styles";

export default function ChatSidebar(props) {
  const {
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
  } = props;

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

          <div style={styles.chatPanel}>
            <div style={styles.messagesArea}>
              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={
                    msg.senderEmail === email
                      ? styles.myMessageBubble
                      : styles.otherMessageBubble
                  }
                >
                  {msg.text}
                </div>
              ))}
            </div>

            <div style={styles.messageInputRow}>
              <input
                style={styles.chatInput}
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
              />
              <button style={styles.startBtn} onClick={onSendMessage}>
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
