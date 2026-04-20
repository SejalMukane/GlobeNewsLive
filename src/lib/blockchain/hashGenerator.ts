import crypto from 'crypto';

/**
 * Generates a deterministic SHA-256 hash of an event object
 * @param event - The event object to hash
 * @returns Hex string of the SHA-256 hash
 */
export function generateHash(event: Record<string, any>): string {
  // Create a deterministic string representation of the event
  // by sorting keys to ensure same event always produces same hash
  const eventString = JSON.stringify(event, (key, value) => {
    // Sort object keys to ensure deterministic output
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return Object.keys(value)
        .sort()
        .reduce((sorted, key) => {
          sorted[key] = value[key];
          return sorted;
        }, {} as Record<string, any>);
    }
    return value;
  });

  // Generate SHA-256 hash
  const hash = crypto.createHash('sha256').update(eventString).digest('hex');

  return hash;
}

/**
 * Validates if a hash is a valid hex string
 * @param hash - The hash to validate
 * @returns True if valid hex string, false otherwise
 */
export function isValidHash(hash: string): boolean {
  return /^[a-f0-9]{64}$/.test(hash);
}

/**
 * Generates hash and returns both the hash and the stringified event
 * Useful for debugging and verification
 * @param event - The event object to hash
 * @returns Object with hash and eventString
 */
export function generateHashWithDebug(event: Record<string, any>): {
  hash: string;
  eventString: string;
} {
  const eventString = JSON.stringify(event, (key, value) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return Object.keys(value)
        .sort()
        .reduce((sorted, key) => {
          sorted[key] = value[key];
          return sorted;
        }, {} as Record<string, any>);
    }
    return value;
  });

  const hash = crypto.createHash('sha256').update(eventString).digest('hex');

  return { hash, eventString };
}
