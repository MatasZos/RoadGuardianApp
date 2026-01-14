"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";

export default function ProfilePage() {
  const [user, setUser] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    // load user info from localStorage if available
    const fullName = localStorage.getItem("userFullName") || "";
    const email = localStorage.getItem("userEmail") || "";
    const phone = localStorage.getItem("userPhone") || "";

    setUser({ fullName, email, phone });
  }, []);

  return (
    <>
      <Navbar />

      <div style={styles.container}>
        <div style={styles.card}>
          <img src="/profile.png" style={styles.avatar} />

          <h2 style={styles.name}>
            {user.fullName || "Your Name"}
          </h2>

          <div style={styles.infoBlock}>
            <label>Email</label>
            <p>{user.email || "Your Email"}</p>
          </div>

          <div style={styles.infoBlock}>
            <label>Phone</label>
            <p>{user.phone || "Your Phone"}</p>
          </div>

          <button
            style={styles.logout}
            onClick={() => {
              localStorage.clear();
              window.location.href = "/login"; // redirect to login on sign out
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}

const styles = {
  container: {
    minHeight: "calc(100vh - 60px)",
    background: "#000",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
  },
  card: {
    background: "#111",
    borderRadius: "16px",
    padding: "40px",
    width: "360px",
    textAlign: "center",
    boxShadow: "0 0 40px rgba(0,0,0,0.9)",
  },
  avatar: {
    width: "100px",
    height: "100px",
    borderRadius: "50%",
    marginBottom: "15px",
  },
  name: {
    color: "#fff",
    marginBottom: "25px",
  },
  infoBlock: {
    textAlign: "left",
    marginBottom: "15px",
  },
  logout: {
    marginTop: "30px",
    width: "100%",
    padding: "12px",
    background: "#e74c3c",
    border: "none",
    borderRadius: "8px",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
  },
};
