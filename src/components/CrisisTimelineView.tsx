'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Clock, Zap } from 'lucide-react';
import { Signal, TimelineEvent, CrisisTimeline } from '@/types';
import TimelineReplay from '@/components/TimelineReplay';
import EventLinker from '@/components/EventLinker';
import { createTimelineFromSignals, findLinkedEvents } from '@/lib/timeline';

interface CrisisTimelineViewProps {
  signals: Signal[];
  isLoading?: boolean;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function CrisisTimelineView({
  signals,
  isLoading = false,
}: CrisisTimelineViewProps) {
  const [selectedRegion, setSelectedRegion] = useState('Middle East');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [timeline, setTimeline] = useState<CrisisTimeline | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | undefined>(undefined);
  const [linkedEvents, setLinkedEvents] = useState<TimelineEvent[]>([]);

  // Popular crisis regions
  const CRISIS_REGIONS = [
    'Middle East',
    'Ukraine',
    'Asia-Pacific',
    'Africa',
    'Europe',
  ];

  // Generate timeline when region or time range changes
  useEffect(() => {
    if (signals.length > 0) {
      const newTimeline = createTimelineFromSignals(signals, selectedRegion, timeRange);
      setTimeline(newTimeline);
      setSelectedEvent(undefined);
      setLinkedEvents([]);
    }
  }, [signals, selectedRegion, timeRange]);

  // Find linked events when selected event changes
  useEffect(() => {
    if (selectedEvent && timeline) {
      const linked = findLinkedEvents(selectedEvent, timeline.events);
      setLinkedEvents(linked);
    } else {
      setLinkedEvents([]);
    }
  }, [selectedEvent, timeline]);

  const handleEventFocus = (event: TimelineEvent) => {
    console.log('🎯 Event selected:', event.title);
    setSelectedEvent(event);
  };

  if (isLoading || !timeline) {
    return (
      <div className="flex items-center justify-center h-96 bg-gradient-to-b from-[#12121a] to-[#0a0a0f] rounded-lg border border-accent-green/20">
        <div className="text-center">
          <Zap className="w-8 h-8 text-accent-green/50 mx-auto mb-2 animate-pulse" />
          <p className="text-gray-400">{isLoading ? 'Loading crisis timeline...' : 'No events available'}</p>
          {signals.length === 0 && (
            <p className="text-xs text-gray-500 mt-2">Waiting for signal data...</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 bg-gradient-to-b from-[#12121a] to-[#0a0a0f] p-4 rounded-lg border border-accent-green/20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Clock className="w-6 h-6 text-accent-green" />
          Crisis Timeline Replay
        </h2>
        <span className="text-xs text-gray-400">See how crises unfold in real-time</span>
      </div>

      {/* Controls Section - Organized */}
      <div className="bg-[#0a0a0f] p-4 rounded-lg border border-accent-green/20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Region Selection */}
          <div>
            <label className="block text-xs text-gray-400 mb-3 font-semibold uppercase tracking-wide">📍 Select Region</label>
            <div className="flex flex-wrap gap-2">
              {CRISIS_REGIONS.map((region) => (
                <button
                  key={region}
                  onClick={() => setSelectedRegion(region)}
                  className={`px-3 py-1.5 rounded text-sm transition border ${
                    selectedRegion === region
                      ? 'bg-accent-green text-[#0a0a0f] border-accent-green font-semibold'
                      : 'bg-[#12121a] border-gray-600/30 text-gray-400 hover:border-accent-green/50'
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>

          {/* Time Range Selection */}
          <div>
            <label className="block text-xs text-gray-400 mb-3 font-semibold uppercase tracking-wide">⏰ Time Range</label>
            <div className="flex gap-2">
              {(['24h', '7d', '30d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 rounded text-sm transition border ${
                    timeRange === range
                      ? 'bg-accent-green text-[#0a0a0f] border-accent-green font-semibold'
                      : 'bg-[#12121a] border-gray-600/30 text-gray-400 hover:border-accent-green/50'
                  }`}
                >
                  Last {range === '24h' ? '24 hours' : range === '7d' ? '7 days' : '30 days'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Timeline Replay - Takes 2 columns on large screens */}
        <div className="lg:col-span-2">
          <TimelineReplay
            timeline={timeline}
            onEventFocus={handleEventFocus}
            
            
            
          />
        </div>

        {/* Event Linker - Sidebar */}
        <div>
          <EventLinker
            selectedEvent={selectedEvent}
            linkedEvents={linkedEvents}
            onLinkEvent={(event) => setLinkedEvents([...linkedEvents, event])}
          />
        </div>
      </div>

      {/* Statistics Panel */}
      {timeline.events.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-accent-green/20">
          <div className="p-3 bg-[#12121a] rounded border border-accent-green/20">
            <div className="text-xs text-gray-400 mb-1">Total Events</div>
            <div className="text-2xl font-bold text-accent-green">{timeline.events.length}</div>
          </div>

          <div className="p-3 bg-[#12121a] rounded border border-red-500/20">
            <div className="text-xs text-gray-400 mb-1">Critical Events</div>
            <div className="text-2xl font-bold text-red-500">
              {timeline.events.filter((e) => e.severity === 'CRITICAL').length}
            </div>
          </div>

          <div className="p-3 bg-[#12121a] rounded border border-orange-500/20">
            <div className="text-xs text-gray-400 mb-1">High Priority</div>
            <div className="text-2xl font-bold text-orange-500">
              {timeline.events.filter((e) => e.severity === 'HIGH').length}
            </div>
          </div>

          <div className="p-3 bg-[#12121a] rounded border border-yellow-500/20">
            <div className="text-xs text-gray-400 mb-1">Timeline Span</div>
            <div className="text-lg font-bold text-yellow-500">
              {Math.ceil(
                (timeline.endDate.getTime() - timeline.startDate.getTime()) / (1000 * 60 * 60)
              )}
              h
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3 text-[11px] text-blue-200 space-y-1">
        <p className="font-semibold">💡 How to Use:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Select a region and time range to load crisis events</li>
          <li>Press ▶️ to replay events chronologically</li>
          <li>Click any event to see what triggered it and what it caused</li>
          <li>Adjust speed (0.5x - 4x) to watch unfolding at your pace</li>
        </ul>
      </div>
    </div>
  );
}


