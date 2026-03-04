import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
})

// Supabase Admin client (Service Role key — bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: Request) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err: unknown) {
    console.error('[Stripe Webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // ─── Handle checkout.session.completed ───────────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ received: true })
    }

    const customerEmail = session.customer_details?.email || session.customer_email
    if (!customerEmail) {
      console.error('[Stripe Webhook] No email in session:', session.id)
      return NextResponse.json({ error: 'No email found in session' }, { status: 400 })
    }

    // 1. Check if user already exists
    const { data: existingList } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingList?.users?.find(u => u.email === customerEmail)

    let userId: string

    if (existingUser) {
      // User already exists (e.g., had a trial account) — just enroll them
      userId = existingUser.id
      console.log(`[Stripe Webhook] User already exists: ${customerEmail}`)
    } else {
      // 2. Create a new user in Supabase Auth with a random password
      // Supabase will send a "Set your password" email automatically
      const tempPassword = crypto.randomBytes(20).toString('hex')
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: customerEmail,
        password: tempPassword,
        email_confirm: true, // Auto-confirm so they can log in after resetting password
        user_metadata: {
          role: 'student',
          enrolled_via: 'stripe',
          stripe_session_id: session.id,
        },
      })

      if (createError || !newUser?.user) {
        console.error('[Stripe Webhook] Error creating user:', createError)
        return NextResponse.json({ error: 'Error creating user: ' + createError?.message }, { status: 500 })
      }

      userId = newUser.user.id

      // 3. Insert profile row (trigger might already handle this, but let's be safe)
      await supabaseAdmin.from('profiles').upsert({
        id: userId,
        full_name: session.customer_details?.name || null,
        role: 'student',
      })
    }

    // 4. Enroll the user (upsert so duplicate webhooks are safe)
    const { error: enrollError } = await supabaseAdmin.from('enrollments').upsert({
      user_id: userId,
      status: 'active',
      enrolled_at: new Date().toISOString(),
      stripe_session_id: session.id,
      stripe_payment_intent: typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.toString() ?? null,
    }, { onConflict: 'user_id' })

    if (enrollError) {
      console.error('[Stripe Webhook] Error enrolling user:', enrollError)
      return NextResponse.json({ error: 'Enrollment failed: ' + enrollError.message }, { status: 500 })
    }

    // 5. Send a magic link / password reset so the user can set their own password
    if (!existingUser) {
      await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: customerEmail,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        }
      })
      // Note: generateLink returns the link — in production you'd send a custom email.
      // Supabase will also send the default recovery email automatically.
    }

    console.log(`[Stripe Webhook] ✅ User ${customerEmail} enrolled successfully. Session: ${session.id}`)
  }

  return NextResponse.json({ received: true })
}
