"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";

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
    <div style={{ minHeight: "100vh", background: "#111", color: "#fff" }}>
      <Navbar themeColor="#ffa500" />
      <div style={{ padding: "20px" }}>
        <h1 style={{ color: "#ffa500" }}>Maintenance Records</h1>
        <p>Welcome back, {fullName}</p>
        <div style={{ marginTop: "20px" }}>
          {fakeRecords.map((record, index) => (
            <div key={index} style={{ background: "#fff", color: "#111", padding: "15px", borderRadius: "12px", boxShadow: "0 4px 10px rgba(0,0,0,0.5)", marginBottom: "15px" }}>
              <h2 style={{ color: "#ffa500" }}>{record.type}</h2>
              <p><strong>Date:</strong> {record.date}</p>
              <p><strong>Kilometers:</strong> {record.km} km</p>
              <p><strong>Notes:</strong> {record.notes}</p>
            </div>
          ))}
        </div>
        <button style={{ marginTop: "20px", padding: "12px 20px", borderRadius: "10px", border: "none", backgroundColor: "#ffa500", color: "#111", fontWeight: "bold", cursor: "pointer" }} >
          Add New Maintenance Record
        </button>
      </div>
    </div>
  );
}
