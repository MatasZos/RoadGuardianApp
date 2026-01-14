"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    const name = localStorage.getItem("userFullName");
    if (!name) router.push("/login");
    else setFullName(name);
  }, []);

  return (
    <div style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      {/* Navbar */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px", backgroundColor: "#2c3e50", color: "#fff", boxShadow: "0 2px 6px rgba(0,0,0,0.2)" }}>
        <div style={{ fontWeight: "bold", fontSize: "1.2rem", cursor: "pointer" }} onClick={() => router.push("/home")}>RoadGuardian</div>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div style={{ fontSize: "1.5rem", cursor: "pointer" }}>☰</div>
          <img src="/profile.png" alt="Profile" style={{ width: "35px", height: "35px", borderRadius: "50%", cursor: "pointer" }} onClick={() => router.push("/profile")} />
        </div>
      </nav>

      <div style={{ padding: "20px" }}>
        <h1 style={{ marginBottom: "20px" }}>Welcome {fullName}</h1>

        <h2 style={{ marginBottom: "10px" }}>Quick Actions</h2>
        <div style={{ display: "flex", gap: "15px", marginBottom: "30px" }}>
          <button onClick={() => router.push("/maintenance")} style={{ flex: 1, padding: "15px", borderRadius: "10px", border: "none", backgroundColor: "#f39c12", color: "#fff", fontWeight: "bold", cursor: "pointer" }}>Maintenance</button>
          <button onClick={() => router.push("/documents")} style={{ flex: 1, padding: "15px", borderRadius: "10px", border: "none", backgroundColor: "#3498db", color: "#fff", fontWeight: "bold", cursor: "pointer" }}>Documents</button>
          <button onClick={() => router.push("/emergency")} style={{ flex: 1, padding: "15px", borderRadius: "10px", border: "none", backgroundColor: "#e74c3c", color: "#fff", fontWeight: "bold", cursor: "pointer" }}>Emergency</button>
        </div>

        <div style={{ height: "400px", backgroundColor: "#dcdcdc", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: "#666", fontSize: "1.2rem" }}>
          Map Placeholder
        </div>
      </div>
    </div>
  );
}
