"use client";

import { Button } from "react-bootstrap";

// Shown on pages that require auth when the user isn't signed in. Caller
// passes their own `message` because the wording differs page to page.
export default function UnauthedPrompt({ message, onLogin }) {
  return (
    <div className="d-flex gap-3 align-items-start">
      <div
        className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
        style={{
          width: 44,
          height: 44,
          background: "rgba(231,76,60,0.12)",
          border: "1px solid rgba(231,76,60,0.25)",
          color: "#e74c3c",
        }}
      >
        <i className="bi bi-exclamation-lg fs-4"></i>
      </div>
      <div>
        <div className="fw-bold mb-1">You're not signed in</div>
        <p className="text-body-secondary small mb-3">{message}</p>
        <Button variant="danger" onClick={onLogin}>
          <i className="bi bi-box-arrow-in-right me-2"></i>
          Go to Login
        </Button>
      </div>
    </div>
  );
}
