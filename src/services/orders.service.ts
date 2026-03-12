import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type OrderInsert = Database["public"]["Tables"]["purchase_orders"]["Insert"];
type OrderStatus = Database["public"]["Enums"]["order_status"];

interface FetchOrdersOptions {
  villageId?: string | null;
  status?: OrderStatus;
  requesterId?: string;
  limit?: number;
}

export async function fetchOrders(options: FetchOrdersOptions = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("purchase_orders")
    .select("*, item_master(name, unit, category), villages(name), labs(name), requester:user_profiles!purchase_orders_requester_id_fkey(full_name)")
    .order("created_at", { ascending: false });

  if (options.villageId) query = query.eq("village_id", options.villageId);
  if (options.status) query = query.eq("status", options.status);
  if (options.requesterId) query = query.eq("requester_id", options.requesterId);
  if (options.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function createOrder(order: OrderInsert) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("purchase_orders")
    .insert(order)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function approveOrder(orderId: string, approverId: string) {
  const supabase = await createClient();

  // Get order details for PO number generation
  const { data: order, error: orderErr } = await supabase
    .from("purchase_orders")
    .select("*, villages(code)")
    .eq("id", orderId)
    .single();
  if (orderErr) throw orderErr;

  // Generate PO number via DB function
  const year = new Date().getFullYear();
  const { data: poNumber, error: poErr } = await supabase.rpc("generate_po_number", {
    village_code: (order.villages as any)?.code ?? "VLG",
    year,
  });
  if (poErr) throw poErr;

  const { error } = await supabase
    .from("purchase_orders")
    .update({
      status: "approved",
      po_number: poNumber,
      approved_by: approverId,
      approved_at: new Date().toISOString(),
    })
    .eq("id", orderId);
  if (error) throw error;

  // Transaction log
  await supabase.from("transactions").insert({
    type: "order_approved",
    reference_id: orderId,
    reference_type: "purchase_orders",
    description: `Order ${poNumber} approved`,
    user_id: approverId,
    village_id: order.village_id,
  });

  return poNumber;
}

export async function rejectOrder(orderId: string, approverId: string, reason: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("purchase_orders")
    .update({
      status: "rejected",
      reject_reason: reason,
      approved_by: approverId,
      approved_at: new Date().toISOString(),
    })
    .eq("id", orderId);
  if (error) throw error;

  await supabase.from("transactions").insert({
    type: "order_rejected",
    reference_id: orderId,
    reference_type: "purchase_orders",
    description: `Order rejected: ${reason}`,
    user_id: approverId,
  });
}
