import { supabaseAdmin } from './supabase'

function matchesPreferences(game: any, prefs: any) {
  if (game.discount_percent > 0 && game.discount_percent < 25) return false

  const minRating = prefs.min_rating ?? 70
  if (minRating > 0 && game.rating > 0 && game.rating < minRating) return false

  const priceType = prefs.price_type || 'discount75'
  if (priceType === 'free_only' && game.discount_percent !== 100) return false
  if (priceType === 'discount90' && game.discount_percent < 90) return false
  if (priceType === 'discount80' && game.discount_percent < 80) return false
  if (priceType === 'discount75' && game.discount_percent < 75) return false

  if (prefs.genres && Array.isArray(prefs.genres) && prefs.genres.length > 0) {
    const gameGenres = game.genres || []
    const hasMatchingGenre = gameGenres.some((g: string) =>
      prefs.genres.some((pg: string) => pg.toLowerCase() === g.toLowerCase())
    )
    if (gameGenres.length > 0 && !hasMatchingGenre) return false
  }

  return true
}

export async function generatePicksForUser(userId: string) {
  let { data: user, error: userError }: { data: any; error: any } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (userError || !user) {
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId)

    if (authError || !authUser || !authUser.user) {
      throw new Error('User not found')
    }

    const { data: newUser, error: createError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email: authUser.user.email,
        plan: 'free',
        is_silver_supporter: false,
        is_golden_supporter: false
      })
      .select('*')
      .single()

    if (createError || !newUser) {
      throw new Error(`User not found in database and auto-creation failed: ${createError?.message}`)
    }

    user = newUser
  }

  const { data: prefs } = await supabaseAdmin
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  const userPrefs = prefs || { genres: [], price_type: 'discount75', min_rating: 70 }

  const { data: games, error: gamesError } = await supabaseAdmin
    .from('games_cache')
    .select('*')

  if (gamesError || !games || games.length === 0) {
    throw new Error('Games cache is empty. Run steam/fetch and epic/fetch first.')
  }

  let matchedGames = games.filter(game => matchesPreferences(game, userPrefs))

  const testMode = process.env.TEST_MODE_FREE_AS_ULTIMATE === 'true'
  const effectivePlan = testMode && user.plan === 'free' ? 'ultimate' : (user.plan || 'free')
  const limit = effectivePlan === 'free' ? 5 : 999

  if (matchedGames.length === 0) {
    matchedGames = [...games].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, limit)
  }

  const dailyPicksToInsert = matchedGames.slice(0, limit)

  await supabaseAdmin
    .from('daily_picks')
    .delete()
    .eq('user_id', userId)

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
