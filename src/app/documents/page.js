"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";

export default function DocumentsPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");

  const fakeDocuments = [
    { type: "Insurance", issueDate: "2025-06-01", expiryDate: "2026-06-01", notes: "Third-party coverage" },
    { type: "Registration", issueDate: "2024-09-15", expiryDate: "N/A", notes: "Bike registereation" },
    { type: "Service Manual", issueDate: "2025-01-01", expiryDate: "N/A", notes: "Digital copy of manual" },
  ];

  useEffect(() => {
    const name = localStorage.getItem("userFullName");
    if (!name) router.push("/login");
    else setFullName(name);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#111", color: "#fff" }}>
      <Navbar themeColor="#3498db" />
      <div style={{ padding: "20px" }}>
        <h1 style={{ color: "#3498db" }}>My Documents</h1>
        <p>Welcome back, {fullName}</p>
        <div style={{ marginTop: "20px" }}>
          {fakeDocuments.map((doc, index) => (
            <div key={index} style={{ background: "#fff", color: "#111", padding: "15px", borderRadius: "12px", boxShadow: "0 4px 10px rgba(0,0,0,0.5)", marginBottom: "15px" }}>
              <h2 style={{ color: "#3498db" }}>{doc.type}</h2>
              <p><strong>Issue Date:</strong> {doc.issueDate}</p>
              <p><strong>Expiry Date:</strong> {doc.expiryDate}</p>
              <p><strong>Notes:</strong> {doc.notes}</p>
            </div>
          ))}
        </div>
        <button style={{ marginTop: "20px", padding: "12px 20px", borderRadius: "10px", border: "none", backgroundColor: "#3498db", color: "#111", fontWeight: "bold", cursor: "pointer" }} >
          Add New Document
        </button>
      </div>
    </div>
  );
}
