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
    <div className={styles.container}>
      <div className={styles.card}>
        <img src="/logo.png" alt="RoadGuardian" className={styles.logo} />

        <h1 className={styles.title}>Welcome to RoadGuardian</h1>

        <form onSubmit={handleLogin} className={styles.form}>
          <input
            className={styles.input}
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => {
              setMessage("");
              setEmail(e.target.value);
            }}
            required
          />

          <input
            className={styles.input}
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => {
              setMessage("");
              setPassword(e.target.value);
            }}
            required
          />

          <button className={styles.button} disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {message && <p className={styles.message}>{message}</p>}

        <p className={styles.registerText}>
          Don’t have an account?{" "}
          <span
            className={styles.registerLink}
            onClick={() => router.push("/register")}
          >
            Register here
          </span>
        </p>
      </div>
    </div>
  );
}