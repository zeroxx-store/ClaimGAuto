import { NextResponse } from 'next/server'
import { scraperService } from '@/lib/scraper.service'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const epicGames = await scraperService.scrapeEpicGames()

    let savedCount = 0
    for (const game of epicGames) {
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
      platform: 'epic',
      count: epicGames.length,
      cached: savedCount,
      message: '✅ Epic Games scraping completed using CloudflareBypass with promotions fallbacks'
    })
  } catch (error: any) {
    console.error('Epic scraping error:', error)
    return NextResponse.json({ error: 'Scraping Epic failed', details: error.message }, { status: 500 })
  }
}
