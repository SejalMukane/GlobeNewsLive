/**
 * OSINT Sources Integration
 * Connects to real free & trusted data sources
 */

interface OSINTEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  type: string;
  credibility: number;
  sources: string[];
  timestamp: string;
  url?: string;
}

/**
 * NEWS API - Global news aggregation
 * Free tier: 100 requests/day, 1 month archive
 * Register: https://newsapi.org/
 */
export async function fetchNewsAPI(): Promise<OSINTEvent[]> {
  if (!process.env.NEWSAPI_KEY) {
    console.log('⏭️  NewsAPI: key not configured, skipping');
    return [];
  }

  try {
    console.log('📰 NewsAPI: Fetching geopolitical news with key:', process.env.NEWSAPI_KEY.substring(0, 5) + '...');

    // Key crisis keywords for geopolitical events
    const keywords = [
      'military conflict',
      'geopolitical crisis',
      'border tension',
      'sanctions',
      'strategic alliance',
      'nuclear',
      'naval',
    ];

    const events: OSINTEvent[] = [];

    for (const keyword of keywords) {
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(
          keyword
        )}&sortBy=publishedAt&language=en&pageSize=10&apiKey=${process.env.NEWSAPI_KEY}`,
        { signal: AbortSignal.timeout(5000) }
      );

      if (!response.ok) {
        console.warn(`⚠️  NewsAPI error: ${response.status}`);
        continue;
      }

      const data = (await response.json()) as any;

      for (const article of data.articles || []) {
        // Extract location from title/description
        const location = extractLocation(article.title + ' ' + (article.description || ''));

        events.push({
          id: `newsapi-${article.url?.substring(0, 20)}`,
          title: article.title,
          description: article.description || article.content || '',
          location,
          severity: extractSeverity(article.title + ' ' + (article.description || '')),
          type: 'news',
          credibility: getSourceCredibility(article.source.name),
          sources: [article.source.name, 'NewsAPI'],
          timestamp: article.publishedAt,
          url: article.url,
        });
      }
    }

    console.log(`✅ NewsAPI: Found ${events.length} articles`);
    return events;
  } catch (error) {
    console.warn('⚠️  NewsAPI fetch failed:', error);
    return [];
  }
}

/**
 * REDDIT API - Forum discussions & community intelligence
 * Free tier: Unlimited (with rate limits)
 * Register: https://www.reddit.com/prefs/apps
 */
async function fetchRedditAPI(): Promise<OSINTEvent[]> {
  if (!process.env.REDDIT_CLIENT_ID || !process.env.REDDIT_CLIENT_SECRET) {
    console.log('⏭️  Reddit API credentials not configured, skipping');
    return [];
  }

  try {
    console.log('🔴 Reddit: Fetching community discussions...');

    // Get OAuth token
    const authResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': process.env.REDDIT_USER_AGENT || 'GlobeNewsLive/1.0',
        Authorization: `Basic ${Buffer.from(
          `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`
        ).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
      signal: AbortSignal.timeout(5000),
    });

    if (!authResponse.ok) {
      console.warn(`⚠️  Reddit auth failed: ${authResponse.status}`);
      return [];
    }

    const authData = (await authResponse.json()) as any;
    const token = authData.access_token;

    const events: OSINTEvent[] = [];

    // Subreddits focused on geopolitics and crisis
    const subreddits = [
      'geopolitics',
      'worldnews',
      'crisis_intelligence',
      'militarypolitics',
      'economics',
    ];

    for (const subreddit of subreddits) {
      const response = await fetch(`https://oauth.reddit.com/r/${subreddit}/hot?limit=10`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': process.env.REDDIT_USER_AGENT || 'GlobeNewsLive/1.0',
        },
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) continue;

      const data = (await response.json()) as any;

      for (const post of data.data?.children || []) {
        const title = post.data.title;
        const selftext = post.data.selftext;
        const fullText = `${title} ${selftext}`;

        // Only include crisis-related posts
        if (!/crisis|conflict|war|military|nuclear|sanctions|tension/i.test(fullText)) {
          continue;
        }

        events.push({
          id: `reddit-${post.data.id}`,
          title,
          description: selftext.substring(0, 500),
          location: extractLocation(fullText),
          severity: extractSeverity(fullText),
          type: 'forum',
          credibility: Math.min(post.data.score / 100, 100),
          sources: [subreddit, 'Reddit'],
          timestamp: new Date(post.data.created_utc * 1000).toISOString(),
          url: `https://reddit.com${post.data.permalink}`,
        });
      }
    }

    console.log(`✅ Reddit: Found ${events.length} discussions`);
    return events;
  } catch (error) {
    console.warn('⚠️  Reddit fetch failed:', error);
    return [];
  }
}

/**
 * GDELT PROJECT - Global Events Database
 * Free tier: Unlimited, real-time events
 * Website: https://gdeltproject.org/
 */
export async function fetchGDELT(): Promise<OSINTEvent[]> {
  if (process.env.GDELT_ENABLED !== 'true') {
    return [];
  }

  try {
    console.log('🌍 GDELT: Fetching global events...');

    // GDELT API - last 15 minutes of events
    const response = await fetch(
      'https://api.gdeltproject.org/api/v2/doc/doc?query=conflict%20military&mode=TimelineVol&format=json&maxrecords=100&startdatetime=20260420000000',
      { signal: AbortSignal.timeout(8000) }
    );

    if (!response.ok) {
      console.warn(`⚠️  GDELT error: ${response.status}`);
      return [];
    }

    const data = (await response.json()) as any;
    const events: OSINTEvent[] = [];

    for (const article of data.articles || []) {
      events.push({
        id: `gdelt-${article.url?.substring(0, 20)}`,
        title: article.title,
        description: article.snippet || article.url,
        location: extractLocation(article.title),
        severity: extractSeverity(article.title),
        type: 'event',
        credibility: 80, // GDELT is highly reliable
        sources: ['GDELT Project'],
        timestamp: new Date().toISOString(),
        url: article.url,
      });
    }

    console.log(`✅ GDELT: Found ${events.length} events`);
    return events;
  } catch (error) {
    console.warn('⚠️  GDELT fetch failed:', error);
    return [];
  }
}

/**
 * RSS FEEDS - Traditional news sources
 * Free tier: Unlimited
 * No authentication needed
 */
export async function fetchRSSFeeds(): Promise<OSINTEvent[]> {
  const feeds = (process.env.RSS_FEEDS || '').split(',').filter((f) => f.trim());

  if (feeds.length === 0) {
    return [];
  }

  try {
    console.log('📡 RSS Feeds: Fetching from news sources...');

    const events: OSINTEvent[] = [];

    for (const feedUrl of feeds) {
      try {
        const response = await fetch(feedUrl.trim(), { signal: AbortSignal.timeout(5000) });
        if (!response.ok) continue;

        const text = await response.text();

        // Simple XML parsing for RSS feeds
        const titleMatches = text.match(/<title[^>]*>([^<]+)<\/title>/gi) || [];
        const descMatches = text.match(/<description[^>]*>([^<]+)<\/description>/gi) || [];

        for (let i = 0; i < Math.min(titleMatches.length, 5); i++) {
          const title = titleMatches[i]?.replace(/<title[^>]*>|<\/title>/gi, '') || '';
          const desc = descMatches[i]?.replace(/<description[^>]*>|<\/description>/gi, '') || '';

          if (!/crisis|conflict|war|military|nuclear/i.test(title + desc)) {
            continue;
          }

          events.push({
            id: `rss-${feedUrl}-${i}`,
            title: title.substring(0, 100),
            description: desc.substring(0, 300),
            location: extractLocation(title + desc),
            severity: extractSeverity(title + desc),
            type: 'news',
            credibility: 85,
            sources: [new URL(feedUrl).hostname || feedUrl, 'RSS'],
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.warn(`⚠️  RSS fetch failed for ${feedUrl}:`, error);
      }
    }

    console.log(`✅ RSS: Found ${events.length} articles`);
    return events;
  } catch (error) {
    console.warn('⚠️  RSS fetch failed:', error);
    return [];
  }
}

/**
 * Helper: Extract location from text using keywords
 */
function extractLocation(text: string): string {
  const locations: Record<string, string> = {
    'iran|persia|hormuz': 'Iran',
    'israel|palestine|gaza|west bank': 'Middle East',
    'ukraine|kyiv': 'Ukraine',
    'russia|moscow': 'Russia',
    'china|beijing|taiwan': 'Asia-Pacific',
    'north korea': 'North Korea',
    'south korea': 'South Korea',
    'yemen|houthi': 'Yemen',
    'syria|damascus': 'Syria',
    'iraq|baghdad': 'Iraq',
    'saudi|gulf|hormuz|oman': 'Gulf States',
    'us|united states|america|washington': 'United States',
    'eu|europe|nato|brussels': 'Europe',
    'india': 'India',
    'pakistan': 'Pakistan',
  };

  for (const [pattern, location] of Object.entries(locations)) {
    if (new RegExp(pattern, 'i').test(text)) {
      return location;
    }
  }

  return 'Global';
}

/**
 * Helper: Extract severity from text
 */
function extractSeverity(text: string): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
  if (/nuclear|war|military attack|invasion|strike|nuclear/i.test(text)) return 'CRITICAL';
  if (/conflict|crisis|military|naval|deployed|military operation/i.test(text)) return 'HIGH';
  if (/tension|dispute|claim|escalat|alert|incident/i.test(text)) return 'MEDIUM';
  return 'LOW';
}

/**
 * Helper: Get credibility score based on news source
 */
function getSourceCredibility(source: string): number {
  const tierOne = ['reuters', 'bbc', 'bbc news', 'associated press', 'agence france presse'];
  const tierTwo = ['bloomberg', 'cnbc', 'al jazeera', 'the guardian', 'ft', 'economist'];
  const tierThree = ['cnn', 'fox news', 'nbc', 'abc'];

  const lower = source.toLowerCase();
  if (tierOne.some((s) => lower.includes(s))) return 95;
  if (tierTwo.some((s) => lower.includes(s))) return 85;
  if (tierThree.some((s) => lower.includes(s))) return 75;
  return 65;
}

/**
 * AGGREGATE ALL SOURCES
 */
export async function getAllOSINTSources(): Promise<OSINTEvent[]> {
  console.log('🌐 Aggregating from all OSINT sources...');

  const allEvents: OSINTEvent[] = [];

  // Fetch from all sources in parallel (with timeouts)
  const results = await Promise.allSettled([
    fetchNewsAPI(),
    fetchRedditAPI(),
    fetchGDELT(),
    fetchRSSFeeds(),
  ]);

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allEvents.push(...result.value);
    }
  }

  // Deduplicate by title
  const deduped = new Map<string, OSINTEvent>();
  for (const event of allEvents) {
    const key = event.title.toLowerCase().substring(0, 50);
    if (!deduped.has(key) || (deduped.get(key)?.credibility || 0) < event.credibility) {
      deduped.set(key, event);
    }
  }

  console.log(`✅ Total unique events: ${deduped.size}`);
  return Array.from(deduped.values());
}
