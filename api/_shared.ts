import { createClient } from "@supabase/supabase-js";

export type ApiRequest = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
  query?: Record<string, string | string[]>;
};

export type ApiResponse = {
  status(code: number): ApiResponse;
  json(body: unknown): void;
};

export function authorized(request: ApiRequest) {
  const supplied = request.headers["x-home-code"];
  const code = Array.isArray(supplied) ? supplied[0] : supplied;
  return Boolean(process.env.HOME_CODE && code === process.env.HOME_CODE);
}

export function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase environment is not configured");
  return createClient(url, key, { auth: { persistSession: false } });
}

export const seedItems = [
  { title: "奶油色双人沙发", category: "客厅", assignee: "jkh", price: 3200, kind: "task", sort_order: 0 },
  { title: "遮光窗帘", category: "卧室", assignee: "ee", price: 680, kind: "task", sort_order: 1 },
  { title: "情侣马克杯", category: "厨房", assignee: "一起", price: 128, kind: "task", sort_order: 2 },
  { title: "开通新家网络", category: "搬家", assignee: "jkh", price: 399, kind: "task", sort_order: 3 },
  { title: "挑选第一盆绿植", category: "客厅", assignee: "ee", price: 199, kind: "task", sort_order: 4 },
  { title: "柔软的四件套", category: "卧室", assignee: "一起", price: 899, kind: "task", sort_order: 5 },
  { title: "在新家做第一顿饭", category: "生活", assignee: "一起", price: 0, kind: "wish", sort_order: 6 },
  { title: "养一盆会长大的植物", category: "生活", assignee: "一起", price: 0, kind: "wish", sort_order: 7 },
  { title: "拍第一张入住合照", category: "纪念", assignee: "一起", price: 0, kind: "wish", sort_order: 8 },
  { title: "邀请朋友来暖房", category: "纪念", assignee: "一起", price: 0, kind: "wish", sort_order: 9 }
];

export function toItem(row: Record<string, unknown>) {
  return { ...row, sortOrder: row.sort_order };
}
