import { Signal, PersonalizedAlert, UserPreferences, SignalCategory, Severity } from '@/types';

/**
 * Filters signals based on user preferences (regions and interests)
 */
export function filterSignalsByPreferences(
  signals: Signal[],
  preferences: UserPreferences
): PersonalizedAlert[] {
  if (!Array.isArray(signals)) return [];

  return signals
    .filter((signal) => {
      // Check if signal category matches user interests
      const categoryMatch =
        preferences.interests.length === 0 ||
        preferences.interests.includes(signal.category);

      // Check if signal meets minimum severity threshold
      const severityMatch = isSeverityAtLeast(signal.severity, preferences.notificationSettings.minSeverity);

      // For region-based filtering, we can check if the signal is relevant
      // This is a simplified check - you might want to add geolocation data
      return categoryMatch && severityMatch;
    })
    .map((signal) => ({
      ...signal,
      isPinned: preferences.pinnedEventIds.includes(signal.id),
      riskScore: calculateSignalRiskScore(signal, preferences),
      relevanceScore: calculateRelevanceScore(signal, preferences),
    }));
}

/**
 * Calculates risk score for a specific signal based on user context
 */
function calculateSignalRiskScore(signal: Signal, preferences: UserPreferences): number {
  let score = severityToScore(signal.severity);

  // Boost score if signal matches user's interests
  if (preferences.interests.includes(signal.category)) {
    score = Math.min(100, score * 1.2);
  }

  // Apply risk priority weight
  if (preferences.riskPriority === signal.category) {
    score = Math.min(100, score * 1.15);
  }

  return Math.round(score);
}

/**
 * Calculates how relevant a signal is to the user's preferences
 */
function calculateRelevanceScore(signal: Signal, preferences: UserPreferences): number {
  let score = 50; // Base relevance

  // Interest match
  if (preferences.interests.includes(signal.category)) {
    score += 30;
  }

  // Severity consideration
  const severityWeight = severityToScore(signal.severity) / 100;
  score = Math.round(score * (0.7 + 0.3 * severityWeight));

  return Math.min(100, score);
}

/**
 * Filters high-risk alerts above a certain threshold
 */
export function getHighRiskAlerts(
  signals: PersonalizedAlert[],
  threshold: number
): PersonalizedAlert[] {
  return signals.filter((signal) => signal.riskScore >= threshold);
}

/**
 * Groups signals by category
 */
export function groupSignalsByCategory(signals: PersonalizedAlert[]): Record<SignalCategory, PersonalizedAlert[]> {
  const categories: SignalCategory[] = [
    'conflict',
    'military',
    'diplomacy',
    'cyber',
    'disaster',
    'economy',
    'politics',
    'terrorism',
    'protest',
    'infrastructure',
  ];

  const grouped: Record<SignalCategory, PersonalizedAlert[]> = {} as Record<SignalCategory, PersonalizedAlert[]>;

  categories.forEach((cat) => {
    grouped[cat] = [];
  });

  signals.forEach((signal) => {
    if (grouped[signal.category]) {
      grouped[signal.category].push(signal);
    }
  });

  return grouped;
}

/**
 * Calculates overall user risk score from multiple signals
 */
export function calculateUserRiskScore(
  signals: PersonalizedAlert[],
  preferences: UserPreferences
): number {
  if (signals.length === 0) return 0;

  // Weighted average of risk scores
  let totalScore = 0;
  signals.forEach((signal) => {
    // Weight by relevance and recency
    const weight = (signal.relevanceScore / 100) * (1 + (isSeverityAtLeast(signal.severity, 'HIGH') ? 0.5 : 0));
    totalScore += signal.riskScore * weight;
  });

  return Math.round(Math.min(100, (totalScore / signals.length) * 1.2));
}

// ===== HELPER FUNCTIONS =====

/**
 * Converts severity to numeric score (0-100)
 */
function severityToScore(severity: Severity): number {
  const scoreMap: Record<Severity, number> = {
    INFO: 10,
    LOW: 25,
    MEDIUM: 50,
    HIGH: 75,
    CRITICAL: 100,
  };
  return scoreMap[severity] || 50;
}

/**
 * Checks if a severity level is at least as high as a threshold
 */
function isSeverityAtLeast(severity: Severity, threshold: Severity): boolean {
  const severityOrder: Severity[] = ['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const severityIndex = severityOrder.indexOf(severity);
  const thresholdIndex = severityOrder.indexOf(threshold);
  return severityIndex >= thresholdIndex;
}
