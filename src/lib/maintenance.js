

export const SERVICE_INTERVALS_KM = {
  "Oil Change": 5000,
  "Oil Filter Replacement": 5000,
  "Air Filter Replacement": 12000,
  "Chain Clean & Lube": 800,
  "Chain Adjustment": 1500,
  "Chain & Sprocket Kit Replacement": 20000,
  "Brake Pads Replacement": 15000,
  "Brake Fluid Change": 20000,
  "Tire Replacement": 12000,
  "Tire Pressure Check": 500,
  "Spark Plug Replacement": 12000,
  "Battery Replacement": 30000,
  "Clutch Cable Adjustment": 8000,
  "Throttle Cable Adjustment": 8000,
  "Fuel Filter Replacement": 15000,
  "Suspension Service": 25000,
  "Wheel Bearings Check": 12000,
  "Headlight Bulb Replacement": 20000,
  "Indicator Bulb Replacement": 20000,
  "Brake Disc Replacement": 30000,
};

export const MAINTENANCE_TASKS = Object.keys(SERVICE_INTERVALS_KM);

function safeDate(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDisplayDate(value) {
  const d = safeDate(value);
  if (!d) return String(value || "");
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function monthYearLabel(value) {
  const d = safeDate(value);
  if (!d) return "Unknown date";
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export function groupByMonth(records) {
  return records.reduce((groups, r) => {
    const key = monthYearLabel(r.date || r.createdAt);
    (groups[key] = groups[key] || []).push(r);
    return groups;
  }, {});
}

export function getTaskStatus(remainingKm) {
  if (!Number.isFinite(remainingKm)) return { label: "Unknown", color: "#94a3b8" };
  if (remainingKm < 0)     return { label: "Overdue",  color: "#ef4444" };
  if (remainingKm <= 500)  return { label: "Urgent",   color: "#dc2626" };
  if (remainingKm <= 1500) return { label: "Due soon", color: "#f59e0b" };
  return { label: "Healthy", color: "#22c55e" };
}


export function buildBikeTaskSummary(records) {
  const bikes = {};

  for (const record of records) {
    const bike = record.motorbike || "Unknown bike";
    const km = Number(record.km);

    if (!bikes[bike]) {
      bikes[bike] = { bike, currentKm: 0, tasks: {} };
    }
    if (Number.isFinite(km) && km > bikes[bike].currentKm) {
      bikes[bike].currentKm = km;
    }

    const taskList = Array.isArray(record.type) ? record.type : [];
    for (const task of taskList) {
      const existing = bikes[bike].tasks[task];
      const recordDate = safeDate(record.date || record.createdAt);
      const existingDate = existing ? safeDate(existing.date || existing.createdAt) : null;

      const shouldReplace =
        !existing ||
        (Number.isFinite(km) && km > Number(existing.lastServiceKm)) ||
        (recordDate && existingDate && recordDate > existingDate);

      if (shouldReplace) {
        bikes[bike].tasks[task] = {
          type: task,
          motorbike: bike,
          lastServiceKm: km,
          date: record.date,
          notes: record.notes || "",
          advisories: record.advisories || "",
          intervalKm: SERVICE_INTERVALS_KM[task] ?? null,
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

        return {
          ...task,
          nextDueKm,
          currentBikeKm: bikeData.currentKm,
          remainingKm,
          status: getTaskStatus(remainingKm),
        };
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

export function getPreviewFromForm(types, km) {
  const numericKm = Number(km);
  if (!Array.isArray(types) || !types.length || !Number.isFinite(numericKm)) return [];

  return types
    .map((type) => {
      const intervalKm = SERVICE_INTERVALS_KM[type];
      if (!Number.isFinite(intervalKm)) return null;
      return { type, intervalKm, nextDueKm: numericKm + intervalKm };
    })
    .filter(Boolean)
    .sort((a, b) => a.nextDueKm - b.nextDueKm);
}
