import assert from "node:assert/strict";
import test from "node:test";

import {
  deriveVisiblePlayers,
  formatStatus,
  type Player
} from "./viewModel.ts";

const players: Player[] = [
  {
    id: "Faker",
    displayName: "Faker",
    realName: "Lee Sang-hyeok",
    country: "South Korea",
    nationalities: ["South Korea"],
    primaryNationality: "South Korea",
    age: 30,
    birthdate: "1996-05-07",
    deathdate: "",
    team: "T1",
    currentTeams: ["T1"],
    residency: "Korea",
    role: "Mid",
    contractUntil: "2026-11-16",
    lastTeam: "T1",
    lastRoles: ["Mid"],
    isRetired: false,
    isSubstitute: false,
    isTrainee: false,
    isPersonality: false,
    status: "active",
    sourceUrl: "https://lol.fandom.com/wiki/Faker",
    social: {}
  },
  {
    id: "Uzi",
    displayName: "Uzi",
    realName: "Jian Zi-Hao",
    country: "China",
    nationalities: ["China"],
    primaryNationality: "China",
    age: 29,
    birthdate: "1997-04-05",
    deathdate: "",
    team: "",
    currentTeams: [],
    residency: "China",
    role: "Bot",
    contractUntil: "",
    lastTeam: "EDward Gaming",
    lastRoles: ["Bot"],
    isRetired: true,
    isSubstitute: false,
    isTrainee: false,
    isPersonality: false,
    status: "retired",
    sourceUrl: "https://lol.fandom.com/wiki/Uzi",
    social: {}
  }
];

test("deriveVisiblePlayers searches across ID, real name, country, and team", () => {
  const visible = deriveVisiblePlayers(players, {
    query: "sang",
    role: "all",
    region: "all",
    country: "all",
    status: "all",
    sortKey: "id"
  });

  assert.deepEqual(
    visible.map((player) => player.id),
    ["Faker"]
  );
});

test("deriveVisiblePlayers filters status and role", () => {
  const visible = deriveVisiblePlayers(players, {
    query: "",
    role: "Bot",
    region: "all",
    country: "all",
    status: "retired",
    sortKey: "id"
  });

  assert.deepEqual(
    visible.map((player) => player.id),
    ["Uzi"]
  );
});

test("deriveVisiblePlayers sorts age descending with missing ages last", () => {
  const visible = deriveVisiblePlayers(players, {
    query: "",
    role: "all",
    region: "all",
    country: "all",
    status: "all",
    sortKey: "age"
  });

  assert.deepEqual(
    visible.map((player) => player.id),
    ["Faker", "Uzi"]
  );
});

test("formatStatus returns Chinese display text", () => {
  assert.equal(formatStatus(players[0]), "现役");
  assert.equal(formatStatus(players[1]), "退役");
});
