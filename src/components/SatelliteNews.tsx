import { useEffect, useState } from 'react';
import { Newspaper, ExternalLink, Clock, AlertTriangle, RefreshCw, Satellite } from 'lucide-react';

interface NewsItem {
  title: string;
  date: string;
  source: string;
  link?: string;
  summary?: string;
}

interface SatelliteNewsProps {
  country: string;
}

// Real news API integration
const NEWS_API_KEY = process.env.NEXT_PUBLIC_NEWS_API_KEY || process.env.NEWSAPI_KEY || 'demo-key';

// Country configurations with language preferences
const COUNTRY_CONFIG: Record<string, { queries: string[]; languages: string[] }> = {
  'north-korea': {
    queries: ['North Korea satellite', 'DPRK satellite launch', 'Kwangmyongsong', 'North Korea space'],
    languages: ['en']
  },
  'iran': {
    queries: ['Iran satellite', 'Iranian satellite launch', 'Noor satellite', 'Fajr satellite', 'Iran space program'],
    languages: ['en']
  },
  'india': {
    queries: ['India satellite', 'ISRO launch', 'Indian satellite', 'Chandrayaan', 'Mangalyaan', 'GSAT', 'INSAT'],
    languages: ['en', 'hi']
  },
  'pakistan': {
    queries: ['Pakistan satellite', 'Pakistani satellite launch', 'PakSat', 'PRSS', 'Pakistan space'],
    languages: ['en']
  }
};

// Fallback mock data when API is unavailable
const FALLBACK_NEWS: Record<string, NewsItem[]> = {
  'north-korea': [
    {
      title: 'North Korea claims successful spy satellite launch',
      date: new Date().toISOString().split('T')[0],
      source: 'NK News',
      link: 'https://www.nknews.org',
      summary: 'Pyongyang announces successful placement of reconnaissance satellite into orbit.'
    },
    {
      title: 'North Korea plans second spy satellite launch',
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      source: 'Reuters',
      link: 'https://www.reuters.com',
      summary: 'Kim Jong Un orders preparation for additional military satellite launches.'
    }
  ],
  'iran': [
    {
      title: 'Iran launches Noor-3 military satellite into orbit',
      date: new Date().toISOString().split('T')[0],
      source: 'Tasnim News',
      link: 'https://www.tasnimnews.com',
      summary: 'IRGC successfully places third Noor satellite into 450km orbit.'
    },
    {
      title: 'Iran announces plans for new satellite constellation',
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      source: 'Press TV',
      link: 'https://www.presstv.ir',
      summary: 'Iranian Space Agency plans constellation of 5 military satellites by 2025.'
    }
  ],
  'india': [
    {
      title: 'ISRO successfully launches GSAT-24 communication satellite',
      date: new Date().toISOString().split('T')[0],
      source: 'The Hindu',
      link: 'https://www.thehindu.com',
      summary: 'GSLV MkIII places GSAT-24 into geostationary orbit for broadband services.'
    },
    {
      title: 'India approves Chandrayaan-4 lunar sample return mission',
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      source: 'ISRO',
      link: 'https://www.isro.gov.in',
      summary: 'Cabinet approves ₹4,250 crore mission to bring lunar samples by 2028.'
    },
    {
      title: 'ISRO to launch Aditya-L2 solar observatory next month',
      date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
      source: 'Times of India',
      link: 'https://timesofindia.indiatimes.com',
      summary: 'India\'s first solar mission to study Sun from L1 Lagrange point.'
    }
  ],
  'pakistan': [
    {
      title: 'Pakistan launches PakSat-MM1 communications satellite',
      date: new Date().toISOString().split('T')[0],
      source: 'Dawn',
      link: 'https://www.dawn.com',
      summary: 'Space and Upper Atmosphere Research Commission successfully launches multi-mission satellite.'
    },
    {
      title: 'Pakistan plans remote sensing satellite constellation',
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      source: 'Express Tribune',
      link: 'https://tribune.com.pk',
      summary: 'SUPARCO announces plans for constellation of 6 Earth observation satellites.'
    }
  ]
};

export default function SatelliteNews({ country }: SatelliteNewsProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    fetchNews();
  }, [country]);

  const fetchNews = async () => {
    setLoading(true);
    
    try {
      const allNews: NewsItem[] = [];
      const config = COUNTRY_CONFIG[country] || { queries: ['satellite launch'], languages: ['en'] };
      
      // Only try API if we have a real key (not demo-key)
      if (NEWS_API_KEY && NEWS_API_KEY !== 'demo-key') {
        try {
          for (const query of config.queries.slice(0, 2)) {
            const langParam = config.languages.length > 0 ? `&language=${config.languages.join(',')}` : '';
            
            const response = await fetch(
              `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt${langParam}&pageSize=5&apiKey=${NEWS_API_KEY}`,
              { method: 'GET' }
            );
            
            if (response.ok) {
              const data = await response.json();
              if (data.articles && data.articles.length > 0) {
                data.articles.forEach((article: any) => {
                  allNews.push({
                    title: article.title,
                    date: article.publishedAt?.split('T')[0] || new Date().toISOString().split('T')[0],
                    source: article.source?.name || 'News Source',
                    link: article.url,
                    summary: article.description || ''
                  });
                });
              }
            } else {
              console.warn('NewsAPI response not OK:', response.status);
            }
          }
        } catch (apiError) {
          console.warn('NewsAPI failed:', apiError);
        }
      } else {
        console.log('No valid NEWS_API_KEY found, using fallback data');
      }
      
      // Use real news if found, otherwise fallback
      if (allNews.length > 0) {
        const uniqueNews = allNews
          .filter((item, index, self) => index === self.findIndex((t) => t.title === item.title))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 10);
        
        setNews(uniqueNews);
        setLastUpdated(new Date().toLocaleString());
      } else {
        // Use fallback data
        console.log('Using fallback news data for', country);
        const fallback = FALLBACK_NEWS[country] || [];
        setNews(fallback);
        setLastUpdated('Using demo data');
      }
    } catch (err) {
      console.error('Error fetching news:', err);
      // Always use fallback on error
      const fallback = FALLBACK_NEWS[country] || [];
      setNews(fallback);
      setLastUpdated('Using demo data');
    } finally {
      setLoading(false);
    }
  };

  const countryNames: Record<string, string> = {
    'north-korea': 'North Korea',
    'iran': 'Iran',
    'india': 'India',
    'pakistan': 'Pakistan'
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Satellite className="h-5 w-5 text-purple-400" />
          <h2 className="text-lg font-semibold">Satellite News</h2>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent mx-auto" />
            <p className="text-sm text-white/40">Fetching satellite news...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Satellite className="h-5 w-5 text-purple-400" />
          <h2 className="text-lg font-semibold">Satellite News</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40">{countryNames[country] || country}</span>
          <button 
            onClick={fetchNews}
            className="p-1 rounded hover:bg-white/10 transition-colors"
            title="Refresh news"
          >
            <RefreshCw className="h-4 w-4 text-white/40" />
          </button>
        </div>
      </div>

      {lastUpdated && (
        <p className="text-xs text-white/30 mb-3">Last updated: {lastUpdated}</p>
      )}

      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {news.map((item, index) => (
          <div 
            key={index} 
            className="rounded-lg bg-white/5 p-3 hover:bg-white/10 transition-colors cursor-pointer border border-white/5"
            onClick={() => item.link && window.open(item.link, '_blank')}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white/90 mb-1 line-clamp-2">
                  {item.title}
                </h3>
                {item.summary && (
                  <p className="text-xs text-white/50 mb-2 line-clamp-2">
                    {item.summary}
                  </p>
                )}
                <div className="flex items-center gap-3 text-xs text-white/40">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {item.date}
                  </span>
                  <span className="bg-white/10 px-2 py-0.5 rounded">{item.source}</span>
                </div>
              </div>
              {item.link && (
                <ExternalLink className="h-4 w-4 text-white/30 ml-2 flex-shrink-0 mt-1" />
              )}
            </div>
          </div>
        ))}
      </div>

      {news.length === 0 && (
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-white/20 mx-auto mb-2" />
            <p className="text-sm text-white/40">No recent satellite news available</p>
          </div>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-white/5">
        <p className="text-xs text-white/30 text-center">
          Satellite news and launch updates. Click refresh for latest updates.
        </p>
      </div>
    </div>
  );
}
