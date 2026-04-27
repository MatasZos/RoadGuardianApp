"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Container,
  Card,
  Form,
  Button,
  Row,
  Col,
  Badge,
  Spinner,
  Stack,
  Toast,
  ToastContainer,
} from "react-bootstrap";
import Navbar from "../components/Navbar";

const ISSUE_TYPES = [
  "Account Issue",
  "Maintenance Records",
  "Document Reminders",
  "Emergency Feature",
  "Bug Report",
  "Other",
];

export default function SupportPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [submitting, setSubmitting] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    issueType: "Bug Report",
    message: "",
  });

  useEffect(() => {
    if (status !== "loading") setLoaded(true);
  }, [status]);

  const unauthenticated = status === "unauthenticated";
  const name = session?.user?.name || "RoadGuardian User";
  const email = session?.user?.email || "";

  function showToast(variant, message) {
    setToast({ variant, message });
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function submitTicket(e) {
    e.preventDefault();

    const trimmed = form.message.trim();
    if (!trimmed) {
      showToast("danger", "Please enter a message.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueType: form.issueType,
          message: trimmed,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        showToast("danger", data?.error || "Failed to submit ticket");
        return;
      }

      showToast("success", "Ticket submitted — we'll get back to you soon.");
      setForm((prev) => ({ ...prev, message: "" }));
    } catch {
      showToast("danger", "Server error while submitting ticket");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Navbar />

      <div className="rg-support-page min-vh-100 py-4 py-md-5">
        <Container style={{ maxWidth: 1100 }}>
          <div className="d-flex flex-column flex-md-row align-items-md-end justify-content-between gap-3 mb-4">
            <div>
              <h1 className="rg-page-title fw-bold mb-2">
                <i className="bi bi-life-preserver me-2"></i>Support
              </h1>
              <p className="text-body-secondary mb-0" style={{ maxWidth: 720 }}>
                Submit an issue and we'll review it. Your ticket is linked to
                your account.
              </p>
            </div>
            <Badge
              pill
              bg="dark"
              className="rg-account-pill px-3 py-2 d-inline-flex align-items-center gap-2"
            >
              <span
                className={`rg-status-dot ${
                  unauthenticated ? "rg-status-off" : "rg-status-on"
                }`}
              ></span>
              <span className="text-body-secondary fw-normal small">
                {unauthenticated ? "Signed out" : `Signed in as: ${email}`}
              </span>
            </Badge>
          </div>
          <Card className="rg-section-card border-0">
            <Card.Body className="p-4">
              {!loaded || status === "loading" ? (
                <div className="d-flex justify-content-center py-4">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : unauthenticated ? (
                <UnauthedPrompt onLogin={() => router.push("/login")} />
              ) : (
                <>
                  <div className="rg-support-banner d-flex align-items-center justify-content-between gap-3 p-3 rounded-3 mb-4">
                    <div>
                      <div className="fw-bold mb-1">Contact Support</div>
                      <div className="small text-body-secondary">
                        Provide as much detail as you can — what you clicked,
                        what happened, any errors.
                      </div>
                    </div>
                    <Badge
                      bg="primary"
                      className="rg-ticket-badge px-3 py-2 fw-bold"
                    >
                      <i className="bi bi-ticket-perforated-fill me-1"></i>
                      Ticket
                    </Badge>
                  </div>

                  {/* Form */}
                  <Form onSubmit={submitTicket}>
                    <Row className="g-3 mb-3">
                      <Col xs={12} md={6}>
                        <Form.Group>
                          <Form.Label className="text-body-secondary small fw-semibold">
                            NAME
                          </Form.Label>
                          <div className="rg-readonly-field">
                            <i className="bi bi-person-fill me-2 text-body-secondary"></i>
                            {name}
                          </div>
                        </Form.Group>
                      </Col>
                      <Col xs={12} md={6}>
                        <Form.Group>
                          <Form.Label className="text-body-secondary small fw-semibold">
                            EMAIL
                          </Form.Label>
                          <div className="rg-readonly-field">
                            <i className="bi bi-envelope-fill me-2 text-body-secondary"></i>
                            {email}
                          </div>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3" controlId="supportIssueType">
                      <Form.Label className="text-body-secondary small fw-semibold">
                        ISSUE TYPE
                      </Form.Label>
                      <Form.Select
                        name="issueType"
                        value={form.issueType}
                        onChange={handleChange}
                      >
                        {ISSUE_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="supportMessage">
                      <div className="d-flex justify-content-between align-items-baseline">
                        <Form.Label className="text-body-secondary small fw-semibold mb-0">
                          MESSAGE
                        </Form.Label>
                        <small className="text-body-secondary">
                          {form.message.length} chars
                        </small>
                      </div>
                      <Form.Control
                        as="textarea"
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        rows={7}
                        placeholder="Describe the issue... (What were you doing? What did you expect? What happened?)"
                        style={{ resize: "vertical" }}
                      />
                      <Form.Text className="text-body-secondary">
                        <i className="bi bi-lightbulb-fill me-1"></i>
                        Tip: include steps to reproduce and any visible error
                        messages.
                      </Form.Text>
                    </Form.Group>

                    <Stack direction="horizontal" gap={2} className="flex-wrap">
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <Spinner
                              animation="border"
                              size="sm"
                              className="me-2"
                            />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-send-fill me-2"></i>
                            Submit Ticket
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline-secondary"
                        onClick={() =>
                          setForm((p) => ({ ...p, message: "" }))
                        }
                        disabled={submitting || !form.message}
                      >
                        Clear
                      </Button>
                    </Stack>
                  </Form>
                </>
              )}
            </Card.Body>
          </Card>

          <p className="text-center text-body-secondary small mt-3 mb-0">
            <i className="bi bi-shield-lock-fill me-1"></i>
            Tickets are stored securely and reviewed by the team.
          </p>
        </Container>
      </div>

      <ToastContainer position="bottom-end" className="p-3">
        <Toast
          show={!!toast}
          onClose={() => setToast(null)}
          delay={3500}
          autohide
          bg={toast?.variant}
        >
          <Toast.Body className="text-white d-flex align-items-center gap-2">
            <i
              className={`bi ${
                toast?.variant === "success"
                  ? "bi-check-circle-fill"
                  : "bi-exclamation-triangle-fill"
              }`}
            ></i>
            {toast?.message}
          </Toast.Body>
        </Toast>
      </ToastContainer>

      <style>{`
        .rg-support-page {
          background: radial-gradient(circle at top, #1b1026, #000);
          color: #fff;
        }
        .rg-page-title {
          font-size: clamp(1.8rem, 3.5vw, 2.2rem);
          letter-spacing: -0.02em;
        }
        .rg-section-card {
          background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03)) !important;
          border: 1px solid rgba(255,255,255,0.10) !important;
          box-shadow: 0 18px 60px rgba(0,0,0,0.6);
        }
        .rg-account-pill {
          background: rgba(255,255,255,0.06) !important;
          border: 1px solid rgba(255,255,255,0.10);
        }
        .rg-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          display: inline-block;
        }
        .rg-status-on {
          background: var(--bs-primary);
          box-shadow: 0 0 12px rgba(var(--bs-primary-rgb), 0.55);
        }
        .rg-status-off {
          background: #6b7280;
        }
        .rg-support-banner {
          background: linear-gradient(90deg, rgba(var(--bs-primary-rgb), 0.18), rgba(0,0,0,0.15));
          border: 1px solid rgba(var(--bs-primary-rgb), 0.22);
        }
        .rg-readonly-field {
          width: 100%;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(0,0,0,0.30);
          color: rgba(255,255,255,0.90);
          font-size: 0.95rem;
        }
        .rg-support-page .form-control,
        .rg-support-page .form-select {
          background: rgba(0,0,0,0.35);
          border-color: rgba(255,255,255,0.12);
          color: #fff;
        }
        .rg-support-page .form-control:focus,
        .rg-support-page .form-select:focus {
          background: rgba(0,0,0,0.45);
          border-color: var(--bs-primary);
          box-shadow: 0 0 0 0.2rem rgba(var(--bs-primary-rgb), 0.18);
          color: #fff;
        }
        .rg-support-page .form-control::placeholder {
          color: rgba(255,255,255,0.4);
        }
      `}</style>
    </>
  );
}

function UnauthedPrompt({ onLogin }) {
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
        <p className="text-body-secondary small mb-3">
          Please log in to submit a support ticket.
        </p>
        <Button variant="danger" onClick={onLogin}>
          <i className="bi bi-box-arrow-in-right me-2"></i>
          Go to Login
        </Button>
      </div>
    </div>
  );
}