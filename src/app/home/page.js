"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";

export default function HomePage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    const name = localStorage.getItem("userFullName");
    if (!name) router.push("/login");
    else setFullName(name);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#111", color: "#fff", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      <Navbar themeColor="#fff" />
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h1 style={{ fontSize: "2rem" }}>Welcome, {fullName}</h1>
        <h2>Quick Actions</h2>
        <div style={{ display: "flex", justifyContent: "center", gap: "15px", marginTop: "20px" }}>
          <button style={{ backgroundColor: "#ffa500", color: "#fff", padding: "15px 25px", border: "none", borderRadius: "10px", cursor: "pointer" }} onClick={() => router.push("/maintenance")}>
            MAINTENANCE
          </button>
          <button style={{ backgroundColor: "#3498db", color: "#fff", padding: "15px 25px", border: "none", borderRadius: "10px", cursor: "pointer" }} onClick={() => router.push("/documents")}>
            DOCUMENTS
          </button>
          <button style={{ backgroundColor: "#e74c3c", color: "#fff", padding: "15px 25px", border: "none", borderRadius: "10px", cursor: "pointer" }} onClick={() => router.push("/emergency")}>
            EMERGENCY
          </button>
        </div>

        <div style={{ marginTop: "30px", backgroundColor: "#333", height: "300px", width: "80%", margin: "30px auto", borderRadius: "12px", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <p>Map Placeholder</p>
        </div>
      </div>
    </div>
  );
}
