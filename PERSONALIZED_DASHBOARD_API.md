# Personalized Dashboard - Quick Reference

## 📦 Imports

```typescript
// Types
import { 
  UserPreferences, 
  PersonalizedAlert, 
  RiskPriority,
  SignalCategory,
  Severity
} from '@/types';

// Hook
import { useUserPreferences } from '@/hooks/useUserPreferences';

// Utilities
import {
  filterSignalsByPreferences,
  calculateSignalRiskScore,
  calculateRelevanceScore,
  filterMarketsByPriority,
  getRegionAlerts,
  getHighRiskAlerts,
  groupSignalsByCategory,
  calculateUserRiskScore
} from '@/lib/personalization';

// Components
import PersonalizedDashboard from '@/components/PersonalizedDashboard';
import PreferencesModal from '@/components/PreferencesModal';
```

---

## 🎣 useUserPreferences() Hook

```typescript
const {
  // State
  preferences,           // Current user preferences
  isLoaded,             // Preferences loaded from storage

  // Mutation methods
  updatePreferences,    // Update multiple fields
  toggleRegion,         // Add/remove region
  toggleInterest,       // Add/remove interest category
  togglePinnedEvent,    // Pin/unpin alert
  setRiskPriority,      // Set priority (economy|security|travel|all)
  updateNotificationSettings, // Update notification prefs
  setMinSeverity,       // Set minimum severity for alerts
  setRiskThreshold,     // Set risk score threshold (0-100)
  resetToDefaults,      // Reset all to defaults
} = useUserPreferences();
```

---

## 🔍 Filter Functions

### filterSignalsByPreferences(signals, preferences)
**Returns:** `PersonalizedAlert[]`
```typescript
const filtered = filterSignalsByPreferences(allSignals, preferences);
// Filters by: interests, severity
// Adds: isPinned, riskScore, relevanceScore
// Sorted by: pinned → relevance → risk
```

### getHighRiskAlerts(signals, threshold)
**Returns:** `PersonalizedAlert[]`
```typescript
const critical = getHighRiskAlerts(filtered, 75);
// Returns alerts with riskScore >= threshold
```

### groupSignalsByCategory(signals)
**Returns:** `Map<SignalCategory, PersonalizedAlert[]>`
```typescript
const grouped = groupSignalsByCategory(alerts);
for (const [category, alerts] of grouped.entries()) {
  console.log(`${category}: ${alerts.length} alerts`);
}
```

### calculateUserRiskScore(signals, preferences)
**Returns:** `number` (0-100)
```typescript
const overallRisk = calculateUserRiskScore(alerts, preferences);
```

### filterMarketsByPriority(markets, priority)
**Returns:** `MarketData[]`
```typescript
const relevant = filterMarketsByPriority(allMarkets, 'economy');
// Filters markets based on priority level
```

---

## 🧮 Scoring Functions

### calculateSignalRiskScore(signal, preferences)
**Returns:** `number` (0-100)
```typescript
// Factors:
// - Signal severity (CRITICAL=100, HIGH=80, etc)
// - User's risk priority (security/economy/travel)
// - Category match with interests
const score = calculateSignalRiskScore(signal, preferences);
```

### calculateRelevanceScore(signal, preferences)
**Returns:** `number` (0-100)
```typescript
// Factors:
// - Interest category match
// - Pinned status
// - Region selection
const score = calculateRelevanceScore(signal, preferences);
```

---

## 🎨 Components

### PersonalizedDashboard
```typescript
<PersonalizedDashboard
  preferences={preferences}
  onSettingsClick={() => setModalOpen(true)}
  isLoading={isLoading}
/>
```

**Props:**
- `preferences: UserPreferences` - Current user preferences
- `onSettingsClick: () => void` - Settings button handler
- `isLoading?: boolean` - Loading state

**Displays:**
- Overall risk score
- My regions
- Pinned events
- High-risk alerts
- Interest-based categories

### PreferencesModal
```typescript
<PreferencesModal
  isOpen={isOpen}
  preferences={preferences}
  onClose={() => setOpen(false)}
  onSave={updatePreferences}
  onReset={resetToDefaults}
  onToggleRegion={toggleRegion}
  onToggleInterest={toggleInterest}
  onSetRiskPriority={setRiskPriority}
  onSetMinSeverity={setMinSeverity}
  onSetRiskThreshold={setRiskThreshold}
  onUpdateNotifications={updateNotificationSettings}
/>
```

**Tabs:**
1. Regions - Select geographic focus
2. Interests - Choose alert categories
3. Priorities - Risk priority + threshold
4. Notifications - Severity + alerts settings

---

## 💾 localStorage

**Key:** `personalized-dashboard-prefs`

**Structure:**
```json
{
  "userId": "default-user",
  "dashboardName": "My Intelligence Dashboard",
  "regions": ["USA", "Middle East"],
  "interests": ["conflict", "military"],
  "riskPriority": "security",
  "notificationSettings": {
    "minSeverity": "HIGH",
    "soundEnabled": true,
    "desktopNotifications": true
  },
  "pinnedEventIds": ["signal-123", "signal-456"],
  "riskThreshold": 60
}
```

**Access in Console:**
```javascript
// View current
JSON.parse(localStorage.getItem('personalized-dashboard-prefs'))

// Clear
localStorage.removeItem('personalized-dashboard-prefs')
```

---

## 🎯 Constants

### Available Regions
```typescript
'USA', 'Europe', 'Middle East', 'Asia', 'Africa',
'South America', 'Russia', 'China', 'India', 'Japan'
```

### Available Interests (SignalCategory)
```typescript
'conflict' | 'military' | 'diplomacy' | 'cyber' |
'disaster' | 'economy' | 'politics' | 'terrorism' |
'protest' | 'infrastructure'
```

### Risk Priorities
```typescript
'all' | 'economy' | 'security' | 'travel'
```

### Severity Levels
```typescript
'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'
```

---

## 📊 Type Definitions

```typescript
// Main preferences object
interface UserPreferences {
  userId: string;
  dashboardName?: string;
  createdAt: Date;
  updatedAt: Date;
  regions: string[];
  interests: SignalCategory[];
  riskPriority: RiskPriority;
  notificationSettings: {
    minSeverity: Severity;
    soundEnabled: boolean;
    desktopNotifications: boolean;
  };
  pinnedEventIds: string[];
  riskThreshold: number;
}

// Signal with personalization data
interface PersonalizedAlert extends Signal {
  isPinned: boolean;
  riskScore: number;
  relevanceScore: number;
}
```

---

## 🚀 Common Patterns

### Pattern 1: Filter and Display
```typescript
const { preferences } = useUserPreferences();
const { data: signals } = useSWR('/api/signals', fetcher);

const filtered = filterSignalsByPreferences(signals, preferences);

return (
  <div>
    {filtered.map(alert => (
      <Alert 
        key={alert.id} 
        alert={alert}
        risk={alert.riskScore}
      />
    ))}
  </div>
);
```

### Pattern 2: Conditional Rendering
```typescript
const highRisk = getHighRiskAlerts(filtered, preferences.riskThreshold);

if (highRisk.length > 0) {
  return <HighRiskSection alerts={highRisk} />;
}
```

### Pattern 3: Update Preferences
```typescript
const { toggleRegion, setRiskThreshold } = useUserPreferences();

const handleRegionSelect = (region) => {
  toggleRegion(region); // Auto-saves to localStorage
};

const handleThresholdChange = (value) => {
  setRiskThreshold(value); // Auto-saves
};
```

---

## ⚡ Performance Tips

1. **Memoize Filtered Results**
   ```typescript
   const filtered = useMemo(
     () => filterSignalsByPreferences(signals, preferences),
     [signals, preferences]
   );
   ```

2. **Use Partial Updates**
   ```typescript
   // Good
   toggleRegion('USA');
   
   // Avoid
   updatePreferences({ regions: [...] });
   ```

3. **Batch Updates**
   ```typescript
   // Use updateNotificationSettings for multiple fields
   updateNotificationSettings({
     soundEnabled: true,
     desktopNotifications: true,
   });
   ```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Preferences not persisting | Check localStorage is enabled |
| Risk score always 0 | Verify signal severity is set |
| Filters not working | Check console for preference load errors |
| Modal doesn't open | Verify isOpen state is true |
| Layout broken on mobile | Check responsive classes in components |

---

## 📚 Related Files

- `src/types/index.ts` - Type definitions
- `src/hooks/useUserPreferences.ts` - Preferences hook
- `src/lib/personalization.ts` - Filter utilities
- `src/components/PersonalizedDashboard.tsx` - Main component
- `src/components/PreferencesModal.tsx` - Settings UI
- `src/app/page.tsx` - Integration point (viewMode = 'personalized')
