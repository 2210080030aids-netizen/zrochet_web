export const REJECTION_REASONS = [
  "Payment details are not clear",
  "Payment screenshot is blurred",
  "Invalid transaction ID",
  "Incorrect payment amount",
  "Payment could not be verified",
] as const;

export const REJECTION_REASON_OTHER = "Other (custom reason)";

export type PredefinedRejectionReason = (typeof REJECTION_REASONS)[number];
