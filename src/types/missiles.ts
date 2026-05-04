/**
 * North Korea Missile Tests Integration Types
 * Bridges nk-missile-tests data with GlobeNewsLive crisis timeline system
 */

export type MissileType = 'SRBM' | 'MRBM' | 'IRBM' | 'ICBM' | 'SLBM' | 'SLV' | 'HGV' | 'Unknown';
export type TestOutcome = 'success' | 'failure' | 'unknown';
export type MissileManeuver = 'ballistic' | 'pullup' | 'glide' | 'unknown';

/**
 * Core missile test data structure
 */
export interface MissileTest {
  id: string; // Unique identifier
  date: string; // YYYY-MM-DD format
  time: string; // HH:MM or "unknown"
  missile: MissileInfo;
  testName: string; // Human readable name
  facility: FacilityInfo;
  outcome: TestOutcome;
  severity: Severity; // Mapped from outcome
  
  // Flight characteristics
  apogee?: number; // km, "unknown" if not available
  distance?: number; // km, "unknown" if not available
  bearing?: number; // degrees
  maneuver: MissileManeuver;
  
  // Landing info
  landingLocation: {
    name: string;
    lat: number;
    lon: number;
  };
  
  // Metadata
  series?: number; // Test series number
  description: string;
  glideWaypoints?: GlideWaypoint[];
  
  // Visualization
  lineGeometry?: any; // Three.js geometry (set at runtime)
  marker?: any; // DOM element (set at runtime)
}

export interface GlideWaypoint {
  distance: number;
  lat: number;
  lon: number;
}

/**
 * Missile metadata
 */
export interface MissileInfo {
  id: string;
  name: string;
  type: MissileType;
  color?: number; // Hex color for visualization
  maneuver?: MissileManeuver;
  description?: string;
  nickname?: string; // KN-23, Hwasong-15, etc
}

/**
 * Launch facility metadata
 */
export interface FacilityInfo {
  id: string;
  name: string;
  lat: number;
  lon: number;
  type?: string; // "test_site", "launch_pad", "airbase", etc
  capacity?: string;
}

/**
 * Timeline of missile tests grouped by year
 */
export interface MissileTimeline {
  year: number;
  tests: MissileTest[];
  successCount: number;
  failureCount: number;
  unknownCount: number;
  totalDistance: number; // km
  maxApogee: number; // km
}

/**
 * Global missile database
 */
export interface MissileDatabase {
  missiles: Record<string, MissileInfo>;
  facilities: Record<string, FacilityInfo>;
  timelines: MissileTimeline[];
  statistics: {
    totalTests: number;
    successRate: number;
    failureRate: number;
    unknownRate: number;
    timespan: { start: number; end: number };
  };
}

/**
 * Map test outcome to crisis severity
 */
export function outcomeToSeverity(outcome: TestOutcome): Severity {
  switch (outcome) {
    case 'success':
      return 'CRITICAL'; // Successful test is critical escalation
    case 'failure':
      return 'MEDIUM'; // Failure is concerning but less immediate
    case 'unknown':
      return 'HIGH'; // Unknown test is high priority intel
    default:
      return 'MEDIUM';
  }
}

/**
 * Convert missile test to Signal for crisis timeline
 */
export interface MissileSignal {
  id: string;
  timestamp: Date;
  title: string; // "Missile Test: Hwasong-15"
  summary: string; // Detailed description
  category: 'military' | 'conflict'; // Always military-related
  severity: Severity;
  region: 'North Korea' | 'East Asia' | 'Asia-Pacific'; // Based on facility
  source: 'CNS Database'; // North Korea Missile Test Database
  tags: string[];
  
  // Additional missile-specific data
  missileData: MissileTest;
  
  // Location
  launchSite: {
    name: string;
    lat: number;
    lon: number;
  };
  
  landingSite?: {
    name: string;
    lat: number;
    lon: number;
  };
}

/**
 * Severity levels
 */
export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

/**
 * Visualization 3D coordinates
 */
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Missile trajectory for visualization
 */
export interface MissileTrajectory {
  startPoint: Vector3;
  endPoint: Vector3;
  apogeePoint: Vector3;
  waypoints: Vector3[];
  distance: number; // km
  apogee: number; // km
}

/**
 * NK Missile Tests Visualization State
 */
export interface MissileVisualizationState {
  selectedTest?: MissileTest;
  selectedYear?: number;
  selectedMissileType?: MissileType;
  selectedOutcome?: TestOutcome;
  
  // UI state
  showTrajectories: boolean;
  showFacilities: boolean;
  showLabels: boolean;
  
  // Camera state
  cameraPosition: Vector3;
  cameraRotation: {
    x: number;
    y: number;
    z: number;
  };
  zoom: number;
  
  // Playback state
  isPlaying: boolean;
  playbackSpeed: number; // 0.5x, 1x, 2x, 4x
  currentYear: number;
}

/**
 * API response for missile data
 */
export interface MissileAPIResponse {
  success: boolean;
  data: MissileDatabase;
  signals: MissileSignal[];
  timestamp: string;
  cacheKey?: string;
}
