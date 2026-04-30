// ─── Emergency feature: chat sidebar 
// Slide-out panel where the rider in distress and any helpers message each other in real time. 

"use client";
import { useEffect, useRef } from "react";
import {Offcanvas,Form,Button,InputGroup,Stack,Spinner,Alert,Badge,} from "react-bootstrap";
// Reusable message bubble component defined at the bottom of the file.
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
  // Auto-scroll the messages pane to the bottom whenever a new message arrives or the user opens a conversation.
  const messagesEndRef = useRef(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedConversation?._id]);

  return (
    <>
      {/*Action button*/}
      {!open && (
        <Button
          variant="primary"
          onClick={() => onClose(true)}
          aria-label="Open rider messages"
          className="rg-chat-fab shadow-lg"
        >
          <i className="bi bi-chat-dots-fill fs-4"></i>
        </Button>
      )}

      {/* Message panel */}
      <Offcanvas
        show={open}
        onHide={() => onClose(false)}
        placement="end"
        backdrop={false}//User needs to see the map
        scroll={true}// Allow the page behind to keep scrolling
        className="rg-chat-offcanvas bg-dark text-light"
      >
        <Offcanvas.Header
          closeButton
          closeVariant="white"
          className="border-bottom border-secondary-subtle"
        >
          <Offcanvas.Title className="d-flex align-items-center gap-2">
            <i className="bi bi-chat-dots-fill text-primary"></i>
            Rider Messages
          </Offcanvas.Title>
        </Offcanvas.Header>

        {/* The body is a CSS grid: list on the left, message panel on the right.
            On very narrow screens we stack — see the styled-jsx block below. */}
        <Offcanvas.Body className="p-0 d-flex flex-column">
          <div className="rg-chat-grid flex-grow-1 d-grid">
            {/* Conversation list and new chat form */}
            <div className="rg-chat-list border-end border-secondary-subtle p-3 d-flex flex-column">
              {/* Start a new chat by email */}
              <div className="mb-3">
                <Form.Label className="small fw-semibold text-body-secondary text-uppercase mb-1">
                  New Chat
                </Form.Label>
                <InputGroup size="sm">
                  <Form.Control
                    type="email"
                    placeholder="rider@email"
                    value={newChatEmail}
                    onChange={(e) => setNewChatEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && onStartChat()}
                  />
                  <Button
                    variant="primary"
                    onClick={onStartChat}
                    disabled={!newChatEmail.trim()}
                    aria-label="Start chat"
                  >
                    <i className="bi bi-plus-lg"></i>
                  </Button>
                </InputGroup>
              </div>

              {/* Authentication errors etc*/}
              {chatError && (
                <Alert variant="danger" className="py-2 px-3 small mb-2">
                  <i className="bi bi-exclamation-triangle-fill me-1"></i>
                  {chatError}
                </Alert>
              )}

              {/* Existing conversations */}
              <div className="small fw-semibold text-body-secondary text-uppercase mb-2">
                Conversations
              </div>
              <div className="overflow-auto flex-grow-1">
                {conversations.length === 0 ? (
                  <div className="text-body-secondary small fst-italic">
                    No conversations yet.
                  </div>
                ) : (
                  <Stack gap={2}>
                    {conversations.map((conv) => {
                      // For each conversation, find the "other user" (the one who isn't the current rider) to display as the button label.
                      const otherUser =
                        conv.participants.find((p) => p !== email) || "Unknown";
                      const isActive =
                        selectedConversation?._id === conv._id;
                        // Conversation button is highlighted if it's the active one. Clicking it selects that conversation and loads the messages in the right pane.
                      return (
                        <Button
                          key={conv._id}
                          variant={isActive ? "primary" : "outline-secondary"}
                          size="sm"
                          className="text-start text-truncate"
                          onClick={() => onSelectConversation(conv)}
                          title={otherUser}
                        >
                          <i className="bi bi-person-fill me-2"></i>
                          {otherUser}
                        </Button>
                      );
                    })}
                  </Stack>
                )}
              </div>
            </div>

            {/*Active conversation panel*/}
            <div className="rg-chat-panel d-flex flex-column">
              {!selectedConversation ? (
                // Nothing picked yet, shows a placeholder instead
                <div className="d-flex flex-column align-items-center justify-content-center h-100 text-body-secondary p-4 text-center">
                  <i className="bi bi-chat-square-dots fs-1 mb-3 opacity-50"></i>
                  <div className="small">
                    Pick a conversation on the left, or start a new chat.
                  </div>
                </div>
              ) : (
                <>
                  {/* Messages scrollable area */}
                  <div className="rg-chat-messages flex-grow-1 overflow-auto p-3">
                    {messages.length === 0 ? (
                      <div className="text-center text-body-secondary small mt-3">
                        No messages yet — say hi.
                      </div>
                    ) : (
                      <Stack gap={3}>
                        {messages.map((msg, i) => (
                          <MessageBubble
                            key={i}
                            message={msg}
                            isMine={msg.senderEmail === email}
                          />
                        ))}
                      </Stack>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input + send row, pinned to the bottom of the panel */}
                  <div className="border-top border-secondary-subtle p-2">
                    <InputGroup>
                      <Form.Control
                        placeholder="Type a message..."
                        value={chatText}
                        onChange={(e) => setChatText(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && !e.shiftKey && onSendMessage()
                        }
                        disabled={chatLoading}
                      />
                      <Button
                        variant="primary"
                        onClick={onSendMessage}
                        disabled={chatLoading || !chatText.trim()}
                        aria-label="Send"
                      >
                        {chatLoading ? (
                          <Spinner animation="border" size="sm" />
                        ) : (
                          <i className="bi bi-send-fill"></i>
                        )}
                      </Button>
                    </InputGroup>
                  </div>
                </>
              )}
            </div>
          </div>
        </Offcanvas.Body>
      </Offcanvas>

      {/*Component styles*/}
      <style>{`
        /* Floating action button positioned bottom-right of the page */
        .rg-chat-fab {
          position: fixed;
          right: 20px;
          bottom: 20px;
          width: 58px;
          height: 58px;
          border-radius: 16px !important;
          padding: 0;
          z-index: 200;
        }
        /* Width of the offcanvas panel — slightly wider than default to fit
           the two-column layout comfortably. */
        .rg-chat-offcanvas {
          width: min(520px, 100vw) !important;
        }
        /* Two-column grid: conversation list, message panel.
           Stack vertically on narrow screens. */
        .rg-chat-grid {
          grid-template-columns: 165px 1fr;
        }
        @media (max-width: 460px) {
          .rg-chat-grid {
            grid-template-columns: 1fr;
          }
          .rg-chat-list {
            border-end: none;
            border-bottom: 1px solid var(--bs-border-color);
            max-height: 220px;
          }
        }
        /* Ensure the panel takes up the offcanvas body height fully */
        .rg-chat-panel {
          min-height: 0; /* allow flex child to shrink */
          background: rgba(255, 255, 255, 0.02);
        }
        .rg-chat-messages {
          min-height: 0;
        }
      `}</style>
    </>
  );
}

// Single message bubble and styled
function MessageBubble({ message, isMine }) {
  return (
    <div
      className={`d-flex flex-column ${
        isMine ? "align-items-end" : "align-items-start"
      }`}
    >
      <div
        className={`px-3 py-2 rounded-3 ${
          isMine
            ? "bg-primary text-white"
            : "bg-body-tertiary border border-secondary-subtle"
        }`}
        style={{
          maxWidth: "85%",
          borderBottomRightRadius: isMine ? "0.25rem" : undefined,
          borderBottomLeftRadius: isMine ? undefined : "0.25rem",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {message.text}
      </div>
      <small className="text-body-secondary mt-1 px-1">
        {isMine ? "You" : message.senderEmail}
      </small>
    </div>
  );
}
