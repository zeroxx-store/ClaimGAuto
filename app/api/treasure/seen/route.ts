import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { userId, gameId, seen, clicked } = await req.json()

    if (!userId || !gameId) {
      return NextResponse.json({ error: 'Missing userId or gameId (alert UUID)' }, { status: 400 })
    }

    const updates: any = {}
    if (typeof seen === 'boolean') updates.seen = seen
    if (typeof clicked === 'boolean') updates.clicked = clicked

    const { error } = await supabaseAdmin
      .from('treasure_alerts')
      .update(updates)
      .eq('id', gameId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error updating treasure status:', error)
      return NextResponse.json({ error: 'Failed to update treasure alert' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Treasure Seen API Error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
