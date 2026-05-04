'use client';

import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart, ReferenceLine
} from 'recharts';
import { TrendingUp, TrendingDown, Activity, Brain, Target, Zap, ArrowUpRight, ArrowDownRight, Minus, AlertTriangle, CheckCircle } from 'lucide-react';

interface AnalyticsData {
  country: string;
  summary: {
    totalTests: number;
    successRate: number;
    recentTests: number;
    trend: string;
  };
  trendAnalysis: {
    direction: string;
    slope: number;
    confidence: number;
    r2: number;
  };
  forecast: Array<{
    month: string;
    predictedTests: number;
    confidenceInterval: [number, number];
  }>;
  patterns: Array<{
    type: string;
    description: string;
    strength: number;
    months: string[];
  }>;
  missileAnalysis: Array<{
    type: string;
    count: number;
    successRate: number;
    trend: string;
  }>;
  monthlyData: Array<{
    month: string;
    count: number;
  }>;
}

const COUNTRY_COLORS = {
  'north-korea': '#ef4444',
  'iran': '#f97316',
  'india': '#3b82f6',
  'pakistan': '#22c55e'
};

export default function PredictiveAnalyticsDashboard() {
  const [selectedCountry, setSelectedCountry] = useState('north-korea');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedCountry]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/predictions?country=${selectedCountry}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'increasing': return <TrendingUp className="h-5 w-5 text-emerald-400" />;
      case 'decreasing': return <TrendingDown className="h-5 w-5 text-red-400" />;
      default: return <Minus className="h-5 w-5 text-yellow-400" />;
    }
  };

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'increasing': return 'text-emerald-400';
      case 'decreasing': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-white/10 bg-gray-900/95 p-3 shadow-xl">
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
          <p className="text-white/60">Analyzing patterns...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0f]">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-white/20" />
          <p className="text-white/40">No analytics data available</p>
        </div>
      </div>
    );
  }

  const countryColor = COUNTRY_COLORS[selectedCountry as keyof typeof COUNTRY_COLORS] || '#3b82f6';

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 p-3">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Predictive Analytics</h1>
              <p className="text-sm text-white/40">AI-powered trend analysis & forecasting</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {Object.entries(COUNTRY_COLORS).map(([key, color]) => (
              <button
                key={key}
                onClick={() => setSelectedCountry(key)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  selectedCountry === key 
                    ? 'bg-white/20 text-white' 
                    : 'text-white/40 hover:text-white/60'
                }`}
                style={{ borderLeft: selectedCountry === key ? `3px solid ${color}` : 'none' }}
              >
                {key.replace('-', ' ').toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <Target className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-white/40">Total Tests</p>
              <p className="text-2xl font-bold">{data.summary.totalTests}</p>
            </div>
          </div>
        </div>
        
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-white/40">Success Rate</p>
              <p className="text-2xl font-bold">{data.summary.successRate}%</p>
            </div>
          </div>
        </div>
        
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/10 p-2">
              <Activity className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-white/40">Recent (6mo)</p>
              <p className="text-2xl font-bold">{data.summary.recentTests}</p>
            </div>
          </div>
        </div>
        
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-500/10 p-2">
              <Zap className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-white/40">Trend</p>
              <p className={`text-lg font-bold ${getTrendColor(data.trendAnalysis.direction)}`}>
                {data.trendAnalysis.direction}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Analysis */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Trend Analysis</h2>
            <div className="flex items-center gap-2">
              {getTrendIcon(data.trendAnalysis.direction)}
              <span className={`text-sm font-medium ${getTrendColor(data.trendAnalysis.direction)}`}>
                {data.trendAnalysis.confidence.toFixed(0)}% confidence
              </span>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={11} />
              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill={countryColor} opacity={0.3} />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke={countryColor} 
                strokeWidth={2}
                dot={{ fill: countryColor, r: 4 }}
              />
              <ReferenceLine 
                y={data.monthlyData.reduce((sum, d) => sum + d.count, 0) / data.monthlyData.length} 
                stroke="rgba(255,255,255,0.2)" 
                strokeDasharray="3 3"
                label={{ value: 'Average', fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Forecast */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">6-Month Forecast</h2>
            <p className="text-xs text-white/40">Predicted test activity</p>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.forecast}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={11} />
              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="predictedTests" 
                name="Predicted" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#8b5cf6', r: 4 }}
              />
              <Area 
                type="monotone" 
                dataKey="confidenceInterval[1]" 
                name="Upper Bound" 
                stroke="none" 
                fill="rgba(139, 92, 246, 0.1)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pattern Detection */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold mb-4">Detected Patterns</h2>
          
          <div className="space-y-3">
            {data.patterns.map((pattern, index) => (
              <div key={index} className="rounded-lg bg-white/5 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {pattern.type === 'seasonal' ? '📅' : 
                       pattern.type === 'spike' ? '⚡' : 
                       pattern.type === 'cyclical' ? '🔄' : '🔍'}
                    </span>
                    <span className="font-medium capitalize">{pattern.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-20 rounded-full bg-white/10">
                      <div 
                        className="h-full rounded-full bg-blue-500 transition-all"
                        style={{ width: `${pattern.strength}%` }}
                      />
                    </div>
                    <span className="text-xs text-white/40">{pattern.strength.toFixed(0)}%</span>
                  </div>
                </div>
                <p className="text-sm text-white/60">{pattern.description}</p>
                {pattern.months.length > 0 && (
                  <div className="mt-2 flex gap-2">
                    {pattern.months.map((month, i) => (
                      <span key={i} className="rounded bg-white/10 px-2 py-1 text-xs">
                        {month}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Missile Type Analysis */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold mb-4">Missile Type Analysis</h2>
          
          <div className="space-y-3">
            {data.missileAnalysis.map((missile, index) => (
              <div key={index} className="rounded-lg bg-white/5 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-sm font-bold">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium">{missile.type}</p>
                      <p className="text-xs text-white/40">
                        {missile.count} tests • {missile.successRate}% success
                      </p>
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                    missile.trend === 'established' ? 'bg-emerald-500/10 text-emerald-400' :
                    missile.trend === 'emerging' ? 'bg-blue-500/10 text-blue-400' :
                    'bg-yellow-500/10 text-yellow-400'
                  }`}>
                    {missile.trend}
                  </span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-white/10">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                    style={{ width: `${missile.successRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trend Metrics */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold mb-4">Trend Metrics</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg bg-white/5 p-4">
            <p className="text-xs text-white/40 mb-1">Slope</p>
            <p className="text-2xl font-bold">{data.trendAnalysis.slope.toFixed(2)}</p>
            <p className="text-xs text-white/40 mt-1">
              {data.trendAnalysis.slope > 0 ? 'Increasing' : data.trendAnalysis.slope < 0 ? 'Decreasing' : 'Stable'}
            </p>
          </div>
          
          <div className="rounded-lg bg-white/5 p-4">
            <p className="text-xs text-white/40 mb-1">R² Value</p>
            <p className="text-2xl font-bold">{data.trendAnalysis.r2.toFixed(3)}</p>
            <p className="text-xs text-white/40 mt-1">
              {data.trendAnalysis.r2 > 0.7 ? 'Strong fit' : data.trendAnalysis.r2 > 0.4 ? 'Moderate fit' : 'Weak fit'}
            </p>
          </div>
          
          <div className="rounded-lg bg-white/5 p-4">
            <p className="text-xs text-white/40 mb-1">Confidence</p>
            <p className="text-2xl font-bold">{data.trendAnalysis.confidence.toFixed(1)}%</p>
            <p className="text-xs text-white/40 mt-1">
              {data.trendAnalysis.confidence > 80 ? 'High' : data.trendAnalysis.confidence > 50 ? 'Medium' : 'Low'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
