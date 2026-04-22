import styles from "./maintenance.module.css";

export default function BikeSelector({
  selectedBike,
  bikeSearch,
  setBikeSearch,
  bikeResults,
  bikeLoading,
  onSearch,
  onPick,
}) {
  return (
    <div className={styles.bikeWrap}>
      <div className={styles.selectedBikeCard}>
        <p className={styles.selectedBikeLabel}>Selected Bike</p>
        <p className={styles.selectedBikeValue}>
          {selectedBike || "No bike selected yet"}
        </p>
      </div>

      <div className={styles.bikeSearchGrid}>
        <input
          className={styles.input}
          placeholder="Make (e.g. Kawasaki)"
          value={bikeSearch.make}
          onChange={(e) =>
            setBikeSearch({ ...bikeSearch, make: e.target.value })
          }
        />

        <input
          className={styles.input}
          placeholder="Model (e.g. Ninja)"
          value={bikeSearch.model}
          onChange={(e) =>
            setBikeSearch({ ...bikeSearch, model: e.target.value })
          }
        />

        <input
          className={styles.input}
          placeholder="Year (optional)"
          value={bikeSearch.year}
          onChange={(e) =>
            setBikeSearch({ ...bikeSearch, year: e.target.value })
          }
        />

        <button
          type="button"
          className={styles.bikeButton}
          onClick={onSearch}
          disabled={bikeLoading}
        >
          {bikeLoading ? "Searching..." : "Search"}
        </button>
      </div>

      {bikeResults.length > 0 && (
        <div className={styles.bikeResults}>
          {bikeResults.slice(0, 8).map((bike, idx) => (
            <button
              key={`${bike.make}-${bike.model}-${bike.year}-${idx}`}
              type="button"
              className={styles.bikeResultItem}
              onClick={() => onPick(bike)}
            >
              <div>
                <strong>
                  {bike.make} {String(bike.model).trim()}
                </strong>{" "}
                <span className={styles.resultMeta}>({bike.year})</span>
              </div>

              <div className={styles.resultSub}>
                {bike.type ? `Type: ${bike.type}` : "Tap to select"}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
