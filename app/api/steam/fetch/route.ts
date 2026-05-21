import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { scraperService } from '@/lib/scraper.service'

export async function GET() {
  try {
    const games = await scraperService.scrapeSteam()

    let savedCount = 0
    if (games.length > 0) {
      const gamesToUpsert = games.map(game => ({
        game_id: game.game_id,
        game_name: game.game_name,
        platform: game.platform,
        store_url: game.store_url,
        game_image: game.game_image,
        discount_percent: game.discount_percent,
        rating: game.rating,
        genres: game.genres,
        fetched_at: new Date().toISOString()
      }))
      const { error } = await supabaseAdmin
        .from('games_cache')
        .upsert(gamesToUpsert, { onConflict: 'game_id' })

      if (!error) {
        savedCount = games.length
      } else {
        console.error('Error inserting game cache in bulk:', error)
      }
    }

    return NextResponse.json({ success: true, platform: 'steam', count: games.length, cached: savedCount, source: 'cheapshark' })
  } catch (error: any) {
    console.error('Steam Scraper API Error:', error)
    return NextResponse.json({ error: 'Failed to scrape Steam', details: error.message }, { status: 500 })
  }
}
