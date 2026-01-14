"use client";

import { useRouter } from "next/navigation";

export default function MaintenancePage() {
  const router = useRouter();

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      marginTop: "50px", fontFamily: "sans-serif"
    }}>
      <h1 style={{ fontSize: "32px", marginBottom: "20px" }}>Maintenance</h1>
      <p style={{ fontSize: "18px", marginBottom: "20px" }}>
        This is the Maintenance page. Add your breakdown workflows here.
      </p>
      <button
        onClick={() => router.push("/")}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          borderRadius: "5px",
          border: "none",
          backgroundColor: "#3498db",
          color: "white",
          cursor: "pointer"
        }}
      >
        Back to Home
      </button>
    </div>
  );
}
