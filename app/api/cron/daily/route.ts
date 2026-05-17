import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const log: string[] = []
  let success = true

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    log.push(`Cron started at ${new Date().toISOString()}`)
    log.push(`Target Base URL: ${baseUrl}`)

    // 1. Fetch Steam deals into database games_cache
    try {
      log.push('Step 1/4: Scrape Steam Deals...')
      const res = await fetch(`${baseUrl}/api/steam/fetch`)
      const data = await res.json()
      log.push(`Steam Scraper: ${res.ok ? 'SUCCESS' : 'FAILED'} - ${JSON.stringify(data)}`)
    } catch (e: any) {
      log.push(`Steam Scraper: CRASHED - ${e.message}`)
      success = false
    }

    // 2. Fetch Epic promotions into database games_cache
    try {
      log.push('Step 2/4: Scrape Epic Promotions...')
      const res = await fetch(`${baseUrl}/api/epic/fetch`)
      const data = await res.json()
      log.push(`Epic Scraper: ${res.ok ? 'SUCCESS' : 'FAILED'} - ${JSON.stringify(data)}`)
    } catch (e: any) {
      log.push(`Epic Scraper: CRASHED - ${e.message}`)
      success = false
    }

    // 3. Generate daily picks and treasure alerts for all users
    try {
      log.push('Step 3/4: Generate Personalized User Daily Picks...')
      const res = await fetch(`${baseUrl}/api/daily-picks/generate`, { method: 'POST' })
      const data = await res.json()
      log.push(`Daily Picks Generation: ${res.ok ? 'SUCCESS' : 'FAILED'} - ${JSON.stringify(data)}`)
    } catch (e: any) {
      log.push(`Daily Picks Generation: CRASHED - ${e.message}`)
      success = false
    }

    // 4. Send WhatsApp notifications to Ultimate tier subscribers
    try {
      log.push('Step 4/4: Dispatch Daily WhatsApp Alerts...')
      const res = await fetch(`${baseUrl}/api/whatsapp/send`, { method: 'POST' })
      const data = await res.json()
      log.push(`WhatsApp Broadcast: ${res.ok ? 'SUCCESS' : 'FAILED'} - ${JSON.stringify(data)}`)
    } catch (e: any) {
      log.push(`WhatsApp Broadcast: CRASHED - ${e.message}`)
      success = false
    }

    log.push(`Cron completed at ${new Date().toISOString()}`)

    return NextResponse.json({
      success,
      timestamp: new Date().toISOString(),
      logs: log
    })

  } catch (error: any) {
    console.error('Cron Master API Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to orchestrate daily jobs',
      details: error.message,
      logs: log
    }, { status: 500 })
  }
}
export async function POST(req: NextRequest) {
  return GET(req)
}
