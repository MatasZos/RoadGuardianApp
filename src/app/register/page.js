"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
  });
  const [message, setMessage] = useState("");

  async function handleRegister(e) {
    e.preventDefault();

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, accountType: "user" }),
    });

    if (res.ok) {
      setMessage("Account created successfully");
      setTimeout(() => router.push("/login"), 1200);
    } else {
      setMessage("Registration failed");
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <img src="/logo.png" alt="RoadGuardian" style={styles.logo} />

        <h1 style={styles.title}>Create Account</h1>

        <form onSubmit={handleRegister} style={styles.form}>
          {["fullName", "email", "password", "phone"].map((field) => (
            <input
              key={field}
              style={styles.input}
              placeholder={field.replace(/([A-Z])/g, " $1")}
              type={field === "password" ? "password" : "text"}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              required
            />
          ))}

          <button style={styles.button}>Register</button>
        </form>

        {message && <p style={styles.message}>{message}</p>}
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
    width: "380px",
    textAlign: "center",
    boxShadow: "0 0 40px rgba(0,0,0,0.8)",
  },
  logo: {
    width: "110px",
    marginBottom: "15px",
  },
  title: {
    color: "#fff",
    marginBottom: "20px",
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
    background: "#3498db",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
  },
  message: {
    marginTop: "12px",
    color: "#2ecc71",
  },
};
