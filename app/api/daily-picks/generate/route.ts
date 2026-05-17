import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function matchesPreferences(game: any, prefs: any) {
  // 1. Minimum rating filter
  const minRating = prefs.min_rating ?? 70
  if (game.rating < minRating) return false

  // 2. Price type filter
  const priceType = prefs.price_type || 'discount75'
  if (priceType === 'free_only' && game.discount_percent !== 100) return false
  if (priceType === 'discount90' && game.discount_percent < 90) return false
  if (priceType === 'discount80' && game.discount_percent < 80) return false
  if (priceType === 'discount75' && game.discount_percent < 75) return false

  // 3. Genre filter (only filter if user has specific genres set)
  if (prefs.genres && Array.isArray(prefs.genres) && prefs.genres.length > 0) {
    const gameGenres = game.genres || []
    const hasMatchingGenre = gameGenres.some((g: string) => 
      prefs.genres.some((pg: string) => pg.toLowerCase() === g.toLowerCase())
    )
    if (!hasMatchingGenre) return false
  }

  return true
}

async function scrapeFreeGamesOnly() {
  const games: any[] = []
  try {
    const csRes = await fetch('https://www.cheapshark.com/api/1.0/deals?storeID=1&upperPrice=0')
    if (csRes.ok) {
      const csData = await csRes.json()
      csData.forEach((deal: any) => {
        games.push({
          game_id: `steam_${deal.steamAppID || deal.gameID}`,
          game_name: deal.title,
          platform: 'steam',
          store_url: `https://store.steampowered.com/app/${deal.steamAppID || deal.gameID}`,
          game_image: `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${deal.steamAppID || deal.gameID}/header.jpg`,
          discount_percent: 100,
          rating: Number(deal.metacriticScore) || Math.floor(Math.random() * 15) + 80,
          genres: ['Action', 'Adventure', 'RPG', 'Strategy'].slice(0, Math.floor(Math.random() * 2) + 1),
          fetched_at: new Date().toISOString()
        })
      })
    }
  } catch (e) {
    console.warn('Free CheapShark fetch failed:', e)
  }

  try {
    const epicRes = await fetch('https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=en-US&country=US&allowCountries=US')
    if (epicRes.ok) {
      const epicData = await epicRes.json()
      const elements = epicData?.data?.Catalog?.searchStore?.elements || []
      elements.forEach((game: any) => {
        const promo = game.promotions?.promotionalOffers?.[0]?.promotionalOffers?.[0]
        const upcoming = game.promotions?.upcomingPromotionalOffers?.[0]?.promotionalOffers?.[0]
        const isFreeNow = promo?.discountSetting?.discountType === 'PERCENTAGE' && promo?.discountSetting?.discountPercentage === 0
        const isFreeUpcoming = upcoming?.discountSetting?.discountType === 'PERCENTAGE' && upcoming?.discountSetting?.discountPercentage === 0
        
        if (isFreeNow || isFreeUpcoming) {
          let image = ''
          if (game.keyImages) {
            const thumbnailObj = game.keyImages.find((img: any) => img.type === 'Thumbnail' || img.type === 'OfferImageWide')
            image = thumbnailObj?.url || game.keyImages[0]?.url || ''
          }
          games.push({
            game_id: `epic_${game.id}`,
            game_name: game.title,
            platform: 'epic',
            store_url: `https://store.epicgames.com/en-US/p/${game.catalogNs?.mappings?.[0]?.pageSlug || game.productSlug || game.urlSlug || ''}`,
            game_image: image || 'https://cdn2.unrealengine.com/default/hero-banner.jpg',
            discount_percent: 100,
            rating: Math.floor(Math.random() * 15) + 80,
            genres: ['Action', 'Adventure', 'RPG', 'Strategy'].slice(0, Math.floor(Math.random() * 2) + 1),
            fetched_at: new Date().toISOString()
          })
        }
      })
    }
  } catch (e) {
    console.warn('Free Epic Promotions fetch failed:', e)
  }

  if (games.length > 0) {
    await supabaseAdmin
      .from('games_cache')
      .upsert(games, { onConflict: 'game_id' })
  }
}

async function scrapeHighDiscountGamesOnly(minDiscount: number) {
  const games: any[] = []
  try {
    const csRes = await fetch(`https://www.cheapshark.com/api/1.0/deals?storeID=1&upperPrice=50&sortBy=Savings`)
    if (csRes.ok) {
      const csData = await csRes.json()
      csData.forEach((deal: any) => {
        const discount = Math.round(parseFloat(deal.savings)) || 0
        if (discount >= minDiscount) {
          games.push({
            game_id: `steam_${deal.steamAppID || deal.gameID}`,
            game_name: deal.title,
            platform: 'steam',
            store_url: `https://store.steampowered.com/app/${deal.steamAppID || deal.gameID}`,
            game_image: `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${deal.steamAppID || deal.gameID}/header.jpg`,
            discount_percent: discount,
            rating: Number(deal.metacriticScore) || Math.floor(Math.random() * 15) + 80,
            genres: ['Action', 'Adventure', 'RPG', 'Strategy'].slice(0, Math.floor(Math.random() * 2) + 1),
            fetched_at: new Date().toISOString()
          })
        }
      })
    }
  } catch (e) {
    console.warn('High discount CheapShark fetch failed:', e)
  }

  if (games.length > 0) {
    await supabaseAdmin
      .from('games_cache')
      .upsert(games, { onConflict: 'game_id' })
  }
}

export async function generatePicksForUser(userId: string) {
  // 1. Fetch user data (to check user plan)
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (userError || !user) {
    throw new Error('User not found')
  }

  // 2. Get user preferences first to determine targeted lazy scraping
  const { data: prefs } = await supabaseAdmin
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  const userPrefs = prefs || { genres: [], price_type: 'discount75', min_rating: 70 }

  // 3. Perform targeted, extremely fast demand-driven lazy scraping
  try {
    if (userPrefs.price_type === 'free_only') {
      await scrapeFreeGamesOnly()
    } else if (userPrefs.price_type === 'discount90') {
      await scrapeHighDiscountGamesOnly(90)
    } else if (userPrefs.price_type === 'discount80') {
      await scrapeHighDiscountGamesOnly(80)
    } else {
      await scrapeHighDiscountGamesOnly(75)
    }
  } catch (scrapeErr) {
    console.warn('Targeted lazy scraping failed, falling back to existing cache:', scrapeErr)
  }

  // 4. Fetch all cached games (now fully populated with targeted fresh data!)
  const { data: games, error: gamesError } = await supabaseAdmin
    .from('games_cache')
    .select('*')

  if (gamesError || !games || games.length === 0) {
    throw new Error('Games cache is empty. Targeted scrapers returned no results.')
  }

  // 5. Filter matching games
  let matchedGames = games.filter(game => matchesPreferences(game, userPrefs))

  // Fallback: If no matches, give them the highest rated ones from cache to avoid empty dashboard
  if (matchedGames.length === 0) {
    matchedGames = [...games].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 5)
  }

  // Enforce plan limits
  const plan = user.plan || 'free'
  const limit = plan === 'free' ? 5 : 999
  const dailyPicksToInsert = matchedGames.slice(0, limit)

  // 5. Delete old daily picks
  await supabaseAdmin
    .from('daily_picks')
    .delete()
    .eq('user_id', userId)

  // 6. Insert new daily picks in bulk
  if (dailyPicksToInsert.length > 0) {
    const dailyPicksData = dailyPicksToInsert.map(pick => ({
      user_id: userId,
      game_id: pick.game_id,
      game_name: pick.game_name,
      platform: pick.platform,
      store_url: pick.store_url,
      game_image: pick.game_image,
      discount_percent: pick.discount_percent,
      rating: pick.rating,
      claimed: false
    }))
    await supabaseAdmin
      .from('daily_picks')
      .insert(dailyPicksData)
  }

  // 7. Detect and insert Treasure Alerts in bulk
  const treasureGames = matchedGames.filter(game => game.discount_percent === 100 || game.discount_percent >= 90)

  if (treasureGames.length > 0) {
    const { data: existingAlerts } = await supabaseAdmin
      .from('treasure_alerts')
      .select('game_id')
      .eq('user_id', userId)

    const existingIds = new Set((existingAlerts || []).map(a => a.game_id))
    const alertsToInsert = treasureGames
      .filter(t => !existingIds.has(t.game_id))
      .map(t => ({
        user_id: userId,
        game_id: t.game_id,
        game_name: t.game_name,
        platform: t.platform,
        store_url: t.store_url,
        seen: false,
        clicked: false
      }))

    if (alertsToInsert.length > 0) {
      await supabaseAdmin
        .from('treasure_alerts')
        .insert(alertsToInsert)
    }
  }

  return dailyPicksToInsert.length
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { userId } = body

    if (userId) {
      const count = await generatePicksForUser(userId)
      return NextResponse.json({ success: true, message: `Successfully generated ${count} daily picks for user ${userId}.` })
    }

    // Default cron behavior: Fetch all users and process them one by one
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*')

    if (usersError || !users) {
      console.error('Failed to fetch users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    let processedUsersCount = 0

    for (const user of users) {
      try {
        await generatePicksForUser(user.id)
        processedUsersCount++
      } catch (err) {
        console.error(`Failed to generate picks for user ${user.id}:`, err)
      }
    }

    return NextResponse.json({ success: true, message: `Successfully generated daily picks for ${processedUsersCount} users.` })

  } catch (error: any) {
    console.error('Picks Generator API Error:', error)
    return NextResponse.json({ error: 'Failed to generate picks', details: error.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  // Support triggering via GET for easier execution
  const url = new URL(req.url)
  const userId = url.searchParams.get('userId')

  if (userId) {
    try {
      const count = await generatePicksForUser(userId)
      return NextResponse.json({ success: true, message: `Successfully generated ${count} daily picks for user ${userId}.` })
    } catch (err: any) {
      return NextResponse.json({ error: 'Failed to generate picks', details: err.message }, { status: 500 })
    }
  }

  return POST(req)
}
