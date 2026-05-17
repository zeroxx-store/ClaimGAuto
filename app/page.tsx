'use client'
import Header from '@/components/Header'
import Link from 'next/link'
import { Sparkles, Gift, ArrowRight, ShieldCheck, Heart, Bell, Star } from 'lucide-react'

export default function HomePage() {
  const features = [
    {
      title: 'Llama 3.1 AI Preferences Chat',
      description: 'Interview with ClaimSage, your personal AI gaming assistant. Set genres, price preferences, and custom rating thresholds dynamically.',
      icon: <Sparkles className="w-6 h-6 text-[#00d4ff]" />
    },
    {
      title: 'Steam & Epic Game Discoveries',
      description: 'Direct integration queries public storefronts daily, capturing premium games matching your thresholds that are 100% free or 75%+ off.',
      icon: <Gift className="w-6 h-6 text-[#6c63ff]" />
    },
    {
      title: 'WhatsApp Cloud API Alerts',
      description: 'Exclusive to Ultimate tier. Get personalized notifications directly on your phone as soon as game recommendations go live.',
      icon: <Bell className="w-6 h-6 text-emerald-400" />
    },
    {
      title: 'Supporter & Ad-Free System',
      description: 'Flexible ad models. Go Silver for free daily ad-views, or unlock permanent ad-free benefits with a one-time lifetime Golden Supporter badge.',
      icon: <ShieldCheck className="w-6 h-6 text-amber-400" />
    }
  ]

  const stats = [
    { value: '15,000+', label: 'Games Discovered' },
    { value: '7,500+', label: 'Gamers Claimed' },
    { value: '$45,000+', label: 'User Savings' },
    { value: '98%', label: 'Match Accuracy' }
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col selection:bg-[#00d4ff]/30 selection:text-white">
      {/* Dynamic Background Glows */}
      <div className="absolute w-[400px] h-[400px] bg-[#6c63ff]/10 rounded-full blur-[120px] pointer-events-none top-1/4 left-1/4 animate-pulse-slow" />
      <div className="absolute w-[400px] h-[400px] bg-[#00d4ff]/10 rounded-full blur-[120px] pointer-events-none top-2/3 right-1/4 animate-pulse-slow" />

      {/* Header */}
      <Header />

      {/* Hero Section */}
      <main className="flex-grow flex flex-col">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center flex flex-col items-center justify-center relative">
          
          {/* Tagline */}
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full text-xs font-semibold tracking-wider text-[#00d4ff] uppercase mb-6 shadow-inner animate-bounce-slow">
            <Sparkles className="w-4 h-4 text-[#6c63ff]" />
            ClaimSG.auto - Never Miss a Free Game
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl leading-tight">
            Auto-Discover Free & Discounted Games From{' '}
            <span className="bg-gradient-to-r from-[#6c63ff] via-[#00d4ff] to-[#6c63ff] bg-clip-text text-transparent bg-[size:200%] animate-gradient">
              Steam & Epic Games
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-gray-400 text-base sm:text-xl max-w-2xl mt-6 leading-relaxed font-medium">
            Save time and budget. Get daily game recommendation lists tailored perfectly to your tastes using advanced Llama 3.1 AI pref screening.
          </p>

          {/* Call to Actions */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/signup" 
              className="w-full sm:w-auto bg-gradient-to-r from-[#6c63ff] to-[#00d4ff] hover:scale-[1.02] text-white font-bold px-8 py-4 rounded-2xl shadow-xl shadow-[#6c63ff]/20 hover:shadow-cyan-500/20 transition duration-300 flex items-center justify-center gap-2 text-base"
            >
              Get Started Free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/pricing" 
              className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 px-8 py-4 rounded-2xl font-bold transition duration-200 text-center text-base"
            >
              View Pricing
            </Link>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 bg-[#1f1f1f]/20 backdrop-blur-md border border-white/5 p-6 sm:p-8 rounded-3xl">
            {stats.map((stat, i) => (
              <div key={i} className="text-center flex flex-col gap-1">
                <span className="text-2xl sm:text-4xl font-extrabold text-white bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  {stat.value}
                </span>
                <span className="text-xs sm:text-sm font-semibold tracking-wider text-gray-500 uppercase">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full flex flex-col gap-12">
          <div className="text-center">
            <h2 className="text-3xl sm:text-5xl font-black text-white">
              Complete Automated Discovery Suite
            </h2>
            <p className="text-gray-500 text-sm sm:text-base mt-3 max-w-xl mx-auto leading-relaxed">
              Explore how ClaimSG.auto brings first-class gaming discoveries straight to your screen daily.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {features.map((feature, i) => (
              <div 
                key={i} 
                className="group bg-[#1f1f1f]/30 backdrop-blur-md border border-white/5 hover:border-cyan-500/10 p-6 sm:p-8 rounded-3xl hover:shadow-lg hover:shadow-cyan-500/5 hover:-translate-y-0.5 transition duration-300 flex items-start gap-4"
              >
                <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 group-hover:border-white/20 transition duration-300">
                  {feature.icon}
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-white font-bold text-lg sm:text-xl group-hover:text-[#00d4ff] transition duration-200">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#050505] py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-semibold text-gray-500">
          <div>
            © {new Date().getFullYear()} ClaimSG.auto. All rights reserved.
          </div>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/about" className="hover:text-white transition">About</Link>
            <Link href="/faq" className="hover:text-white transition">FAQ</Link>
            <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
            <Link href="/contact" className="hover:text-white transition">Contact</Link>
          </div>
          <div className="flex items-center gap-1">
            Made with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse" /> for Gamers
          </div>
        </div>
      </footer>
    </div>
  )
}
