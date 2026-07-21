// Vercel serverless function: called when the shopper returns from Stripe.
// It asks Stripe directly whether that checkout session was actually paid
// (so a faked return URL can't mark an order paid), then flips the matching
// order from 'pending' to 'new' in Supabase using the service-role key.
//
// The service-role key lives only in Vercel's environment — never in the
// site code or the browser.
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lblwzpkoblcrytukzbmm.supabase.co'

export default async function handler(req, res) {
  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) {
    return res.status(501).json({ error: 'not_configured' })
  }

  const sessionId = req.query.session || (req.body && req.body.session)
  if (!sessionId || sessionId === '{CHECKOUT_SESSION_ID}') {
    return res.status(400).json({ error: 'no_session' })
  }

  try {
    const stripe = new Stripe(secret)
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const paid = session.payment_status === 'paid'
    const orderId = session.metadata?.orderId || session.client_reference_id || null

    if (!paid) {
      return res.status(200).json({ paid: false, orderId })
    }

    // Mark the order paid. Needs the service-role key to update orders; if it
    // isn't set the payment still succeeded — the order just stays 'pending'
    // for you to confirm from the Stripe dashboard.
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (orderId && serviceKey) {
      const supabase = createClient(SUPABASE_URL, serviceKey, {
        auth: { persistSession: false },
      })
      const { error } = await supabase
        .from('orders')
        .update({ status: 'new' })
        .eq('id', orderId)
        .eq('status', 'pending')
      if (error) console.error('confirm-order update failed:', error.message)
    }

    return res.status(200).json({ paid: true, orderId })
  } catch (err) {
    console.error('confirm-order failed:', err)
    return res.status(500).json({ error: 'stripe_error', message: err.message })
  }
}
