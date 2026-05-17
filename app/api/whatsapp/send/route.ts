import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const token = process.env.WHATSAPP_API_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

    // 1. Fetch Ultimate users with a registered phone number
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, whatsapp_phone')
      .eq('plan', 'ultimate')
      .not('whatsapp_phone', 'is', null)

    if (usersError) {
      console.error('Error fetching Ultimate users for WhatsApp send:', usersError)
      return NextResponse.json({ error: 'Failed to retrieve subscribers' }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ success: true, message: 'No Ultimate users with WhatsApp phone numbers found.' })
    }

    let messagesSentCount = 0
    let mockModeActive = false

    if (!token || !phoneNumberId || token.includes('placeholder')) {
      console.warn('WhatsApp API credentials are missing. Operating in simulated fallback mode.')
      mockModeActive = true
    }

    // 2. Loop through users and prepare/send their daily picks
    for (const user of users) {
      const { data: picks, error: picksError } = await supabaseAdmin
        .from('daily_picks')
        .select('*')
        .eq('user_id', user.id)
        .limit(5)

      if (picksError || !picks || picks.length === 0) {
        console.warn(`No daily picks found for User ${user.email} (${user.id}). Skipping WhatsApp alert.`)
        continue
      }

      // 3. Format message
      const picksLines = picks.map(game => {
        const platformIcon = game.platform === 'steam' ? '🎮 Steam' : '🟣 Epic'
        const discountText = game.discount_percent === 100 ? '🆓 FREE' : `🔥 ${game.discount_percent}% OFF`
        return `🕹️ *${game.game_name}*\n  • Deal: ${discountText}\n  • Rating: ⭐ ${game.rating || 70}/100\n  • Store: ${platformIcon} \n  • Claim link: ${game.store_url}`
      }).join('\n\n')

      const messageBody = `🌟 *Your Daily Game Picks from ClaimSG.auto* 🌟\n\nHey Gamer! Here are your handpicked free and highly discounted game deals for today:\n\n${picksLines}\n\n✨ Claim them quickly before they expire!\n\n_To manage notification settings, log in to your ClaimSG.auto dashboard._`

      if (mockModeActive) {
        console.log(`[SIMULATED WHATSAPP SEND to ${user.whatsapp_phone}]: \n${messageBody}\n----------------------------------`)
        messagesSentCount++
      } else {
        try {
          const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: user.whatsapp_phone,
              type: 'text',
              text: { body: messageBody },
            }),
          })

          if (response.ok) {
            messagesSentCount++
          } else {
            const errResponse = await response.text()
            console.error(`Meta WhatsApp API error for user ${user.email}:`, errResponse)
          }
        } catch (fetchErr) {
          console.error(`Network error sending WhatsApp to ${user.email}:`, fetchErr)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Broadcasting completed. Broadcasted notifications to ${messagesSentCount} Ultimate subscribers.`,
      simulated: mockModeActive
    })

  } catch (error: any) {
    console.error('WhatsApp Sender API Error:', error)
    return NextResponse.json({ error: 'Failed to process WhatsApp alerts', details: error.message }, { status: 500 })
  }
}
export async function GET(req: NextRequest) {
  // Support GET triggering for simple scheduled workflows
  return POST(req)
}
