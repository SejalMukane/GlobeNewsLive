# GlobeNewsLive - Feature Documentation
## Comprehensive Feature List (Updated May 2026)

---

## Table of Contents
1. [Core Missile Dashboard](#1-core-missile-dashboard)
2. [Satellite Intelligence](#2-satellite-intelligence)
3. [AI Analysis Layer](#3-ai-analysis-layer)
4. [Real-Time Alerts](#4-real-time-alerts)
5. [Predictive Analytics](#5-predictive-analytics)
6. [News Integration](#6-news-integration)
7. [Data Monitoring](#7-data-monitoring)
8. [Blockchain Verification](#8-blockchain-verification)
9. [Telegram Notifications](#9-telegram-notifications)
10. [Multi-Country Support](#10-multi-country-support)
11. [Personalized Dashboard](#11-personalized-dashboard)
12. [Crisis Timeline Replay](#12-crisis-timeline-replay)
13. [UI/UX Features](#13-uiux-features)
14. [API Endpoints](#14-api-endpoints)
15. [Environment Variables](#15-environment-variables)
16. [File Structure](#16-file-structure)
17. [Future Enhancements](#17-future-enhancements)
18. [Technical Specifications](#18-technical-specifications)
19. [Maintenance](#19-maintenance)

---

## 1. Core Missile Dashboard

### 1.1 3D Missile Globe Visualization
- **Technology**: Cesium.js + Three.js
- **Features**:
  - Realistic Earth with terrain and atmosphere
  - Missile trajectory paths with glow effects
  - Launch site markers
  - Facility locations
  - Interactive rotation and zoom
  - Country-specific color coding
- **Countries Supported**: North Korea, Iran, India, Pakistan
- **Data Source**: NTI (Nuclear Threat Initiative) database

### 1.2 Missile Test Statistics
- **Total Tests Counter**: Overall test count per country
- **Success Rate**: Percentage of successful launches
- **Tests This Year**: Current year test count
- **Last Test Date**: Most recent test date

### 1.3 Charts & Analytics
- **Timeline Chart**: Tests by year with success/failure breakdown
- **Monthly Activity**: Tests by month (last 12 months)
- **Outcome Breakdown**: Pie chart of success/failure/unknown
- **Missile Type Analysis**: Bar chart by missile type
- **Range Analysis**: Missile range distribution

### 1.4 Recent Tests Table
- Sortable table with:
  - Date, Missile Name, Facility, Outcome
  - Distance and Apogee (when available)
  - Filter by missile type
  - Status badges (success/failure/unknown)

### 1.5 Facility Analysis
- Top facilities by test count
- Facility locations on globe
- Test distribution by facility

---

## 2. Satellite Intelligence

### 2.1 3D Satellite Orbit Visualization
- **Technology**: Pure HTML5 Canvas (no external dependencies)
- **Features**:
  - Realistic Earth globe
  - Satellite orbit paths (circular)
  - Animated satellites moving along orbits
  - Country-specific colors
  - Launch site markers
  - Starfield background
  - Interactive controls (drag, zoom)

### 2.2 Satellite Inventory
- **Total Launches**: Count of all satellite launches
- **Active Satellites**: Currently operational
- **Decayed Satellites**: No longer active
- **First Launch**: Date of first satellite launch
- **Latest Launch**: Most recent launch

### 2.3 Satellite Details
- Name, Launch Date, Decay Date (if applicable)
- Catalog Number (NORAD ID)
- Mission Type Classification:
  - Spy/Reconnaissance
  - Communications
  - Earth Observation
  - Lunar/Mars Missions
- TLE Data (Two-Line Element)
- Real-time position tracking (when API available)

### 2.4 Country-Specific Satellite Data
- **North Korea**: Kwangmyongsong 1-4
- **Iran**: Omid, Rasad, Navid, Fajr, Noor 1-3
- **India**: Aryabhata, Bhaskara, Rohini, IRS, Chandrayaan, Mangalyaan, Cartosat, RISAT, GSAT, INSAT
- **Pakistan**: Badr, PakTES, PRSS, PakSat

---

## 3. AI Analysis Layer

### 3.1 Groq AI Integration
- **Model**: llama-3.3-70b-versatile
- **API Keys**: 5-key rotation system (GROQ_API_KEY_1 through _5)
- **Features**:
  - Automatic failover on rate limits
  - Structured JSON output
  - Cost-effective processing

### 3.2 AI Analysis Features
- **Escalation Probability**: Likelihood of conflict escalation
- **Root Cause Analysis**: Underlying causes of events
- **Stakeholder Identification**: Key actors involved
- **Causal Chain**: Event sequence analysis
- **Market Impact**: Economic implications

### 3.3 Batch Processing
- Sequential event processing
- Context-aware analysis
- Keyword-based fallback when API fails

### 3.4 OSINT Feed Integration
- Real-time event aggregation
- AI analysis of each event
- Critical event filtering
- Telegram notifications for CRITICAL events

---

## 4. Real-Time Alerts

### 4.1 Alert Types
- **New Test Detection**: Automatic detection of new missile tests
- **Success Rate Drop**: Alert when success rate falls below threshold
- **Weekly Reports**: Summary of weekly activity

### 4.2 Alert Configuration
- Enable/disable specific alert types
- Severity levels: Critical, Warning, Info
- Customizable thresholds

### 4.3 Alert Dashboard
- Real-time alert monitoring (30s refresh)
- Alert statistics cards
- Acknowledge functionality
- Alert history

### 4.4 Telegram Integration
- Instant notifications for CRITICAL events
- Severity-based emoji icons
- Plain text format (no MarkdownV2 issues)
- Configurable chat ID and bot token

---

## 5. Predictive Analytics

### 5.1 Trend Analysis
- Linear regression for trend direction
- Confidence intervals
- R² value calculation
- Historical pattern matching

### 5.2 Forecasting
- 6-month forecast with confidence intervals
- Test frequency prediction
- Seasonal pattern detection
- Spike and cyclical pattern identification

### 5.3 Missile Type Analysis
- Success rate by missile type
- Range analysis
- Development timeline
- Capability assessment

### 5.4 Dashboard Integration
- Integrated into main dashboard (not separate page)
- 3 summary cards + mini chart
- Real-time updates

---

## 6. News Integration

### 6.1 Missile News
- **Sources**: NewsAPI, GDELT (with fallback)
- **Content**: Missile-related news per country
- **Language Support**:
  - English for all countries
  - Hindi for India
- **Features**:
  - Real-time fetching
  - Article summaries
  - Source attribution
  - Direct links to articles
  - Refresh functionality

### 6.2 Satellite News
- **Content**: Satellite launch and space program news
- **Country-specific**: Tailored queries per nation
- **Fallback Data**: Demo news when API unavailable

### 6.3 News Display
- Card-based layout
- Hover effects
- External link icons
- Date and source display
- Scrollable list

---

## 7. Data Monitoring

### 7.1 Data Update Monitor
- **Sources**: NTI database, Celestrak
- **Frequency**: Every 6 hours (configurable)
- **Features**:
  - Last update timestamp
  - Next update countdown
  - Manual refresh button
  - Status indicators (green/yellow/red)

### 7.2 Cron Job Configuration
- Windows Task Scheduler integration
- 6-hour sync for agency-agents repo
- Automatic data refresh

### 7.3 Source Monitoring
- NTI website monitoring
- Excel file change detection
- Alert when sources update

---

## 8. Blockchain Verification

### 8.1 XDC Network Integration
- **Network**: XDC Apothem Testnet
- **Contract**: 0x3626E0e08f010D9AB62A2956CE0dc96cc581d365
- **Features**:
  - Event hashing
  - Immutable record storage
  - Transaction verification
  - Block explorer links

### 8.2 Verification Process
- Event data hashing
- Smart contract interaction
- Transaction receipt storage
- Public verification

---

## 9. Telegram Notifications

### 9.1 Bot Configuration
- **Bot Token**: Configurable via .env
- **Chat ID**: Configurable via .env
- **Test Endpoint**: `/api/test-telegram`

### 9.2 Notification Types
- CRITICAL event alerts
- Weekly summaries
- New test notifications
- System status updates

### 9.3 Message Format
- Plain text (no MarkdownV2)
- Emoji indicators
- Structured information
- Direct links

---

## 10. Multi-Country Support

### 10.1 Supported Countries
| Country | Color Code | Data File |
|---------|-----------|-----------|
| North Korea | Red (#ef4444) | `/missile-viz/data/` |
| Iran | Orange (#f97316) | `/missile-viz/iran/data/` |
| India | Blue (#3b82f6) | `/missile-viz/india/data/` |
| Pakistan | Green (#22c55e) | `/missile-viz/pakistan/data/` |

### 10.2 Country Detection
- URL path-based detection
- Query parameter support
- Dynamic data loading
- Automatic color assignment

### 10.3 Data Normalization
- Consistent data format across countries
- Unified missile type classification
- Standardized facility coordinates
- Normalized test outcomes

---

## 11. Personalized Dashboard

### 11.1 User Preference System
- **Storage**: localStorage persistence with auto-save
- **Default Preferences**: Sensible defaults for new users
- **CRUD Operations**: Full create, read, update, delete for all preferences
- **Region Management**: Add/remove monitored regions
- **Interest Toggle**: Select/deselect signal categories
- **Risk Priority**: economy | security | travel | all
- **Notification Settings**: Severity filters, sound alerts, desktop notifications
- **Risk Threshold**: Adjustable slider (0-100)
- **Event Pinning**: Star/unstar important events
- **Reset to Defaults**: One-click reset functionality

### 11.2 Filtering & Scoring
- **Multi-criteria Filtering**: Region + interest + severity + time
- **Signal Risk Score**: Per-signal risk calculation (0-100)
- **Relevance Score**: Personalized relevance based on preferences
- **High-Risk Alerts**: Threshold-based filtering (e.g., show only >70)
- **Category Grouping**: Group signals by interest category
- **User Risk Score**: Overall aggregated risk percentage
- **Market Filtering**: Filter markets by priority type

### 11.3 UI Components

#### PersonalizedDashboard
- 👁️ Dashboard title with user name
- 📊 Overall risk score with color coding
- 📍 My Regions section (selected regions)
- ⚠️ High-Risk Alerts (above threshold)
- ⭐ Pinned Events section
- 📈 My Interests (grouped by category)
- ⚙️ Settings button
- Loading and empty states
- Real-time data fetching with SWR

#### PreferencesModal (4 Tabs)
- 📍 **Regions Tab**: Multi-select region picker with checkboxes
- 🎯 **Interests Tab**: Category selector (conflict, cyber, markets, etc.)
- 🔥 **Priorities Tab**: Risk priority selector + threshold slider (0-100)
- 🔔 **Notifications Tab**: Severity filter + sound/desktop toggles
- Save/Cancel buttons with reset option

### 11.4 Integration
- **View Mode**: 'personalized' alongside 'dashboard' and 'war-room'
- **Header Button**: "👁️ MY DASHBOARD" in main navigation
- **Mode Toggle**: Switch between Dashboard / My Dashboard / War Room
- **Breadcrumb Support**: Full navigation integration
- **Mobile-Aware**: Responsive layout for all devices

### 11.5 Performance
- **Initial Load**: < 100ms
- **Preference Save**: < 10ms (localStorage)
- **Signal Filtering**: < 50ms (1000 signals)
- **Risk Recalculation**: < 100ms
- **SWR Refresh**: Configurable intervals

---

## 12. Crisis Timeline Replay

### 12.1 Timeline Event Model
```typescript
interface TimelineEvent {
  id: string;
  timestamp: Date;
  title: string;
  description?: string;
  category: SignalCategory;
  severity: Severity;
  region: string;
  impact?: string;
  source: string;
  tags: string[]; // 'oil', 'shipping', 'market', etc.
}
```

### 12.2 Core Features
- **Chronological Replay**: Watch events unfold in real-time
- **Playback Controls**: Play/pause/skip with speed adjustment (0.5x, 1x, 2x, 4x)
- **Timeline Scrubber**: Visual progress bar with gradient
- **Current Event Display**: Severity-colored badge with description and tags
- **Events List**: Scrollable grid with click-to-select
- **Key Moments**: Auto-detection of event clusters (high-impact sequences)

### 12.3 Event Linking Algorithm
1. **Semantic Tag Extraction**: Extract keywords from signal content
   - Predefined tags: oil, shipping, market, military, politics, infrastructure, cyber, humanitarian, sanctions, nuclear
   - Auto-extraction from title + summary
2. **Related Events Discovery**: Find events within 48-hour window
   - Tag overlap matching
   - Region matching
   - Category relationship checking
3. **Relationship Types**:
   - 🔴 **trigger_source**: Previous event that caused this
   - 🟢 **caused_by**: This event triggered subsequent events
   - 🔵 **correlated**: Events happening around same time with relation
4. **Confidence Scoring**: Based on shared tags, time proximity, semantic similarity

### 12.4 Event Causal Graph
- **Graph Structure**: Nodes (events) + Edges (relationships)
- **Cause-Effect Chains**: Build chains of related events
- **Impact Assessment**: Calculate downstream effects
- **Visual Representation**: Color-coded by relationship type

### 12.5 Event Clustering
- **Temporal Grouping**: Group events within configurable time window (default: 1 hour)
- **Cluster Detection**: Single-pass O(n) algorithm
- **Key Moment Identification**: Highlight when multiple events cluster together
- **Cluster Statistics**: Event count, severity breakdown, time span

### 12.6 Playback Schedule
- **Duration**: Configurable (default: 100 seconds)
- **Event Distribution**: Linear spacing between events
- **Speed Control**: 0.5x (slow), 1x (normal), 2x (fast), 4x (very fast)
- **Auto-play**: Optional automatic playback on load

### 12.7 UI Components

#### TimelineReplay
- **Header**: Crisis name, event count, region
- **Controls**: Play/Pause/Skip buttons, speed selector, event counter
- **Progress Bar**: Visual timeline with current position
- **Current Event**: Severity badge, description, tags, timestamp
- **Events Grid**: Clickable event cards with severity colors
- **Key Moments**: 4-up grid of detected clusters

#### EventLinker
- **Examining Section**: Selected event details
- **What Triggered This**: Red section showing causes
- **What This Triggered**: Green section showing effects
- **Related Events**: Cyan section showing correlations
- **Linked Event Cards**: Title, timestamp, impact, time delta

#### CrisisTimelineView
- **Region Selector**: Middle East, Ukraine, East Asia, Global, etc.
- **Time Range**: 24h, 7d, 30d buttons
- **Two-Column Layout**: Timeline (left) + Event Linker (right)
- **Statistics Panel**: Event count, critical events, duration, avg severity
- **Usage Tips**: How-to guide section

### 12.8 API Functions
| Function | Purpose |
|----------|---------|
| `createTimelineFromSignals()` | Convert signals to timeline |
| `extractTags()` | Semantic tagging for linking |
| `getLinkedEvents()` | Find related events |
| `buildEventCausalGraph()` | Build cause-effect chains |
| `detectEventClusters()` | Find key moments |
| `calculatePlaybackSchedule()` | Distribute events across playback |

---

## 13. UI/UX Features

### 11.1 Dashboard Layout
- **Grid System**: 12-column responsive grid
- **Glass Morphism**: Backdrop blur effects
- **Dark Theme**: Optimized for monitoring
- **Full-Width**: Maximum space utilization

### 11.2 Navigation
- **Sidebar**: Collapsible country selector
- **Header**: Sticky with action buttons
- **Buttons**:
  - 🛰️ Satellite Dashboard link
  - 🚨 Alerts page link
  - Country selector

### 11.3 Interactive Elements
- Drag-to-rotate globe
- Scroll-to-zoom
- Hover tooltips
- Click-to-expand cards
- Refresh buttons

### 11.4 Responsive Design
- Mobile-friendly layout
- Adaptive charts
- Touch-friendly controls
- Optimized for all screen sizes

---

## 14. API Endpoints

### 12.1 Core APIs
| Endpoint | Purpose |
|----------|---------|
| `/api/osint-feed` | OSINT data aggregation |
| `/api/predictions` | Predictive analytics |
| `/api/alerts` | Alert management |
| `/api/data-updates` | Data source monitoring |
| `/api/test-telegram` | Telegram bot testing |
| `/api/missile-viz` | Missile visualization data |
| `/api/missiles` | Missile database |
| `/api/verify-event` | Blockchain verification |

### 12.2 External APIs
| Service | Usage |
|---------|-------|
| NewsAPI | Real-time news |
| GDELT | Global events |
| Celestrak | Satellite TLE data |
| Groq | AI analysis |
| XDC | Blockchain |

---

## 15. Environment Variables

### 13.1 Required Keys
```
# AI Analysis
GROQ_API_KEY_1 through GROQ_API_KEY_5

# News
NEWSAPI_KEY

# Telegram
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID

# Blockchain
CONTRACT_ADDRESS
PRIVATE_KEY
XDC_RPC_URL

# Twitter (optional)
TWITTER_API_KEY
TWITTER_API_SECRET
```

---

## 16. File Structure

### 14.1 Key Components
```
src/components/
├── MultiCountryMissileDashboard.tsx  # Main dashboard
├── SatelliteDashboard.tsx            # Satellite page
├── SatelliteOrbitViz.tsx            # 3D satellite globe
├── MissileNews.tsx                   # Missile news
├── SatelliteNews.tsx                 # Satellite news
├── AlertDashboard.tsx                # Alert center
├── PredictiveAnalyticsDashboard.tsx  # Analytics
├── DataUpdateMonitor.tsx             # Data monitoring
├── OSINTPanel.tsx                    # OSINT display
├── OSINTIntelligencePage.tsx         # Intelligence page
└── NKMissileViz.tsx                  # Missile globe iframe
```

### 14.2 API Routes
```
src/app/api/
├── osint-feed/route.ts              # OSINT aggregation
├── predictions/route.ts             # Predictive analytics
├── alerts/route.ts                  # Alert management
├── data-updates/route.ts            # Data monitoring
├── test-telegram/route.ts           # Telegram testing
└── verify-event/route.ts            # Blockchain verification
```

### 14.3 Data Files
```
public/missile-viz/
├── data/                            # North Korea data
├── iran/data/                       # Iran data
├── india/data/                      # India data
├── pakistan/data/                   # Pakistan data
└── satellite-viz/                   # Satellite visualization
```

---

## 17. Future Enhancements

### 15.1 Planned Features
- Real-time satellite TLE updates
- More news sources integration
- Advanced AI predictions
- Mobile app companion
- Additional countries (China, Russia, USA)
- Historical timeline replay
- 3D facility models
- Real-time flight tracking integration

### 15.2 API Integrations
- Space-Track.org for satellite data
- FlightRadar24 for aircraft tracking
- MarineTraffic for ship tracking
- Additional news aggregators
- Social media monitoring

---

## 18. Technical Specifications

### 16.1 Tech Stack
- **Frontend**: Next.js 16, React, TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **3D**: Cesium.js, Three.js, HTML5 Canvas
- **AI**: Groq API (Llama 3.3 70B)
- **Blockchain**: XDC Network
- **Notifications**: Telegram Bot API

### 16.2 Performance
- **Build Time**: ~10-15 seconds
- **API Response**: <2 seconds
- **Auto-refresh**: Disabled (manual only)
- **Server Startup**: Auto-analysis after 5 seconds

### 16.3 Security
- API key rotation
- Environment variable protection
- No client-side secrets
- Secure Telegram messaging
- Blockchain verification

---

## 19. Maintenance

### 17.1 Regular Tasks
- Update satellite TLE data (weekly)
- Refresh news API keys (monthly)
- Review and update fallback data (quarterly)
- Monitor API rate limits (daily)

### 17.2 Troubleshooting
- Check `.env.local` for API keys
- Verify Telegram bot token
- Test NewsAPI connectivity
- Monitor Groq API usage
- Check blockchain network status

---

**Document Version**: 2.6.0
**Last Updated**: May 4, 2026
**Author**: GlobeNewsLive Development Team

For questions or issues, refer to:
- OpenClaw docs: https://docs.openclaw.ai
- GitHub: https://github.com/openclaw/openclaw
- Community: https://discord.com/invite/clawd
