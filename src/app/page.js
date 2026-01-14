"use client"; 

import { useState } from "react";
import { useRouter } from "next/navigation"; 

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

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
    container: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      marginTop: "30px",
      gap: "20px",
    },
    mainButton: (bgColor) => ({
      width: "200px",
      height: "60px",
      fontSize: "18px",
      border: "none",
      cursor: "pointer",
      color: "white",
      borderRadius: "5px",
      backgroundColor: bgColor,
    }),
    mapPlaceholder: {
      width: "90%",
      height: "300px",
      backgroundColor: "#ddd",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginTop: "40px",
      borderRadius: "10px",
      fontSize: "20px",
      color: "#555",
    },
  };

  return (
    <div>
      {/* Navbar */}
      <nav style={styles.navbar}>
        <div style={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)}>
          <div style={styles.bar}></div>
          <div style={styles.bar}></div>
          <div style={styles.bar}></div>
        </div>

        <div>ROADGUARDIAN</div>

        <img
          src="/profile.png"
          alt="Profile"
          style={styles.profilePic}
          onClick={() => router.push("/login")}
        />

        <div style={styles.menu}>
          <button style={styles.menuButton}>MAINTENANCE</button>
          <button style={styles.menuButton}>DOCUMENTS</button>
          <button style={styles.menuButton}>EMERGENCY</button>
        </div>
      </nav>

 
      <div style={styles.container}>
        <button
          style={styles.mainButton("#f39c12")}
          onClick={() => alert("Maintenance clicked")}
        >
          MAINTENANCE
        </button>
        <button
          style={styles.mainButton("#3498db")}
          onClick={() => alert("Documents clicked")}
        >
          DOCUMENTS
        </button>
        <button
          style={styles.mainButton("#e74c3c")}
          onClick={() => alert("Emergency clicked")}
        >
          EMERGENCY
        </button>
      </div>

    
      <div style={styles.mapPlaceholder}>Map </div>
    </div>
  );
}
