'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import {
  MapPin,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Star,
  Heart,
  Settings,
  Gauge,
  Zap,
  Clock,
  Eye,
  Filter,
} from 'lucide-react';
import { Signal, PersonalizedAlert, UserPreferences } from '@/types';
import {
  filterSignalsByPreferences,
  getHighRiskAlerts,
  groupSignalsByCategory,
  calculateUserRiskScore,
} from '@/lib/personalization';

interface PersonalizedDashboardProps {
  preferences: UserPreferences;
  onSettingsClick: () => void;
  isLoading?: boolean;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function PersonalizedDashboard({
  preferences,
  onSettingsClick,
  isLoading = false,
}: PersonalizedDashboardProps) {
  const [signals, setSignals] = useState<PersonalizedAlert[]>([]);
  const [userRiskScore, setUserRiskScore] = useState(0);

  // Fetch all signals
  const { data: signalsResponse } = useSWR<{ signals: Signal[] }>('/api/signals', fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 30000,
  });

  const allSignals = signalsResponse?.signals || [];

  // Apply personalization filters
  useEffect(() => {
    if (!Array.isArray(allSignals)) return;
    const filtered = filterSignalsByPreferences(allSignals, preferences);
    setSignals(filtered);
    const riskScore = calculateUserRiskScore(filtered, preferences);
    setUserRiskScore(riskScore);
  }, [allSignals, preferences]);

  const highRiskAlerts = getHighRiskAlerts(signals, preferences.riskThreshold);
  const pinnedAlerts = signals.filter((s) => s.isPinned);
  const groupedByCategory = groupSignalsByCategory(signals);

  const getRiskColor = (risk: number) => {
    if (risk >= 80) return 'text-red-500';
    if (risk >= 60) return 'text-orange-500';
    if (risk >= 40) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getRiskBgColor = (risk: number) => {
    if (risk >= 80) return 'bg-red-500/10 border-red-500/30';
    if (risk >= 60) return 'bg-orange-500/10 border-orange-500/30';
    if (risk >= 40) return 'bg-yellow-500/10 border-yellow-500/30';
    return 'bg-green-500/10 border-green-500/30';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gradient-to-b from-[#12121a] to-[#0a0a0f] rounded-lg border border-accent-green/20">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-2 border-accent-green border-t-transparent rounded-full mb-2"></div>
          <p className="text-gray-400">Loading your personalized dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 bg-gradient-to-b from-[#12121a] to-[#0a0a0f] rounded-lg border border-accent-green/20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Eye className="w-6 h-6 text-accent-green" />
            {preferences.dashboardName || 'My Intelligence Dashboard'}
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Personalized for {preferences.riskPriority === 'all' ? 'all risks' : preferences.riskPriority} • Last updated just now
          </p>
        </div>
        <button
          onClick={onSettingsClick}
          className="p-2 hover:bg-accent-green/20 rounded-lg transition"
          title="Customize preferences"
        >
          <Settings className="w-5 h-5 text-accent-green" />
        </button>
      </div>

      {/* Overall Risk Score */}
      <div className={`p-4 rounded-lg border ${getRiskBgColor(userRiskScore)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gauge className={`w-6 h-6 ${getRiskColor(userRiskScore)}`} />
            <div>
              <p className="text-gray-400 text-sm">Your Overall Risk Score</p>
              <p className={`text-3xl font-bold ${getRiskColor(userRiskScore)}`}>
                {userRiskScore.toFixed(0)}%
              </p>
            </div>
          </div>
          <div className="text-right text-sm text-gray-400">
            <p>{signals.length} relevant signals</p>
            <p className="text-accent-green">{highRiskAlerts.length} high-risk</p>
          </div>
        </div>
      </div>

      {/* My Regions */}
      {preferences.regions.length > 0 && (
        <div className="bg-[#12121a] border border-accent-green/20 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-accent-green" />
            📍 My Regions
          </h3>
          <div className="flex flex-wrap gap-2">
            {preferences.regions.map((region) => (
              <span
                key={region}
                className="px-3 py-1 bg-accent-green/20 text-accent-green rounded-full text-sm font-mono"
              >
                {region}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Pinned Alerts */}
      {pinnedAlerts.length > 0 && (
        <div className="bg-[#12121a] border border-yellow-500/30 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            ⭐ Pinned Events ({pinnedAlerts.length})
          </h3>
          <div className="space-y-2">
            {pinnedAlerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg hover:bg-yellow-500/10 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">{alert.title}</p>
                    <p className="text-gray-400 text-xs mt-1">{alert.timeAgo}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-mono ${
                    alert.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                    alert.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {alert.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* High-Risk Alerts */}
      {highRiskAlerts.length > 0 && (
        <div className="bg-[#12121a] border border-red-500/30 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            ⚠️ High-Risk Alerts ({highRiskAlerts.length})
          </h3>
          <div className="space-y-2">
            {highRiskAlerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg hover:bg-red-500/10 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">{alert.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">{alert.timeAgo}</span>
                      <span className="text-xs bg-accent-green/20 text-accent-green px-2 py-0.5 rounded">
                        {alert.category}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${getRiskColor(alert.riskScore)}`}>
                      {alert.riskScore.toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Interests */}
      {Object.values(groupedByCategory).some((alerts) => alerts.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(groupedByCategory).map(([category, categoryAlerts]) => (
            categoryAlerts.length > 0 && (
              <div
                key={category}
                className="bg-[#12121a] border border-accent-green/20 rounded-lg p-4 hover:border-accent-green/50 transition"
              >
                <h4 className="text-sm font-semibold text-accent-green mb-2 uppercase">
                  📈 {category}
                </h4>
                <p className="text-gray-400 text-sm">
                  {categoryAlerts.length} signal{categoryAlerts.length !== 1 ? 's' : ''}
                </p>
                {categoryAlerts.slice(0, 3).map((alert) => (
                  <p key={alert.id} className="text-xs text-gray-500 mt-1 truncate">
                    • {alert.title}
                  </p>
                ))}
              </div>
            )
          ))}
        </div>
      )}

      {/* Empty State */}
      {signals.length === 0 && (
        <div className="text-center py-12">
          <Filter className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No signals match your preferences</p>
          <button
            onClick={onSettingsClick}
            className="mt-4 px-4 py-2 bg-accent-green/20 text-accent-green rounded hover:bg-accent-green/30 transition"
          >
            Update Preferences
          </button>
        </div>
      )}
    </div>
  );
}
