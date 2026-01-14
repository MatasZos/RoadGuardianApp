"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DocumentsPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");

  const fakeDocuments = [
    { type: "Insurance", issueDate: "2025-06-01", expiryDate: "2026-06-01", notes: "Third-party coverage" },
    { type: "Registration", issueDate: "2024-09-15", expiryDate: "N/A", notes: "Bike registration" },
    { type: "Service Manual", issueDate: "2025-01-01", expiryDate: "N/A", notes: "Digital copy of manual" },
  ];

  useEffect(() => {
    const name = localStorage.getItem("userFullName");
    if (!name) router.push("/login");
    else setFullName(name);
  }, []);

  return (
    <div style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", minHeight: "100vh", background: "#f5f5f5" }}>
      {/* Navbar */}
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 20px",
          backgroundColor: "#2c3e50",
          color: "#fff",
          boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ fontWeight: "bold", fontSize: "1.2rem", cursor: "pointer" }} onClick={() => router.push("/home")}>
          RoadGuardian
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div style={{ fontSize: "1.5rem", cursor: "pointer" }}>☰</div>
          <img
            src="/profile.png"
            alt="Profile"
            style={{ width: "35px", height: "35px", borderRadius: "50%", cursor: "pointer" }}
            onClick={() => router.push("/profile")}
          />
        </div>
      </nav>

      <div style={{ padding: "20px" }}>
        <h1>My Documents</h1>
        <p>Welcome back, {fullName}</p>

        <div style={{ marginTop: "20px" }}>
          {fakeDocuments.map((doc, index) => (
            <div
              key={index}
              style={{
                background: "#fff",
                padding: "15px",
                borderRadius: "12px",
                boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                marginBottom: "15px",
              }}
            >
              <h2 style={{ marginBottom: "5px" }}>{doc.type}</h2>
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
            color: "#fff",
            fontWeight: "bold",
            cursor: "pointer",
          }}
          onClick={() => alert("Feature coming soon!")}
        >
          Add New Document
        </button>
      </div>
    </div>
  );
}
