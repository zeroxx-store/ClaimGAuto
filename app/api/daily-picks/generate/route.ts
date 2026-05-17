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

  // 2. Fetch all cached games
  const { data: games, error: gamesError } = await supabaseAdmin
    .from('games_cache')
    .select('*')

  if (gamesError || !games || games.length === 0) {
    throw new Error('Games cache is empty. Scrapers may not have run yet.')
  }

  // 3. Get user preferences
  const { data: prefs } = await supabaseAdmin
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  const userPrefs = prefs || { genres: [], price_type: 'discount75', min_rating: 70 }

  // 4. Filter matching games
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

  // 6. Insert new daily picks
  for (const pick of dailyPicksToInsert) {
    await supabaseAdmin
      .from('daily_picks')
      .insert({
        user_id: userId,
        game_id: pick.game_id,
        game_name: pick.game_name,
        platform: pick.platform,
        store_url: pick.store_url,
        game_image: pick.game_image,
        discount_percent: pick.discount_percent,
        rating: pick.rating,
        claimed: false
      })
  }

  // 7. Detect and insert Treasure Alerts
  const treasureGames = matchedGames.filter(game => game.discount_percent === 100 || game.discount_percent >= 90)

  for (const treasure of treasureGames) {
    const { data: existingAlert } = await supabaseAdmin
      .from('treasure_alerts')
      .select('*')
      .eq('user_id', userId)
      .eq('game_id', treasure.game_id)
      .maybeSingle()

    if (!existingAlert) {
      await supabaseAdmin
        .from('treasure_alerts')
        .insert({
          user_id: userId,
          game_id: treasure.game_id,
          game_name: treasure.game_name,
          platform: treasure.platform,
          store_url: treasure.store_url,
          seen: false,
          clicked: false
        })
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
