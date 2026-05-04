'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, MapPin, Shield, ExternalLink, Filter } from 'lucide-react';

interface AIAnalysis {
  rootCause?: string;
  causalChain?: string[];
  precedents?: string[];
  stakeholders?: Record<string, string>;
  confidence?: number;
  escalationProbability?: number;
  timeline?: string;
  mostLikelyOutcomes?: string[];
  marketImpacts?: Record<string, string>;
}

interface OSINTEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  type: string;
  credibility: number;
  sources: string[];
  causality?: string | AIAnalysis;
  prediction?: string | AIAnalysis;
  ai_analysis?: string | GeminiAnalysis;
  verified?: boolean;
  txHash?: string;
  explorer?: string;
  timestamp?: string;
}

interface GeminiAnalysis {
  root_cause: string;
  causal_chain: string[];
  stakeholders: string[];
  escalation_probability: number;
  timeline: string;
  market_impact: {
    oil: string;
    stocks: string;
    crypto: string;
    bonds: string;
  };
}

interface OSINTResponse {
  success: boolean;
  events: OSINTEvent[];
  count: number;
  duration: number;
  timestamp: string;
}

const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'CRITICAL':
      return 'bg-red-900/30 border-red-500 text-red-300';
    case 'HIGH':
      return 'bg-orange-900/30 border-orange-500 text-orange-300';
    case 'MEDIUM':
      return 'bg-yellow-900/30 border-yellow-500 text-yellow-300';
    case 'LOW':
      return 'bg-green-900/30 border-green-500 text-green-300';
    default:
      return 'bg-gray-900/30 border-gray-500 text-gray-300';
  }
};

const getSeverityBadgeColor = (severity: string): string => {
  switch (severity) {
    case 'CRITICAL':
      return 'bg-red-500 text-white';
    case 'HIGH':
      return 'bg-orange-500 text-white';
    case 'MEDIUM':
      return 'bg-yellow-500 text-white';
    case 'LOW':
      return 'bg-green-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
};

const getSeverityIcon = (severity: string): string => {
  switch (severity) {
    case 'CRITICAL':
      return '🔴';
    case 'HIGH':
      return '🟠';
    case 'MEDIUM':
      return '🟡';
    case 'LOW':
      return '🟢';
    default:
      return '⚪';
  }
};

const parseJSON = (str: string | object | undefined): any => {
  if (typeof str === 'object') return str;
  if (!str) return {};
  try {
    return JSON.parse(str);
  } catch {
    return {};
  }
};

export default function OSINTPanel() {
  const [events, setEvents] = useState<OSINTEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('severity');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);

  const fetchOSINTFeed = async () => {
    setLoading(true);
    setEvents([]); // Clear previous events
    setProcessingStatus('Connecting...');
    setCurrentIndex(0);
    setTotalCount(0);

    try {
      const response = await fetch('/api/osint-feed', {
        method: 'GET',
        headers: { 'Accept': 'text/event-stream' },
      });

      if (!response.ok) throw new Error('Failed to fetch OSINT feed');
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;

          const jsonStr = trimmed.slice(6);
          if (jsonStr === '[DONE]') continue;

          try {
            const data = JSON.parse(jsonStr);

            if (data.type === 'status') {
              setProcessingStatus(data.message);
              if (data.total) setTotalCount(data.total);
            } else if (data.type === 'processing') {
              setCurrentIndex(data.index);
              setTotalCount(data.total);
              setProcessingStatus(`Processing: ${data.title} (${data.index}/${data.total})`);
            } else if (data.type === 'event') {
              setEvents(prev => [...prev, data.data]);
              setCurrentIndex(data.index);
              setProcessingStatus(`Verified: ${data.data.title} (${data.index}/${data.total})`);
            } else if (data.type === 'complete') {
              setProcessingStatus('Complete');
              setLastUpdate(new Date().toLocaleTimeString());
            } else if (data.type === 'error') {
              console.error('Stream error:', data.message);
              setProcessingStatus(`Error: ${data.message}`);
            }
          } catch (e) {
            console.warn('Failed to parse SSE data:', jsonStr);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching OSINT feed:', error);
      setProcessingStatus('Failed to load');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch only - no auto-refresh
  useEffect(() => {
    fetchOSINTFeed();
  }, []);

  // Filter events
  const filteredEvents = events.filter((event) => {
    if (filter === 'All') return true;
    return event.severity === filter;
  });

  // Sort events
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    switch (sortBy) {
      case 'severity':
        const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return (severityOrder[a.severity] || 4) - (severityOrder[b.severity] || 4);
      case 'credibility':
        return (b.credibility || 0) - (a.credibility || 0);
      case 'location':
        return (a.location || '').localeCompare(b.location || '');
      default:
        return 0;
    }
  });

  const EventCard = ({ event }: { event: OSINTEvent }) => {
    const isExpanded = expandedId === event.id;
    const causality = parseJSON(event.causality);
    const prediction = parseJSON(event.prediction);
    const aiAnalysis = parseJSON(event.ai_analysis) as GeminiAnalysis | undefined;

    return (
      <div
        className={`border rounded-lg p-4 cursor-pointer transition-all ${getSeverityColor(
          event.severity
        )} hover:border-opacity-100 border-opacity-50`}
        onClick={() => setExpandedId(isExpanded ? null : event.id)}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-2xl">{getSeverityIcon(event.severity)}</span>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-white">{event.title}</h3>
              <div className="flex gap-2 text-xs mt-1">
                <span className={`px-2 py-1 rounded ${getSeverityBadgeColor(event.severity)}`}>
                  {event.severity}
                </span>
                <span className="text-gray-400 flex items-center gap-1">
                  <MapPin size={14} /> {event.location}
                </span>
                <span className="text-gray-400">📊 {event.credibility}%</span>
              </div>
            </div>
          </div>
          <button
            className="text-gray-400 hover:text-white transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setExpandedId(isExpanded ? null : event.id);
            }}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-300 mb-3">{event.description}</p>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-opacity-30 space-y-3 animate-in fade-in">
            {/* AI Analysis - Escalation Probability */}
            {aiAnalysis?.escalation_probability !== undefined && (
              <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/20 border border-purple-500/40 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-sm text-purple-300 flex items-center gap-2">
                    <span className="text-lg">🧠</span> AI Intelligence Analysis
                  </h4>
                  <span className="text-xs px-2 py-1 bg-purple-500/20 rounded text-purple-300">
                    Groq Mixtral
                  </span>
                </div>
                
                {/* Escalation Probability Meter */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-300">Escalation Probability</span>
                    <span className={`text-lg font-bold ${
                      aiAnalysis.escalation_probability >= 70 ? 'text-red-400' :
                      aiAnalysis.escalation_probability >= 50 ? 'text-orange-400' :
                      'text-yellow-400'
                    }`}>
                      {aiAnalysis.escalation_probability}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        aiAnalysis.escalation_probability >= 70 ? 'bg-gradient-to-r from-red-600 to-red-400' :
                        aiAnalysis.escalation_probability >= 50 ? 'bg-gradient-to-r from-orange-600 to-orange-400' :
                        'bg-gradient-to-r from-yellow-600 to-yellow-400'
                      }`}
                      style={{ width: `${aiAnalysis.escalation_probability}%` }}
                    />
                  </div>
                </div>

                {/* Root Cause */}
                {aiAnalysis.root_cause && (
                  <div className="mb-3">
                    <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Root Cause</h5>
                    <p className="text-sm text-gray-200 leading-relaxed">{aiAnalysis.root_cause}</p>
                  </div>
                )}

                {/* Timeline */}
                {aiAnalysis.timeline && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">⏱️ Expected Timeline:</span>
                    <span className="text-white font-semibold">{aiAnalysis.timeline}</span>
                  </div>
                )}
              </div>
            )}

            {/* Key Stakeholders */}
            {aiAnalysis?.stakeholders && aiAnalysis.stakeholders.length > 0 && (
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
                <h4 className="font-semibold text-sm text-white mb-3 flex items-center gap-2">
                  <span>🎯</span> Key Stakeholders
                </h4>
                <div className="flex flex-wrap gap-2">
                  {aiAnalysis.stakeholders.map((stakeholder, idx) => (
                    <span 
                      key={idx} 
                      className="px-3 py-1.5 bg-blue-900/30 border border-blue-500/30 rounded-lg text-xs text-blue-200 hover:bg-blue-900/50 transition-colors"
                    >
                      {stakeholder}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Causal Chain */}
            {aiAnalysis?.causal_chain && aiAnalysis.causal_chain.length > 0 && (
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
                <h4 className="font-semibold text-sm text-white mb-3 flex items-center gap-2">
                  <span>🔗</span> Causal Chain
                </h4>
                <div className="space-y-2">
                  {aiAnalysis.causal_chain.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-xs text-blue-300 font-bold">
                          {idx + 1}
                        </div>
                        {idx < aiAnalysis.causal_chain.length - 1 && (
                          <div className="w-0.5 h-6 bg-slate-700/50 mt-1" />
                        )}
                      </div>
                      <p className="text-sm text-gray-300 flex-1 pt-0.5">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Market Impact */}
            {aiAnalysis?.market_impact && (
              <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/10 border border-green-500/30 rounded-lg p-4">
                <h4 className="font-semibold text-sm text-green-300 mb-3 flex items-center gap-2">
                  <span>💹</span> Market Impact Assessment
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(aiAnalysis.market_impact).map(([sector, impact]) => {
                    const impactStr = String(impact).toLowerCase();
                    const isPositive = impactStr.includes('+') || impactStr.includes('rally') || impactStr.includes('surge');
                    const isNegative = impactStr.includes('-') || impactStr.includes('drop') || impactStr.includes('fall');
                    const colorClass = isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-yellow-400';
                    const bgClass = isPositive ? 'bg-green-900/20' : isNegative ? 'bg-red-900/20' : 'bg-yellow-900/20';
                    
                    return (
                      <div key={sector} className={`${bgClass} rounded-lg p-3 border border-slate-700/50`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400 uppercase tracking-wider">{sector}</span>
                          <span className="text-lg">
                            {sector === 'oil' ? '🛢️' : sector === 'stocks' ? '📈' : sector === 'crypto' ? '₿' : '📊'}
                          </span>
                        </div>
                        <p className={`text-sm font-semibold mt-1 ${colorClass}`}>{impact}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Legacy Causality (fallback) */}
            {(causality.rootCause || event.causality) && !aiAnalysis?.root_cause && (
              <div>
                <h4 className="font-semibold text-sm text-white mb-1">🧠 Root Cause:</h4>
                <p className="text-sm text-gray-300">{causality.rootCause || 'Analysis pending...'}</p>
              </div>
            )}

            {/* Legacy Causal Chain (fallback) */}
            {causality.causalChain && causality.causalChain.length > 0 && !aiAnalysis?.causal_chain && (
              <div>
                <h4 className="font-semibold text-sm text-white mb-1">🔗 Causal Chain:</h4>
                <ul className="text-sm text-gray-300 list-disc list-inside space-y-1">
                  {causality.causalChain.map((step: string, idx: number) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Legacy Prediction (fallback) */}
            {(prediction.escalationProbability || prediction.timeline) && !aiAnalysis?.escalation_probability && (
              <div className="bg-blue-900/20 border border-blue-500/30 rounded p-3">
                <h4 className="font-semibold text-sm text-blue-300 mb-2">🔮 Escalation Forecast:</h4>
                <div className="text-sm text-gray-300 space-y-1">
                  <p>
                    📈 Probability: <span className="font-semibold">{prediction.escalationProbability}%</span>
                  </p>
                  <p>
                    ⏱️ Timeline: <span className="font-semibold">{prediction.timeline}</span>
                  </p>
                </div>
              </div>
            )}

            {/* Legacy Market Impacts (fallback) */}
            {prediction.marketImpacts && Object.keys(prediction.marketImpacts).length > 0 && !aiAnalysis?.market_impact && (
              <div className="bg-purple-900/20 border border-purple-500/30 rounded p-3">
                <h4 className="font-semibold text-sm text-purple-300 mb-2">💹 Market Impact:</h4>
                <div className="text-sm text-gray-300 space-y-1">
                  {Object.entries(prediction.marketImpacts as Record<string, string>).map(([key, value]) => (
                    <p key={key}>
                      {key}: <span className="font-semibold">{value}</span>
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Blockchain Verification */}
            {event.verified && event.txHash && (
              <div className="bg-green-900/20 border border-green-500/30 rounded p-3">
                <h4 className="font-semibold text-sm text-green-300 mb-2">✅ Blockchain Verified</h4>
                <div className="text-xs text-gray-400 space-y-2">
                  <p className="font-mono break-all">{event.txHash}</p>
                  {event.explorer && (
                    <a
                      href={event.explorer}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-400 hover:text-green-300 flex items-center gap-1"
                    >
                      View on Explorer <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Sources */}
            {event.sources && event.sources.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-white mb-1">📰 Sources:</h4>
                <div className="flex flex-wrap gap-2">
                  {event.sources.map((source, idx) => (
                    <span key={idx} className="text-xs px-2 py-1 bg-gray-800/50 rounded text-gray-300">
                      {source}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-black border border-gray-700 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              🧠 OSINT Intelligence Feed
              {loading && <RefreshCw className="animate-spin" size={20} />}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Last updated: {lastUpdate || 'Loading...'} • {events.length} events
            </p>
          </div>
          <button
            onClick={fetchOSINTFeed}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg text-white font-semibold transition-colors"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Refresh Now
          </button>
        </div>

        {/* Controls */}
        <div className="flex gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-sm text-white hover:border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              <option>All</option>
              <option>CRITICAL</option>
              <option>HIGH</option>
              <option>MEDIUM</option>
              <option>LOW</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-sm text-white hover:border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="severity">Sort: Severity</option>
              <option value="credibility">Sort: Credibility</option>
              <option value="location">Sort: Location</option>
            </select>
          </div>

          <div className="text-sm text-gray-400 flex items-center">
            Showing {sortedEvents.length} of {events.length} events
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      {loading && totalCount > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-300">{processingStatus}</span>
            <span className="text-sm text-gray-400">{currentIndex}/{totalCount}</span>
          </div>
          <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
              style={{ width: `${totalCount > 0 ? (currentIndex / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Events List */}
      <div className="space-y-3">
        {sortedEvents.length > 0 ? (
          sortedEvents.map((event) => <EventCard key={event.id} event={event} />)
        ) : (
          <div className="text-center py-12 text-gray-400">
            <Shield size={48} className="mx-auto mb-3 opacity-50" />
            <p>No events found. Click "Refresh Now" to fetch data.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 text-xs text-gray-500 text-center">
        <p>
          🔗 All critical events verified on XDC Blockchain • AI Analysis powered by Groq Mixtral • Auto-updates every 20 minutes
        </p>
      </div>
    </div>
  );
}
