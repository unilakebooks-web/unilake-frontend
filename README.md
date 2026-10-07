# UniLake Kids — Frontend

The storefront, customer dashboard and admin panel for **UniLake Kids**, a store
for personalised children's comic books. Parents browse comics, personalise one
with their child's name and photo, watch AI-generated preview pages appear live,
pay, choose their favourite version of each page and send the book to print.
Admins manage the whole catalogue — down to placing every speech bubble on
every page — plus orders, shipping, customers and site content.

> All data and business logic live in the separate **backend** repository
> (Express + Prisma). This app is a client of its REST API and WebSocket.

---

## Contents

- [Tech stack](#tech-stack)
- [⚠️ This is Next.js 16](#️-this-is-nextjs-16)
- [Getting started](#getting-started)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Routes](#routes)
- [Data fetching](#data-fetching)
- [Authentication](#authentication)
- [Key flows](#key-flows)
- [The admin panel](#the-admin-panel)
- [Styling conventions](#styling-conventions)
- [SEO](#seo)
- [Gotchas](#gotchas)
- [Quality checks](#quality-checks)

---

## Tech stack

| Concern | Choice |
|---|---|
| Framework | **Next.js 16** (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui components built on **Base UI** (`components/ui/`) |
| Server state | TanStack Query 5 |
| Client state | Zustand (selected country, persisted to localStorage) |
| HTTP | Axios, with an interceptor that unwraps the backend's response envelope |
| Forms | React Hook Form + Zod |
| Auth | Better Auth client (cookie sessions held by the backend) |
| Live updates | Native WebSocket with reconnect and polling fallback |
| Photo checks | MediaPipe face detection, run in the browser (`public/mediapipe/`) |
| Speech-bubble editor | Konva / react-konva + opentype.js |
| Rich text | TipTap (blog and legal pages), rendered through `sanitize-html` |
| Charts | Recharts (admin overview) |
| Payments | Razorpay Checkout (loaded in the browser) |
| Icons / toasts | lucide-react, sonner |

---

## ⚠️ This is Next.js 16

Several conventions differ from older Next.js:

- **Route protection lives in `proxy.ts`, not `middleware.ts`** — `middleware`
  is deprecated in this version.
- Dynamic route `params` are a **Promise** (`params: Promise<{ id: string }>`),
  unwrapped with `use(params)` in client components or `await` in server ones.

When in doubt, read the docs that ship with the installed version in
`node_modules/next/dist/docs/` rather than relying on older examples
(`AGENTS.md` says the same for AI assistants).

---

## Getting started

### Prerequisites

- **Node.js 22**.
- **The backend running locally** (default `http://localhost:8080`) — see the
  backend README. Almost every page needs it.

### Setup

```bash
npm install                 # also applies patches/ via patch-package
cp .env.example .env.local  # the defaults work against a local backend
npm run dev                 # http://localhost:3000
```

| Variable | Purpose | Default when unset |
|---|---|---|
| `NEXT_PUBLIC_AUTH_URL` | Backend origin — REST, auth and WebSocket | `http://localhost:8080` |
| `NEXT_PUBLIC_SITE_URL` | This site's public origin — canonical URLs, sitemap, share cards | `https://www.unilakekids.com` |

Both are inlined into the browser bundle at build time: never put a secret in a
`NEXT_PUBLIC_*` variable, and restart the dev server after changing one.

To use the admin panel, your account needs the `ADMIN` role — see "Making an
admin" in the backend README.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build — also the strictest check that everything compiles |
| `npm start` | Serve a production build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type-check |
| `npm run build:pincodes` | Rebuild `data/pincodes.json` from `data/pincodes-source.csv` (only when the CSV changes; commit the result) |

---

## Project structure

```
frontend/
├── proxy.ts                 # route protection (Next 16's replacement for middleware)
├── next.config.ts           # /api/auth rewrite to the backend, remote image hosts
├── app/
│   ├── layout.tsx           # root layout: fonts, providers, site-wide metadata
│   ├── fonts.ts             # every font, defined once (next/font)
│   ├── (routes …)           # pages — see "Routes" below
│   ├── actions/<domain>/    # API functions, one folder per backend domain
│   ├── types/               # TypeScript types mirroring API responses
│   ├── lib/                 # axios client, auth client, WebSocket client,
│   │                        #   session storage, photo validation/normalisation, R2 upload
│   ├── contexts/            # AuthContext
│   └── hooks/useAuth.ts
├── components/
│   ├── ui/                  # shadcn/Base UI primitives — shared, change with care
│   ├── admin/<feature>/     # admin panel, grouped by feature
│   ├── home/                # homepage sections, StoryCard, ComicQuickViewModal
│   ├── comic/               # comic detail page + personalisation form
│   ├── preview/             # live preview, checkout and send-to-print UI
│   ├── checkout/            # address picker, payment, login modal
│   ├── dashboard/           # customer dashboard
│   ├── blog/, legal/, team/, personalize/, shared/, providers/, icons/
├── hooks/                   # TanStack Query hooks wrapping app/actions
├── lib/                     # framework-free helpers: utils, seo, comicTags,
│                            #   bubbleLayout, dialogueTokens, address schema, pincode lookup
├── stores/                  # Zustand stores
├── data/                    # ISO countries/currencies, Indian pincode data
├── public/
│   ├── assets/              # static images
│   └── mediapipe/           # face-detection model + WASM, served locally
├── scripts/build-pincodes.mjs
└── patches/                 # patch-package fixes (opentype.js)
```

---

## Routes

| Area | Routes |
|---|---|
| Storefront | `/`, `/comic` (catalogue), `/comic/[comicId]`, `/blog`, `/blog/[slug]`, `/how_it_work`, `/team`, `/contact`, `/privacy`, `/terms`, `/refund` |
| Personalisation | `/personalize/[sessionId]/preview`, `…/checkout`, `…/new-photo` |
| Auth | `/login` |
| Customer dashboard | `/dashboard/orders`, `/dashboard/orders/[orderId]`, `/dashboard/addresses` (+ overview, wishlist) |
| Admin | `/admin/*` — overview, orders, customers, comics, countries, themes, users and every CMS section |

Route groups named `(panel)` (`app/admin/(panel)`, `app/dashboard/(panel)`)
share a layout with a sidebar without adding a URL segment.

---

## Data fetching

**`app/actions/` are plain async functions, not Next.js Server Actions** — the
name is historical. Each one makes an Axios call to the backend and can be used
from client components (through hooks) and from server components.

The layering is:

```
component  ──►  hooks/useX.ts (TanStack Query)  ──►  app/actions/x/index.ts  ──►  app/lib/axios.ts  ──►  backend
```

- **`app/lib/axios.ts`** sends cookies (`withCredentials`) and **unwraps the
  backend envelope**: a successful call resolves with the inner `data`; a failed
  one rejects with a plain `{ code, message }` object — *not* an `Error`. Use
  `getErrorMessage(err, fallback)` / `getErrorCode(err)` from `lib/utils.ts` to
  read it, and show `message` to the user — backend messages are written for
  customers.
- **Query keys** are `[<resource>, filters]`. Mutations invalidate the keys
  they affect in their `onSuccess`.
- There are **two QueryClients**: `PublicQueryProvider` in the root layout, and a
  separate one in the admin layout.
- **Server components** that need data (comic and blog pages, metadata) call the
  action functions directly. `lib/seo.ts` caches site settings for five minutes
  and never throws, so a sleeping backend can't break metadata.

To add an endpoint: put its types in `app/types/`, the call in `app/actions/`,
a hook in `hooks/`, then use the hook in the component.

---

## Authentication

- Better Auth runs on the **backend**; `app/lib/auth-client.ts` talks to it
  directly (`NEXT_PUBLIC_AUTH_URL`) with cookies. `AuthContext` / `useAuth`
  expose the current user and role.
- **`proxy.ts`** redirects signed-out visitors away from `/dashboard` to
  `/login`, by checking for the session cookie (named differently in development
  and production).
- **The admin panel is guarded in its layout** (`app/admin/(panel)/layout.tsx`),
  which redirects anyone who isn't an `ADMIN`. The real protection is the
  backend, which checks the role on every `/api/admin` request.
- Personalising and previewing need **no login**; it is only required at
  checkout. The checkout flow opens a login modal and attaches the anonymous
  session to the user afterwards.

---

## Key flows

### Personalising a comic

1. **Discovery** — `StoryCard` (homepage, `/comic`, "Explore more books") opens
   `ComicQuickViewModal`; its button leads to `/comic/[comicId]`.
2. **Personalisation** — `ComicPersonalizeForm` collects the child's details and
   a photo. The photo is converted from HEIC if needed, cropped, checked for
   exactly one face with MediaPipe (`app/lib/photo-validate.ts`) and uploaded
   **straight to R2** with a presigned URL (`app/lib/r2-upload.ts`).
3. **Preview** — `/personalize/[sessionId]/preview` (`useSessionPreview`) starts
   generation and shows pages as they finish. A `ComicPreloader` plays first;
   updates arrive over the WebSocket (`app/lib/websocket.ts`), and the hook
   falls back to polling the session when the socket is quiet, so nothing
   depends on the socket alone.
4. **Checkout** — `PricingSection` (full section + floating `CheckoutBar`, both
   driven by `useCheckoutFlow`): pick a cover, log in, choose an address (Indian
   pincodes auto-fill city and state from `data/pincodes.json`), pay with
   Razorpay. The backend confirms payment via webhook;
   `VerifyingPaymentOverlay` waits for it.
5. **Paid book** — the remaining pages generate on the same preview page. The
   customer picks a variant per page and clicks Send to Print (full section +
   floating `SendToPrintBar`, both driven by `useSendToPrintFlow`).
6. **After print** — the customer follows the order in `/dashboard/orders`.

**Session memory.** The last session per comic is kept in localStorage
(`app/lib/session-storage.ts`) so customers can resume. Its 7-day window mirrors
the backend's session lifetime — change both together.

---

## The admin panel

Each section under `app/admin/(panel)/` is a page plus components in
`components/admin/<feature>/`, built from the same parts: a page header, filters
(debounced), a table, pagination and dialogs.

The most involved area is **comic building** (`components/admin/comic/`):
create the comic and its pricing, upload page artwork and masks, upload fonts,
then place speech bubbles in the **bubble mapper** (Konva canvas). Bubble
positions and font sizes are stored as **fractions of the artwork**, never
pixels, and the mapper can render a server-side preview using the exact same
text renderer the generation pipeline uses. `PrePublishChecklist` shows what's
missing before a comic can be published.

---

## Styling conventions

- **Brand colours** are used as Tailwind arbitrary values: purple `#914A8C`,
  indigo `#3F3C95`, cream `#F8E7D2`, yellow `#FFD54A`.
- **Fonts** are defined once in `app/fonts.ts` and applied with
  `font.className`. Some have limited weights — read the comments there before
  adding `font-bold`.
- **Shared scales**: purple banner headings use `BANNER_HEADING_SIZE` from
  `components/home/bannerHeading.ts`; gender/age labels and filters come from
  `lib/comicTags.ts`. Reuse these instead of copying values.
- **Layout maths is documented in place.** Components like `StoryCard`
  (container-query units) and the purple banners carry comments explaining
  their measurements. Read them, and update them along with the numbers.
- Layouts must work from a 360 px phone upward.

---

## SEO

- `app/layout.tsx` builds site-wide metadata from the admin's Settings
  (`generateMetadata`); pages set their own titles with the `%s | UniLake`
  template.
- Comic and blog pages have per-item metadata with admin-editable overrides.
- `app/sitemap.ts` and `app/robots.ts` are generated; absolute URLs come from
  `NEXT_PUBLIC_SITE_URL`.

---

## Gotchas

- **`NEXT_PUBLIC_*` changes need a dev-server restart** — they're inlined at
  build time.
- **The backend must be running**; most pages render nothing useful without it.
- **Backend errors are objects, not `Error`s** — `err instanceof Error` is
  false. Use `getErrorMessage`.
- **`patches/` must apply** (`npm install` runs `patch-package`). The opentype.js
  patch keeps the bubble mapper from crashing on certain comic fonts — the same
  fix the backend applies.
- **`data/pincodes.json` is generated** — don't edit it by hand; change the CSV
  and run `npm run build:pincodes`.
- **Remote images are allowed from any HTTPS host** (`next.config.ts`), because
  R2 and avatar URLs vary.

---

## Quality checks

There is no automated test suite. Before opening a PR:

- `npx tsc --noEmit` and `npm run lint` pass for the files you touched.
- `npm run build` succeeds.
- You have clicked through the changed flow at phone and desktop widths.
