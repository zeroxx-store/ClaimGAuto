import { NextResponse } from 'next/server'
import { scraperService } from '@/lib/scraper.service'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    // Run all scrapers in parallel
    const [steamGames, epicGames] = await Promise.all([
      scraperService.scrapeSteamDB(),
      scraperService.scrapeEpicGames()
    ])

    const allGames = [...steamGames, ...epicGames]

    let savedCount = 0
    for (const game of allGames) {
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
      steamCount: steamGames.length,
      epicCount: epicGames.length,
      total: allGames.length,
      cached: savedCount,
      message: '✅ Complete database scraping finished successfully using multi-source bypass architectures'
    })
  } catch (error: any) {
    console.error('All-source scraping error:', error)
    return NextResponse.json({ error: 'Failed to complete full scrape', details: error.message }, { status: 500 })
  }
}
