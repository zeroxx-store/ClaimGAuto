'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Menu, X, LogOut, Crown, Medal, User, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'

export default function Header() {
  const [user, setUser] = useState<any>(null)
  const [userDetails, setUserDetails] = useState<any>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Track session and live user details
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
      if (session?.user) {
        fetchUserDetails(session.user.id)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
      if (session?.user) {
        fetchUserDetails(session.user.id)
      } else {
        setUserDetails(null)
      }
    })

    return () => listener?.subscription.unsubscribe()
  }, [])

  const fetchUserDetails = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      setUserDetails(data)
    } catch (e) {
      console.error('Error loading user profile in Header:', e)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setMobileMenuOpen(false)
    router.push('/')
  }

  // Support Badge styling rules
  const getBadgeElement = () => {
    if (userDetails?.is_golden_supporter) {
      return (
        <span className="flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-sm shadow-amber-500/5 animate-pulse">
          <Crown className="w-3.5 h-3.5 fill-amber-400" /> Golden
        </span>
      )
    }
    // Check if Silver is still active (within 24h)
    const isSilverActive = userDetails?.is_silver_supporter && userDetails.silver_expires_at && new Date(userDetails.silver_expires_at) > new Date()
    if (isSilverActive) {
      return (
        <span className="flex items-center gap-1 bg-slate-400/10 text-slate-300 border border-slate-400/20 px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-sm">
          <Medal className="w-3.5 h-3.5 fill-slate-300" /> Silver
        </span>
      )
    }
    return null
  }

  const getPlanBadge = () => {
    const plan = userDetails?.plan || 'free'
    if (plan === 'ultimate') {
      return (
        <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2.5 py-0.5 rounded-full text-xs font-semibold">
          👑 Ultimate
        </span>
      )
    }
    if (plan === 'pro') {
      return (
        <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2.5 py-0.5 rounded-full text-xs font-semibold">
          ⭐ Pro
        </span>
      )
    }
    return (
      <span className="bg-gray-500/10 text-gray-400 border border-gray-500/20 px-2.5 py-0.5 rounded-full text-xs font-semibold">
        Free
      </span>
    )
  }

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/dashboard', label: 'Dashboard', private: true },
    { href: '/pricing', label: 'Pricing' },
    { href: '/how-it-works', label: 'How It Works' },
  ]

  // Filter links for guests
  const activeLinks = navLinks.filter(link => !link.private || user)

  return (
    <header className="bg-[#0a0a0ade]/60 backdrop-blur-md border-b border-white/5 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6c63ff] to-[#00d4ff] flex items-center justify-center shadow-lg shadow-[#6c63ff]/20 group-hover:scale-105 transition duration-300">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#6c63ff] to-[#00d4ff] bg-clip-text text-transparent tracking-tight">
            ClaimSG<span className="text-white font-medium text-lg opacity-80 font-mono">.auto</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {activeLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link 
                key={link.href} 
                href={link.href} 
                className={`text-sm font-medium tracking-wide transition-all duration-200 relative py-1
                  ${isActive ? 'text-[#00d4ff] font-semibold' : 'text-gray-400 hover:text-white'}
                `}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#6c63ff] to-[#00d4ff] rounded-full" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* User Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {/* Badges */}
              <div className="hidden sm:flex items-center gap-2">
                {getBadgeElement()}
                {getPlanBadge()}
              </div>

              {/* Username label */}
              <span className="text-gray-300 text-sm hidden md:inline-flex items-center gap-1.5 font-medium border-l border-white/10 pl-3">
                <User className="w-4 h-4 text-gray-500" />
                {user.email?.split('@')[0]}
              </span>

              {/* Log Out */}
              <button 
                onClick={handleLogout} 
                title="Sign Out"
                className="p-2 hover:bg-white/5 border border-white/5 rounded-xl text-gray-400 hover:text-white transition duration-200"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link 
                href="/login" 
                className="text-gray-400 hover:text-white text-sm font-semibold px-4 py-2 transition"
              >
                Sign In
              </Link>
              <Link 
                href="/signup" 
                className="bg-gradient-to-r from-[#6c63ff] to-[#00d4ff] hover:opacity-90 text-white text-sm font-bold px-4 py-2 rounded-xl shadow-md shadow-[#6c63ff]/20 transition duration-300"
              >
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="md:hidden p-2 text-gray-400 hover:text-white focus:outline-none"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/5 bg-[#0a0a0ade] px-4 py-4 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200">
          {user && (
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <span className="text-gray-300 text-sm font-medium flex items-center gap-1.5">
                <User className="w-4 h-4 text-[#00d4ff]" />
                {user.email?.split('@')[0]}
              </span>
              <div className="flex items-center gap-2">
                {getBadgeElement()}
                {getPlanBadge()}
              </div>
            </div>
          )}
          <div className="flex flex-col gap-2">
            {activeLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href} 
                onClick={() => setMobileMenuOpen(false)}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition
                  ${pathname === link.href ? 'bg-white/5 text-[#00d4ff]' : 'text-gray-400 hover:text-white hover:bg-white/5'}
                `}
              >
                {link.label}
              </Link>
            ))}
          </div>
          {user && (
            <button 
              onClick={handleLogout}
              className="mt-2 w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-2.5 rounded-xl text-sm font-semibold transition"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          )}
        </div>
      )}
    </header>
  )
}
