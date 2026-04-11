"use client";

import { useRouter } from "next/navigation";
import styles from "./page.module.css";

const features = [
  {
    title: "Maintenance Tracking",
    description:
      "Log oil changes, tire rotations, inspections, and more.",
    image: "/maintenance.png",
  },
  {
    title: "Document Storage",
    description:
      "Store insurance, registration, receipts, and documents securely.",
    image: "/document.png",
    reverse: true,
  },
  {
    title: "Emergency Help",
    description:
      "Quick access to emergency contacts and roadside assistance.",
    image: "/emergency.png",
  },
  {
    title: "AI Assistant",
    description:
      "Get real-time help and guidance from your built-in AI assistant.",
    image: "/ai.png",
    reverse: true,
  },
  {
    title: "Community Chat",
    description:
      "Connect with other riders and share tips.",
    image: "/community.png",
  },
];

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <h1>RoadGuardian</h1>
        <p>
          Your all-in-one companion for safer, smarter, and more connected driving.
        </p>
      </section>

      <section className={styles.features}>
        {features.map((f, i) => (
          <Feature key={i} {...f} />
        ))}
      </section>

      <section className={styles.cta}>
        <h2>Get Started</h2>
        <p>Register or log in to unlock the full experience.</p>

        <div className={styles.buttons}>
          <button
            className={styles.primary}
            onClick={() => router.push("/register")}
          >
            Register
          </button>
          <button
            className={styles.secondary}
            onClick={() => router.push("/login")}
          >
            Login
          </button>
        </div>
      </section>
    </div>
  );
}

function Feature({ title, description, image, reverse }) {
  return (
    <div className={`${styles.feature} ${reverse ? styles.reverse : ""}`}>
      <img src={image} alt={title} />
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}