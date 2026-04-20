export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export type SignalCategory = 
  | 'conflict' 
  | 'military' 
  | 'diplomacy' 
  | 'cyber' 
  | 'disaster' 
  | 'economy' 
  | 'politics' 
  | 'terrorism'
  | 'protest'
  | 'infrastructure';

export interface Signal {
  id: string;
  title: string;
  severity: Severity;
  category: SignalCategory;
  source: string;
  sourceUrl?: string;
  timeAgo: string;
  timestamp: Date;
  lat?: number;
  lon?: number;
  summary?: string;
}

export interface MarketData {
  name: string;
  symbol: string;
  value: string;
  change: string;
  changePercent: string;
  direction: 'up' | 'down';
}

export interface PredictionMarket {
  id: string;
  question: string;
  probability: number;
  change24h: number;
  volume?: number;
  source: 'Polymarket' | 'Kalshi';
  category: string;
}

export interface ConflictMarker {
  id: string;
  lat: number;
  lon: number;
  name: string;
  type: 'conflict' | 'military' | 'protest' | 'disaster' | 'infrastructure';
  severity: Severity;
  description?: string;
  timestamp: Date;
}

export interface CountryRisk {
  code: string;
  name: string;
  cii: number; // Country Instability Index 0-100
  trend: 'rising' | 'falling' | 'stable';
  activeConflicts: number;
}

export type ThreatLevel = 'LOW' | 'GUARDED' | 'ELEVATED' | 'HIGH' | 'SEVERE';

export interface DashboardState {
  threatLevel: ThreatLevel;
  activeConflicts: number;
  militaryAlerts: number;
  lastUpdate: Date;
  timeFilter: '1h' | '6h' | '24h' | '48h' | '7d';
  activeLayers: string[];
}

// ===== PERSONALIZED DASHBOARD TYPES =====

export type RiskPriority = 'economy' | 'security' | 'travel' | 'all';

export interface UserPreferences {
  // Identity
  userId: string;
  dashboardName?: string;
  createdAt: Date;
  updatedAt: Date;

  // Selected Regions (Countries)
  regions: string[]; // e.g., ['India', 'USA', 'Middle East']

  // Interest Categories
  interests: SignalCategory[]; // Which types of signals matter to user

  // Risk Priority Level
  riskPriority: RiskPriority;

  // Notification Settings
  notificationSettings: {
    minSeverity: Severity; // Only notify HIGH, CRITICAL, etc
    soundEnabled: boolean;
    desktopNotifications: boolean;
  };

  // Pinned Events
  pinnedEventIds: string[];

  // Custom Risk Threshold (0-100)
  riskThreshold: number;
}

export interface PersonalizedAlert extends Signal {
  isPinned: boolean;
  riskScore: number; // 0-100, specifically for this user's context
  relevanceScore: number; // How relevant to user's preferences (0-100)
}

export interface PinnedEvent {
  id: string;
  signalId: string;
  title: string;
  region: string;
  category: SignalCategory;
  pinnedAt: Date;
  notes?: string;
}

export interface UserRiskScore {
  userId: string;
  overallRisk: number; // 0-100
  regionRisks: {
    region: string;
    risk: number;
    trend: 'rising' | 'falling' | 'stable';
  }[];
  categoryRisks: {
    category: SignalCategory;
    risk: number;
  }[];
  lastUpdated: Date;
}

// ===== CRISIS TIMELINE & EVENT LINKING TYPES =====

export interface TimelineEvent {
  id: string;
  timestamp: Date;
  title: string;
  description?: string;
  category: SignalCategory;
  severity: Severity;
  region: string;
  impact?: string;
  source: string;
  tags: string[]; // For linking: 'oil', 'shipping', 'market', 'military', etc
}

export interface CrisisTimeline {
  id: string;
  name: string; // e.g., "Ukraine Conflict", "Middle East Escalation"
  region: string;
  startDate: Date;
  endDate: Date;
  events: TimelineEvent[];
  severity: Severity;
  description?: string;
}

export interface TimelineReplayState {
  isPlaying: boolean;
  currentIndex: number; // Which event we're at
  speed: number; // 1x, 2x, 4x
  playbackTime: Date; // What time we're replaying
  totalDuration: number; // In seconds
}

export interface LinkedEvent {
  id: string;
  type: 'conflict' | 'market' | 'news' | 'shipping' | 'infrastructure';
  title: string;
  timestamp: Date;
  impact: string; // e.g., "oil price +5%"
  relationship: 'cause' | 'effect' | 'related';
  sourceEventId: string;
}

export interface EventLink {
  sourceEventId: string;
  targetEventId: string;
  relationship: 'causes' | 'triggered_by' | 'correlates_with';
  strength: number; // 0-100, confidence level
  description: string;
}
