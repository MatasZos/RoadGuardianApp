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

      <div style={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <h1>Emergency Page</h1>
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
            transition: "0.3s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
          onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Call for Help
        </button>

        {/* Emergency Card */}
        {emergencyCalled && (
          <div
            style={{
              marginTop: "25px",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
              backgroundColor: "#fff",
              width: "90%",
              maxWidth: "400px",
              textAlign: "center",
            }}
          >
            <h2 style={{ marginBottom: "10px", color: "#e74c3c" }}>Emergency Team Dispatched!</h2>
            <p><strong>ETA:</strong> 5 minutes</p>
            <p><strong>Location:</strong> City Centre</p>
            <p><strong>Status:</strong> Help is on the way</p>
          </div>
        )}
      </div>
    </div>
  );
}
