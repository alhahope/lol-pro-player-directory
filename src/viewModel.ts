export type PlayerStatus = "active" | "retired" | "personality";
export type SortKey = "id" | "country" | "role" | "team" | "age" | "status";

export type Player = {
  id: string;
  displayName: string;
  realName: string;
  country: string;
  nationalities: string[];
  primaryNationality: string;
  age: number | null;
  birthdate: string;
  deathdate: string;
  team: string;
  currentTeams: string[];
  residency: string;
  role: string;
  contractUntil: string;
  lastTeam: string;
  lastRoles: string[];
  isRetired: boolean;
  isSubstitute: boolean;
  isTrainee: boolean;
  isPersonality: boolean;
  status: PlayerStatus;
  sourceUrl: string;
  social: Record<string, string>;
};

export type DirectoryFilters = {
  query: string;
  role: string;
  region: string;
  country: string;
  status: "all" | PlayerStatus | "substitute" | "trainee";
  sortKey: SortKey;
};

export function deriveVisiblePlayers(
  players: Player[],
  filters: DirectoryFilters
): Player[] {
  const query = filters.query.trim().toLowerCase();

  return players
    .filter((player) => matchesQuery(player, query))
    .filter((player) => filters.role === "all" || player.role === filters.role)
    .filter((player) => filters.region === "all" || player.residency === filters.region)
    .filter((player) => filters.country === "all" || player.country === filters.country)
    .filter((player) => matchesStatus(player, filters.status))
    .sort((left, right) => comparePlayers(left, right, filters.sortKey));
}

export function formatStatus(player: Player): string {
  if (player.isRetired) return "退役";
  if (player.isPersonality) return "人物";
  if (player.isTrainee) return "青训";
  if (player.isSubstitute) return "替补";
  return "现役";
}

export function getPrimaryTeam(player: Player): string {
  return player.team || player.currentTeams[0] || player.lastTeam || "未知战队";
}

function matchesQuery(player: Player, query: string): boolean {
  if (!query) return true;
  const haystack = [
    player.id,
    player.displayName,
    player.realName,
    player.country,
    player.primaryNationality,
    player.residency,
    player.role,
    player.team,
    player.lastTeam,
    ...player.currentTeams,
    ...player.nationalities
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function matchesStatus(player: Player, status: DirectoryFilters["status"]): boolean {
  if (status === "all") return true;
  if (status === "substitute") return player.isSubstitute;
  if (status === "trainee") return player.isTrainee;
  return player.status === status;
}

function comparePlayers(left: Player, right: Player, sortKey: SortKey): number {
  if (sortKey === "age") {
    return compareNullableNumberDescending(left.age, right.age);
  }

  if (sortKey === "status") {
    return formatStatus(left).localeCompare(formatStatus(right), "zh-CN");
  }

  if (sortKey === "country") {
    return left.country.localeCompare(right.country) || left.id.localeCompare(right.id);
  }

  if (sortKey === "role") {
    return left.role.localeCompare(right.role) || left.id.localeCompare(right.id);
  }

  if (sortKey === "team") {
    return getPrimaryTeam(left).localeCompare(getPrimaryTeam(right)) || left.id.localeCompare(right.id);
  }

  return left.id.localeCompare(right.id);
}

function compareNullableNumberDescending(
  left: number | null,
  right: number | null
): number {
  const leftIsNumber = Number.isFinite(left);
  const rightIsNumber = Number.isFinite(right);

  if (leftIsNumber && rightIsNumber) return Number(right) - Number(left);
  if (leftIsNumber) return -1;
  if (rightIsNumber) return 1;
  return 0;
}

