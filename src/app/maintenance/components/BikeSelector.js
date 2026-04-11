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

        <input
          className={styles.input}
          placeholder="Model"
          value={bikeSearch.model}
          onChange={(e) =>
            setBikeSearch({ ...bikeSearch, model: e.target.value })
          }
        />

        <input
          className={styles.input}
          placeholder="Year"
          value={bikeSearch.year}
          onChange={(e) =>
            setBikeSearch({ ...bikeSearch, year: e.target.value })
          }
        />

        <button onClick={handleBikeSearch} className={styles.button}>
          {bikeLoading ? "Searching..." : "Search"}
        </button>
      </div>

      {bikeResults.length > 0 && (
        <div className={styles.bikeResults}>
          {bikeResults.slice(0, 8).map((bike, idx) => (
            <div
              key={idx}
              className={styles.bikeResultItem}
              onClick={() => pickBike(bike)}
            >
              <strong>
                {bike.make} {bike.model}
              </strong>{" "}
              ({bike.year})
            </div>
          ))}
        </div>
      )}
    </div>
  );
}