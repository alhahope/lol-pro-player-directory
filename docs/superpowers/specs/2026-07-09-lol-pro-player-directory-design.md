# LoL Pro Player Directory Design

## Goal

Build and deploy a Chinese GitHub Pages site that aggregates League of Legends professional player information from Leaguepedia's public Cargo data. The default scope is every player record available in Leaguepedia's `Players` Cargo table, including historical, retired, substitute, and trainee players.

## Data Source

- Primary source: Leaguepedia / LoL Esports Wiki `Players` Cargo table.
- Reference page: https://lol.fandom.com/wiki/Special:CargoTables/Players
- The `Players` table currently reports 20,583 rows and includes fields such as ID, Player, NameFull, Country, Nationality, Birthdate, Team, CurrentTeams, Residency, Role, Contract, TeamLast, RoleLast, IsRetired, IsSubstitute, IsTrainee, and social links.

## Scope

- Include all Leaguepedia `Players` records by default.
- Exclude non-player personalities from the primary count when `IsPersonality` is true and the role is only caster/coach/staff, but keep them in data with a status flag so records are not lost.
- Store normalized data as static JSON in `public/data/players.json`.
- Run a GitHub Actions update daily.
- Deploy the frontend to GitHub Pages.

## Frontend

The first screen is the searchable directory itself. It includes:

- Chinese title and controls.
- Summary metrics for total records, active players, retired players, countries, teams, and last update time.
- Search by ID, real name, country, team, region, and role.
- Filters for role, region/residency, country, active/retired, substitute, trainee, and personality.
- Sort by ID, country, role, team, age, and status.
- Responsive list/table hybrid for desktop and mobile.
- Detail drawer for one selected player with full fields and source links.
- Clear data freshness and partial-update warnings.

## Data Pipeline

`scripts/updatePlayers.mjs` fetches Leaguepedia Cargo data in pages. It normalizes raw rows into a compact JSON shape, computes facets and summary metrics, then writes:

- `public/data/players.json`
- `public/data/meta.json`

The script must fetch politely: sequential pagination, retry on transient failures, and a request delay to reduce rate-limit risk. If Leaguepedia is temporarily rate-limited, the script keeps previous data and writes an error status rather than erasing usable data.

## Testing

- Unit tests for row normalization, boolean parsing, list parsing, active/retired classification, and facet generation.
- Local data update script run when available.
- Build verification.
- Browser verification on desktop and mobile.

## Deployment

Create a public GitHub repository named `lol-pro-player-directory` under `alhahope`. Push `main`. GitHub Actions updates data and deploys the built site to GitHub Pages.

## Limits

"All professional players" means all player records available in Leaguepedia's public data. The site must clearly attribute data to Leaguepedia and avoid claiming official completeness beyond that source.
