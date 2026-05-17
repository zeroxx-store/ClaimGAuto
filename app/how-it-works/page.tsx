'use client'
import Header from '@/components/Header'
import Link from 'next/link'
import { Sparkles, Gift, Bot, ExternalLink, ArrowRight } from 'lucide-react'

export default function HowItWorksPage() {
  const steps = [
    {
      num: '01',
      title: 'Configure with Llama 3.1 Chat',
      description: 'Open the AI preferences panel on your dashboard. Chat with ClaimSage to define your favorite categories, deal percentages (75% to 100% off), and minimum score settings.',
      icon: <Bot className="w-8 h-8 text-[#6c63ff]" />
    },
    {
      num: '02',
      title: 'Get Handpicked Daily Picks',
      description: 'Our background scrapers pull free promotions and huge discount listings from Steam and Epic Games daily. We match them against your tastes to deliver a curated list.',
      icon: <Sparkles className="w-8 h-8 text-[#00d4ff]" />
    },
    {
      num: '03',
      title: 'Claim Direct in Library',
      description: "Click 'Get Game' on any recommended card. We direct you immediately to Steam or Epic Games' official claim page. Log in, hit add to library, and keep the game forever!",
      icon: <Gift className="w-8 h-8 text-emerald-400" />
    }
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col gap-16 relative z-10">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl sm:text-6xl font-black bg-gradient-to-r from-[#6c63ff] to-[#00d4ff] bg-clip-text text-transparent mb-4">
            How It Works
          </h1>
          <p className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto font-medium">
            Discover your next favorite game in three simple, frictionless steps.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div 
              key={i}
              className="bg-[#1f1f1f]/35 backdrop-blur-md rounded-3xl p-8 border border-white/5 flex flex-col gap-6 relative group hover:border-[#00d4ff]/20 hover:shadow-lg hover:shadow-cyan-500/5 transition duration-300"
            >
              {/* Step number absolute indicator */}
              <span className="absolute top-6 right-8 text-5xl font-black font-mono text-white/5 group-hover:text-[#00d4ff]/10 select-none transition duration-300">
                {step.num}
              </span>

              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-105 transition duration-300">
                {step.icon}
              </div>

              <div className="flex flex-col gap-2">
                <h2 className="text-xl font-bold text-white group-hover:text-[#00d4ff] transition duration-200">
                  {step.title}
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA section */}
        <div className="text-center bg-[#1f1f1f]/20 backdrop-blur-md border border-white/5 p-10 rounded-3xl max-w-2xl mx-auto w-full flex flex-col items-center gap-6">
          <h2 className="text-2xl font-bold text-white">Ready to Claim Free Games?</h2>
          <p className="text-gray-400 text-sm max-w-md">
            Join thousands of gamers discovering premium library titles. Set your criteria and begin building your games catalog for free.
          </p>
          <Link 
            href="/signup" 
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#6c63ff] to-[#00d4ff] hover:opacity-90 text-white font-extrabold px-8 py-3.5 rounded-2xl shadow-lg transition"
          >
            Create Your Account <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

      </main>
    </div>
  )
}
