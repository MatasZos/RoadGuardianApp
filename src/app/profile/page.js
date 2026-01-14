"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    const name = localStorage.getItem("userFullName");
    if (!name) router.push("/login");
    else setFullName(name);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("userFullName");
    router.push("/login");
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", padding: "20px" }}>
      <h1>Profile</h1>
      <p><strong>Name:</strong> {fullName}</p>

      <div style={{ marginTop: "20px" }}>
        <button onClick={handleSignOut} style={{ padding: "10px 20px", borderRadius: "8px", border: "none", backgroundColor: "#e74c3c", color: "#fff", cursor: "pointer" }}>
          Sign Out
        </button>
      </div>
    </div>
  );
}
