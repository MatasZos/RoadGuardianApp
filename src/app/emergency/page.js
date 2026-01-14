"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
        <div style={{ fontWeight: "bold", fontSize: "1.2rem", cursor: "pointer", color: "#e74c3c" }} onClick={() => router.push("/home")}>
          RoadGuardian
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div style={{ fontSize: "1.5rem", cursor: "pointer", color: "#e74c3c" }}>☰</div>
          <img
            src="/profile.png"
            alt="Profile"
            style={{ width: "35px", height: "35px", borderRadius: "50%", cursor: "pointer" }}
            onClick={() => router.push("/profile")}
          />
        </div>
      </nav>

      <div style={{ padding: "20px", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <h1 style={{ color: "#e74c3c" }}>Emergency Page</h1>
        <p>Welcome back, {fullName}</p>

        {/* Emergency Button */}
        <button
          onClick={handleEmergency}
          style={{
            padding: "15px 25px",
            borderRadius: "10px",
            border: "none",
            backgroundColor: "#e74c3c",
            color: "#fff",
            fontSize: "1.1rem",
            fontWeight: "bold",
            cursor: "pointer",
            marginTop: "20px",
          }}
        >
          Call for Help
        </button>

        {emergencyCalled && (
          <div
            style={{
              marginTop: "25px",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 8px 20px rgba(0,0,0,0.5)",
              backgroundColor: "#fff",
              color: "#111",
              width: "90%",
              maxWidth: "400px",
              textAlign: "center",
            }}
          >
            <h2 style={{ marginBottom: "10px", color: "#e74c3c" }}>Emergency Team Dispatched!</h2>
            <p><strong>ETA:</strong> 5 minutes</p>
            <p><strong>Location:</strong> City Center</p>
            <p><strong>Status:</strong> Team is on the way </p>
          </div>
        )}
      </div>
    </div>
  );
}
