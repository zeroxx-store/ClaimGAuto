import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 })
    }

    // Get one unseen treasure alert
    const { data: alert, error } = await supabaseAdmin
      .from('treasure_alerts')
      .select('*')
      .eq('user_id', userId)
      .eq('seen', false)
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Error fetching unseen treasure:', error)
      return NextResponse.json({ error: 'Failed to fetch treasure alerts' }, { status: 500 })
    }

    if (!alert) {
      return NextResponse.json({ game: null })
    }

    // Grab visual assets from games_cache
    const { data: gameDetails } = await supabaseAdmin
      .from('games_cache')
      .select('game_image, discount_percent, rating')
      .eq('game_id', alert.game_id)
      .maybeSingle()

    const combinedGame = {
      id: alert.id, // ID of the alert
      game_id: alert.game_id,
      game_name: alert.game_name,
      platform: alert.platform,
      store_url: alert.store_url,
      game_image: gameDetails?.game_image || '',
      discount_percent: gameDetails?.discount_percent || 100,
      rating: gameDetails?.rating || 75
    }

    return NextResponse.json({ game: combinedGame })

  } catch (error: any) {
    console.error('Unseen Treasure API Error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
