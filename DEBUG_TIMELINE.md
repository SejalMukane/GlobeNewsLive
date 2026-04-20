// DEBUG GUIDE FOR TIMELINE REPLAY FEATURE
// ========================================
// 
// If the play button isn't working, check these things:
//
// 1. OPEN BROWSER CONSOLE (F12 or DevTools)
//    You should see logs like:
//    ✓ "Play/Pause clicked. Current state: false -> New: true"
//    ✓ "▶️ Playback started with speed: 1 Total events: X"
//    ✓ "⏱️ Event interval: 500 ms"
//    ✓ "⏭️ Advancing event..."
//    ✓ "🎬 Event focused: [event title]"
//
// 2. IF YOU SEE THESE LOGS, the issue is likely:
//    - Check the Timeline view is actually displayed on the page
//    - Check the linked events panel shows related events
//    - Check the event severity indicators are showing
//
// 3. IF YOU DON'T SEE LOGS:
//    a) Play button click isn't reaching the handler
//       → Inspect the Play button and verify it's clickable
//       → Check if JavaScript is enabled in browser
//
// 4. IF LOGS SHOW BUT EVENTS DON'T ADVANCE:
//    a) Check "Total events: X" - if X = 0, no events loaded
//       → Verify signals are being passed to CrisisTimelineView
//       → Check that region/time range selections work
//
// 5. TESTING STEPS:
//    a) Open the Timeline Replay feature
//    b) Open DevTools Console (F12)
//    c) Click Play button
//    d) Watch console for logs
//    e) Check if events appear in Event Linker panel
//
// KNOWN ISSUES TO CHECK:
// - Timeline may be collapsed or hidden
// - Events may not be generated from signals (check API response)
// - Region filter may not match any signals
// - Linked events depend on signals having proper tags/categories
