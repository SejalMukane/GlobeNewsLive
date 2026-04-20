'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CrisisTimeline, TimelineEvent } from '@/types';
import VerificationBadge from './VerificationBadge';

interface TimelineReplayProps {
  timeline: CrisisTimeline;
  onEventFocus?: (event: TimelineEvent) => void;
  onLinkedEventsShow?: (events: TimelineEvent[]) => void;
}

export default function TimelineReplay({
  timeline,
  onEventFocus,
  onLinkedEventsShow,
}: TimelineReplayProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef(0);

  const currentEvent = timeline.events[currentIndex];

  // Go to previous event
  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  // Go to next event
  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, timeline.events.length - 1));
  }, [timeline.events.length]);

  // Handle swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStartRef.current - touchEnd;

    // Swipe left (show next event)
    if (diff > 50) {
      handleNext();
    }
    // Swipe right (show previous event)
    else if (diff < -50) {
      handlePrevious();
    }
  };

  // Trigger callback when current event changes
  useEffect(() => {
    if (currentEvent && onEventFocus) {
      onEventFocus(currentEvent);
      console.log('🎬 Event focused:', currentEvent.title);
    }
  }, [currentEvent, onEventFocus]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrevious, handleNext]);

  const progressPercent = timeline.events.length > 0 
    ? (currentIndex / (timeline.events.length - 1)) * 100 
    : 0;

  if (timeline.events.length === 0) {
    return (
      <div className="w-full bg-gradient-to-b from-[#12121a] to-[#0a0a0f] p-4 rounded-lg border border-accent-green/20">
        <p className="text-center text-gray-400">No events in timeline</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="w-full bg-gradient-to-b from-[#12121a] to-[#0a0a0f] p-4 rounded-lg border border-accent-green/20 space-y-4"
    >
      {/* Event Display */}
      {currentEvent && (
        <div className="bg-[#0a0a0f] p-4 rounded-lg border border-accent-green/20 space-y-3">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-white">{currentEvent.title}</h3>
                <VerificationBadge event={currentEvent} />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {currentEvent.timestamp.toLocaleDateString()} at {currentEvent.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded text-xs font-mono whitespace-nowrap ml-2 ${
                currentEvent.severity === 'CRITICAL'
                  ? 'bg-red-500/20 text-red-400'
                  : currentEvent.severity === 'HIGH'
                    ? 'bg-orange-500/20 text-orange-400'
                    : currentEvent.severity === 'MEDIUM'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-green-500/20 text-green-400'
              }`}
            >
              {currentEvent.severity}
            </span>
          </div>
          <p className="text-gray-400 text-sm">{currentEvent.description}</p>
          
          {/* Tags and metadata */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-accent-green/10">
            <span className="text-xs bg-accent-green/20 text-accent-green px-2 py-1 rounded">
              {currentEvent.category}
            </span>
            {currentEvent.tags?.slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                {tag}
              </span>
            ))}
            <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded ml-auto">
              📍 {currentEvent.region}
            </span>
          </div>
          
          {/* Impact description */}
          {currentEvent.impact && (
            <div className="mt-2 p-2 bg-accent-green/10 border border-accent-green/30 rounded text-xs text-gray-300">
              💥 <span className="font-semibold">Impact:</span> {currentEvent.impact}
            </div>
          )}
        </div>
      )}

      {/* Timeline Progress */}
      <div className="bg-[#0a0a0f] p-3 rounded-lg border border-accent-green/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400 font-mono">
            Event {currentIndex + 1} / {timeline.events.length}
          </span>
          <span className="text-xs text-gray-400">
            {currentEvent?.timestamp.toLocaleDateString()}
          </span>
        </div>
        
        {/* Visual Progress Bar */}
        <div className="relative h-2 bg-[#1a1a25] rounded-full overflow-hidden border border-accent-green/20">
          <div
            className="h-full bg-gradient-to-r from-accent-green via-accent-green to-accent-green/50 transition-all duration-200"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Swipe Navigation Controls */}
      <div className="flex items-center justify-between gap-2 pt-2">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className={`p-2 rounded-lg transition flex items-center justify-center ${
            currentIndex === 0
              ? 'bg-gray-700/20 text-gray-600 cursor-not-allowed'
              : 'bg-accent-green/20 hover:bg-accent-green/30 text-accent-green'
          }`}
          title="Previous event (Swipe right or ← arrow)"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex-1 text-center">
          <p className="text-xs text-gray-400">
            ← Swipe left/right or use arrow keys →
          </p>
        </div>

        <button
          onClick={handleNext}
          disabled={currentIndex === timeline.events.length - 1}
          className={`p-2 rounded-lg transition flex items-center justify-center ${
            currentIndex === timeline.events.length - 1
              ? 'bg-gray-700/20 text-gray-600 cursor-not-allowed'
              : 'bg-accent-green/20 hover:bg-accent-green/30 text-accent-green'
          }`}
          title="Next event (Swipe left or → arrow)"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
