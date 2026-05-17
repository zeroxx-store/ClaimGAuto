'use client'
import Header from '@/components/Header'

export default function FAQPage() {
  const faqs = [
    {
      q: 'How does ClaimSG.auto discover free games?',
      a: 'We have automated background web scrapers that query public API listings from Steam and Epic Games Store every day. We capture and parse deals that are either 100% free or discounted by 75% or more.'
    },
    {
      q: 'Does this platform automatically claim the games for me?',
      a: 'No. To keep your launcher credentials completely secure, we do not request or store your Steam or Epic account credentials. We provide clean redirection links directly to the official storefront where you can claim the games manually with a single click.'
    },
    {
      q: 'What is the Golden Supporter tier?',
      a: 'It is a lifetime badge unlocked with a one-time support payment of $4. Bypasses all ad countdown requirements, removes fixed banners from your dashboard, and adds a permanent Gold Crown to your profile.'
    },
    {
      q: 'How does the free Silver Supporter work?',
      a: 'If you are on the Free plan, you can click "Watch Ad 1" and "Watch Ad 2" daily on your dashboard. Completing these two sponsor ad views activates the Silver Badge, giving you ad-free Get button redirects for 24 hours!'
    },
    {
      q: 'Is the WhatsApp notification system secure?',
      a: 'Yes. We only send notifications via the official Facebook Graph WhatsApp Cloud API to Ultimate plan subscribers who explicitly register their number. You can toggle off notifications at any time.'
    }
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-16 flex flex-col gap-8 relative z-10">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-[#6c63ff] to-[#00d4ff] bg-clip-text text-transparent">
            Frequently Asked Questions
          </h1>
          <p className="text-gray-400 mt-2 font-medium">Have queries? We have answers.</p>
        </div>

        <div className="flex flex-col gap-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-[#1f1f1f]/35 backdrop-blur-md border border-white/5 p-6 rounded-2xl flex flex-col gap-2">
              <h3 className="text-white font-bold text-base sm:text-lg">❓ {faq.q}</h3>
              <p className="text-gray-400 text-sm leading-relaxed font-medium pl-6 border-l border-cyan-500/30">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
