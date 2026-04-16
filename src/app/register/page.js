"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./register.module.css";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

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
      setMessage("Account created successfully");
      setTimeout(() => router.push("/login"), 900);
    } else {
      setMessage(data.error || "Registration failed");
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.overlay} />

      <div className={styles.card}>
        <div className={styles.logoWrap}>
          <img src="/logo.png" alt="RoadGuardian" className={styles.logo} />
        </div>

        <div className={styles.header}>
          <h1 className={styles.title}>Create account</h1>
          <p className={styles.subtitle}>
            Join RoadGuardian and start managing your bike, maintenance and reminders.
          </p>
        </div>

        <form onSubmit={handleRegister} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Full Name</label>
            <input
              className={styles.input}
              placeholder="Enter your full name"
              value={form.fullName}
              onChange={(e) =>
                setForm({ ...form, fullName: e.target.value })
              }
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Email</label>
            <input
              className={styles.input}
              placeholder="Enter your email"
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Password</label>
            <input
              className={styles.input}
              placeholder="Create a password"
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Phone Number</label>
            <input
              className={styles.input}
              placeholder="Enter your phone number"
              value={form.phone}
              onChange={(e) =>
                setForm({ ...form, phone: e.target.value })
              }
              required
            />
          </div>

          <button className={styles.button} disabled={loading}>
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        {message && (
          <p
            className={`${styles.message} ${
              message === "Account created successfully"
                ? styles.successMessage
                : styles.errorMessage
            }`}
          >
            {message}
          </p>
        )}

        <div className={styles.footer}>
          <p className={styles.loginText}>
            Already have an account?
            <span
              className={styles.loginLink}
              onClick={() => router.push("/login")}
            >
              Login here
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
