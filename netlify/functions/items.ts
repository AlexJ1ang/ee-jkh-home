import { createClient } from "@supabase/supabase-js";

const seedItems = [
  { title: "奶油色双人沙发", category: "客厅", assignee: "jkh", price: 3200, kind: "task", sort_order: 0 },
  { title: "遮光窗帘", category: "卧室", assignee: "ee", price: 680, kind: "task", sort_order: 1 },
  { title: "情侣马克杯", category: "厨房", assignee: "一起", price: 128, kind: "task", sort_order: 2 },
  { title: "开通新家网络", category: "搬家", assignee: "jkh", price: 399, kind: "task", sort_order: 3 },
  { title: "挑选第一盆绿植", category: "客厅", assignee: "ee", price: 199, kind: "task", sort_order: 4 },
  { title: "柔软的四件套", category: "卧室", assignee: "一起", price: 899, kind: "task", sort_order: 5 },
  { title: "在新家做第一顿饭", category: "生活", assignee: "一起", price: 0, kind: "wish", sort_order: 6 },
  { title: "养一盆会长大的植物", category: "生活", assignee: "一起", price: 0, kind: "wish", sort_order: 7 },
  { title: "拍第一张入住合照", category: "纪念", assignee: "一起", price: 0, kind: "wish", sort_order: 8 },
  { title: "邀请朋友来暖房", category: "纪念", assignee: "一起", price: 0, kind: "wish", sort_order: 9 },
];

function item(row: Record<string, unknown>) {
  return { ...row, sortOrder: row.sort_order };
}

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

export default async (request: Request) => {
  const expected = process.env.HOME_CODE;
  if (!expected || request.headers.get("x-home-code") !== expected) return response({ error: "口令不正确" }, 401);
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return response({ error: "服务端配置不完整" }, 500);
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const method = request.method;
  const id = new URL(request.url).searchParams.get("id");

  if (method === "GET") {
    let { data, error } = await supabase.from("items").select("*").order("kind").order("sort_order").order("id");
    if (error) return response({ error: error.message }, 500);
    if (!data?.length) {
      const seeded = await supabase.from("items").insert(seedItems).select("*");
      if (seeded.error) return response({ error: seeded.error.message }, 500);
      data = seeded.data;
    }
    return response({ items: (data || []).map(item) });
  }
  if (method === "POST") {
    const body = await request.json() as Record<string, unknown>;
    const title = String(body.title || "").trim();
    if (!title) return response({ error: "名称不能为空" }, 400);
    const { data: last } = await supabase.from("items").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
    const { data, error } = await supabase.from("items").insert({ title, category: String(body.category || "生活"), assignee: String(body.assignee || "一起"), price: Math.max(0, Number(body.price) || 0), kind: body.kind === "wish" ? "wish" : "task", sort_order: (last?.sort_order || 0) + 1 }).select().single();
    if (error) return response({ error: error.message }, 500);
    return response({ item: item(data) }, 201);
  }
  if (!id) return response({ error: "缺少 id" }, 400);
  if (method === "PATCH") {
    const body = await request.json() as Record<string, unknown>;
    const { data, error } = await supabase.from("items").update({ completed: body.completed ? 1 : 0 }).eq("id", id).select().single();
    if (error) return response({ error: error.message }, 500);
    return response({ item: item(data) });
  }
  if (method === "DELETE") {
    const { error } = await supabase.from("items").delete().eq("id", id);
    if (error) return response({ error: error.message }, 500);
    return response({ ok: true });
  }
  return response({ error: "Method not allowed" }, 405);
};
