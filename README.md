# Field Service Operations

A Syncfusion React showcase application for synthetic office-device service
coordination — a single dispatcher workspace that unifies work-order management,
manual dispatch, workload overview, and sample AI assistance in one polished,
data-dense interface.

The app demonstrates how Syncfusion EJ2 React components compose into a
production-style operations dashboard: real interactions, validated business
rules, light/dark themes, accessibility, and a fixed demo clock — all running
on a JSON-only data source with no backend.

## Business impact

Field-service and dispatch desks live or die on the next action: which job is
overdue, which technician can take it, whether a slot conflicts, and whether the
whole team's workload is balanced. This showcase models that decision loop end
to end in a way a stakeholder can click through in minutes:

- **Faster dispatch decisions** — KPI cards surface open, unassigned, overdue,
  and completed-today counts at a glance, each one a direct filter into the work
  queue so a dispatcher jumps straight to the jobs that need attention.
- **Fewer scheduling collisions** — assignment enforces territory coverage,
  skill matching, and a half-open overlap rule (rejects 10:30–11:30 against an
  existing 10:00–11:00 booking; permits the adjacent 11:00–12:00).
- **Clear workload balance** — the Overview chart and technician-workload grid
  show how active appointments are distributed, exposing overload before it
  becomes a missed appointment.
- **Honest, bounded AI** — a clearly-labeled sample assistant answers
  workload, eligibility, and work-order-summary questions from live session
  state and declines unsupported requests rather than guessing.
- **Zero deployment footprint** — one dependency-free Node static host serves
  the built bundle; data is synthetic, so it runs anywhere without a database
  or API and can be re-skinned for a real operations CRM without rewriting the
  UI layer.

## The problem it solves

Building a credible field-service dispatcher UI requires more than wiring
widgets to data — it needs validated lifecycle transitions, conflict-aware
scheduling, every action reversible by keyboard (not just drag), and every view
agreeing on the same totals. This showcase demonstrates that combination
correctly and accessibly, as a reference for how Syncfusion React components
compose to solve it.

Specifically, the app demonstrates the following solved problems:

- **Work-order lifecycle with guaranteed consistency.** The allowed path is
  Unscheduled → Scheduled → InProgress → Completed (plus Canceled from any
  non-terminal state). Every command validates first, carries an expected
  revision, and either returns a new snapshot or a typed rule error — stale
  commands and invalid forms leave state unchanged with inline, announced
  feedback. After any action, the grid, board, charts, counts, and AI answers
  all agree on the same state revision.
- **Conflict-aware manual scheduling.** Assignment, reschedule, start, and
  complete are protected by real rules: the site's territory is authoritative,
  required skills must be covered, the technician must be enabled, end must
  follow start, and one appointment per job with no same-technician overlap
  among Scheduled/InProgress work (adjacent intervals allowed).
- **Accessible operations density.** KPI cards are direct keyboard-accessible
  actions (Enter/Space), the Kanban offers button/keyboard alternatives for
  every drag move, dialogs manage focus, and every page has empty/error/retry
  states. Exactly light and dark, measured accessible contrast, reduced-motion
  support, and tested at 320/768/1024/1440 CSS pixels.
- **Separation of concerns.** Pure domain rules, selectors, and command logic
  live in a shared contract layer with **no** React or Syncfusion imports, so
  the same business behavior can be reused by later API, Angular, or Blazor
  ports of this showcase. React/Syncfusion code is presentation and
  orchestration only.

## Syncfusion React components showcased

The app exercises the breadth of the EJ2 React component library in a realistic
composition rather than isolated demos:

| Syncfusion React component | Where it's used |
| --- | --- |
| **Data Grid** | Work-order list (search/filter/sort/page) and the technician-workload grid on Overview |
| **Kanban** | Dispatch board, grouped by status across technicians, with keyboard alternatives to dragging |
| **Chart** | Workload-at-a-glance column chart on the Overview page |
| **AI AssistView** | Sample-data assistant with suggested prompts, cancel, and clearly-labeled boundary responses |
| **Dialog** | Work-order create/edit/delete, assignment, completion, and confirm forms |
| **DropDownList** | Status/scope filter dropdowns; technician and site selection |
| **DateTimePicker** | Scheduling appointment start/end times |
| **Button** | Primary, outline, and icon actions throughout |
| **Card** | Overview KPI metric cards (interactive, keyboard-accessible) |

The components are themed via the Syncfusion Tailwind3 / Tailwind3-dark theme
assets, loaded and swapped at runtime by a small theme module, and stay
consistent with the app's own token layer.

## How to run

### Prerequisites

- Node.js 24 or later
- Optional: a Syncfusion license key (the app builds and runs without one — it
  shows the trial banner; set a key to register and remove it)

### Local development

```sh
npm install
npm run dev          # http://127.0.0.1:5173
```

To try the customer/local profile (where validated edits persist to the
browser's `localStorage` instead of being per-tab in-memory):

```sh
npm run dev:customer
```

### Optional Syncfusion license

Put it in a gitignored `.env` — it's read at build time only, never as a
runtime App Setting:

```sh
echo "VITE_SYNCFUSION_LICENSE_KEY=<your-key>" > .env
```

### Production build & static host

```sh
npm run build        # type-check + Vite build -> dist/
npm start            # runs server.mjs (dependency-free Node host) on port 8080
```

Open `http://localhost:8080/`. The static host serves `dist/` with SPA-fallback
routing, a `/healthz` endpoint, immutable caching for hashed assets, and
base-path redirect + prefix stripping (see below).

### Tests

```sh
npm test             # unit tests: pure domain/selectors/session/provider (node --test)
npm run test:e2e     # Playwright browser suite — routes, themes, viewports, a11y
```

## Runtime profiles

- **Public (default):** edits are per-browser-tab in-memory. Reload or
  **Reset sample data** restores the bundled JSON baseline. No persistence.
- **Customer/local (`--mode customer`):** validated create/edit/delete and
  workflow actions persist a versioned snapshot to that browser's
  `localStorage`. Device-local, not multi-user.

## What's inside (one-line summary)

A four-page React 19 / Vite 8 / TypeScript 7 SPA — **Overview**, **Work Orders**,
**Dispatch**, **AI Assistant** — built on Syncfusion EJ2 React 34.2.8 (Grid,
Kanban, Chart, AI AssistView, Dialog, DropDownList, DateTimePicker, Button,
Card), with Tailwind 4.3.3 layout utilities, Lucide 1.47.0 icons, a token-based
light/dark design system, and a fixed America/New_York demo clock of
September 15, 2026, 9:00 AM. Data is synthetic JSON — no API, no database,
no real customer information.

## Base path & deployment

The app is published under the vanity mount path `/field-service-ops/react`
while remaining runnable at `/` for local/CI. One build works everywhere —
the router resolves the base path at runtime from the browser URL, and
`server.mjs` defaults to that mount path (so a bare `/` redirects to it).
Override with `APP_BASE_PATH=/` to serve a root build directly at the App
Service root.

Deploy to Azure App Service (Linux, Node) by zipping `dist/`, `server.mjs`,
`package.json`, and `package-lock.json` flat and setting the startup command
to `npm start`. Full instructions are in `publication/azure-deployment.md`.