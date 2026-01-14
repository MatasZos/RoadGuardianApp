"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async () => {
    setMessage("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (res.ok) {
      setMessage("Login Successful!");
      localStorage.setItem("userFullName", data.message.replace("Welcome ", ""));
      setTimeout(() => router.push("/home"), 1200);
    } else {
      setMessage(data.error);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #1f4037, #99f2c8)", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", color: "#333", padding: "20px" }}>
      <img src="/logo.png" alt="RoadGuardian Logo" style={{ width: "120px", marginBottom: "20px" }} />
      <h1 style={{ fontSize: "2.2rem", marginBottom: "10px", color: "#fff" }}>Welcome to RoadGuardian</h1>
      <p style={{ fontSize: "1rem", marginBottom: "30px", color: "#f0f0f0" }}>Please log in to continue</p>

      <div style={{ background: "#ffffffee", padding: "30px", borderRadius: "12px", boxShadow: "0 8px 20px rgba(0,0,0,0.25)", minWidth: "320px", maxWidth: "400px", width: "100%", display: "flex", flexDirection: "column" }}>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ padding: "12px 15px", marginBottom: "15px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "1rem" }} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{ padding: "12px 15px", marginBottom: "20px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "1rem" }} />
        <button onClick={handleLogin} style={{ padding: "12px 15px", borderRadius: "8px", border: "none", background: "linear-gradient(90deg, #11998e, #38ef7d)", color: "#fff", fontSize: "1rem", cursor: "pointer", transition: "0.3s" }} onMouseOver={e => (e.currentTarget.style.opacity = "0.9")} onMouseOut={e => (e.currentTarget.style.opacity = "1")}>Log In</button>

        {message && <p style={{ marginTop: "15px", textAlign: "center", color: message.includes("Successful") ? "green" : "red", fontWeight: "500" }}>{message}</p>}

        <p style={{ marginTop: "20px", textAlign: "center", fontSize: "0.9rem", color: "#666" }}>Don't have an account? <span onClick={() => router.push("/register")} style={{ color: "#11998e", cursor: "pointer", textDecoration: "underline" }}>Register here</span></p>
      </div>
    </div>
  );
}
