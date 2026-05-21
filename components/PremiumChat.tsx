'use client'
import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, Gamepad2, Trophy, Flame, Sword, Shield, Users, Zap, Loader2, Bot, X } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface QuickAction {
  icon: React.ReactNode
  label: string
  value: string
  color: string
}

export default function PremiumChat({ 
  userId, 
  onClose,
  onPreferencesSaved 
}: { 
  userId: string
  onClose?: () => void
  onPreferencesSaved?: () => void 
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Hardcore gamer quick replies
  const quickActions: QuickAction[] = [
    { icon: <Sword className="w-3.5 h-3.5" />, label: 'Action', value: 'I prefer Action games', color: 'from-red-500/20 to-orange-500/20 border-red-500/30 text-red-300 hover:from-red-500/30 hover:to-orange-500/30' },
    { icon: <Shield className="w-3.5 h-3.5" />, label: 'Adventure', value: 'I prefer Adventure games', color: 'from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-300 hover:from-green-500/30 hover:to-emerald-500/30' },
    { icon: <Gamepad2 className="w-3.5 h-3.5" />, label: 'RPG', value: 'I prefer RPG games', color: 'from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-300 hover:from-purple-500/30 hover:to-pink-500/30' },
    { icon: <Zap className="w-3.5 h-3.5" />, label: 'Strategy', value: 'I prefer Strategy games', color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-300 hover:from-blue-500/30 hover:to-cyan-500/30' },
    { icon: <Flame className="w-3.5 h-3.5" />, label: 'Free Only', value: 'I want Free games only', color: 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30 text-yellow-300 hover:from-yellow-500/30 hover:to-amber-500/30' },
    { icon: <Trophy className="w-3.5 h-3.5" />, label: '90% Off', value: 'I want games with 90% discount', color: 'from-indigo-500/20 to-purple-500/20 border-indigo-500/30 text-indigo-300 hover:from-indigo-500/30 hover:to-purple-500/30' },
    { icon: <Users className="w-3.5 h-3.5" />, label: '80%+ Rating', value: 'I want minimum 80% rating', color: 'from-teal-500/20 to-green-500/20 border-teal-500/30 text-teal-300 hover:from-teal-500/30 hover:to-green-500/30' },
    { icon: <Sparkles className="w-3.5 h-3.5" />, label: 'Reset', value: 'Reset my preferences', color: 'from-gray-500/20 to-gray-700/20 border-gray-500/30 text-gray-300 hover:from-gray-500/30 hover:to-gray-700/30' },
  ]

  useEffect(() => {
    loadPreferences()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadPreferences = async () => {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, message: '' })
      })
      const data = await res.json()

      if (data.history && data.history.length > 0) {
        const loaded = data.history.map((m: any, i: number) => ({
          id: `hist-${i}`,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          timestamp: new Date()
        }))
        setMessages(loaded)
      } else {
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: `🎮 **Greetings, Gamer!**

I'm your battle-hardened gaming assistant. Let's customize your discovery filters to hunt down the absolute best free & discounted deals from Steam and Epic Games!

Tap any Quick Action command below or chat with me in your own words.`,
          timestamp: new Date()
        }])
      }
    } catch (e) {
      console.error(e)
    }
  }

  const sendMessage = async (content: string) => {
    if (!content.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // Build history for Llama
      const chatHistory = messages.map(m => ({ role: m.role, content: m.content }))

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, message: content, history: chatHistory })
      })
      const data = await res.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])

      if (data.message.includes('PREFERENCES_SAVED')) {
        if (onPreferencesSaved) onPreferencesSaved()
      }
    } catch (error) {
      console.error('Chat error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#0d0e12]/95 backdrop-blur-xl border-l border-white/10 shadow-2xl overflow-hidden text-gray-200">
      
      {/* Discord-like Header */}
      <div className="p-5 border-b border-white/5 bg-[#14161d]/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6c63ff] to-[#00d4ff] flex items-center justify-center shadow-lg shadow-[#6c63ff]/20">
            <Bot className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-white font-extrabold text-sm tracking-wide">ClaimSage AI</h2>
              <span className="text-[9px] bg-[#6c63ff]/20 text-[#00d4ff] border border-[#6c63ff]/30 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                Llama 3.1
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase">Active Loadout</span>
            </div>
          </div>
        </div>

        {onClose && (
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Messages Thread */}
      <div className="flex-grow p-5 overflow-y-auto flex flex-col gap-4 bg-[#0a0b0d]/40">
        {messages.map((msg) => {
          const isAI = msg.role === 'assistant'
          // Clean JSON blocks from markdown messages
          const cleanContent = msg.content.replace(/```json[\s\S]*?```/, '').trim()
          if (!cleanContent) return null

          return (
            <div 
              key={msg.id} 
              className={`flex items-start gap-3 max-w-[85%] ${isAI ? 'self-start' : 'self-end flex-row-reverse'}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm
                ${isAI ? 'bg-gradient-to-tr from-[#6c63ff] to-[#00d4ff] text-white' : 'bg-white/5 text-[#00d4ff] border border-white/10'}
              `}>
                {isAI ? <Bot className="w-4 h-4" /> : <Gamepad2 className="w-4 h-4" />}
              </div>
              <div className={`p-4 rounded-xl text-xs leading-relaxed font-semibold transition-all duration-200
                ${isAI 
                  ? 'bg-[#14161d]/90 text-gray-200 border border-white/5 rounded-tl-none shadow-md' 
                  : 'bg-gradient-to-tr from-[#6c63ff] to-[#6c63ff]/80 text-white rounded-tr-none shadow-md shadow-[#6c63ff]/10'}
              `}>
                <div className="whitespace-pre-wrap">{cleanContent}</div>
                <div className="text-[8px] opacity-40 mt-2 text-right">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          )
        })}

        {loading && (
          <div className="flex items-center gap-3 self-start">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#6c63ff] to-[#00d4ff] text-white flex items-center justify-center animate-spin">
              <Loader2 className="w-4 h-4" />
            </div>
            <div className="p-4 bg-[#14161d]/90 border border-white/5 text-gray-400 text-xs font-bold rounded-xl rounded-tl-none animate-pulse">
              Calibrating target coordinates...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Hardcore Gamers Quick Actions Panel */}
      <div className="p-4 border-t border-white/5 bg-[#14161d]/90">
        <div className="grid grid-cols-4 gap-2 mb-3">
          {quickActions.map((action) => (
            <button
              key={action.label}
              type="button"
              disabled={loading}
              onClick={() => sendMessage(action.value)}
              className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl text-[10px] font-extrabold uppercase border tracking-wider transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 bg-gradient-to-tr ${action.color} shadow-sm disabled:opacity-50`}
            >
              {action.icon}
              <span>{action.label}</span>
            </button>
          ))}
        </div>

        {/* Input Console */}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            disabled={loading}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                sendMessage(input)
              }
            }}
            placeholder="Issue preference command..."
            className="flex-grow p-3 bg-[#0a0b0d] text-white border border-white/10 focus:border-[#00d4ff]/40 rounded-xl outline-none text-xs font-semibold tracking-wide"
          />
          <button
            type="button"
            disabled={loading || !input.trim()}
            onClick={() => sendMessage(input)}
            className="bg-[#6c63ff] hover:opacity-90 disabled:opacity-50 text-white p-3 rounded-xl transition flex items-center justify-center shadow-lg shadow-[#6c63ff]/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  )
}
