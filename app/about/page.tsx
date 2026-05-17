'use client'
import Header from '@/components/Header'
import Link from 'next/link'
import { Sparkles, Heart } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-16 flex flex-col gap-8 relative z-10">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-[#6c63ff] to-[#00d4ff] bg-clip-text text-transparent">
            About ClaimSG.auto
          </h1>
          <p className="text-gray-400 mt-2 font-medium">Built by gamers, for gamers.</p>
        </div>

        <div className="bg-[#1f1f1f]/35 backdrop-blur-md border border-white/5 p-8 rounded-3xl flex flex-col gap-6 text-gray-300 leading-relaxed text-sm sm:text-base">
          <p>
            Welcome to <span className="text-[#00d4ff] font-bold">ClaimSG.auto</span>! We are a high-fidelity, automated SaaS platform designed specifically to solve a common gamer problem: **missing out on massive game deals and temporary free giveaways.**
          </p>
          <p>
            Every week, platforms like Steam and Epic Games release highly rated titles for 100% free or at monumental discount percentages (75% to 99% off). However, keeping track of these listings manually across multiple launchers is tedious, and promotions often expire within days.
          </p>
          <p>
            <span className="text-[#6c63ff] font-bold">Our Mission:</span> We utilize next-gen AI filters (Llama 3.1) and highly optimized background scrapers to aggregate premium, player-approved games matching your exact genre, score, and budget requirements, delivering them directly to your screen (and phone!).
          </p>
          <p className="flex items-center gap-1.5 justify-center border-t border-white/5 pt-6 mt-4 text-xs font-semibold text-gray-500">
            Thank you for supporting our platform! Happy gaming! <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
          </p>
        </div>
      </main>
    </div>
  )
}
