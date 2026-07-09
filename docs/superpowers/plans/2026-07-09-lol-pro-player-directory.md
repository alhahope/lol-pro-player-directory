# LoL Pro Player Directory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a GitHub Pages website that aggregates all Leaguepedia League of Legends professional player records into a searchable Chinese directory.

**Architecture:** A static Vite frontend reads generated JSON from `public/data/`. A Node.js update script fetches Leaguepedia Cargo `Players` data with polite pagination and writes normalized player data plus metadata. GitHub Actions updates data daily, commits JSON changes, builds the site, and deploys Pages.

**Tech Stack:** Node.js 24, Vite, TypeScript, Node built-in test runner, GitHub Actions, GitHub Pages.

## Global Constraints

- Repository name is `lol-pro-player-directory`.
- Default data scope is every Leaguepedia `Players` table record.
- The site UI is Chinese.
- Data source attribution to Leaguepedia is mandatory.
- The browser frontend must not call Leaguepedia directly.
- Data updates run daily.
- Failed updates must not erase previous usable data.
- New production behavior must be covered by tests first.

---

## File Structure

- `package.json`: npm scripts and dependencies.
- `tsconfig.json`: TypeScript browser build config.
- `vite.config.ts`: relative-asset Vite config for Pages.
- `index.html`: app entry.
- `scripts/updatePlayers.mjs`: Leaguepedia fetching and normalization.
- `scripts/updatePlayers.test.mjs`: Node tests for normalization and summary logic.
- `src/viewModel.ts`: frontend filtering, sorting, and display helpers.
- `src/viewModel.test.ts`: Node tests for frontend logic.
- `src/main.ts`: DOM rendering and event handling.
- `src/styles.css`: responsive directory UI.
- `public/data/players.json`: generated player data.
- `public/data/meta.json`: generated summary metadata.
- `.github/workflows/lol-player-directory.yml`: daily update and Pages deploy.
- `README.md`: Chinese project overview and source attribution.

---

### Task 1: Scaffold Project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `.gitignore`
- Create: `public/data/players.json`
- Create: `public/data/meta.json`
- Create: `README.md`

**Interfaces:**
- Produces npm scripts `dev`, `build`, `preview`, `test`, and `update:data`.
- Produces valid seed JSON that the frontend can load.

- [ ] Create Vite TypeScript scaffold and seed JSON.
- [ ] Run `npm install --cache ../../work/npm-cache-lol-players`.
- [ ] Commit scaffold.

### Task 2: Data Pipeline With Tests

**Files:**
- Create: `scripts/updatePlayers.test.mjs`
- Create: `scripts/updatePlayers.mjs`

**Interfaces:**
- Produces `normalizePlayerRow(row)`.
- Produces `buildSummary(players, generatedAt, status)`.
- Produces `parseBoolean(value)` and `parseList(value)`.

- [ ] Write failing tests for normalization, booleans, list parsing, and summary facets.
- [ ] Run `npm test` and verify RED.
- [ ] Implement data pipeline pure functions and CLI.
- [ ] Run `npm test` and verify GREEN.
- [ ] Run `npm run update:data` when rate limits permit; otherwise keep seed data and document status.
- [ ] Commit data pipeline.

### Task 3: Frontend Directory With Tests

**Files:**
- Create: `src/viewModel.test.ts`
- Create: `src/viewModel.ts`
- Create: `src/main.ts`
- Create: `src/styles.css`

**Interfaces:**
- Consumes `public/data/players.json`.
- Consumes `public/data/meta.json`.
- Produces searchable, filterable directory rendered in `#app`.

- [ ] Write failing tests for search, filters, sorting, and display status.
- [ ] Run `npm test` and verify RED.
- [ ] Implement frontend helpers and DOM app.
- [ ] Run `npm test` and verify GREEN.
- [ ] Run `npm run build`.
- [ ] Browser-check desktop and mobile rendering.
- [ ] Commit frontend.

### Task 4: GitHub Actions Deployment

**Files:**
- Create: `.github/workflows/lol-player-directory.yml`

**Interfaces:**
- Produces daily update and GitHub Pages deployment.

- [ ] Create workflow with `push`, daily `schedule`, and `workflow_dispatch`.
- [ ] Run `npm test && npm run build`.
- [ ] Commit workflow.

### Task 5: Publish Repository

**Files:**
- Remote state only.

**Interfaces:**
- Produces `alhahope/lol-pro-player-directory`.
- Produces public Pages site.

- [ ] Verify SSH auth as `alhahope`.
- [ ] Add origin `git@github.com:alhahope/lol-pro-player-directory.git`.
- [ ] If the repository does not exist, ask user to create it.
- [ ] Push `main`.
- [ ] Enable Pages if needed and rerun workflow.

### Task 6: Final Verification

**Files:**
- Read-only verification.

**Interfaces:**
- Produces repository URL, Pages URL, and verification evidence.

- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Verify Pages URL returns 200.
- [ ] Verify `data/players.json` returns non-empty player data.
- [ ] Browser-check live site renders records.

---

## Self-Review

- Spec coverage: all source, scope, frontend, update, fallback, deployment, and attribution requirements are represented.
- Deferred marker scan: no unresolved implementation markers remain.
- Type consistency: player data uses `id`, `displayName`, `realName`, `country`, `nationalities`, `residency`, `role`, `team`, `currentTeams`, `isRetired`, `isSubstitute`, `isTrainee`, `isPersonality`, and `sourceUrl`.
