import { NextResponse } from 'next/server'
import { scraperService } from '@/lib/scraper.service'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const steamGames = await scraperService.scrapeSteamDB()

    let savedCount = 0
    for (const game of steamGames) {
      const { error } = await supabaseAdmin
        .from('games_cache')
        .upsert({
          game_id: game.game_id,
          game_name: game.game_name,
          platform: game.platform,
          store_url: game.store_url,
          game_image: game.game_image,
          discount_percent: game.discount_percent,
          rating: game.rating,
          genres: game.genres,
          fetched_at: new Date().toISOString()
        }, { onConflict: 'game_id' })

      if (!error) savedCount++
    }

    return NextResponse.json({
      success: true,
      platform: 'steam',
      count: steamGames.length,
      cached: savedCount,
      message: '✅ SteamDB scraping completed using FlareSolverr with CheapShark fallback'
    })
  } catch (error: any) {
    console.error('SteamDB scraping error:', error)
    return NextResponse.json({ error: 'Scraping SteamDB failed', details: error.message }, { status: 500 })
  }
}
