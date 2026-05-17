'use client'
import Header from '@/components/Header'
import { useState } from 'react'
import { Mail, MessageSquare, Send, Loader2 } from 'lucide-react'

export default function ContactPage() {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSent(true)
      setEmail('')
      setMsg('')
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-16 flex flex-col gap-8 relative z-10">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-[#6c63ff] to-[#00d4ff] bg-clip-text text-transparent">
            Get in Touch
          </h1>
          <p className="text-gray-400 mt-2 font-medium">Have feedback or business questions? Drop us a line.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Support Channels */}
          <div className="flex flex-col gap-4">
            <div className="bg-[#1f1f1f]/35 backdrop-blur-md border border-white/5 p-6 rounded-2xl flex items-start gap-4">
              <Mail className="w-6 h-6 text-[#00d4ff] flex-shrink-0" />
              <div>
                <h3 className="font-bold text-white">Email Support</h3>
                <p className="text-gray-500 text-xs mt-1">support@claimsg.auto</p>
              </div>
            </div>
            <div className="bg-[#1f1f1f]/35 backdrop-blur-md border border-white/5 p-6 rounded-2xl flex items-start gap-4">
              <MessageSquare className="w-6 h-6 text-[#6c63ff] flex-shrink-0" />
              <div>
                <h3 className="font-bold text-white">Live Community</h3>
                <p className="text-gray-500 text-xs mt-1">discord.gg/claimsgauto</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="md:col-span-2 bg-[#1f1f1f]/35 backdrop-blur-md border border-white/5 p-8 rounded-3xl relative">
            {sent && (
              <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm font-semibold">
                ✓ Message received successfully! Our support guild will respond shortly.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Email Address</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="gamer@example.com" 
                  className="w-full p-3.5 bg-[#0a0a0a]/80 text-white border border-white/5 focus:border-[#00d4ff]/40 rounded-xl outline-none text-sm transition font-medium" 
                  required 
                  disabled={loading}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Your Message</label>
                <textarea 
                  value={msg} 
                  onChange={(e) => setMsg(e.target.value)} 
                  rows={4} 
                  placeholder="Enter message..." 
                  className="w-full p-3.5 bg-[#0a0a0a]/80 text-white border border-white/5 focus:border-[#00d4ff]/40 rounded-xl outline-none text-sm transition font-medium" 
                  required 
                  disabled={loading}
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#6c63ff] hover:opacity-90 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold transition flex items-center justify-center gap-2 text-sm shadow-md shadow-[#6c63ff]/15"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Send Message</>}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
