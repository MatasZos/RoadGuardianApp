"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    const name = localStorage.getItem("userFullName");
    if (!name) {
      router.push("/login"); 
    } else {
      setFullName(name);
    }
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      <h1 style={{ marginBottom: "20px" }}>Welcome {fullName}</h1>

      {/* Quick Actions */}
      <h2 style={{ marginBottom: "10px" }}>Quick Actions</h2>
      <div style={{ display: "flex", gap: "15px", marginBottom: "30px" }}>
        <button style={{ flex: 1, padding: "15px", borderRadius: "10px", border: "none", backgroundColor: "#f39c12", color: "#fff", fontWeight: "bold", cursor: "pointer" }}>
          Maintenance
        </button>
        <button style={{ flex: 1, padding: "15px", borderRadius: "10px", border: "none", backgroundColor: "#3498db", color: "#fff", fontWeight: "bold", cursor: "pointer" }}>
          Documents
        </button>
        <button style={{ flex: 1, padding: "15px", borderRadius: "10px", border: "none", backgroundColor: "#e74c3c", color: "#fff", fontWeight: "bold", cursor: "pointer" }}>
          Emergency
        </button>
      </div>

      {/* Map Placeholder */}
      <div
        style={{
          height: "400px",
          backgroundColor: "#dcdcdc",
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#666",
          fontSize: "1.2rem",
        }}
      >
        Map Placeholder
      </div>
    </div>
  );
}
