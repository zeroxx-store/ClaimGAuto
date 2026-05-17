'use client'
import Header from '@/components/Header'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-16 flex flex-col gap-8 relative z-10">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-[#6c63ff] to-[#00d4ff] bg-clip-text text-transparent">
            Terms of Service
          </h1>
          <p className="text-gray-400 mt-2 font-medium">Effective Date: May 16, 2026</p>
        </div>

        <div className="bg-[#1f1f1f]/35 backdrop-blur-md border border-white/5 p-8 rounded-3xl flex flex-col gap-6 text-gray-300 text-sm sm:text-base leading-relaxed">
          <h2 className="text-white font-bold text-lg sm:text-xl">1. Acceptance of Terms</h2>
          <p>
            By registering for an account on ClaimSG.auto, you agree to comply with and be bound by these Terms of Service.
          </p>

          <h2 className="text-white font-bold text-lg sm:text-xl">2. Services and Platform</h2>
          <p>
            ClaimSG.auto aggregates publicly available game storefront promotions and redirects users to third-party stores (Steam, Epic Games). We are not affiliated, associated, or endorsed by Steam, Valve Corporation, or Epic Games. All trademarks belong to their respective owners.
          </p>

          <h2 className="text-white font-bold text-lg sm:text-xl">3. Subscription Tiers and Billing</h2>
          <p>
            Subscriptions are billed monthly via Stripe. You can cancel your subscription inside Stripe customer portal anytime. One-time Golden supporter purchases are final and non-refundable.
          </p>
        </div>
      </main>
    </div>
  )
}
