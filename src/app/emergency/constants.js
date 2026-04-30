// Constants for emergency feature
export const INCIDENT_TYPES = [
  "breakdown",
  "crash",
  "flat_tyre",
  "mechanical_issue",
  "fuel_issue",
  "medical_issue",
  "other",
];

//Severity levels for incidents, used both for user input and display.
export const SEVERITIES = ["low", "medium", "high", "critical"];

// Status labels for different stages of an incident, used to display the current state of an emergency 
export const STATUS_LABELS = {
  reported: "Reported",
  dispatching: "Dispatching",
  rider_responding: "Rider responding",
  help_on_the_way: "Help on the way",
  assistance_received: "Assistance received",
  resolved: "Resolved",
  cancelled: "Cancelled",
};

// Quick reply options for helpers to use in the chat, allowing them to respond efficiently with common messages during an emergency.
export const QUICK_REPLIES = [
  "I'm nearby.",
  "Are you safe?",
  "I'm on the way.",
  "What exactly happened?",
  "Do you need medical help?",
];
