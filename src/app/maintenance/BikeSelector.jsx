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
    <div className={`${styles.panel} ${styles.bikeCard}`}>
      <h2 className={styles.bikeTitle}>Your Motorbike</h2>
      <p className={styles.bikeSelected}>
        <strong>Selected:</strong> {selectedBike || "None selected"}
      </p>

      <div className={styles.bikeRow}>
        {["make", "model", "year"].map((field) => (
          <input
            key={field}
            className={styles.input}
            placeholder={
              field === "make"
                ? "Make (e.g. Kawasaki)"
                : field === "model"
                ? "Model (e.g. Ninja)"
                : "Year (optional)"
            }
            value={bikeSearch[field]}
            onChange={(e) =>
              setBikeSearch({ ...bikeSearch, [field]: e.target.value })
            }
          />
        ))}

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
