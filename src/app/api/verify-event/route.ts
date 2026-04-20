import { NextRequest, NextResponse } from 'next/server';
import { generateHash, isValidHash } from '@/lib/blockchain/hashGenerator';
import { storeEventOnBlockchain, getExplorerLink } from '@/lib/blockchain/xdcClient';

/**
 * Standardized API response format
 */
interface VerifyEventResponse {
  verified: boolean;
  hash: string;
  txHash: string | null;
  explorer?: string | null;
  cached?: boolean;
  error?: string;
}

/**
 * Cache entry structure
 */
interface CacheEntry {
  verified: boolean;
  txHash: string | null;
  timestamp: number;
}

/**
 * In-memory cache for verified event hashes
 * Key: SHA-256 hash
 * Value: { verified: boolean, txHash: string | null, timestamp: number }
 * 
 * Production Note: Consider adding TTL (time-to-live) cleanup
 * and size limits in a production environment
 */
const verificationCache = new Map<string, CacheEntry>();

/**
 * Gets cached verification result if exists
 * @param hash - SHA-256 hash
 * @returns Cache entry or undefined
 */
function getCachedVerification(hash: string): CacheEntry | undefined {
  return verificationCache.get(hash);
}

/**
 * Stores verification result in cache
 * @param hash - SHA-256 hash
 * @param verified - Verification status
 * @param txHash - Blockchain transaction hash (null if failed)
 */
function setCachedVerification(
  hash: string,
  verified: boolean,
  txHash: string | null = null
): void {
  verificationCache.set(hash, {
    verified,
    txHash,
    timestamp: Date.now(),
  });
}

/**
 * Creates standardized response object
 * @param verified - Verification status
 * @param hash - Event hash
 * @param txHash - Blockchain transaction hash
 * @param cached - Whether result came from cache
 * @param error - Error message if failed
 * @returns VerifyEventResponse
 */
function createResponse(
  verified: boolean,
  hash: string,
  txHash: string | null,
  cached: boolean = false,
  error?: string
): VerifyEventResponse {
  const response: VerifyEventResponse = {
    verified,
    hash,
    txHash,
    cached,
  };

  // Add explorer link if txHash exists
  if (txHash) {
    response.explorer = getExplorerLink(txHash);
  }

  // Add error message if provided
  if (error) {
    response.error = error;
  }

  return response;
}

/**
 * Validates event object
 * @param event - Event to validate
 * @returns true if valid, throws error otherwise
 */
function validateEvent(event: any): event is Record<string, any> {
  if (!event || typeof event !== 'object') {
    throw new Error('Invalid event object: must be a non-null object');
  }
  return true;
}

/**
 * POST /api/verify-event
 * Verifies an event by storing its hash on XDC blockchain
 * Uses in-memory cache to prevent duplicate transactions
 */
export async function POST(request: NextRequest): Promise<NextResponse<VerifyEventResponse>> {
  const startTime = Date.now();

  try {
    // Step 1: Parse and validate request
    let event: Record<string, any>;
    try {
      event = await request.json();
    } catch (parseError) {
      console.error('❌ Failed to parse JSON:', parseError);
      return NextResponse.json<VerifyEventResponse>(
        createResponse(false, '', null, false, 'Invalid JSON in request body'),
        { status: 400 }
      );
    }

    // Step 2: Validate event structure
    try {
      validateEvent(event);
    } catch (validationError) {
      console.error('❌ Event validation failed:', validationError);
      return NextResponse.json<VerifyEventResponse>(
        createResponse(false, '', null, false, (validationError as Error).message),
        { status: 400 }
      );
    }

    // Step 3: Generate hash
    const hash = generateHash(event);

    // Step 4: Validate hash format
    if (!isValidHash(hash)) {
      console.error('❌ Invalid hash generated for event');
      return NextResponse.json<VerifyEventResponse>(
        createResponse(false, hash, null, false, 'Failed to generate valid hash'),
        { status: 500 }
      );
    }

    // Step 5: Check cache
    const cached = getCachedVerification(hash);
    if (cached) {
      const cacheAge = Date.now() - cached.timestamp;
      console.log(
        `✅ Cache HIT - Hash: ${hash.substring(0, 16)}... (Age: ${cacheAge}ms, Cache size: ${verificationCache.size})`
      );
      
      return NextResponse.json<VerifyEventResponse>(
        createResponse(cached.verified, hash, cached.txHash, true),
        { status: 200 }
      );
    }

    // Step 6: Cache miss - proceed to blockchain verification
    console.log(
      `📝 Cache MISS - Hash: ${hash.substring(0, 16)}... (Cache size: ${verificationCache.size})`
    );

    let txHash: string | null = null;

    try {
      // Step 7: Send to blockchain
      console.log(`🔗 Sending hash to blockchain...`);
      txHash = await storeEventOnBlockchain(hash);
      console.log(
        `✅ Successfully stored on blockchain - TxHash: ${txHash.substring(0, 16)}...`
      );

      // Step 8: Cache successful result
      setCachedVerification(hash, true, txHash);

      const duration = Date.now() - startTime;
      console.log(`⏱️ Total verification time: ${duration}ms`);

      return NextResponse.json<VerifyEventResponse>(
        createResponse(true, hash, txHash, false),
        { status: 200 }
      );
    } catch (blockchainError) {
      const errorMessage = blockchainError instanceof Error 
        ? blockchainError.message 
        : 'Unknown blockchain error';

      console.error(
        `❌ Blockchain transaction failed - Hash: ${hash.substring(0, 16)}... Error: ${errorMessage}`
      );

      // Step 9: Cache failed verification (but don't spam blockchain)
      setCachedVerification(hash, false, null);

      const duration = Date.now() - startTime;
      console.log(`⏱️ Failed verification time: ${duration}ms`);

      return NextResponse.json<VerifyEventResponse>(
        createResponse(
          false,
          hash,
          null,
          false,
          `Blockchain verification failed: ${errorMessage}`
        ),
        { status: 503 } // 503 Service Unavailable - blockchain unreachable
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Unexpected error in verify-event: ${errorMessage}`, error);

    return NextResponse.json<VerifyEventResponse>(
      createResponse(false, '', null, false, 'Internal server error'),
      { status: 500 }
    );
  }
}

/**
 * GET /api/verify-event
 * Not supported
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to verify events.' },
    { status: 405 }
  );
}

/**
 * Optional: Cache management utility (for monitoring/debugging)
 * Can be called from a separate admin endpoint in production
 */
export function getCacheStatus() {
  return {
    size: verificationCache.size,
    entries: Array.from(verificationCache.entries()).map(([hash, entry]) => ({
      hash: `${hash.substring(0, 16)}...`,
      verified: entry.verified,
      hasTransaction: entry.txHash !== null,
      age: Date.now() - entry.timestamp,
    })),
  };
}
