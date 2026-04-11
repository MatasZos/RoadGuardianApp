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

  async function handleRegister(e) {
    e.preventDefault();

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        accountType: "user",
      }),
    });

    if (res.ok) {
      setMessage("Account created successfully");
      setTimeout(() => router.push("/login"), 1200);
    } else {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error || "Registration failed");
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <img src="/logo.png" alt="RoadGuardian" className={styles.logo} />

        <h1 className={styles.title}>Create your account</h1>

        <form onSubmit={handleRegister} className={styles.form}>
          <input
            className={styles.input}
            placeholder="Full Name"
            value={form.fullName}
            onChange={(e) =>
              setForm({ ...form, fullName: e.target.value })
            }
            required
          />

          <input
            className={styles.input}
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
            required
          />

          <input
            className={styles.input}
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
            required
          />

          <input
            className={styles.input}
            placeholder="Phone Number"
            value={form.phone}
            onChange={(e) =>
              setForm({ ...form, phone: e.target.value })
            }
            required
          />

          <button className={styles.button}>Register</button>
        </form>

        {message && <p className={styles.message}>{message}</p>}

        <p className={styles.loginText}>
          Already have an account?{" "}
          <span
            className={styles.loginLink}
            onClick={() => router.push("/login")}
          >
            Login here
          </span>
        </p>
      </div>
    </div>
  );
}