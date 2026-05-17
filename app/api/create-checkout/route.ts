import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2025-02-24.acacia' as any
})

export async function POST(req: NextRequest) {
  try {
    const { plan, userId } = await req.json()

    if (!userId || !['pro', 'ultimate'].includes(plan)) {
      return NextResponse.json({ error: 'Missing userId or invalid plan' }, { status: 400 })
    }

    const priceId = plan === 'pro' ? process.env.STRIPE_PRICE_PRO : process.env.STRIPE_PRICE_ULTIMATE

    if (!priceId || priceId.includes('placeholder')) {
      // Mock mode callback for demonstration/testing without active API keys
      console.warn(`Stripe Price ID for plan ${plan} is not configured. Redirecting to mock success.`)
      const successUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard?success=true`
      return NextResponse.json({ url: successUrl, mock: true })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      metadata: {
        userId,
        plan
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/pricing?canceled=true`,
    })

    return NextResponse.json({ url: session.url })

  } catch (error: any) {
    console.error('Create Subscription Checkout Error:', error)
    return NextResponse.json({ error: 'Failed to initiate Stripe session', details: error.message }, { status: 500 })
  }
}
