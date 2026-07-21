# Turning on real card payments (Stripe)

Your shop can take real card payments through **Stripe**. Until you finish the
steps below, checkout keeps working as a harmless preview (no card is charged).
When the keys are in place, it automatically switches to real payments — no
code change needed.

## How it works (plain English)

1. A customer fills in their details and presses **Pay**.
2. They're sent to **Stripe's own secure payment page** to enter their card.
   Faithfull Stickers never sees or stores card numbers.
3. After paying, they come back to your confirmation page. The site checks with
   Stripe that the payment really went through before the order counts as paid.
4. The paid order appears in your Admin → Orders, and the money is paid out to
   your bank by Stripe (usually every few days).

Unpaid or abandoned attempts never show up in your orders.

## One-time setup

### 1. Create a Stripe account
- Go to <https://stripe.com>, sign up, and choose **Ireland** as the country.
- You'll be asked for your details and a bank account (IBAN) for payouts —
  this is normal for anyone taking money online.
- You can do everything below in **Test mode** first (toggle top-right in
  Stripe) and switch to live when you're happy.

### 2. Copy two keys into Vercel
In Vercel, open your project → **Settings → Environment Variables**, and add:

| Name | Where to get it | Notes |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys → **Secret key** | Starts with `sk_`. Keep it secret — only paste it here, never in chat or code. |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → **service_role** key | Lets the server mark an order paid. Server-only — never goes in the site or the browser. |

(That's it — `SUPABASE_URL` already has a built-in default for your project.)

### 3. Redeploy
Vercel → Deployments → **Redeploy** (or just push any change). Environment
variables only take effect on a fresh deploy.

### 4. Test it
- Use Stripe **Test mode** keys and the test card `4242 4242 4242 4242`, any
  future expiry, any CVC.
- Place an order — you should land on Stripe, pay, return to the confirmation
  page, and see the order in Admin → Orders.
- When happy, swap the Test keys for the **Live** keys in Vercel and redeploy.

## Good to know

- **Fees:** roughly **1.5% + €0.25** per order on European cards. On very small
  orders that's a big slice — a minimum order or postage that covers it helps.
- **If a customer pays but closes the tab** before returning, the order may stay
  as `pending` in the database, but the payment is still safe in your Stripe
  dashboard (and Stripe emails you). Adding a Stripe *webhook* later makes this
  100% automatic — ask and it can be wired up.
- **Refunds** are done from the Stripe dashboard.
