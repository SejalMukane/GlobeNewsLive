'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, TrendingUp, Clock, CheckCircle, AlertTriangle, MapPin, Users, Zap, Shield } from 'lucide-react';

interface OSINTEvent {
  id: string;
  title: string;
  location?: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  credibility: number;
  description: string;
  sources: string[];
  causality?: string;
  prediction?: string;
  marketImpact?: string;
  verified?: boolean;
  txHash?: string;
  timestamp?: string;
}

// Causality Display Component
function CausalityDisplay({ data }: { data: any }) {
  try {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    
    return (
      <div className="space-y-4">
        {/* Root Cause */}
        {parsed.rootCause && (
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-300 mb-2">Root Cause</p>
            <p className="text-slate-200 text-sm leading-relaxed">{parsed.rootCause}</p>
            {parsed.confidence && (
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 bg-slate-700/50 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all"
                    style={{ width: `${parsed.confidence}%` }}
                  />
                </div>
                <span className="text-xs text-blue-300 font-bold">{parsed.confidence}% confidence</span>
              </div>
            )}
          </div>
        )}

        {/* Causal Chain */}
        {parsed.causalChain && parsed.causalChain.length > 0 && (
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
            <p className="text-sm font-semibold text-slate-300 mb-3">Causal Chain</p>
            <div className="space-y-2">
              {parsed.causalChain.map((item: string, idx: number) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-1.5" />
                    {idx < parsed.causalChain.length - 1 && (
                      <div className="w-0.5 h-6 bg-slate-700/50 mt-1" />
                    )}
                  </div>
                  <p className="text-sm text-slate-300 flex-1 pt-0.5">{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Precedents */}
        {parsed.precedents && parsed.precedents.length > 0 && (
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
            <p className="text-sm font-semibold text-slate-300 mb-3">Historical Precedents</p>
            <div className="flex flex-wrap gap-2">
              {parsed.precedents.map((precedent: string, idx: number) => (
                <span key={idx} className="px-3 py-1.5 bg-slate-700/50 border border-slate-600 rounded-lg text-xs text-slate-300 hover:bg-slate-700/70 transition-all">
                  📜 {precedent}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Stakeholders */}
        {parsed.stakeholders && typeof parsed.stakeholders === 'object' && (
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
            <p className="text-sm font-semibold text-slate-300 mb-3">Key Stakeholders</p>
            <div className="grid gap-2">
              {Object.entries(parsed.stakeholders).map(([actor, interests]: any, idx: number) => (
                <div key={idx} className="bg-slate-900/50 rounded p-3 border-l-2 border-blue-500/50">
                  <p className="text-xs font-bold text-blue-300">{actor}</p>
                  <p className="text-xs text-slate-300 mt-1">{interests}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  } catch (e) {
    return (
      <div className="bg-slate-900/50 rounded-lg p-4 text-slate-300 text-sm border-l-2 border-blue-500">
        {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
      </div>
    );
  }
}

// Market Impact Display Component
function MarketImpactDisplay({ data }: { data: any }) {
  try {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    
    const getSectorIcon = (sector: string): string => {
      const lower = sector.toLowerCase();
      if (lower.includes('oil') || lower.includes('energy')) return '🛢️';
      if (lower.includes('stock') || lower.includes('equit')) return '📈';
      if (lower.includes('supply') || lower.includes('chain')) return '🚢';
      if (lower.includes('crypto') || lower.includes('coin')) return '₿';
      if (lower.includes('currency') || lower.includes('forex')) return '💱';
      if (lower.includes('gold') || lower.includes('metal')) return '🏆';
      if (lower.includes('bond') || lower.includes('rate')) return '📊';
      return '💹';
    };

    const getImpactColor = (impact: string | number): { text: string; bg: string } => {
      const str = String(impact).toLowerCase();
      if (str.includes('+') || str.includes('spike') || str.includes('surge')) {
        return { text: 'text-green-300', bg: 'bg-green-900/30' };
      }
      if (str.includes('-') || str.includes('drop') || str.includes('fall')) {
        return { text: 'text-red-300', bg: 'bg-red-900/30' };
      }
      return { text: 'text-yellow-300', bg: 'bg-yellow-900/30' };
    };

    return (
      <div className="space-y-3">
        {Object.entries(parsed).map(([sector, impact]: any, idx: number) => {
          const colors = getImpactColor(impact);
          return (
            <div key={idx} className={`${colors.bg} border border-slate-700/50 rounded-lg p-4`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-2xl">{getSectorIcon(sector)}</span>
                  <div>
                    <p className="text-sm font-bold text-slate-300">{sector}</p>
                    <p className={`text-sm font-semibold ${colors.text} mt-1`}>{impact}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  } catch (e) {
    return (
      <div className="bg-slate-900/50 rounded-lg p-4 text-slate-300 text-sm border-l-2 border-green-500">
        {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
      </div>
    );
  }
}

// Prediction Display Component
function PredictionDisplay({ data }: { data: any }) {
  try {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    
    return (
      <div className="space-y-4">
        {/* Main Forecast */}
        <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-purple-300">Escalation Probability</p>
              <div className="text-3xl font-black text-purple-300 mt-1">
                {parsed.escalationProbability || parsed.probability}%
              </div>
            </div>
            <div className={`text-sm px-3 py-1.5 rounded-lg ${
              (parsed.escalationProbability || parsed.probability || 0) >= 70 
                ? 'bg-red-500/30 text-red-300 border border-red-500/50'
                : (parsed.escalationProbability || parsed.probability || 0) >= 50
                ? 'bg-orange-500/30 text-orange-300 border border-orange-500/50'
                : 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/50'
            }`}>
              {(parsed.escalationProbability || parsed.probability || 0) >= 70 ? '🔴 High' : (parsed.escalationProbability || parsed.probability || 0) >= 50 ? '🟠 Medium' : '🟡 Low'}
            </div>
          </div>
          <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
              style={{ width: `${parsed.escalationProbability || parsed.probability || 0}%` }}
            />
          </div>
        </div>

        {/* Timeline */}
        {parsed.timeline && (
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-orange-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-400">Expected Timeline</p>
              <p className="text-sm font-semibold text-orange-300">{parsed.timeline}</p>
            </div>
          </div>
        )}

        {/* Most Likely Outcomes */}
        {parsed.mostLikelyOutcomes && parsed.mostLikelyOutcomes.length > 0 && (
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
            <p className="text-sm font-semibold text-slate-300 mb-3">📊 Most Likely Outcomes</p>
            <div className="space-y-2">
              {parsed.mostLikelyOutcomes.map((outcome: string, idx: number) => (
                <div key={idx} className="flex items-start gap-3 bg-slate-900/30 rounded p-2.5">
                  <span className="text-lg flex-shrink-0">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                  </span>
                  <p className="text-sm text-slate-300">{outcome}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Market Impacts */}
        {parsed.marketImpacts && typeof parsed.marketImpacts === 'object' && (
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
            <p className="text-sm font-semibold text-slate-300 mb-3">💹 Market Impacts</p>
            <div className="grid gap-2">
              {Object.entries(parsed.marketImpacts).map(([market, impact]: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between bg-slate-900/50 rounded p-2.5 text-xs">
                  <span className="text-slate-300">{market}</span>
                  <span className={`font-semibold ${
                    typeof impact === 'string' && impact.includes('+') ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {impact}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Confidence */}
        {parsed.confidence && (
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3 flex items-center justify-between">
            <span className="text-xs text-slate-400">Prediction Confidence</span>
            <div className="flex items-center gap-2">
              <div className="w-32 bg-slate-700/50 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-green-400"
                  style={{ width: `${parsed.confidence}%` }}
                />
              </div>
              <span className="text-xs text-green-300 font-bold">{parsed.confidence}%</span>
            </div>
          </div>
        )}
      </div>
    );
  } catch (e) {
    return (
      <div className="bg-slate-900/50 rounded-lg p-4 text-slate-300 text-sm border-l-2 border-purple-500">
        {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
      </div>
    );
  }
}

export default function OSINTIntelligencePage() {
  const [events, setEvents] = useState<OSINTEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('severity');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const severityColors: Record<string, { bg: string; border: string; badge: string; icon: string }> = {
    CRITICAL: { bg: 'from-red-900/20 to-red-800/10', border: 'border-red-500/50', badge: 'bg-red-500 text-white', icon: '🔴' },
    HIGH: { bg: 'from-orange-900/20 to-orange-800/10', border: 'border-orange-500/50', badge: 'bg-orange-500 text-white', icon: '🟠' },
    MEDIUM: { bg: 'from-yellow-900/20 to-yellow-800/10', border: 'border-yellow-500/50', badge: 'bg-yellow-500 text-white', icon: '🟡' },
    LOW: { bg: 'from-green-900/20 to-green-800/10', border: 'border-green-500/50', badge: 'bg-green-500 text-white', icon: '🟢' },
  };

  const fetchOSINTFeed = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/osint-feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (data.success && data.events) {
        setEvents(data.events);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch OSINT feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash).then(() => {
      setCopiedHash(hash);
      setTimeout(() => setCopiedHash(null), 2000);
    });
  };

  useEffect(() => {
    fetchOSINTFeed();
    if (autoRefresh) {
      const interval = setInterval(fetchOSINTFeed, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const filteredEvents = events
    .filter(e => severityFilter === 'All' || e.severity === severityFilter)
    .filter(e => 
      searchQuery === '' || 
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.location?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'severity') {
        const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      } else if (sortBy === 'credibility') {
        return b.credibility - a.credibility;
      }
      return 0;
    });

  const stats = {
    total: events.length,
    critical: events.filter(e => e.severity === 'CRITICAL').length,
    verified: events.filter(e => e.verified).length,
    today: events.filter(e => {
      const eventDate = new Date(e.timestamp || 0);
      const today = new Date();
      return eventDate.toDateString() === today.toDateString();
    }).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 -left-1/2 w-full h-full bg-gradient-to-r from-blue-600/10 to-transparent blur-3xl rounded-full animate-pulse"></div>
        <div className="absolute bottom-0 -right-1/2 w-full h-full bg-gradient-to-l from-red-600/10 to-transparent blur-3xl rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Header */}
      <div className="backdrop-blur-xl bg-gradient-to-b from-slate-900/80 to-slate-900/20 border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  OSINT Intelligence
                </h1>
                <p className="text-slate-400 text-sm mt-1">Real-time Global Intelligence with AI Analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-300">LIVE</span>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-800/40 backdrop-blur border border-slate-700/50 rounded-lg p-4 hover:bg-slate-800/60 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs font-medium">TOTAL EVENTS</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500/50" />
              </div>
            </div>
            <div className="bg-slate-800/40 backdrop-blur border border-slate-700/50 rounded-lg p-4 hover:bg-slate-800/60 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs font-medium">CRITICAL</p>
                  <p className="text-2xl font-bold text-red-400 mt-1">{stats.critical}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500/50" />
              </div>
            </div>
            <div className="bg-slate-800/40 backdrop-blur border border-slate-700/50 rounded-lg p-4 hover:bg-slate-800/60 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs font-medium">VERIFIED</p>
                  <p className="text-2xl font-bold text-green-400 mt-1">{stats.verified}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500/50" />
              </div>
            </div>
            <div className="bg-slate-800/40 backdrop-blur border border-slate-700/50 rounded-lg p-4 hover:bg-slate-800/60 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs font-medium">TODAY</p>
                  <p className="text-2xl font-bold text-purple-400 mt-1">{stats.today}</p>
                </div>
                <Clock className="w-8 h-8 text-purple-500/50" />
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search events, locations, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-lg pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-all cursor-pointer"
              >
                <option>All</option>
                <option>CRITICAL</option>
                <option>HIGH</option>
                <option>MEDIUM</option>
                <option>LOW</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-all cursor-pointer"
              >
                <option value="severity">By Severity</option>
                <option value="credibility">By Credibility</option>
              </select>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-3 rounded-lg backdrop-blur border transition-all ${
                  autoRefresh
                    ? 'bg-green-500/20 border-green-500/50 text-green-400'
                    : 'bg-slate-800/50 border-slate-700/50 text-slate-400'
                }`}
              >
                {autoRefresh ? '⏱️' : '⏸️'}
              </button>
              <button
                onClick={fetchOSINTFeed}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50"
              >
                {loading ? '🔄' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Last Update */}
          <div className="mt-4 text-xs text-slate-500">
            Last updated: {lastUpdate.toLocaleTimeString()} • {filteredEvents.length} events shown
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {loading && (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="inline-block">
                <div className="w-16 h-16 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
              <p className="mt-4 text-slate-400">Fetching intelligence...</p>
            </div>
          </div>
        )}

        {!loading && filteredEvents.length === 0 && (
          <div className="text-center h-96 flex items-center justify-center">
            <div>
              <Shield className="w-16 h-16 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-400">No events matching your filters</p>
            </div>
          </div>
        )}

        {!loading && (
          <div className="grid gap-6">
            {filteredEvents.map((event, idx) => (
              <div
                key={event.id}
                onClick={() => setExpandedId(expandedId === event.id ? null : event.id)}
                className={`group bg-gradient-to-br ${severityColors[event.severity].bg} backdrop-blur border ${severityColors[event.severity].border} rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-slate-900/50 hover:scale-[1.02] hover:bg-opacity-100 animate-in fade-in slide-in-from-bottom-4`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* Event Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${severityColors[event.severity].badge}`}>
                        {severityColors[event.severity].icon} {event.severity}
                      </span>
                      {event.verified && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-300 border border-green-500/50 flex items-center gap-1">
                          ✓ VERIFIED
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
                      {event.title}
                    </h3>
                  </div>
                  <div className={`text-2xl transition-transform ${expandedId === event.id ? 'rotate-180' : ''}`}>
                    ↓
                  </div>
                </div>

                {/* Quick Info */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {event.location && (
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <MapPin className="w-4 h-4 text-blue-400" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Users className="w-4 h-4 text-purple-400" />
                    <span>{event.credibility}% Credible</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <TrendingUp className="w-4 h-4 text-orange-400" />
                    <span>{event.sources?.length || 0} Sources</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>{event.timestamp || 'Recent'}</span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-slate-300 text-sm mb-4 line-clamp-2">
                  {event.description}
                </p>

                {/* Expanded Content */}
                {expandedId === event.id && (
                  <div className="mt-6 pt-6 border-t border-slate-700/50 space-y-6 animate-in fade-in">
                    {/* Causality */}
                    {event.causality && (
                      <div>
                        <h4 className="text-lg font-bold text-blue-300 mb-3 flex items-center gap-2">
                          <span>🧠</span> Root Cause Analysis
                        </h4>
                        <CausalityDisplay data={event.causality} />
                      </div>
                    )}

                    {/* Prediction */}
                    {event.prediction && (
                      <div>
                        <h4 className="text-lg font-bold text-purple-300 mb-3 flex items-center gap-2">
                          <span>🔮</span> Escalation Forecast
                        </h4>
                        <PredictionDisplay data={event.prediction} />
                      </div>
                    )}

                    {/* Market Impact */}
                    {event.marketImpact && (
                      <div>
                        <h4 className="text-lg font-bold text-green-300 mb-3 flex items-center gap-2">
                          <span>📊</span> Market Impact
                        </h4>
                        <MarketImpactDisplay data={event.marketImpact} />
                      </div>
                    )}

                    {/* Blockchain Verification */}
                    {event.verified && event.txHash && (
                      <div>
                        <h4 className="text-lg font-bold text-green-300 mb-3 flex items-center gap-2">
                          <span>✅</span> Blockchain Verified
                        </h4>
                        <div className="relative overflow-hidden rounded-xl">
                          {/* Animated gradient background */}
                          <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 via-emerald-600/20 to-green-600/20 animate-pulse"></div>
                          
                          {/* Content */}
                          <div className="relative backdrop-blur-sm bg-gradient-to-br from-green-950/80 to-emerald-950/80 border border-green-500/40 p-6">
                            {/* Verified Badge */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <div className="relative">
                                  <div className="absolute inset-0 bg-green-500 rounded-full blur-md opacity-75 animate-pulse"></div>
                                  <div className="relative px-3 py-1 bg-green-500 rounded-full">
                                    <span className="text-xs font-black text-white">✓ VERIFIED</span>
                                  </div>
                                </div>
                              </div>
                              <span className="text-xs text-green-300/60 font-mono">XDC Apothem</span>
                            </div>

                            {/* Hash Display */}
                            <div className="space-y-2">
                              <p className="text-xs text-green-300/70 uppercase tracking-widest font-bold">Transaction Hash</p>
                              <div className="group relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity blur"></div>
                                <div 
                                  onClick={() => copyHash(event.txHash!)}
                                  className="relative font-mono text-sm text-green-300 bg-slate-900/80 border border-green-500/30 rounded-lg p-3 break-all hover:border-green-500/60 transition-all cursor-pointer select-all group-hover:bg-slate-900/95 group-hover:shadow-lg group-hover:shadow-green-500/20"
                                >
                                  {event.txHash}
                                </div>
                              </div>
                              <p className="text-xs text-green-400/50">
                                {copiedHash === event.txHash ? '✓ Copied to clipboard!' : 'Click to copy'}
                              </p>
                            </div>

                            {/* Security Indicators */}
                            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-green-500/20">
                              <div className="text-center">
                                <div className="text-lg">🔐</div>
                                <p className="text-[10px] text-green-400 mt-1">Immutable</p>
                              </div>
                              <div className="text-center">
                                <div className="text-lg">⛓️</div>
                                <p className="text-[10px] text-green-400 mt-1">On-Chain</p>
                              </div>
                              <div className="text-center">
                                <div className="text-lg">✨</div>
                                <p className="text-[10px] text-green-400 mt-1">Trusted</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sources */}
                    {event.sources && event.sources.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold text-slate-300 mb-2">📰 Data Sources</h4>
                        <div className="flex flex-wrap gap-2">
                          {event.sources.map((source, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-slate-800/50 border border-slate-700 rounded-full text-xs text-slate-300 hover:border-slate-600 transition-all"
                            >
                              {source}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
