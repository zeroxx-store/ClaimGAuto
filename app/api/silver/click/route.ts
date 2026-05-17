import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { userId, adNumber } = await req.json()

    if (!userId || ![1, 2].includes(adNumber)) {
      return NextResponse.json({ error: 'Missing userId or invalid adNumber' }, { status: 400 })
    }

    const todayStr = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    // 1. Fetch today's ad clicks row
    const { data: clickRow } = await supabaseAdmin
      .from('silver_ad_clicks')
      .select('*')
      .eq('user_id', userId)
      .eq('click_date', todayStr)
      .maybeSingle()

    let updatedRow: any = null

    if (!clickRow) {
      // Create new record for today
      const insertData: any = {
        user_id: userId,
        click_date: todayStr,
        ad1_clicked: adNumber === 1,
        ad2_clicked: adNumber === 2
      }

      const { data, error } = await supabaseAdmin
        .from('silver_ad_clicks')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('Error inserting click row:', error)
        return NextResponse.json({ error: 'Failed to record click' }, { status: 500 })
      }
      updatedRow = data
    } else {
      // Update existing record
      const updateData: any = {}
      if (adNumber === 1) updateData.ad1_clicked = true
      if (adNumber === 2) updateData.ad2_clicked = true

      const { data, error } = await supabaseAdmin
        .from('silver_ad_clicks')
        .update(updateData)
        .eq('user_id', userId)
        .eq('click_date', todayStr)
        .select()
        .single()

      if (error) {
        console.error('Error updating click row:', error)
        return NextResponse.json({ error: 'Failed to update click' }, { status: 500 })
      }
      updatedRow = data
    }

    // 2. Check if both ads were clicked
    const isSilverNow = updatedRow.ad1_clicked && updatedRow.ad2_clicked
    let expiresAt: string | null = null

    if (isSilverNow) {
      // Grant Silver Supporter for 24 hours
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      
      const { error: userUpdateError } = await supabaseAdmin
        .from('users')
        .update({
          is_silver_supporter: true,
          silver_expires_at: expiresAt
        })
        .eq('id', userId)

      if (userUpdateError) {
        console.error('Error updating user silver status:', userUpdateError)
        return NextResponse.json({ error: 'Failed to grant silver supporter' }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      ad1: updatedRow.ad1_clicked,
      ad2: updatedRow.ad2_clicked,
      isSilverNow,
      expiresAt
    })

  } catch (error: any) {
    console.error('Silver Click API Error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
