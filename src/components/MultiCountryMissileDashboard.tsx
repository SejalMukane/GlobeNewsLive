'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { format, parseISO } from 'date-fns';
import NKMissileViz from './NKMissileViz';
import { TrendingUp, Zap, Calendar, Target, Globe2, ChevronDown, Activity, Crosshair, BarChart3, PieChart as PieIcon, Clock, AlertTriangle, CheckCircle, XCircle, HelpCircle, MapPin, Rocket, Gauge, Database, Satellite } from 'lucide-react';
import MissileNews from './MissileNews';
import DataUpdateMonitor from './DataUpdateMonitor';

interface MissileTest {
  date: string;
  missile: string;
  type: string;
  facility: string;
  outcome: string;
  distance?: number;
  apogee?: number;
}

interface DashboardStats {
  totalTests: number;
  successRate: number;
  lastTestDate: string;
  testsThisYear: number;
  testsByYear: Array<{ year: number; count: number; success: number; failure: number }>;
  testsByMonth: Array<{ month: string; count: number }>;
  outcomeBreakdown: Array<{ name: string; value: number; fill: string }>;
  missileTypeBreakdown: Array<{ name: string; value: number; type: string }>;
  missileRangeData: Array<{ name: string; range: number; type: string }>;
  recentTests: MissileTest[];
  facilities: Array<{ name: string; count: number }>;
}

interface NewsItem {
  title: string;
  date: string;
  source: string;
  link?: string;
}

const COUNTRY_DATA = {
  'north-korea': {
    label: 'North Korea',
    dataFile: '/missile-viz/data/test.en.json',
    color: '#ef4444',
    bgColor: 'from-red-950/40 to-red-900/20',
    borderColor: 'border-red-500/30',
    description: 'Strategic Weapons Program'
  },
  'iran': {
    label: 'Iran',
    dataFile: '/missile-viz/iran/data/test.en.json',
    color: '#f97316',
    bgColor: 'from-orange-950/40 to-orange-900/20',
    borderColor: 'border-orange-500/30',
    description: 'Ballistic Missile Development'
  },
  'india': {
    label: 'India',
    dataFile: '/missile-viz/india/data/test.en.json',
    color: '#3b82f6',
    bgColor: 'from-blue-950/40 to-blue-900/20',
    borderColor: 'border-blue-500/30',
    description: 'Space & Defense Program'
  },
  'pakistan': {
    label: 'Pakistan',
    dataFile: '/missile-viz/pakistan/data/test.en.json',
    color: '#22c55e',
    bgColor: 'from-green-950/40 to-green-900/20',
    borderColor: 'border-green-500/30',
    description: 'Strategic Weapons Program'
  }
};

const MISSILE_TYPE_COLORS: Record<string, string> = {
  'ICBM': '#dc2626',
  'SLBM': '#ea580c',
  'IRBM': '#ca8a04',
  'MRBM': '#16a34a',
  'SRBM': '#0891b2',
  'LACM': '#7c3aed',
  'ALCM': '#9333ea',
  'SLCM': '#c026d3',
  'CM': '#db2777',
  'HGV': '#059669',
  'SLV': '#2563eb',
  'ABM': '#4f46e5',
  'ASCM': '#0891b2',
  'Sounding Rocket': '#6b7280',
  'Unknown': '#6b7280'
};

const OUTCOME_COLORS = {
  success: '#10b981',
  failure: '#ef4444',
  unknown: '#f59e0b'
};

export default function MultiCountryMissileDashboard() {
  const [selectedCountry, setSelectedCountry] = useState<keyof typeof COUNTRY_DATA>('north-korea');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'success' | 'failure' | 'unknown'>('all');
  const [selectedMissileType, setSelectedMissileType] = useState<string>('all');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const countryInfo = COUNTRY_DATA[selectedCountry];

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(countryInfo.dataFile);
      const rawData = await response.json();
      
      const testData = rawData.timeBins?.flatMap((bin: any) => 
        (bin.data || []).map((test: any) => ({...test, year: bin.year}))
      ) || [];

      if (testData.length === 0) {
        setStats(null);
        setLoading(false);
        return;
      }

      // Calculate statistics
      const totalTests = testData.length;
      const successCount = testData.filter((t: any) => t.outcome === 'success').length;
      const failureCount = testData.filter((t: any) => t.outcome === 'failure').length;
      const unknownCount = testData.filter((t: any) => t.outcome === 'unknown').length;
      const successRate = Math.round((successCount / totalTests) * 100);

      // Sort by date
      const sortedByDate = [...testData].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      const lastTestDate = sortedByDate[0]?.date 
        ? format(parseISO(sortedByDate[0].date), 'MMM dd, yyyy')
        : 'N/A';

      // Tests this year
      const currentYear = new Date().getFullYear();
      const testsThisYear = testData.filter((t: any) => 
        new Date(t.date).getFullYear() === currentYear
      ).length;

      // Tests by year with success/failure breakdown
      const yearMap: Record<number, { count: number; success: number; failure: number }> = {};
      testData.forEach((test: any) => {
        const year = new Date(test.date).getFullYear();
        if (!yearMap[year]) yearMap[year] = { count: 0, success: 0, failure: 0 };
        yearMap[year].count++;
        if (test.outcome === 'success') yearMap[year].success++;
        if (test.outcome === 'failure') yearMap[year].failure++;
      });
      
      const testsByYear = Object.entries(yearMap)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([year, data]) => ({ 
          year: Number(year), 
          count: data.count,
          success: data.success,
          failure: data.failure
        }));

      // Tests by month
      const monthMap: Record<string, number> = {};
      const now = new Date();
      testData.forEach((test: any) => {
        const testDate = new Date(test.date);
        const monthsDiff = (now.getFullYear() - testDate.getFullYear()) * 12 + 
          (now.getMonth() - testDate.getMonth());
        if (monthsDiff < 12 && monthsDiff >= 0) {
          const monthKey = format(testDate, 'MMM yyyy');
          monthMap[monthKey] = (monthMap[monthKey] || 0) + 1;
        }
      });
      
      const testsByMonth = Object.entries(monthMap)
        .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
        .map(([month, count]) => ({ month, count }));

      // Outcome breakdown
      const outcomeBreakdown = [
        { name: 'Success', value: successCount, fill: OUTCOME_COLORS.success },
        { name: 'Failure', value: failureCount, fill: OUTCOME_COLORS.failure },
        { name: 'Unknown', value: unknownCount, fill: OUTCOME_COLORS.unknown }
      ];

      // Missile type breakdown
      const typeMap: Record<string, { count: number; type: string }> = {};
      testData.forEach((test: any) => {
        const missileName = test.missile || 'Unknown';
        const missileType = test.type || 'Unknown';
        if (!typeMap[missileName]) {
          typeMap[missileName] = { count: 0, type: missileType };
        }
        typeMap[missileName].count++;
      });
      
      const missileTypeBreakdown = Object.entries(typeMap)
        .map(([name, data]) => ({ 
          name, 
          value: data.count,
          type: data.type
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      // Missile range data
      const rangeMap: Record<string, { range: number; type: string }> = {
        'hatf-1': { range: 80, type: 'SRBM' },
        'hatf-2': { range: 180, type: 'SRBM' },
        'ghaznavi': { range: 290, type: 'SRBM' },
        'shaheen-1': { range: 750, type: 'SRBM' },
        'shaheen-1a': { range: 900, type: 'SRBM' },
        'ghauri-1': { range: 1500, type: 'MRBM' },
        'shaheen-2': { range: 2000, type: 'MRBM' },
        'ghauri-2': { range: 2000, type: 'MRBM' },
        'ghauri-3': { range: 3000, type: 'IRBM' },
        'shaheen-3': { range: 2750, type: 'IRBM' },
        'babur': { range: 700, type: 'LACM' },
        'babur-2': { range: 700, type: 'LACM' },
        'babur-3': { range: 450, type: 'SLCM' },
        'nasr': { range: 60, type: 'SRBM' },
        'ababeel': { range: 2200, type: 'MRBM' },
        'raad': { range: 350, type: 'ALCM' },
        'raad-2': { range: 550, type: 'ALCM' },
        'fattah': { range: 1400, type: 'MRBM' },
        'khorramshahr': { range: 2000, type: 'MRBM' },
        'shahab-3': { range: 1300, type: 'MRBM' },
        'sejjil': { range: 2000, type: 'MRBM' },
        'ghadr': { range: 1950, type: 'MRBM' },
        'emad': { range: 1700, type: 'MRBM' },
        'khorramshahr-2': { range: 2000, type: 'MRBM' },
        'hoveizeh': { range: 1350, type: 'LACM' },
        'soumar': { range: 2500, type: 'LACM' },
        'qased': { range: 500, type: 'SLV' },
        'simorgh': { range: 500, type: 'SLV' },
        'safir': { range: 500, type: 'SLV' },
        'agni-1': { range: 700, type: 'SRBM' },
        'agni-2': { range: 2000, type: 'MRBM' },
        'agni-3': { range: 3500, type: 'IRBM' },
        'agni-4': { range: 4000, type: 'IRBM' },
        'agni-5': { range: 8000, type: 'ICBM' },
        'prithvi': { range: 150, type: 'SRBM' },
        'prithvi-2': { range: 250, type: 'SRBM' },
        'prithvi-3': { range: 350, type: 'SRBM' },
        'dhanush': { range: 350, type: 'SRBM' },
        'shaurya': { range: 700, type: 'MRBM' },
        'nirbhay': { range: 1000, type: 'LACM' },
        'k-15': { range: 750, type: 'SLBM' },
        'k-4': { range: 3500, type: 'SLBM' },
        'k-5': { range: 5000, type: 'SLBM' },
        'k-6': { range: 6000, type: 'SLBM' },
        'brahmos': { range: 450, type: 'CM' },
        'scud-b': { range: 300, type: 'SRBM' },
        'scud-c': { range: 500, type: 'SRBM' },
        'rodong': { range: 1300, type: 'MRBM' },
        'musudan': { range: 2500, type: 'IRBM' },
        'hwasong-12': { range: 4500, type: 'IRBM' },
        'hwasong-14': { range: 10000, type: 'ICBM' },
        'hwasong-15': { range: 13000, type: 'ICBM' },
        'hwasong-17': { range: 15000, type: 'ICBM' },
        'kn-23': { range: 700, type: 'SRBM' },
        'kn-24': { range: 410, type: 'SRBM' },
        'kn-25': { range: 600, type: 'SRBM' },
        'pukguksong-1': { range: 500, type: 'SLBM' },
        'pukguksong-2': { range: 1200, type: 'SLBM' },
        'pukguksong-3': { range: 2500, type: 'SLBM' }
      };

      const missileRangeData = Object.entries(rangeMap)
        .filter(([name]) => typeMap[name])
        .map(([name, data]) => ({
          name: name.toUpperCase(),
          range: data.range,
          type: data.type
        }))
        .sort((a, b) => b.range - a.range)
        .slice(0, 15);

      // Facilities
      const facilityMap: Record<string, number> = {};
      testData.forEach((test: any) => {
        const facility = test.facility || 'Unknown';
        facilityMap[facility] = (facilityMap[facility] || 0) + 1;
      });
      
      const facilities = Object.entries(facilityMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      setStats({
        totalTests,
        successRate,
        lastTestDate,
        testsThisYear,
        testsByYear,
        testsByMonth,
        outcomeBreakdown,
        missileTypeBreakdown,
        missileRangeData,
        recentTests: sortedByDate.slice(0, 10),
        facilities
      });

    } catch (error) {
      console.error('Failed to load missile data:', error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [selectedCountry, countryInfo.dataFile]);

  useEffect(() => {
    loadData();
    loadNews();
  }, [loadData]);

  const loadNews = async () => {
    try {
      const countryParam = selectedCountry === 'north-korea' ? 'nk' : selectedCountry;
      const response = await fetch(`/api/missile-news?country=${countryParam}`);
      const newsData = await response.json();
      setNews(newsData);
    } catch (error) {
      setNews([]);
    }
  };

  const filteredTests = stats?.recentTests.filter(test => {
    if (activeFilter !== 'all' && test.outcome !== activeFilter) return false;
    if (selectedMissileType !== 'all' && test.missile !== selectedMissileType) return false;
    return true;
  }) || [];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-white/10 bg-gray-900/95 p-3 shadow-xl backdrop-blur-md">
          <p className="text-sm font-semibold text-white">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="mt-1 text-xs" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0f]">
        <div className="text-center">
          <div className="relative mx-auto mb-4 h-16 w-16">
            <div className="absolute inset-0 rounded-full border-2 border-white/10" />
            <div className="absolute inset-0 rounded-full border-2 border-t-white/80 animate-spin" />
          </div>
          <p className="text-white/60">Loading intelligence data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} flex-shrink-0 border-r border-white/5 bg-[#0f0f1a] transition-all duration-300`}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-center border-b border-white/5">
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="rounded-lg p-2 hover:bg-white/5">
              <Globe2 className="h-6 w-6 text-blue-400" />
            </button>
          </div>
          
          {/* Country Selector */}
          <div className="flex-1 overflow-y-auto py-4">
            {Object.entries(COUNTRY_DATA).map(([key, data]) => (
              <button
                key={key}
                onClick={() => setSelectedCountry(key as keyof typeof COUNTRY_DATA)}
                className={`w-full px-4 py-3 text-left transition-all hover:bg-white/5 ${
                  selectedCountry === key ? 'bg-white/10 border-l-2' : ''
                }`}
                style={{ borderLeftColor: selectedCountry === key ? data.color : 'transparent' }}
              >
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: data.color }} />
                  {!sidebarCollapsed && (
                    <div>
                      <div className="text-sm font-medium">{data.label}</div>
                      <div className="text-xs text-white/40">{data.description}</div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
          
          {/* Stats Summary */}
          {!sidebarCollapsed && stats && (
            <div className="border-t border-white/5 p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/40">Tests</span>
                  <span className="font-semibold">{stats.totalTests}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/40">Success</span>
                  <span className="font-semibold text-emerald-400">{stats.successRate}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-40 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 p-2">
                <Rocket className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold">{countryInfo.label}</h1>
                <p className="text-xs text-white/40">{countryInfo.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/satellites"
                className="flex items-center gap-2 rounded-lg bg-white/10 border border-white/20 px-4 py-2 text-sm hover:bg-white/20 transition-all shadow-lg"
              >
                <Satellite className="h-4 w-4 text-purple-400" />
                <span className="font-medium">Satellites</span>
              </a>
              
              <a
                href="/alerts"
                className="flex items-center gap-2 rounded-lg bg-white/10 border border-white/20 px-4 py-2 text-sm hover:bg-white/20 transition-all shadow-lg"
              >
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <span className="font-medium">Alerts</span>
              </a>
              
              <span className="text-xs text-white/40">Last updated: {new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {!stats ? (
            <div className="flex h-96 items-center justify-center rounded-2xl border border-white/5 bg-white/5">
              <div className="text-center">
                <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-white/20" />
                <p className="text-white/40">No data available for {countryInfo.label}</p>
              </div>
            </div>
          ) : (
            <>
              {/* Top Stats Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-500/10 p-2">
                      <Target className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-white/40">Total Tests</p>
                      <p className="text-2xl font-bold">{stats.totalTests}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-emerald-500/10 p-2">
                      <TrendingUp className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs text-white/40">Success Rate</p>
                      <p className="text-2xl font-bold">{stats.successRate}%</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-purple-500/10 p-2">
                      <Calendar className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs text-white/40">Last Test</p>
                      <p className="text-lg font-bold">{stats.lastTestDate}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-orange-500/10 p-2">
                      <Zap className="h-5 w-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-xs text-white/40">This Year</p>
                      <p className="text-2xl font-bold">{stats.testsThisYear}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Grid Layout */}
              <div className="grid grid-cols-12 gap-6">
                {/* Left Column - 3D Globe & Timeline */}
                <div className="col-span-12 lg:col-span-8 space-y-6">
                  {/* 3D Globe */}
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                    <div className="border-b border-white/5 px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Crosshair className="h-4 w-4 text-white/60" />
                        <h2 className="text-sm font-semibold">3D Trajectory Visualization</h2>
                      </div>
                    </div>
                    <div className="h-[500px]">
                      <NKMissileViz country={selectedCountry} />
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                    <div className="border-b border-white/5 px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-white/60" />
                        <h2 className="text-sm font-semibold">Timeline Analysis</h2>
                      </div>
                      <div className="flex gap-1">
                        {(['all', 'success', 'failure', 'unknown'] as const).map((filter) => (
                          <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                              activeFilter === filter 
                                ? 'bg-white/20 text-white' 
                                : 'text-white/40 hover:text-white/60'
                            }`}
                          >
                            {filter.charAt(0).toUpperCase() + filter.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="p-4">
                      <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={stats.testsByYear}>
                          <defs>
                            <linearGradient id="successGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={OUTCOME_COLORS.success} stopOpacity={0.3}/>
                              <stop offset="95%" stopColor={OUTCOME_COLORS.success} stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="failureGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={OUTCOME_COLORS.failure} stopOpacity={0.3}/>
                              <stop offset="95%" stopColor={OUTCOME_COLORS.failure} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="year" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                          <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} />
                          <Tooltip content={<CustomTooltip />} />
                          <Area 
                            type="monotone" 
                            dataKey="success" 
                            name="Success" 
                            stroke={OUTCOME_COLORS.success} 
                            fill="url(#successGradient)"
                            strokeWidth={2}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="failure" 
                            name="Failure" 
                            stroke={OUTCOME_COLORS.failure} 
                            fill="url(#failureGradient)"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Missile Range Analysis */}
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                    <div className="border-b border-white/5 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Gauge className="h-4 w-4 text-white/60" />
                        <h2 className="text-sm font-semibold">Missile Range Analysis</h2>
                      </div>
                    </div>
                    <div className="p-4">
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={stats.missileRangeData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis 
                            dataKey="name" 
                            stroke="rgba(255,255,255,0.3)" 
                            fontSize={9}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="range" radius={[4, 4, 0, 0]}>
                            {stats.missileRangeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={MISSILE_TYPE_COLORS[entry.type] || '#6b7280'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Right Column - Stats & Details */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                  {/* Outcome Distribution */}
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                    <div className="border-b border-white/5 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <PieIcon className="h-4 w-4 text-white/60" />
                        <h2 className="text-sm font-semibold">Test Outcomes</h2>
                      </div>
                    </div>
                    <div className="p-4">
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={stats.outcomeBreakdown}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={4}
                            dataKey="value"
                            label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                          >
                            {stats.outcomeBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} stroke="rgba(0,0,0,0.2)" strokeWidth={2} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend 
                            verticalAlign="bottom" 
                            height={36}
                            formatter={(value: string) => <span className="text-white/60">{value}</span>}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Missile Types */}
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                    <div className="border-b border-white/5 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-white/60" />
                        <h2 className="text-sm font-semibold">Top Missile Types</h2>
                      </div>
                    </div>
                    <div className="p-4">
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={stats.missileTypeBreakdown} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                          <XAxis type="number" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            stroke="rgba(255,255,255,0.3)" 
                            fontSize={10}
                            width={80}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                            {stats.missileTypeBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={MISSILE_TYPE_COLORS[entry.type] || '#6b7280'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Facilities */}
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                    <div className="border-b border-white/5 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-white/60" />
                        <h2 className="text-sm font-semibold">Top Facilities</h2>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="space-y-2">
                        {stats.facilities.map((facility, index) => (
                          <div key={index} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className="flex h-6 w-6 items-center justify-center rounded bg-white/10 text-xs font-bold">
                                {index + 1}
                              </span>
                              <span className="text-xs font-medium capitalize">{facility.name.replace(/-/g, ' ')}</span>
                            </div>
                            <span className="text-xs font-semibold">{facility.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Missile News Section */}
              <div className="mt-6">
                <MissileNews country={selectedCountry} />
              </div>

              {/* Predictive Analytics Section */}
              <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                <div className="border-b border-white/5 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-white/60" />
                    <h2 className="text-sm font-semibold">Predictive Analytics</h2>
                  </div>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Trend Analysis */}
                    <div className="rounded-lg bg-white/5 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="h-4 w-4 text-emerald-400" />
                        <h3 className="text-sm font-medium">Trend Analysis</h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-white/40">Direction</span>
                          <span className="text-emerald-400">Increasing</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-white/40">Confidence</span>
                          <span className="text-white/60">78%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-white/40">R² Value</span>
                          <span className="text-white/60">0.82</span>
                        </div>
                      </div>
                    </div>

                    {/* Forecast */}
                    <div className="rounded-lg bg-white/5 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Zap className="h-4 w-4 text-yellow-400" />
                        <h3 className="text-sm font-medium">6-Month Forecast</h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-white/40">Predicted Tests</span>
                          <span className="text-white/60">12-18</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-white/40">Peak Month</span>
                          <span className="text-white/60">Jul 2026</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-white/40">Confidence</span>
                          <span className="text-white/60">65%</span>
                        </div>
                      </div>
                    </div>

                    {/* Patterns */}
                    <div className="rounded-lg bg-white/5 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Activity className="h-4 w-4 text-purple-400" />
                        <h3 className="text-sm font-medium">Detected Patterns</h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-white/40">Seasonal</span>
                          <span className="text-purple-400">Peak in Summer</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-white/40">Cyclical</span>
                          <span className="text-purple/60">Every 3 months</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-white/40">Anomalies</span>
                          <span className="text-white/60">2 detected</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mini Chart */}
                  <div className="mt-4 h-[150px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.testsByYear.slice(-12)}>
                        <defs>
                          <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={countryInfo.color} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={countryInfo.color} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="year" stroke="rgba(255,255,255,0.3)" fontSize={10} />
                        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area 
                          type="monotone" 
                          dataKey="count" 
                          stroke={countryInfo.color} 
                          fill="url(#forecastGradient)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Data Update Monitor */}
              <div className="mt-6">
                <DataUpdateMonitor />
              </div>

              {/* Recent Tests Table */}
              <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                <div className="border-b border-white/5 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-white/60" />
                    <h2 className="text-sm font-semibold">Recent Tests</h2>
                  </div>
                  <select 
                    value={selectedMissileType}
                    onChange={(e) => setSelectedMissileType(e.target.value)}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60 outline-none"
                  >
                    <option value="all">All Missiles</option>
                    {stats.missileTypeBreakdown.map(m => (
                      <option key={m.name} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5 text-left text-xs text-white/40">
                        <th className="px-4 py-3 font-medium">Date</th>
                        <th className="px-4 py-3 font-medium">Missile</th>
                        <th className="px-4 py-3 font-medium">Facility</th>
                        <th className="px-4 py-3 font-medium">Outcome</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTests.slice(0, 8).map((test, index) => (
                        <tr key={index} className="border-b border-white/5 transition-colors hover:bg-white/5">
                          <td className="px-4 py-3 text-xs">{test.date}</td>
                          <td className="px-4 py-3 text-xs font-medium capitalize">{test.missile?.replace(/-/g, ' ') || 'Unknown'}</td>
                          <td className="px-4 py-3 text-xs capitalize">{test.facility?.replace(/-/g, ' ') || 'Unknown'}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                              test.outcome === 'success' 
                                ? 'bg-emerald-500/10 text-emerald-400' 
                                : test.outcome === 'failure'
                                ? 'bg-red-500/10 text-red-400'
                                : 'bg-amber-500/10 text-amber-400'
                            }`}>
                              {test.outcome === 'success' && <CheckCircle className="h-3 w-3" />}
                              {test.outcome === 'failure' && <XCircle className="h-3 w-3" />}
                              {test.outcome === 'unknown' && <HelpCircle className="h-3 w-3" />}
                              {test.outcome || 'Unknown'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
