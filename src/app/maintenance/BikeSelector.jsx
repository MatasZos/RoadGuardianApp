import { styles } from "./styles";

export default function BikeSelector({ selectedBike, bikeSearch, setBikeSearch, bikeResults, bikeLoading, onSearch, onPick }) {
  return (
    <div style={styles.bikeCard}>
      <h2 style={styles.bikeTitle}>Your Motorbike</h2>
      <p style={styles.bikeSelected}>
        <strong>Selected:</strong> {selectedBike || "None selected"}
      </p>

      <div style={styles.bikeRow}>
        {["make", "model", "year"].map((field) => (
          <input
            key={field}
            style={styles.input}
            placeholder={field === "make" ? "Make (e.g. Kawasaki)" : field === "model" ? "Model (e.g. Ninja)" : "Year (optional)"}
            value={bikeSearch[field]}
            onChange={(e) => setBikeSearch({ ...bikeSearch, [field]: e.target.value })}
          />
        ))}
        <button type="button" style={styles.bikeButton} onClick={onSearch} disabled={bikeLoading}>
          {bikeLoading ? "Searching..." : "Search"}
        </button>
      </div>

      {bikeResults.length > 0 && (
        <div style={styles.bikeResults}>
          {bikeResults.slice(0, 8).map((bike, idx) => (
            <button
              key={`${bike.make}-${bike.model}-${bike.year}-${idx}`}
              type="button"
              style={styles.bikeResultItem}
              onClick={() => onPick(bike)}
            >
              <div>
                <strong>{bike.make} {String(bike.model).trim()}</strong>{" "}
                <span style={{ color: "#aaa" }}>({bike.year})</span>
              </div>
              <div style={{ color: "#aaa", fontSize: "0.85rem" }}>
                {bike.type ? `Type: ${bike.type}` : "Tap to select"}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
