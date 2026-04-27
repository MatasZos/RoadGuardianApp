"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Form,
  Button,
  Alert,
  InputGroup,
  Spinner,
  Row,
  Col,
} from "react-bootstrap";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function updateField(field, value) {
    if (message) setMessage("");
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleRegister(e) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        accountType: "user",
      }),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (res.ok) {
      setIsSuccess(true);
      setMessage("Account created — redirecting to login...");
      setTimeout(() => router.push("/login"), 900);
    } else {
      setIsSuccess(false);
      setMessage(data.error || "Registration failed");
    }
  }

  return (
    <div className="rg-auth-page rg-auth-register">
      <div className="rg-glass-card">
        <div className="text-center mb-3">
          <img
            src="/logo.png"
            alt="RoadGuardian"
            className="rg-auth-logo"
          />
        </div>

        <div className="text-center mb-4">
          <h1 className="rg-auth-title text-white mb-2">Create account</h1>
          <p className="text-body-secondary mb-0">
            Join RoadGuardian and start managing your bike, maintenance and
            reminders.
          </p>
        </div>

        <Form onSubmit={handleRegister}>
          <Form.Group className="mb-3" controlId="registerFullName">
            <Form.Label className="fw-semibold text-body-secondary small">
              Full Name
            </Form.Label>
            <InputGroup size="lg">
              <InputGroup.Text>
                <i className="bi bi-person-fill"></i>
              </InputGroup.Text>
              <Form.Control
                placeholder="Enter your full name"
                value={form.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
                required
                autoComplete="name"
              />
            </InputGroup>
          </Form.Group>

          <Form.Group className="mb-3" controlId="registerEmail">
            <Form.Label className="fw-semibold text-body-secondary small">
              Email
            </Form.Label>
            <InputGroup size="lg">
              <InputGroup.Text>
                <i className="bi bi-envelope-fill"></i>
              </InputGroup.Text>
              <Form.Control
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                required
                autoComplete="email"
              />
            </InputGroup>
          </Form.Group>

          <Row className="g-3">
            <Col xs={12} md={6}>
              <Form.Group className="mb-3" controlId="registerPassword">
                <Form.Label className="fw-semibold text-body-secondary small">
                  Password
                </Form.Label>
                <InputGroup size="lg">
                  <Form.Control
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={form.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    required
                    autoComplete="new-password"
                    minLength={6}
                  />
                  <Button
                    variant="outline-secondary"
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    tabIndex={-1}
                  >
                    <i
                      className={`bi ${
                        showPassword ? "bi-eye-slash" : "bi-eye"
                      }`}
                    ></i>
                  </Button>
                </InputGroup>
              </Form.Group>
            </Col>

            <Col xs={12} md={6}>
              <Form.Group className="mb-3" controlId="registerPhone">
                <Form.Label className="fw-semibold text-body-secondary small">
                  Phone Number
                </Form.Label>
                <InputGroup size="lg">
                  <InputGroup.Text>
                    <i className="bi bi-telephone-fill"></i>
                  </InputGroup.Text>
                  <Form.Control
                    type="tel"
                    placeholder="+353..."
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    required
                    autoComplete="tel"
                  />
                </InputGroup>
              </Form.Group>
            </Col>
          </Row>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-100 mt-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Creating account...
              </>
            ) : (
              <>
                <i className="bi bi-person-plus-fill me-2"></i>Register
              </>
            )}
          </Button>
        </Form>

        {message && (
          <Alert
            variant={isSuccess ? "success" : "danger"}
            className="mt-3 mb-0 text-center"
          >
            <i
              className={`bi ${
                isSuccess
                  ? "bi-check-circle-fill"
                  : "bi-exclamation-triangle-fill"
              } me-2`}
            ></i>
            {message}
          </Alert>
        )}

        <div className="text-center mt-4">
          <span className="text-body-secondary small">
            Already have an account?{" "}
          </span>
          <Button
            variant="link"
            className="p-0 small fw-bold text-decoration-underline"
            style={{ color: "#fff" }}
            onClick={() => router.push("/login")}
          >
            Login here
          </Button>
        </div>
      </div>
    </div>
  );
}