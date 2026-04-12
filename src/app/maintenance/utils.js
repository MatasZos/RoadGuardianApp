import { serviceIntervals } from "./constants";

export function safeDate(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDisplayDate(value) {
  const d = safeDate(value);
  if (!d) return String(value || "");
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

export function monthYearLabel(value) {
  const d = safeDate(value);
  if (!d) return "Unknown date";
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export function groupByMonth(recs) {
  return recs.reduce((groups, r) => {
    const key = monthYearLabel(r.date || r.createdAt);
    (groups[key] = groups[key] || []).push(r);
    return groups;
  }, {});
}

export function getTaskStatus(remainingKm) {
  if (!Number.isFinite(remainingKm)) return { label: "Unknown", color: "#94a3b8" };
  if (remainingKm < 0)    return { label: "Overdue",   color: "#ef4444" };
  if (remainingKm <= 500) return { label: "Urgent",    color: "#dc2626" };
  if (remainingKm <= 1500) return { label: "Due soon", color: "#f59e0b" };
  return { label: "Healthy", color: "#22c55e" };
}

export function getPreviewFromForm(types, km) {
  const numericKm = Number(km);
  if (!Array.isArray(types) || !types.length || !Number.isFinite(numericKm)) return [];
  return types
    .map((type) => {
      const intervalKm = serviceIntervals[type];
      if (!Number.isFinite(intervalKm)) return null;
      return { type, intervalKm, nextDueKm: numericKm + intervalKm };
    })
    .filter(Boolean)
    .sort((a, b) => a.nextDueKm - b.nextDueKm);
}

export function buildBikeTaskSummary(records) {
  const bikes = {};

  for (const record of records) {
    const bike = record.motorbike || "Unknown bike";
    const km = Number(record.km);

    if (!bikes[bike]) bikes[bike] = { bike, currentKm: 0, tasks: {}, records: [] };

    bikes[bike].records.push(record);
    if (Number.isFinite(km) && km > bikes[bike].currentKm) bikes[bike].currentKm = km;

    const taskList = Array.isArray(record.type) ? record.type : [];
    for (const task of taskList) {
      const existing = bikes[bike].tasks[task];
      const recordDate = safeDate(record.date || record.createdAt);
      const existingDate = existing ? safeDate(existing.date || existing.createdAt) : null;

      const shouldReplace =
        !existing ||
        (Number.isFinite(km) && Number(record.km) > Number(existing.km)) ||
        (recordDate && existingDate && recordDate > existingDate);

      if (shouldReplace) {
        bikes[bike].tasks[task] = {
          type: task,
          motorbike: bike,
          lastServiceKm: km,
          date: record.date,
          notes: record.notes || "",
          advisories: record.advisories || "",
          intervalKm: serviceIntervals[task] || null,
          sourceRecordId: record._id,
          createdAt: record.createdAt,
        };
      }
    }
  }

  return Object.values(bikes).map((bikeData) => {
    const taskItems = Object.values(bikeData.tasks)
      .map((task) => {
        const nextDueKm =
          Number.isFinite(task.lastServiceKm) && Number.isFinite(task.intervalKm)
            ? task.lastServiceKm + task.intervalKm
            : null;
        const remainingKm =
          Number.isFinite(nextDueKm) && Number.isFinite(bikeData.currentKm)
            ? nextDueKm - bikeData.currentKm
            : null;
        return { ...task, nextDueKm, currentBikeKm: bikeData.currentKm, remainingKm, status: getTaskStatus(remainingKm) };
      })
      .sort((a, b) => {
        const aVal = Number.isFinite(a.nextDueKm) ? a.nextDueKm : Number.MAX_SAFE_INTEGER;
        const bVal = Number.isFinite(b.nextDueKm) ? b.nextDueKm : Number.MAX_SAFE_INTEGER;
        return aVal - bVal;
      });

    return {
      bike: bikeData.bike,
      currentKm: bikeData.currentKm,
      tasks: taskItems,
      overdue:  taskItems.filter((t) => Number.isFinite(t.remainingKm) && t.remainingKm < 0),
      dueSoon:  taskItems.filter((t) => Number.isFinite(t.remainingKm) && t.remainingKm >= 0 && t.remainingKm <= 1500),
      upcoming: taskItems.filter((t) => Number.isFinite(t.remainingKm) && t.remainingKm > 1500),
    };
  });
}
