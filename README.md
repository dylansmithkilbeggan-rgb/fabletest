# Faithfull Stickers

A working prototype storefront for a custom sticker business, built with React + Vite.

## Run it

```bash
npm install
npm run dev      # dev server at http://localhost:5173
npm run build    # production build in dist/
npm run preview  # serve the production build
```

## What's inside

- **Home** — hero with example stickers, features, shop teaser
- **Sticker designer** (`/#/design`) — the core feature:
  - Upload one or more images (file picker or drag & drop onto the sheet)
  - Drag, resize (corner handles, aspect lock toggle) and rotate (top handle) each image on a true-scale A4 sheet
  - Automatic die-cut style white border that hugs the alpha silhouette of the artwork, thickness adjustable per sticker (0–10 mm)
  - Snap guides against the sheet center and other stickers' centers
  - Real-world size readout in cm and inches while resizing
  - Duplicate / remove per sticker, print-preview toggle
  - "Add to cart" captures the full layout (positions, sizes, rotation, border, image data) plus a flattened sheet thumbnail
- **Shop** — premade designs (inline SVG art), add to cart
- **Cart** — thumbnails, quantity steppers, per-line prices, "Edit design" reloads a custom sheet back into the designer
- **Checkout** — contact + shipping form with validation, mocked Stripe-ready payment section
- **Order confirmation** — order id, items, shipping summary
- **About**

Dark/light mode with a header toggle (persisted to localStorage when available, falls back to in-memory), blue accent theme, fully responsive.

## Pricing model (default, easy to change)

Defined in `src/utils/pricing.js`:

- Custom A4 sheet: **€5.00** plain, or **€7.00** sealed with clear or holographic vinyl
- Premade stickers: **€0.50** each, minimum 5 per design (seed prices in `src/data/products.js`)
- Shipping: flat **€4.00**, free over **€30**

## Connecting Supabase (orders + stock persistence)

1. Create a project at [supabase.com](https://supabase.com) (free tier is fine).
2. In the dashboard, open **SQL Editor → New query**, paste the contents of
   `supabase/schema.sql`, and run it. This creates the `products` and `orders` tables.
3. Copy `.env.example` to `.env.local` and fill in the two values from
   **Project Settings → API**: the Project URL and the `anon` public key.
4. Restart `npm run dev`.

That's it — orders placed at checkout are written to Supabase, the admin page loads all
orders (not just this session's), and stock edits persist. On first run with an empty
database the built-in catalog is seeded into the `products` table automatically. Without
`.env.local` the app runs in in-memory mode exactly as before.

**Before launching for real:** the schema ships with open prototype policies — anyone
with the site's public key could read orders. Replace them with Supabase Auth-based
policies (and move the admin password to a real login) first. The cart intentionally
stays in memory; only orders and products persist.

## Architecture notes

- Cart/order state is held in React memory (`src/context/StoreContext.jsx`) behind a small
  service-style API, so a backend can replace it without touching the pages.
- The die-cut border is generated on HTML canvas (`src/utils/stickerRender.js`) by dilating the
  image's alpha silhouette — PNGs with transparency get true contour borders; opaque images get
  a rounded rectangle edge.
- Checkout's fake payment delay marks where a Stripe PaymentIntent + `POST /orders` call goes.
