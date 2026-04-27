"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Container, Row, Col, Button, Card } from "react-bootstrap";

const features = [
  {
    title: "Maintenance Tracking",
    description:
      "Log oil changes, tire rotations, inspections and more — never lose track of your bike's service history again.",
    image: "/maintenance.png",
    icon: "bi-wrench-adjustable",
  },
  {
    title: "Document Storage",
    description:
      "Insurance, registration, receipts — all in one place, encrypted and accessible from anywhere.",
    image: "/document.png",
    icon: "bi-file-earmark-lock-fill",
    reverse: true,
  },
  {
    title: "Emergency Help",
    description:
      "One tap puts you in touch with emergency contacts and roadside assistance — with your live location.",
    image: "/emergency.png",
    icon: "bi-exclamation-triangle-fill",
  },
  {
    title: "AI Assistant",
    description:
      "Real-time guidance for repairs, route planning and on-the-go troubleshooting from a built-in AI.",
    image: "/ai.png",
    icon: "bi-robot",
    reverse: true,
  },
  {
    title: "Community Chat",
    description:
      "Connect with riders nearby, share routes, swap tips and meet up.",
    image: "/community.png",
    icon: "bi-chat-dots-fill",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const featureRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("rg-feature-show");
          }
        });
      },
      { threshold: 0.2 }
    );

    const currentRefs = featureRefs.current;
    currentRefs.forEach((el) => el && observer.observe(el));
    return () => currentRefs.forEach((el) => el && observer.unobserve(el));
  }, []);

  return (
    <div className="bg-body text-body min-vh-100">
      <section className="rg-hero py-5 py-md-6 text-center">
        <Container>
          <div className="rg-hero-eyebrow text-uppercase small fw-semibold mb-3">
            <i className="bi bi-shield-fill-check me-2"></i>For riders, by riders
          </div>
          <h1 className="display-3 fw-bold mb-3 rg-hero-title">RoadGuardian</h1>
          <p className="lead text-body-secondary mx-auto" style={{ maxWidth: 640 }}>
            Your all-in-one companion for safer, smarter and more connected
            riding.
          </p>
        </Container>
      </section>

      {/* Features */}
      <section className="py-5">
        <Container>
          {features.map((f, i) => (
            <Row
              key={i}
              ref={(el) => (featureRefs.current[i] = el)}
              className={`align-items-center g-4 g-md-5 mb-5 pb-3 rg-feature ${
                f.reverse ? "flex-md-row-reverse" : ""
              }`}
            >
              <Col md={6}>
                <Card className="border-0 bg-transparent">
                  <Card.Img
                    src={f.image}
                    alt={f.title}
                    className="rounded-4 shadow-lg"
                    style={{ objectFit: "cover", maxHeight: 360 }}
                  />
                </Card>
              </Col>
              <Col md={6}>
                <div className="rg-feature-icon mb-3">
                  <i className={`bi ${f.icon} fs-1`}></i>
                </div>
                <h2 className="fw-bold mb-3">{f.title}</h2>
                <p className="text-body-secondary fs-5 mb-0">{f.description}</p>
              </Col>
            </Row>
          ))}
        </Container>
      </section>

      <section className="py-5 rg-cta">
        <Container className="text-center">
          <h2 className="fw-bold mb-3">Get Started</h2>
          <p className="text-body-secondary mb-4">
            Register or log in to unlock the full experience.
          </p>
          <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push("/register")}
              className="px-4"
            >
              <i className="bi bi-person-plus-fill me-2"></i>Register
            </Button>
            <Button
              variant="outline-light"
              size="lg"
              onClick={() => router.push("/login")}
              className="px-4"
            >
              <i className="bi bi-box-arrow-in-right me-2"></i>Login
            </Button>
          </div>
        </Container>
      </section>
      <style>{`
        .rg-hero {
          background:
            radial-gradient(1200px 400px at 50% -10%, rgba(13, 110, 253, 0.20), transparent 60%),
            linear-gradient(180deg, var(--bs-body-bg), var(--bs-body-bg));
        }
        .rg-hero-eyebrow {
          color: var(--bs-primary);
          letter-spacing: 0.12em;
        }
        .rg-hero-title {
          letter-spacing: -0.02em;
          background: linear-gradient(180deg, #fff 0%, #aab2bf 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .rg-feature-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 64px;
          height: 64px;
          border-radius: 16px;
          background: rgba(13, 110, 253, 0.12);
          color: var(--bs-primary);
        }
        .rg-feature {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .rg-feature-show {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
        .rg-cta {
          background: linear-gradient(180deg, transparent, rgba(13, 110, 253, 0.06));
          border-top: 1px solid var(--bs-border-color);
        }
      `}</style>
    </div>
  );
}