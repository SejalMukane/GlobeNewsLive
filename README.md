# 🌐 GlobeNewsLive - Missile & Satellite Intelligence Dashboard

**Real-time missile test tracking, satellite intelligence, and AI-powered conflict monitoring. Open source. No login required.**

[![Live Demo](https://img.shields.io/badge/demo-live-green)](https://globe-news-live.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)

![GlobeNewsLive Dashboard](https://globe-news-live.vercel.app/og-image.png)

---

## 🚀 Features

### 🎯 Missile Intelligence
- **🚀 3D Missile Globe** — Interactive Cesium.js + Three.js globe with missile trajectories, launch sites, and facility markers
- **📊 Test Statistics** — Total tests, success rates, tests by year, last test date
- **📈 Charts & Analytics** — Timeline charts, monthly activity, outcome breakdown, missile type analysis, range distribution
- **🏭 Facility Analysis** — Top facilities by test count with locations on globe
- **📋 Recent Tests Table** — Sortable table with date, missile name, facility, outcome, distance, and apogee

### 🛰️ Satellite Intelligence
- **🌍 3D Satellite Orbits** — Pure HTML5 Canvas visualization with animated satellites, orbit paths, and country-specific colors
- **📡 Satellite Inventory** — Total launches, active/decayed satellites, launch dates, catalog numbers
- **🔍 Mission Classification** — Spy/Reconnaissance, Communications, Earth Observation, Lunar/Mars missions
- **📍 Real-time Tracking** — TLE data from Celestrak/NORAD with position tracking

### 🤖 AI Analysis Layer
- **🧠 Groq AI Integration** — `llama-3.3-70b-versatile` with 5-key rotation and automatic failover
- **📊 Escalation Probability** — Likelihood of conflict escalation per event
- **🔍 Root Cause Analysis** — Underlying causes of detected events
- **👥 Stakeholder Identification** — Key actors and entities involved
- **⛓️ Causal Chain Analysis** — Event sequence and relationship mapping
- **💹 Market Impact Assessment** — Economic implications of events

### ⚠️ Real-Time Alerts
- **🔔 Alert Types** — New test detection, success rate drops, weekly summaries
- **📱 Telegram Integration** — Instant CRITICAL event notifications with severity-based emoji
- **🎛️ Alert Dashboard** — Real-time monitoring with acknowledge functionality and alert history
- **⚙️ Configurable Thresholds** — Customizable severity levels and alert rules

### 📈 Predictive Analytics
- **📉 Trend Analysis** — Linear regression with confidence intervals and R² values
- **🔮 6-Month Forecasting** — Test frequency prediction with confidence intervals
- **🔄 Pattern Detection** — Seasonal, cyclical, spike, and anomaly detection
- **🚀 Missile Type Analysis** — Success rates, development timelines, capability assessment

### 📰 News Integration
- **📡 Real-time News** — NewsAPI + GDELT integration with country-specific queries
- **🌐 Language Support** — English for all countries, Hindi for India
- **📑 Article Summaries** — Direct links with source attribution
- **🔄 Refresh Functionality** — Manual refresh with fallback demo data

### 🔗 Blockchain Verification
- **⛓️ XDC Network** — Apothem Testnet integration for immutable event records
- **🔐 Event Hashing** — Cryptographic verification of all detected events
- **🔍 Public Verification** — Block explorer links for transparency

### 👁️ Personalized Dashboard
- **⚙️ User Preferences** — localStorage persistence with auto-save
- **📍 Region Management** — Add/remove monitored regions
- **🎯 Interest Categories** — Select signal categories (conflict, cyber, markets, etc.)
- **🔥 Risk Priorities** — economy | security | travel | all
- **📊 Risk Threshold** — Adjustable slider (0-100)
- **⭐ Event Pinning** — Star/unstar important events
- **🔔 Notification Settings** — Severity filters, sound alerts, desktop notifications

### ⏯️ Crisis Timeline Replay
- **📅 Chronological Replay** — Watch events unfold in real-time
- **⏭️ Playback Controls** — Play/pause/skip with speed adjustment (0.5x, 1x, 2x, 4x)
- **🔗 Event Linking** — Cause-effect chains with confidence scoring
- **📊 Event Clustering** — Key moment detection for high-impact sequences
- **🕐 Time Range Selection** — 24h, 7d, 30d views

### 🗺️ Interactive World Map
- **🌍 3D Globe** — Three.js rotating earth with live conflict pins
- **⚔️ Conflict Zones** — 10 active conflict markers (Ukraine, Gaza, Sudan, etc.)
- **🎖️ Military Bases** — 15 US/NATO bases worldwide
- **⚓ Strategic Chokepoints** — Strait of Hormuz, Suez, Malacca, etc.
- **🌍 Earthquakes** — Live USGS data (M4.5+ past 24h)

### 📊 Market Intelligence
- **📈 Live Markets** — S&P 500, Oil, Gold, EUR/USD, BTC, ETH
- **📊 Trading Charts** — TradingView widget with multiple assets
- **🎯 Prediction Markets** — Polymarket geopolitical contracts with probability bars

### 📡 Tracking
- **✈️ Flight Tracking** — ADS-B Exchange embed (military + civilian)
- **🚢 Ship Tracking** — MarineTraffic embed (Strait of Hormuz focus)
- **🌍 Earthquake Monitor** — USGS live feed with magnitude badges

### 📱 Mobile Responsive
- **📱 4-tab mobile layout** — Feed / Map / Markets / Track
- **🔔 Push-style badges** — Critical count on mobile nav
- **👆 Touch-optimized** — Larger tap targets, swipeable panels

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS |
| 3D Globe | Cesium.js + Three.js |
| Satellite Viz | HTML5 Canvas (no dependencies) |
| Map | MapLibre GL JS + Carto dark tiles |
| Charts | TradingView Widget + Custom Canvas |
| AI | Groq API (llama-3.3-70b-versatile) |
| State | React Hooks + SWR |
| Notifications | Telegram Bot API |
| Blockchain | XDC Network (Apothem Testnet) |
| Hosting | Vercel |

---

## 📦 Installation

### Prerequisites
- Node.js 18+
- npm or yarn

### Quick Start

```bash
# Clone the repository
git clone https://github.com/your-username/globenews-live.git
cd globenews-live

# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3400
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Environment Variables

Create `.env.local`:

```env
# Required for AI Analysis
GROQ_API_KEY_1=your_groq_key_1
GROQ_API_KEY_2=your_groq_key_2
GROQ_API_KEY_3=your_groq_key_3
GROQ_API_KEY_4=your_groq_key_4
GROQ_API_KEY_5=your_groq_key_5

# Required for Telegram Notifications
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# Required for News
NEWSAPI_KEY=your_newsapi_key

# Optional
NASA_FIRMS_KEY=your_nasa_key
```

---

## 📡 API Endpoints

### Core APIs
| Endpoint | Purpose | Method |
|----------|---------|--------|
| `/api/osint-feed` | OSINT data aggregation | GET |
| `/api/predictions` | Predictive analytics | GET |
| `/api/alerts` | Alert management | GET/POST |
| `/api/data-updates` | Data source monitoring | GET/POST |
| `/api/test-telegram` | Telegram bot testing | GET |
| `/api/missile-viz` | Missile visualization data | GET |
| `/api/missiles` | Missile database | GET |
| `/api/verify-event` | Blockchain verification | POST |
| `/api/missile-news` | Missile-related news | GET |
| `/api/satellites` | Satellite data | GET |

### External APIs
| Service | Usage |
|---------|-------|
| NewsAPI | Real-time news |
| GDELT | Global events database |
| Celestrak | Satellite TLE data |
| Groq | AI analysis |
| XDC | Blockchain verification |
| CoinGecko | Crypto prices |
| Polymarket | Prediction markets |
| USGS | Earthquake data |

---

## 📊 Data Sources

| Source | Data | Refresh |
|--------|------|---------|
| NTI Database | Missile tests | Manual |
| Celestrak/NORAD | Satellite TLE | Real-time |
| NewsAPI | News articles | On-demand |
| GDELT | Global events | On-demand |
| Reuters RSS | World news | 60s |
| BBC World RSS | World news | 60s |
| Al Jazeera RSS | World news | 60s |
| Guardian RSS | World news | 60s |
| France24 RSS | World news | 60s |
| DW News RSS | World news | 60s |
| Defense One RSS | Defense news | 60s |
| Breaking Defense RSS | Defense news | 60s |
| CoinGecko API | Crypto prices | 30s |
| Polymarket API | Prediction markets | 60s |
| USGS API | Earthquakes | 120s |

---

## 🎯 Supported Countries

| Country | Color Code | Data Path |
|---------|-----------|-----------|
| North Korea | 🔴 Red (#ef4444) | `/missile-viz/data/` |
| Iran | 🟠 Orange (#f97316) | `/missile-viz/iran/data/` |
| India | 🔵 Blue (#3b82f6) | `/missile-viz/india/data/` |
| Pakistan | 🟢 Green (#22c55e) | `/missile-viz/pakistan/data/` |

---

## 📁 Project Structure

```
globenews-live/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Main dashboard
│   │   ├── layout.tsx                  # Root layout
│   │   ├── globals.css                 # Global styles
│   │   ├── intelligence/               # Missile dashboard
│   │   ├── satellites/                 # Satellite page
│   │   ├── alerts/                     # Alert dashboard
│   │   ├── predictions/                # Predictive analytics
│   │   └── api/
│   │       ├── osint-feed/             # OSINT aggregation
│   │       ├── predictions/            # Analytics engine
│   │       ├── alerts/                 # Alert system
│   │       ├── data-updates/           # Data monitoring
│   │       ├── test-telegram/          # Telegram testing
│   │       ├── missile-viz/            # Visualization data
│   │       ├── missiles/               # Missile database
│   │       ├── verify-event/           # Blockchain verification
│   │       ├── missile-news/           # News aggregation
│   │       └── satellites/             # Satellite data
│   ├── components/
│   │   ├── MultiCountryMissileDashboard.tsx  # Main dashboard
│   │   ├── SatelliteDashboard.tsx      # Satellite page
│   │   ├── AlertDashboard.tsx          # Alert center
│   │   ├── PredictiveAnalyticsDashboard.tsx  # Analytics
│   │   ├── MissileNews.tsx             # News component
│   │   ├── SatelliteNews.tsx           # Satellite news
│   │   ├── SatelliteOrbitViz.tsx       # 3D satellite viz
│   │   ├── OSINTPanel.tsx              # OSINT display
│   │   ├── OSINTIntelligencePage.tsx   # Intelligence page
│   │   ├── PersonalizedDashboard.tsx   # User dashboard
│   │   ├── CrisisTimelineView.tsx      # Timeline replay
│   │   ├── Header.tsx                  # Top navigation
│   │   ├── SignalFeed.tsx              # News feed
│   │   ├── WorldMap.tsx                # MapLibre map
│   │   ├── MarketTicker.tsx            # Market prices
│   │   ├── PredictionPanel.tsx         # Prediction markets
│   │   ├── TrackingPanel.tsx           # Flights/Ships/Quakes
│   │   ├── TradingChart.tsx            # TradingView widget
│   │   ├── MobileNav.tsx               # Mobile navigation
│   │   └── StatsBar.tsx                # Footer stats
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── gemini.ts               # Groq AI service
│   │   │   └── aiProvider.ts           # AI provider interface
│   │   ├── osint/
│   │   │   ├── aggregator.ts           # OSINT aggregation
│   │   │   └── sources.ts              # Data sources
│   │   ├── alerts/
│   │   │   └── alertManager.ts         # Alert management
│   │   ├── notifications/
│   │   │   └── telegram.ts             # Telegram service
│   │   ├── cors.ts                     # CORS utilities
│   │   ├── classify.ts                 # Threat classification
│   │   └── feeds.ts                    # Static data
│   └── types/
│       ├── index.ts                    # TypeScript types
│       └── osint.ts                    # OSINT types
├── public/
│   ├── missile-viz/                    # Missile visualization data
│   │   ├── data/                       # North Korea data
│   │   ├── iran/                       # Iran data
│   │   ├── india/                      # India data
│   │   └── pakistan/                   # Pakistan data
│   └── satellite-viz/                  # Satellite visualization
│       └── index.html                  # Pure Canvas satellite viz
├── package.json
├── tailwind.config.ts
├── next.config.mjs
├── vercel.json
└── README.md
```

---

## 🎨 Customization

### Adding News Sources

Edit `src/app/api/missile-news/route.ts`:

```typescript
const countryQueries = {
  'your-country': 'your query here',
};
```

### Adding Map Layers

Edit `src/lib/feeds.ts` to add:
- Military bases
- Conflict zones
- Strategic chokepoints

### Changing Threat Keywords

Edit `src/lib/classify.ts`:

```typescript
const THREAT_KEYWORDS = {
  CRITICAL: ['nuclear', 'invasion', ...],
  HIGH: ['airstrike', 'missile', ...],
  // ...
};
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) file.

---

## 🙏 Credits

- **Missile Data**: NTI (Nuclear Threat Initiative) Database
- **Satellite Data**: Celestrak / NORAD
- **News Sources**: Reuters, BBC, Al Jazeera, Guardian, France24, DW, Defense One, Breaking Defense
- **Map**: MapLibre GL + Carto dark tiles
- **Charts**: TradingView + Custom Canvas
- **AI**: Groq (llama-3.3-70b-versatile)
- **Markets**: CoinGecko, Polymarket
- **Earthquakes**: USGS
- **Flight Tracking**: ADS-B Exchange
- **Ship Tracking**: MarineTraffic
- **Blockchain**: XDC Network

---

## 🔗 Links

- **Live Demo**: https://globe-news-live.vercel.app
- **Repository**: https://github.com/your-username/globenews-live

---

Built with ❤️ for the OSINT community. Monitor the world. Stay informed.
