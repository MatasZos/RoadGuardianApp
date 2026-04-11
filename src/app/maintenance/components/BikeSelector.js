import styles from "../maintenance.module.css";

export default function BikeSelector({ selectedBike, setSelectedBike }) {
  return (
    <div className={styles.card}>
      <h2>Select Bike</h2>

      <input
        className={styles.input}
        placeholder="Bike name"
        value={selectedBike}
        onChange={(e) => setSelectedBike(e.target.value)}
      />
    </div>
  );
}