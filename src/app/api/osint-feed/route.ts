import { NextRequest, NextResponse } from 'next/server';
import { aggregateOsintFeed } from '@/lib/osint/aggregator';
import { storeEventOnBlockchain, getExplorerLink } from '@/lib/blockchain/xdcClient';
import { generateHash } from '@/lib/blockchain/hashGenerator';

/**
 * POST /api/osint-feed
 * Aggregates OSINT data and returns events with AI analysis
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('🚀 OSINT Feed API called');

    // Step 1: Aggregate OSINT sources
    const events = await aggregateOsintFeed();
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

    return NextResponse.json({
      success: true,
      events: verifiedEvents,
      count: verifiedEvents.length,
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
 * GET /api/osint-feed
 * Returns info about OSINT feed
 */
export async function GET() {
  return NextResponse.json({
    name: 'OSINT Feed API',
    description: 'Aggregates OSINT sources with AI analysis and blockchain verification',
    endpoints: {
      post: 'POST - Trigger OSINT aggregation',
      status: 'GET - This endpoint',
    },
    features: [
      'Multi-source OSINT aggregation',
      'AI clustering & extraction (Groq)',
      'Causality analysis (Google AI)',
      'Crisis prediction (Google AI)',
      'OpenRouter fallback',
      'Result caching',
      'Blockchain verification',
    ],
  });
}
