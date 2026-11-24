# Jyotish Lab – mobile app (Expo)

The phone version of Jyotish Lab. It talks to the same **Vedic Engine** (FastAPI) as the
Next.js web app in [vedic-engine](https://github.com/MaheshSunbirdEsolutions/vedic-engine) (`web/`), uses the same colours, and gets its UI text and Jyotish terms
from the engine, so English / हिन्दी work the same way on both.

| Screen | What it does |
|---|---|
| **Kundlis** | Saved kundlis: search, pull to refresh, tap to open, long-press to delete, **+ New kundli** |
| **New kundli** | Name, gender, date, 12-hour time with AM/PM, place search (offline GeoNames), advanced: coordinates, time zone, ayanamsa, node, tags, notes |
| **Kundli** | Save / edit / delete, and tabs: **Chart** (D1 + D9, North or South Indian, planet and house tables) · **Dasha** (MD → AD → PD, running periods open) · **Interpretation** · **Sade Sati** · **Reports** (Simple summary) · **Ask** (offline or AI answers, history kept on the phone) |
| **Panchang** | Any date and place |
| **Matching** | Ashtakoota for two people, from saved kundlis or new birth details |
| **Settings** | Language, appearance (System / Light / Dark), chart style, engine URL (with a connection test) |

The other reports (life story, year-wise, issues, Lal Kitab, Bhrigu…) are on the web app
for now; the Reports tab links to the same kundli there when `EXPO_PUBLIC_WEB_URL` is set.

## Run it

Requirements: Node 22.13+ (or 24), the engine running (see [RUN.md](https://github.com/MaheshSunbirdEsolutions/vedic-engine/blob/main/RUN.md) in vedic-engine), and the
**Expo Go** app on your phone or an Android emulator / iOS simulator.

```bash
git clone https://github.com/MaheshSunbirdEsolutions/vedic-engine-mobile
cd vedic-engine-mobile
npm install
cp .env.example .env          # then set EXPO_PUBLIC_ENGINE_URL (see below)
npm start                     # scan the QR code with Expo Go, or press a / i / w
```

**Engine URL.** A phone cannot reach `127.0.0.1` on your PC. Start the engine so it listens
on your network and use your PC's LAN address:

```bash
python -m uvicorn vedic_engine.api:app --host 0.0.0.0 --port 8000
# .env
EXPO_PUBLIC_ENGINE_URL=http://192.168.1.20:8000     # your PC's IP
```

Android emulator: `http://10.0.2.2:8000`. iOS simulator: `http://127.0.0.1:8000`.
You can also change the URL at run time under **Settings → Engine** (stored on the device).

For the **web** target (`npm run web`) the browser enforces CORS, so start the engine with
`JYOTISH_CORS=http://localhost:8081` (comma-separate several origins). Native apps don't need it.

### Environment variables (`.env`)

| Variable | Default | Purpose |
|---|---|---|
| `EXPO_PUBLIC_ENGINE_URL` | `http://127.0.0.1:8000` | Vedic Engine base URL |
| `EXPO_PUBLIC_WEB_URL` | – | Web app base URL, for "Open on web" |
| `EXPO_PUBLIC_API_TIMEOUT_MS` | `60000` | Request timeout (AI answers get 120 s) |
| `EXPO_PUBLIC_APP_ENV` | `development` | `development` / `staging` / `production`, shown in Settings |

Only `EXPO_PUBLIC_*` values reach the app and they are visible in the bundle, so never put
secrets there. The Anthropic key for AI answers stays on the engine (set it from the web app).
`src/config/env.ts` is the only file that reads `process.env`.

## Scripts

| Command | |
|---|---|
| `npm start` / `npm run android` / `ios` / `web` | Dev server |
| `npm run typecheck` | TypeScript |
| `npm run lint` | ESLint (`eslint-config-expo`) |
| `npm test` | Unit, component and screen tests (the contract suite is skipped) |
| `ENGINE_URL=http://127.0.0.1:8000 npm run test:contract` | Calls a running engine and checks every response shape the app relies on |
| `npm run check` | typecheck + lint + tests |

## How the code is organised

```
src/
├─ app/                 Routes only (Expo Router). Thin: read params, call hooks, compose components.
│  ├─ _layout.tsx       Providers: React Query, i18n, toast, safe area; stack navigator
│  ├─ (tabs)/           Kundlis · Panchang · Matching · Settings
│  └─ kundli/           new · preview (unsaved, from route params) · [id] (saved)
├─ config/env.ts        Environment → typed config (validated, with defaults)
├─ api/                 Everything that talks to the engine
│  ├─ client.ts         fetch wrapper: base URL, JSON, timeout, cancellation, typed errors
│  ├─ errors.ts         ApiError (network | timeout | aborted | http | parse) + message keys
│  ├─ endpoints/        One module per area: kundlis, astro, reports, ask, meta
│  ├─ queryKeys.ts      All React Query keys
│  └─ index.ts          engineApi (app instance) / createEngineApi(client) (tests)
├─ domain/              Business logic as pure functions (no React): form validation, chart
│                       placements and drawing geometry, dasha tree, tones, formatting, matching…
├─ hooks/               React Query hooks that join api + domain: useKundliList, useChartBundle,
│                       useSimpleReport, usePanchang, useMatch, useAsk, usePlaceSearch…
├─ state/               Client state: preferences (zustand, persisted) and the QueryClient
├─ i18n/                Translator (engine bundle + mobile strings + offline fallbacks)
├─ theme/               Light/dark theming, shareable (imports nothing from the app): palettes (light =
│                       vedic-engine web/app/globals.css), ThemeProvider, useTheme, makeStyles, tokens
├─ components/
│  ├─ ui/               Design system: Text, Button, Card, Chip, Stat, TextField, SegmentedControl,
│  │                    DataTable, Shimmer/Skeletons, EmptyState, ErrorState, QueryView, Toast, Screen
│  ├─ form/             DateField, TimeField12 (12-hour + AM/PM, native pickers)
│  ├─ kundli/           BirthForm (react-hook-form + zod), PlaceSearch, KundliChart, KundliListItem, KundliView
│  ├─ tabs/             Chart, Dasha, Interpretation, Sade Sati, Reports, Ask
│  ├─ panchang/ match/  Feature views
├─ types/api.ts         Engine request/response types
├─ test/                Test render helper
└─ __fixtures__/        Real engine responses used by tests
```

Rules the code follows:

- **UI ↔ logic.** Components render; rules live in `domain/` (pure, unit-tested) and data
  flow in `hooks/`. Routes in `app/` contain no logic beyond wiring.
- **One way to fetch.** Screens never call `fetch`; they use a hook, which uses `engineApi`.
- **Server vs client state.** Engine data is React Query (cached, retried, cancelled);
  preferences are a small persisted zustand store. Nothing is duplicated between them.
- **Every data view has four states.** `QueryView` renders a shimmer skeleton while loading,
  an `ErrorState` with **Try again**, an `EmptyState`, or the data. Mutations show inline errors.
- **Theming.** The app follows the device's light/dark mode unless the user picks one in Settings.
  Components never hard-code colours: they use `makeStyles((t) => ({ … t.colors.card … }))` or
  `useTheme()`. The `src/theme` folder can be copied into another app as is.
- **Forms.** react-hook-form with a zod schema from `domain/` (`birthFormSchema`). Errors show after a
  field is left or on submit, and disappear as soon as the value becomes valid. Messages are i18n keys.
- **Errors.** All failures become an `ApiError`; `errorMessageKey()` turns it into a
  translated message. 4xx are never retried; network errors and 5xx are retried twice.
- **Naming.** Components `PascalCase.tsx`, hooks `useX.ts`, domain modules `camelCase.ts`,
  test IDs `kebab-case`, i18n keys `snake_case`.

### Adding a screen or an endpoint

1. Add the response type to `types/api.ts` and the call to the right `api/endpoints/*.ts`.
2. Add a query key to `api/queryKeys.ts` and a hook in `hooks/`.
3. Put any rules in `domain/` with a unit test.
4. Build the view from `components/ui` and wrap the data in `<QueryView>`.
5. Add the route file under `src/app/`. New UI text: engine i18n files, or `i18n/strings.ts` for
   mobile-only text (both languages; a test fails if one is missing).

## App icon and splash screen

The mark is a North-Indian kundli frame with the sun at the centre, in the web's saffron. SVG masters
and the size table are in `assets/source/`. The splash has a light (#faf7f2) and a dark (#15110e)
version, configured through the `expo-splash-screen` plugin in `app.json`, and stays up until saved
preferences are loaded. Expo Go shows only the app icon; the splash shows in development and release
builds (`npx expo run:android`, or `npx eas-cli@latest build`).

## Tests

93 tests: 87 run with `npm test`, plus the 6-test contract suite that needs a running engine.

- **Unit** – env parsing, HTTP client (timeouts, cancel, FastAPI error parsing), endpoints,
  form schema and 12-hour time, theme (device mode, contrast, style caching), chart/dasha logic, formatting, translator, retry policy.
- **Component** – loading / empty / error / data states, birth form (errors clear as fields are fixed) and place search,
  both chart styles, every tab with real engine responses, Hindi.
- **Screen** – the kundli list (skeleton → data, empty, error → retry, search) and the kundli
  view (tab switching, engine error → retry, save new, save error, ask a question), with the API mocked.
- **Contract** (`*.contract.test.ts`) – the real engine: i18n, chart, dasha, Sade Sati,
  interpretation, panchang, matching, places, simple report, ask, and kundli
  create/update/delete (the test removes what it creates).
