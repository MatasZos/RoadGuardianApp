"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";

export default function EmergencyPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [emergencyCalled, setEmergencyCalled] = useState(false);

  useEffect(() => {
    const name = localStorage.getItem("userFullName");
    if (!name) router.push("/login");
    else setFullName(name);
  }, []);

  const handleEmergency = () => {
    setEmergencyCalled(true);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#111", color: "#fff", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      <Navbar themeColor="#e74c3c" />
      <div style={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <h1 style={{ color: "#e74c3c" }}>Emergency Page</h1>
        <button onClick={handleEmergency} style={{ padding: "15px 25px", borderRadius: "10px", border: "none", backgroundColor: "#e74c3c", color: "#fff", fontSize: "1.1rem", fontWeight: "bold", cursor: "pointer", marginTop: "20px" }}>
          Call for Help
        </button>
        {emergencyCalled && (
          <div style={{ marginTop: "25px", padding: "20px", borderRadius: "12px", boxShadow: "0 8px 20px rgba(0,0,0,0.5)", backgroundColor: "#fff", color: "#111", width: "90%", maxWidth: "400px", textAlign: "center" }}>
            <h2 style={{ marginBottom: "10px", color: "#e74c3c" }}>Emergency Team Dispatched!</h2>
            <p><strong>ETA:</strong> 5 minutes</p>
            <p><strong>Location:</strong> City Centre</p>
            <p><strong>Status:</strong> Team is on the way </p>
          </div>
        )}
      </div>
    </div>
  );
}
