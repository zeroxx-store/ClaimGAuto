import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN

export async function POST(req: NextRequest) {
  try {
    const { userId, message, history } = await req.json()

    if (!userId || !message) {
      return NextResponse.json({ error: 'Missing userId or message' }, { status: 400 })
    }

    // 1. Fetch current preferences
    const { data: prefs, error: prefsError } = await supabaseAdmin
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    const currentPrefsText = prefs
      ? `Current genres: [${prefs.genres?.join(', ') || ''}], Price tier: ${prefs.price_type || 'discount75'}, Min rating: ${prefs.min_rating || 70}`
      : 'No preferences set yet.'

    // 2. Define the System Prompt
    const systemPrompt = `You are ClaimSage, a friendly AI gaming assistant for ClaimSG.auto. Your job is to learn the user's game preferences through a conversational interview.
Your task is to gather the following 4 pieces of information, ONE AT A TIME:
1. Favorite game genres: Action, Adventure, Puzzle, Sports, Racing, Horror, Strategy, RPG (User can choose multiple)
2. Type of deals they want: 'free_only' (100% free), 'discount90' (90%+ off), 'discount80' (80%+ off), 'discount75' (75%+ off), 'all' (all deals)
3. Minimum Steam/Epic rating: An integer between 0 and 100 (suggest 70 as default)
4. WhatsApp number (optional, e.g. +1234567890, only active if they subscribe to the Ultimate plan, otherwise write "skip").

Current Preferences Status: ${currentPrefsText}

Ask questions in a friendly, conversational manner. Use emojis 🎮. Ask only ONE question at a time.
Once you have gathered ALL the answers (or if the user says they want to save their details), output a confirmation message like "PREFERENCES_SAVED! Your settings are updated." AND append a JSON block at the very end of your response inside a markdown code block:
\`\`\`json
{
  "genres": ["Action", "RPG"],
  "price_type": "discount75",
  "min_rating": 70,
  "whatsapp_phone": "+1234567890"
}
\`\`\`
Ensure the JSON block is the absolute last thing in your response and follows this exact structure. Do not output JSON until you have all answers.`

    // 3. Request Llama 3.1 model from Cloudflare Workers AI
    const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.1-8b-instruct`
    
    let aiMessage = "I'm having trouble connecting to ClaimSage. Please configure your Cloudflare credentials."
    let newHistory = history || []

    if (CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_API_TOKEN && CLOUDFLARE_ACCOUNT_ID !== 'placeholder_cf_account_id') {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: systemPrompt },
              ...newHistory,
              { role: 'user', content: message }
            ],
            max_tokens: 1024,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          aiMessage = data.result?.response || aiMessage
        } else {
          const errText = await response.text()
          console.error('Cloudflare API returned error:', response.status, errText)
        }
      } catch (err) {
        console.error('Failed to call Cloudflare API:', err)
      }
    } else {
      // Mock conversation if Cloudflare is not configured yet
      if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
        aiMessage = "Hello! 🎮 I'm ClaimSage. I'll help you customize your daily game discoveries. Let's start: What game genres do you love? (Action, Adventure, Puzzle, Sports, Racing, Horror, Strategy, RPG)"
      } else if (newHistory.length === 0 || newHistory.length === 2) {
        aiMessage = "Awesome! 🕹️ Next up, what type of deals interest you? Choose from: 'Free only', '90%+ off', '80%+ off', '75%+ off', or 'All deals'!"
      } else if (newHistory.length === 4) {
        aiMessage = "Got it! 🚀 What is your minimum Steam/Epic rating? (0 to 100, we recommend 70)"
      } else if (newHistory.length === 6) {
        aiMessage = "Perfect! 📱 Would you like to add a WhatsApp number for daily notifications? (E.g. +1234567890, only for Ultimate plan, or write 'skip')"
      } else {
        aiMessage = "PREFERENCES_SAVED! Your settings are updated. Happy gaming! 🏆\n\n```json\n{\n  \"genres\": [\"Action\", \"RPG\", \"Strategy\"],\n  \"price_type\": \"discount75\",\n  \"min_rating\": 70,\n  \"whatsapp_phone\": \"+1234567890\"\n}\n```"
      }
    }

    newHistory = [...newHistory, { role: 'user', content: message }, { role: 'assistant', content: aiMessage }]

    // 4. Check if preferences are finalized in the response
    let extractedPrefs: any = null
    const jsonMatch = aiMessage.match(/```json\s*([\s\S]*?)\s*```/)
    if (jsonMatch && jsonMatch[1]) {
      try {
        extractedPrefs = JSON.parse(jsonMatch[1].trim())
      } catch (e) {
        console.error('Failed to parse JSON block from AI output:', e)
      }
    }

    // 5. Update user preferences and chat history in database
    if (extractedPrefs) {
      // Update preferences table
      await supabaseAdmin
        .from('user_preferences')
        .upsert({
          user_id: userId,
          genres: extractedPrefs.genres || [],
          price_type: extractedPrefs.price_type || 'discount75',
          min_rating: Number(extractedPrefs.min_rating) || 70,
          chat_history: newHistory,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })

      // Update whatsapp phone in users table
      if (extractedPrefs.whatsapp_phone && extractedPrefs.whatsapp_phone.toLowerCase() !== 'skip') {
        await supabaseAdmin
          .from('users')
          .update({ whatsapp_phone: extractedPrefs.whatsapp_phone })
          .eq('id', userId)
      }
    } else {
      // Just save the history so far
      await supabaseAdmin
        .from('user_preferences')
        .upsert({
          user_id: userId,
          chat_history: newHistory,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
    }

    return NextResponse.json({ message: aiMessage, history: newHistory })

  } catch (error: any) {
    console.error('Chat API Error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
