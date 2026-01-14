"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function MaintenancePage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");

  const fakeRecords = [
    { type: "Oil Change", date: "2026-01-10", km: 12000, notes: "Used synthetic oil" },
    { type: "Chain Adjustment", date: "2026-01-05", km: 11850, notes: "Lubricated chain" },
    { type: "Brake Pads Replacement", date: "2025-12-20", km: 11500, notes: "Front pads replaced" },
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
        <h1>Maintenance Records</h1>
        <p>Welcome back, {fullName}</p>

        <div style={{ marginTop: "20px" }}>
          {fakeRecords.map((record, index) => (
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
              <h2 style={{ marginBottom: "5px" }}>{record.type}</h2>
              <p><strong>Date:</strong> {record.date}</p>
              <p><strong>Kilometers:</strong> {record.km} km</p>
              <p><strong>Notes:</strong> {record.notes}</p>
            </div>
          ))}
        </div>

        <button
          style={{
            marginTop: "20px",
            padding: "12px 20px",
            borderRadius: "10px",
            border: "none",
            backgroundColor: "#f39c12",
            color: "#fff",
            fontWeight: "bold",
            cursor: "pointer",
          }}
          onClick={() => alert("Feature coming soon!")}
        >
          Add New Maintenance Record
        </button>
      </div>
    </div>
  );
}
