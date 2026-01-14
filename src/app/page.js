"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  // Styles
  const styles = {
    navbar: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: "#333",
      color: "white",
      padding: "10px 20px",
      position: "relative",
    },
    hamburger: {
      display: "inline-block",
      cursor: "pointer",
    },
    bar: {
      width: "25px",
      height: "3px",
      backgroundColor: "white",
      margin: "4px 0",
    },
    profilePic: {
      width: "40px",
      height: "40px",
      borderRadius: "50%",
      cursor: "pointer",
    },
    menu: {
      display: menuOpen ? "flex" : "none",
      flexDirection: "column",
      backgroundColor: "#444",
      position: "absolute",
      top: "60px",
      left: "0",
      width: "100%",
      padding: "10px 0",
    },
    menuButton: {
      background: "none",
      color: "white",
      border: "none",
      padding: "10px",
      textAlign: "left",
      cursor: "pointer",
    },
    mainContainer: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      marginTop: "40px",
      gap: "30px",
      width: "100%",
    },
    quickActionsTitle: {
      fontSize: "28px",
      fontWeight: "bold",
      marginBottom: "20px",
    },
    buttonsRow: {
      display: "flex",
      justifyContent: "center",
      gap: "30px",
      flexWrap: "wrap",
    },
    mainButton: (bgColor) => ({
      width: "180px",
      height: "60px",
      fontSize: "18px",
      border: "none",
      cursor: "pointer",
      color: "white",
      borderRadius: "8px",
      backgroundColor: bgColor,
      transition: "transform 0.2s",
    }),
    mapPlaceholder: {
      width: "90%",
      maxWidth: "1000px",
      height: "400px",
      backgroundColor: "#ddd",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginTop: "50px",
      borderRadius: "12px",
      fontSize: "22px",
      color: "#555",
      boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
    },
  };

  return (
    <div>
      <nav style={styles.navbar}>
        <div style={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)}>
          <div style={styles.bar}></div>
          <div style={styles.bar}></div>
          <div style={styles.bar}></div>
        </div>

        <div style={{ fontWeight: "bold", fontSize: "20px" }}>ROADGUARDIAN</div>

        <img
          src="/profile.png"
          alt="Profile"
          style={styles.profilePic}
          onClick={() => router.push("/login")}
        />

        <div style={styles.menu}>
          <button
            style={styles.menuButton}
            onClick={() => router.push("/maintenance")}
          >
            MAINTENANCE
          </button>
          <button
            style={styles.menuButton}
            onClick={() => router.push("/documents")}
          >
            DOCUMENTS
          </button>
          <button
            style={styles.menuButton}
            onClick={() => router.push("/emergency")}
          >
            EMERGENCY
          </button>
        </div>
      </nav>

      <div style={styles.mainContainer}>
        <div style={styles.quickActionsTitle}>Quick Actions</div>
        <div style={styles.buttonsRow}>
          <button
            style={styles.mainButton("#f39c12")}
            onClick={() => router.push("/maintenance")}
            onMouseEnter={(e) => (e.target.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
          >
            MAINTENANCE
          </button>
          <button
            style={styles.mainButton("#3498db")}
            onClick={() => router.push("/documents")}
            onMouseEnter={(e) => (e.target.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
          >
            DOCUMENTS
          </button>
          <button
            style={styles.mainButton("#e74c3c")}
            onClick={() => router.push("/emergency")}
            onMouseEnter={(e) => (e.target.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
          >
            EMERGENCY
          </button>
        </div>

        <div style={styles.mapPlaceholder}>Map </div>
      </div>
    </div>
  );
}
