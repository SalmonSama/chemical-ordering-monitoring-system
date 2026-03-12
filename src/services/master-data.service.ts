import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type ItemMasterInsert = Database["public"]["Tables"]["item_master"]["Insert"];
type VillageInsert = Database["public"]["Tables"]["villages"]["Insert"];
type LabInsert = Database["public"]["Tables"]["labs"]["Insert"];

export async function fetchItems() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("item_master")
    .select("*")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function createItem(item: ItemMasterInsert) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("item_master")
    .insert(item)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateItem(id: string, updates: Partial<ItemMasterInsert>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("item_master")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchVillages() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("villages")
    .select("*")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function fetchLabs(villageId?: string) {
  const supabase = await createClient();
  let query = supabase.from("labs").select("*").order("name");
  if (villageId) query = query.eq("village_id", villageId);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function createVillage(village: VillageInsert) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("villages")
    .insert(village)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createLab(lab: LabInsert) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("labs")
    .insert(lab)
    .select()
    .single();
  if (error) throw error;
  return data;
}
