import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2025-02-24.acacia' as any
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  let event: Stripe.Event

  try {
    if (!webhookSecret || webhookSecret.includes('placeholder') || !sig) {
      // Graceful fallback for mock mode / development testing
      console.warn('Stripe Webhook Secret signature checks bypassed for development/mock testing.')
      const data = JSON.parse(body)
      event = data as Stripe.Event
    } else {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    }
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  // Handle transaction success event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.userId
    
    if (userId) {
      if (session.mode === 'subscription') {
        const plan = session.metadata?.plan || 'pro'
        
        const { error } = await supabaseAdmin
          .from('users')
          .update({ plan })
          .eq('id', userId)

        if (error) {
          console.error(`Failed to update user subscription plan to ${plan}:`, error)
        } else {
          console.log(`Successfully upgraded User ${userId} to Plan: ${plan}`)
        }
      } else if (session.mode === 'payment' && session.metadata?.type === 'golden') {
        // Upgrade user to permanent Golden Supporter
        const { error: userError } = await supabaseAdmin
          .from('users')
          .update({ is_golden_supporter: true })
          .eq('id', userId)

        if (userError) {
          console.error('Failed to grant Golden badge status to user:', userError)
        } else {
          console.log(`Successfully granted Golden status to User ${userId}`)
        }

        // Log payment in golden_payments table
        const { error: paymentError } = await supabaseAdmin
          .from('golden_payments')
          .insert({
            user_id: userId,
            stripe_payment_intent: (session.payment_intent as string) || `mock_intent_${Date.now()}`
          })

        if (paymentError) {
          console.error('Failed to log Golden supporter payment details:', paymentError)
        }
      }
    } else {
      console.warn('Checkout session completed, but metadata did not contain a valid userId.')
    }
  }

  return NextResponse.json({ received: true })
}
