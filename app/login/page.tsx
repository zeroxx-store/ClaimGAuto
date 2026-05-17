'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, Sparkles } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        setErrorMsg(error.message)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (e: any) {
      setErrorMsg('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      })
      if (error) {
        setErrorMsg(error.message)
      }
    } catch (e: any) {
      setErrorMsg('Google Sign-In failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white px-4 relative">
      {/* Background visual neon glows */}
      <div className="absolute w-[300px] h-[300px] bg-[#6c63ff]/15 rounded-full blur-[80px] pointer-events-none top-10 left-10" />
      <div className="absolute w-[300px] h-[300px] bg-[#00d4ff]/15 rounded-full blur-[80px] pointer-events-none bottom-10 right-10" />

      {/* Main card */}
      <div className="w-full max-w-md bg-[#1f1f1f]/50 backdrop-blur-xl rounded-3xl border border-white/5 shadow-2xl p-8 sm:p-10 relative">
        
        {/* Brand Logo & title */}
        <div className="text-center mb-8 flex flex-col items-center">
          <Link href="/" className="flex items-center gap-2 group mb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6c63ff] to-[#00d4ff] flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
            </div>
            <span className="text-2xl font-black bg-gradient-to-r from-[#6c63ff] to-[#00d4ff] bg-clip-text text-transparent">
              ClaimSG.auto
            </span>
          </Link>
          <h2 className="text-xl font-bold text-white">Welcome back, Gamer</h2>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Log in to view today's game discoveries</p>
        </div>

        {errorMsg && (
          <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Email Address</label>
            <input 
              type="email" 
              placeholder="e.g. gamer@example.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full p-3.5 rounded-xl bg-[#0a0a0a]/80 text-white border border-white/5 focus:border-[#00d4ff]/50 outline-none text-sm transition font-medium" 
              required 
              disabled={loading}
            />
          </div>

          {/* Password input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="Enter password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full p-3.5 rounded-xl bg-[#0a0a0a]/80 text-white border border-white/5 focus:border-[#00d4ff]/50 outline-none text-sm transition pr-11 font-medium" 
                required 
                disabled={loading}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute right-3.5 top-3.5 text-gray-400 hover:text-white transition"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-gradient-to-r from-[#6c63ff] to-[#00d4ff] text-white py-3.5 rounded-xl font-bold hover:opacity-90 transition duration-300 shadow-lg shadow-[#6c63ff]/10 hover:shadow-cyan-500/10 flex items-center justify-center gap-2 text-sm mt-6"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log In'}
          </button>
        </form>

        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-white/5"></div>
          <span className="flex-shrink mx-4 text-gray-500 text-xs font-bold uppercase tracking-wider">or</span>
          <div className="flex-grow border-t border-white/5"></div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          type="button"
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold transition duration-200 text-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {/* Footer info */}
        <p className="text-center text-gray-500 text-xs sm:text-sm mt-8 font-medium">
          Don't have an account?{' '}
          <Link href="/signup" className="text-[#00d4ff] hover:underline font-bold transition">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  )
}
