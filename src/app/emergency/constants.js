export const INCIDENT_TYPES = [
  "breakdown",
  "crash",
  "flat_tyre",
  "mechanical_issue",
  "fuel_issue",
  "medical_issue",
  "other",
];

export const SEVERITIES = ["low", "medium", "high", "critical"];

// Server stores statuses as snake_case; the UI shows these labels instead.
export const STATUS_LABELS = {
  reported: "Reported",
  dispatching: "Dispatching",
  rider_responding: "Rider responding",
  help_on_the_way: "Help on the way",
  assistance_received: "Assistance received",
  resolved: "Resolved",
  cancelled: "Cancelled",
};

export const QUICK_REPLIES = [
  "I'm nearby.",
  "Are you safe?",
  "I'm on the way.",
  "What exactly happened?",
  "Do you need medical help?",
];
