'use server'

import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
})

export async function createCheckoutSession(formData: FormData) {
  const email = formData.get('email')?.toString()

  const priceId = process.env.STRIPE_PRICE_ID
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  if (!priceId) {
    return { error: 'Stripe Price ID not configured.' }
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: email || undefined,
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout?canceled=true`,
      metadata: {
        // Any extra data to pass to the webhook
        source: 'landing_page',
      },
      // Collect billing address for Latin America compliance
      billing_address_collection: 'required',
      // Allow promo codes
      allow_promotion_codes: true,
      payment_intent_data: {
        description: 'Diplomado en Rehabilitación Intervencionista Guiada por Ultrasonido',
      },
    })

    // Stripe requires a redirect, which we can't do from a Server Action directly.
    // We return the URL and let the client handle the redirect.
    return { url: session.url }
  } catch (error: unknown) {
    console.error('[Stripe] Error creating checkout session:', error)
    return { error: error instanceof Error ? error.message : 'Error desconocido' }
  }
}
