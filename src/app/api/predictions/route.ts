import { NextResponse } from 'next/server';
import { format, parseISO, subMonths, subYears } from 'date-fns';

interface TestData {
  date: string;
  missile: string;
  type: string;
  facility: string;
  outcome: string;
}

interface TrendAnalysis {
  direction: 'increasing' | 'decreasing' | 'stable';
  slope: number;
  confidence: number;
  r2: number;
}

interface Forecast {
  month: string;
  predictedTests: number;
  confidenceInterval: [number, number];
}

interface Pattern {
  type: 'seasonal' | 'cyclical' | 'spike' | 'anomaly';
  description: string;
  strength: number;
  months: string[];
}

function calculateTrend(data: { month: string; count: number }[]): TrendAnalysis {
  const n = data.length;
  if (n < 2) return { direction: 'stable', slope: 0, confidence: 0, r2: 0 };

  const x = data.map((_, i) => i);
  const y = data.map(d => d.count);

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const yMean = sumY / n;
  const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
  const ssResidual = y.reduce((sum, yi, i) => sum + Math.pow(yi - (slope * x[i] + intercept), 2), 0);
  const r2 = ssTotal > 0 ? 1 - (ssResidual / ssTotal) : 0;

  const direction = slope > 0.1 ? 'increasing' : slope < -0.1 ? 'decreasing' : 'stable';
  const confidence = Math.min(Math.abs(r2) * 100, 100);

  return { direction, slope, confidence, r2 };
}

function generateForecast(data: { month: string; count: number }[], months: number = 6): Forecast[] {
  const trend = calculateTrend(data);
  const lastIndex = data.length - 1;
  const forecasts: Forecast[] = [];

  for (let i = 1; i <= months; i++) {
    const predicted = Math.max(0, trend.slope * (lastIndex + i) + (data[lastIndex]?.count || 0) - trend.slope * lastIndex);
    const stdDev = Math.sqrt(data.reduce((sum, d) => sum + Math.pow(d.count - predicted, 2), 0) / data.length) || 1;
    
    const date = new Date();
    date.setMonth(date.getMonth() + i);
    
    forecasts.push({
      month: format(date, 'MMM yyyy'),
      predictedTests: Math.round(predicted),
      confidenceInterval: [
        Math.max(0, Math.round(predicted - 1.96 * stdDev)),
        Math.round(predicted + 1.96 * stdDev)
      ]
    });
  }

  return forecasts;
}

function detectPatterns(data: { month: string; count: number }[]): Pattern[] {
  const patterns: Pattern[] = [];

  // Seasonal pattern detection
  const monthlyTotals: Record<number, number[]> = {};
  data.forEach(d => {
    const month = new Date(d.month).getMonth();
    if (!monthlyTotals[month]) monthlyTotals[month] = [];
    monthlyTotals[month].push(d.count);
  });

  const seasonalStrength = Object.values(monthlyTotals).reduce((sum, counts) => {
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
    const variance = counts.reduce((sum, c) => sum + Math.pow(c - avg, 2), 0) / counts.length;
    return sum + variance;
  }, 0);

  if (seasonalStrength > 5) {
    const peakMonths = Object.entries(monthlyTotals)
      .map(([month, counts]) => ({
        month: Number(month),
        avg: counts.reduce((a, b) => a + b, 0) / counts.length
      }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 3)
      .map(m => format(new Date(2024, m.month, 1), 'MMM'));

    patterns.push({
      type: 'seasonal',
      description: `Peak activity in ${peakMonths.join(', ')}`,
      strength: Math.min(seasonalStrength * 10, 100),
      months: peakMonths
    });
  }

  // Spike detection
  const avg = data.reduce((sum, d) => sum + d.count, 0) / data.length;
  const stdDev = Math.sqrt(data.reduce((sum, d) => sum + Math.pow(d.count - avg, 2), 0) / data.length);
  
  const spikes = data.filter(d => d.count > avg + 2 * stdDev);
  if (spikes.length > 0) {
    patterns.push({
      type: 'spike',
      description: `${spikes.length} unusual spikes detected`,
      strength: Math.min(spikes.length * 20, 100),
      months: spikes.map(s => s.month)
    });
  }

  // Cyclical pattern
  const cycles: number[] = [];
  for (let i = 2; i < data.length - 2; i++) {
    if (data[i].count > data[i-1].count && data[i].count > data[i+1].count) {
      cycles.push(i);
    }
  }

  if (cycles.length >= 2) {
    const avgCycle = cycles.slice(1).reduce((sum, c, i) => sum + (c - cycles[i]), 0) / (cycles.length - 1);
    patterns.push({
      type: 'cyclical',
      description: `Approximate cycle every ${Math.round(avgCycle)} months`,
      strength: Math.min(cycles.length * 15, 100),
      months: cycles.map(i => data[i]?.month).filter(Boolean)
    });
  }

  return patterns;
}

function analyzeMissileTypes(tests: TestData[]) {
  const typeMap: Record<string, { count: number; outcomes: Record<string, number> }> = {};
  
  tests.forEach(test => {
    const type = test.type || 'Unknown';
    if (!typeMap[type]) {
      typeMap[type] = { count: 0, outcomes: {} };
    }
    typeMap[type].count++;
    typeMap[type].outcomes[test.outcome] = (typeMap[type].outcomes[test.outcome] || 0) + 1;
  });

  return Object.entries(typeMap)
    .map(([type, data]) => ({
      type,
      count: data.count,
      successRate: Math.round((data.outcomes['success'] || 0) / data.count * 100),
      trend: data.count > 5 ? 'established' : data.count > 2 ? 'emerging' : 'experimental'
    }))
    .sort((a, b) => b.count - a.count);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country') || 'north-korea';

    // Fetch test data
    const dataFile = country === 'north-korea' 
      ? '/missile-viz/data/test.en.json'
      : `/missile-viz/${country}/data/test.en.json`;

    const response = await fetch(`http://localhost:3400${dataFile}`);
    const rawData = await response.json();
    
    const tests = rawData.timeBins?.flatMap((bin: any) => 
      (bin.data || []).map((test: any) => ({...test, year: bin.year}))
    ) || [];

    if (tests.length === 0) {
      return NextResponse.json({ error: 'No data available' }, { status: 404 });
    }

    // Prepare monthly data
    const monthMap: Record<string, number> = {};
    const now = new Date();
    
    tests.forEach((test: any) => {
      const testDate = new Date(test.date);
      const monthsDiff = (now.getFullYear() - testDate.getFullYear()) * 12 + 
        (now.getMonth() - testDate.getMonth());
      
      if (monthsDiff < 24) { // Last 24 months
        const monthKey = format(testDate, 'MMM yyyy');
        monthMap[monthKey] = (monthMap[monthKey] || 0) + 1;
      }
    });

    const monthlyData = Object.entries(monthMap)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([month, count]) => ({ month, count }));

    // Calculate analytics
    const trend = calculateTrend(monthlyData);
    const forecast = generateForecast(monthlyData, 6);
    const patterns = detectPatterns(monthlyData);
    const missileAnalysis = analyzeMissileTypes(tests);

    // Calculate additional metrics
    const totalTests = tests.length;
    const successRate = Math.round(
      tests.filter((t: any) => t.outcome === 'success').length / totalTests * 100
    );

    const last6Months = tests.filter((t: any) => {
      const testDate = new Date(t.date);
      const monthsDiff = (now.getFullYear() - testDate.getFullYear()) * 12 + 
        (now.getMonth() - testDate.getMonth());
      return monthsDiff <= 6;
    });

    const recentTrend = last6Months.length > 0 
      ? last6Months.length > (totalTests / (tests.length > 0 ? tests.length : 1)) * 6 
        ? 'accelerating' 
        : 'stable'
      : 'stable';

    return NextResponse.json({
      country,
      summary: {
        totalTests,
        successRate,
        recentTests: last6Months.length,
        trend: recentTrend
      },
      trendAnalysis: {
        direction: trend.direction,
        slope: trend.slope,
        confidence: trend.confidence,
        r2: trend.r2
      },
      forecast,
      patterns,
      missileAnalysis,
      monthlyData
    });

  } catch (error) {
    console.error('❌ Error in predictive analytics:', error);
    return NextResponse.json(
      { error: 'Failed to generate analytics' },
      { status: 500 }
    );
  }
}
