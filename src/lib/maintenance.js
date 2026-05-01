//service intervals in km for each maintenance task type
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
// List of all maintenance task types
export const MAINTENANCE_TASKS = Object.keys(SERVICE_INTERVALS_KM);

// safedate returns a Date object if the input is a valid date, or null if it's invalid or not a date
function safeDate(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

// formatDisplayDate formats a date value into a readable string format
export function formatDisplayDate(value) {
  const d = safeDate(value);
  if (!d) return String(value || "");
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

// monthYearLabel formats a date value into a month/year format for grouping 
function monthYearLabel(value) {
  const d = safeDate(value);
  if (!d) return "Unknown date";
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

//groupByMonth groups maintenance records by the month and year of their date or createdAt field
export function groupByMonth(records) {
  return records.reduce((groups, r) => {
    const key = monthYearLabel(r.date || r.createdAt);
    (groups[key] = groups[key] || []).push(r);
    return groups;
  }, {});
}

//getTaskStatus returns a status label and color based on the remaining kilometers until the next service is due
export function getTaskStatus(remainingKm) {
  if (!Number.isFinite(remainingKm)) return { label: "Unknown", color: "#94a3b8" };
  if (remainingKm < 0)     return { label: "Overdue",  color: "#ef4444" };
  if (remainingKm <= 500)  return { label: "Urgent",   color: "#dc2626" };
  if (remainingKm <= 1500) return { label: "Due soon", color: "#f59e0b" };
  return { label: "Healthy", color: "#22c55e" };
}

//makes a summary of maintenance tasks for each bike, determining the next due km and status for each task based on the last service record and current km
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

      // We replace the existing task record if there is no existing record, or if the new record has a more recent service date, or if the new record has a higher km reading 
      const shouldReplace = !existing || (Number.isFinite(km) && km > Number(existing.lastServiceKm)) || (recordDate && existingDate && recordDate > existingDate);

      //if a record doesnt have a valid km or date, it is still added but will be treated as low priority for determining the next due service
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

  //after processing all records, calculate the next due km and status for each task, and sort the tasks by next due km
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

        // Return the task with additional information for next due km, current bike km, remaining km, and status
        return {
          ...task,
          nextDueKm,
          currentBikeKm: bikeData.currentKm,
          remainingKm,
          status: getTaskStatus(remainingKm),
        };
      })

      // Sort tasks by next due km
      .sort((a, b) => {
        const aVal = Number.isFinite(a.nextDueKm) ? a.nextDueKm : Number.MAX_SAFE_INTEGER;
        const bVal = Number.isFinite(b.nextDueKm) ? b.nextDueKm : Number.MAX_SAFE_INTEGER;
        return aVal - bVal;
      });

    // Return the bike summary with the list of tasks, as well as separate lists for overdue, due soon, and upcoming tasks based on the remaining km
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

//takes the list of selected maintenance task types and current km, and returns a preview list of the next due km for each task type, sorted by which one is due soonest
export function getPreviewFromForm(types, km) {
  const numericKm = Number(km);
  if (!Array.isArray(types) || !types.length || !Number.isFinite(numericKm)) return [];
  return types
    .map((type) => {
      const intervalKm = SERVICE_INTERVALS_KM[type];
      if (!Number.isFinite(intervalKm)) return null;
      return { type, intervalKm, nextDueKm: numericKm + intervalKm };
    })
    // Filter out any tasks that don't have a valid interval, and sort by next due km
    .filter(Boolean)
    .sort((a, b) => a.nextDueKm - b.nextDueKm);
}
