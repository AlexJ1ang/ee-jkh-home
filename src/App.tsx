"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Item = {
  id: number;
  title: string;
  category: string;
  assignee: string;
  price: number;
  kind: "task" | "wish";
  completed: number;
  sortOrder: number;
};

type Tab = "home" | "list" | "wish" | "us";

const roomIcons: Record<string, string> = {
  客厅: "⌂",
  卧室: "☾",
  厨房: "♨",
  卫生间: "◌",
  搬家: "□",
};

const tabs: { key: Tab; label: string; icon: string }[] = [
  { key: "home", label: "首页", icon: "⌂" },
  { key: "list", label: "清单", icon: "✓" },
  { key: "wish", label: "愿望", icon: "♡" },
  { key: "us", label: "我们", icon: "♧" },
];

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [tab, setTab] = useState<Tab>("home");
  const [filter, setFilter] = useState("全部");
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [homeCode, setHomeCode] = useState("");
  const [locked, setLocked] = useState(true);
  const [codeError, setCodeError] = useState(false);

  const apiUrl = "/.netlify/functions/items";

  function authorizedFetch(url = apiUrl, init: RequestInit = {}, code = homeCode) {
    return fetch(url, { ...init, headers: { ...(init.headers || {}), "x-home-code": code } });
  }

  async function loadItems(code = homeCode) {
    try {
      const response = await authorizedFetch(apiUrl, {}, code);
      if (response.status === 401) {
        setLocked(true);
        setCodeError(Boolean(code));
        return false;
      }
      const data = (await response.json()) as { items?: Item[] };
      if (!data.items) throw new Error("清单加载失败");
      setItems(data.items);
      setLocked(false);
      setCodeError(false);
      return true;
    } catch (error) {
      console.error(error);
      setCodeError(true);
    } finally {
      setLoading(false);
    }
    return false;
  }

  useEffect(() => {
    const savedCode = window.localStorage.getItem("ee-jkh-home-code") || "";
    setHomeCode(savedCode);
    if (savedCode) void loadItems(savedCode);
    else setLoading(false);
    // The shared code is a small privacy gate for this personal memo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function unlockHome(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const candidate = String(form.get("code") || "").trim();
    setHomeCode(candidate);
    if (await loadItems(candidate)) window.localStorage.setItem("ee-jkh-home-code", candidate);
  }

  async function toggleItem(item: Item) {
    const completed = item.completed ? 0 : 1;
    setItems((current) =>
      current.map((entry) => (entry.id === item.id ? { ...entry, completed } : entry)),
    );
    await authorizedFetch(`${apiUrl}?id=${item.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ completed }),
    });
  }

  async function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    const response = await authorizedFetch(apiUrl, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        title: form.get("title"), category: form.get("category"), assignee: form.get("assignee"), price: Number(form.get("price") || 0), kind: tab === "wish" ? "wish" : "task",
      }),
    });
    const data = (await response.json()) as { item?: Item };
    if (data.item) setItems((current) => [...current, data.item!]);
    setSaving(false);
    setSheetOpen(false);
  }

  async function deleteItem(item: Item) {
    if (!window.confirm(`确定删除“${item.title}”吗？`)) return;
    setItems((current) => current.filter((entry) => entry.id !== item.id));
    const response = await authorizedFetch(`${apiUrl}?id=${item.id}`, { method: "DELETE" });
    if (!response.ok) {
      setItems((current) => [...current, item].sort((a, b) => a.sortOrder - b.sortOrder));
      window.alert("删除失败，请稍后再试。");
    }
  }

  const tasks = useMemo(() => items.filter((item) => item.kind === "task"), [items]);
  const wishes = useMemo(() => items.filter((item) => item.kind === "wish"), [items]);
  const completed = tasks.filter((item) => item.completed).length;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const spent = tasks.filter((item) => item.completed).reduce((sum, item) => sum + item.price, 0);
  const budget = tasks.reduce((sum, item) => sum + item.price, 0);
  const categories = ["全部", ...Array.from(new Set(tasks.map((item) => item.category)))];
  const visibleTasks = filter === "全部" ? tasks : tasks.filter((item) => item.category === filter);

  if (locked) {
    return (
      <main className="lock-shell">
        <section className="lock-card">
          <div className="lock-house"><span>♡</span></div>
          <p>EE &amp; JKH</p>
          <h1>欢迎回到<br />我们的小家</h1>
          <span>输入双人口令，打开共享清单。</span>
          <form onSubmit={unlockHome}>
            <input name="code" type="password" inputMode="numeric" autoComplete="current-password" placeholder="输入 6 位口令" maxLength={12} required />
            {codeError && <small>口令不对，再想想我们的小秘密。</small>}
            <button disabled={loading}>{loading ? "正在开门…" : "打开小家"}</button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <section className="phone-canvas">
        <header className="topbar">
          <div className="brand-mark">e·j</div>
          <button className="avatar-pair" aria-label="ee 和 jkh">
            <span>e</span><span>j</span>
          </button>
        </header>

        {tab === "home" && (
          <div className="screen home-screen">
            <div className="welcome">
              <p className="eyebrow">SUNDAY · 我们的小家</p>
              <h1>早上好，<br /><em>ee &amp; jkh</em></h1>
              <p className="welcome-copy">一起把喜欢的生活，慢慢搬进来。</p>
            </div>

            <article className="progress-card">
              <div className="progress-copy">
                <span>新家准备进度</span>
                <strong>{progress}%</strong>
              </div>
              <div className="progress-track"><i style={{ width: `${progress}%` }} /></div>
              <p>{completed} 件已完成 · 还有 {Math.max(tasks.length - completed, 0)} 件值得期待</p>
              <div className="little-house" aria-hidden="true"><span>♡</span></div>
            </article>

            <div className="section-heading">
              <div><span>今日清单</span><h2>先完成这几件</h2></div>
              <button onClick={() => setTab("list")}>查看全部</button>
            </div>

            <div className="task-stack">
              {loading ? <LoadingCards /> : tasks.slice(0, 3).map((item) => (
                <TaskRow key={item.id} item={item} onToggle={toggleItem} />
              ))}
            </div>

            <div className="memory-card">
              <div className="memory-icon">♡</div>
              <div><span>OUR LITTLE HOME</span><strong>新家计划第 48 天</strong><p>小家正在一点点长出来</p></div>
            </div>
          </div>
        )}

        {tab === "list" && (
          <div className="screen list-screen">
            <PageTitle eyebrow="ROOM BY ROOM" title="新家清单" subtitle={`${completed}/${tasks.length} 件已经准备好`} />
            <div className="filter-row">
              {categories.map((category) => (
                <button key={category} className={filter === category ? "active" : ""} onClick={() => setFilter(category)}>{category}</button>
              ))}
            </div>
            <div className="budget-card">
              <div><span>当前预算</span><strong>¥{budget.toLocaleString()}</strong></div>
              <div><span>已经购入</span><strong>¥{spent.toLocaleString()}</strong></div>
            </div>
            <div className="task-stack roomy">
              {visibleTasks.map((item) => <TaskRow key={item.id} item={item} onToggle={toggleItem} onDelete={deleteItem} removable />)}
            </div>
          </div>
        )}

        {tab === "wish" && (
          <div className="screen wish-screen">
            <PageTitle eyebrow="SOMEDAY TOGETHER" title="我们的愿望" subtitle="在新家里，一件件实现" />
            <div className="wish-feature">
              <span>♡</span><p>家不是一个地方，<br />是我们认真生活的样子。</p>
            </div>
            <div className="wish-grid">
              {wishes.map((item, index) => (
                <button key={item.id} className={`wish-card tone-${index % 4}`} onClick={() => toggleItem(item)}>
                  <i>{item.completed ? "✓" : ["☕", "♧", "⌂", "☆"][index % 4]}</i>
                  <strong>{item.title}</strong><span>{item.completed ? "已经实现啦" : "等待一起实现"}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === "us" && (
          <div className="screen us-screen">
            <PageTitle eyebrow="EE & JKH" title="关于我们" subtitle="两个人，一间屋子，很多小日子" />
            <div className="couple-card">
              <div className="big-avatars"><span>ee</span><i>♡</i><span>jkh</span></div>
              <strong>我们的新家计划</strong><p>始于 2026 · 正在慢慢实现</p>
            </div>
            <div className="stat-grid">
              <div><strong>{completed}</strong><span>共同完成</span></div>
              <div><strong>{wishes.filter((item) => item.completed).length}</strong><span>愿望实现</span></div>
              <div><strong>48</strong><span>一起准备的天</span></div>
            </div>
            <div className="ios-list">
              <div><span>⌂</span><p><strong>我们的家</strong><small>ee &amp; jkh 共享空间</small></p><i>›</i></div>
              <div><span>♡</span><p><strong>一句话</strong><small>一起把普通日子过得可爱</small></p><i>›</i></div>
              <div><span>↗</span><p><strong>添加到主屏幕</strong><small>在 Safari 分享菜单中添加</small></p><i>›</i></div>
            </div>
          </div>
        )}

        {(tab === "list" || tab === "wish") && <button className="fab" onClick={() => setSheetOpen(true)} aria-label="新增项目">＋</button>}

        <nav className="tabbar" aria-label="主导航">
          {tabs.map((item) => (
            <button key={item.key} className={tab === item.key ? "active" : ""} onClick={() => setTab(item.key)}>
              <span>{item.icon}</span><small>{item.label}</small>
            </button>
          ))}
        </nav>
      </section>

      {sheetOpen && (
        <div className="sheet-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setSheetOpen(false)}>
          <form className="bottom-sheet" onSubmit={addItem}>
            <div className="sheet-handle" />
            <div className="sheet-title"><div><span>NEW MEMORY</span><h2>{tab === "wish" ? "添加一个愿望" : "添加新家物品"}</h2></div><button type="button" onClick={() => setSheetOpen(false)}>×</button></div>
            <label>名称<input name="title" required autoFocus placeholder={tab === "wish" ? "一起做一顿烛光晚餐" : "比如：奶油色双人沙发"} /></label>
            {tab !== "wish" && <div className="form-row">
              <label>空间<select name="category"><option>客厅</option><option>卧室</option><option>厨房</option><option>卫生间</option><option>搬家</option></select></label>
              <label>负责人<select name="assignee"><option>一起</option><option>ee</option><option>jkh</option></select></label>
            </div>}
            <label>预算（元）<input name="price" inputMode="numeric" placeholder="0" /></label>
            <button className="save-button" disabled={saving}>{saving ? "正在保存…" : "放进我们的小家"}</button>
          </form>
        </div>
      )}
    </main>
  );
}

function PageTitle({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return <div className="page-title"><p>{eyebrow}</p><h1>{title}</h1><span>{subtitle}</span></div>;
}

function TaskRow({ item, onToggle, onDelete, removable = false }: { item: Item; onToggle: (item: Item) => void; onDelete?: (item: Item) => void; removable?: boolean }) {
  return (
    <div className="task-row-wrap">
      <button className={`task-row ${item.completed ? "done" : ""}`} onClick={() => onToggle(item)}>
        <span className="room-icon">{roomIcons[item.category] || "♡"}</span>
        <span className="task-copy"><strong>{item.title}</strong><small>{item.category} · {item.assignee === "一起" ? "一起负责" : `${item.assignee} 负责`}{item.price ? ` · ¥${item.price.toLocaleString()}` : ""}</small></span>
        <i className="checkmark">{item.completed ? "✓" : ""}</i>
      </button>
      {removable && <button className="delete-item" onClick={() => onDelete?.(item)} aria-label={`删除${item.title}`}>−</button>}
    </div>
  );
}

function LoadingCards() {
  return <><div className="loading-card" /><div className="loading-card" /><div className="loading-card" /></>;
}
