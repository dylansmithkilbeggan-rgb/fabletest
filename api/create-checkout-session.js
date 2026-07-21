// Vercel serverless function: turns the shopper's cart into a Stripe Checkout
// session and hands back the hosted payment-page URL. The secret key lives
// only in Vercel's environment variables — never in the site code.
//
// Returns 501 when STRIPE_SECRET_KEY isn't set, so the front-end can fall
// back to the old mock checkout until real payments are switched on.
import Stripe from 'stripe'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }
  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) {
    return res.status(501).json({ error: 'not_configured' })
  }

  try {
    const stripe = new Stripe(secret)
    const { items, shipping = 0, orderId, email, origin } = req.body || {}

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'no_items' })
    }
    if (!orderId) {
      return res.status(400).json({ error: 'no_order_id' })
    }

    const line_items = items.map((it) => ({
      price_data: {
        currency: 'eur',
        product_data: { name: String(it.name || 'Sticker') },
        unit_amount: Math.round(Number(it.unitPrice) * 100),
      },
      quantity: Math.max(1, Math.floor(Number(it.qty) || 1)),
    }))

    const shippingCents = Math.round(Number(shipping) * 100)
    if (shippingCents > 0) {
      line_items.push({
        price_data: {
          currency: 'eur',
          product_data: { name: 'Shipping' },
          unit_amount: shippingCents,
        },
        quantity: 1,
      })
    }

    const base = origin || `https://${req.headers.host}`
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      customer_email: email || undefined,
      client_reference_id: orderId,
      metadata: { orderId },
      // Bring the shopper back to the confirmation page with the Stripe
      // session id, which the confirm-order function checks was really paid.
      success_url: `${base}/#/confirmation?order=${encodeURIComponent(orderId)}&session={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/#/cart`,
    })

    return res.status(200).json({ url: session.url })
  } catch (err) {
    console.error('create-checkout-session failed:', err)
    return res.status(500).json({ error: 'stripe_error', message: err.message })
  }
}
