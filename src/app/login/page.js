"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleLogin(e) {
    e.preventDefault();

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("userFullName", data.fullName);
      localStorage.setItem("userEmail", data.email);
      localStorage.setItem("userMotorbike", data.motorbike || ""); // ✅ added

      setMessage("Login successful");
      setTimeout(() => router.push("/home"), 1200);
    } else {
      setMessage(data.error || "Login failed");
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <img src="/logo.png" alt="RoadGuardian" style={styles.logo} />

        <h1 style={styles.title}>Welcome to RoadGuardian</h1>

        <form onSubmit={handleLogin} style={styles.form}>
          <input
            style={styles.input}
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            style={styles.input}
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button style={styles.button}>Login</button>
        </form>

        {message && <p style={styles.message}>{message}</p>}

        <p style={styles.registerText}>
          Don’t have an account?{" "}
          <span
            style={styles.registerLink}
            onClick={() => router.push("/register")}
          >
            Register here
          </span>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "radial-gradient(circle at top, #1a1a1a, #000)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    background: "#0f0f0f",
    padding: "40px",
    borderRadius: "16px",
    width: "360px",
    textAlign: "center",
    boxShadow: "0 0 40px rgba(0,0,0,0.8)",
  },
  logo: {
    width: "110px",
    marginBottom: "15px",
  },
  title: {
    color: "#fff",
    marginBottom: "5px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    background: "#1e1e1e",
    color: "#fff",
  },
  button: {
    marginTop: "10px",
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    background: "#e74c3c",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
  },
  message: {
    marginTop: "12px",
    color: "#2ecc71",
  },
  registerText: {
    marginTop: "22px",
    color: "#aaa",
    fontSize: "0.85rem",
  },
  registerLink: {
    color: "#fff",
    cursor: "pointer",
    textDecoration: "underline",
  },
};
