"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "../components/Navbar";
import styles from "./maintenance.module.css";

import StatusBoard from "./components/StatusBoard";
import BikeSelector from "./components/BikeSelector";
import MaintenanceForm from "./components/MaintenanceForm";
import Timeline from "./components/Timeline";

export default function MaintenancePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [records, setRecords] = useState([]);
  const [selectedBike, setSelectedBike] = useState("");

  const email = session?.user?.email;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status]);

  useEffect(() => {
    if (!email) return;
    fetchRecords();
  }, [email]);

  async function fetchRecords() {
    const res = await fetch("/api/maintenance", {
      headers: { "x-user-email": email },
    });
    const data = await res.json();
    setRecords(data || []);
  }

  if (status === "loading") {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <>
      <Navbar />

      <div className={styles.container}>
        <h1 className={styles.title}>Maintenance</h1>

        <BikeSelector
          selectedBike={selectedBike}
          setSelectedBike={setSelectedBike}
        />

        <StatusBoard
          records={records}
          selectedBike={selectedBike}
        />

        <MaintenanceForm
          selectedBike={selectedBike}
          fetchRecords={fetchRecords}
        />

        <Timeline records={records} fetchRecords={fetchRecords} />
      </div>
    </>
  );
}