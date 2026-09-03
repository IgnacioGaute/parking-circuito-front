# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

This project runs Next.js 16.2.12, which has file-convention and API changes
not reflected in most training data (e.g. `middleware.ts` → `proxy.ts`, see
below). Consult `node_modules/next/dist/docs/` rather than assuming
Next.js 14/15 behavior.

## Commands

- `pnpm dev` — start the dev server on **port 3001** (not 3000; see below)
- `pnpm build` — production build
- `pnpm start` — run a production build
- `pnpm lint` — ESLint (flat config, `eslint.config.mjs`)

There is no test suite/framework configured in this repo.

Package manager is pnpm (`pnpm-lock.yaml`, `pnpm-workspace.yaml`).

## Architecture

### This is a frontend-only client to a separate backend API

There's no database or business logic here. Every data operation is a thin
wrapper that forwards to a backend service at `BACKEND_URL` (env var, default
`http://localhost:3000`; the frontend itself runs on port 3001 so the two can
run side by side locally). The backend is a separate repository, not part of
this codebase.

Each domain follows the same three-layer call chain:

```
Client Component → src/actions/*.actions.ts ('use server')
                  → src/services/*.service.ts ('server-only')
                  → src/services/api-client.ts (apiFetch)
                  → BACKEND_URL
```

- **`src/services/api-client.ts`**: the single `fetch` chokepoint. Sets JSON
  headers, attaches `Authorization: Bearer <token>` when a token is passed,
  disables caching (`cache: 'no-store'`), and normalizes failures into
  `ApiError` (has `.status`).
- **`src/services/*.service.ts`**: one function per backend endpoint, typed,
  no auth/session knowledge — just takes a `token` argument when needed.
- **`src/actions/*.actions.ts`**: Server Actions (`'use server'`) that are the
  only thing components call. Their job is almost always just
  `getAuthToken()` + delegate to a service function. Add new backend calls by
  extending this same three-file pattern (service fn → action fn), not by
  fetching directly from components.

### Auth

- JWT lives in an **httpOnly cookie** (`access_token`, see
  `src/lib/auth-cookie.ts`) — never in localStorage/JS-readable storage, so it
  can't be read from Client Components or Server Actions running in the
  browser's request context directly.
- `src/app/api/auth/login/route.ts` and `.../logout/route.ts` are the only
  places that set/clear this cookie (login proxies to the backend, then sets
  the cookie on the Next response; logout best-effort notifies the backend
  then always clears the cookie locally).
- `src/lib/get-auth-token.ts` (`getAuthToken()`) reads the cookie server-side
  for use in Server Actions/services; throws if absent.
- `src/proxy.ts` (this project's `middleware.ts` equivalent — Next 16 renamed
  the convention to "Proxy", same semantics) gates all non-public routes,
  redirecting unauthenticated requests to `/login` and authenticated users
  away from `/login`. `PUBLIC_PATHS`/`REDIRECT_IF_AUTHENTICATED` in that file
  are the source of truth for which routes require auth.
- Separately, `src/lib/active-operator.ts` persists the *display* identity
  (name/role/id, not the token) to `localStorage` client-side, since Client
  Components can't read the httpOnly cookie. This is how e.g. `isAdmin` /
  operator name get rendered client-side — it's UI convenience state, not the
  session itself, and can drift from the cookie (e.g. after the cookie
  expires) since nothing reconciles them beyond re-login.

### Domain model

Parking lot check-in/check-out system; UI and field names are in Spanish.

- **`ParkingRecord`** (`src/types/parking-record.ts`): one vehicle visit.
  `entradaTime`/`salidaTime` = check-in/check-out; `salidaTime: null` means
  the vehicle is currently inside ("dentro"). `extraFields` holds
  dynamically-defined data (see FieldDefinition below).
- **`Operator`**: staff member (`admin` or `user` role) who logs in with a PIN
  and clocks entries/exits; `onDuty` tracks shift status.
- **`FieldDefinition`**: admin-configurable custom fields (text/number/
  boolean/select) collected at check-in and stored in `ParkingRecord.extraFields`
  — this is what `FieldDefinitionsAdminPanel` manages and what
  `EntradaForm`/`RegistrarTab` render dynamically.
- **`FrequentPlate`**: a plate aggregated from repeat visits (backed by
  `getFrequentAction`), shown in the "Frecuentes" tab with its own
  `extraFields`/movement history, separate from the live `ParkingRecord` list.

`src/components/dashboard/*` maps roughly 1:1 to the tabs in `NavTabs`
(`TabKey` in `NavTabs.tsx`: registrar/dentro/frecuentes/historial/estadisticas/usuarios/admin);
`admin` tab components are gated on `Operator.role === 'admin'` and only
mounted for admins. `HistorialTab` also exports history to PDF via
`jspdf`/`jspdf-autotable`. `EstadisticasTab` derives its numbers client-side
from `getHistoryAction`/`getInsideAction` records via pure functions in
`src/lib/analytics.ts` (filtering, bucketing by day/hour/operator/vehicle
type, etc.) and renders them through the chart components in
`src/components/dashboard/charts/` (`DonutChart`, `MultiLineChart`,
`RankedBarChart`, `StatTile`, `ChartCard`) — there's no separate
stats/analytics endpoint on the backend.

### Onboarding tour

`src/components/tour/TourOverlay.tsx` drives a guided walkthrough defined as
a flat step list in `src/lib/tour-steps.ts` (`TOUR_STEPS`). Each step names a
`TabKey` to switch to and a `target` CSS selector to highlight; components
opt into being tour targets by adding a matching `data-tour="..."` attribute
(see `RegistrarTab`/`DentroTab` for examples). Steps can be `adminOnly` or
scope to an `adminSection`.

### Styling

No CSS framework (no Tailwind). Styling is inline `style={{...}}` objects
reading from CSS custom properties:

- `src/app/globals.css` defines two full palettes as CSS vars under
  `:root[data-theme='dark']` / `:root[data-theme='light']` (dark is default).
- `src/styles/theme.ts` re-exports those vars as JS tokens (`colors.bg`,
  `colors.accent`, etc.) for use in inline styles — add new colors in both
  places, keeping the CSS var as the single source of truth.
- Theme switching (`src/lib/use-theme.ts`, `ThemeToggle.tsx`) works by
  toggling the `data-theme` attribute on `<html>` directly — it's a plain DOM
  mutation, not React state driving a re-render, so it stays instant. A
  blocking inline script in `layout.tsx`'s `<head>` sets the attribute before
  hydration to avoid a flash of the wrong theme.
- Keyframe animations are defined globally in `globals.css` and referenced by
  name from inline styles for simple CSS transitions; GSAP (`gsap` dep)
  handles anything imperative/staggered — e.g. `src/lib/use-stagger-reveal.ts`
  (list/grid entrance animations) and the chart components. All GSAP-driven
  animation should check `prefersReducedMotion()` (`src/lib/motion.ts`) first,
  the way existing call sites do.

### PWA

App is installable: `src/app/manifest.ts` (manifest route),
`public/sw.js` (service worker, registered by
`src/components/RegisterServiceWorker.tsx`), and `src/app/descargar/page.tsx`
(a public "install this app" landing page — see `PUBLIC_PATHS` in
`proxy.ts`). `next.config.ts` allow-lists extra dev origins (LAN IP,
`*.loca.lt` tunnel) specifically to support testing PWA install on a phone.
