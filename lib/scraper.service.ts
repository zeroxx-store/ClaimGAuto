import axios from 'axios'

export interface ScrapedGame {
  game_id: string
  game_name: string
  platform: 'steam' | 'epic'
  store_url: string
  game_image: string
  discount_percent: number
  rating: number
  genres: string[]
  original_price: string
  sale_price: string
}

const EPIC_GENRE_MAP: Record<string, string> = {
  action: 'Action',
  adventure: 'Adventure',
  rpg: 'RPG',
  strategy: 'Strategy',
  shooter: 'Shooter',
  puzzle: 'Puzzle',
  sports: 'Sports',
  racing: 'Racing',
  horror: 'Horror',
  'open world': 'Adventure',
  'role playing': 'RPG',
  simulation: 'Strategy',
  fighting: 'Action',
  'battle royale': 'Shooter',
  mmo: 'RPG',
  indie: 'Adventure',
  arcade: 'Action',
  casual: 'Puzzle',
  platformer: 'Action',
  stealth: 'Action',
  survival: 'Action',
  sandbox: 'Action',
  'first-person': 'Shooter',
  'third-person': 'Action',
}

class ScraperService {
  private genreCache = new Map<string, string[]>()

  private async fetchSteamGenres(appId: string): Promise<string[]> {
    if (this.genreCache.has(appId)) return this.genreCache.get(appId)!

    try {
      const res = await axios.get(
        `https://store.steampowered.com/api/appdetails?appids=${appId}`,
        { timeout: 5000 }
      )
      const data = res.data?.[appId]
      if (data?.success && data.data?.genres) {
        const genres = data.data.genres.map((g: any) => g.description)
        this.genreCache.set(appId, genres)
        return genres
      }
    } catch {
      // silently fail — genre stays empty
    }

    this.genreCache.set(appId, [])
    return []
  }

  private async scrapeCheapShark(storeID: number, platform: 'steam' | 'epic'): Promise<ScrapedGame[]> {
    const games: ScrapedGame[] = []
    let page = 0
    const maxPages = 20 // Safety limit to avoid infinite loops

    while (page < maxPages) {
      try {
        const res = await axios.get('https://www.cheapshark.com/api/1.0/deals', {
          params: {
            storeID,
            sortBy: 'Savings',
            pageNumber: page,
            pageSize: 60
          },
          timeout: 10000
        })

        if (!res.data || res.data.length === 0) {
          break // No more deals
        }

        let minSavingsOnPage = 100
        let hasSavingsBelow25 = false

        for (const deal of res.data) {
          const savings = parseFloat(deal.savings) || 0
          minSavingsOnPage = Math.min(minSavingsOnPage, savings)

          if (savings < 25) {
            hasSavingsBelow25 = true
            continue // Skip deals with less than 25% discount
          }

          const appId = String(deal.steamAppID || deal.gameID)
          if (!appId || appId === 'undefined') continue

          const isFree = parseFloat(deal.salePrice) === 0
          const discount = isFree ? 100 : Math.round(savings)

          games.push({
            game_id: `${platform}_${deal.gameID}`,
            game_name: deal.title,
            platform,
            store_url: platform === 'steam'
              ? `https://store.steampowered.com/app/${deal.steamAppID || appId}`
              : `https://www.cheapshark.com/redirect?dealID=${deal.dealID}`,
            game_image: deal.thumb || `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`,
            discount_percent: discount,
            rating: Number(deal.metacriticScore) || 0,
            genres: [],
            original_price: `$${deal.normalPrice}`,
            sale_price: isFree ? 'Free' : `$${deal.salePrice}`
          })
        }

        // If we hit any savings below 25%, or the page minimum is below 25%, we can stop paginating
        if (hasSavingsBelow25 || minSavingsOnPage < 25) {
          break
        }

        page++
      } catch (err) {
        console.error(`CheapShark page ${page} fetch failed for store ${storeID}:`, err)
        break // Stop on error to avoid infinite loop on failures
      }
    }

    return games
  }

  async scrapeSteam(): Promise<ScrapedGame[]> {
    try {
      const games = await this.scrapeCheapShark(1, 'steam')
      
      // Fetch genres for the top 50 unique games to avoid Steam rate limits
      const uniqueIds = [...new Set(games.map(g => g.game_id.replace('steam_', '')))]
      const genreBatch = uniqueIds.slice(0, 50)

      for (let i = 0; i < genreBatch.length; i += 5) {
        const batch = genreBatch.slice(i, i + 5)
        await Promise.all(batch.map(id => this.fetchSteamGenres(id)))
      }

      // Assign genres to all games
      for (const game of games) {
        const appId = game.game_id.replace('steam_', '')
        game.genres = this.genreCache.get(appId) ?? []
      }

      return games
    } catch (err) {
      console.error('Steam scrape failed:', err)
      return []
    }
  }

  async scrapeEpic(): Promise<ScrapedGame[]> {
    const promoGames: ScrapedGame[] = []

    // 1. Fetch 100% free games from Epic promotions API
    try {
      const res = await axios.get(
        'https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=en-US&country=US&allowCountries=US',
        { timeout: 10000 }
      )

      const elements: any[] = res.data?.data?.Catalog?.searchStore?.elements || []

      for (const game of elements) {
        const promo = game.promotions?.promotionalOffers?.[0]?.promotionalOffers?.[0]
        const upcoming = game.promotions?.upcomingPromotionalOffers?.[0]?.promotionalOffers?.[0]
        const isFreeNow =
          promo?.discountSetting?.discountType === 'PERCENTAGE' &&
          promo?.discountSetting?.discountPercentage === 0
        const isFreeUpcoming =
          upcoming?.discountSetting?.discountType === 'PERCENTAGE' &&
          upcoming?.discountSetting?.discountPercentage === 0

        if (!isFreeNow && !isFreeUpcoming) continue

        const slug =
          game.catalogNs?.mappings?.[0]?.pageSlug ||
          game.productSlug ||
          game.urlSlug ||
          ''
        if (!slug) continue

        let image = ''
        if (game.keyImages) {
          const thumb = game.keyImages.find(
            (img: any) => img.type === 'Thumbnail' || img.type === 'OfferImageWide'
          )
          image = thumb?.url || game.keyImages[0]?.url || ''
        }

        const rawTags = game.tags?.map((t: any) => t.name) || []
        const rawCategories = game.categories?.map((c: any) => c.name) || []
        const genreSources = [...rawTags, ...rawCategories]

        const matchedGenres = new Set<string>()
        for (const source of genreSources) {
          const mapped = EPIC_GENRE_MAP[source.toLowerCase().trim()]
          if (mapped) matchedGenres.add(mapped)
        }

        promoGames.push({
          game_id: `epic_promo_${game.id}`,
          game_name: game.title,
          platform: 'epic',
          store_url: `https://store.epicgames.com/en-US/p/${slug}`,
          game_image: image || 'https://cdn2.unrealengine.com/default/hero-banner.jpg',
          discount_percent: 100,
          rating: 0,
          genres: [...matchedGenres],
          original_price: '',
          sale_price: 'Free',
        })
      }
    } catch (err) {
      console.warn('Epic freeGamesPromotions API failed:', err)
    }

    // 2. Fetch discounted Epic Games from CheapShark
    let epicDeals: ScrapedGame[] = []
    try {
      epicDeals = await this.scrapeCheapShark(25, 'epic')
    } catch (err) {
      console.warn('CheapShark Epic deals fetch failed:', err)
    }

    // 3. Combine both and deduplicate by game name (case-insensitive)
    const combinedGames: ScrapedGame[] = []
    const seenNames = new Set<string>()

    // Prioritize official Promotions API free games (higher quality metadata)
    for (const game of promoGames) {
      const normName = game.game_name.toLowerCase().trim()
      if (!seenNames.has(normName)) {
        seenNames.add(normName)
        combinedGames.push(game)
      }
    }

    // Add CheapShark Epic deals
    for (const game of epicDeals) {
      const normName = game.game_name.toLowerCase().trim()
      if (!seenNames.has(normName)) {
        seenNames.add(normName)
        combinedGames.push(game)
      }
    }

    // Fallback to FreeToGame API only if absolutely no games were found from primary sources
    if (combinedGames.length === 0) {
      try {
        const res = await axios.get('https://www.freetogame.com/api/games?platform=pc', {
          timeout: 8000,
        })
        if (res.data?.length) {
          for (const g of res.data.slice(0, 15)) {
            const normName = g.title.toLowerCase().trim()
            if (!seenNames.has(normName)) {
              seenNames.add(normName)
              combinedGames.push({
                game_id: `epic_free_${g.id}`,
                game_name: g.title,
                platform: 'epic',
                store_url: g.game_url || 'https://store.epicgames.com/',
                game_image: g.thumbnail || 'https://cdn2.unrealengine.com/default/hero-banner.jpg',
                discount_percent: 100,
                rating: 0,
                genres: g.genre ? [g.genre] : [],
                original_price: '',
                sale_price: 'Free',
              })
            }
          }
        }
      } catch (err) {
        console.warn('FreeToGame API failed:', err)
      }
    }

    return combinedGames
  }
}

export const scraperService = new ScraperService()
