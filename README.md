# SwelduPro — Philippine HRIS & Payroll

A working HR information system built for Philippine payroll, written in **Vue 3 + Vite + TypeScript**. Every component is a pure TypeScript `.tsx` file (`defineComponent` + JSX) — no `.vue` single-file components. No backend required — data is seeded and persists in your browser via `localStorage`.

## Features

- **Dashboard** — headcount, monthly payroll cost (incl. employer share), net pay totals, pending leaves, department breakdown, recent hires.
- **Employees** — searchable roster with full 201-file records (SSS / PhilHealth / Pag-IBIG / TIN), add / edit / remove, and a per-employee payslip preview.
- **Documents** — upload legal documents (signed contract, valid ID, SSS/PhilHealth/Pag-IBIG, BIR 2316, NBI, PSA, etc.) per employee via drag-and-drop or file picker, with PDF/JPG/PNG validation (10 MB cap), a required-document checklist with completion %, and view / download / delete. Files are stored as real blobs in **IndexedDB**; only metadata sits in `localStorage`.
- **Payroll** — run a payroll register (monthly or semi-monthly) across the active roster, view per-employee payslips, export to CSV, and keep a run history.
- **Leave & Attendance** — file leave requests, approve/reject with automatic VL/SL credit deduction, filter by status.
- **Settings** — company info, default frequency, 2026 statutory rate reference, and demo reset.

## Philippine payroll engine (`src/lib/payroll.ts`)

Fully typed, 2026 statutory schedules:

| Contribution | Employee | Employer | Basis |
|---|---|---|---|
| SSS | 5% of MSC | 10% of MSC | MSC ₱5,000–₱35,000 (RA 11199) |
| PhilHealth | 2.5% | 2.5% | 5% premium, salary ₱10k–₱100k |
| Pag-IBIG | 2% (1% if ≤₱1,500) | 2% | ₱10,000 salary cap → max ₱200 |
| BIR withholding | progressive 0%–35% | — | TRAIN law monthly table (RA 10963) |

> Figures are simplified for demonstration. Confirm against official government tables before remitting.

## Run it

```bash
npm install
npm run dev          # start dev server (Vite)
npm run build        # type-check (vue-tsc) + production build
npm run preview      # preview the production build
```

Then open the URL Vite prints (default http://localhost:5173).

## Stack

Vue 3 (`defineComponent` + JSX/TSX, Composition API), TypeScript (strict), Pinia (state + localStorage persistence), Vue Router (hash mode), `@vitejs/plugin-vue-jsx`. No CSS framework — plain CSS with custom properties in `src/style.css`.

## Project layout

```
src/
  main.ts            app bootstrap
  router.ts          routes (lazy-loaded views)
  App.tsx            shell: sidebar + topbar + <RouterView>
  types.ts           domain models
  lib/payroll.ts     PH statutory payroll engine
  lib/seed.ts        sample employees & leaves
  lib/form.ts        TSX two-way binding helpers (onText/onNum/onSelf)
  lib/blobStore.ts   IndexedDB wrapper for uploaded file blobs
  stores/hris.ts     Pinia store + persistence + business logic
  stores/documents.ts  Pinia store for document metadata + upload/view/download
  components/         PayslipCard.tsx
  views/             Dashboard / Employees / Documents / Payroll / Leave / Settings (.tsx)
```

### Where documents are stored

In production an HRIS uploads files to cloud object storage (S3/GCS) and keeps only
metadata + a signed URL in its database. This offline build mirrors that split:
file **blobs** go to the browser's **IndexedDB** (`sweldupro-files`), which can hold
binary files of meaningful size, while lightweight **metadata** (name, type, size,
category, employee) is persisted to `localStorage`. Both survive a page refresh.

The earlier marketing landing page is preserved in `marketing-site/`.

> Note: stale `.vue` files from the previous version were emptied to tombstone comments
> (the sandbox couldn't delete them). Remove them anytime with:
> `find src -name '*.vue' -delete`
