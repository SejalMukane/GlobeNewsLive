# Personalized Dashboard - Implementation Examples

## 📋 Example 1: Basic Usage in a Component

```typescript
'use client';

import { useState } from 'react';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { filterSignalsByPreferences } from '@/lib/personalization';
import useSWR from 'swr';

export function MyPersonalizedFeed() {
  const { preferences } = useUserPreferences();
  const { data: allSignals = [] } = useSWR('/api/signals', 
    url => fetch(url).then(r => r.json())
  );

  // Filter signals based on user preferences
  const personalizedSignals = filterSignalsByPreferences(
    allSignals,
    preferences
  );

  return (
    <div className="space-y-4">
      <h2>Your Filtered Signals</h2>
      <div className="text-sm text-gray-400">
        Showing {personalizedSignals.length} of {allSignals.length} signals
      </div>
      {personalizedSignals.map(signal => (
        <div key={signal.id} className="p-4 border rounded">
          <h3>{signal.title}</h3>
          <p className="text-sm">Risk Score: {signal.riskScore.toFixed(0)}%</p>
          <p className="text-sm">Relevance: {signal.relevanceScore.toFixed(0)}%</p>
          {signal.isPinned && <span className="text-yellow-400">⭐ Pinned</span>}
        </div>
      ))}
    </div>
  );
}
```

---

## 📋 Example 2: Advanced Filtering with Multiple Utilities

```typescript
'use client';

import { useMemo } from 'react';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import {
  filterSignalsByPreferences,
  getHighRiskAlerts,
  groupSignalsByCategory,
  calculateUserRiskScore,
} from '@/lib/personalization';
import useSWR from 'swr';

export function AdvancedPersonalizedDashboard() {
  const { preferences } = useUserPreferences();
  const { data: allSignals = [] } = useSWR('/api/signals', fetcher);

  // Memoize calculations
  const personalized = useMemo(
    () => filterSignalsByPreferences(allSignals, preferences),
    [allSignals, preferences]
  );

  const highRiskOnly = useMemo(
    () => getHighRiskAlerts(personalized, preferences.riskThreshold),
    [personalized, preferences.riskThreshold]
  );

  const byCategory = useMemo(
    () => groupSignalsByCategory(personalized),
    [personalized]
  );

  const overallRisk = useMemo(
    () => calculateUserRiskScore(personalized, preferences),
    [personalized, preferences]
  );

  return (
    <div className="space-y-6">
      {/* Overall Risk Display */}
      <div className="p-4 bg-slate-800 rounded">
        <h2 className="text-xl font-bold">Your Risk Score</h2>
        <div className="text-4xl font-mono text-red-500">
          {overallRisk.toFixed(0)}%
        </div>
      </div>

      {/* High Risk Section */}
      <div>
        <h3 className="text-lg font-semibold mb-2">
          High-Risk Alerts ({highRiskOnly.length})
        </h3>
        <div className="space-y-2">
          {highRiskOnly.map(alert => (
            <div key={alert.id} className="p-3 bg-red-900/20 border border-red-500/50 rounded">
              <p className="font-semibold">{alert.title}</p>
              <p className="text-sm text-gray-400">{alert.timeAgo}</p>
              <div className="flex gap-2 mt-2">
                <span className="text-xs bg-red-500/30 px-2 py-1 rounded">
                  Risk: {alert.riskScore.toFixed(0)}%
                </span>
                {alert.isPinned && (
                  <span className="text-xs bg-yellow-500/30 px-2 py-1 rounded">
                    ⭐ Pinned
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* By Category */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Signals by Category</h3>
        <div className="grid grid-cols-2 gap-4">
          {Array.from(byCategory.entries()).map(([category, alerts]) => (
            <div key={category} className="p-3 bg-slate-800 rounded">
              <h4 className="font-semibold capitalize">{category}</h4>
              <p className="text-sm text-gray-400">
                {alerts.length} signal{alerts.length !== 1 ? 's' : ''}
              </p>
              <ul className="mt-2 space-y-1">
                {alerts.slice(0, 3).map(alert => (
                  <li key={alert.id} className="text-xs text-gray-400 truncate">
                    • {alert.title}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function fetcher(url: string) {
  return fetch(url).then(r => r.json());
}
```

---

## 📋 Example 3: Preference Management UI

```typescript
'use client';

import { useState } from 'react';
import { useUserPreferences } from '@/hooks/useUserPreferences';

export function PreferenceManager() {
  const {
    preferences,
    toggleRegion,
    toggleInterest,
    setRiskPriority,
    setRiskThreshold,
  } = useUserPreferences();

  const [localThreshold, setLocalThreshold] = useState(preferences.riskThreshold);

  const handleThresholdChange = (value: number) => {
    setLocalThreshold(value);
    setRiskThreshold(value);
  };

  return (
    <div className="space-y-6 p-6 bg-slate-900 rounded-lg">
      {/* Regions */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Selected Regions</h3>
        <div className="flex flex-wrap gap-2">
          {preferences.regions.map(region => (
            <button
              key={region}
              onClick={() => toggleRegion(region)}
              className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full hover:bg-red-500/20 hover:text-red-400 transition"
            >
              {region} ✕
            </button>
          ))}
        </div>
      </div>

      {/* Interests */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Interests</h3>
        <div className="grid grid-cols-2 gap-2">
          {['conflict', 'military', 'cyber', 'economy', 'disaster', 'terrorism'].map(
            interest => (
              <button
                key={interest}
                onClick={() => toggleInterest(interest as any)}
                className={`px-3 py-2 rounded capitalize transition ${
                  preferences.interests.includes(interest as any)
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                }`}
              >
                {interest}
              </button>
            )
          )}
        </div>
      </div>

      {/* Risk Priority */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Risk Priority</h3>
        <div className="space-y-2">
          {(['all', 'economy', 'security', 'travel'] as const).map(priority => (
            <button
              key={priority}
              onClick={() => setRiskPriority(priority)}
              className={`w-full p-3 rounded capitalize transition text-left ${
                preferences.riskPriority === priority
                  ? 'bg-green-500/20 text-green-400 border border-green-500'
                  : 'bg-slate-700 text-gray-400 border border-transparent hover:border-slate-600'
              }`}
            >
              {priority}
            </button>
          ))}
        </div>
      </div>

      {/* Risk Threshold Slider */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Risk Alert Threshold</h3>
        <input
          type="range"
          min="0"
          max="100"
          value={localThreshold}
          onChange={e => handleThresholdChange(Number(e.target.value))}
          className="w-full"
        />
        <p className="text-sm text-gray-400 mt-2">
          Show alerts with risk ≥ {localThreshold}%
        </p>
      </div>
    </div>
  );
}
```

---

## 📋 Example 4: Real-time Risk Monitoring

```typescript
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { calculateUserRiskScore, filterSignalsByPreferences } from '@/lib/personalization';
import useSWR from 'swr';

export function RiskMonitor() {
  const { preferences } = useUserPreferences();
  const { data: allSignals = [] } = useSWR('/api/signals', fetcher, {
    refreshInterval: 5000, // Refresh every 5 seconds
  });

  const filtered = useMemo(
    () => filterSignalsByPreferences(allSignals, preferences),
    [allSignals, preferences]
  );

  const riskScore = useMemo(
    () => calculateUserRiskScore(filtered, preferences),
    [filtered, preferences]
  );

  const [prevRisk, setPrevRisk] = useState(riskScore);
  const riskTrend = riskScore > prevRisk ? 'up' : riskScore < prevRisk ? 'down' : 'stable';

  useEffect(() => {
    setPrevRisk(riskScore);
  }, [riskScore]);

  const getRiskColor = (risk: number) => {
    if (risk >= 80) return 'text-red-500 bg-red-500/10';
    if (risk >= 60) return 'text-orange-500 bg-orange-500/10';
    if (risk >= 40) return 'text-yellow-500 bg-yellow-500/10';
    return 'text-green-500 bg-green-500/10';
  };

  const getTrendArrow = () => {
    if (riskTrend === 'up') return '📈';
    if (riskTrend === 'down') return '📉';
    return '➡️';
  };

  return (
    <div className={`p-6 rounded-lg border ${getRiskColor(riskScore)}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">Your Current Risk Level</p>
          <p className="text-5xl font-bold mt-2">{riskScore.toFixed(0)}%</p>
        </div>
        <div className="text-4xl">{getTrendArrow()}</div>
      </div>
      <div className="mt-4 pt-4 border-t border-white/20">
        <p className="text-xs text-gray-400">
          {filtered.length} relevant signals • Last updated: {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}

function fetcher(url: string) {
  return fetch(url).then(r => r.json());
}
```

---

## 📋 Example 5: Pinning Events

```typescript
'use client';

import { useUserPreferences } from '@/hooks/useUserPreferences';
import { filterSignalsByPreferences } from '@/lib/personalization';
import useSWR from 'swr';

export function PinnedEventsSection() {
  const { preferences, togglePinnedEvent } = useUserPreferences();
  const { data: allSignals = [] } = useSWR('/api/signals', fetcher);

  const personalized = filterSignalsByPreferences(allSignals, preferences);
  const pinned = personalized.filter(s => s.isPinned);

  if (pinned.length === 0) {
    return (
      <div className="p-6 text-center text-gray-400 bg-slate-800 rounded-lg">
        <p>No pinned events yet</p>
        <p className="text-sm mt-1">Click the ⭐ on alerts to pin them</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">⭐ Pinned Events</h3>
      {pinned.map(event => (
        <div key={event.id} className="p-4 bg-yellow-900/20 border border-yellow-500/50 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-white">{event.title}</h4>
              <p className="text-sm text-gray-400 mt-1">{event.summary}</p>
              <div className="flex gap-2 mt-2">
                <span className="text-xs bg-yellow-500/30 px-2 py-1 rounded capitalize">
                  {event.category}
                </span>
                <span className={`text-xs px-2 py-1 rounded ${
                  event.severity === 'CRITICAL' ? 'bg-red-500/30' :
                  event.severity === 'HIGH' ? 'bg-orange-500/30' :
                  'bg-yellow-500/30'
                }`}>
                  {event.severity}
                </span>
              </div>
            </div>
            <button
              onClick={() => togglePinnedEvent(event.id)}
              className="text-yellow-400 hover:text-red-400 transition text-xl ml-4"
              title="Unpin this event"
            >
              ⭐
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function fetcher(url: string) {
  return fetch(url).then(r => r.json());
}
```

---

## 📋 Example 6: Integrating into Existing Panel

```typescript
// Example: Adding personalization to an existing MarketPanel

'use client';

import { useUserPreferences } from '@/hooks/useUserPreferences';
import { filterMarketsByPriority } from '@/lib/personalization';
import { MarketData } from '@/types';

interface MarketPanelProps {
  markets: MarketData[];
}

export function EnhancedMarketPanel({ markets }: MarketPanelProps) {
  const { preferences } = useUserPreferences();

  // Filter markets based on user's risk priority
  const relevantMarkets = filterMarketsByPriority(markets, preferences.riskPriority);

  return (
    <div className="p-4 bg-slate-800 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Markets</h3>
        <span className="text-xs text-gray-400">
          Personalized for {preferences.riskPriority}
        </span>
      </div>

      <div className="space-y-2">
        {relevantMarkets.map(market => (
          <div key={market.symbol} className="flex items-center justify-between p-2 bg-slate-700 rounded">
            <div>
              <p className="font-semibold text-sm">{market.name}</p>
              <p className="text-xs text-gray-400">{market.symbol}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-sm">{market.value}</p>
              <p className={`text-xs font-semibold ${
                market.direction === 'up' ? 'text-green-400' : 'text-red-400'
              }`}>
                {market.change} {market.changePercent}
              </p>
            </div>
          </div>
        ))}
      </div>

      {relevantMarkets.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">
          No markets match your priority: {preferences.riskPriority}
        </p>
      )}
    </div>
  );
}
```

---

## 🎯 Integration Checklist

- [ ] Types added to `src/types/index.ts`
- [ ] Hook created: `src/hooks/useUserPreferences.ts`
- [ ] Utilities created: `src/lib/personalization.ts`
- [ ] Components created: `PersonalizedDashboard.tsx`, `PreferencesModal.tsx`
- [ ] Integrated into `src/app/page.tsx`
- [ ] Tested on desktop and mobile
- [ ] localStorage persistence verified
- [ ] Preferences modal opens/closes correctly
- [ ] Risk scores calculate accurately
- [ ] Filtering works as expected
- [ ] UI styles match existing design system
