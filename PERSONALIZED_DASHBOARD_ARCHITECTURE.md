# Personalized Dashboard - Architecture & Data Flow

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                            │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Page.tsx (Main App)                                    │   │
│  │  - Dashboard View                                       │   │
│  │  - War Room View                                        │   │
│  │  - 👁️ Personalized View (NEW)                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│             │                                │                   │
│             ▼                                ▼                   │
│  ┌──────────────────────┐    ┌──────────────────────────────┐   │
│  │PersonalizedDashboard │    │  PreferencesModal            │   │
│  │   - Risk Display     │    │  - Regions Tab               │   │
│  │   - My Regions       │    │  - Interests Tab             │   │
│  │   - High-Risk Panel  │    │  - Priorities Tab            │   │
│  │   - Pinned Events    │    │  - Notifications Tab         │   │
│  │   - Interests        │    │  - Save/Reset/Cancel         │   │
│  └──────────────────────┘    └──────────────────────────────┘   │
│             │                                │                   │
└─────────────────────────────────────────────────────────────────┘
              │                                │
              │ Uses                          │ Uses
              ▼                                ▼
    ┌──────────────────────┐    ┌──────────────────────────────┐
    │useUserPreferences()  │    │ Stored in localStorage       │
    │   HOOK               │    │ Key: personalized-dashboard  │
    │                      │    │ -prefs                       │
    │ ├─ preferences       │    │                              │
    │ ├─ toggleRegion()    │    │ Auto-synced on every         │
    │ ├─ toggleInterest()  │    │ preference change            │
    │ ├─ setRiskPriority() │    │                              │
    │ ├─ setMinSeverity()  │    │ ┌────────────────────────┐   │
    │ ├─ setRiskThreshold()│    │ │ UserPreferences {      │   │
    │ ├─ togglePinnedEvent │    │ │   userId               │   │
    │ └─ resetToDefaults() │    │ │   regions[]            │   │
    │                      │    │ │   interests[]          │   │
    └──────────────────────┘    │ │   riskPriority         │   │
                                  │ │   riskThreshold        │   │
                                  │ │   pinnedEventIds[]     │   │
                                  │ │   notificationSettings │   │
                                  │ │ }                      │   │
                                  │ └────────────────────────┘   │
                                  └──────────────────────────────┘

              │
              │ Calls
              ▼
    ┌──────────────────────────────────────────────────────┐
    │      personalization.ts (UTILITY FUNCTIONS)          │
    │                                                       │
    │  1. filterSignalsByPreferences()                     │
    │     INPUT: signals[], preferences                    │
    │     OUTPUT: PersonalizedAlert[]                      │
    │     - Filters by: interests, severity               │
    │     - Adds: riskScore, relevanceScore                │
    │     - Sorts by: pinned → relevance → risk            │
    │                                                       │
    │  2. calculateSignalRiskScore()                       │
    │     INPUT: signal, preferences                       │
    │     OUTPUT: number (0-100)                           │
    │     Factors:                                         │
    │     ├─ Severity: CRITICAL=100 ... INFO=10            │
    │     └─ Priority boost: +25 (security),+15 (other)    │
    │                                                       │
    │  3. calculateRelevanceScore()                        │
    │     INPUT: signal, preferences                       │
    │     OUTPUT: number (0-100)                           │
    │     Factors:                                         │
    │     ├─ Interest match: +0 or base                    │
    │     ├─ Pinned: +20                                   │
    │     └─ Region selection: affects weighting           │
    │                                                       │
    │  4. calculateUserRiskScore()                         │
    │     INPUT: signals[], preferences                    │
    │     OUTPUT: number (0-100)                           │
    │     Aggregates all signal risks                      │
    │                                                       │
    │  5. getHighRiskAlerts()                              │
    │     INPUT: signals[], threshold                      │
    │     OUTPUT: signals with risk >= threshold           │
    │                                                       │
    │  6. groupSignalsByCategory()                         │
    │     INPUT: signals[]                                 │
    │     OUTPUT: Map<category, signals[]>                 │
    │                                                       │
    │  7. filterMarketsByPriority()                        │
    │     INPUT: markets[], priority                       │
    │     OUTPUT: filtered markets                         │
    │                                                       │
    └──────────────────────────────────────────────────────┘

              │
              │ Operates on
              ▼
    ┌──────────────────────────────────────────────────────┐
    │         DATA SOURCES (External APIs)                 │
    │                                                       │
    │  ├─ /api/signals → Signal[]                          │
    │  ├─ /api/markets → MarketData[]                      │
    │  ├─ /api/predictions → PredictionMarket[]            │
    │  ├─ /api/earthquakes → Earthquake[]                  │
    │  └─ /api/conflicts → Conflict[]                      │
    │                                                       │
    │  Fetched via SWR with auto-refresh intervals         │
    │                                                       │
    └──────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow: User Customization

```
User clicks Settings (⚙️)
        │
        ▼
    PreferencesModal Opens
        │
        ├─ User selects regions (e.g., USA, Middle East)
        │     │
        │     └─► toggleRegion('USA')
        │           │
        │           ▼
        │       Update preferences state
        │           │
        │           ▼
        │       Re-render UI
        │
        ├─ User selects interests (conflict, cyber)
        │     │
        │     └─► toggleInterest('conflict')
        │           │
        │           ▼
        │       Update preferences state
        │
        ├─ User sets risk priority (security)
        │     │
        │     └─► setRiskPriority('security')
        │           │
        │           ▼
        │       Update preferences state
        │
        ├─ User moves threshold slider (70%)
        │     │
        │     └─► setRiskThreshold(70)
        │           │
        │           ▼
        │       Update preferences state
        │
        └─ User clicks "Save Preferences"
              │
              ▼
          Call updatePreferences()
              │
              ▼
          Update preferences state
              │
              ▼
          useEffect triggered
              │
              ▼
          Save to localStorage
              │
              ▼
          Close Modal
              │
              ▼
          Dashboard Re-renders
              │
              ▼
          PersonalizedDashboard calls:
          filterSignalsByPreferences(signals, newPrefs)
              │
              ▼
          NEW filtered alerts displayed with:
          - Updated risk scores
          - Updated relevance scores
          - Updated "My Regions" section
          - Updated "My Interests" section
```

---

## 📊 Risk Calculation Algorithm

```
FOR EACH SIGNAL:
    │
    ├─ Base Score = Severity Weight
    │  ├─ CRITICAL → 100
    │  ├─ HIGH    → 80
    │  ├─ MEDIUM  → 60
    │  ├─ LOW     → 30
    │  └─ INFO    → 10
    │
    ├─ Apply Priority Multiplier
    │  ├─ Priority = Security?
    │  │  ├─ conflict → +30
    │  │  ├─ military → +30
    │  │  └─ cyber    → +25
    │  ├─ Priority = Economy?
    │  │  ├─ economy  → +25
    │  │  └─ politics → +15
    │  └─ Priority = Travel?
    │     ├─ disaster       → +25
    │     └─ infrastructure → +20
    │
    ├─ Calculate Relevance
    │  ├─ Base = 100
    │  ├─ Interest Match?
    │  │  ├─ Yes → No deduction
    │  │  └─ No  → -30
    │  ├─ Pinned?
    │  │  ├─ Yes → +20
    │  │  └─ No  → 0
    │  └─ Final Relevance = Math.max(0, min(100, score))
    │
    ├─ Final Risk Score = (Base + Priority) / 2
    │  └─ Normalize to 0-100
    │
    └─ Result: { riskScore: 0-100, relevanceScore: 0-100 }


AGGREGATE USER RISK:
    │
    ├─ HIGH RISK alerts (score >= 75) → count * 3
    ├─ MEDIUM RISK alerts (score 50-75) → count * 1
    │
    ├─ FORMULA:
    │  overallRisk = (highCount * 3 + mediumCount * 1) / totalSignals
    │  overallRisk = Math.min(100, overallRisk * 20)
    │
    └─ Result: Overall Risk Score (0-100%)
```

---

## 🔁 Filtering Pipeline

```
┌─ Input: All Signals
│
├─ Filter 1: Check if signal category in user interests
│  └─ if NOT in interests → SKIP signal
│
├─ Filter 2: Check if signal severity >= min severity
│  └─ if severity < min → SKIP signal
│
├─ Filter 3: For each remaining signal, calculate:
│  ├─ riskScore = calculateSignalRiskScore()
│  ├─ relevanceScore = calculateRelevanceScore()
│  └─ isPinned = (id in pinnedEventIds)
│
├─ Filter 4: Sort by priority:
│  ├─ First: isPinned = true (pinned events on top)
│  ├─ Then: By relevanceScore (highest first)
│  └─ Finally: By riskScore (highest first)
│
└─ Output: PersonalizedAlert[]
   └─ Each alert has: ...signal, isPinned, riskScore, relevanceScore
```

---

## 🎯 Component Hierarchy

```
Dashboard (page.tsx)
├─ [ViewMode = 'personalized']
│
├─ Header
│  └─ Mode Toggle Buttons
│     ├─ 📊 DASHBOARD
│     ├─ 👁️ MY DASHBOARD (ACTIVE)
│     ├─ ⚔️ WAR ROOM
│     └─ 📺 TV MODE
│
├─ PersonalizedDashboard (Main Content)
│  ├─ Header Section
│  │  └─ Eye Icon + Title + Settings Button (⚙️)
│  │
│  ├─ Overall Risk Score Card
│  │  ├─ Gauge Icon
│  │  ├─ Risk percentage (0-100)
│  │  └─ Summary stats
│  │
│  ├─ My Regions Section (if regions selected)
│  │  └─ Region tags (pills)
│  │
│  ├─ Pinned Events Section (if any pinned)
│  │  └─ Event cards with ⭐ unpin button
│  │
│  ├─ High-Risk Alerts Section
│  │  └─ Alert cards sorted by risk
│  │
│  └─ My Interests Grid (if any matches)
│     └─ Category cards showing top signals
│
├─ PreferencesModal (Overlay)
│  ├─ Header + Close Button
│  │
│  ├─ Tab Navigation
│  │  ├─ 📍 Regions Tab
│  │  │  └─ Multi-select grid
│  │  │
│  │  ├─ 🎯 Interests Tab
│  │  │  └─ Category checkboxes
│  │  │
│  │  ├─ 🔥 Priorities Tab
│  │  │  ├─ Priority radio group
│  │  │  └─ Threshold slider
│  │  │
│  │  └─ 🔔 Notifications Tab
│  │     ├─ Severity selector
│  │     ├─ Sound toggle
│  │     └─ Desktop notifications toggle
│  │
│  └─ Footer Actions
│     ├─ Reset to Defaults
│     ├─ Cancel
│     └─ Save Preferences
│
└─ StatsBar (Footer)
```

---

## 💾 localStorage Structure

```json
{
  "personalized-dashboard-prefs": {
    "userId": "default-user",
    "dashboardName": "My Intelligence Dashboard",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T14:45:22.000Z",
    
    "regions": [
      "USA",
      "Middle East",
      "Europe"
    ],
    
    "interests": [
      "conflict",
      "military",
      "cyber",
      "economy"
    ],
    
    "riskPriority": "security",
    
    "notificationSettings": {
      "minSeverity": "HIGH",
      "soundEnabled": true,
      "desktopNotifications": true
    },
    
    "pinnedEventIds": [
      "signal-abc123",
      "signal-def456",
      "signal-ghi789"
    ],
    
    "riskThreshold": 60
  }
}
```

---

## 🔌 Integration Points

```
page.tsx (Main App)
    │
    ├─► Import useUserPreferences hook
    │   └─ Initialize in Dashboard component
    │
    ├─► Import PersonalizedDashboard component
    │   └─ Render when viewMode = 'personalized'
    │
    ├─► Import PreferencesModal component
    │   └─ Render when preferencesModalOpen = true
    │
    ├─► Import personalization utilities
    │   └─ Available for other components to use
    │
    └─► State management
        ├─ viewMode: 'personalized'
        ├─ preferencesModalOpen: boolean
        └─ Preference functions from hook
```

---

## ⚡ Performance Optimizations

```
1. Memoization
   ├─ useMemo() for filtered signals
   ├─ useMemo() for grouped categories
   └─ useMemo() for risk calculations

2. SWR Caching
   ├─ API calls cached in memory
   ├─ Auto-refresh intervals: 30s, 60s, 5m
   └─ Stale-while-revalidate strategy

3. Lazy Loading
   ├─ PreferencesModal renders on-demand
   ├─ WarRoom loaded dynamically
   └─ Heavy components use next/dynamic

4. Filtering Efficiency
   ├─ Single pass through signals
   ├─ O(n) filtering algorithm
   └─ Sorts by relevance only once

5. localStorage Operations
   ├─ Async writes to avoid blocking UI
   ├─ Batched updates in useEffect
   └─ Minimal serialization overhead
```

---

## 🔐 Data Flow Security

```
User Input (PreferencesModal)
    │
    └─► Validation
        ├─ Region: Must be in AVAILABLE_REGIONS
        ├─ Interest: Must be valid SignalCategory
        ├─ Priority: Must be valid RiskPriority
        ├─ Threshold: Clamped to 0-100
        └─ Severity: Must be valid Severity enum
    │
    ▼
localStorage (Client-side only)
    │
    └─► JSON serialization
        ├─ No sensitive data stored
        ├─ User preferences only (no auth)
        └─ Auto-syncs on every change
    │
    ▼
Filtering/Calculations (In-memory)
    │
    └─► Applied to public signal data
        ├─ No data modification
        ├─ Read-only operations
        └─ Results display-only
```

This architecture ensures **security**, **performance**, and **maintainability**! 🚀
