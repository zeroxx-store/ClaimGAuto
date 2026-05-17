import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generatePicksForUser } from './generate/route'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 })
    }

    // 1. Fetch current picks from the database
    let { data: picks, error } = await supabaseAdmin
      .from('daily_picks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching picks:', error)
      return NextResponse.json({ error: 'Failed to fetch daily picks' }, { status: 500 })
    }

    // 2. If empty, try to trigger recommendation generation first
    if (!picks || picks.length === 0) {
      try {
        await generatePicksForUser(userId)
        
        // Re-fetch picks
        const { data: generatedPicks } = await supabaseAdmin
          .from('daily_picks')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (generatedPicks && generatedPicks.length > 0) {
          picks = generatedPicks
        }
      } catch (genErr) {
        console.warn('On-demand generation failed:', genErr)
      }
    }

    // 3. If still empty, return empty array with a polite notification
    if (!picks || picks.length === 0) {
      return NextResponse.json({ 
        picks: [], 
        message: "No games found matching your preferences at the moment. Try updating them in the Preference Chat or check back later.",
        hasGames: false 
      })
    }

    return NextResponse.json({ picks, hasGames: true })

  } catch (error: any) {
    console.error('Daily Picks API Error:', error)
    return NextResponse.json({ 
      picks: [], 
      error: "Failed to load games",
      hasGames: false 
    }, { status: 500 })
  }
}
