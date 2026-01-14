"use client";

import { useRouter } from "next/navigation";

export default function Navbar({ themeColor }) {
  const router = useRouter();

  return (
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
          gap: "10px",
        }}
        onClick={() => router.push("/home")}
      >
        <img
          src="/logo.png"
          alt="RoadGuardian Logo"
          style={{ width: "35px", height: "35px", objectFit: "contain" }}
        />
        <span style={{ fontWeight: "bold", fontSize: "1.2rem", color: themeColor || "#fff" }}>
          RoadGuardian
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
        <div style={{ fontSize: "1.5rem", cursor: "pointer", color: themeColor || "#fff" }}>☰</div>
        <img
          src="/profile.png"
          alt="Profile"
          style={{ width: "35px", height: "35px", borderRadius: "50%", cursor: "pointer" }}
          onClick={() => router.push("/profile")}
        />
      </div>
    </nav>
  );
}
