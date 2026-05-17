import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 })
    }

    // Fetch picks
    const { data: picks, error } = await supabaseAdmin
      .from('daily_picks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching picks:', error)
      return NextResponse.json({ error: 'Failed to fetch daily picks' }, { status: 500 })
    }

    return NextResponse.json({ picks: picks || [] })

  } catch (error: any) {
    console.error('Daily Picks API Error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
