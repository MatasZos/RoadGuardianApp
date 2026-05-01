export const EMERGENCY_TYPES = [
  "breakdown",
  "crash",
  "flat_tyre",
  "mechanical_issue",
  "fuel_issue",
  "medical_issue",
  "other",
];

export const EMERGENCY_SEVERITIES = ["low", "medium", "high", "critical"];

// Server stores statuses as snake_case; the UI shows these labels instead.
export const EMERGENCY_STATUS_LABELS = {
  reported: "Reported",
  helper_assigned: "Helper Assigned",
  on_the_way: "On The Way",
  arrived: "Arrived",
  resolved: "Resolved",
  cancelled: "Cancelled",

  // Older statuses kept for existing records.
  dispatching: "Reported",
  rider_responding: "Helper Assigned",
  help_on_the_way: "On The Way",
  assistance_received: "Arrived",
};

export const EMERGENCY_QUICK_REPLIES = [
  "I'm nearby.",
  "Are you safe?",
  "I'm on the way.",
  "What exactly happened?",
  "Do you need medical help?",
];
