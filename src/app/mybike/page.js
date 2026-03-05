"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function MyBikePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    motorbike: "",
    bikeYear: "",
    bikeMileage: "",
    bikeNotes: "",
  });

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      setLoading(false);
      return;
    }

    const fetchBike = async () => {
      try {
        const res = await fetch("/api/mybike", { method: "GET" });
        const data = await res.json();

        if (res.ok) {
          setForm({
            motorbike: data?.bike?.motorbike || "",
            bikeYear: data?.bike?.bikeYear || "",
            bikeMileage: data?.bike?.bikeMileage || "",
            bikeNotes: data?.bike?.bikeNotes || "",
          });
        } else {
          console.error(data?.error || "Failed to load bike info");
        }
      } catch (err) {
        console.error("Fetch bike error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBike();
  }, [status]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/mybike", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data?.error || "Failed to save");
        alert(data?.error || "Failed to save bike details");
        return;
      }

      alert("Bike details saved!");
    } catch (err) {
      console.error("Save bike error:", err);
      alert("Server error while saving bike details");
    } finally {
      setSaving(false);
    }
  };

  const showAuthWarning = status === "unauthenticated";

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-black text-white px-6 py-10">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">My Bike</h1>
          <p className="text-white/60 mb-8">
            Keep your bike details up to date so RoadGuardian can personalize reminders
            and maintenance tracking.
          </p>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-5">
            {status === "loading" || loading ? (
              <p className="text-white/70">Loading bike details...</p>
            ) : showAuthWarning ? (
              <div className="space-y-3">
                <p className="text-red-400">You’re not signed in. Please log in again.</p>
                <button
                  onClick={() => router.push("/login")}
                  className="px-6 py-3 rounded-lg bg-orange-500 hover:bg-orange-600 transition"
                >
                  Go to Login
                </button>
              </div>
            ) : (
              <>
                <p className="text-white/50 text-sm">
                  Signed in as: {session?.user?.email}
                </p>

                <div>
                  <label className="block text-sm text-white/70 mb-2">
                    Bike (Make + Model)
                  </label>
                  <input
                    name="motorbike"
                    value={form.motorbike}
                    onChange={handleChange}
                    placeholder="e.g. Yamaha MT-07"
                    className="w-full rounded-lg bg-black border border-white/15 px-4 py-3 outline-none focus:border-white/30"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm text-white/70 mb-2">
                      Year
                    </label>
                    <input
                      name="bikeYear"
                      value={form.bikeYear}
                      onChange={handleChange}
                      placeholder="e.g. 2021"
                      className="w-full rounded-lg bg-black border border-white/15 px-4 py-3 outline-none focus:border-white/30"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-white/70 mb-2">
                      Current Mileage (km)
                    </label>
                    <input
                      name="bikeMileage"
                      value={form.bikeMileage}
                      onChange={handleChange}
                      placeholder="e.g. 18450"
                      className="w-full rounded-lg bg-black border border-white/15 px-4 py-3 outline-none focus:border-white/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-white/70 mb-2">
                    Notes
                  </label>
                  <textarea
                    name="bikeNotes"
                    value={form.bikeNotes}
                    onChange={handleChange}
                    placeholder="e.g. New tyres fitted Jan 2026, chain replaced, etc."
                    rows={4}
                    className="w-full rounded-lg bg-black border border-white/15 px-4 py-3 outline-none focus:border-white/30 resize-none"
                  />
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full md:w-auto px-6 py-3 rounded-lg bg-orange-500 hover:bg-orange-600 transition disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Bike Details"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
