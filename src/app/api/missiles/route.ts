/**
 * API Route: /api/missiles
 * Loads North Korea missile test data and converts to crisis signals
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import {
  MissileSignal,
  MissileDatabase,
  MissileTest,
  MissileInfo,
  FacilityInfo,
  MissileTimeline,
  outcomeToSeverity,
  Severity,
} from '@/types/missiles';

// Cache for missile data (prevent repeated file reads)
let cachedData: {
  database: MissileDatabase | null;
  signals: MissileSignal[] | null;
  timestamp: number;
} = { database: null, signals: null, timestamp: 0 };

const CACHE_DURATION = 3600000; // 1 hour

/**
 * Load JSON data from nk-missile-tests directory
 */
function loadMissileData() {
  const nkMissileTestsPath = path.join(process.cwd(), '..', 'nk-missile-tests', 'data');

  try {
    // Load English data files
    const missileFile = fs.readFileSync(path.join(nkMissileTestsPath, 'missile.en.json'), 'utf8');
    const facilityFile = fs.readFileSync(path.join(nkMissileTestsPath, 'facility.en.json'), 'utf8');
    const testFile = fs.readFileSync(path.join(nkMissileTestsPath, 'test.en.json'), 'utf8');

    const missiles: Record<string, MissileInfo> = JSON.parse(missileFile);
    const facilitiesRaw = JSON.parse(facilityFile);
    const facilities = facilitiesRaw.facilities;
    const testData = JSON.parse(testFile);

    return { missiles, facilities, testData };
  } catch (error) {
    console.error('Failed to load missile data:', error);
    throw new Error('Failed to load missile test data');
  }
}

/**
 * Convert raw test data to MissileTest format
 */
function convertTestData(
  rawTest: any,
  missiles: Record<string, MissileInfo>,
  facilities: Record<string, FacilityInfo>
): MissileTest {
  const missileName = rawTest.missile || 'unknown';
  const missileInfo = missiles[missileName] || { id: missileName, name: 'Unknown', type: 'Unknown' };
  const facilityName = rawTest.facility || 'unknown';
  const facilityInfo = facilities[facilityName] || {
    id: facilityName,
    name: 'Unknown Location',
    lat: 39.2,
    lon: 125.67,
  };

  const outcome = (rawTest.outcome || 'unknown') as 'success' | 'failure' | 'unknown';
  const severity = outcomeToSeverity(outcome);

  // Parse date
  const dateStr = rawTest.date || new Date().toISOString().split('T')[0];
  const testDate = new Date(dateStr);

  return {
    id: `${dateStr}-${missileName}-${rawTest.series || '1'}`,
    date: dateStr,
    time: rawTest.time || 'unknown',
    missile: missileInfo,
    testName: `${dateStr} ${missileInfo.name}${rawTest.series ? ` [${rawTest.series}]` : ''}`,
    facility: facilityInfo,
    outcome,
    severity,
    apogee: parseNumber(rawTest.apogee),
    distance: parseNumber(rawTest.distance),
    bearing: rawTest.bearing || 90,
    maneuver: (missileInfo.maneuver || 'ballistic') as any,
    landingLocation: {
      name: rawTest.landing || 'Unknown',
      lat: facilityInfo.lat + Math.random() * 5, // Rough estimate
      lon: facilityInfo.lon + Math.random() * 5,
    },
    series: rawTest.series,
    description: rawTest.description || `Missile test of ${missileInfo.name}`,
  };
}

function parseNumber(value: any): number | undefined {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && !isNaN(parseInt(value))) {
    return parseInt(value);
  }
  return undefined;
}

/**
 * Convert MissileTest to MissileSignal for crisis timeline
 */
function testToSignal(test: MissileTest): MissileSignal {
  const timestamp = new Date(test.date);

  const title = `🚀 Missile Test: ${test.missile.name}${test.outcome === 'success' ? ' ✓' : test.outcome === 'failure' ? ' ✗' : ' ?'}`;

  const summary = `
    ${test.missile.name} test by North Korea
    Outcome: ${test.outcome.toUpperCase()}
    Apogee: ${test.apogee || 'unknown'} km
    Distance: ${test.distance || 'unknown'} km
    Facility: ${test.facility.name}
    ${test.description ? '\n' + test.description : ''}
  `.trim();

  const tags = [
    'missile-test',
    'north-korea',
    test.outcome === 'success' ? 'weapons-advancement' : 'test-failure',
    test.missile.type.toLowerCase(),
  ];

  if (test.distance && test.distance > 5000) tags.push('icbm-capable');
  if (test.outcome === 'success') tags.push('critical-threat');

  return {
    id: test.id,
    timestamp,
    title,
    summary,
    category: 'military',
    severity: test.severity,
    region: 'East Asia',
    source: 'CNS Database',
    tags,
    missileData: test,
    launchSite: {
      name: test.facility.name,
      lat: test.facility.lat,
      lon: test.facility.lon,
    },
    landingSite: test.landingLocation,
  };
}

/**
 * Build missile database from raw data
 */
function buildDatabase(
  missiles: Record<string, MissileInfo>,
  facilities: Record<string, FacilityInfo>,
  testData: any
): { database: MissileDatabase; signals: MissileSignal[] } {
  const timelines: MissileTimeline[] = [];
  const allTests: MissileTest[] = [];
  const allSignals: MissileSignal[] = [];

  // Process all test timebins (organized by year)
  for (const timeBin of testData.timeBins) {
    const year = timeBin.year;
    const yearTests: MissileTest[] = [];

    for (const rawTest of timeBin.data) {
      const test = convertTestData(rawTest, missiles, facilities);
      yearTests.push(test);
      allTests.push(test);

      const signal = testToSignal(test);
      allSignals.push(signal);
    }

    // Calculate stats for year
    const successCount = yearTests.filter((t) => t.outcome === 'success').length;
    const failureCount = yearTests.filter((t) => t.outcome === 'failure').length;
    const unknownCount = yearTests.filter((t) => t.outcome === 'unknown').length;
    const totalDistance = yearTests.reduce((sum, t) => sum + (t.distance || 0), 0);
    const maxApogee = Math.max(...yearTests.map((t) => t.apogee || 0));

    timelines.push({
      year,
      tests: yearTests,
      successCount,
      failureCount,
      unknownCount,
      totalDistance,
      maxApogee,
    });
  }

  // Calculate overall statistics
  const totalTests = allTests.length;
  const successCount = allTests.filter((t) => t.outcome === 'success').length;
  const failureCount = allTests.filter((t) => t.outcome === 'failure').length;

  const database: MissileDatabase = {
    missiles,
    facilities,
    timelines: timelines.sort((a, b) => a.year - b.year),
    statistics: {
      totalTests,
      successRate: totalTests > 0 ? (successCount / totalTests) * 100 : 0,
      failureRate: totalTests > 0 ? (failureCount / totalTests) * 100 : 0,
      unknownRate: totalTests > 0 ? ((totalTests - successCount - failureCount) / totalTests) * 100 : 0,
      timespan: {
        start: timelines[0]?.year || 1984,
        end: timelines[timelines.length - 1]?.year || new Date().getFullYear(),
      },
    },
  };

  return { database, signals: allSignals };
}

/**
 * GET /api/missiles - Retrieve missile test data
 */
export async function GET(request: NextRequest) {
  try {
    // Check cache
    const now = Date.now();
    if (
      cachedData.database &&
      cachedData.signals &&
      now - cachedData.timestamp < CACHE_DURATION
    ) {
      return NextResponse.json(
        {
          success: true,
          data: cachedData.database,
          signals: cachedData.signals,
          timestamp: new Date(cachedData.timestamp).toISOString(),
          cacheKey: 'hit',
        },
        { status: 200 }
      );
    }

    // Load fresh data
    const { missiles, facilities, testData } = loadMissileData();
    const { database, signals } = buildDatabase(missiles, facilities, testData);

    // Cache it
    cachedData = {
      database,
      signals,
      timestamp: now,
    };

    console.log(`✅ Loaded ${database.statistics.totalTests} missile tests`);
    console.log(
      `📊 Success Rate: ${database.statistics.successRate.toFixed(1)}% (${signals.filter(s => s.missileData.outcome === 'success').length} tests)`
    );

    return NextResponse.json(
      {
        success: true,
        data: database,
        signals,
        timestamp: new Date().toISOString(),
        cacheKey: 'miss',
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=3600',
        },
      }
    );
  } catch (error) {
    console.error('❌ Missile API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load missile data',
      },
      { status: 500 }
    );
  }
}
