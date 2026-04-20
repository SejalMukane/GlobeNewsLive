# Testing Guide: Crisis Timeline Replay + Event Linking

## ⚡ Quick Test (5 minutes)

### Option 1: Test in Existing Dashboard
1. Add timeline view to `src/app/page.tsx`:

```typescript
import CrisisTimelineView from '@/components/CrisisTimelineView';

// Around line 180-200, add to your view mode toggle:
const viewModes = ['dashboard', 'warroom', 'personalized', 'timeline'];

// In your button area, add:
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

// In your render section, add:
{viewMode === 'timeline' && (
  <CrisisTimelineView 
    signals={allSignals}
    isLoading={!allSignals}
  />
)}
```

2. Run dev server:
```bash
npm run dev
```

3. Open http://localhost:3000 and click "🎬 TIMELINE" button

4. **Test these actions:**
   - ✅ Select a region (Middle East, Ukraine, etc)
   - ✅ Pick time range (24h, 7d, 30d)
   - ✅ Press ▶️ play button
   - ✅ Click ⏸ pause
   - ✅ Adjust speed dropdown (2x, 4x)
   - ✅ Click individual events in the list
   - ✅ Verify event details appear in right panel
   - ✅ Verify linked events show up (Causes, Effects, Related)

---

## 🧪 Detailed Testing Scenarios

### Test 1: Timeline Loads & Displays
**What to verify:**
```
✅ CrisisTimelineView renders without errors
✅ Region buttons visible and clickable
✅ Time range buttons visible and clickable
✅ TimelineReplay component shows
✅ Event list populates with events
✅ Statistics panel shows counts
```

**Expected result:**
- See 10-50 events depending on API data
- Stats show: Total Events, Critical Events, Time Span, Severity

### Test 2: Playback Controls
**Steps:**
1. Click ▶️ button
2. Watch events cycle through
3. Click ⏸ pause
4. Click ▶️ again
5. Try each speed: 0.5x, 1x, 2x, 4x

**Expected result:**
- Events advance smoothly
- Speed changes affect how fast events progress
- Current event highlights change
- Progress bar fills as playback continues

### Test 3: Event Selection & Linking
**Steps:**
1. Play until interesting event appears
2. Click on an event in the events list
3. Check right panel (EventLinker)

**Expected result:**
```
Right panel shows:
  ✅ Selected event highlighted in green
  ✅ "EXAMINING" section shows event details
  ✅ One of these sections should have events:
      - "What Triggered This" (red)
      - "What This Triggered" (green)
      - "Related Events" (cyan)
  ✅ Each linked event shows timestamp/category
```

### Test 4: Expand/Collapse Sections
**Steps:**
1. In EventLinker panel, click "What Triggered This" header
2. Should expand/collapse
3. Try other sections

**Expected result:**
- ▶️ symbol changes to ▼ when expanded
- Events appear/disappear smoothly

### Test 5: Skip Events & Navigation
**Steps:**
1. Click back arrow (skip previous)
2. Click forward arrow (skip next)
3. Click progress bar at different points

**Expected result:**
- Current event changes
- Event counter updates
- Right panel updates with new linked events

### Test 6: Region Filter
**Steps:**
1. Start with "Middle East"
2. Click "Ukraine"
3. Observe events change

**Expected result:**
- Events list updates
- Statistics change
- TimelineReplay shows new timeline

### Test 7: Time Range Filter
**Steps:**
1. Select "Last 24 hours"
2. Switch to "Last 7 days"
3. Switch to "Last 30 days"

**Expected result:**
- More events appear as range expands
- Dates in progress bar update
- Event timestamps adjust

---

## 🐛 Common Issues to Check

### Issue 1: No Events Showing
**Debugging:**
```typescript
// Open browser console (F12) and check:
// 1. Are signals being fetched?
console.log(allSignals); // Should not be empty

// 2. Check timeline creation
const timeline = createTimelineFromSignals(allSignals, 'Middle East', '7d');
console.log(timeline);

// 3. Check if events have timestamps
allSignals.forEach(s => console.log(s.timestamp));
```

### Issue 2: Play Button Not Working
**Debugging:**
- Check console for errors
- Verify `playbackSpeed > 0`
- Check if events array is empty
- Ensure date intervals are valid

### Issue 3: Event Linker Shows No Connections
**Debugging:**
- Not all events have connections (that's OK)
- Try different events - some may be isolated
- Check if event has tags: `selectedEvent.tags.length`
- Verify time window (48 hours by default)

### Issue 4: UI Not Responsive
**Debugging:**
- Check Tailwind CSS is loading (inspect element colors)
- Verify Lucide icons are visible (should see icons like ⏭️, ▶️)
- Check browser console for JS errors

---

## ✅ Testing Checklist

### Visual Elements
- [ ] Timeline header visible with crisis name
- [ ] Region selector buttons render correctly
- [ ] Time range buttons render correctly
- [ ] Playback controls visible (play, pause, skip buttons)
- [ ] Speed selector dropdown visible
- [ ] Progress bar shows and fills correctly
- [ ] Current event card displays with severity color
- [ ] Events list shows scrollable grid
- [ ] Key moments section shows if clusters exist
- [ ] Right panel (EventLinker) appears

### Functionality
- [ ] Clicking region changes events
- [ ] Clicking time range changes events
- [ ] Play/pause toggle works
- [ ] Speed dropdown changes playback speed
- [ ] Clicking events highlights them
- [ ] EventLinker updates when event selected
- [ ] Expandable sections work (causes, effects, related)
- [ ] Statistics update with new data
- [ ] No console errors

### Data Quality
- [ ] Events sorted chronologically
- [ ] Timestamps are valid dates
- [ ] Severity levels show correctly (CRITICAL, HIGH, etc)
- [ ] Event titles are readable
- [ ] Tags are present on events
- [ ] Linked events make sense

---

## 🔍 Testing with Real vs Mock Data

### Option A: Use Existing API Data
```bash
npm run dev
# Navigate to dashboard
# Open Network tab in DevTools (F12)
# Look for /api/signals request
# Check data structure
```

### Option B: Add Console Logging
```typescript
// In CrisisTimelineView.tsx, add debug output:

useEffect(() => {
  if (signals.length > 0) {
    console.log('Signals received:', signals.length);
    console.log('Sample signal:', signals[0]);
    
    const newTimeline = createTimelineFromSignals(signals, selectedRegion, timeRange);
    console.log('Timeline created:', newTimeline);
    console.log('Events:', newTimeline.events);
    
    setTimeline(newTimeline);
  }
}, [signals, selectedRegion, timeRange]);
```

### Option C: Create Minimal Test Component
```typescript
// Create src/components/TimelineTest.tsx

'use client';

import { useState } from 'react';
import TimelineReplay from '@/components/TimelineReplay';
import { CrisisTimeline } from '@/types';

export default function TimelineTest() {
  // Create fake timeline
  const fakeTimeline: CrisisTimeline = {
    id: 'test-1',
    name: 'Test Crisis',
    region: 'Middle East',
    startDate: new Date('2026-04-15'),
    endDate: new Date('2026-04-19'),
    severity: 'HIGH',
    events: [
      {
        id: '1',
        timestamp: new Date('2026-04-15T10:00:00'),
        title: 'Initial incident reported',
        description: 'Something happened',
        category: 'conflict',
        severity: 'HIGH',
        region: 'Middle East',
        source: 'Reuters',
        tags: ['military', 'conflict'],
      },
      {
        id: '2',
        timestamp: new Date('2026-04-15T11:00:00'),
        title: 'Market reaction begins',
        description: 'Oil prices spike',
        category: 'economy',
        severity: 'MEDIUM',
        region: 'Global',
        source: 'Bloomberg',
        tags: ['oil', 'market'],
      },
      {
        id: '3',
        timestamp: new Date('2026-04-15T12:00:00'),
        title: 'Shipping routes affected',
        description: 'Strait closure announced',
        category: 'shipping',
        severity: 'CRITICAL',
        region: 'Middle East',
        source: 'Lloyd\'s',
        tags: ['shipping', 'strait'],
      },
    ],
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Timeline Component Test</h1>
      <TimelineReplay
        timeline={fakeTimeline}
        autoPlay={false}
        playbackSpeed={1}
        duration={30}
      />
    </div>
  );
}
```

Then import and view: `http://localhost:3000/timeline-test`

---

## 🚀 Step-by-Step Testing Flow

### Phase 1: Component Load (2 min)
1. Add timeline button to dashboard
2. Run `npm run dev`
3. Verify no console errors
4. Click timeline button
5. Verify view loads

### Phase 2: Data Display (3 min)
1. Select region
2. Select time range
3. Verify events appear
4. Check stats panel

### Phase 3: Playback (2 min)
1. Click play
2. Adjust speed
3. Click pause
4. Click skip buttons

### Phase 4: Event Linking (3 min)
1. Click different events
2. Verify right panel updates
3. Check expandable sections
4. Click linked events

### Phase 5: Edge Cases (2 min)
1. Try all regions
2. Try all time ranges
3. Click event with no links
4. Rapid clicking tests

**Total: ~12 minutes**

---

## 📊 What to Look For

### Good Signs ✅
- Events appear and update smoothly
- No console errors
- Playback progresses without freezing
- Linked events make contextual sense
- UI is responsive and colorful
- Statistics update correctly

### Bad Signs 🔴
- Blank event list
- Console errors
- Playback doesn't progress
- Linked events seem random/wrong
- UI elements misaligned
- Statistics show 0 for everything

---

## 🎯 Quick Debugging Commands

Open browser console (F12) and run:

```javascript
// Check if signals loaded
window.allSignals?.length

// Check timeline utilities
window.createTimelineFromSignals

// Test timeline creation manually
const tl = window.createTimelineFromSignals(
  window.allSignals, 
  'Middle East', 
  '7d'
);
console.log(tl);

// Check event linking
const event = tl.events[0];
const links = window.getLinkedEvents(event, tl.events);
console.log('Linked events:', links);
```

---

## ✨ Success Criteria

You'll know it works when:

1. ✅ Timeline view loads without errors
2. ✅ Events display and playback controls work
3. ✅ Clicking events shows related events in right panel
4. ✅ Cause/effect/related sections make contextual sense
5. ✅ No console errors
6. ✅ UI is responsive on mobile/tablet/desktop
7. ✅ Speed adjustment works
8. ✅ Region/time range filters update data

---

## 📞 Troubleshooting

If something doesn't work:

1. **Check browser console** (F12) for errors
2. **Verify API endpoint** returns signals with timestamps
3. **Check data structure** matches Signal interface
4. **Clear browser cache** (Ctrl+Shift+Delete)
5. **Restart dev server** (Stop and `npm run dev` again)
6. **Check TypeScript errors** in terminal
7. **Verify components are imported** correctly

---

That's it! You're ready to test. Let me know what you find! 🚀
