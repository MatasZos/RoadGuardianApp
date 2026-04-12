import s from "./maintenance.module.css";

export default function BikeSelector({ selectedBike, bikeSearch, setBikeSearch, bikeResults, bikeLoading, onSearch, onPick }) {
  return (
    <div className={s.bikeCard}>
      <p className={s.sectionLabel}>Vehicle</p>
      <h2 className={s.sectionTitle}>Your Motorbike</h2>
      <p className={s.selectedBikeDisplay}>
        Selected: <strong>{selectedBike || "None — search below"}</strong>
      </p>

      <div className={s.bikeSearchRow}>
        {[
          { field: "make",  placeholder: "Make (e.g. Kawasaki)" },
          { field: "model", placeholder: "Model (e.g. Ninja)" },
          { field: "year",  placeholder: "Year" },
        ].map(({ field, placeholder }) => (
          <input
            key={field}
            className={s.formInput}
            placeholder={placeholder}
            value={bikeSearch[field]}
            onChange={(e) => setBikeSearch({ ...bikeSearch, [field]: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
          />
        ))}
        <button className={s.btnSearch} type="button" onClick={onSearch} disabled={bikeLoading}>
          {bikeLoading ? "Searching…" : "Search"}
        </button>
      </div>

      {bikeResults.length > 0 && (
        <div className={s.bikeResultsGrid}>
          {bikeResults.slice(0, 8).map((bike, idx) => (
            <button
              key={`${bike.make}-${bike.model}-${bike.year}-${idx}`}
              type="button"
              className={s.bikeResultBtn}
              onClick={() => onPick(bike)}
            >
              <div className={s.bikeResultName}>
                {bike.make} {String(bike.model).trim()}
              </div>
              <div className={s.bikeResultYear}>
                {bike.year}{bike.type ? ` · ${bike.type}` : ""}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
