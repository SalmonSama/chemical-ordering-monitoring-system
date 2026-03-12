import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type LotInsert = Database["public"]["Tables"]["item_lots"]["Insert"];

export async function fetchLots(options: { villageId?: string | null; itemId?: string; status?: string } = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("item_lots")
    .select("*, item_master(name, unit, category, is_peroxide), villages(name), labs(name), received_by_profile:user_profiles!item_lots_received_by_fkey(full_name)")
    .order("created_at", { ascending: false });

  if (options.villageId) query = query.eq("village_id", options.villageId);
  if (options.itemId) query = query.eq("item_id", options.itemId);
  if (options.status) query = query.eq("status", options.status as any);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function fetchApprovedPOs(villageId?: string | null) {
  const supabase = await createClient();
  let query = supabase
    .from("purchase_orders")
    .select("*, item_master(name, unit), villages(name)")
    .in("status", ["approved", "ordered", "partially_received"])
    .order("created_at", { ascending: false });
  if (villageId) query = query.eq("village_id", villageId);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function checkIn(data: {
  purchase_order_id: string;
  item_id: string;
  village_id: string;
  lab_id: string;
  lot_number: string;
  received_quantity: number;
  unit: string;
  manufacture_date?: string | null;
  expiry_date?: string | null;
  received_date: string;
  received_by: string;
  supplier?: string | null;
  is_peroxide: boolean;
}) {
  const supabase = await createClient();

  const { data: lot, error } = await supabase
    .from("item_lots")
    .insert({ ...data, remaining_quantity: data.received_quantity, status: "active" })
    .select()
    .single();
  if (error) throw error;

  // Update PO status to received
  await supabase
    .from("purchase_orders")
    .update({ status: "received" })
    .eq("id", data.purchase_order_id);

  // Transaction log
  await supabase.from("transactions").insert({
    type: "check_in",
    reference_id: lot.id,
    reference_type: "item_lots",
    description: `Check-in: ${data.received_quantity} ${data.unit} (Lot ${data.lot_number})`,
    user_id: data.received_by,
    village_id: data.village_id,
  });

  return lot;
}

export async function checkOut(data: {
  lot_id: string;
  quantity: number;
  purpose?: string | null;
  checked_out_by: string;
  village_id?: string | null;
}) {
  const supabase = await createClient();

  const { data: checkoutId, error } = await supabase.rpc("perform_checkout", {
    p_lot_id: data.lot_id,
    p_quantity: data.quantity,
    p_user_id: data.checked_out_by,
    p_purpose: data.purpose ?? undefined,
  });
  if (error) throw error;

  // Transaction log
  await supabase.from("transactions").insert({
    type: "check_out",
    reference_id: checkoutId,
    reference_type: "checkouts",
    description: `Check-out: ${data.quantity} units`,
    user_id: data.checked_out_by,
    village_id: data.village_id ?? null,
  });

  return checkoutId;
}
