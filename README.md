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

- Custom A4 sheet: **$6.50** base (includes one image) + **$1.00** per extra image
- Premade stickers: fixed prices in `src/data/products.js`
- Shipping: flat **$4.00**, free over **$30**

## Architecture notes

- Cart/order state is held in React memory (`src/context/StoreContext.jsx`) behind a small
  service-style API, so a backend can replace it without touching the pages.
- The die-cut border is generated on HTML canvas (`src/utils/stickerRender.js`) by dilating the
  image's alpha silhouette — PNGs with transparency get true contour borders; opaque images get
  a rounded rectangle edge.
- Checkout's fake payment delay marks where a Stripe PaymentIntent + `POST /orders` call goes.
