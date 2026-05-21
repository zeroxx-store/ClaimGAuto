import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generatePicksForUser } from '@/lib/picks-generator'

export { generatePicksForUser }

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
