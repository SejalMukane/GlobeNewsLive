# Personalized Dashboard Implementation Guide

## 🎯 Overview

The Personalized Dashboard feature allows users to customize their intelligence feed based on:
- **Regions**: Choose countries/areas they care about
- **Interests**: Select signal categories (conflicts, markets, cyber, etc.)
- **Risk Priority**: Focus on economy, security, travel, or all
- **Notifications**: Set severity thresholds and alert preferences
- **Risk Scoring**: Personalized risk scores for alerts

---

## 📁 File Structure

```
src/
├── types/index.ts                         # New: Personalization types
├── hooks/useUserPreferences.ts            # New: User preference management
├── lib/personalization.ts                 # New: Filter & scoring utilities
├── components/
│   ├── PersonalizedDashboard.tsx          # New: Main personalized view
│   └── PreferencesModal.tsx               # New: Settings UI
└── app/page.tsx                           # Updated: Integrated views
```

---

## 🔧 How It Works

### 1. **User Preferences Storage**
```typescript
// Stored in localStorage with persistence
const preferences = {
  userId: 'default-user',
  regions: ['USA', 'Middle East'],
  interests: ['conflicts', 'markets', 'cyber'],
  riskPriority: 'security',
  notificationSettings: {
    minSeverity: 'HIGH',
    soundEnabled: true,
    desktopNotifications: true,
  },
  pinnedEventIds: [],
  riskThreshold: 60,
};
```

### 2. **Data Filtering Pipeline**
```
Raw Signals → Filter by Region + Interest + Severity
           → Calculate Risk Score for Signal
           → Calculate Relevance Score for User
           → Sort by Importance
           → Return Personalized Alerts
```

### 3. **Risk Calculation**
- **Signal Risk Score**: Based on severity + user's risk priority
- **Relevance Score**: Based on user's interests + regions + pins
- **User Overall Risk**: Aggregate score from filtered alerts

---

## 🚀 Usage

### For End Users:

1. **Access Personalized Dashboard**
   - Click "👁️ MY DASHBOARD" button in header
   
2. **Customize Preferences**
   - Click ⚙️ settings icon to open preferences modal
   - Select regions, interests, risk priority
   - Configure notification settings
   - Set risk threshold

3. **Pin Important Events**
   - Click ⭐ on alerts to pin them
   - Pinned events appear at top and get higher scoring

4. **Monitor Risk Score**
   - Overall risk percentage shown in real-time
   - Broken down by region and category

### For Developers:

#### Using the Hook
```typescript
import { useUserPreferences } from '@/hooks/useUserPreferences';

function MyComponent() {
  const {
    preferences,
    toggleRegion,
    toggleInterest,
    setRiskPriority,
    setMinSeverity,
    setRiskThreshold,
  } = useUserPreferences();

  // Use preferences to filter data
}
```

#### Filtering Data
```typescript
import { filterSignalsByPreferences } from '@/lib/personalization';

const filtered = filterSignalsByPreferences(allSignals, preferences);
// Returns PersonalizedAlert[] with risk & relevance scores
```

#### Advanced Features
```typescript
import {
  getHighRiskAlerts,
  groupSignalsByCategory,
  calculateUserRiskScore,
  filterMarketsByPriority,
} from '@/lib/personalization';

// Get only alerts above threshold
const critical = getHighRiskAlerts(alerts, threshold);

// Group by type for UI
const grouped = groupSignalsByCategory(alerts);

// Overall risk assessment
const score = calculateUserRiskScore(alerts, prefs);

// Filter markets by priority
const relevant = filterMarketsByPriority(markets, priority);
```

---

## 🎨 UI Components

### PersonalizedDashboard.tsx
Displays:
- 📍 **My Regions** - Selected geographic focus areas
- ⚠️ **High-Risk Alerts** - Alerts above user's threshold
- ⭐ **Pinned Events** - Manually flagged critical events
- 📈 **My Interests** - Grouped by signal category
- 🎯 **Risk Score** - Overall personalized risk percentage

### PreferencesModal.tsx
4 tabs:
1. **Regions** - Multi-select geographic areas
2. **Interests** - Choose signal categories
3. **Priorities** - Risk priority level + threshold slider
4. **Notifications** - Severity filters, sound, desktop alerts

---

## 💾 Data Persistence

- User preferences stored in **localStorage** under key: `personalized-dashboard-prefs`
- Persists across sessions automatically
- Can be reset with "Reset to Defaults" button
- JSON serializable format for easy export

---

## 🔌 Integration Points

### Page Modes
Three dashboard modes available in main `page.tsx`:
- `'dashboard'` - Classic multi-panel dashboard
- `'personalized'` - New personalized view (👁️ MY DASHBOARD)
- `'warroom'` - Real-time conflict monitoring

### Adding to Existing Components
```typescript
// Import and use in any component
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { filterSignalsByPreferences } from '@/lib/personalization';

export function MyPanel() {
  const { preferences } = useUserPreferences();
  const { data: allSignals } = useSWR('/api/signals', fetcher);
  
  const filteredSignals = filterSignalsByPreferences(
    allSignals,
    preferences
  );
  
  return <div>{/* render filtered signals */}</div>;
}
```

---

## 🔄 Extending the System

### Adding New Risk Factors
Edit `calculateSignalRiskScore` in `lib/personalization.ts`:
```typescript
export function calculateSignalRiskScore(signal, preferences) {
  let score = severityScores[signal.severity];
  
  // Add custom factor
  if (hasCustomFactor) {
    score += 25;
  }
  
  return Math.min(100, Math.max(0, score / 2));
}
```

### Adding New Regions
Update `PreferencesModal.tsx`:
```typescript
const AVAILABLE_REGIONS = [
  'USA',
  'Europe',
  'Middle East',
  // Add new:
  'Southeast Asia',
  'South America',
];
```

### Adding New Interest Categories
First update `types/index.ts` SignalCategory type, then update modal.

---

## 🐛 Debugging

### Check Stored Preferences
```javascript
// In browser console
JSON.parse(localStorage.getItem('personalized-dashboard-prefs'))
```

### Clear Preferences
```javascript
// Reset to defaults
localStorage.removeItem('personalized-dashboard-prefs')
// Refresh page
```

### Log Filtering Pipeline
```typescript
const filtered = filterSignalsByPreferences(signals, prefs);
console.log('Raw signals:', signals.length);
console.log('Filtered:', filtered.length);
console.log('Risk scores:', filtered.map(s => s.riskScore));
```

---

## 📊 Data Flow Diagram

```
User Opens "👁️ MY DASHBOARD"
    ↓
useUserPreferences() loads stored preferences
    ↓
Fetch all signals from /api/signals
    ↓
filterSignalsByPreferences(signals, prefs)
    ├─ Filter by interest categories
    ├─ Filter by severity threshold
    └─ Calculate risk & relevance scores
    ↓
Sort by: pinned → relevance → risk score
    ↓
Group by category
    ↓
Display in PersonalizedDashboard component
    ↓
User clicks ⚙️ → PreferencesModal opens
    ↓
Update preferences → Auto-saved to localStorage
    ↓
Dashboard re-renders with new filters
```

---

## 🎯 Key Features

✅ **Dynamic Filtering** - Real-time signal filtering based on preferences
✅ **Risk Scoring** - Personalized risk calculation for each alert  
✅ **Event Pinning** - Pin important events for instant access
✅ **Persistent Storage** - Preferences saved across sessions
✅ **Mobile Ready** - Responsive modal and dashboard layout
✅ **Sound Alerts** - Optional audio notifications for high-risk events
✅ **Multi-Language** - Works with existing language selector

---

## 🚀 Next Steps / Future Enhancements

1. **Predictive Alerts**
   - ML-based prediction of high-risk scenarios
   - Anomaly detection in user's focus areas

2. **Collaborative Dashboards**
   - Share filtered views with team members
   - Role-based access control

3. **Advanced Analytics**
   - Timeline of risk changes
   - Historical trend analysis
   - Pattern recognition

4. **External Integration**
   - Export preferences to JSON
   - Import from API
   - Webhook notifications

5. **Mobile App**
   - Native iOS/Android app
   - Offline support with sync

---

## 📝 Notes

- All user preferences stored locally (no backend required initially)
- Can be extended to use backend API for sync across devices
- Risk scores are user-specific and recalculated in real-time
- Performance optimized for 1000+ signals with filtering
