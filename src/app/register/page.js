"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    motorbike: "",
  });

  // Bike search inputs
  const [bikeSearch, setBikeSearch] = useState({
    make: "",
    model: "",
    year: "",
  });

  const [bikeResults, setBikeResults] = useState([]);
  const [bikeLoading, setBikeLoading] = useState(false);

  const [message, setMessage] = useState("");

  async function handleRegister(e) {
    e.preventDefault();

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        accountType: "user",
      }),
    });

    if (res.ok) {
      setMessage("Account created successfully");
      setTimeout(() => router.push("/login"), 1200);
    } else {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error || "Registration failed");
    }
  }

  async function handleBikeSearch() {
    setMessage("");
    setBikeResults([]);

    const make = bikeSearch.make.trim();
    const model = bikeSearch.model.trim();
    const year = bikeSearch.year.trim();

    // API requires either make or model
    if (!make && !model) {
      setMessage("Enter a Make or Model to search for motorbikes.");
      return;
    }

    const qs = new URLSearchParams();
    if (make) qs.set("make", make);
    if (model) qs.set("model", model);
    if (year) qs.set("year", year);

    setBikeLoading(true);
    try {
      const res = await fetch(`/api/motorcycles?${qs.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Bike search failed");
        return;
      }

      setBikeResults(Array.isArray(data) ? data : []);
      if (!data || data.length === 0) {
        setMessage("No bikes found. Try different keywords.");
      }
    } catch (err) {
      setMessage("Bike search error.");
    } finally {
      setBikeLoading(false);
    }
  }

  function selectBike(bike) {
    const label = `${bike.make} ${String(bike.model).trim()} (${bike.year})`;
    setForm((prev) => ({ ...prev, motorbike: label }));
    setMessage(`Selected motorbike: ${label}`);
    // optional: hide results after selecting
    // setBikeResults([]);
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <img src="/logo.png" alt="RoadGuardian" style={styles.logo} />

        <h1 style={styles.title}>Create your account</h1>

        <form onSubmit={handleRegister} style={styles.form}>
          <input
            style={styles.input}
            placeholder="Full Name"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            required
          />

          <input
            style={styles.input}
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />

          <input
            style={styles.input}
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />

          <input
            style={styles.input}
            placeholder="Phone Number"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
          />

          {/* --- Motorbike picker section --- */}
          <div style={styles.section}>
            <p style={styles.sectionTitle}>Pick your motorbike</p>

            <div style={styles.row}>
              <input
                style={{ ...styles.input, ...styles.rowInput }}
                placeholder="Make (e.g. Kawasaki)"
                value={bikeSearch.make}
                onChange={(e) =>
                  setBikeSearch({ ...bikeSearch, make: e.target.value })
                }
              />
              <input
                style={{ ...styles.input, ...styles.rowInput }}
                placeholder="Model (e.g. Ninja)"
                value={bikeSearch.model}
                onChange={(e) =>
                  setBikeSearch({ ...bikeSearch, model: e.target.value })
                }
              />
            </div>

            <div style={styles.row}>
              <input
                style={{ ...styles.input, ...styles.rowInput }}
                placeholder="Year (optional, e.g. 2022)"
                value={bikeSearch.year}
                onChange={(e) =>
                  setBikeSearch({ ...bikeSearch, year: e.target.value })
                }
              />

              <button
                type="button"
                style={{ ...styles.button, ...styles.searchButton }}
                onClick={handleBikeSearch}
                disabled={bikeLoading}
              >
                {bikeLoading ? "Searching..." : "Search Bikes"}
              </button>
            </div>

            {/* This is what gets saved to MongoDB */}
            <input
              style={styles.input}
              placeholder="Selected motorbike will appear here"
              value={form.motorbike}
              onChange={(e) => setForm({ ...form, motorbike: e.target.value })}
              required
            />

            {bikeResults.length > 0 && (
              <div style={styles.results}>
                {bikeResults.slice(0, 8).map((bike, idx) => (
                  <button
                    key={`${bike.make}-${bike.model}-${bike.year}-${idx}`}
                    type="button"
                    style={styles.resultItem}
                    onClick={() => selectBike(bike)}
                  >
                    <div style={styles.resultTop}>
                      <strong>
                        {bike.make} {String(bike.model).trim()}
                      </strong>{" "}
                      <span style={styles.resultMeta}>({bike.year})</span>
                    </div>
                    <div style={styles.resultSub}>
                      {bike.type ? `Type: ${bike.type}` : "Tap to select"}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button style={styles.button}>Register</button>
        </form>

        {message && <p style={styles.message}>{message}</p>}

        <p style={styles.loginText}>
          Already have an account?{" "}
          <span style={styles.loginLink} onClick={() => router.push("/login")}>
            Login here
          </span>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "radial-gradient(circle at top, #1a1a1a, #000)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    background: "#0f0f0f",
    padding: "40px",
    borderRadius: "16px",
    width: "420px",
    textAlign: "center",
    boxShadow: "0 0 40px rgba(0,0,0,0.8)",
  },
  logo: {
    width: "110px",
    marginBottom: "15px",
  },
  title: {
    color: "#fff",
    marginBottom: "5px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    background: "#1e1e1e",
    color: "#fff",
  },
  button: {
    marginTop: "10px",
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    background: "#3498db",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
  },
  message: {
    marginTop: "12px",
    color: "#2ecc71",
  },
  loginText: {
    marginTop: "22px",
    color: "#aaa",
    fontSize: "0.85rem",
  },
  loginLink: {
    color: "#fff",
    cursor: "pointer",
    textDecoration: "underline",
  },

  //css style 
  section: {
    marginTop: "4px",
    padding: "12px",
    borderRadius: "12px",
    background: "#121212",
    border: "1px solid rgba(255,255,255,0.06)",
    textAlign: "left",
  },
  sectionTitle: {
    margin: "0 0 10px 0",
    color: "#fff",
    fontSize: "0.95rem",
    fontWeight: "600",
  },
  row: {
    display: "flex",
    gap: "10px",
    marginBottom: "10px",
  },
  rowInput: {
    flex: 1,
  },
  searchButton: {
    marginTop: "0px",
    width: "150px",
  },
  results: {
    marginTop: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  resultItem: {
    textAlign: "left",
    padding: "10px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "#1a1a1a",
    color: "#fff",
    cursor: "pointer",
  },
  resultTop: {
    display: "flex",
    gap: "8px",
    alignItems: "baseline",
  },
  resultMeta: {
    color: "#aaa",
    fontSize: "0.85rem",
  },
  resultSub: {
    marginTop: "4px",
    color: "#aaa",
    fontSize: "0.85rem",
  },
};
