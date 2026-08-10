import { authorized, getSupabase, toItem, type ApiRequest, type ApiResponse } from "../_shared";

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (!authorized(request)) return response.status(401).json({ error: "口令不正确" });
  const rawId = request.query?.id;
  const id = Number(Array.isArray(rawId) ? rawId[0] : rawId);
  if (!id) return response.status(400).json({ error: "无效的项目" });
  const supabase = getSupabase();

  if (request.method === "PATCH") {
    const body = (request.body || {}) as Record<string, unknown>;
    const { data, error } = await supabase.from("items").update({ completed: body.completed ? 1 : 0 }).eq("id", id).select().single();
    if (error) return response.status(500).json({ error: error.message });
    return response.status(200).json({ item: toItem(data) });
  }

  if (request.method === "DELETE") {
    const { error } = await supabase.from("items").delete().eq("id", id);
    if (error) return response.status(500).json({ error: error.message });
    return response.status(200).json({ deleted: true });
  }

  return response.status(405).json({ error: "Method not allowed" });
}
