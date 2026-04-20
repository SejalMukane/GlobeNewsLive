'use client';

import { useEffect, useState } from 'react';
import { Link2 } from 'lucide-react';

/**
 * Verification result from backend API
 */
interface VerificationResult {
  verified: boolean;
  hash: string;
  txHash: string | null;
  explorer?: string;
  cached?: boolean;
  error?: string;
}

/**
 * Event object structure for verification
 */
interface VerifiableEvent {
  id: string;
  title: string;
  severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  type?: string;
  [key: string]: any; // Allow other properties
}

interface VerificationBadgeProps {
  event: VerifiableEvent;
  className?: string;
}

/**
 * Determines if an event should be blockchain verified
 * Criteria: CRITICAL severity OR conflict/disaster type
 */
function shouldVerifyEvent(event: VerifiableEvent): boolean {
  const isCritical = event.severity === 'CRITICAL';
  const isConflict = event.type === 'conflict';
  const isDisaster = event.type === 'disaster';

  return isCritical || isConflict || isDisaster;
}

/**
 * Silent, background blockchain verification component
 * 
 * Features:
 * - Auto-verifies critical events in background
 * - Shows subtle "🔗 Blockchain Verified" badge
 * - Provides clickable "View Proof" link to explorer
 * - Fails silently (no error UI)
 * - No loading indicators (verification is invisible)
 * - Caches verification results server-side
 * 
 * Usage:
 * <VerificationBadge event={event} />
 * <VerificationBadge event={event} className="ml-2" />
 */
export default function VerificationBadge({
  event,
  className = '',
}: VerificationBadgeProps) {
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  /**
   * Effect: Trigger verification on component mount
   * Runs once per unique event
   */
  useEffect(() => {
    // Check if event should be verified
    if (!shouldVerifyEvent(event)) {
      return;
    }

    // Prevent multiple verification attempts
    if (isVerifying || verification) {
      return;
    }

    const verifyEvent = async () => {
      setIsVerifying(true);
      try {
        // Call verification API
        const response = await fetch('/api/verify-event', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        });

        // Only process successful responses
        if (!response.ok) {
          console.debug(
            `Verification API returned ${response.status} for event ${event.id}`
          );
          return;
        }

        const result: VerificationResult = await response.json();

        // Store result (success or failure)
        setVerification(result);

        // Log result for debugging (silent for users)
        if (result.verified) {
          console.debug(
            `✅ Event verified on blockchain - ID: ${event.id}, TxHash: ${result.txHash?.substring(0, 16)}...`
          );
        } else {
          console.debug(`⚠️ Event verification failed - ID: ${event.id}`);
        }
      } catch (error) {
        // Fail silently
        console.debug(`Verification fetch error for event ${event.id}:`, error);
      } finally {
        setIsVerifying(false);
      }
    };

    // Trigger verification asynchronously (non-blocking)
    verifyEvent();
  }, [event.id, event]); // Re-verify if event changes

  // Only show badge if verification succeeded
  if (!verification?.verified) {
    return null;
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {/* Verification Badge */}
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
        <Link2 className="w-3 h-3" />
        Blockchain Verified
      </span>

      {/* View Proof Link */}
      {verification.explorer && (
        <a
          href={verification.explorer}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-emerald-400/70 hover:text-emerald-400 underline transition"
          title={`View proof on XDC Explorer: ${verification.txHash}`}
        >
          View Proof
        </a>
      )}
    </div>
  );
}

/**
 * Export helper for checking if event qualifies for verification
 * Useful for other components that need this logic
 */
export { shouldVerifyEvent };
