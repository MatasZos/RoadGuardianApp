"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [accountType, setAccountType] = useState("user"); 
  const [message, setMessage] = useState("");

  const handleRegister = async () => {
    setMessage("");
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, password, phone, accountType }),
    });
    const data = await res.json();

    if (res.ok) {
      setMessage("Registration Successful! Redirecting to login...");
      setTimeout(() => router.push("/login"), 1500);
    } else {
      setMessage(data.error);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #283e51, #485563)",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        color: "#fff",
        padding: "20px",
      }}
    >
      <img src="/logo.png" alt="RoadGuardian Logo" style={{ width: "120px", marginBottom: "20px" }} />
      <h1 style={{ fontSize: "2rem", marginBottom: "10px" }}>Register for RoadGuardian</h1>
      <p style={{ fontSize: "1rem", marginBottom: "30px", color: "#ddd" }}>Create your account</p>

      <div
        style={{
          background: "#ffffffee",
          padding: "30px",
          borderRadius: "12px",
          boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
          minWidth: "320px",
          maxWidth: "400px",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          color: "#333",
        }}
      >
        <input
          type="text"
          placeholder="Full Name"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          style={{ padding: "12px 15px", marginBottom: "12px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "1rem" }}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ padding: "12px 15px", marginBottom: "12px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "1rem" }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ padding: "12px 15px", marginBottom: "12px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "1rem" }}
        />
        <input
          type="text"
          placeholder="Phone Number"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          style={{ padding: "12px 15px", marginBottom: "12px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "1rem" }}
        />

        <button
          onClick={handleRegister}
          style={{
            padding: "12px 15px",
            borderRadius: "8px",
            border: "none",
            background: "linear-gradient(90deg, #36d1dc, #5b86e5)",
            color: "#fff",
            fontSize: "1rem",
            cursor: "pointer",
            marginTop: "10px",
            transition: "0.3s",
          }}
          onMouseOver={e => (e.currentTarget.style.opacity = "0.9")}
          onMouseOut={e => (e.currentTarget.style.opacity = "1")}
        >
          Register
        </button>

        {message && <p style={{ marginTop: "15px", textAlign: "center", color: message.includes("Successful") ? "green" : "red", fontWeight: "500" }}>{message}</p>}

        <p style={{ marginTop: "20px", textAlign: "center", fontSize: "0.9rem", color: "#666" }}>
          Already have an account?{" "}
          <span onClick={() => router.push("/login")} style={{ color: "#36d1dc", cursor: "pointer", textDecoration: "underline" }}>
            Login here
          </span>
        </p>
      </div>
    </div>
  );
}
