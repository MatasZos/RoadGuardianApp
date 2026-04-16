"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
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
      setMessage("Login successful");
      setTimeout(() => router.push("/home"), 600);
    } else {
      setMessage("Invalid email or password");
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
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.subtitle}>
            Sign in to continue to your RoadGuardian dashboard
          </p>
        </div>

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Email</label>
            <input
              className={styles.input}
              placeholder="Enter your email"
              type="email"
              value={email}
              onChange={(e) => {
                setMessage("");
                setEmail(e.target.value);
              }}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Password</label>
            <input
              className={styles.input}
              placeholder="Enter your password"
              type="password"
              value={password}
              onChange={(e) => {
                setMessage("");
                setPassword(e.target.value);
              }}
              required
            />
          </div>

          <button className={styles.button} disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {message && (
          <p
            className={`${styles.message} ${
              message === "Login successful"
                ? styles.successMessage
                : styles.errorMessage
            }`}
          >
            {message}
          </p>
        )}

        <div className={styles.footer}>
          <p className={styles.registerText}>
            Don’t have an account?
            <span
              className={styles.registerLink}
              onClick={() => router.push("/register")}
            >
              Register here
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
