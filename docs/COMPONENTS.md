# Frontend Components

```
src/
├── app/
│   ├── layout.tsx        Root layout — fonts, ThemeProvider wrapper
│   ├── page.tsx           Entry route → renders <MapScreen />
│   └── globals.css        Tailwind + dark-mode variant + Leaflet/marker theming
├── components/
│   ├── screens/
│   │   └── MapScreen.tsx      Root screen: layer state, visibility, data cache, selected place
│   ├── map/
│   │   ├── MapView.tsx        Leaflet MapContainer + base tiles (light/dark CARTO)
│   │   ├── ClusterLayer.tsx   One layer's markers, clustered via leaflet.markercluster
│   │   ├── FlyToController.tsx  Imperative map.flyTo bridge, driven by search selection
│   │   ├── PlaceDetailMarker.tsx  Highlight marker for the currently-selected place
│   │   ├── AIResultMarkers.tsx  Stage 8: highlights + flies to the last AI answer's POIs
│   │   └── markerIcon.ts      Colored-dot divIcon factory (cached per color)
│   ├── search/
│   │   └── SearchBar.tsx      Stage 2: global place search overlay, debounced, keyboard nav
│   ├── detail/
│   │   └── DetailPanel.tsx    Stage 3: slide-over panel — address, contact, full properties
│   ├── sidebar/
│   │   ├── Sidebar.tsx        Category-grouped, searchable, collapsible layer nav + bulk toggle
│   │   └── LayerToggleRow.tsx One layer row: color dot, label, count, switch
│   ├── theme/
│   │   ├── ThemeProvider.tsx  Light/dark context, persists to localStorage
│   │   └── ThemeToggle.tsx    Sun/moon icon button
│   ├── auth/
│   │   ├── AuthProvider.tsx   Stage 4: JWT session context, persists to localStorage, restores via /me
│   │   ├── AuthModal.tsx      Tabbed sign in / sign up form, overlays the map (no auth page)
│   │   └── AccountButton.tsx  Sidebar header affordance: "Sign in" link, or avatar + saved/reports/sign-out menu
│   ├── saved/
│   │   └── SavedPlacesPanel.tsx  Stage 5: list of the signed-in user's saved places, same slot as DetailPanel
│   ├── report/
│   │   ├── ReportFAB.tsx      Stage 6: floating "Report an issue" button; becomes "Cancel" while armed
│   │   ├── ReportForm.tsx     Category + description form for a picked location, then the proof-of-submission receipt
│   │   └── MyReportsPanel.tsx List of the signed-in user's submitted reports, same slot as DetailPanel
│   ├── ai/
│   │   ├── AIChatFAB.tsx      Stage 8: floating "Ask Lagos" button, opens the chat panel
│   │   └── AIChatPanel.tsx    Chat UI — question/answer bubbles, per-answer "View query" Cypher toggle
│   └── admin/
│       ├── AdminDashboard.tsx Stage 9: root — gates on isAdmin, tabs between the three below
│       ├── AdminOverview.tsx  Stat cards + reports/POI breakdowns
│       ├── AdminReports.tsx   Report moderation table, inline status dropdown
│       └── AdminPois.tsx      POI management table — search/filter, inline rename, delete, paginated
└── lib/
    ├── api.ts             layers/search/auth/saved/reports/ai fns + admin fns (stats/reports/pois)
    └── types.ts            LayerMeta, PlaceDetail, SavedPlace, Report, AIQueryResult, Admin*, User, GeoJSON types
```

`app/admin/page.tsx` is the one route outside the map — a distinct utility
screen for staff (see `docs/ARCHITECTURE.md` Stage 9), not part of the
right-side panel system below.

## How a place gets selected

Two paths converge on the same `MapScreen` state (`selectedPlace: PlaceDetail | null`):

- **Marker click** (`ClusterLayer` → `onSelectFeature`): the feature is already on
  the map, so this just opens `DetailPanel`. No fly, no layer-visibility change.
- **Search selection** (`SearchBar` → `onSelect`): flies the map to the result
  (`FlyToController`), force-enables its layer if it was off, drops a
  `PlaceDetailMarker` highlight, and opens `DetailPanel` — same panel, same shape.

`PlaceDetail` (in `lib/types.ts`) is the one shape both paths produce, so
`DetailPanel` doesn't care which path a selection came from.

## Reuse notes for future stages

- `Sidebar` / `LayerToggleRow` are generic over `LayerMeta`.
- `ClusterLayer` and `DetailPanel` are generic over any `PlaceDetail` — not
  hospital/school-specific.
- `ThemeProvider`/`ThemeToggle` are app-wide, not map-specific — reuse as-is
  for every future screen (auth, admin dashboard, etc.).
- `lib/api.ts` is the only place that knows the backend base URL
  (`NEXT_PUBLIC_API_BASE_URL`); new endpoints should get their own functions
  here rather than inlining `fetch` calls in components.
- `useAuth()` (from `AuthProvider`) exposes `{ user, token, loading, signup,
  login, logout }`. The established auth-gating pattern (used by Stage 5's
  save, Stage 6's report, and now Stage 9's `AdminDashboard`): check the
  relevant flag (`!user`, then `!user.isAdmin`) before rendering or before
  calling the API, rather than duplicating the check deeper in the tree.
- A toggle-style icon button needs `aria-pressed`, not just `aria-label` —
  note for anyone testing with accessibility tools: WebKit exposes such a
  button as `AXCheckBox`, not `AXButton`.
- `DetailPanel`, `SavedPlacesPanel`, `ReportForm`, `MyReportsPanel`, and
  `AIChatPanel` all share the same absolute-positioned right-side slot in
  `MapScreen` and are mutually exclusive — `MapScreen` picks one via an
  if/else-if chain (AI chat takes priority when open, then report form
  while a pin is being placed, then my-reports, then saved-places, then
  the default detail panel). Any future right-side panel should extend
  that chain rather than stacking a new overlay.
- `useMapEvents({click: ...})` (react-leaflet) is the pattern for "listen
  for the next map click" — `ReportClickCapture` only mounts while report
  mode is armed, so there's no listener overhead the rest of the time.
- `AIResultMarkers` is the pattern for "highlight a set of POIs and fly the
  map to fit them" — flyTo for one point, flyToBounds for multiple. Reuse
  this rather than writing new fit-bounds logic for any future feature
  that needs to show a POI set on the map.
- `AdminPois` owns its own fetch/pagination/filter state rather than
  lifting it into `AdminDashboard` — it's the only tab stateful enough to
  warrant that, and it keeps `AdminDashboard` a plain gate-then-tabs
  container. Follow that split (dumb container, stateful leaf) for any
  future admin tab rather than centralizing all admin state at the top.
- **Mobile drawer pattern (Stage 10)**: `Sidebar` takes `open`/`onClose`
  props and is positioned `fixed -translate-x-full md:static
  md:translate-x-0` — hidden-by-default drawer below `md`, back to a
  normal flex child at `md:` and up. `MapScreen` owns the `mobileSidebarOpen`
  boolean, the hamburger button that opens it, and the backdrop that
  closes it. Any future off-canvas panel on mobile should follow this same
  shape rather than inventing a new one.
- **Escape-to-close (Stage 10)** is centralized in one `MapScreen`
  `keydown` effect that mirrors the right-side panel priority chain above
  (plus the auth modal and mobile sidebar) — add any new closeable
  surface to that one effect rather than giving it its own listener.
- **Color contrast (Stage 10)**: use `text-zinc-500` (not `-400`) for
  secondary/light-mode text — `-400` is ~2.8:1 on white, under WCAG AA's
  4.5:1. Always pair with an explicit `dark:text-zinc-400` if the dark
  appearance should stay as it was; don't rely on a bare `text-zinc-500`
  inheriting an acceptable dark-mode look.
