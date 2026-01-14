"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Map from "../components/Map";

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

        <h1 style={{ fontSize: "2rem", marginBottom: "10px" }}>Welcome, {fullName}</h1>
        <h2 style={{ marginBottom: "20px" }}>Quick Actions</h2>

        <div style={{ display: "flex", justifyContent: "center", gap: "15px", flexWrap: "wrap" }}>
          <button
            style={{
              backgroundColor: "#ffa500",
              color: "#fff",
              padding: "15px 25px",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
            onClick={() => router.push("/maintenance")}
          >
            MAINTENANCE
          </button>
          <button
            style={{
              backgroundColor: "#3498db",
              color: "#fff",
              padding: "15px 25px",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
            onClick={() => router.push("/documents")}
          >
            DOCUMENTS
          </button>
          <button
            style={{
              backgroundColor: "#e74c3c",
              color: "#fff",
              padding: "15px 25px",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
            onClick={() => router.push("/emergency")}
          >
            EMERGENCY
          </button>
        </div>

        <div style={{ marginTop: "30px", width: "80%", margin: "30px auto" }}>
          <Map lat={53.3498} lng={-6.2603} />
        </div>
      </div>
    </div>
  );
}
