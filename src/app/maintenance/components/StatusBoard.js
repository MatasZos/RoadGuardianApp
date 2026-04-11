export default function StatusBoard({ summary }) {
  if (!summary) return null;

  return (
    <div>
      <h2>{summary.bike}</h2>
      <p>{summary.currentKm} km</p>
    </div>
  );
}