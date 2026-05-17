'use client'
import { useEffect, useState } from 'react'
import { X, ExternalLink, Star, Gift, Percent, Clock } from 'lucide-react'

interface Treasure {
  id: string // UUID of the alert
  game_id: string
  game_name: string
  platform: 'steam' | 'epic'
  store_url: string
  game_image: string
  discount_percent: number
  rating: number
}

interface TreasureFrameProps {
  userId: string
  onGet: (game: any) => Promise<void>
  needsAd: boolean
}

export default function TreasureFrame({ userId, onGet, needsAd }: TreasureFrameProps) {
  const [treasure, setTreasure] = useState<Treasure | null>(null)
  const [visible, setVisible] = useState(false)
  const [countdown, setCountdown] = useState(10)

  // Fetch unseen treasure on load
  useEffect(() => {
    if (!userId) return

    fetch(`/api/treasure/unseen?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.game) {
          setTreasure(data.game)
          setVisible(true)
        }
      })
      .catch(err => console.error('Failed to load treasure details:', err))
  }, [userId])

  // Countdown timer logic
  useEffect(() => {
    if (!visible) return

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          handleClose() // Auto dismiss on timeout
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [visible])

  const handleGet = async () => {
    if (!treasure) return
    
    // Open game via ad-aware router
    setVisible(false)
    await onGet(treasure)

    // Mark as clicked
    try {
      await fetch('/api/treasure/seen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, gameId: treasure.id, clicked: true })
      })
    } catch (e) {
      console.error(e)
    }
  }

  const handleClose = async () => {
    setVisible(false)
    if (!treasure) return

    // Mark as seen so it doesn't pop up again
    try {
      await fetch('/api/treasure/seen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, gameId: treasure.id, seen: true })
      })
    } catch (e) {
      console.error(e)
    }
  }

  if (!visible || !treasure) return null

  const isFree = treasure.discount_percent === 100

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050505]/90 backdrop-blur-md px-4 py-6 animate-in fade-in duration-300">
      
      {/* Background neon glows */}
      <div className="absolute w-[350px] h-[350px] bg-[#6c63ff]/20 rounded-full blur-[100px] pointer-events-none -top-10 -left-10" />
      <div className="absolute w-[350px] h-[350px] bg-[#00d4ff]/20 rounded-full blur-[100px] pointer-events-none -bottom-10 -right-10" />

      {/* Frame Container */}
      <div className="relative w-full max-w-lg bg-[#1f1f1f]/80 backdrop-blur-xl rounded-3xl border-2 border-[#6c63ff]/60 hover:border-[#00d4ff]/60 shadow-2xl shadow-[#6c63ff]/10 hover:shadow-[#00d4ff]/10 transition-all duration-500 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
        
        {/* Game Banner */}
        <div className="relative h-56 w-full overflow-hidden bg-black/40">
          <img 
            src={treasure.game_image || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80'} 
            alt={treasure.game_name} 
            className="w-full h-full object-cover"
            onError={(e: any) => {
              e.target.src = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1f1f1f] via-[#1f1f1f]/30 to-black/30" />

          {/* Close Modal button */}
          <button 
            onClick={handleClose} 
            className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/90 rounded-full text-white/70 hover:text-white transition duration-200 border border-white/10"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Floating Deal Badge */}
          <div className="absolute bottom-4 left-4">
            {isFree ? (
              <span className="flex items-center gap-1 bg-emerald-500 text-white text-xs font-extrabold px-3 py-1.5 rounded-xl shadow-lg shadow-emerald-500/20">
                <Gift className="w-3.5 h-3.5 fill-white" /> 100% FREE
              </span>
            ) : (
              <span className="flex items-center gap-0.5 bg-[#6c63ff] text-white text-xs font-extrabold px-3 py-1.5 rounded-xl shadow-lg shadow-[#6c63ff]/20">
                <Percent className="w-3.5 h-3.5" /> {treasure.discount_percent}% OFF
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 flex flex-col gap-5">
          <div>
            {/* Header labels */}
            <div className="flex items-center justify-between gap-4 mb-2.5">
              <span className="text-xs font-bold tracking-widest text-[#00d4ff] uppercase">
                🔥 Hot Deal Alert
              </span>
              <span className="text-xs font-bold font-mono text-gray-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg">
                {treasure.platform === 'steam' ? '🎮 Steam' : '🟣 Epic'}
              </span>
            </div>

            {/* Game Name */}
            <h2 className="text-2xl font-black text-white leading-tight">
              {treasure.game_name}
            </h2>

            {/* Rating Stars */}
            <div className="mt-3 flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-sm font-semibold text-gray-300">{treasure.rating}/100</span>
              <span className="text-xs text-gray-500">• User Approved Rating</span>
            </div>
          </div>

          <p className="text-sm text-gray-300 leading-relaxed bg-white/5 border border-white/5 p-4 rounded-2xl">
            🎁 <span className="text-[#6c63ff] font-bold">Exclusive Discovery!</span> This game fits your custom preferences perfectly. Claim it immediately before the offer goes away!
          </p>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={handleGet} 
              className="flex-1 bg-gradient-to-r from-[#6c63ff] to-[#00d4ff] hover:opacity-90 text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-[#6c63ff]/20 transition duration-300 flex items-center justify-center gap-2 text-sm"
            >
              <ExternalLink className="w-4.5 h-4.5" />
              CLAIM OFFER NOW
            </button>
            <button 
              onClick={handleClose} 
              className="px-6 py-3.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl text-sm font-bold border border-white/10 transition duration-200"
            >
              Skip
            </button>
          </div>

          {/* Countdown auto-close footer */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500 font-medium">
            <Clock className="w-3.5 h-3.5 text-[#00d4ff] animate-spin-slow" />
            Dismisses automatically in <span className="text-white font-mono font-bold">{countdown}s</span>
          </div>
        </div>
      </div>
    </div>
  )
}
