import "./styles.css";
import {
  deriveVisiblePlayers,
  formatStatus,
  getPrimaryTeam,
  type DirectoryFilters,
  type Player
} from "./viewModel";

type PlayersPayload = {
  generatedAt: string;
  source: string;
  sourceUrl?: string;
  status: {
    ok: boolean;
    message: string;
    lastSuccessfulAt?: string | null;
  };
  players: Player[];
};

type MetaPayload = {
  generatedAt: string;
  source: string;
  sourceUrl?: string;
  status: {
    ok: boolean;
    message: string;
  };
  summary: {
    total: number;
    active: number;
    retired: number;
    countries: number;
    teams: number;
    personalities: number;
  };
  facets: {
    roles: string[];
    regions: string[];
    countries: string[];
    teams: string[];
  };
};

const state: {
  players: PlayersPayload | null;
  meta: MetaPayload | null;
  filters: DirectoryFilters;
  selectedId: string | null;
  error: string | null;
} = {
  players: null,
  meta: null,
  filters: {
    query: "",
    role: "all",
    region: "all",
    country: "all",
    status: "all",
    sortKey: "id"
  },
  selectedId: null,
  error: null
};

const appElement = document.querySelector<HTMLDivElement>("#app");
if (!appElement) throw new Error("Missing #app element.");
const app = appElement;

const numberFormatter = new Intl.NumberFormat("zh-CN");
const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit"
});

init();

async function init(): Promise<void> {
  render();

  try {
    const [players, meta] = await Promise.all([
      fetchJson<PlayersPayload>("./data/players.json"),
      fetchJson<MetaPayload>("./data/meta.json")
    ]);
    state.players = players;
    state.meta = meta;
    state.error = null;
  } catch (error) {
    state.error = error instanceof Error ? error.message : "加载数据失败";
  }

  render();
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(`${url}?v=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`${url} 返回 HTTP ${response.status}`);
  return response.json() as Promise<T>;
}

function render(): void {
  const activeId = document.activeElement?.id;

  if (state.error) {
    app.innerHTML = `<main class="center"><h1>英雄联盟职业选手资料库</h1><p>${escapeHtml(state.error)}</p></main>`;
    return;
  }

  if (!state.players || !state.meta) {
    app.innerHTML = `<main class="center"><div class="loader"></div><p>正在加载选手数据...</p></main>`;
    return;
  }

  const visible = deriveVisiblePlayers(state.players.players, state.filters);
  const selected = state.players.players.find((player) => player.id === state.selectedId) ?? null;

  app.innerHTML = `
    <main class="directory">
      <header class="topbar">
        <div>
          <p class="eyebrow">Leaguepedia data directory</p>
          <h1>英雄联盟职业选手资料库</h1>
        </div>
        <a class="source" href="${escapeAttribute(state.players.sourceUrl ?? "https://lol.fandom.com/wiki/Special:CargoTables/Players")}" target="_blank" rel="noreferrer">数据源</a>
      </header>

      <section class="notice ${state.players.status.ok ? "is-ok" : "is-warn"}">
        ${escapeHtml(state.players.status.message)}
      </section>

      <section class="metrics" aria-label="数据概览">
        ${metric("总记录", state.meta.summary.total)}
        ${metric("现役", state.meta.summary.active)}
        ${metric("退役", state.meta.summary.retired)}
        ${metric("国家/地区", state.meta.summary.countries)}
        ${metric("战队", state.meta.summary.teams)}
        ${metric("更新时间", formatDate(state.players.generatedAt))}
      </section>

      <section class="controls" aria-label="筛选">
        <label class="search">
          <span>搜索</span>
          <input id="query" type="search" value="${escapeAttribute(state.filters.query)}" placeholder="ID、姓名、国家、战队" />
        </label>
        ${select("role", "位置", state.filters.role, ["all", ...state.meta.facets.roles])}
        ${select("region", "赛区/居住地", state.filters.region, ["all", ...state.meta.facets.regions])}
        ${select("country", "国家", state.filters.country, ["all", ...state.meta.facets.countries])}
        ${select("status", "状态", state.filters.status, ["all", "active", "retired", "personality", "substitute", "trainee"])}
        ${select("sortKey", "排序", state.filters.sortKey, ["id", "country", "role", "team", "age", "status"])}
      </section>

      <section class="result-bar">
        <strong>${numberFormatter.format(visible.length)}</strong>
        <span>条匹配记录</span>
      </section>

      <section class="layout">
        <div class="player-list" aria-label="选手列表">
          ${visible.slice(0, 800).map(renderPlayer).join("")}
        </div>
        <aside class="detail" aria-label="选手详情">
          ${selected ? renderDetail(selected) : `<p class="muted">选择一名选手查看详情。当前列表最多渲染前 800 条，搜索或筛选可缩小范围。</p>`}
        </aside>
      </section>
    </main>
  `;

  bindEvents();
  restoreFocus(activeId);
}

function metric(label: string, value: number | string): string {
  const text = typeof value === "number" ? numberFormatter.format(value) : value;
  return `<article class="metric"><span>${label}</span><strong>${escapeHtml(text)}</strong></article>`;
}

function select(id: keyof DirectoryFilters, label: string, value: string, options: string[]): string {
  return `
    <label class="select">
      <span>${label}</span>
      <select id="${id}">
        ${options.map((option) => `<option value="${escapeAttribute(option)}" ${option === value ? "selected" : ""}>${escapeHtml(labelForOption(id, option))}</option>`).join("")}
      </select>
    </label>
  `;
}

function labelForOption(id: keyof DirectoryFilters, value: string): string {
  if (value === "all") return "全部";
  if (id === "status") {
    return {
      active: "现役",
      retired: "退役",
      personality: "人物",
      substitute: "替补",
      trainee: "青训"
    }[value] ?? value;
  }
  if (id === "sortKey") {
    return {
      id: "ID",
      country: "国家",
      role: "位置",
      team: "战队",
      age: "年龄",
      status: "状态"
    }[value] ?? value;
  }
  return value;
}

function renderPlayer(player: Player): string {
  return `
    <article class="player-row ${state.selectedId === player.id ? "is-selected" : ""}">
      <button type="button" data-player="${escapeAttribute(player.id)}">
        <span class="handle">${escapeHtml(player.displayName || player.id)}</span>
        <span class="real">${escapeHtml(player.realName || "未知姓名")}</span>
        <span>${escapeHtml(player.role || "未知位置")}</span>
        <span>${escapeHtml(getPrimaryTeam(player))}</span>
        <span>${escapeHtml(player.country || "未知国家")}</span>
        <strong>${formatStatus(player)}</strong>
      </button>
    </article>
  `;
}

function renderDetail(player: Player): string {
  const socials = Object.entries(player.social)
    .map(([key, value]) => `<a href="${escapeAttribute(toSocialUrl(key, value))}" target="_blank" rel="noreferrer">${escapeHtml(key)}</a>`)
    .join("");

  return `
    <div class="detail-card">
      <p class="eyebrow">${escapeHtml(formatStatus(player))}</p>
      <h2>${escapeHtml(player.displayName || player.id)}</h2>
      <dl>
        ${detailRow("真实姓名", player.realName)}
        ${detailRow("国家", player.country)}
        ${detailRow("国籍", player.nationalities.join(", "))}
        ${detailRow("赛区/居住地", player.residency)}
        ${detailRow("位置", player.role)}
        ${detailRow("当前/最近战队", getPrimaryTeam(player))}
        ${detailRow("历史位置", player.lastRoles.join(", "))}
        ${detailRow("年龄", player.age === null ? "" : String(player.age))}
        ${detailRow("生日", player.birthdate)}
        ${detailRow("合同到期", player.contractUntil)}
      </dl>
      <div class="detail-links">
        <a href="${escapeAttribute(player.sourceUrl)}" target="_blank" rel="noreferrer">Leaguepedia 原页</a>
        ${socials}
      </div>
    </div>
  `;
}

function detailRow(label: string, value: string): string {
  return `<dt>${label}</dt><dd>${escapeHtml(value || "未知")}</dd>`;
}

function bindEvents(): void {
  document.querySelector<HTMLInputElement>("#query")?.addEventListener("input", (event) => {
    state.filters.query = (event.currentTarget as HTMLInputElement).value;
    state.selectedId = null;
    render();
  });

  (["role", "region", "country", "status", "sortKey"] as const).forEach((id) => {
    document.querySelector<HTMLSelectElement>(`#${id}`)?.addEventListener("change", (event) => {
      const value = (event.currentTarget as HTMLSelectElement).value;
      state.filters[id] = value as never;
      state.selectedId = null;
      render();
    });
  });

  document.querySelectorAll<HTMLButtonElement>("[data-player]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedId = button.dataset.player ?? null;
      render();
    });
  });
}

function restoreFocus(activeId: string | undefined): void {
  if (activeId !== "query") return;
  const input = document.querySelector<HTMLInputElement>("#query");
  input?.focus();
  input?.setSelectionRange(state.filters.query.length, state.filters.query.length);
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "未知" : dateFormatter.format(date);
}

function toSocialUrl(key: string, value: string): string {
  if (/^https?:\/\//.test(value)) return value;
  if (key === "twitter") return `https://x.com/${value}`;
  if (key === "instagram") return `https://instagram.com/${value}`;
  if (key === "youtube") return value;
  return value;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => htmlEntities[character]);
}

function escapeAttribute(value: string): string {
  return escapeHtml(value);
}

const htmlEntities: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
};
