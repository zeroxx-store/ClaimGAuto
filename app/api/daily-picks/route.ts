import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generatePicksForUser } from './generate/route'

const MOCK_PICKS = [
  {
    id: 'mock_pick_1',
    game_id: 'mock_game_1',
    game_name: 'Assassin\'s Creed Mirage',
    platform: 'epic',
    store_url: 'https://store.epicgames.com/',
    game_image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=800',
    discount_percent: 100,
    rating: 88,
    claimed: false
  },
  {
    id: 'mock_pick_2',
    game_id: 'mock_game_2',
    game_name: 'Hades II',
    platform: 'steam',
    store_url: 'https://store.steampowered.com/',
    game_image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800',
    discount_percent: 90,
    rating: 95,
    claimed: false
  },
  {
    id: 'mock_pick_3',
    game_id: 'mock_game_3',
    game_name: 'Grand Theft Auto V',
    platform: 'epic',
    store_url: 'https://store.epicgames.com/',
    game_image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=800',
    discount_percent: 75,
    rating: 91,
    claimed: false
  },
  {
    id: 'mock_pick_4',
    game_id: 'mock_game_4',
    game_name: 'Cyberpunk 2077',
    platform: 'steam',
    store_url: 'https://store.steampowered.com/',
    game_image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800',
    discount_percent: 80,
    rating: 84,
    claimed: false
  },
  {
    id: 'mock_pick_5',
    game_id: 'mock_game_5',
    game_name: 'Witcher 3: Wild Hunt',
    platform: 'steam',
    store_url: 'https://store.steampowered.com/',
    game_image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=800',
    discount_percent: 85,
    rating: 97,
    claimed: false
  }
]

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 })
    }

    // 1. Fetch current picks
    let { data: picks, error } = await supabaseAdmin
      .from('daily_picks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching picks:', error)
      return NextResponse.json({ error: 'Failed to fetch daily picks' }, { status: 500 })
    }

    // 2. If empty, try to trigger generation first
    if (!picks || picks.length === 0) {
      try {
        await generatePicksForUser(userId)
        
        // Re-fetch
        const { data: generatedPicks } = await supabaseAdmin
          .from('daily_picks')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (generatedPicks && generatedPicks.length > 0) {
          picks = generatedPicks
        }
      } catch (genErr) {
        console.warn('On-demand generation failed, will return premium mock picks:', genErr)
      }
    }

    // 3. Fallback: If still empty, return premium mock data to ensure wonderful user experience
    if (!picks || picks.length === 0) {
      return NextResponse.json({ picks: MOCK_PICKS, isMockData: true })
    }

    return NextResponse.json({ picks: picks || [], isMockData: false })

  } catch (error: any) {
    console.error('Daily Picks API Error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
