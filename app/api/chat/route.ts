import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generatePicksForUser } from '@/lib/picks-generator'

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN

async function detectUserIntent(message: string, currentPrefs: any, userId: string, history: any[]) {
  const normalizedMsg = message.toLowerCase()
  
  const updatedPrefs = {
    genres: currentPrefs?.genres ? [...currentPrefs.genres] : [],
    price_type: currentPrefs?.price_type || 'discount75',
    min_rating: currentPrefs?.min_rating || 70
  }

  // 1. Detect Price Type / Deal Preference
  if (
    normalizedMsg.includes('free') || 
    normalizedMsg.includes('gratuit') || 
    normalizedMsg.includes('مجاني') || 
    normalizedMsg.includes('مجانى') || 
    normalizedMsg.includes('مجانية') ||
    normalizedMsg.includes('0$') ||
    normalizedMsg.includes('$0')
  ) {
    updatedPrefs.price_type = 'free_only'
  } else if (normalizedMsg.includes('90') || normalizedMsg.includes('تسعين')) {
    updatedPrefs.price_type = 'discount90'
  } else if (normalizedMsg.includes('80') || normalizedMsg.includes('ثمانين')) {
    updatedPrefs.price_type = 'discount80'
  } else if (normalizedMsg.includes('75') || normalizedMsg.includes('خمسة وسبعين') || normalizedMsg.includes('خمسه وسبعين')) {
    updatedPrefs.price_type = 'discount75'
  } else if (normalizedMsg.includes('all') || normalizedMsg.includes('كل') || normalizedMsg.includes('الجميع')) {
    updatedPrefs.price_type = 'all'
  }

  // 2. Detect Genres (English and Arabic)
  const genreMapping: { [key: string]: string } = {
    'action': 'Action',
    'أكشن': 'Action',
    'اكشن': 'Action',
    'adventure': 'Adventure',
    'مغامرات': 'Adventure',
    'مغامرة': 'Adventure',
    'rpg': 'RPG',
    'آر بي جي': 'RPG',
    'ار بي جي': 'RPG',
    'تقمص': 'RPG',
    'strategy': 'Strategy',
    'استراتيجية': 'Strategy',
    'إستراتيجية': 'Strategy',
    'تخطيط': 'Strategy',
    'puzzle': 'Puzzle',
    'ألغاز': 'Puzzle',
    'الغاز': 'Puzzle',
    'لغز': 'Puzzle',
    'horror': 'Horror',
    'رعب': 'Horror',
    'shooter': 'Shooter',
    'تصويب': 'Shooter',
    'شوتر': 'Shooter',
    'racing': 'Racing',
    'سباق': 'Racing',
    'سباقات': 'Racing',
    'sports': 'Sports',
    'رياضة': 'Sports',
    'رياضية': 'Sports'
  }

  Object.entries(genreMapping).forEach(([keyword, genreName]) => {
    if (normalizedMsg.includes(keyword)) {
      if (!updatedPrefs.genres.includes(genreName)) {
        updatedPrefs.genres.push(genreName)
      }
    }
  })

  // 3. Detect Minimum Rating (a number between 10 and 99 that isn't a discount percentage)
  const ratingMatches = normalizedMsg.match(/\b(100|[1-9]\d)\b/)
  if (ratingMatches) {
    const num = parseInt(ratingMatches[1])
    if (num <= 100 && num >= 10 && num !== 90 && num !== 80 && num !== 75) {
      updatedPrefs.min_rating = num
    }
  }

  // Save the detected preferences instantly in the DB
  await supabaseAdmin
    .from('user_preferences')
    .upsert({
      user_id: userId,
      genres: updatedPrefs.genres,
      price_type: updatedPrefs.price_type,
      min_rating: updatedPrefs.min_rating,
      chat_history: [...history, { role: 'user', content: message }],
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })

  return updatedPrefs
}

export async function POST(req: NextRequest) {
  try {
    const { userId, message, history } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    // 1. Fetch current preferences and chat history from database
    const { data: existingPrefs, error: prefsError } = await supabaseAdmin
      .from('user_preferences')
      .select('genres, price_type, min_rating, chat_history')
      .eq('user_id', userId)
      .maybeSingle()

    // 2. Scenario: No active message (Initial drawer load check)
    if (!message) {
      if (existingPrefs?.genres?.length > 0 && existingPrefs?.price_type) {
        const welcomeText = `🎮 مرحباً بعودتك! تفضيلاتك الحالية:
- أنواع الألعاب: ${existingPrefs.genres.join(', ') || 'لم تحدد بعد'}
- نوع العروض: ${existingPrefs.price_type}
- أقل تقييم: ${existingPrefs.min_rating}%

هل تريد تعديل أي شيء؟`

        let finalHistory = existingPrefs.chat_history || []
        if (finalHistory.length === 0) {
          finalHistory = [{ role: 'assistant', content: welcomeText }]
        }

        return NextResponse.json({
          message: welcomeText,
          history: finalHistory,
          hasPreferences: true,
          preferences: existingPrefs
        })
      } else {
        const welcomeText = "Hello! 🎮 I'm ClaimSage, your personal game recommender. Let's customize your discoveries. What game genres do you love? (Choose from: Action, Adventure, Puzzle, Sports, Racing, Horror, Strategy, RPG)"
        let finalHistory = existingPrefs?.chat_history || []
        if (finalHistory.length === 0) {
          finalHistory = [{ role: 'assistant', content: welcomeText }]
        }
        return NextResponse.json({
          message: welcomeText,
          history: finalHistory,
          hasPreferences: false
        })
      }
    }

    // 3. Scenario: Reset Preferences requested
    if (message.toLowerCase().includes('reset')) {
      const resetText = "PREFERENCES_SAVED! Preferences have been reset to defaults. I will now recommend all available deals. 🏆\n\n```json\n{\n  \"genres\": [],\n  \"price_type\": \"discount75\",\n  \"min_rating\": 70,\n  \"whatsapp_phone\": \"skip\"\n}\n```"
      const finalHistory = [{ role: 'assistant', content: resetText }]
      
      await supabaseAdmin
        .from('user_preferences')
        .upsert({
          user_id: userId,
          genres: [],
          price_type: 'discount75',
          min_rating: 70,
          chat_history: finalHistory,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })

      try {
        await generatePicksForUser(userId)
      } catch (err) {
        console.error('Failed to trigger immediate pick generation after resetting preferences:', err)
      }

      return NextResponse.json({ message: resetText, history: finalHistory })
    }

    // 4. Construct System Prompt with existing preferences integrated
    const updatedPrefs = await detectUserIntent(message, existingPrefs, userId, history || [])
    const currentGenres = updatedPrefs.genres.join(', ') || 'لا يوجد'
    const currentPrice = updatedPrefs.price_type
    const currentRating = updatedPrefs.min_rating

    const systemPrompt = `You are ClaimSage, a friendly AI gaming assistant for ClaimSG.auto. Your ONLY job is to learn or update the user's game preferences through a conversational interview.

❌ CRITICAL RULE: DO NOT recommend, suggest, list, or name any specific video games in your chat messages. If a user asks for game recommendations, politely remind them that their customized recommendations are generated and displayed directly on their Dashboard screen. Keep your dialogue strictly limited to analyzing their preference criteria.

المستخدم لديه حالياً هذه التفضيلات المحفوظة في قاعدة البيانات:
- الأنواع المفضلة (Genres): ${currentGenres}
- نوع العروض (Price Type): ${currentPrice}
- أقل تقييم (Min Rating): ${currentRating}%

⚠️ قواعد صارمة لمنع تكرار الأسئلة:
1. إذا كانت التفضيلات موجودة بالفعل، لا تسأله عنها مرة أخرى من البداية. فقط تعامل مع رسالته مباشرة، وساعده على تحديثها إذا طلب ذلك (مثلاً إذا قال "غير النوع إلى RPG" فقم بتغييرها).
2. إذا كانت التفضيلات موجودة، اسأله ببساطة: "هل تريد تعديل أي شيء؟" ولا تكرر طرح نفس السؤال.
3. لا تكرر نفس السؤال مرتين متتاليتين أبداً.

Your task is to gather the following 4 pieces of information, ONE AT A TIME (unless already specified above):
1. Favorite game genres: Action, Adventure, Puzzle, Sports, Racing, Horror, Strategy, RPG (User can choose multiple)
2. Type of deals they want: 'free_only' (100% free), 'discount90' (90%+ off), 'discount80' (80%+ off), 'discount75' (75%+ off), 'all' (all deals)
3. Minimum Steam/Epic rating: An integer between 0 and 100 (suggest 70 as default)
4. WhatsApp number (optional, e.g. +1234567890, only active if they subscribe to the Ultimate plan, otherwise write "skip").

Ask questions in a friendly, conversational manner. Use emojis 🎮. Ask only ONE question at a time.
Once you have gathered ALL the answers (or if the user requests to update/save their settings), output a confirmation message like "PREFERENCES_SAVED! Your settings are updated." AND append a JSON block at the very end of your response inside a markdown code block:
\`\`\`json
{
  "genres": ["Action", "RPG"],
  "price_type": "discount75",
  "min_rating": 70,
  "whatsapp_phone": "+1234567890"
}
\`\`\`
Ensure the JSON block is the absolute last thing in your response and follows this exact structure. Do not output JSON until you have all answers.`

    // 5. Request Llama 3.1 model from Cloudflare Workers AI
    const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.1-8b-instruct`
    
    let aiMessage = "I'm having trouble connecting to ClaimSage. Please configure your Cloudflare credentials."
    let newHistory = history || existingPrefs?.chat_history || []

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
      // Mock conversation fallback if Cloudflare is not configured
      const lowerMsg = message.toLowerCase()
      if (lowerMsg.includes('change') || lowerMsg.includes('genre') || lowerMsg.includes('rpg') || lowerMsg.includes('action') || lowerMsg.includes('strategy')) {
        const detectedGenres: string[] = []
        if (lowerMsg.includes('rpg')) detectedGenres.push('RPG')
        if (lowerMsg.includes('action')) detectedGenres.push('Action')
        if (lowerMsg.includes('strategy')) detectedGenres.push('Strategy')
        if (lowerMsg.includes('adventure')) detectedGenres.push('Adventure')
        if (detectedGenres.length === 0) detectedGenres.push('Action')

        aiMessage = `PREFERENCES_SAVED! I've updated your preferences with the requested genres. Happy gaming! 🏆\n\n\`\`\`json\n{\n  "genres": ${JSON.stringify(detectedGenres)},\n  "price_type": "${existingPrefs?.price_type || 'discount75'}",\n  "min_rating": ${existingPrefs?.min_rating || 70},\n  "whatsapp_phone": "skip"\n}\n\`\`\``

      } else if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
        aiMessage = "Hello! 🎮 I'm ClaimSage. I'll help you customize your daily game discoveries. Let's start: What game genres do you love? (Action, Adventure, Puzzle, Sports, Racing, Horror, Strategy, RPG)"
      } else if (newHistory.length <= 1) {
        aiMessage = "Awesome! 🕹️ Next up, what type of deals interest you? Choose from: 'Free only', '90%+ off', '80%+ off', '75%+ off', or 'All deals'!"
      } else if (newHistory.length <= 3) {
        aiMessage = "Got it! 🚀 What is your minimum Steam/Epic rating? (0 to 100, we recommend 70)"
      } else if (newHistory.length <= 5) {
        aiMessage = "Perfect! 📱 Would you like to add a WhatsApp number for daily notifications? (E.g. +1234567890, only for Ultimate plan, or write 'skip')"
      } else {
        aiMessage = `PREFERENCES_SAVED! Your settings are updated. Happy gaming! 🏆\n\n\`\`\`json\n{\n  "genres": ${JSON.stringify(existingPrefs?.genres || ["Action"])},\n  "price_type": "${existingPrefs?.price_type || 'discount75'}",\n  "min_rating": ${existingPrefs?.min_rating || 70},\n  "whatsapp_phone": "skip"\n}\n\`\`\``
      }
    }

    newHistory = [...newHistory, { role: 'user', content: message }, { role: 'assistant', content: aiMessage }]

    // 6. Check if preferences are finalized in the response
    let extractedPrefs: any = null
    const jsonMatch = aiMessage.match(/```json\s*([\s\S]*?)\s*```/)
    if (jsonMatch && jsonMatch[1]) {
      try {
        extractedPrefs = JSON.parse(jsonMatch[1].trim())
      } catch (e) {
        console.error('Failed to parse JSON block from AI output:', e)
      }
    }

    let preferencesUpdated = false

    // 7. Update user preferences and chat history in database
    if (extractedPrefs) {
      preferencesUpdated = true
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

      if (extractedPrefs.whatsapp_phone && extractedPrefs.whatsapp_phone.toLowerCase() !== 'skip') {
        await supabaseAdmin
          .from('users')
          .update({ whatsapp_phone: extractedPrefs.whatsapp_phone })
          .eq('id', userId)
      }

      // TRIGGER IMMEDIATE GENERATION!
      try {
        await generatePicksForUser(userId)
      } catch (genErr) {
        console.error('Failed to generate daily picks instantly after pref change:', genErr)
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

    return NextResponse.json({ 
      message: aiMessage, 
      history: newHistory, 
      preferencesUpdated 
    })

  } catch (error: any) {
    console.error('Chat API Error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
