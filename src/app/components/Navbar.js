"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function logout() {
    localStorage.clear();
    router.push("/login");
  }

  return (
    <div style={styles.navbar}>
      {/* Left: Hamburger */}
      <div style={styles.left}>
        <div
          style={styles.hamburger}
          onClick={() => setOpen(!open)}
        >
          <div style={styles.line}></div>
          <div style={styles.line}></div>
          <div style={styles.line}></div>
        </div>

        <div style={styles.brand}>
          <img src="/logo.png" alt="RoadGuardian" style={styles.logo} />
          <span>RoadGuardian</span>
        </div>
      </div>

      {/* Right: Profile */}
      <img
        src="/profile.png"
        alt="Profile"
        style={styles.profile}
        onClick={() => router.push("/profile")}
      />

      {/* Dropdown */}
      {open && (
        <div style={styles.dropdown}>
          <div style={styles.item} onClick={() => router.push("/profile")}>
            My Profile
          </div>
          <div style={styles.item}>
            My Bike
          </div>
          <div style={styles.item}>
            Settings
          </div>
          <div style={styles.item}>
            Support
          </div>
          <div style={styles.divider}></div>
          <div style={{ ...styles.item, color: "#e74c3c" }} onClick={logout}>
            Sign Out
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  navbar: {
    height: "60px",
    background: "#0b0b0b",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 20px",
    position: "relative",
    borderBottom: "1px solid #1e1e1e",
  },
  left: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },
  hamburger: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    cursor: "pointer",
  },
  line: {
    width: "22px",
    height: "2px",
    background: "#fff",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#fff",
    fontWeight: "bold",
    fontSize: "1rem",
  },
  logo: {
    width: "28px",
    height: "28px",
  },
  profile: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    cursor: "pointer",
  },
  dropdown: {
    position: "absolute",
    top: "60px",
    left: "20px",
    background: "#111",
    borderRadius: "10px",
    width: "200px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.8)",
    overflow: "hidden",
    zIndex: 100,
  },
  item: {
    padding: "12px 15px",
    color: "#fff",
    cursor: "pointer",
    fontSize: "0.9rem",
    borderBottom: "1px solid #1e1e1e",
  },
  divider: {
    height: "1px",
    background: "#1e1e1e",
  },
};
