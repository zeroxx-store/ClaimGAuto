'use client'
import Header from '@/components/Header'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-16 flex flex-col gap-8 relative z-10">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-[#6c63ff] to-[#00d4ff] bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="text-gray-400 mt-2 font-medium">Effective Date: May 16, 2026</p>
        </div>

        <div className="bg-[#1f1f1f]/35 backdrop-blur-md border border-white/5 p-8 rounded-3xl flex flex-col gap-6 text-gray-300 text-sm sm:text-base leading-relaxed">
          <h2 className="text-white font-bold text-lg sm:text-xl">1. Information We Collect</h2>
          <p>
            We collect personal information necessary to run user profiles and recommendations, including your email address (for login authentication), game genre preferences (collected via chat), and WhatsApp phone numbers (only if provided for notifications).
          </p>

          <h2 className="text-white font-bold text-lg sm:text-xl">2. How We Use Information</h2>
          <p>
            Your email is used solely to authenticate your access. Your preferences are matched with daily game deals to filter your dashboard. We do not sell your personal data to advertisers.
          </p>

          <h2 className="text-white font-bold text-lg sm:text-xl">3. Payment Information</h2>
          <p>
            Payment transactions are processed completely by Stripe. We do not store or access your credit card numbers or raw payment credentials.
          </p>
        </div>
      </main>
    </div>
  )
}
