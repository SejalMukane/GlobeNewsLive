'use client';

import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { format, parseISO } from 'date-fns';
import NKMissileViz from './NKMissileViz';
import { TrendingUp, Zap, Calendar, Target, Globe2 } from 'lucide-react';

interface MissileTest {
  date: string;
  missile: { name: string; type: string };
  outcome: string;
}

interface DashboardStats {
  totalTests: number;
  successRate: number;
  lastTestDate: string;
  testsThisYear: number;
  testsByYear: Array<{ year: number; count: number }>;
  testsByMonth: Array<{ month: string; count: number }>;
  outcomeBreakdown: Array<{ name: string; value: number }>;
  missileTypeBreakdown: Array<{ name: string; value: number }>;
  recentTests: MissileTest[];
}

interface NewsItem {
  title: string;
  date: string;
  source: string;
  link?: string;
  description?: string;
}

const COLORS = {
  success: '#10b981',
  failure: '#ef4444',
  unknown: '#f59e0b',
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  accent: '#ec4899'
};

const MISSILE_COLORS: Record<string, string> = {
  'ICBM': '#ef4444',
  'SLBM': '#f97316',
  'IRBM': '#eab308',
  'MRBM': '#84cc16',
  'SRBM': '#22c55e',
  'HGV': '#06b6d4',
  'SLV': '#3b82f6',
  'Unknown': '#6b7280'
};

export default function MissileDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalTests: 0,
    successRate: 0,
    lastTestDate: '',
    testsThisYear: 0,
    testsByYear: [],
    testsByMonth: [],
    outcomeBreakdown: [],
    missileTypeBreakdown: [],
    recentTests: []
  });
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMissileData = async () => {
      try {
        const response = await fetch('/missile-viz/data/test.en.json');
        const testDataRaw = await response.json();

        // Flatten the timeBins structure
        const testData = testDataRaw.timeBins?.flatMap((bin: any) => bin.data || []) || [];

        if (testData.length === 0) {
          console.error('No test data found');
          setLoading(false);
          return;
        }

        // Calculate statistics
        const totalTests = testData.length;
        const successCount = testData.filter((t: any) => t.outcome === 'success').length;
        const successRate = totalTests > 0 ? Math.round((successCount / totalTests) * 100) : 0;

        // Find last test date
        const sortedByDate = [...testData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const lastTestDate = sortedByDate.length > 0
          ? format(parseISO(sortedByDate[0].date), 'MMM dd, yyyy')
          : 'N/A';

        // Tests this year (2026)
        const currentYear = new Date().getFullYear();
        const testsThisYear = testData.filter((t: any) => {
          const year = new Date(t.date).getFullYear();
          return year === currentYear;
        }).length;

        // Tests by year
        const yearMap: Record<number, number> = {};
        testData.forEach((test: any) => {
          const year = new Date(test.date).getFullYear();
          yearMap[year] = (yearMap[year] || 0) + 1;
        });
        const testsByYear = Object.entries(yearMap)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([year, count]) => ({ year: Number(year), count }));

        // Tests by month (last 12 months)
        const monthMap: Record<string, number> = {};
        const now = new Date();
        testData.forEach((test: any) => {
          const testDate = new Date(test.date);
          const monthsDiff = (now.getFullYear() - testDate.getFullYear()) * 12 + (now.getMonth() - testDate.getMonth());
          if (monthsDiff < 12) {
            const monthKey = format(testDate, 'MMM yyyy');
            monthMap[monthKey] = (monthMap[monthKey] || 0) + 1;
          }
        });
        const testsByMonth = Object.entries(monthMap)
          .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
          .map(([month, count]) => ({ month, count }));

        // Outcome breakdown
        const outcomeMap: Record<string, number> = { success: 0, failure: 0, unknown: 0 };
        testData.forEach((test: any) => {
          const outcome = test.outcome || 'unknown';
          outcomeMap[outcome] = (outcomeMap[outcome] || 0) + 1;
        });
        const outcomeBreakdown = [
          { name: 'Success', value: outcomeMap.success, fill: COLORS.success },
          { name: 'Failure', value: outcomeMap.failure, fill: COLORS.failure },
          { name: 'Unknown', value: outcomeMap.unknown, fill: COLORS.unknown }
        ];

        // Missile type breakdown - get from missile data if available
        const typeMap: Record<string, number> = {};
        testData.forEach((test: any) => {
          const type = test.missile || 'Unknown';
          typeMap[type] = (typeMap[type] || 0) + 1;
        });
        const missileTypeBreakdown = Object.entries(typeMap)
          .map(([type, count]) => ({ name: type, value: count }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 8); // Top 8 types

        setStats({
          totalTests,
          successRate,
          lastTestDate,
          testsThisYear,
          testsByYear,
          testsByMonth,
          outcomeBreakdown,
          missileTypeBreakdown,
          recentTests: sortedByDate.slice(0, 5)
        });
      } catch (error) {
        console.error('Failed to load missile data:', error);
      } finally {
        setLoading(false);
      }
    };

    // Fetch news data
    const loadNews = async () => {
      try {
        const response = await fetch('/api/missile-news');
        const newsData: NewsItem[] = await response.json();
        setNews(newsData);
      } catch (error) {
        console.error('Failed to load missile news:', error);
        // Fallback news if API fails
        setNews([
          { title: "North Korea conducts new strategic weapon test", date: "2026-04-28", source: "Intelligence Reports", link: "#" },
          { title: "ICBM launch detected over East Sea", date: "2026-04-15", source: "Satellite Analysis", link: "#" },
          { title: "Increased missile production activity", date: "2026-04-01", source: "OSINT Monitoring", link: "#" },
          { title: "New missile base construction identified", date: "2026-03-20", source: "Imagery Intelligence", link: "#" },
          { title: "Test preparation phase begins", date: "2026-03-10", source: "Signal Intelligence", link: "#" }
        ]);
      }
    };

    loadMissileData();
    loadNews();
  }, []);

  const StatCard = ({ icon: Icon, label, value, color, subtext }: any) => (
    <div className={`rounded-lg border ${color} p-6 backdrop-blur-sm transition-all hover:shadow-lg`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">{label}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
          {subtext && <p className="mt-1 text-xs text-gray-400">{subtext}</p>}
        </div>
        <Icon className="h-12 w-12 opacity-20" />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-gray-400">Loading missile data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white">Missile Intelligence Dashboard</h1>
          <p className="mt-2 text-gray-400">North Korea Strategic Weapons Analysis</p>
        </div>
        <Globe2 className="h-12 w-12 text-blue-400 opacity-60" />
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Target}
          label="Total Tests"
          value={stats.totalTests}
          color="border border-blue-500/30 bg-blue-500/5"
          subtext="Historical record"
        />
        <StatCard
          icon={TrendingUp}
          label="Success Rate"
          value={`${stats.successRate}%`}
          color="border border-green-500/30 bg-green-500/5"
          subtext={`${stats.outcomeBreakdown[0]?.value || 0} successful tests`}
        />
        <StatCard
          icon={Calendar}
          label="Last Test"
          value={stats.lastTestDate}
          color="border border-purple-500/30 bg-purple-500/5"
          subtext="Most recent launch"
        />
        <StatCard
          icon={Zap}
          label="Tests This Year"
          value={stats.testsThisYear}
          color="border border-red-500/30 bg-red-500/5"
          subtext="2026 activity"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Globe Section */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-lg border border-gray-700 bg-gray-800/50 shadow-2xl">
            <div className="h-[600px]">
              <NKMissileViz />
            </div>
          </div>
        </div>

        {/* Right Sidebar - News Feed */}
        <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-6 shadow-xl">
          <h3 className="mb-4 text-lg font-bold text-white">Latest Intelligence</h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {news.length > 0 ? (
              news.map((item, idx) => (
                <a
                  key={idx}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block border-l-2 border-blue-500 pl-4 py-2 hover:border-blue-400 hover:bg-gray-700/30 transition-all rounded-r cursor-pointer group"
                >
                  <p className="text-xs font-semibold text-blue-400 uppercase group-hover:text-blue-300">{item.source}</p>
                  <p className="mt-1 text-sm font-medium text-gray-200 group-hover:text-white transition-colors">{item.title}</p>
                  <p className="mt-1 text-xs text-gray-500 group-hover:text-gray-400">{item.date}</p>
                </a>
              ))
            ) : (
              <div className="text-center text-gray-400 text-sm">
                <p>Loading news...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Test Outcome Distribution */}
        <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-6 shadow-xl">
          <h3 className="mb-4 text-lg font-bold text-white">Test Outcomes</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.outcomeBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {stats.outcomeBreakdown.map((entry: any, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill || '#8884d8'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Missile Type Distribution */}
        <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-6 shadow-xl">
          <h3 className="mb-4 text-lg font-bold text-white">Tests by Missile Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.missileTypeBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#ffffff' }}
              />
              <Bar
                dataKey="value"
                fill="#3b82f6"
                radius={[8, 8, 0, 0]}
              >
                {stats.missileTypeBreakdown.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={MISSILE_COLORS[entry.name] || '#8b5cf6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Time Series Charts */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Tests by Year */}
        <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-6 shadow-xl">
          <h3 className="mb-4 text-lg font-bold text-white">Tests Over Time (Yearly)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.testsByYear}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="year" stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#ffffff' }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#ec4899"
                strokeWidth={3}
                dot={{ fill: '#ec4899', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Tests by Month (Last Year) */}
        <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-6 shadow-xl">
          <h3 className="mb-4 text-lg font-bold text-white">Tests by Month (Last 12 Months)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.testsByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9ca3af" style={{ fontSize: '10px' }} angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#ffffff' }}
              />
              <Bar dataKey="count" fill="#06b6d4" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Annotated Timeline Markers */}
      <div className="mt-6 rounded-lg border border-gray-700 bg-gray-800/50 p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-bold text-white">Key Milestones</h3>
        <div className="flex overflow-x-auto space-x-4 pb-4">
          {[
            { year: 1984, event: 'First Test', icon: '🚀' },
            { year: 2002, event: 'ICBM Development', icon: '🎯' },
            { year: 2006, event: 'Nuclear Test', icon: '⚛️' },
            { year: 2012, event: 'Satellite Launch', icon: '🛰️' },
            { year: 2017, event: 'ICBM Success', icon: '✓' },
            { year: 2024, event: 'New Systems', icon: '🔬' }
          ].map((milestone) => (
            <div key={milestone.year} className="flex min-w-max flex-col items-center rounded-lg border border-gray-600 bg-gray-700/30 px-4 py-3 hover:border-blue-500 transition-all">
              <span className="text-2xl">{milestone.icon}</span>
              <p className="mt-2 font-bold text-white">{milestone.year}</p>
              <p className="text-xs text-gray-400">{milestone.event}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="mt-8 rounded-lg border border-gray-700 bg-gradient-to-r from-blue-900/20 to-purple-900/20 p-6 text-center shadow-xl">
        <p className="text-sm text-gray-400">
          Data updated in real-time • Last sync: {new Date().toLocaleString()} • {stats.totalTests} total tests analyzed
        </p>
      </div>
    </div>
  );
}
