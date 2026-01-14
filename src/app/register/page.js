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
    if (!fullName || !email || !password || !phone) {
      setMessage("Please fill all fields");
      return;
    }

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, password, phone, accountType }),
    });

    const data = await res.json();
    if (res.ok) {
      alert("Registration successful!");
      router.push("/login");
    } else {
      setMessage(data.error);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "50px" }}>
      <h1>Register</h1>
      <input type="text" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} style={{ margin: "5px", padding: "10px" }} />
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ margin: "5px", padding: "10px" }} />
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{ margin: "5px", padding: "10px" }} />
      <input type="text" placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} style={{ margin: "5px", padding: "10px" }} />
      <button onClick={handleRegister} style={{ padding: "10px 20px", marginTop: "10px" }}>Register</button>
      {message && <p style={{ marginTop: "10px" }}>{message}</p>}

      <p style={{ marginTop: "15px" }}>
        Already have an account?{" "}
        <span
          onClick={() => router.push("/login")}
          style={{ color: "#3498db", cursor: "pointer", textDecoration: "underline" }}
        >
          Login here
        </span>
      </p>
    </div>
  );
}
