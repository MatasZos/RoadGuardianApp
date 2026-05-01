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
import AccountPill from "../components/AccountPill";
import UnauthedPrompt from "../components/UnauthedPrompt";

// List of issue types for the support ticket form, allowing users to categorize their issue for better support handling.
const ISSUE_TYPES = [
  "Account Issue",
  "Maintenance Records",
  "Document Reminders",
  "Emergency Feature",
  "Bug Report",
  "Other",
];

//SupportPage component that allows users to submit support tickets, view account information, and see feedback on their submission
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

  //when authentication status changes, if its no longer loading, set loaded to true to show the form or unauthenticated section
  useEffect(() => {
    if (status !== "loading") setLoaded(true);
  }, [status]);

  const unauthenticated = status === "unauthenticated";
  const name = session?.user?.name || "RoadGuardian User";
  const email = session?.user?.email || "";

  //function to show a toast notification with a status (success or error) and a message for user feedback
  function showToast(variant, message) {
    setToast({ variant, message });
  }

  //handleChange function to update the form state when the user types in the message or changes the issue type, using the name attribute of the form fields to determine which part of the state to update
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  //submitTicket function to handle the form submission, sending a POST request to the /api/support endpoint with the issue type and message, and providing user feedback based on the response
  async function submitTicket(e) {
    e.preventDefault();

    const trimmed = form.message.trim();
    if (!trimmed) {
      showToast("danger", "Please enter a message.");
      return;
    }

    //this disables the submit button and shows a loading spinner while the request is being processed to prevent multiple submissions and provide feedback that the submission is in progress
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

      // If the response is not ok, show an error toast with the message from the response or a default error message
      if (!res.ok) {
        showToast("danger", data?.error || "Failed to submit ticket");
        return;
      }
      // If the submission is successful, show a success toast and clear the message field in the form
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
      // Main container for the support page, with a title, description, and the support ticket form or unauthenticated prompt based on the user's authentication status. 
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
            // AccountPill component shows the user's email if authenticated, or a simple message if not
            <AccountPill email={unauthenticated ? null : email} />
          </div>
          <Card className="rg-section-card border-0">
            <Card.Body className="p-4">
              {!loaded || status === "loading" ? (
                <div className="d-flex justify-content-center py-4">
                  // Show a loading spinner while the authentication status is being determined
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : unauthenticated ? (
                // If the user is not authenticated, show the UnauthedPrompt component which tells the user to log in to submit a support ticket and provides a button to navigate to the login page
                <UnauthedPrompt
                  message="Please log in to submit a support ticket."
                  onLogin={() => router.push("/login")}
                />
              ) : (
                <>
                // This section provides instructions for the user on how to submit a support ticket
                  <div className="rg-support-banner d-flex align-items-center justify-content-between gap-3 p-3 rounded-3 mb-4">
                    <div>
                      //this section provides instructions for the user on how to submit a support ticket
                      <div className="fw-bold mb-1">Contact Support</div>
                      <div className="small text-body-secondary">
                        Provide as much detail as you can — what you clicked,
                        what happened, any errors.
                      </div>
                    </div>
                    // A badge with a ticket icon to visually indicate that this section is for support tickets
                    <Badge
                      bg="primary"
                      className="rg-ticket-badge px-3 py-2 fw-bold"
                    >
                      <i className="bi bi-ticket-perforated-fill me-1"></i>
                      Ticket
                    </Badge>
                  </div>

                  {/* form for submitting support tickets */}
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
                      //the email field contains the users email and shows the support team who to contact back, and is set to uneditable to prevent confusion 
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

                    // Dropdown to select the type of issue, which helps categorize the support ticket for better handling by the support team
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
                      // text area for the user to enter details about their issue, with a guide to provide detailed information for better support
                      <Form.Control
                        as="textarea"
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        rows={7}
                        placeholder="Describe the issue... (What were you doing? What did you expect? What happened?)"
                        style={{ resize: "vertical" }}
                      />
                      //tip for users to provide detailed information in the message field
                      <Form.Text className="text-body-secondary">
                        <i className="bi bi-lightbulb-fill me-1"></i>
                        Tip: include steps to reproduce and any visible error
                        messages.
                      </Form.Text>
                    </Form.Group>

                    //buttons for submitting the ticket 
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
                      //button for clearing message field
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

      //toast container for showing feedback messages to the user after submitting a ticket, such as error messages or success confirmation etc
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

      // Custom styles for the support page, including the background, form fields, and specific component styles for a consistent look and feel.
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

