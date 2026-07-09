import assert from "node:assert/strict";
import test from "node:test";

import {
  buildSummary,
  normalizePlayerRow,
  parseBoolean,
  parseList
} from "./updatePlayers.mjs";

test("parseBoolean accepts Leaguepedia boolean shapes", () => {
  assert.equal(parseBoolean("Yes"), true);
  assert.equal(parseBoolean("1"), true);
  assert.equal(parseBoolean(true), true);
  assert.equal(parseBoolean("No"), false);
  assert.equal(parseBoolean("0"), false);
  assert.equal(parseBoolean(""), false);
});

test("parseList handles comma, semicolon, and bullet-separated values", () => {
  assert.deepEqual(parseList("China, South Korea"), ["China", "South Korea"]);
  assert.deepEqual(parseList("Top; Jungle"), ["Top", "Jungle"]);
  assert.deepEqual(parseList("Jayce • Riven"), ["Jayce", "Riven"]);
});

test("normalizePlayerRow maps Leaguepedia fields into a compact record", () => {
  const player = normalizePlayerRow({
    ID: "Faker",
    Player: "Faker",
    NameFull: "Lee Sang-hyeok",
    Country: "South Korea",
    Nationality: "South Korea",
    NationalityPrimary: "South Korea",
    Age: "30",
    Birthdate: "1996-05-07",
    Team: "T1",
    CurrentTeams: "T1",
    Residency: "Korea",
    Role: "Mid",
    Contract: "2026-11-16",
    TeamLast: "T1",
    RoleLast: "Mid",
    IsRetired: "No",
    IsSubstitute: "No",
    IsTrainee: "No",
    IsPersonality: "No",
    Twitter: "faker",
    Stream: "https://twitch.tv/faker"
  });

  assert.deepEqual(player, {
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
    social: {
      twitter: "faker",
      stream: "https://twitch.tv/faker"
    }
  });
});

test("buildSummary counts active, retired, countries, teams, and facets", () => {
  const summary = buildSummary(
    [
      {
        id: "A",
        country: "South Korea",
        team: "T1",
        currentTeams: ["T1"],
        role: "Mid",
        residency: "Korea",
        isRetired: false,
        isPersonality: false
      },
      {
        id: "B",
        country: "China",
        team: "",
        currentTeams: [],
        role: "Top",
        residency: "China",
        isRetired: true,
        isPersonality: false
      },
      {
        id: "C",
        country: "Brazil",
        team: "LOUD",
        currentTeams: ["LOUD"],
        role: "Caster",
        residency: "Brazil",
        isRetired: false,
        isPersonality: true
      }
    ],
    "2026-07-09T00:00:00.000Z",
    { ok: true, message: "ok" }
  );

  assert.equal(summary.summary.total, 3);
  assert.equal(summary.summary.active, 2);
  assert.equal(summary.summary.retired, 1);
  assert.equal(summary.summary.personalities, 1);
  assert.deepEqual(summary.facets.roles, ["Caster", "Mid", "Top"]);
  assert.deepEqual(summary.facets.teams, ["LOUD", "T1"]);
});
