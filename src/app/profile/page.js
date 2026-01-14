"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [checked, setChecked] = useState(false); 

  useEffect(() => {
    const fullName = localStorage.getItem("userFullName");
    const email = localStorage.getItem("userEmail");
    const phone = localStorage.getItem("userPhone");

    if (!fullName || !email) {
      if (!checked) {
        setChecked(true);
        router.push("/login");
      }
      return;
    }
    setUser({ fullName, email, phone });
    setChecked(true);
  }, [router, checked]);

  if (!checked) return null;

  return (
    <>
      <Navbar />

      {user && (
        <div style={styles.container}>
          <div style={styles.card}>
            <img src="/profile.png" style={styles.avatar} />
            <h2 style={styles.name}>{user.fullName}</h2>

            <div style={styles.infoBlock}>
              <label>Email</label>
              <p>{user.email}</p>
            </div>

            <div style={styles.infoBlock}>
              <label>Phone</label>
              <p>{user.phone || "Not provided"}</p>
            </div>

            <button
              style={styles.logout}
              onClick={() => {
                localStorage.clear();
                router.push("/login");
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
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
