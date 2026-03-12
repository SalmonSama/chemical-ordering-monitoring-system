/**
 * Application-level models built on top of raw database Row types.
 * These represent enriched/joined data shapes used throughout the UI.
 */

import type { Database } from "./database.types";

// --- Raw row types (named aliases for convenience) ---
export type Village = Database["public"]["Tables"]["villages"]["Row"];
export type Lab = Database["public"]["Tables"]["labs"]["Row"];
export type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];
export type ItemMaster = Database["public"]["Tables"]["item_master"]["Row"];
export type PurchaseOrder = Database["public"]["Tables"]["purchase_orders"]["Row"];
export type ItemLot = Database["public"]["Tables"]["item_lots"]["Row"];
export type Checkout = Database["public"]["Tables"]["checkouts"]["Row"];
export type PeroxideInspection = Database["public"]["Tables"]["peroxide_inspections"]["Row"];
export type ShelfLifeExtension = Database["public"]["Tables"]["shelf_life_extensions"]["Row"];
export type RegulatoryRecord = Database["public"]["Tables"]["regulatory_records"]["Row"];
export type RegulatoryRecordLot = Database["public"]["Tables"]["regulatory_record_lots"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
export type SystemSetting = Database["public"]["Tables"]["system_settings"]["Row"];

// --- Insert types ---
export type InsertPurchaseOrder = Database["public"]["Tables"]["purchase_orders"]["Insert"];
export type InsertItemLot = Database["public"]["Tables"]["item_lots"]["Insert"];
export type InsertCheckout = Database["public"]["Tables"]["checkouts"]["Insert"];
export type InsertPeroxideInspection = Database["public"]["Tables"]["peroxide_inspections"]["Insert"];
export type InsertShelfLifeExtension = Database["public"]["Tables"]["shelf_life_extensions"]["Insert"];
export type InsertRegulatoryRecord = Database["public"]["Tables"]["regulatory_records"]["Insert"];

// --- Joined / enriched models ---

/** Purchase order with item, village, lab, and requester profile joined. */
export interface OrderWithDetails extends PurchaseOrder {
  item: Pick<ItemMaster, "id" | "name" | "category" | "unit" | "is_peroxide">;
  village: Pick<Village, "id" | "name" | "code">;
  lab: Pick<Lab, "id" | "name">;
  requester: Pick<UserProfile, "id" | "full_name" | "email">;
  approver?: Pick<UserProfile, "id" | "full_name"> | null;
}

/** Item lot with item, village, lab, and receiver joined. */
export interface LotWithDetails extends ItemLot {
  item: Pick<ItemMaster, "id" | "name" | "category" | "unit" | "is_peroxide" | "min_stock_level">;
  village: Pick<Village, "id" | "name" | "code">;
  lab: Pick<Lab, "id" | "name">;
  received_by_profile: Pick<UserProfile, "id" | "full_name">;
  purchase_order?: Pick<PurchaseOrder, "id" | "po_number"> | null;
}

/** Checkout with lot and user joined. */
export interface CheckoutWithDetails extends Checkout {
  lot: LotWithDetails;
  user: Pick<UserProfile, "id" | "full_name">;
}

/** Peroxide inspection with lot and item joined. */
export interface InspectionWithDetails extends PeroxideInspection {
  lot: Pick<ItemLot, "id" | "lot_number" | "item_id" | "village_id">;
  item: Pick<ItemMaster, "id" | "name">;
  inspector: Pick<UserProfile, "id" | "full_name">;
}

/** Transaction with user and village joined. */
export interface TransactionWithDetails extends Transaction {
  user: Pick<UserProfile, "id" | "full_name" | "email">;
  village?: Pick<Village, "id" | "name" | "code"> | null;
}

/** User profile with village and lab joined. */
export interface UserWithDetails extends UserProfile {
  village?: Pick<Village, "id" | "name" | "code"> | null;
  lab?: Pick<Lab, "id" | "name"> | null;
  approver?: Pick<UserProfile, "id" | "full_name"> | null;
}

// --- UI-level helpers ---

/** Minimal user info used throughout the UI (e.g., in dropdowns). */
export interface UserSummary {
  id: string;
  full_name: string;
  email: string;
  role: UserProfile["role"];
  village_id: string | null;
  lab_id: string | null;
}

/** Dashboard KPI card data shape. */
export interface KpiData {
  label: string;
  value: number | string;
  delta?: number;
  deltaLabel?: string;
  trend?: "up" | "down" | "neutral";
}

/** Pagination meta returned from service functions. */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** Generic paginated result wrapper. */
export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}
