# AGENTS.md

Angular 21 frontend for a drugstore ("Sistema Droguería Pili"). The NestJS + PostgreSQL backend lives in a separate repo and is expected at `http://localhost:3000`.

## Commands

- Install: `npm ci` (lockfile committed; `packageManager` pins npm 11.9.0)
- Dev server: `npm start` / `ng serve` -> `http://localhost:4200`
- Build: `npm run build` (production + SSR by default; output in `dist/drugstore-system`)
- Serve built SSR app: `npm run serve:ssr:drugstore-system` (listens on `PORT`, default `4000`)
- Tests: `npx ng test --watch=false` (Vitest + jsdom)
- Single spec: `npx ng test --watch=false --include src/app/pages/sales/sales.spec.ts`
- Single test by name: `npx ng test --watch=false --filter="should create"`
- Typecheck (no lint script exists): `npx tsc -p tsconfig.app.json --noEmit`
- Format: `npx prettier --write .` (single quotes, print width 100, Angular HTML parser)

## Backend and data flow

- All API URLs are hardcoded to `http://localhost:3000`; there is no dev proxy. Without the backend running, services log `HttpErrorResponse` with `status: 0` and lists stay empty.
- Endpoints used: `POST /auth/login`, `POST /users`, `GET/POST/PATCH/DELETE /medicines`, `GET/POST /sales`, `GET/POST /customers`, `GET/POST /purchases`, `GET/POST /suppliers`.
- Root services load data in their constructors and refresh after mutations (`loadMedicines`, `loadSales`, `loadPurchases`). Preserve this pattern rather than replacing it with local-only state.
- Services contain adapters between backend DTOs and frontend models (nested sale/purchase items flattened, `keywords` string<->array, medicine status `DISPONIBLE`/`AGOTADO`/`VENCIDO`). Update the adapters if models change.
- Auth: successful login stores `login`, `token`, and `user` in `localStorage`. `src/app/pages/auth.guard/auth.guard.ts` and `role.guard.ts` **are wired in `app.routes.ts`**: every private route (dashboard, inventory, sales, purchases, suppliers, reports) uses `authGuard`, and inventory, purchases, suppliers and reports also require `roleGuard('ADMIN')`. Add both guards to any new private route.
- `AiService` calls Groq directly from the browser with a hardcoded API key; `environment.groqApiKey` is unused. Do not copy this pattern for new secrets.

## Conventions

- Standalone components only; no NgModules. Routes are in `src/app/app.routes.ts`; the shell hides the navbar for `/login`, `/register`, and `/dashboard`.
- Code uses Angular 21 idioms: `inject()`, signals (`signal`, `computed`, `.set`/`.update`), and `@if`/`@for` control flow. Keep this style.
- UI text, alerts, and code comments are in Spanish. Match existing wording.
- Reports export `.xlsx` in the browser via SheetJS (`xlsx`).

## SSR gotchas

- SSR is enabled (`main.server.ts`, `server.ts`) and `app.routes.server.ts` prerenders all routes.
- `npm run build` currently logs `localStorage is not defined` while prerendering the dashboard but still succeeds. Do not put `localStorage`/`window` in field initializers or constructors; guard with `isPlatformBrowser` or run after hydration.
- Prerendering also logs `ECONNREFUSED`/`status: 0` backend errors when the API is not running; the build still exits successfully.

## Testing caveats

- Specs are default scaffolding. `npx ng test --watch=false` currently fails 3/9 tests (`App > should render title`, dashboard, reports), mainly missing Router providers (`ActivatedRoute`) and service constructors calling the absent backend. Do not assume every failure is a regression from your change.
- There is no e2e framework despite the README's `ng e2e`. The `.vscode/launch.json` test config points at a Karma URL and is stale.
- Build warnings about bundle budgets (initial > 500 kB, `sales.css`/`reports.css` > 4 kB) are expected and non-fatal.
