# Quick Start: Crisis Timeline Replay

## 🎯 What You Just Got

A **visual cause-and-effect replay system** for global crises that shows:
- Events unfolding chronologically
- What triggered each event
- What each event caused
- Related simultaneous events
- Automatic detection of key moments

---

## ⚡ 3-Step Integration

### Step 1: Add View Mode to Dashboard
```typescript
// In src/app/page.tsx
import CrisisTimelineView from '@/components/CrisisTimelineView';

// Add to view mode toggle (around line 180)
const viewModes = ['dashboard', 'warroom', 'personalized', 'timeline'];

// In render, add:
{viewMode === 'timeline' && (
  <CrisisTimelineView 
    signals={allSignals}
    isLoading={!allSignals}
  />
)}
```

### Step 2: Add Button to View Selector
```typescript
// In the header/navigation buttons area
<button
  onClick={() => setViewMode('timeline')}
  className={`px-3 py-1.5 rounded transition ${
    viewMode === 'timeline'
      ? 'bg-accent-green text-[#0a0a0f]'
      : 'text-gray-400 hover:text-accent-green'
  }`}
>
  🎬 TIMELINE
</button>
```

### Step 3: Done! 🚀
No additional backend changes needed. Uses existing `/api/signals` data.

---

## 💡 How Users Will Use It

1. **Select** Middle East region + Last 7 days
2. **Press Play** to watch events unfold
3. **Click any event** to see what caused it
4. **Adjust speed** (2x for faster viewing)
5. **Explore chains** - Click linked events to dig deeper

---

## 📊 What Data It Uses

```
Input: Existing signals from /api/signals
├─ timestamp
├─ title / summary
├─ category (conflict, economy, etc)
├─ severity (CRITICAL, HIGH, etc)
├─ region
└─ source

Output: Interactive timeline showing:
├─ Chronological replay
├─ Cause-effect chains
├─ Clustering of related events
└─ Event relationships
```

---

## 🎨 Key Features

| Feature | Component | What It Does |
|---------|-----------|-------------|
| **Timeline Replay** | `TimelineReplay.tsx` | Play/pause/speed events chronologically |
| **Event Linker** | `EventLinker.tsx` | Show what triggered & what was triggered |
| **Combined View** | `CrisisTimelineView.tsx` | Both + controls + stats |
| **Auto-Clustering** | `timeline.ts` | Detect "key moments" when events cluster |
| **Semantic Linking** | `timeline.ts` | Use AI-extracted tags to link events |

---

## 🔥 Files Modified/Created

```
NEW FILES:
✅ src/components/TimelineReplay.tsx (250 lines)
✅ src/components/EventLinker.tsx (220 lines)
✅ src/components/CrisisTimelineView.tsx (180 lines)
✅ src/lib/timeline.ts (320 lines) - Utilities
✅ CRISIS_TIMELINE_GUIDE.md - Full documentation

UPDATED:
✅ src/types/index.ts - Added 8 new types

OPTIONAL (integration):
⭕ src/app/page.tsx - Add timeline view mode
```

---

## 🎮 Component Props

### TimelineReplay
```typescript
<TimelineReplay
  timeline={CrisisTimeline}           // Required
  onEventFocus={(event) => {}}        // Optional callback
  onLinkedEventsShow={(events) => {}} // Optional callback
  autoPlay={false}                    // Auto start playback
  playbackSpeed={1}                   // 1x, 2x, 4x
  duration={60}                       // seconds for full replay
/>
```

### EventLinker
```typescript
<EventLinker
  selectedEvent={TimelineEvent}       // Required (or null)
  allEvents={TimelineEvent[]}         // Required
  onEventSelect={(event) => {}}       // Optional callback
/>
```

### CrisisTimelineView
```typescript
<CrisisTimelineView
  signals={Signal[]}                  // Required
  isLoading={false}                   // Optional
/>
```

---

## 🧠 How It Works (Technical)

### 1️⃣ Timeline Creation
```
Input: 50 signals, region "Ukraine"
Process:
  ├─ Filter signals by region
  ├─ Convert to TimelineEvent[]
  ├─ Extract semantic tags
  ├─ Sort by timestamp
  └─ Return CrisisTimeline
Output: Ordered list ready for playback
```

### 2️⃣ Event Linking
```
Input: One TimelineEvent
Process:
  ├─ Find events within 48-hour window
  ├─ Check tag overlap (oil, shipping, military, etc)
  ├─ Calculate relationship:
  │  ├─ Caused by (happened before)
  │  ├─ Causes (happened after)
  │  └─ Correlated (same time)
  └─ Return LinkedEvent[]
Output: Cause → Effect chains
```

### 3️⃣ Playback
```
Input: 50 events, 60-second playback
Process:
  ├─ Calculate schedule: event every 1.2 seconds
  ├─ Play event[0], pause 1.2s, play event[1], etc
  ├─ User can adjust speed 0.5x-4x
  ├─ Show current event with details
  └─ Detect clusters for "key moments"
Output: Animated crisis unfoldment
```

---

## 📈 Example Scenario: Oil Crisis

**Timeline: Last 24 hours, Middle East**

```
Timeline Events:
  10:00 - Saudi refinery hit
  10:15 - Production down 15%
  10:30 - Oil price spike
  11:00 - Airline announces price increase
  11:30 - Shipping reroutes
  12:00 - Market reaction headlines

User Workflow:
  1. Press play
  2. Watch events unfold
  3. Click "Refinery hit" event
     → Shows: No triggers (external attack)
  4. Click "Production down" event
     → Shows: Triggered by refinery hit
  5. Click "Price spike" event
     → Shows: Triggered by production down
     → Related: Currency, geopolitics signals
  6. Explore chains deeper
```

---

## 🎯 Tags System

Events are auto-tagged with semantic meaning:

```
'oil' → Energy sector events
'shipping' → Maritime/port events  
'market' → Financial events
'military' → Conflict/warfare events
'politics' → Government/diplomacy
'sanctions' → Trade restrictions
'cyber' → Security attacks
'humanitarian' → Refugee/aid events
'infrastructure' → Power/water/transport
'nuclear' → Atomic/radiation events
```

These tags are used to **link related events** even if they don't explicitly mention each other!

---

## ✨ Why This Is Powerful

1. **See the Narrative** - Not just alerts, but how events cause other events
2. **Understand Context** - One event doesn't exist in isolation
3. **Predict Impact** - See patterns of how crises cascade
4. **Find Root Causes** - Trace back to original trigger
5. **Spot Opportunities** - See cause-effect chains before market reacts
6. **Automate Reporting** - Timeline can auto-generate reports

---

## 🚀 Next Steps

1. **Integrate into main dashboard** (Optional, Step 1 above)
2. **Test with real signal data**
3. **Tweak playback duration/speed** for your use case
4. **Add map visualization** (coming soon)
5. **Enable export to PDF/video** (future enhancement)

---

## 📞 Need Help?

- Full docs: See [CRISIS_TIMELINE_GUIDE.md](./CRISIS_TIMELINE_GUIDE.md)
- Component reference: Check TypeScript interfaces in `src/types/index.ts`
- Utility functions: See `src/lib/timeline.ts` JSDoc comments

---

**You've successfully implemented a "VISUAL KILLER" feature!** 🎬✨

Your dashboard now shows not just WHAT is happening, but HOW events cascade and CAUSE other events to happen. This is intelligence analysis at a new level.
