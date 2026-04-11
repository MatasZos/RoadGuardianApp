import styles from "../maintenance.module.css";

export default function BikeSelector({
  selectedBike,
  bikeSearch,
  setBikeSearch,
  bikeResults,
  bikeLoading,
  handleBikeSearch,
  pickBike,
}) {
  return (
    <div className={styles.bikeCard}>
      <h2>Your Motorbike</h2>

      <p>Selected: {selectedBike || "None"}</p>

      <div className={styles.bikeRow}>
        <input
          className={styles.input}
          placeholder="Make"
          value={bikeSearch.make}
          onChange={(e) =>
            setBikeSearch({ ...bikeSearch, make: e.target.value })
          }
        />

        <button
          onClick={handleBikeSearch}
          className={styles.button}
        >
          {bikeLoading ? "Searching..." : "Search"}
        </button>
      </div>

      {bikeResults.map((bike, i) => (
        <button key={i} onClick={() => pickBike(bike)}>
          {bike.make} {bike.model}
        </button>
      ))}
    </div>
  );
}