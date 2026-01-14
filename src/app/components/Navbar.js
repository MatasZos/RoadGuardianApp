"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <div style={styles.navbar}>
      <div style={styles.left}>
        <div style={styles.hamburger} onClick={() => setOpen(!open)}>
          <div style={styles.line}></div>
          <div style={styles.line}></div>
          <div style={styles.line}></div>
        </div>

        <span style={styles.brand}>RoadGuardian</span>
      </div>

      <img
        src="/profile.png"
        style={styles.profile}
        onClick={() => router.push("/profile")}
      />

      {open && (
        <div style={styles.dropdown}>
          <div style={styles.item}>My Bike</div>
          <div style={styles.item}>Maintenance History</div>
          <div style={styles.item}>Settings</div>
          <div style={styles.item}>Help & Support</div>
          <div style={styles.divider}></div>
          <div
            style={{ ...styles.item, color: "#e74c3c" }}
            onClick={() => {
              localStorage.clear();
              router.push("/login");
            }}
          >
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
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 20px",
    position: "relative",
  },
  left: { display: "flex", alignItems: "center", gap: "15px" },
  hamburger: { cursor: "pointer" },
  line: { width: "22px", height: "2px", background: "#fff", margin: "4px 0" },
  brand: { color: "#fff", fontWeight: "bold" },
  profile: { width: "34px", height: "34px", borderRadius: "50%", cursor: "pointer" },
  dropdown: {
    position: "absolute",
    top: "60px",
    left: "20px",
    background: "#111",
    width: "220px",
    borderRadius: "10px",
    overflow: "hidden",
    boxShadow: "0 10px 30px rgba(0,0,0,0.8)",
    zIndex: 100,
  },
  item: { padding: "14px", color: "#fff", cursor: "pointer", borderBottom: "1px solid #222" },
  divider: { height: "1px", background: "#222" },
};
