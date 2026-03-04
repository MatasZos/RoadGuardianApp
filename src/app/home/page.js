"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "../components/Navbar";
import AiChat from "../components/AiChat";

export default function HomePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  if (status === "loading") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#111",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Loading...
      </div>
    );
  }

  const name = session?.user?.name || "";

  return (
    <div style={{ minHeight: "100vh", background: "#111", color: "#fff" }}>
      <Navbar />

      <div style={{ padding: "30px" }}>
        <div style={{ textAlign: "left", marginBottom: "30px" }}>
          <h1>Welcome, {name}</h1>
          <p style={{ color: "#aaa" }}>Dashboard</p>
        </div>

        <h2 style={{ textAlign: "center" }}>Quick Actions</h2>

        <div style={styles.actions}>
          <button
            style={{ ...styles.btn, background: "#f39c12" }}
            onClick={() => router.push("/maintenance")}
          >
            MAINTENANCE
          </button>
          <button
            style={{ ...styles.btn, background: "#3498db" }}
            onClick={() => router.push("/documents")}
          >
            DOCUMENTS
          </button>
          <button
            style={{ ...styles.btn, background: "#e74c3c" }}
            onClick={() => router.push("/emergency")}
          >
            EMERGENCY
          </button>
        </div>

        <AiChat />
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