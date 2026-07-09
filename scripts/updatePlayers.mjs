import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const LEAGUEPEDIA_API =
  "https://lol.fandom.com/api.php?action=cargoquery&format=json";
export const PLAYERS_TABLE_URL = "https://lol.fandom.com/wiki/Special:CargoTables/Players";
export const CARGO_LIMIT = 500;
export const REQUEST_DELAY_MS = 1200;
export const MAX_ROWS = Number(process.env.MAX_PLAYERS_ROWS ?? 25000);

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const playersFile = path.join(projectRoot, "public", "data", "players.json");
const metaFile = path.join(projectRoot, "public", "data", "meta.json");

const cargoFields = [
  "ID",
  "Player",
  "NameFull",
  "Country",
  "Nationality",
  "NationalityPrimary",
  "Age",
  "Birthdate",
  "Deathdate",
  "Team",
  "CurrentTeams",
  "Residency",
  "Role",
  "Contract",
  "TeamLast",
  "RoleLast",
  "IsRetired",
  "IsSubstitute",
  "IsTrainee",
  "IsPersonality",
  "Twitter",
  "Stream",
  "Website",
  "Instagram",
  "Youtube",
  "Weibo",
  "Lolpros",
  "DEEPLOL",
  "DPMLOL"
];

export function parseBoolean(value) {
  if (value === true) return true;
  if (value === false) return false;
  const normalized = String(value ?? "").trim().toLowerCase();
  return ["yes", "true", "1", "y"].includes(normalized);
}

export function parseList(value) {
  return String(value ?? "")
    .replace(/<br\s*\/?>/gi, ",")
    .split(/[,;•]/)
    .map((item) => cleanText(item))
    .filter(Boolean)
    .filter((item, index, items) => items.indexOf(item) === index);
}

export function normalizePlayerRow(row) {
  const id = cleanText(row.ID ?? row.Player);
  const role = cleanText(row.Role);
  const isRetired = parseBoolean(row.IsRetired);
  const isPersonality = parseBoolean(row.IsPersonality);

  return {
    id,
    displayName: cleanText(row.Player ?? row.ID),
    realName: cleanText(row.NameFull ?? row.Name),
    country: cleanText(row.Country),
    nationalities: parseList(row.Nationality),
    primaryNationality: cleanText(row.NationalityPrimary),
    age: parseInteger(row.Age),
    birthdate: normalizeDate(row.Birthdate),
    deathdate: normalizeDate(row.Deathdate),
    team: cleanText(row.Team),
    currentTeams: parseList(row.CurrentTeams),
    residency: cleanText(row.Residency),
    role,
    contractUntil: normalizeDate(row.Contract),
    lastTeam: cleanText(row.TeamLast),
    lastRoles: parseList(row.RoleLast),
    isRetired,
    isSubstitute: parseBoolean(row.IsSubstitute),
    isTrainee: parseBoolean(row.IsTrainee),
    isPersonality,
    status: classifyStatus({ isRetired, isPersonality, role }),
    sourceUrl: `https://lol.fandom.com/wiki/${encodeURIComponent(id.replaceAll(" ", "_"))}`,
    social: buildSocial(row)
  };
}

export function buildSummary(players, generatedAt, status) {
  const active = players.filter((player) => !player.isRetired).length;
  const retired = players.filter((player) => player.isRetired).length;
  const personalities = players.filter((player) => player.isPersonality).length;
  const countries = uniqueValues(players.map((player) => player.country));
  const teams = uniqueValues(
    players.flatMap((player) => [
      player.team,
      ...(Array.isArray(player.currentTeams) ? player.currentTeams : [])
    ])
  );

  return {
    generatedAt,
    source: "Leaguepedia Players Cargo table",
    sourceUrl: PLAYERS_TABLE_URL,
    status,
    summary: {
      total: players.length,
      active,
      retired,
      countries: countries.length,
      teams: teams.length,
      personalities
    },
    facets: {
      roles: uniqueValues(players.map((player) => player.role)),
      regions: uniqueValues(players.map((player) => player.residency)),
      countries,
      teams
    }
  };
}

function classifyStatus({ isRetired, isPersonality, role }) {
  if (isRetired) return "retired";
  if (isPersonality && /coach|caster|analyst|host|manager/i.test(role)) {
    return "personality";
  }
  return "active";
}

function buildSocial(row) {
  return Object.fromEntries(
    [
      ["twitter", row.Twitter],
      ["stream", row.Stream],
      ["website", row.Website],
      ["instagram", row.Instagram],
      ["youtube", row.Youtube],
      ["weibo", row.Weibo],
      ["lolpros", row.Lolpros],
      ["deeplol", row.DEEPLOL],
      ["dpmLol", row.DPMLOL]
    ]
      .map(([key, value]) => [key, cleanText(value)])
      .filter(([, value]) => value)
  );
}

function parseInteger(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeDate(value) {
  const cleaned = cleanText(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(cleaned) ? cleaned : "";
}

function cleanText(value) {
  return String(value ?? "")
    .replace(/&nbsp;/g, " ")
    .replace(/'''/g, "")
    .replace(/\[\[|\]\]/g, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueValues(values) {
  return [...new Set(values.map((value) => cleanText(value)).filter(Boolean))].sort(
    (left, right) => left.localeCompare(right)
  );
}

async function fetchCargoPage(offset) {
  const params = new URLSearchParams({
    tables: "Players",
    fields: cargoFields.join(","),
    order_by: "ID ASC",
    limit: String(CARGO_LIMIT),
    offset: String(offset)
  });
  const json = await fetchJson(`${LEAGUEPEDIA_API}&${params.toString()}`);

  if (json?.error) {
    throw new Error(`${json.error.code}: ${json.error.info}`);
  }

  if (!Array.isArray(json?.cargoquery)) {
    throw new Error("Leaguepedia response did not include cargoquery rows.");
  }

  return json.cargoquery.map((entry) => entry.title ?? {});
}

async function fetchAllPlayers() {
  const players = [];

  for (let offset = 0; offset < MAX_ROWS; offset += CARGO_LIMIT) {
    const rows = await fetchCargoPage(offset);
    players.push(...rows.map(normalizePlayerRow).filter((player) => player.id));

    if (rows.length < CARGO_LIMIT) {
      break;
    }

    await sleep(REQUEST_DELAY_MS);
  }

  return players;
}

async function fetchJson(url, { retries = 2, timeoutMs = 20000 } = {}) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "user-agent": "lol-pro-player-directory/0.1 (GitHub Pages updater)"
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await sleep(1000 * (attempt + 1));
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError;
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

async function writeJsonAtomic(file, data) {
  await mkdir(path.dirname(file), { recursive: true });
  const tempFile = `${file}.tmp`;
  await writeFile(tempFile, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  await rename(tempFile, file);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const generatedAt = new Date().toISOString();
  const previousPlayers = await readJson(playersFile, {
    generatedAt,
    source: "seed",
    status: { ok: false, message: "No previous player data." },
    players: []
  });

  try {
    const players = await fetchAllPlayers();
    const status = {
      ok: true,
      message: `已从 Leaguepedia 更新 ${players.length.toLocaleString("en-US")} 条选手记录。`
    };
    const payload = {
      generatedAt,
      source: "Leaguepedia Players Cargo table",
      sourceUrl: PLAYERS_TABLE_URL,
      status,
      players
    };

    await writeJsonAtomic(playersFile, payload);
    await writeJsonAtomic(metaFile, buildSummary(players, generatedAt, status));
  } catch (error) {
    const status = {
      ok: false,
      message: `Leaguepedia 更新失败：${error.message}`,
      lastSuccessfulAt: previousPlayers.status?.ok ? previousPlayers.generatedAt : null
    };
    const players = Array.isArray(previousPlayers.players) ? previousPlayers.players : [];

    await writeJsonAtomic(playersFile, {
      ...previousPlayers,
      status,
      checkedAt: generatedAt
    });
    await writeJsonAtomic(metaFile, buildSummary(players, generatedAt, status));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
