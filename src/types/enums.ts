/**
 * TypeScript enums mirroring all PostgreSQL enum types.
 * Keep in sync with the database schema in supabase/migrations/.
 */

export enum UserRole {
  Admin = "admin",
  Requester = "requester",
  FocalPoint = "focal_point",
  Staff = "staff",
  Compliance = "compliance",
}

export enum UserStatus {
  Pending = "pending",
  Active = "active",
  Rejected = "rejected",
  Inactive = "inactive",
}

export enum ItemCategory {
  ChemicalReagent = "chemical_reagent",
  CalibrationStd = "calibration_std",
  Gas = "gas",
  MaterialSupply = "material_supply",
  Peroxide = "peroxide",
}

export enum OrderStatus {
  Pending = "pending",
  Approved = "approved",
  Rejected = "rejected",
  Ordered = "ordered",
  PartiallyReceived = "partially_received",
  Received = "received",
  Closed = "closed",
}

export enum LotStatus {
  Active = "active",
  Depleted = "depleted",
  Expired = "expired",
  Quarantined = "quarantined",
  Disposed = "disposed",
}

export enum InspectionStatus {
  Normal = "normal",
  Warning = "warning",
  Quarantine = "quarantine",
}

export enum ExtensionStatus {
  Pending = "pending",
  Approved = "approved",
  Rejected = "rejected",
}

export enum RegulatoryStatus {
  Active = "active",
  Expired = "expired",
  PendingReview = "pending_review",
}

export enum TransactionType {
  OrderCreated = "order_created",
  OrderApproved = "order_approved",
  OrderRejected = "order_rejected",
  CheckIn = "check_in",
  CheckOut = "check_out",
  Inspection = "inspection",
  ShelfLifeExtension = "shelf_life_extension",
  RegulatoryUpdate = "regulatory_update",
  UserApproved = "user_approved",
}
