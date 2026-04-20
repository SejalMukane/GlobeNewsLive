'use client';

import { useState } from 'react';
import { Link as LinkIcon, X, TrendingDown, TrendingUp, Zap } from 'lucide-react';
import { TimelineEvent } from '@/types';
import VerificationBadge from './VerificationBadge';

interface EventLinkerProps {
  selectedEvent?: TimelineEvent;
  linkedEvents?: TimelineEvent[];
  onLinkEvent?: (event: TimelineEvent) => void;
  onUnlinkEvent?: (eventId: string) => void;
}

interface ImpactChain {
  cause: TimelineEvent[];
  effect: TimelineEvent[];
  impact: TimelineEvent[];
}

export default function EventLinker({
  selectedEvent,
  linkedEvents = [],
  onLinkEvent,
  onUnlinkEvent,
}: EventLinkerProps) {
  const [expandedSection, setExpandedSection] = useState<'cause' | 'effect' | 'impact' | null>(null);

  if (!selectedEvent) {
    return (
      <div className="bg-gradient-to-b from-[#12121a] to-[#0a0a0f] p-4 rounded-lg border border-accent-green/20 h-full flex items-center justify-center">
        <div className="text-center">
          <LinkIcon className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Select an event to view connections</p>
        </div>
      </div>
    );
  }

  // Categorize events into cause/effect/impact
  const impactChain: ImpactChain = {
    cause: [],
    effect: [],
    impact: [],
  };

  linkedEvents.forEach((event) => {
    const timeDiff = event.timestamp.getTime() - selectedEvent.timestamp.getTime();

    if (timeDiff < -3600000) {
      impactChain.cause.push(event);
    } else if (timeDiff > 0 && timeDiff < 3600000) {
      impactChain.effect.push(event);
    } else if (timeDiff >= 3600000) {
      impactChain.impact.push(event);
    }
  });

  const renderEventCard = (event: TimelineEvent, isLinked: boolean = false) => (
    <div
      key={event.id}
      className="bg-[#0a0a0f] p-3 rounded border border-accent-green/20 hover:border-accent-green/50 transition"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-1">
            <p className="text-sm text-white font-medium truncate">{event.title}</p>
            <VerificationBadge event={event} />
          </div>
          <div className="flex gap-2 mt-1 flex-wrap">
            <span className="text-xs text-gray-500">{event.category}</span>
            <span
              className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                event.severity === 'CRITICAL'
                  ? 'bg-red-500/20 text-red-400'
                  : event.severity === 'HIGH'
                    ? 'bg-orange-500/20 text-orange-400'
                    : 'bg-yellow-500/20 text-yellow-400'
              }`}
            >
              {event.severity}
            </span>
          </div>
        </div>
        {onUnlinkEvent && isLinked && (
          <button
            onClick={() => onUnlinkEvent(event.id)}
            className="p-1 hover:bg-red-500/20 rounded transition flex-shrink-0"
            title="Remove link"
          >
            <X className="w-4 h-4 text-red-400" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-gradient-to-b from-[#12121a] to-[#0a0a0f] p-4 rounded-lg border border-accent-green/20 space-y-4 h-full flex flex-col overflow-hidden">
      {/* Selected Event Summary */}
      <div className="bg-[#0a0a0f] p-3 rounded border border-accent-green/30">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-semibold text-accent-green text-sm">📍 Selected Event</h4>
          <span className={`px-2 py-1 rounded text-xs font-mono ${
            selectedEvent.severity === 'CRITICAL'
              ? 'bg-red-500/20 text-red-400'
              : selectedEvent.severity === 'HIGH'
                ? 'bg-orange-500/20 text-orange-400'
                : 'bg-yellow-500/20 text-yellow-400'
          }`}>
            {selectedEvent.severity}
          </span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <p className="text-white text-sm font-medium line-clamp-2">{selectedEvent.title}</p>
          <VerificationBadge event={selectedEvent} />
        </div>
        <p className="text-gray-400 text-xs">{selectedEvent.timestamp.toLocaleDateString()}</p>
      </div>

      {/* Impact Chain or Loading State */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {linkedEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-gray-500 space-y-2">
            <div className="text-2xl">🔍</div>
            <p className="text-xs">Analyzing connections...</p>
            <p className="text-[10px] text-gray-600">
              Looking for related events across tags, timing, and impact
            </p>
          </div>
        ) : (
          <>
            {/* CAUSES - Events before selected */}
            {impactChain.cause.length > 0 && (
              <div>
                <button
                  onClick={() => setExpandedSection(expandedSection === 'cause' ? null : 'cause')}
                  className="w-full flex items-center justify-between mb-2 p-2 hover:bg-blue-500/10 rounded transition"
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-semibold text-blue-300">🔍 Root Causes</span>
                  </div>
                  <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                    {impactChain.cause.length}
                  </span>
                </button>
                {expandedSection === 'cause' && (
                  <div className="space-y-2 pl-2 border-l-2 border-blue-500/30">
                    {impactChain.cause.map((event) => renderEventCard(event, true))}
                  </div>
                )}
              </div>
            )}

            {/* EFFECTS - Events shortly after selected */}
            {impactChain.effect.length > 0 && (
              <div>
                <button
                  onClick={() => setExpandedSection(expandedSection === 'effect' ? null : 'effect')}
                  className="w-full flex items-center justify-between mb-2 p-2 hover:bg-yellow-500/10 rounded transition"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-semibold text-yellow-300">⚡ Immediate Effects</span>
                  </div>
                  <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded">
                    {impactChain.effect.length}
                  </span>
                </button>
                {expandedSection === 'effect' && (
                  <div className="space-y-2 pl-2 border-l-2 border-yellow-500/30">
                    {impactChain.effect.map((event) => renderEventCard(event, true))}
                  </div>
                )}
              </div>
            )}

            {/* IMPACTS - Events later in timeline */}
            {impactChain.impact.length > 0 && (
              <div>
                <button
                  onClick={() => setExpandedSection(expandedSection === 'impact' ? null : 'impact')}
                  className="w-full flex items-center justify-between mb-2 p-2 hover:bg-red-500/10 rounded transition"
                >
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-semibold text-red-300">📉 Cascading Impacts</span>
                  </div>
                  <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded">
                    {impactChain.impact.length}
                  </span>
                </button>
                {expandedSection === 'impact' && (
                  <div className="space-y-2 pl-2 border-l-2 border-red-500/30">
                    {impactChain.impact.map((event) => renderEventCard(event, true))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Summary Footer */}
      {linkedEvents.length > 0 && (
        <div className="border-t border-accent-green/20 pt-3 text-xs text-gray-400">
          <p className="text-center">
            💡 <span className="font-semibold">{linkedEvents.length}</span> related events found
          </p>
        </div>
      )}
    </div>
  );
}
