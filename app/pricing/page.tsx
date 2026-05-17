'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import { useRouter } from 'next/navigation'
import { Check, Crown, Sparkles, Gift, ArrowRight, Loader2 } from 'lucide-react'

export default function PricingPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
    })
  }, [])

  const handleSubscribe = async (plan: string) => {
    if (!user) {
      router.push('/login')
      return
    }

    try {
      setLoading(true)
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, userId: user.id })
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (e) {
      console.error('Checkout redirect failed:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleGoldenSupporter = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    try {
      setLoading(true)
      const res = await fetch('/api/golden/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (e) {
      console.error('Golden supporter redirect failed:', e)
    } finally {
      setLoading(false)
    }
  }

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      icon: <Gift className="w-8 h-8 text-gray-500" />,
      features: ['5 game recommendations daily', 'Sponsor banners shown on dashboard', 'Ad countdowns on Get buttons', 'Basic genre filters'],
      button: 'Current Tier',
      buttonClass: 'bg-white/5 text-gray-400 border border-white/5 cursor-default',
      popular: false,
      tier: 'free'
    },
    {
      name: 'Pro',
      price: '$2',
      period: '/month',
      icon: <Sparkles className="w-8 h-8 text-[#00d4ff]" />,
      features: ['Unlimited game recommendations', 'Sponsor banners shown on dashboard', 'Ad-free Get buttons (no overlays)', 'Advanced Llama 3.1 AI matching', 'Priority server scraper slots'],
      button: 'Upgrade to Pro',
      buttonClass: 'bg-[#00d4ff] hover:opacity-90 text-black shadow-lg shadow-cyan-500/10',
      popular: true,
      tier: 'pro'
    },
    {
      name: 'Ultimate',
      price: '$5',
      period: '/month',
      icon: <Crown className="w-8 h-8 text-purple-400" />,
      features: ['Everything in Pro plan', 'WhatsApp daily list broadcasts', 'Premium account badges', 'Beta access to Epic upcoming deals', 'Multi-channel priority support'],
      button: 'Upgrade to Ultimate',
      buttonClass: 'bg-[#6c63ff] hover:opacity-90 text-white shadow-lg shadow-[#6c63ff]/10',
      popular: false,
      tier: 'ultimate'
    }
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col gap-16 relative z-10">
        
        {/* Title */}
        <div className="text-center">
          <h1 className="text-4xl sm:text-6xl font-black bg-gradient-to-r from-[#6c63ff] to-[#00d4ff] bg-clip-text text-transparent mb-4">
            Transparent Pricing Plans
          </h1>
          <p className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto font-medium">
            Discover premium plans suited for every gaming style. Choose your entry.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, i) => (
            <div 
              key={i} 
              className={`bg-[#1f1f1f]/35 backdrop-blur-md rounded-3xl p-8 border flex flex-col justify-between gap-8 relative
                ${plan.popular ? 'border-[#00d4ff] shadow-xl shadow-cyan-500/5' : 'border-white/5'}
              `}
            >
              {plan.popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#00d4ff] text-black text-[10px] font-extrabold uppercase tracking-widest px-4 py-1.5 rounded-full">
                  Most Popular
                </span>
              )}

              <div>
                <div className="flex items-center gap-3.5 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    {plan.icon}
                  </div>
                  <h2 className="text-2xl font-bold text-white">{plan.name}</h2>
                </div>

                <div className="mb-8">
                  <span className="text-5xl font-black text-white">{plan.price}</span>
                  <span className="text-gray-500 text-sm font-semibold tracking-wider uppercase ml-1.5">{plan.period}</span>
                </div>

                <ul className="space-y-4">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm font-medium text-gray-300">
                      <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => plan.tier !== 'free' && handleSubscribe(plan.tier)}
                disabled={plan.tier === 'free' || loading}
                className={`w-full py-4 rounded-2xl font-bold transition duration-300 flex items-center justify-center gap-2 text-sm disabled:opacity-50
                  ${plan.buttonClass}
                `}
              >
                {loading && plan.tier !== 'free' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  plan.button
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Golden Supporter Banner */}
        <div className="relative bg-gradient-to-br from-amber-600/10 to-yellow-600/5 rounded-3xl border border-amber-500/20 p-8 sm:p-12 overflow-hidden shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="absolute w-[200px] h-[200px] bg-amber-500/5 rounded-full blur-[80px] -top-10 -left-10 pointer-events-none" />
          
          <div className="flex flex-col gap-4 relative z-10 text-center md:text-left max-w-2xl">
            <div className="inline-flex items-center justify-center md:justify-start gap-2 text-amber-400 font-bold text-xs uppercase tracking-widest">
              <Crown className="w-5 h-5 fill-amber-400 animate-pulse" /> Support Lifetime
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
              Golden Supporter (One-Time)
            </h2>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
              Support ClaimSG.auto forever! A single payment of <span className="text-amber-400 font-bold">$4</span> removes **ALL ads permanently** (no dashboard banners, no button overlays, no sponsor ad tasks), grants the **Lifetime Gold Crown badge**, and unlocks custom thank-yous inside AI chat!
            </p>
          </div>

          <button 
            onClick={handleGoldenSupporter}
            disabled={loading}
            className="relative z-10 w-full md:w-auto bg-amber-500 hover:bg-amber-600 text-black font-black px-8 py-4 rounded-2xl text-sm uppercase tracking-wider shadow-lg shadow-amber-500/10 transition duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Unlock Golden Badge <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

      </main>
    </div>
  )
}
