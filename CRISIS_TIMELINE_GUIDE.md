# Crisis Timeline Replay + Event Linking - Implementation Guide

## 🎬 Overview

The **Crisis Timeline Replay + Event Linking** feature allows users to:
1. **Replay crises chronologically** - Watch how events unfold in real-time
2. **See cause-and-effect chains** - Click an event to discover what triggered it and what it caused
3. **Identify critical moments** - Automatic clustering of high-impact event sequences

---

## 📦 Files Created

### 1. **Types** (`src/types/index.ts` - Updated)
```typescript
- TimelineEvent: Individual crisis event
- CrisisTimeline: Collection of events for a region/period
- TimelineReplayState: Playback controls state
- LinkedEvent: Related events for cause-effect analysis
- EventLink: Graph of relationships between events
```

### 2. **Utilities** (`src/lib/timeline.ts` - New)
Core algorithms for timeline processing:
- `createTimelineFromSignals()` - Convert signals to timeline
- `extractTags()` - Semantic tagging for linking
- `getLinkedEvents()` - Find related events
- `buildEventCausalGraph()` - Build cause-effect chains
- `detectEventClusters()` - Find key moments
- `calculatePlaybackSchedule()` - Distribute events across playback

### 3. **Components**

#### `TimelineReplay.tsx` (New)
- Play/pause/skip controls
- Playback speed adjustment (0.5x, 1x, 2x, 4x)
- Timeline scrubber with progress bar
- Current event display with severity
- Events list with tag filtering
- Key moments detection

#### `EventLinker.tsx` (New)
- Shows what triggered selected event
- Shows what the event triggered
- Shows related correlated events
- Color-coded by event type
- Expandable sections for each category
- Time delta calculations

#### `CrisisTimelineView.tsx` (New)
- Region selector (Middle East, Ukraine, etc.)
- Time range picker (24h, 7d, 30d)
- Combines TimelineReplay + EventLinker
- Statistics panel
- Usage tips

---

## 🎯 Core Concepts

### Timeline Event Model
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
  tags: string[]; // 'oil', 'shipping', 'market', etc
}
```

### Event Linking Algorithm
```
1. Extract semantic tags from signal content
   - Keywords: 'oil', 'port', 'market', 'military', etc
   - Category-based tags: 'conflict', 'economy', etc
   - Derived tags: shared regions, related sectors

2. Find related events within time window (48 hours)
   - Check tag overlap
   - Check region match
   - Check category relationships

3. Determine relationship type
   - trigger_source: Previous event (happens before)
   - caused_by: This event was triggered by previous
   - correlated: Happens around same time with relation

4. Calculate confidence/strength based on:
   - Number of shared tags
   - Time proximity
   - Semantic similarity
```

### Playback Schedule
```
Timeline Duration: 100 seconds (configurable)
Events: 50

Each event gets:
  playbackTime = eventIndex * (100 / 50) = 2 seconds apart

Play one event every 2 seconds
User can adjust speed: 0.5x, 1x, 2x, 4x
```

### Event Clustering
```
Algorithm: Temporal grouping within time window (default: 1 hour)

Input: [Event1 @ 10:00, Event2 @ 10:05, Event3 @ 10:32, Event4 @ 10:33]
       Time window: 1 hour

Output:
  Cluster 1: [Event1, Event2] (5 min apart)
  Cluster 2: [Event3, Event4] (1 min apart)
  
Identifies "key moments" when multiple events cluster together
```

---

## 🚀 Usage Guide

### For End Users

#### Replaying a Crisis
1. Navigate to Crisis Timeline view
2. Select region (e.g., "Middle East")
3. Choose time range (24h, 7d, 30d)
4. Click ▶️ Play to start
5. Adjust speed as needed (2x for faster replay)

#### Understanding Event Links
1. Play timeline until interesting event
2. Click event OR let timeline focus on it
3. Right panel shows:
   - 🔴 What triggered it (causes)
   - 🟢 What it triggered (effects)
   - 🔵 Related events (correlated)
4. Click linked events to explore further

#### Key Moments
- Timeline auto-detects event clusters
- Shows "🔥 Key Moments" section
- Indicates when multiple events happened close together
- Click to jump to that moment

### For Developers

#### Creating Timeline from Signals
```typescript
import { createTimelineFromSignals } from '@/lib/timeline';

const timeline = createTimelineFromSignals(
  signals,        // All signals
  'Ukraine',      // Region
  '7d'            // Time range
);
```

#### Getting Linked Events
```typescript
import { getLinkedEvents } from '@/lib/timeline';

const links = getLinkedEvents(
  selectedEvent,  // TimelineEvent
  allEvents       // TimelineEvent[]
);

// Returns: LinkedEvent[]
// - What caused this
// - What this caused  
// - Related events
```

#### Detecting Clusters
```typescript
import { detectEventClusters } from '@/lib/timeline';

const clusters = detectEventClusters(
  events,
  3600000  // 1 hour window
);

// Returns: TimelineEvent[][]
// Each inner array is a cluster of related events
```

#### Tag Extraction
```typescript
import { extractTags } from '@/lib/timeline';

const tags = extractTags(signal);
// Returns: ['oil', 'shipping', 'economy', 'market']
// Used for linking similar events
```

---

## 🔗 Data Flow

```
User Selects Region + Time Range
    ↓
createTimelineFromSignals(signals, region, timeRange)
    ├─ Filter signals by region
    ├─ Filter by time window
    ├─ Convert to TimelineEvent[]
    ├─ Extract tags via extractTags()
    └─ Sort by timestamp
    ↓
TimelineReplay Component Renders
    ├─ calculatePlaybackSchedule(events, duration)
    ├─ displayCurrentEvent(events[currentIndex])
    ├─ detectEventClusters(events) → show "Key Moments"
    └─ [User clicks event]
    ↓
EventLinker Component Updates
    ├─ getLinkedEvents(selectedEvent, allEvents)
    ├─ Group by relationship type:
    │  ├─ Causes (triggers)
    │  ├─ Effects (triggered by)
    │  └─ Related (correlated)
    ├─ Color by category
    └─ Display with timestamps
    ↓
User Clicks Linked Event
    ├─ Update selectedEvent
    ├─ Re-run getLinkedEvents()
    └─ Show new connections
```

---

## 🎨 UI Components

### TimelineReplay
- **Header**: Crisis name, event count, region
- **Controls**: Play/Pause/Skip, Speed selector, Event counter
- **Progress Bar**: Visual timeline with gradient
- **Current Event**: Colored badge showing severity, description, tags
- **Events List**: Scrollable grid, clicking selects event
- **Key Moments**: 4-up grid of clusters with event counts

### EventLinker
- **Examining**: Shows selected event in detail
- **What Triggered This**: Red section (causes)
- **What This Triggered**: Green section (effects)
- **Related Events**: Cyan section (correlations)
- Each linked event shows:
  - Category emoji & title
  - Timestamp
  - Impact or time delta

### CrisisTimelineView
- **Region Selector**: 5 major crisis areas
- **Time Range**: 24h, 7d, 30d buttons
- **Grid Layout**: 2 columns (timeline + linker) on large screens
- **Stats Panel**: Event count, critical count, duration, severity
- **Tips Section**: How-to guide

---

## 🏗️ Integration Examples

### Example 1: Add to Dashboard
```typescript
import CrisisTimelineView from '@/components/CrisisTimelineView';

export function Dashboard() {
  const { data: signals = [] } = useSWR('/api/signals', fetcher);

  return (
    <div>
      <CrisisTimelineView 
        signals={signals}
        isLoading={!signals}
      />
    </div>
  );
}
```

### Example 2: Standalone Timeline
```typescript
import TimelineReplay from '@/components/TimelineReplay';
import { createTimelineFromSignals } from '@/lib/timeline';

function CrisisViewer({ signals }) {
  const timeline = createTimelineFromSignals(
    signals,
    'Middle East',
    '7d'
  );

  return (
    <TimelineReplay
      timeline={timeline}
      onEventFocus={(event) => console.log('Focused:', event)}
      autoPlay={false}
      playbackSpeed={1}
      duration={90}
    />
  );
}
```

### Example 3: Custom Event Linking
```typescript
import { getLinkedEvents, buildEventCausalGraph } from '@/lib/timeline';

function AnalyzeEvent(event) {
  const links = getLinkedEvents(event, allEvents);
  
  // Get causality graph
  const graph = buildEventCausalGraph(allEvents);
  
  // Find most impactful chain
  const causes = links.filter(l => l.relationship === 'trigger_source');
  const effects = links.filter(l => l.relationship === 'caused_by');
  
  return { causes, effects, graph };
}
```

---

## 🔍 Tag System

### Predefined Tags
```
'oil' - Energy/petroleum sector
'shipping' - Maritime/port operations
'market' - Financial/economic
'military' - Armed forces/warfare
'politics' - Government/diplomacy
'infrastructure' - Power, water, transport
'cyber' - Security/digital attacks
'humanitarian' - Refugees/aid/crisis
'sanctions' - Trade/embargo/export
'nuclear' - Atomic/radiation
```

### Auto-Extraction Logic
```typescript
Extracts from signal title + summary:
1. Exact phrase matching ('Strait of Hormuz' → 'shipping')
2. Keyword presence ('oil', 'petroleum', 'crude')
3. Category-based (signal.category is a tag)
4. Semantic inference (military conflict → economic impact)
```

---

## ⚡ Performance Optimizations

1. **Lazy Tag Extraction**
   - Done once when timeline created
   - Cached in TimelineEvent.tags

2. **Efficient Linking**
   - O(n²) within 48-hour window (usually small)
   - Not all events checked, only recent ones

3. **Playback Schedule**
   - Pre-calculated once at init
   - Linear array lookup O(1) per frame

4. **Clustering**
   - Single pass O(n) algorithm
   - Detected once, cached

---

## 🧪 Testing Scenarios

### Scenario 1: Ukraine Crisis
```
Signals: 50+ events about Ukraine
Timeline: Last 7 days
Expected: 
  - Key moments when casualties reported
  - Link military strikes to market drops
  - Link city attacks to refugee announcements
```

### Scenario 2: Oil Price Shock
```
Signals: 30+ events about energy/shipping
Timeline: Last 24 hours
Expected:
  - Production drop → price spike
  - Price spike → airline announcements
  - Geopolitics → shipping delays
```

### Scenario 3: Cross-Sector Impact
```
Signals: 100+ mixed events
Timeline: Last 30 days
Expected:
  - Military action → economic fallout
  - Market crash → policy response
  - Sanctions → shipping reroutes
```

---

## 📊 Configuration

### Playback Duration
```typescript
<TimelineReplay
  duration={60}  // seconds for full playback
/>
```

### Clustering Window
```typescript
detectEventClusters(events, 3600000)  // 1 hour = 3.6M ms
```

### Linking Time Window
```typescript
const timeWindow = 48 * 60 * 60 * 1000;  // 48 hours
```

### Playback Speeds
```
Available: 0.5x, 1x, 2x, 4x
Default: 1x
```

---

## 🚀 Future Enhancements

1. **3D Map Visualization**
   - Show events on map with timeline scrubber
   - Animate movements/flows between regions

2. **Event Severity Scoring**
   - Calculate impact scores for each event
   - Weight linking by impact (high-impact chains prominent)

3. **Predictive Chains**
   - ML to predict next events in chain
   - Show "likely next" in event linker

4. **Multi-Region Timelines**
   - Compare how same global event affects different regions
   - Show regional divergence in effects

5. **Export & Sharing**
   - Export crisis timeline as PDF/video
   - Share timeline snapshots
   - Embed in reports

6. **AI Analysis**
   - Auto-generate narrative of crisis
   - Explain chains in natural language
   - Generate impact assessments

---

## 📞 API Reference

See `src/lib/timeline.ts` for complete function signatures:

| Function | Input | Output | Use Case |
|----------|-------|--------|----------|
| `createTimelineFromSignals` | signals, region, timeRange | CrisisTimeline | Generate timeline |
| `extractTags` | signal | string[] | Semantic tagging |
| `getLinkedEvents` | event, allEvents | LinkedEvent[] | Find relationships |
| `buildEventCausalGraph` | events | EventLink[] | Graph structure |
| `calculatePlaybackSchedule` | events, duration | schedule[] | Replay timing |
| `detectEventClusters` | events, window | clusters[][] | Find key moments |

---

This feature transforms raw signals into **visual, interactive narratives** that show how global crises actually unfold! 🎬✨
