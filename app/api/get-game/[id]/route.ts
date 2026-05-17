import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 })
    }

    // 1. Fetch user to check support plan
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('plan, is_golden_supporter')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      console.error('Error fetching user profile:', userError)
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // 2. Find game store URL
    let storeUrl = 'https://store.steampowered.com'

    // Try finding in daily_picks
    const { data: pick } = await supabaseAdmin
      .from('daily_picks')
      .select('store_url')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle()

    if (pick?.store_url) {
      storeUrl = pick.store_url
    } else {
      // Try finding in games_cache
      const { data: cacheItem } = await supabaseAdmin
        .from('games_cache')
        .select('store_url')
        .eq('game_id', id)
        .maybeSingle()

      if (cacheItem?.store_url) {
        storeUrl = cacheItem.store_url
      } else {
        // Try treasure alerts
        const { data: alertItem } = await supabaseAdmin
          .from('treasure_alerts')
          .select('store_url')
          .eq('id', id)
          .eq('user_id', userId)
          .maybeSingle()

        if (alertItem?.store_url) {
          storeUrl = alertItem.store_url
        }
      }
    }

    // 3. Ad checking rule
    // needsAd = true ONLY for free tier users who are NOT golden supporters
    const isFree = user.plan === 'free'
    const isGolden = user.is_golden_supporter === true
    const needsAd = isFree && !isGolden

    return NextResponse.json({ needsAd, url: storeUrl })

  } catch (error: any) {
    console.error('Get Game Link API Error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
