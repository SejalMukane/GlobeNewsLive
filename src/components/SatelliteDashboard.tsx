'use client';

import { useEffect, useState } from 'react';
import { Satellite, Orbit, Rocket, Globe, Calendar, Clock, Radio, Eye, Crosshair, RefreshCw, AlertTriangle } from 'lucide-react';
import SatelliteNews from './SatelliteNews';
import SatelliteOrbitViz from './SatelliteOrbitViz';

interface SatelliteData {
  catno: number;
  name: string;
  launchdate: string;
  decaydate?: string | null;
  tle?: {
    first_line: string;
    second_line: string;
  };
  description: string;
}

interface CountrySatellites {
  country: string;
  satellites: SatelliteData[];
  totalLaunches: number;
  activeSatellites: number;
  decayedSatellites: number;
  firstLaunch: string;
  latestLaunch: string;
}

const COUNTRY_DATA = {
  'north-korea': {
    label: 'North Korea',
    color: '#ef4444',
    dataFile: '/missile-viz/data/satellite.en.json'
  },
  'iran': {
    label: 'Iran',
    color: '#f97316',
    dataFile: '/missile-viz/iran/data/satellite.en.json'
  },
  'india': {
    label: 'India',
    color: '#3b82f6',
    dataFile: '/missile-viz/india/data/satellite.en.json'
  },
  'pakistan': {
    label: 'Pakistan',
    color: '#22c55e',
    dataFile: '/missile-viz/pakistan/data/satellite.en.json'
  }
};

// Fetch real-time TLE data from Celestrak
async function fetchRealTimeTLE(catno: number): Promise<{ line1: string; line2: string } | null> {
  try {
    const response = await fetch(`https://celestrak.org/NORAD/elements/gp.php?CATNR=${catno}&FORMAT=TLE`, {
      method: 'GET',
      headers: {
        'Accept': 'text/plain'
      }
    });
    
    if (!response.ok) return null;
    
    const text = await response.text();
    const lines = text.trim().split('\n');
    
    if (lines.length >= 3) {
      return {
        line1: lines[1].trim(),
        line2: lines[2].trim()
      };
    }
    
    return null;
  } catch (error) {
    console.warn(`Failed to fetch TLE for ${catno}:`, error);
    return null;
  }
}

export default function SatelliteDashboard() {
  const [selectedCountry, setSelectedCountry] = useState<keyof typeof COUNTRY_DATA>('north-korea');
  const [satelliteData, setSatelliteData] = useState<CountrySatellites | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [realTimeData, setRealTimeData] = useState<Record<number, { line1: string; line2: string }>>({});

  useEffect(() => {
    fetchSatelliteData();
  }, [selectedCountry]);

  const fetchSatelliteData = async () => {
    setLoading(true);
    try {
      const countryInfo = COUNTRY_DATA[selectedCountry];
      const response = await fetch(countryInfo.dataFile);
      const satellites: SatelliteData[] = await response.json();

      const activeSatellites = satellites.filter(s => !s.decaydate).length;
      const decayedSatellites = satellites.filter(s => s.decaydate).length;
      
      const launchDates = satellites.map(s => new Date(s.launchdate));
      const firstLaunch = new Date(Math.min(...launchDates.map(d => d.getTime())));
      const latestLaunch = new Date(Math.max(...launchDates.map(d => d.getTime())));

      setSatelliteData({
        country: countryInfo.label,
        satellites,
        totalLaunches: satellites.length,
        activeSatellites,
        decayedSatellites,
        firstLaunch: firstLaunch.toISOString().split('T')[0],
        latestLaunch: latestLaunch.toISOString().split('T')[0]
      });

      // Fetch real-time TLE data for active satellites
      const tleData: Record<number, { line1: string; line2: string }> = {};
      for (const sat of satellites) {
        if (!sat.decaydate && sat.catno) {
          const tle = await fetchRealTimeTLE(sat.catno);
          if (tle) {
            tleData[sat.catno] = tle;
          }
        }
      }
      setRealTimeData(tleData);

    } catch (error) {
      console.error('Failed to fetch satellite data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchSatelliteData();
    setRefreshing(false);
  };

  const getSatelliteType = (name: string, description: string): string => {
    const desc = description.toLowerCase();
    if (desc.includes('spy') || desc.includes('reconnaissance') || desc.includes('military')) return 'Spy/Reconnaissance';
    if (desc.includes('communication') || desc.includes('telecom')) return 'Communications';
    if (desc.includes('earth observation') || desc.includes('remote sensing') || desc.includes('imaging')) return 'Earth Observation';
    if (desc.includes('lunar') || desc.includes('moon')) return 'Lunar Probe';
    if (desc.includes('mars')) return 'Mars Mission';
    return 'Research';
  };

  const getSatelliteIcon = (type: string) => {
    switch (type) {
      case 'Spy/Reconnaissance': return <Eye className="h-5 w-5 text-red-400" />;
      case 'Communications': return <Radio className="h-5 w-5 text-blue-400" />;
      case 'Earth Observation': return <Globe className="h-5 w-5 text-green-400" />;
      case 'Lunar Probe': return <Moon className="h-5 w-5 text-yellow-400" />;
      case 'Mars Mission': return <Globe className="h-5 w-5 text-orange-400" />;
      default: return <Satellite className="h-5 w-5 text-purple-400" />;
    }
  };

  const countryInfo = COUNTRY_DATA[selectedCountry];

  // Prepare satellite data for 3D globe
  const satellitesForGlobe = satelliteData?.satellites.map(sat => ({
    name: sat.name,
    tle: realTimeData[sat.catno] || sat.tle || { line1: '', line2: '' },
    color: countryInfo.color
  })) || [];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 p-3">
              <Satellite className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Satellite Intelligence</h1>
              <p className="text-sm text-white/40">Real-time space-based asset monitoring</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={refreshData}
              disabled={refreshing}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Updating...' : 'Refresh TLE Data'}
            </button>
            
            <div className="flex gap-2">
              {Object.entries(COUNTRY_DATA).map(([key, data]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCountry(key as keyof typeof COUNTRY_DATA)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    selectedCountry === key 
                      ? 'bg-white/20 text-white' 
                      : 'text-white/40 hover:text-white/60'
                  }`}
                  style={{ borderLeft: selectedCountry === key ? `3px solid ${data.color}` : 'none' }}
                >
                  {data.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mx-auto" />
            <p className="text-white/40">Loading satellite data...</p>
          </div>
        </div>
      ) : satelliteData ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-indigo-500/10 p-2">
                  <Rocket className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs text-white/40">Total Launches</p>
                  <p className="text-2xl font-bold">{satelliteData.totalLaunches}</p>
                </div>
              </div>
            </div>
            
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-500/10 p-2">
                  <Satellite className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-white/40">Active</p>
                  <p className="text-2xl font-bold">{satelliteData.activeSatellites}</p>
                </div>
              </div>
            </div>
            
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-red-500/10 p-2">
                  <Crosshair className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-white/40">Decayed</p>
                  <p className="text-2xl font-bold">{satelliteData.decayedSatellites}</p>
                </div>
              </div>
            </div>
            
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-500/10 p-2">
                  <Calendar className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-white/40">First Launch</p>
                  <p className="text-lg font-bold">{satelliteData.firstLaunch}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 3D Globe Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* 3D Globe */}
            <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <div className="border-b border-white/5 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-white/60" />
                    <h2 className="text-sm font-semibold">Real-Time Satellite Orbits</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-white/40">Live Tracking</span>
                  </div>
                </div>
              </div>
              <div className="h-[500px]">
                {satellitesForGlobe.length > 0 ? (
                  <SatelliteOrbitViz country={selectedCountry} />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-white/20" />
                      <p className="text-white/40">No active satellites to display</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Satellite News Section */}
            <div className="mt-6">
              <SatelliteNews country={selectedCountry} />
            </div>

            {/* Active Satellites List */}
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <div className="border-b border-white/5 px-4 py-3">
                <h2 className="text-sm font-semibold">Active Satellites</h2>
              </div>
              <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                {satelliteData.satellites.filter(s => !s.decaydate).map((satellite, index) => (
                  <div key={index} className="rounded-lg bg-white/5 p-3">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-white/10 p-2">
                        {getSatelliteIcon(getSatelliteType(satellite.name, satellite.description))}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium">{satellite.name}</h3>
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        </div>
                        <p className="text-xs text-white/40 mt-1">
                          Launch: {satellite.launchdate}
                        </p>
                        {realTimeData[satellite.catno] && (
                          <p className="text-xs text-emerald-400 mt-1">
                            ✓ Real-time TLE active
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {satelliteData.satellites.filter(s => !s.decaydate).length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-white/40 text-sm">No active satellites</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Satellite Inventory */}
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <div className="border-b border-white/5 px-4 py-3">
              <h2 className="text-lg font-semibold">Complete Satellite Inventory</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {satelliteData.satellites.map((satellite, index) => {
                  const type = getSatelliteType(satellite.name, satellite.description);
                  const isActive = !satellite.decaydate;
                  const hasRealTime = !!realTimeData[satellite.catno];
                  
                  return (
                    <div key={index} className="rounded-xl border border-white/5 bg-white/5 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="rounded-lg bg-white/10 p-2">
                            {getSatelliteIcon(type)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{satellite.name}</h3>
                              <span className={`rounded-full px-2 py-0.5 text-xs ${
                                isActive 
                                  ? 'bg-emerald-500/10 text-emerald-400' 
                                  : 'bg-red-500/10 text-red-400'
                              }`}>
                                {isActive ? 'Active' : 'Decayed'}
                              </span>
                              {hasRealTime && (
                                <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs text-blue-400">
                                  Real-Time TLE
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-white/60 mt-1">{satellite.description}</p>
                            
                            <div className="flex items-center gap-4 mt-3 text-xs text-white/40">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Launch: {satellite.launchdate}
                              </span>
                              {satellite.decaydate && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Decay: {satellite.decaydate}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Crosshair className="h-3 w-3" />
                                CATNR: {satellite.catno}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="rounded-lg bg-white/5 px-3 py-1 text-xs">
                          {type}
                        </span>
                      </div>
                      
                      {/* TLE Data */}
                      {(satellite.tle || realTimeData[satellite.catno]) && (
                        <div className="mt-3 rounded-lg bg-black/20 p-3">
                          <p className="text-xs text-white/40 mb-1">
                            {realTimeData[satellite.catno] ? '🔴 Real-Time TLE (from NORAD)' : 'TLE Data:'}
                          </p>
                          <code className="text-xs text-white/60 block font-mono">
                            {realTimeData[satellite.catno]?.line1 || satellite.tle?.first_line}
                          </code>
                          <code className="text-xs text-white/60 block font-mono">
                            {realTimeData[satellite.catno]?.line2 || satellite.tle?.second_line}
                          </code>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Space Program Capabilities Summary */}
          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-semibold mb-4">Space Program Capabilities</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg bg-white/5 p-4">
                <h3 className="text-sm font-medium mb-2">Launch Vehicles</h3>
                <div className="space-y-2">
                  {satelliteData.satellites.map((s, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-white/60">{s.name}</span>
                      <span className="text-white/40">{s.launchdate}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="rounded-lg bg-white/5 p-4">
                <h3 className="text-sm font-medium mb-2">Mission Types</h3>
                <div className="space-y-2">
                  {Array.from(new Set(satelliteData.satellites.map(s => getSatelliteType(s.name, s.description)))).map((type, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {getSatelliteIcon(type)}
                      <span className="text-xs text-white/60">{type}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="rounded-lg bg-white/5 p-4">
                <h3 className="text-sm font-medium mb-2">Program Timeline</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/60">First Launch</span>
                    <span className="text-white/40">{satelliteData.firstLaunch}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/60">Latest Launch</span>
                    <span className="text-white/40">{satelliteData.latestLaunch}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/60">Program Duration</span>
                    <span className="text-white/40">
                      {Math.round((new Date(satelliteData.latestLaunch).getTime() - new Date(satelliteData.firstLaunch).getTime()) / (365 * 24 * 60 * 60 * 1000))} years
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex h-96 items-center justify-center rounded-2xl border border-white/5 bg-white/5">
          <div className="text-center">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-white/20" />
            <p className="text-white/40">No satellite data available</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper component for Moon icon
function Moon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}
