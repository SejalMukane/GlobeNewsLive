import { NextRequest, NextResponse } from 'next/server';
import { aggregateOsintFeedSequential } from '@/lib/osint/aggregator';
import { storeEventOnBlockchain, getExplorerLink } from '@/lib/blockchain/xdcClient';
import { generateHash } from '@/lib/blockchain/hashGenerator';
import { sendCriticalEventToTelegram } from '@/lib/notifications/telegram';

// Global state for server-startup initialization
let serverStartupComplete = false;

/**
 * POST /api/osint-feed
 * Aggregates OSINT data and returns events with AI analysis
 * 
 * Features:
 * - Auto-runs on server startup (first call triggers background init)
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('🚀 OSINT Feed API called');

    // Step 1: Aggregate OSINT sources
    const events = await aggregateOsintFeedSequential();
    console.log(`✅ Aggregated ${events.length} events`);

    // Step 2: Verify critical events on blockchain
    const verifiedEvents = [];
    for (const event of events) {
      try {
        if (event.severity === 'CRITICAL' || event.credibility >= 80) {
          const hash = generateHash(event);
          const txHash = await storeEventOnBlockchain(hash);
          
          verifiedEvents.push({
            ...event,
            verified: true,
            txHash,
            explorer: getExplorerLink(txHash),
          });
          
          console.log(`✅ Verified: ${event.title}`);
        } else {
          verifiedEvents.push({
            ...event,
            verified: false,
          });
        }
      } catch (error) {
        console.warn(`⚠️  Could not verify: ${event.title}`, error);
        verifiedEvents.push({
          ...event,
          verified: false,
          error: 'Blockchain verification failed',
        });
      }
    }

    const duration = Date.now() - startTime;
    console.log(`⏱️ OSINT processing complete: ${duration}ms`);

    // Step 3: Send critical events to Telegram
    const telegramStart = Date.now();
    let sentCount = 0;
    for (const event of verifiedEvents) {
      if (event.severity === 'CRITICAL') {
        const success = await sendCriticalEventToTelegram(event);
        if (success) sentCount++;
      }
    }
    console.log(`📨 Telegram notifications sent: ${sentCount} in ${Date.now() - telegramStart}ms`);

    return NextResponse.json({
      success: true,
      events: verifiedEvents,
      count: verifiedEvents.length,
      telegramSent: sentCount,
      duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ OSINT Feed error:', errorMsg);

    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/osint-feed/stream
 * Streams events one by one as they're processed
 * Uses Server-Sent Events (SSE) for real-time updates
 */
export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        console.log('🚀 OSINT Feed Stream started');
        
        // Send initial status
        sendEvent({ type: 'status', message: 'Fetching signals...' });

        // Fetch signals
        const signalsRes = await fetch('http://localhost:3400/api/signals', {
          method: 'GET',
        }).catch(() => null);

        if (!signalsRes || !signalsRes.ok) {
          sendEvent({ type: 'error', message: 'Could not fetch signals' });
          controller.close();
          return;
        }

        const signalsData = await signalsRes.json();
        const allSignals = signalsData.signals || [];
        const criticalSignals = allSignals.filter((s: any) => 
          ['CRITICAL', 'HIGH'].includes(s.severity)
        );

        sendEvent({ 
          type: 'status', 
          message: `Found ${criticalSignals.length} critical signals`,
          total: criticalSignals.length 
        });

        // Process each signal one by one
        for (let i = 0; i < criticalSignals.length; i++) {
          const signal = criticalSignals[i];
          
          sendEvent({
            type: 'processing',
            index: i + 1,
            total: criticalSignals.length,
            title: signal.title,
            severity: signal.severity
          });

          // AI Analysis
          const { analyzeEvent } = await import('@/lib/ai/gemini');
          const signalInput = {
            title: signal.title || '',
            description: signal.summary || signal.title || '',
            category: signal.category || 'intelligence',
            region: signal.region || 'Global',
            actors: []
          };

          let aiAnalysis;
          try {
            aiAnalysis = await analyzeEvent(signalInput);
          } catch (error) {
            aiAnalysis = {
              root_cause: 'Analysis pending',
              causal_chain: ['Event detected'],
              stakeholders: ['Regional powers'],
              escalation_probability: 40,
              timeline: '3-7 days',
              market_impact: { oil: 'Monitoring', stocks: 'Monitoring', crypto: 'Monitoring', bonds: 'Monitoring' }
            };
          }

          // Blockchain Verification
          let verified = false;
          let txHash = null;
          let explorer = null;

          if (signal.severity === 'CRITICAL' || signal.credibility >= 80) {
            try {
              const event = {
                id: signal.id || `signal-${Math.random()}`,
                title: signal.title,
                description: signal.summary || signal.title,
                location: signal.region || 'Global',
                severity: signal.severity,
                credibility: signal.credibility || 90,
                ai_analysis: JSON.stringify(aiAnalysis)
              };
              
              const hash = generateHash(event as any);
              txHash = await storeEventOnBlockchain(hash);
              explorer = getExplorerLink(txHash);
              verified = true;
            } catch (err) {
              console.warn('Blockchain verification failed:', err);
            }
          }

          // Send completed event
          sendEvent({
            type: 'event',
            index: i + 1,
            total: criticalSignals.length,
            data: {
              id: signal.id || `signal-${Math.random()}`,
              title: signal.title,
              description: signal.summary || signal.title,
              location: signal.region || 'Global',
              severity: signal.severity,
              credibility: signal.credibility || 90,
              ai_analysis: JSON.stringify(aiAnalysis),
              verified,
              txHash,
              explorer,
              sources: [signal.source || 'Dashboard'],
              timestamp: signal.timestamp || new Date().toISOString()
            }
          });

          // Send to Telegram if critical
          if (signal.severity === 'CRITICAL' && verified) {
            try {
              await sendCriticalEventToTelegram({
                id: signal.id,
                title: signal.title,
                description: signal.summary || signal.title,
                location: signal.region || 'Global',
                severity: signal.severity,
                credibility: signal.credibility || 90,
                ai_analysis: JSON.stringify(aiAnalysis),
                verified: true,
                txHash: txHash || undefined,
                explorer: explorer || undefined,
                sources: [signal.source || 'Dashboard'],
                timestamp: signal.timestamp || new Date().toISOString()
              });
            } catch (err) {
              console.warn('Telegram notification failed:', err);
            }
          }
        }

        sendEvent({ type: 'complete', message: 'All events processed' });
        controller.close();
        
      } catch (error) {
        console.error('Stream error:', error);
        sendEvent({ type: 'error', message: 'Processing failed' });
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

/**
 * Server startup initialization
 * Triggers background analysis when the server first starts
 */
function initializeServerStartup() {
  if (serverStartupComplete) return;
  serverStartupComplete = true;
  
  console.log('🔥 Server startup detected - triggering initial OSINT analysis...');
  
  // Run in background without blocking
  setTimeout(async () => {
    try {
      console.log('🚀 Auto-starting OSINT analysis on server startup...');
      
      // Fetch and analyze events
      const events = await aggregateOsintFeedSequential();
      console.log(`✅ Startup analysis complete: ${events.length} events ready`);
      
      // Pre-verify critical events on blockchain in background
      const criticalEvents = events.filter(e => e.severity === 'CRITICAL' || (e.credibility || 0) >= 80);
      console.log(`🔗 Pre-verifying ${criticalEvents.length} critical events on blockchain...`);
      
      for (const event of criticalEvents.slice(0, 3)) { // Limit to first 3 to avoid overload
        try {
          const hash = generateHash(event);
          const txHash = await storeEventOnBlockchain(hash);
          console.log(`✅ Pre-verified: ${event.title} → ${txHash}`);
        } catch (err) {
          console.warn(`⚠️  Pre-verification failed for: ${event.title}`);
        }
      }
      
      console.log('🎯 Server startup initialization complete!');
    } catch (error) {
      console.error('❌ Server startup analysis failed:', error);
    }
  }, 5000); // Wait 5 seconds after server start to ensure everything is loaded
}

// Trigger startup initialization when this module loads
initializeServerStartup();
