'use client'
import { useEffect, useState, useRef, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import GameCard from '@/components/GameCard'
import TreasureFrame from '@/components/TreasureFrame'
import { Crown, Medal, X, Sparkles, Send, Bot, User as UserIcon, Loader2, RefreshCw, Gift } from 'lucide-react'
import PremiumChat from '@/components/PremiumChat'

const quickReplies = [
  { label: "🎮 Action", value: "I prefer Action games" },
  { label: "🗺️ Adventure", value: "I prefer Adventure games" },
  { label: "🧩 Puzzle", value: "I prefer Puzzle games" },
  { label: "👻 Horror", value: "I prefer Horror games" },
  { label: "♟️ Strategy", value: "I prefer Strategy games" },
  { label: "🧙 RPG", value: "I prefer RPG games" },
  { label: "💰 Free Only", value: "I want Free games only" },
  { label: "🔥 90% Off", value: "I want games with 90% discount" },
  { label: "⭐ 80%+ Rating", value: "I want minimum 80% rating" },
  { label: "🔄 Reset Prefs", value: "Reset my preferences" },
]

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [userDetails, setUserDetails] = useState<any>(null)
  const [picks, setPicks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null)
  const router = useRouter()

  // Ad Banners & Silver Supporter states
  const [bannerVisible, setBannerVisible] = useState(true)
  const [silverClicks, setSilverClicks] = useState({ ad1: false, ad2: false })
  const [silverBadgeActive, setSilverBadgeActive] = useState(false)

  // AI Chat Drawer states
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Filters state
  const [activeFilter, setActiveFilter] = useState('all')

  const FILTERS = [
    { key: 'all', label: 'All', icon: '🎮' },
    { key: 'steam', label: 'Steam', icon: '🔵' },
    { key: 'epic', label: 'Epic', icon: '🟣' },
    { key: 'free', label: 'Free', icon: '💰' },
    { key: 'discount90', label: '90%+ Off', icon: '🔥' },
    { key: 'rating80', label: '80%+ Rating', icon: '⭐' },
  ]

  const filteredPicks = useMemo(() => {
    if (activeFilter === 'all') return picks
    return picks.filter((game: any) => {
      switch (activeFilter) {
        case 'steam': return game.platform === 'steam'
        case 'epic': return game.platform === 'epic'
        case 'free': return game.discount_percent === 100
        case 'discount90': return game.discount_percent >= 90
        case 'rating80': return game.rating >= 80
        default: return true
      }
    })
  }, [picks, activeFilter])

  // Custom mock video ad states
  const [adOverlayVisible, setAdOverlayVisible] = useState(false)
  const [adCountdown, setAdCountdown] = useState(5)
  const [targetStoreUrl, setTargetStoreUrl] = useState('')

  // 1. Session tracking and loading data
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login')
        return
      }
      setUser(session.user)
      loadUserData(session.user.id)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push('/login')
      } else {
        setUser(session.user)
      }
    })

    return () => listener?.subscription.unsubscribe()
  }, [router])

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages, chatOpen])

  const loadUserData = async (userId: string) => {
    try {
      setLoading(true)
      // Fetch user profile
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      setUserDetails(profile)

      if (profile) {
        // Evaluate if Silver is active
        const isSilver = profile.is_silver_supporter && profile.silver_expires_at && new Date(profile.silver_expires_at) > new Date()
        setSilverBadgeActive(isSilver)
      }

      // Fetch user preferences and initial chat history
      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (prefs?.chat_history && prefs.chat_history.length > 0) {
        setChatMessages(prefs.chat_history)
      } else if (prefs?.genres && prefs.genres.length > 0) {
        const welcomeText = `🎮 مرحباً بعودتك! تفضيلاتك الحالية:
- أنواع الألعاب: ${prefs.genres.join(', ') || 'لم تحدد بعد'}
- نوع العروض: ${prefs.price_type || 'discount75'}
- أقل تقييم: ${prefs.min_rating || 70}%

هل تريد تعديل أي شيء؟`
        setChatMessages([
          { role: 'assistant', content: welcomeText }
        ])
      } else {
        // Set default welcome message
        setChatMessages([
          { role: 'assistant', content: "Hello! 🎮 I'm ClaimSage, your personal game recommender. Let's customize your discoveries. What game genres do you love? (Choose from: Action, Adventure, Puzzle, Sports, Racing, Horror, Strategy, RPG)" }
        ])
      }

      // Fetch Today's Picks
      await fetchPicks(userId)

      // Fetch active clicks for today to prefill Silver Supporter watched checkmarks
      const todayStr = new Date().toISOString().split('T')[0]
      const { data: clickData } = await supabase
        .from('silver_ad_clicks')
        .select('*')
        .eq('user_id', userId)
        .eq('click_date', todayStr)
        .maybeSingle()

      if (clickData) {
        setSilverClicks({
          ad1: clickData.ad1_clicked || false,
          ad2: clickData.ad2_clicked || false
        })
      }

    } catch (err) {
      console.error('Error loading dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchPicks = async (userId: string) => {
    const res = await fetch(`/api/daily-picks?userId=${userId}`)
    const data = await res.json()
    if (data.picks) setPicks(data.picks)
  }

  // 2. Generate Picks manual trigger (for seeding/testing easily!)
  const handleGeneratePicks = async () => {
    if (!user) return
    try {
      setGenerating(true)
      setRefreshMessage("Starting live scrapers...")
      
      const steamRes = await fetch('/api/steam/fetch')
      const steamData = await steamRes.json()
      
      const epicRes = await fetch('/api/epic/fetch')
      const epicData = await epicRes.json()

      const steamCount = steamData.count || 0
      const epicCount = epicData.count || 0
      
      setRefreshMessage(`Running AI recommendation engine...`)
      
      const res = await fetch('/api/daily-picks/generate', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })
      if (res.ok) {
        await fetchPicks(user.id)
        // Refresh profile in case a plan is updated
        const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
        setUserDetails(profile)
        
        setRefreshMessage(`Loaded ${steamCount + epicCount} deals from Steam & Epic! Matching games generated.`)
        setTimeout(() => setRefreshMessage(null), 6000)
      }
    } catch (e) {
      console.error(e)
      setRefreshMessage("Live fetch failed. Please check internet connection.")
      setTimeout(() => setRefreshMessage(null), 4000)
    } finally {
      setGenerating(false)
    }
  }

  const handleTargetedPicksRefresh = async () => {
    if (!user) return
    try {
      setGenerating(true)
      setRefreshMessage("Sourcing fresh targeted deals...")
      const res = await fetch('/api/daily-picks/generate', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })
      if (res.ok) {
        await fetchPicks(user.id)
        setRefreshMessage("Targeted games generated successfully!")
        setTimeout(() => setRefreshMessage(null), 3000)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setGenerating(false)
    }
  }

  // 3. Ad-aware Game link claims
  const handleGetGame = async (game: any) => {
    if (!user) return

    try {
      const res = await fetch(`/api/get-game/${game.id}?userId=${user.id}`)
      const data = await res.json()

      if (data.needsAd) {
        // Trigger immersive in-page mockup ad overlay
        setTargetStoreUrl(data.url)
        setAdCountdown(5)
        setAdOverlayVisible(true)
      } else {
        // Directly open link in new tab
        window.open(data.url, '_blank')
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Mock ad countdown loop
  useEffect(() => {
    if (!adOverlayVisible) return
    const timer = setInterval(() => {
      setAdCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          setAdOverlayVisible(false)
          window.open(targetStoreUrl, '_blank')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [adOverlayVisible, targetStoreUrl])

  // 4. Watch mock ad for Silver badge
  const handleSilverAdClick = async (adNumber: number) => {
    if (!user) return
    
    // Open a mock ad link
    window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank')

    try {
      const res = await fetch('/api/silver/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, adNumber })
      })

      const data = await res.json()
      if (adNumber === 1) setSilverClicks(prev => ({ ...prev, ad1: true }))
      if (adNumber === 2) setSilverClicks(prev => ({ ...prev, ad2: true }))

      if (data.isSilverNow) {
        setSilverBadgeActive(true)
        setUserDetails((prev: any) => ({
          ...prev,
          is_silver_supporter: true,
          silver_expires_at: data.expiresAt
        }))
      }
    } catch (e) {
      console.error('Error tracking ad click:', e)
    }
  }

  // 5. Conversational Preferences chat trigger
  const sendDirectMessage = async (messageText: string) => {
    if (!messageText.trim() || chatLoading || !user) return

    setChatLoading(true)

    // Optimistically update message bubble list
    const tempHistory = [...chatMessages, { role: 'user', content: messageText }]
    setChatMessages(tempHistory)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          message: messageText,
          history: chatMessages
        })
      })

      const data = await response.json()
      if (data.history) {
        setChatMessages(data.history)
        
        // If final preferences saved in Llama, generate new daily picks automatically!
        if (data.message.includes('PREFERENCES_SAVED')) {
          handleGeneratePicks()
        }
      }
    } catch (err) {
      console.error('Failed to communicate with AI:', err)
    } finally {
      setChatLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return
    const text = chatInput
    setChatInput('')
    await sendDirectMessage(text)
  }

  const isGolden = userDetails?.is_golden_supporter

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#00d4ff] animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white relative">
      <Header />

      {/* Global countdown Modal for mock ad player */}
      {adOverlayVisible && (
        <div className="fixed inset-0 z-50 bg-[#050505]/95 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="max-w-md w-full bg-[#1f1f1f] rounded-3xl border border-white/10 p-8 text-center flex flex-col items-center gap-6 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center animate-pulse">
              <Sparkles className="w-8 h-8 text-[#00d4ff]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Displaying Sponsor Offer</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Thank you for supporting ClaimSG.auto! Your free game store page is preparing and will open in a new tab shortly.
              </p>
            </div>
            
            {/* Visual timer radial badge */}
            <div className="w-24 h-24 rounded-full bg-[#0a0a0a] border border-white/5 flex items-center justify-center shadow-inner">
              <span className="text-4xl font-black text-[#00d4ff] font-mono animate-bounce-slow">
                {adCountdown}s
              </span>
            </div>

            <p className="text-xs text-gray-500 italic">
              Want to skip ads permanently? Check out our Golden Supporter tier.
            </p>
          </div>
        </div>
      )}

      {/* Treasure Alerts component */}
      {user && (
        <TreasureFrame 
          userId={user.id} 
          onGet={handleGetGame} 
          needsAd={userDetails?.plan === 'free' && !isGolden} 
        />
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-8 relative">
        
        {/* Scraper progress & load counts notification banner */}
        {refreshMessage && (
          <div className="bg-[#6c63ff]/10 border border-[#6c63ff]/20 text-[#00d4ff] px-6 py-4 rounded-2xl flex items-center gap-3 shadow-lg font-bold text-sm transition-all duration-300">
            {!refreshMessage.includes("Loaded") && !refreshMessage.includes("failed") && (
              <Loader2 className="w-5 h-5 animate-spin text-[#00d4ff]" />
            )}
            {refreshMessage}
          </div>
        )}
        
        {/* Row 1: Profile card info */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Dashboard
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Welcome back, <span className="text-white font-semibold">{user?.email?.split('@')[0]}</span>! Ready to claim game rewards?
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {isGolden && (
              <span className="flex items-center gap-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-4 py-1.5 rounded-xl text-xs font-bold uppercase shadow-sm">
                <Crown className="w-4 h-4 fill-amber-400" /> Golden Supporter
              </span>
            )}
            {silverBadgeActive && !isGolden && (
              <span className="flex items-center gap-1.5 bg-slate-400/10 text-slate-300 border border-slate-400/20 px-4 py-1.5 rounded-xl text-xs font-bold uppercase shadow-sm">
                <Medal className="w-4 h-4 fill-slate-300" /> Silver Badge
              </span>
            )}
            <span className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border
              ${userDetails?.plan === 'ultimate' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 
                userDetails?.plan === 'pro' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 
                'bg-gray-500/10 text-gray-400 border-white/5'}
            `}>
              Tiers: {userDetails?.plan || 'free'}
            </span>

            {/* AI Preferences chat trigger button */}
            <button 
              onClick={() => setChatOpen(true)}
              className="flex items-center gap-2 bg-[#6c63ff] hover:opacity-90 text-white font-bold px-4 py-1.5 rounded-xl text-xs uppercase transition shadow-md shadow-[#6c63ff]/10"
            >
              <Bot className="w-4 h-4" /> Preference Chat
            </button>
          </div>
        </div>

        {/* Dynamic Sponsor Ad Banner (Golden Supporters are ad-free!) */}
        {!isGolden && bannerVisible && (
          <div className="relative bg-gradient-to-r from-[#6c63ff]/10 to-[#00d4ff]/10 border border-[#6c63ff]/20 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left shadow-lg">
            <button 
              onClick={() => setBannerVisible(false)} 
              title="Close Ad"
              className="absolute top-2.5 right-2.5 p-1 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition duration-200"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0a0a0a]/80 flex items-center justify-center text-cyan-400 flex-shrink-0">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <p className="text-gray-300 text-sm font-semibold pr-4">
                Enjoy ClaimSG.auto? Upgrade to <span className="text-[#00d4ff] font-bold">Pro</span> or <span className="text-purple-400 font-bold">Ultimate</span> to get unlimited daily recommends and WhatsApp delivery alerts!
              </p>
            </div>
            <button 
              onClick={() => router.push('/pricing')}
              className="bg-white hover:bg-gray-100 text-black font-extrabold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition flex-shrink-0"
            >
              Learn More
            </button>
          </div>
        )}

        {/* Silver Supporter Click tasks */}
        {!isGolden && !silverBadgeActive && (
          <div className="bg-[#1f1f1f]/30 backdrop-blur-md border border-white/5 p-6 rounded-3xl flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#00d4ff]" />
                Acquire Silver Supporter Status (Free)
              </h2>
              <p className="text-gray-400 text-xs sm:text-sm mt-1">
                Help fund our servers! Watch 2 mock sponsor ads daily to unlock a Silver Badge and bypass ad prompts on Get buttons for 24h!
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); handleSilverAdClick(1); }}
                disabled={silverClicks.ad1}
                className={`py-3 px-4 rounded-xl text-xs font-bold uppercase transition flex items-center justify-center gap-2 border
                  ${silverClicks.ad1 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 cursor-default' 
                    : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}
                `}
              >
                {silverClicks.ad1 ? '✓ Watched Sponsor Ad 1' : 'Watch Sponsor Ad 1'}
              </button>

              <button
                type="button"
                onClick={(e) => { e.preventDefault(); handleSilverAdClick(2); }}
                disabled={silverClicks.ad2}
                className={`py-3 px-4 rounded-xl text-xs font-bold uppercase transition flex items-center justify-center gap-2 border
                  ${silverClicks.ad2 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 cursor-default' 
                    : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}
                `}
              >
                {silverClicks.ad2 ? '✓ Watched Sponsor Ad 2' : 'Watch Sponsor Ad 2'}
              </button>
            </div>
          </div>
        )}

        {/* Picks Feed */}
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center gap-4">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Gift className="w-5 h-5 text-[#6c63ff]" /> Today's Recommendations
              {picks.length > 0 && (
                <span className="text-xs font-normal text-gray-500 ml-1">({picks.length})</span>
              )}
            </h2>
            <button 
              onClick={handleGeneratePicks}
              disabled={generating}
              title="Refresh / Generate game discoveries"
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-white rounded-xl transition flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#00d4ff]" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {generating ? 'Regenerating...' : 'Refresh'}
            </button>
          </div>

          {/* Filter bar */}
          {picks.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all duration-200 flex items-center gap-1.5 ${
                    activeFilter === f.key
                      ? 'bg-[#6c63ff] text-white border-[#6c63ff] shadow-md shadow-[#6c63ff]/20'
                      : 'bg-[#1f1f1f] border-gray-700 text-gray-400 hover:bg-[#6c63ff]/20 hover:text-white hover:border-[#6c63ff]/40'
                  }`}
                >
                  <span>{f.icon}</span>
                  {f.label}
                </button>
              ))}
            </div>
          )}

          {filteredPicks.length === 0 ? (
            <div className="bg-[#1f1f1f]/20 backdrop-blur-md border border-white/5 p-12 rounded-3xl text-center flex flex-col items-center gap-4">
              <Bot className="w-12 h-12 text-[#6c63ff]" />
              <div>
                <h3 className="text-white font-bold text-lg">
                  {activeFilter === 'all' ? 'No games found matching your preferences' : `No games match the "${FILTERS.find(f => f.key === activeFilter)?.label}" filter`}
                </h3>
                <p className="text-gray-400 text-sm mt-1 max-w-sm mx-auto">
                  {activeFilter === 'all'
                    ? 'Try adjusting your preferences in the Preference Chat, or click below to refresh and fetch the latest live deals from Steam and Epic Games.'
                    : 'Try a different filter or adjust your preferences in the Preference Chat.'}
                </p>
              </div>
              {activeFilter === 'all' && (
                <button
                  onClick={handleGeneratePicks}
                  disabled={generating}
                  className="bg-gradient-to-r from-[#6c63ff] to-[#00d4ff] hover:opacity-90 text-white font-bold px-6 py-3 rounded-xl text-xs uppercase transition shadow-md shadow-[#6c63ff]/10 disabled:opacity-50"
                >
                  {generating ? 'Running Scrapers...' : 'Fetch Live Game Database'}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredPicks.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onGet={handleGetGame}
                  needsAd={userDetails?.plan === 'free' && !isGolden && !silverBadgeActive}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Floating AI Preferences Chat Panel (Drawer) */}
      {chatOpen && user && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[450px] animate-in slide-in-from-right duration-300">
          <PremiumChat 
            userId={user.id} 
            onClose={() => {
              setChatOpen(false)
              fetchPicks(user.id)
            }}
            onPreferencesSaved={async () => {
              // Automatically regenerate matches when user preferences are saved
              await handleGeneratePicks()
            }}
          />
        </div>
      )}
    </div>
  )
}
