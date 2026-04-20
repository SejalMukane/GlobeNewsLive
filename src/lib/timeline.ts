import { Signal, CrisisTimeline, TimelineEvent, Severity } from '@/types';

/**
 * Creates a CrisisTimeline from an array of signals
 * Filters signals by region and time range, then converts them to timeline events
 */
export function createTimelineFromSignals(
  signals: Signal[],
  region: string,
  timeRange: '24h' | '7d' | '30d'
): CrisisTimeline {
  if (!Array.isArray(signals)) {
    console.warn('⚠️ Signals not an array:', signals);
    signals = [];
  }

  console.log(`📊 Creating timeline: Region=${region}, TimeRange=${timeRange}, Total Signals=${signals.length}`);

  // Calculate time cutoff based on timeRange
  const now = new Date();
  const cutoffDate = new Date();
  
  switch (timeRange) {
    case '24h':
      cutoffDate.setHours(cutoffDate.getHours() - 24);
      break;
    case '7d':
      cutoffDate.setDate(cutoffDate.getDate() - 7);
      break;
    case '30d':
      cutoffDate.setDate(cutoffDate.getDate() - 30);
      break;
  }

  // Filter signals by region and time range
  const filteredSignals = signals.filter((signal) => {
    const signalTime = new Date(signal.timestamp);
    const timeMatch = signalTime >= cutoffDate && signalTime <= now;
    
    // Region matching (simple string match, can be enhanced with geolocation)
    const regionMatch = region === 'All' || signal.title.toLowerCase().includes(region.toLowerCase());
    
    return timeMatch && regionMatch;
  });

  console.log(`✅ Filtered to ${filteredSignals.length} signals for region/time`);

  // Convert signals to timeline events
  const events: TimelineEvent[] = filteredSignals
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .map((signal) => ({
      id: signal.id,
      timestamp: new Date(signal.timestamp),
      title: signal.title,
      description: signal.summary || signal.title,
      category: signal.category,
      severity: signal.severity,
      region: region,
      source: signal.source,
      tags: generateTags(signal),
      impact: generateImpact(signal.severity),
    }));

  console.log(`📅 Created ${events.length} timeline events`);

  // Determine overall severity
  const overallSeverity = getOverallSeverity(events);

  // Create timeline
  const timeline: CrisisTimeline = {
    id: `${region}-${timeRange}-${Date.now()}`,
    name: generateTimelineName(region),
    region: region,
    startDate: filteredSignals.length > 0 
      ? new Date(Math.min(...filteredSignals.map(s => new Date(s.timestamp).getTime())))
      : cutoffDate,
    endDate: now,
    events: events,
    severity: overallSeverity,
    description: `Crisis timeline for ${region} over the last ${timeRange}`,
  };

  console.log(`🎬 Timeline created: ${timeline.name} (${timeline.events.length} events)`);

  return timeline;
}

/**
 * Generates appropriate tags for a signal based on its content and category
 */
function generateTags(signal: Signal): string[] {
  const tags: string[] = [signal.category];

  // Add severity as a tag
  const severityMap: Record<Severity, string> = {
    CRITICAL: 'critical-alert',
    HIGH: 'high-priority',
    MEDIUM: 'medium-alert',
    LOW: 'low-priority',
    INFO: 'informational',
  };
  tags.push(severityMap[signal.severity] || 'alert');

  // Add source-based tags
  if (signal.source) {
    tags.push(`source:${signal.source.toLowerCase().replace(/\s+/g, '-')}`);
  }

  // Add content-based tags (simple keyword detection)
  const titleLower = signal.title.toLowerCase();
  if (titleLower.includes('cyber')) tags.push('cyber-security');
  if (titleLower.includes('military')) tags.push('military-ops');
  if (titleLower.includes('economic') || titleLower.includes('market')) tags.push('economic');
  if (titleLower.includes('shipping') || titleLower.includes('supply')) tags.push('shipping');
  if (titleLower.includes('oil') || titleLower.includes('energy')) tags.push('energy');

  return [...new Set(tags)]; // Remove duplicates
}

/**
 * Generates an impact description based on severity
 */
function generateImpact(severity: Severity): string {
  const impactMap: Record<Severity, string> = {
    CRITICAL: 'Immediate threat to regional stability and global markets',
    HIGH: 'Significant impact on regional security and economic indicators',
    MEDIUM: 'Moderate concerns for affected region and related sectors',
    LOW: 'Limited immediate impact, requires monitoring',
    INFO: 'Informational update, no immediate threat',
  };
  return impactMap[severity];
}

/**
 * Determines the overall severity of a crisis based on its events
 */
function getOverallSeverity(events: TimelineEvent[]): Severity {
  if (events.length === 0) return 'INFO';

  // If any event is CRITICAL, return CRITICAL
  if (events.some((e) => e.severity === 'CRITICAL')) return 'CRITICAL';
  
  // If more than 30% of events are HIGH, return HIGH
  const highCount = events.filter((e) => e.severity === 'HIGH').length;
  if (highCount / events.length > 0.3) return 'HIGH';
  
  // If any event is HIGH, return MEDIUM
  if (events.some((e) => e.severity === 'HIGH')) return 'MEDIUM';
  
  return 'LOW';
}

/**
 * Generates a descriptive name for the timeline
 */
function generateTimelineName(region: string): string {
  const regionNames: Record<string, string> = {
    'Middle East': 'Middle East Regional Crisis',
    'Ukraine': 'Ukraine Conflict Timeline',
    'Asia-Pacific': 'Asia-Pacific Developments',
    'Africa': 'African Regional Events',
    'Europe': 'European Security Situation',
    'All': 'Global Crisis Timeline',
  };

  return regionNames[region] || `${region} Crisis Timeline`;
}

/**
 * Finds all events linked to a given event based on tags and impact relationships
 * Shows cause → effect → impact chain
 */
export function findLinkedEvents(
  selectedEvent: TimelineEvent,
  allEvents: TimelineEvent[]
): TimelineEvent[] {
  const linkedEvents: TimelineEvent[] = [];
  const commonTags = selectedEvent.tags || [];

  // Filter related events
  allEvents.forEach((event) => {
    // Don't include the selected event itself
    if (event.id === selectedEvent.id) return;

    // Calculate relevance score
    let relevanceScore = 0;

    // 1. Shared tags (strong connection)
    const eventTags = event.tags || [];
    const sharedTags = commonTags.filter((tag) => eventTags.includes(tag));
    relevanceScore += sharedTags.length * 30;

    // 2. Same category (medium connection)
    if (event.category === selectedEvent.category) {
      relevanceScore += 20;
    }

    // 3. Related categories (weak connection)
    const relatedCategories: Record<string, string[]> = {
      conflict: ['military', 'diplomacy', 'terrorism'],
      military: ['conflict', 'cyber', 'diplomacy'],
      cyber: ['military', 'infrastructure', 'economy'],
      disaster: ['infrastructure', 'economy'],
      economy: ['politics', 'trade', 'infrastructure', 'cyber'],
      politics: ['diplomacy', 'economy'],
      terrorism: ['conflict', 'military'],
      diplomacy: ['politics', 'conflict'],
      protest: ['politics', 'conflict'],
      infrastructure: ['disaster', 'economy', 'cyber'],
    };

    if (
      relatedCategories[selectedEvent.category]?.includes(event.category)
    ) {
      relevanceScore += 10;
    }

    // 4. Temporal proximity (events within 6 hours)
    const timeDiff = Math.abs(
      event.timestamp.getTime() - selectedEvent.timestamp.getTime()
    );
    const hoursApart = timeDiff / (1000 * 60 * 60);
    if (hoursApart < 6) {
      relevanceScore += Math.max(0, 20 - hoursApart * 3);
    }

    // 5. Severity correlation (cascading impact)
    if (
      event.severity === 'CRITICAL' ||
      selectedEvent.severity === 'CRITICAL'
    ) {
      relevanceScore += 15;
    }

    // Add event if relevance score is above threshold
    if (relevanceScore > 15) {
      linkedEvents.push(event);
    }
  });

  // Sort by relevance (temporal order primarily, then by severity)
  return linkedEvents.sort((a, b) => {
    // First, prioritize by time - events that happen after
    const aAfter = a.timestamp.getTime() - selectedEvent.timestamp.getTime();
    const bAfter = b.timestamp.getTime() - selectedEvent.timestamp.getTime();

    // If one event is before and one after, prioritize after events
    if ((aAfter > 0) !== (bAfter > 0)) {
      return aAfter > 0 ? -1 : 1;
    }

    // Then by severity
    const severityOrder: Record<Severity, number> = {
      CRITICAL: 5,
      HIGH: 4,
      MEDIUM: 3,
      LOW: 2,
      INFO: 1,
    };
    return (
      severityOrder[b.severity] - severityOrder[a.severity]
    );
  });
}

/**
 * Generates impact chain visualization data showing how events cascade
 */
export function generateImpactChain(
  selectedEvent: TimelineEvent,
  linkedEvents: TimelineEvent[]
): {
  cause: TimelineEvent[];
  effect: TimelineEvent[];
  impact: TimelineEvent[];
} {
  const cause: TimelineEvent[] = [];
  const effect: TimelineEvent[] = [];
  const impact: TimelineEvent[] = [];

  linkedEvents.forEach((event) => {
    const timeDiff =
      event.timestamp.getTime() - selectedEvent.timestamp.getTime();

    // Events before selected event = causes
    if (timeDiff < -3600000) {
      // More than 1 hour before
      cause.push(event);
    }
    // Events shortly after = immediate effects
    else if (timeDiff > 0 && timeDiff < 3600000) {
      // Within 1 hour after
      effect.push(event);
    }
    // Events later = cascading impacts
    else if (timeDiff >= 3600000) {
      // More than 1 hour after
      impact.push(event);
    }
  });

  return { cause, effect, impact };
}
