"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "../components/Navbar";
import AiChat from "../components/AiChat";
import styles from "./home.module.css";

const actions = [
  { label: "Maintenance", path: "/maintenance", color: "#f39c12" },
  { label: "Documents", path: "/documents", color: "#3498db" },
  { label: "Emergency", path: "/emergency", color: "#e74c3c" },
];

export default function HomePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  if (status === "loading") {
    return <div className={styles.loading}>Loading...</div>;
  }

  const name = session?.user?.name || "";

  return (
    <div className={styles.page}>
      <Navbar />

      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Welcome, {name}</h1>
          <p>Dashboard</p>
        </div>

        <h2 className={styles.sectionTitle}>Quick Actions</h2>

        <div className={styles.actions}>
          {actions.map((action, i) => (
            <button
              key={i}
              className={styles.button}
              style={{ background: action.color }}
              onClick={() => router.push(action.path)}
            >
              {action.label.toUpperCase()}
            </button>
          ))}
        </div>

        <AiChat />
      </div>
    </div>
  );
}