"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Form,
  Button,
  Alert,
  InputGroup,
  Spinner,
} from "react-bootstrap";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.ok) {
      setIsSuccess(true);
      setMessage("Login successful — redirecting...");
      setTimeout(() => router.push("/home"), 600);
    } else {
      setIsSuccess(false);
      setMessage("Invalid email or password");
    }
  }

  function clearMessage() {
    if (message) setMessage("");
  }

  return (
    <div className="rg-auth-page">
      <div className="rg-glass-card">
        <div className="text-center mb-3">
          <img
            src="/logo.png"
            alt="RoadGuardian"
            className="rg-auth-logo"
          />
        </div>

        <div className="text-center mb-4">
          <h1 className="rg-auth-title text-white mb-2">Welcome back</h1>
          <p className="text-body-secondary mb-0">
            Sign in to continue to your RoadGuardian dashboard
          </p>
        </div>

        <Form onSubmit={handleLogin}>
          <Form.Group className="mb-3" controlId="loginEmail">
            <Form.Label className="fw-semibold text-body-secondary small">
              Email
            </Form.Label>
            <Form.Control
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                clearMessage();
                setEmail(e.target.value);
              }}
              required
              autoComplete="email"
              size="lg"
            />
          </Form.Group>

          <Form.Group className="mb-4" controlId="loginPassword">
            <Form.Label className="fw-semibold text-body-secondary small">
              Password
            </Form.Label>
            <InputGroup size="lg">
              <Form.Control
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  clearMessage();
                  setPassword(e.target.value);
                }}
                required
                autoComplete="current-password"
              />
              <Button
                variant="outline-secondary"
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                <i
                  className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}
                ></i>
              </Button>
            </InputGroup>
          </Form.Group>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-100"
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Logging in...
              </>
            ) : (
              <>
                <i className="bi bi-box-arrow-in-right me-2"></i>Login
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
            Don't have an account?{" "}
          </span>
          <Button
            variant="link"
            className="p-0 small fw-bold text-decoration-underline"
            style={{ color: "#fff" }}
            onClick={() => router.push("/register")}
          >
            Register here
          </Button>
        </div>
      </div>
    </div>
  );
}