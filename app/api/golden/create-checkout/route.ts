import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2025-02-24.acacia' as any
})

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('placeholder')) {
      // Mock mode callback
      console.warn('Stripe Secret Key is not configured. Redirecting to mock success.')
      const successUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard?golden=success`
      return NextResponse.json({ url: successUrl, mock: true })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Golden Supporter - Lifetime Ad-Free Badge',
              description: 'Removes all ad requirements, fixed banners, and grants the permanent Golden Badge.'
            },
            unit_amount: 400, // $4.00 in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: {
        userId,
        type: 'golden'
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard?golden=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/pricing?canceled=true`,
    })

    return NextResponse.json({ url: session.url })

  } catch (error: any) {
    console.error('Create Golden Checkout Error:', error)
    return NextResponse.json({ error: 'Failed to initiate Golden supporter session', details: error.message }, { status: 500 })
  }
}
