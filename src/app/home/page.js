"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Map from "../components/Map";

export default function HomePage() {
  const router = useRouter();
  const [name, setName] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("userFullName");
    if (!stored) router.push("/login");
    else setName(stored);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#111", color: "#fff" }}>
      <Navbar />

      <div style={{ padding: "30px" }}>
      
        <div style={{ textAlign: "left", marginBottom: "30px" }}>
          <h1>Welcome, {name}</h1>
          <p style={{ color: "#aaa" }}>Your motorcycle dashboard</p>
        </div>

        <h2 style={{ textAlign: "center" }}>Quick Actions</h2>

        <div style={styles.actions}>
          <button style={{ ...styles.btn, background: "#f39c12" }} onClick={() => router.push("/maintenance")}>MAINTENANCE</button>
          <button style={{ ...styles.btn, background: "#3498db" }} onClick={() => router.push("/documents")}>DOCUMENTS</button>
          <button style={{ ...styles.btn, background: "#e74c3c" }} onClick={() => router.push("/emergency")}>EMERGENCY</button>
        </div>

        <div style={{ marginTop: "30px" }}>
          <Map lat={53.3498} lng={-6.2603} />
        </div>
      </div>
    </div>
  );
}

const styles = {
  actions: {
    display: "flex",
    justifyContent: "center",
    gap: "20px",
    marginTop: "20px",
    flexWrap: "wrap",
  },
  btn: {
    padding: "15px 30px",
    borderRadius: "12px",
    border: "none",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
  },
};
