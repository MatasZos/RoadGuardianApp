"use client";

import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <h1 style={styles.heroTitle}>RoadGuardian</h1>
        <p style={styles.heroSubtitle}>
          Your all‑in‑one companion for safer, smarter, and more connected driving.
        </p>
      </section>
      <section style={styles.featuresSection}>
        <Feature
          title="Maintenance Tracking"
          description="Log oil changes, tire rotations, inspections, and more. Stay ahead of costly repairs with clean, structured records."
          image="/maintenance.png"
        />

        <Feature
          title="Document Storage"
          description="Store insurance, registration, receipts, and service documents securely in one place, accessible anytime."
          image="/document.png"
          reverse
        />

        <Feature
          title="Emergency Response Help"
          description="Instant access to emergency contacts, roadside assistance, and quick‑action tools when you need them most."
          image="/emergency.png"
        />

        <Feature
          title="AI Support Chatbot"
          description="Get real‑time help, guidance, and answers from your personal AI assistant built right into RoadGuardian."
          image="/ai.png"
          reverse
        />

        <Feature
          title="Community Rider Chat"
          description="Connect with other drivers, share tips, ask questions, and be part of a growing community."
          image="/community.png"
        />
      </section>

      {/* CALL TO ACTION */}
      <section style={styles.cta}>
        <h2 style={styles.ctaTitle}>Get Started</h2>
        <p style={styles.ctaSubtitle}>
          Register or log in to unlock the full RoadGuardian experience.
        </p>

        <div style={styles.ctaButtons}>
          <button
            style={styles.registerBtn}
            onClick={() => router.push("/register")}
          >
            Register
          </button>
          <button
            style={styles.loginBtn}
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
    <div
      style={{
        ...styles.feature,
        flexDirection: reverse ? "row-reverse" : "row",
      }}
    >
      <img src={image} alt={title} style={styles.featureImage} />

      <div style={styles.featureText}>
        <h3 style={styles.featureTitle}>{title}</h3>
        <p style={styles.featureDescription}>{description}</p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    background: "#0d0d0d",
    color: "#fff",
    minHeight: "100vh",
    paddingBottom: "80px",
  },

  hero: {
    textAlign: "center",
    padding: "80px 20px 60px",
  },
  heroTitle: {
    fontSize: "3rem",
    fontWeight: "bold",
    marginBottom: "10px",
    color: "#ff8c00",
  },
  heroSubtitle: {
    fontSize: "1.2rem",
    color: "#ccc",
    maxWidth: "600px",
    margin: "0 auto",
  },

  featuresSection: {
    marginTop: "40px",
    display: "flex",
    flexDirection: "column",
    gap: "60px",
    padding: "0 20px",
  },

  feature: {
    display: "flex",
    alignItems: "center",
    gap: "40px",
    maxWidth: "1100px",
    margin: "0 auto",
  },
  featureImage: {
    width: "45%",
    borderRadius: "12px",
    boxShadow: "0 0 20px rgba(0,0,0,0.6)",
  },
  featureText: {
    width: "55%",
  },
  featureTitle: {
    fontSize: "2rem",
    marginBottom: "10px",
    color: "#ff8c00",
  },
  featureDescription: {
    fontSize: "1.1rem",
    color: "#ccc",
    lineHeight: "1.6",
  },

  cta: {
    textAlign: "center",
    marginTop: "80px",
  },
  ctaTitle: {
    fontSize: "2rem",
    marginBottom: "10px",
    color: "#ff8c00",
  },
  ctaSubtitle: {
    color: "#ccc",
    marginBottom: "30px",
  },
  ctaButtons: {
    display: "flex",
    justifyContent: "center",
    gap: "20px",
  },
  registerBtn: {
    padding: "12px 28px",
    background: "#ff8c00",
    border: "none",
    borderRadius: "8px",
    color: "#000",
    fontWeight: "bold",
    cursor: "pointer",
  },
  loginBtn: {
    padding: "12px 28px",
    background: "#1e1e1e",
    border: "2px solid #ff8c00",
    borderRadius: "8px",
    color: "#ff8c00",
    fontWeight: "bold",
    cursor: "pointer",
  },
};
