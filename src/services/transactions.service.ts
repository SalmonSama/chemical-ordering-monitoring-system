import { createClient } from "@/lib/supabase/server";

interface FetchTransactionsOptions {
  villageId?: string | null;
  type?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export async function fetchTransactions(options: FetchTransactionsOptions = {}) {
  const supabase = await createClient();
  const { page = 1, pageSize = 12 } = options;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from("transactions")
    .select("*, user:user_profiles!transactions_user_id_fkey(full_name), villages(name)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (options.villageId) query = query.eq("village_id", options.villageId);
  if (options.type) query = query.eq("type", options.type as any);
  if (options.dateFrom) query = query.gte("created_at", options.dateFrom);
  if (options.dateTo) query = query.lte("created_at", options.dateTo);
  if (options.search) {
    query = query.ilike("description", `%${options.search}%`);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data ?? [], count: count ?? 0 };
}
