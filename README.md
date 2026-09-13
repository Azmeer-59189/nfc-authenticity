# Provenance — Product Authenticity Verification

A Next.js app for verifying genuine products via NFC tag, QR code, and AI-based
brand logo detection. Built on Supabase (Postgres) and a YOLOv8 logo-detection
model, deployable to Vercel.

## How it works

**Admins** (`/admin`) log in and add products — name, SKU, brand, and an
optional description — and get back a unique NFC tag URL and a printable QR
code for each one. Every verification attempt against a product is logged
and viewable on its detail page — useful for spotting a cloned tag being
used somewhere it shouldn't.

**Customers** (`/verify/[nfcId]`) land on a 3-step flow after tapping the
NFC tag: photograph the product's logo, scan the printed QR code, then see
the NFC step confirmed (it's already verified by the fact they reached a
real product page at all — see below). The result is one of:

| Result | Meaning |
|---|---|
| **authentic** | NFC, QR, and detected logo all matched |
| **suspicious** | NFC matched (so the tag is real) but the QR or logo didn't — worth a human look |
| **not_authentic** | the NFC id/URL isn't in the database at all |

### Why NFC counts as "already verified"

The tag is programmed with a URL like `https://yourapp.com/verify/<nfcId>`.
Only a real, database-registered id produces a page your server recognizes
— that's what makes it the hard-to-fake check. Copying a *photo* or *QR
code* just takes a camera; copying a working NFC tag onto a counterfeit
item is a real hardware step. The UI still walks through all 3 steps for
clarity, but the NFC step is satisfied the moment the page loads.

**Not currently defended against:** someone reading a genuine tag's URL and
writing that same URL onto a blank chip. Closing that gap means checking
the tag's hardware UID via the Web NFC API, which only works on Android
Chrome (not iOS) — a good next enhancement, not yet built here.

### Honest limits of the logo check

This confirms *a genuine-looking brand logo is present in the photo*, not
that the physical product itself is non-counterfeit — a well-made physical
counterfeit with a correctly printed logo will still pass. Combined with
the NFC check (which does carry real anti-cloning weight) this is still a
meaningful signal, but it's worth being accurate about what it proves when
pitching this to brands.

## Stack

- **Next.js 14** (App Router) + TypeScript + Tailwind
- **Supabase Postgres** via Prisma — `Admin`, `Product`, `Scan` tables
- **YOLOv8** (Ultralytics), trained in Google Colab on a Roboflow Universe
  logo dataset, served via a separate small FastAPI service (see
  `logo-verification/` in this project's history / the kit you were given)
  — deployed independently (e.g. Render) since Vercel can't run PyTorch
- **jsQR** for camera-based QR scanning, with manual-entry fallback

## Environment variables

All documented with examples in `.env.example`. You need:

- `DATABASE_URL` / `DIRECT_URL` — Supabase Postgres, pooled + direct
- `LOGO_API_URL` — base URL of your deployed logo-detection API (e.g. your
  Render service), no trailing slash
- `JWT_SECRET` — signs admin session cookies; any long random string
- `NEXT_PUBLIC_BASE_URL` — the live URL, encoded into every NFC tag
- `ADMIN_INVITE_CODE` — required for anyone signing up after the first
  admin account exists (see Access control, below)

Supabase Storage / `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` are **no
longer used** — products don't store a reference photo anymore, since
verification now checks the brand name against what the logo-detection
model sees rather than comparing to a stored image. `lib/supabase.ts` and
`lib/phash.ts` are left in the codebase but are dead code at this point;
safe to delete if you want to tidy up.

## Local setup

```bash
npm install
cp .env.example .env
# fill in .env with your real values
npx prisma migrate dev --name init
npm run dev
```

Visit `/admin/signup` to create your first admin account (no invite code
needed for the very first one), then `/admin/dashboard/new` to add a
product. The **Brand** field must match one of the class names your
logo-detection model was trained on (case-insensitive, spelling must
match).

> If `npx prisma migrate dev` hangs or can't reach `binaries.prisma.sh` on
> your network, you can create the tables directly instead: run the
> equivalent `CREATE TABLE` SQL in Supabase's SQL Editor, then `npx prisma
> generate` locally (this one only needs the engine `npm install` already
> downloaded).

## Setting up the logo-detection model

This lives outside this repo, as its own small service:

1. Train a YOLOv8 model in Google Colab on a brand-logo dataset from
   Roboflow Universe (search "logo detection").
2. Deploy the trained model as a small FastAPI service (Docker) — Render
   works well and doesn't require the account verification Hugging Face
   Spaces asks for on its Docker tier.
3. Point `LOGO_API_URL` at that service's base URL.
4. Whatever brand names print out as your model's class list are exactly
   what you type into each product's **Brand** field.

## Access control

`/admin/signup` only allows an open signup for the very first admin
account. Every signup after that requires the `ADMIN_INVITE_CODE` value —
without it, or with the wrong one, the request is rejected. Share that code
only with people you want to have admin access.

Row Level Security is enabled on all three Supabase tables with no
policies, so Supabase's public REST/GraphQL API can't read or write them —
all real access goes through this app's own authenticated routes instead.

## Deploying

1. Push this repo to GitHub (private recommended).
2. Import it into Vercel.
3. Add every variable from `.env.example` (with real values) under Vercel's
   Environment Variables before deploying. `NEXT_PUBLIC_BASE_URL` should be
   type **Config**, not Secret (it's a public value by design).
4. After the first deploy, update `NEXT_PUBLIC_BASE_URL` to your actual
   Vercel URL and redeploy — this is what gets encoded into new NFC tags,
   so it has to be correct.

## Writing the NFC tags

Each product's admin detail page shows the exact URL to write onto its tag.
Use any phone NFC-writer app (e.g. "NFC Tools") to write that URL as a
standard NDEF record onto an NTAG213/215/216 chip. Any phone tapping the
tag opens that URL automatically — no app required on the customer's side.

## Still worth doing

- **Rate-limit** `/api/verify/*` — nothing currently stops someone from
  brute-forcing NFC ids or hammering the logo-detection endpoint.
- **Android UID check** for stronger anti-cloning protection (see above).
- **Retrain with real product photos**, not just clean catalog/dataset
  images, once you see how confidence scores hold up on actual customer
  phone photos — casual photos often score lower than studio shots.
- **Clean up dead code**: `lib/phash.ts`, `lib/supabase.ts`, and the
  `product-images` Supabase Storage bucket are no longer used.