'use client'
import { useState } from 'react'
import { ExternalLink, Star, Percent, Gift, Sparkles } from 'lucide-react'

interface GameCardProps {
  game: {
    id: string
    game_id: string
    game_name: string
    platform: 'steam' | 'epic'
    store_url: string
    game_image?: string
    discount_percent: number
    rating?: number
  }
  onGet: (game: any) => Promise<void>
  needsAd: boolean
}

export default function GameCard({ game, onGet, needsAd }: GameCardProps) {
  const [loading, setLoading] = useState(false)
  const isFree = game.discount_percent === 100

  const handleClick = async () => {
    try {
      setLoading(true)
      await onGet(game)
    } catch (e) {
      console.error('Error in GameCard get handler:', e)
    } finally {
      setLoading(false)
    }
  }

  // Helper to render stars based on rating (0-100 scale)
  const renderRatingStars = (rating: number = 70) => {
    const starCount = Math.round(rating / 20) // Convert 0-100 to 0-5 stars
    return (
      <div className="flex items-center gap-1.5" title={`User Score: ${rating}/100`}>
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-3.5 h-3.5 ${
                i < starCount 
                  ? 'text-amber-400 fill-amber-400' 
                  : 'text-white/10'
              }`}
            />
          ))}
        </div>
        <span className="text-xs font-semibold text-gray-400">{rating}/100</span>
      </div>
    )
  }

  return (
    <div className="group bg-[#1f1f1f]/40 backdrop-blur-md rounded-2xl overflow-hidden border border-white/5 hover:border-cyan-500/20 shadow-lg shadow-black/40 hover:shadow-cyan-500/5 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
      {/* Game Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-black/30">
        <img 
          src={game.game_image || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80'} 
          alt={game.game_name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e: any) => {
            e.target.src = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80'
          }}
        />

        {/* Floating Platform Badge */}
        <div className="absolute bottom-3 left-3 bg-[#0a0a0a]/80 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-xl text-xs font-bold font-mono tracking-wide text-white/90">
          {game.platform === 'steam' ? '🎮 Steam' : '🟣 Epic'}
        </div>

        {/* Floating Deal Badge */}
        <div className="absolute top-3 right-3">
          {isFree ? (
            <span className="flex items-center gap-1 bg-emerald-500 text-white text-[10px] sm:text-xs font-extrabold px-3 py-1.5 rounded-xl shadow-lg shadow-emerald-500/20 animate-pulse">
              <Gift className="w-3.5 h-3.5 fill-white" /> FREE
            </span>
          ) : (
            <span className="flex items-center gap-0.5 bg-[#6c63ff] text-white text-[10px] sm:text-xs font-extrabold px-3 py-1.5 rounded-xl shadow-lg shadow-[#6c63ff]/20">
              <Percent className="w-3.5 h-3.5" /> {game.discount_percent}% OFF
            </span>
          )}
        </div>
      </div>

      {/* Game Details */}
      <div className="p-5 flex flex-col flex-grow justify-between gap-4">
        <div>
          {/* Game Title */}
          <h3 className="text-white font-bold text-base sm:text-lg group-hover:text-[#00d4ff] line-clamp-1 transition duration-200" title={game.game_name}>
            {game.game_name}
          </h3>

          {/* Rating */}
          <div className="mt-2.5 flex items-center">
            {renderRatingStars(game.rating)}
          </div>
        </div>

        {/* Claim Buttons */}
        <div>
          <button
            onClick={handleClick}
            disabled={loading}
            className="w-full relative group/btn bg-gradient-to-r from-[#6c63ff]/10 to-[#00d4ff]/10 hover:from-[#6c63ff] hover:to-[#00d4ff] text-white hover:text-white border border-[#6c63ff]/20 hover:border-transparent py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-cyan-500/10 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ExternalLink className="w-4 h-4" />
                Get Game
              </>
            )}
          </button>
          
          {needsAd && (
            <p className="text-[10px] text-gray-500 text-center mt-2 flex items-center justify-center gap-1 font-medium font-sans">
              <Sparkles className="w-3 h-3 text-[#6c63ff] animate-pulse" /> 
              Ad appears before redirect
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
