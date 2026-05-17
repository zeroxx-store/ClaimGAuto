import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const { data: preferences, error } = await supabaseAdmin
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw error

    return NextResponse.json({ success: true, preferences })
  } catch (error: any) {
    console.error('Fetch user preferences error:', error)
    return NextResponse.json({ error: 'Failed to load preferences', details: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, genres, price_type, min_rating, whatsapp_phone } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const { data: preferences, error } = await supabaseAdmin
      .from('user_preferences')
      .upsert({
        user_id: userId,
        genres: genres || [],
        price_type: price_type || 'discount75',
        min_rating: Number(min_rating) || 70,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) throw error

    if (whatsapp_phone && whatsapp_phone.toLowerCase() !== 'skip') {
      await supabaseAdmin
        .from('users')
        .update({ whatsapp_phone })
        .eq('id', userId)
    }

    return NextResponse.json({ success: true, preferences })
  } catch (error: any) {
    console.error('Update user preferences error:', error)
    return NextResponse.json({ error: 'Failed to update preferences', details: error.message }, { status: 500 })
  }
}
