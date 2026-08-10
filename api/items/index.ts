import { authorized, getSupabase, seedItems, toItem, type ApiRequest, type ApiResponse } from "../_shared";

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (!authorized(request)) return response.status(401).json({ error: "口令不正确" });
  const supabase = getSupabase();

  if (request.method === "GET") {
    const { count, error: countError } = await supabase.from("items").select("id", { count: "exact", head: true });
    if (countError) return response.status(500).json({ error: countError.message });
    if (!count) {
      const { error: seedError } = await supabase.from("items").insert(seedItems);
      if (seedError) return response.status(500).json({ error: seedError.message });
    }
    const { data, error } = await supabase.from("items").select("*").order("kind").order("sort_order").order("id");
    if (error) return response.status(500).json({ error: error.message });
    return response.status(200).json({ items: data.map(toItem) });
  }

  if (request.method === "POST") {
    const body = (request.body || {}) as Record<string, unknown>;
    const title = String(body.title || "").trim();
    if (!title) return response.status(400).json({ error: "名称不能为空" });
    const { data: last } = await supabase.from("items").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
    const { data, error } = await supabase.from("items").insert({
      title,
      category: String(body.category || "生活"),
      assignee: String(body.assignee || "一起"),
      price: Math.max(0, Number(body.price) || 0),
      kind: body.kind === "wish" ? "wish" : "task",
      sort_order: (last?.sort_order || 0) + 1,
    }).select().single();
    if (error) return response.status(500).json({ error: error.message });
    return response.status(201).json({ item: toItem(data) });
  }

  return response.status(405).json({ error: "Method not allowed" });
}
