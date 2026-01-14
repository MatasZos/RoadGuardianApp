"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DocumentsPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");

  const fakeDocuments = [
    { type: "Insurance", issueDate: "2025-06-01", expiryDate: "2026-06-01", notes: "Third-party coverage" },
    { type: "Registration", issueDate: "2024-09-15", expiryDate: "2029-09-15", notes: "Bike registered under owner" },
    { type: "Service Manual", issueDate: "2025-01-01", expiryDate: "N/A", notes: "Digital copy of manual" },
  ];

  useEffect(() => {
    const name = localStorage.getItem("userFullName");
    if (!name) router.push("/login");
    else setFullName(name);
  }, []);

  return (
    <div style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", minHeight: "100vh", background: "#111" }}>
      {/* Navbar */}
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 20px",
          backgroundColor: "#222",
          color: "#fff",
          boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ fontWeight: "bold", fontSize: "1.2rem", cursor: "pointer", color: "#3498db" }} onClick={() => router.push("/home")}>
          RoadGuardian
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div style={{ fontSize: "1.5rem", cursor: "pointer", color: "#3498db" }}>☰</div>
          <img
            src="/profile.png"
            alt="Profile"
            style={{ width: "35px", height: "35px", borderRadius: "50%", cursor: "pointer" }}
            onClick={() => router.push("/profile")}
          />
        </div>
      </nav>

      <div style={{ padding: "20px", color: "#fff" }}>
        <h1 style={{ color: "#3498db" }}>My Documents</h1>
        <p>Welcome back, {fullName}</p>

        <div style={{ marginTop: "20px" }}>
          {fakeDocuments.map((doc, index) => (
            <div
              key={index}
              style={{
                background: "#fff",
                color: "#111",
                padding: "15px",
                borderRadius: "12px",
                boxShadow: "0 4px 10px rgba(0,0,0,0.5)",
                marginBottom: "15px",
              }}
            >
              <h2 style={{ marginBottom: "5px", color: "#3498db" }}>{doc.type}</h2>
              <p><strong>Issue Date:</strong> {doc.issueDate}</p>
              <p><strong>Expiry Date:</strong> {doc.expiryDate}</p>
              <p><strong>Notes:</strong> {doc.notes}</p>
            </div>
          ))}
        </div>

        <button
          style={{
            marginTop: "20px",
            padding: "12px 20px",
            borderRadius: "10px",
            border: "none",
            backgroundColor: "#3498db",
            color: "#111",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Add New Document
        </button>
      </div>
    </div>
  );
}
