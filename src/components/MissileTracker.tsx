'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import useSWR from 'swr';
import { ChevronLeft, ChevronRight, Play, Pause, MapPin, Target, TrendingUp } from 'lucide-react';
import {
  MissileDatabase,
  MissileSignal,
  MissileType,
  TestOutcome,
  MissileTest,
  Severity,
} from '@/types/missiles';
import {
  initializeThreeScene,
  createTrajectoryLine,
  createMarker,
  createLaunchAnimation,
} from '@/lib/missileViz';

interface MissileTrackerProps {
  onSignalsLoaded?: (signals: MissileSignal[]) => void;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function MissileTracker({ onSignalsLoaded }: MissileTrackerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const visualizationRef = useRef<any>(null);

  const [selectedYear, setSelectedYear] = useState<number>(2023);
  const [selectedOutcome, setSelectedOutcome] = useState<TestOutcome | 'all'>('all');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [selectedTest, setSelectedTest] = useState<MissileTest | null>(null);

  // Fetch missile data
  const { data: missileResponse, isLoading, error } = useSWR('/api/missiles', fetcher);

  const database: MissileDatabase | null = missileResponse?.data || null;
  const signals: MissileSignal[] = missileResponse?.signals || [];

  // Notify parent of loaded signals
  useEffect(() => {
    if (signals.length > 0 && onSignalsLoaded) {
      onSignalsLoaded(signals);
    }
  }, [signals, onSignalsLoaded]);

  // Get current year's tests
  const yearData = database?.timelines.find((t) => t.year === selectedYear);
  const yearsTests = yearData?.tests || [];

  // Filter tests by outcome
  const filteredTests =
    selectedOutcome === 'all'
      ? yearsTests
      : yearsTests.filter((t) => t.outcome === selectedOutcome);

  const currentTest = filteredTests[currentTestIndex] || null;

  // Initialize Three.js visualization
  useEffect(() => {
    if (!containerRef.current || !database) return;

    try {
      const setup = initializeThreeScene(containerRef.current);
      visualizationRef.current = setup;

      // Draw all missile trajectories for the year
      yearsTests.forEach((test) => {
        if (test.outcome !== 'unknown') {
          const color =
            test.outcome === 'success'
              ? 0x00ff00 // Green
              : 0xff0000; // Red

          const line = createTrajectoryLine(
            test.facility.lat,
            test.facility.lon,
            test.landingLocation.lat,
            test.landingLocation.lon,
            test.apogee || 0,
            color
          );
          setup.scene.add(line);
        }

        // Add launch site markers
        const marker = createMarker(test.facility.lat, test.facility.lon, 1.5);
        setup.scene.add(marker);
      });

      return () => {
        setup.cleanup();
      };
    } catch (err) {
      console.error('Failed to initialize visualization:', err);
    }
  }, [database, yearsTests]);

  // Playback logic
  useEffect(() => {
    if (!isPlaying || filteredTests.length === 0) return;

    const interval = setInterval(() => {
      setCurrentTestIndex((prev) => {
        const next = (prev + 1) % filteredTests.length;
        if (next === 0) setIsPlaying(false); // Stop at end
        return next;
      });
    }, 2000 / playbackSpeed); // Adjust speed

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, filteredTests.length]);

  // Update selected test
  useEffect(() => {
    if (currentTestIndex < filteredTests.length) {
      setSelectedTest(filteredTests[currentTestIndex]);
    }
  }, [currentTestIndex, filteredTests]);

  const handlePreviousYear = () => {
    setSelectedYear((prev) => Math.max(prev - 1, 1984));
    setCurrentTestIndex(0);
  };

  const handleNextYear = () => {
    setSelectedYear((prev) =>
      Math.min(prev + 1, database?.statistics.timespan.end || new Date().getFullYear())
    );
    setCurrentTestIndex(0);
  };

  const handlePreviousTest = () => {
    setCurrentTestIndex((prev) => Math.max(prev - 1, 0));
    setIsPlaying(false);
  };

  const handleNextTest = () => {
    setCurrentTestIndex((prev) => Math.min(prev + 1, filteredTests.length - 1));
    setIsPlaying(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gradient-to-b from-[#12121a] to-[#0a0a0f] rounded-lg border border-accent-green/20">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 text-accent-green/50 mx-auto mb-2">
            ⚙️
          </div>
          <p className="text-gray-400">Loading missile database...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-gradient-to-b from-[#12121a] to-[#0a0a0f] rounded-lg border border-red-500/20">
        <div className="text-center">
          <p className="text-red-400 font-semibold">Failed to load missile data</p>
          <p className="text-gray-400 text-sm mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 bg-gradient-to-b from-[#12121a] to-[#0a0a0f] p-4 rounded-lg border border-accent-green/20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Target className="w-6 h-6 text-accent-green" />
          NK Missile Tracker
        </h2>
        <span className="text-xs text-gray-400">Interactive missile test visualization</span>
      </div>

      {/* 3D Visualization */}
      <div
        ref={containerRef}
        className="w-full h-96 rounded-lg border border-accent-green/20 bg-black overflow-hidden"
      />

      {/* Controls */}
      <div className="bg-[#0a0a0f] p-4 rounded-lg border border-accent-green/20 space-y-4">
        {/* Year Selection */}
        <div>
          <label className="block text-xs text-gray-400 mb-2 font-semibold uppercase">
            📅 Year: {selectedYear}
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousYear}
              disabled={selectedYear <= 1984}
              className="p-2 rounded bg-accent-green/20 hover:bg-accent-green/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex-1 grid grid-cols-5 gap-1">
              {database?.timelines.slice(-5).map((timeline) => (
                <button
                  key={timeline.year}
                  onClick={() => {
                    setSelectedYear(timeline.year);
                    setCurrentTestIndex(0);
                  }}
                  className={`px-2 py-1 rounded text-sm transition ${
                    selectedYear === timeline.year
                      ? 'bg-accent-green text-[#0a0a0f]'
                      : 'bg-[#12121a] text-gray-400 hover:bg-[#1a1a25]'
                  }`}
                >
                  {timeline.year}
                </button>
              ))}
            </div>

            <button
              onClick={handleNextYear}
              disabled={selectedYear >= (database?.statistics.timespan.end || 2026)}
              className="p-2 rounded bg-accent-green/20 hover:bg-accent-green/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Outcome Filter */}
        <div>
          <label className="block text-xs text-gray-400 mb-2 font-semibold uppercase">
            📊 Outcome
          </label>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'success', 'failure', 'unknown'] as const).map((outcome) => (
              <button
                key={outcome}
                onClick={() => {
                  setSelectedOutcome(outcome);
                  setCurrentTestIndex(0);
                }}
                className={`px-3 py-1.5 rounded text-sm transition border ${
                  selectedOutcome === outcome
                    ? 'bg-accent-green text-[#0a0a0f] border-accent-green'
                    : 'bg-[#12121a] border-gray-600/30 text-gray-400 hover:border-accent-green/50'
                }`}
              >
                {outcome === 'all'
                  ? '🎯 All'
                  : outcome === 'success'
                    ? '✓ Success'
                    : outcome === 'failure'
                      ? '✗ Failure'
                      : '? Unknown'}
              </button>
            ))}
          </div>
        </div>

        {/* Playback Controls */}
        <div className="space-y-2">
          <label className="block text-xs text-gray-400 font-semibold uppercase">⏱️ Playback</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded bg-accent-green/20 hover:bg-accent-green/30"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            <button
              onClick={handlePreviousTest}
              disabled={currentTestIndex === 0}
              className="p-2 rounded bg-accent-green/20 hover:bg-accent-green/30 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex-1 h-2 bg-[#1a1a25] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent-green to-accent-green/50 transition-all"
                style={{
                  width: `${
                    filteredTests.length > 0
                      ? (currentTestIndex / (filteredTests.length - 1)) * 100
                      : 0
                  }%`,
                }}
              />
            </div>

            <button
              onClick={handleNextTest}
              disabled={currentTestIndex >= filteredTests.length - 1}
              className="p-2 rounded bg-accent-green/20 hover:bg-accent-green/30 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <select
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
              className="px-2 py-1 rounded bg-[#12121a] text-gray-400 border border-gray-600/30 text-sm"
            >
              <option value="0.5">0.5x</option>
              <option value="1">1x</option>
              <option value="2">2x</option>
              <option value="4">4x</option>
            </select>
          </div>

          <div className="text-xs text-gray-400 text-center">
            Test {currentTestIndex + 1} / {filteredTests.length}
          </div>
        </div>
      </div>

      {/* Test Details */}
      {currentTest && (
        <div className="bg-[#0a0a0f] p-4 rounded-lg border border-accent-green/20 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">{currentTest.testName}</h3>
              <p className="text-sm text-gray-400 mt-1">
                {new Date(currentTest.date).toLocaleDateString()}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded text-xs font-mono ${
                currentTest.outcome === 'success'
                  ? 'bg-green-500/20 text-green-400'
                  : currentTest.outcome === 'failure'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-yellow-500/20 text-yellow-400'
              }`}
            >
              {currentTest.outcome.toUpperCase()}
            </span>
          </div>

          {/* Specs Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[#12121a] p-2 rounded border border-accent-green/20">
              <div className="text-xs text-gray-500">Apogee</div>
              <div className="text-lg font-bold text-accent-green">
                {currentTest.apogee || '?'} km
              </div>
            </div>

            <div className="bg-[#12121a] p-2 rounded border border-accent-green/20">
              <div className="text-xs text-gray-500">Distance</div>
              <div className="text-lg font-bold text-accent-green">
                {currentTest.distance || '?'} km
              </div>
            </div>

            <div className="bg-[#12121a] p-2 rounded border border-accent-green/20">
              <div className="text-xs text-gray-500">Type</div>
              <div className="text-sm font-bold text-accent-green">{currentTest.missile.type}</div>
            </div>

            <div className="bg-[#12121a] p-2 rounded border border-accent-green/20">
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Facility
              </div>
              <div className="text-sm font-bold text-accent-green">{currentTest.facility.name}</div>
            </div>
          </div>

          {/* Description */}
          <div className="pt-2 border-t border-accent-green/10 text-sm text-gray-300">
            {currentTest.description}
          </div>
        </div>
      )}

      {/* Statistics */}
      {yearData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-[#12121a] rounded border border-accent-green/20">
            <div className="text-xs text-gray-400">Total Tests</div>
            <div className="text-2xl font-bold text-accent-green">{yearData.tests.length}</div>
          </div>

          <div className="p-3 bg-[#12121a] rounded border border-green-500/20">
            <div className="text-xs text-gray-400">Success</div>
            <div className="text-2xl font-bold text-green-400">{yearData.successCount}</div>
          </div>

          <div className="p-3 bg-[#12121a] rounded border border-red-500/20">
            <div className="text-xs text-gray-400">Failure</div>
            <div className="text-2xl font-bold text-red-400">{yearData.failureCount}</div>
          </div>

          <div className="p-3 bg-[#12121a] rounded border border-yellow-500/20">
            <div className="text-xs text-gray-400">Success Rate</div>
            <div className="text-2xl font-bold text-yellow-400">
              {yearData.tests.length > 0
                ? ((yearData.successCount / yearData.tests.length) * 100).toFixed(0)
                : 0}
              %
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
