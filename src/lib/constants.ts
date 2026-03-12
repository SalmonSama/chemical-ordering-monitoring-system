/**
 * Application-wide constants for the Chemical Ordering & Monitoring System.
 */

// --- PPM Thresholds for Peroxide Inspection ---
export const PPM_THRESHOLD_WARNING = 30;
export const PPM_THRESHOLD_QUARANTINE = 100;

// --- Village Codes ---
export const VILLAGE_CODES = ["AIE", "MTP", "CT", "ATC"] as const;
export type VillageCode = (typeof VILLAGE_CODES)[number];

// --- Human-readable labels for enum values ---

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  ordered: "Ordered",
  partially_received: "Partially Received",
  received: "Received",
  closed: "Closed",
};

export const LOT_STATUS_LABELS: Record<string, string> = {
  active: "Active",
  depleted: "Depleted",
  expired: "Expired",
  quarantined: "Quarantined",
  disposed: "Disposed",
};

export const INSPECTION_STATUS_LABELS: Record<string, string> = {
  normal: "Normal",
  warning: "Warning",
  quarantine: "Quarantine",
};

export const EXTENSION_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export const REGULATORY_STATUS_LABELS: Record<string, string> = {
  active: "Active",
  expired: "Expired",
  pending_review: "Pending Review",
};

export const USER_STATUS_LABELS: Record<string, string> = {
  pending: "Pending Approval",
  active: "Active",
  rejected: "Rejected",
  inactive: "Inactive",
};

export const USER_ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  requester: "Requester",
  focal_point: "Focal Point",
  staff: "Staff",
  compliance: "Compliance",
};

export const ITEM_CATEGORY_LABELS: Record<string, string> = {
  chemical_reagent: "Chemical / Reagent",
  calibration_std: "Calibration STD",
  gas: "Gas",
  material_supply: "Material Supply / Consumables",
  peroxide: "Peroxide",
};

export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  order_created: "Order Created",
  order_approved: "Order Approved",
  order_rejected: "Order Rejected",
  check_in: "Check-In",
  check_out: "Check-Out",
  inspection: "Inspection",
  shelf_life_extension: "Shelf Life Extension",
  regulatory_update: "Regulatory Update",
  user_approved: "User Approved",
};

// --- Badge color classes by status ---

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  ordered: "bg-purple-100 text-purple-800",
  partially_received: "bg-orange-100 text-orange-800",
  received: "bg-green-100 text-green-800",
  closed: "bg-slate-100 text-slate-600",
};

export const LOT_STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  depleted: "bg-slate-100 text-slate-600",
  expired: "bg-red-100 text-red-800",
  quarantined: "bg-orange-100 text-orange-800",
  disposed: "bg-slate-100 text-slate-500",
};

export const INSPECTION_STATUS_COLORS: Record<string, string> = {
  normal: "bg-green-100 text-green-700",
  warning: "bg-yellow-100 text-yellow-700",
  quarantine: "bg-red-100 text-red-700",
};

export const USER_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  active: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  inactive: "bg-slate-100 text-slate-600",
};

// --- PO Number format ---
export const PO_PREFIX = "PO";
export const PO_SEPARATOR = "-";

// --- Pagination ---
export const DEFAULT_PAGE_SIZE = 12;
