'use client';

import { useState } from 'react';
import {
  X,
  Settings,
  MapPin,
  Filter,
  AlertTriangle,
  Bell,
  RotateCcw,
  Save,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { UserPreferences, SignalCategory, Severity, RiskPriority } from '@/types';

interface PreferencesModalProps {
  isOpen: boolean;
  preferences: UserPreferences;
  onClose: () => void;
  onSave: (prefs: UserPreferences) => void;
  onReset: () => void;
  onToggleRegion: (region: string) => void;
  onToggleInterest: (interest: SignalCategory) => void;
  onSetRiskPriority: (priority: RiskPriority) => void;
  onSetMinSeverity: (severity: Severity) => void;
  onSetRiskThreshold: (threshold: number) => void;
  onUpdateNotifications: (updates: Partial<UserPreferences['notificationSettings']>) => void;
}

const AVAILABLE_REGIONS = [
  'USA',
  'Europe',
  'Middle East',
  'Asia',
  'Africa',
  'South America',
  'Russia',
  'China',
  'India',
  'Japan',
];

const AVAILABLE_INTERESTS: SignalCategory[] = [
  'conflict',
  'military',
  'diplomacy',
  'cyber',
  'disaster',
  'economy',
  'politics',
  'terrorism',
  'protest',
  'infrastructure',
];

const RISK_PRIORITIES: RiskPriority[] = ['all', 'economy', 'security', 'travel'];

const SEVERITY_LEVELS: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];

export default function PreferencesModal({
  isOpen,
  preferences,
  onClose,
  onSave,
  onReset,
  onToggleRegion,
  onToggleInterest,
  onSetRiskPriority,
  onSetMinSeverity,
  onSetRiskThreshold,
  onUpdateNotifications,
}: PreferencesModalProps) {
  const [tab, setTab] = useState<'regions' | 'interests' | 'priorities' | 'notifications'>(
    'regions'
  );
  const [tempThreshold, setTempThreshold] = useState(preferences.riskThreshold);

  if (!isOpen) return null;

  const handleSave = () => {
    onSetRiskThreshold(tempThreshold);
    onSave(preferences);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-[#12121a] to-[#0a0a0f] border border-accent-green/30 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-accent-green/20">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-accent-green" />
            Customize Your Dashboard
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-red-500/20 rounded transition"
          >
            <X className="w-6 h-6 text-gray-400 hover:text-red-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-accent-green/20 bg-[#0a0a0f]">
          {(['regions', 'interests', 'priorities', 'notifications'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 px-4 text-sm font-mono transition capitalize border-b-2 ${
                tab === t
                  ? 'text-accent-green border-b-accent-green'
                  : 'text-gray-400 border-b-transparent hover:text-gray-300'
              }`}
            >
              {t === 'regions' && <MapPin className="w-4 h-4 inline mr-2" />}
              {t === 'interests' && <Filter className="w-4 h-4 inline mr-2" />}
              {t === 'priorities' && <AlertTriangle className="w-4 h-4 inline mr-2" />}
              {t === 'notifications' && <Bell className="w-4 h-4 inline mr-2" />}
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Regions Tab */}
          {tab === 'regions' && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">📍 Select Your Regions</h3>
              <p className="text-gray-400 text-sm mb-4">
                Choose regions that matter most to you. Signals from these areas will be prioritized.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {AVAILABLE_REGIONS.map((region) => (
                  <button
                    key={region}
                    onClick={() => onToggleRegion(region)}
                    className={`p-3 rounded-lg border transition text-left ${
                      preferences.regions.includes(region)
                        ? 'bg-accent-green/20 border-accent-green text-accent-green'
                        : 'bg-[#12121a] border-gray-600/30 text-gray-400 hover:border-gray-500/50'
                    }`}
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-4 h-4 border rounded mr-3 transition flex items-center justify-center ${
                          preferences.regions.includes(region)
                            ? 'bg-accent-green border-accent-green'
                            : 'border-gray-500'
                        }`}
                      >
                        {preferences.regions.includes(region) && (
                          <span className="text-[#0a0a0f] text-sm">✓</span>
                        )}
                      </div>
                      {region}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Interests Tab */}
          {tab === 'interests' && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">🎯 Select Your Interests</h3>
              <p className="text-gray-400 text-sm mb-4">
                Pick signal categories that matter for your intelligence focus.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {AVAILABLE_INTERESTS.map((interest) => (
                  <button
                    key={interest}
                    onClick={() => onToggleInterest(interest)}
                    className={`p-3 rounded-lg border transition text-left capitalize ${
                      preferences.interests.includes(interest)
                        ? 'bg-accent-green/20 border-accent-green text-accent-green'
                        : 'bg-[#12121a] border-gray-600/30 text-gray-400 hover:border-gray-500/50'
                    }`}
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-4 h-4 border rounded mr-3 transition flex items-center justify-center ${
                          preferences.interests.includes(interest)
                            ? 'bg-accent-green border-accent-green'
                            : 'border-gray-500'
                        }`}
                      >
                        {preferences.interests.includes(interest) && (
                          <span className="text-[#0a0a0f] text-sm">✓</span>
                        )}
                      </div>
                      {interest}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Priorities Tab */}
          {tab === 'priorities' && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">🔥 Risk Priority</h3>
              <p className="text-gray-400 text-sm mb-6">
                Choose what type of risks matter most. This affects alert prioritization.
              </p>

              <div className="space-y-3 mb-8">
                {RISK_PRIORITIES.map((priority) => (
                  <button
                    key={priority}
                    onClick={() => onSetRiskPriority(priority)}
                    className={`w-full p-4 rounded-lg border transition text-left ${
                      preferences.riskPriority === priority
                        ? 'bg-accent-green/20 border-accent-green'
                        : 'bg-[#12121a] border-gray-600/30 hover:border-gray-500/50'
                    }`}
                  >
                    <div className="flex items-start">
                      <div
                        className={`w-5 h-5 border rounded-full mr-3 mt-0.5 transition flex items-center justify-center flex-shrink-0 ${
                          preferences.riskPriority === priority
                            ? 'bg-accent-green border-accent-green'
                            : 'border-gray-500'
                        }`}
                      >
                        {preferences.riskPriority === priority && (
                          <span className="text-[#0a0a0f] text-sm">●</span>
                        )}
                      </div>
                      <div>
                        <p
                          className={`font-semibold capitalize ${
                            preferences.riskPriority === priority
                              ? 'text-accent-green'
                              : 'text-gray-300'
                          }`}
                        >
                          {priority === 'all' ? 'All Risks' : priority}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {priority === 'all' && 'Show all signals equally'}
                          {priority === 'economy' && 'Focus on economic indicators and markets'}
                          {priority === 'security' && 'Prioritize military and security threats'}
                          {priority === 'travel' && 'Highlight travel disruptions and infrastructure'}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Risk Threshold Slider */}
              <div className="bg-[#12121a] border border-accent-green/20 rounded-lg p-4">
                <p className="text-white font-semibold mb-3">Risk Threshold for Alerts</p>
                <div className="space-y-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={tempThreshold}
                    onChange={(e) => setTempThreshold(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Only show alerts with risk ≥</span>
                    <span className="text-accent-green font-mono text-lg">{tempThreshold}%</span>
                  </div>
                  <p className="text-gray-500 text-xs">
                    Higher values = fewer but more critical alerts
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {tab === 'notifications' && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">🔔 Notification Settings</h3>

              {/* Minimum Severity */}
              <div className="mb-6">
                <p className="text-gray-300 font-medium mb-3">Notify me only for:</p>
                <div className="space-y-2">
                  {SEVERITY_LEVELS.map((severity) => (
                    <button
                      key={severity}
                      onClick={() => onSetMinSeverity(severity)}
                      className={`w-full p-3 rounded-lg border transition text-left flex items-center ${
                        preferences.notificationSettings.minSeverity === severity
                          ? 'bg-accent-green/20 border-accent-green'
                          : 'bg-[#12121a] border-gray-600/30 hover:border-gray-500/50'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 border rounded mr-3 transition flex items-center justify-center ${
                          preferences.notificationSettings.minSeverity === severity
                            ? 'bg-accent-green border-accent-green'
                            : 'border-gray-500'
                        }`}
                      >
                        {preferences.notificationSettings.minSeverity === severity && (
                          <span className="text-[#0a0a0f] text-sm">✓</span>
                        )}
                      </div>
                      <span className="text-gray-300 capitalize">{severity} and above</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sound & Desktop Notifications */}
              <div className="space-y-3">
                <button
                  onClick={() =>
                    onUpdateNotifications({ soundEnabled: !preferences.notificationSettings.soundEnabled })
                  }
                  className="w-full p-4 rounded-lg border border-gray-600/30 hover:border-gray-500/50 transition text-left flex items-center justify-between bg-[#12121a]"
                >
                  <div className="flex items-center gap-3">
                    {preferences.notificationSettings.soundEnabled ? (
                      <Volume2 className="w-5 h-5 text-accent-green" />
                    ) : (
                      <VolumeX className="w-5 h-5 text-gray-500" />
                    )}
                    <span className="text-gray-300">Sound Alerts</span>
                  </div>
                  <div
                    className={`w-12 h-6 rounded-full transition ${
                      preferences.notificationSettings.soundEnabled
                        ? 'bg-accent-green'
                        : 'bg-gray-600'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full transition transform ${
                        preferences.notificationSettings.soundEnabled
                          ? 'translate-x-6'
                          : 'translate-x-0.5'
                      } mt-0.5`}
                    ></div>
                  </div>
                </button>

                <button
                  onClick={() =>
                    onUpdateNotifications({
                      desktopNotifications: !preferences.notificationSettings.desktopNotifications,
                    })
                  }
                  className="w-full p-4 rounded-lg border border-gray-600/30 hover:border-gray-500/50 transition text-left flex items-center justify-between bg-[#12121a]"
                >
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-accent-green" />
                    <span className="text-gray-300">Desktop Notifications</span>
                  </div>
                  <div
                    className={`w-12 h-6 rounded-full transition ${
                      preferences.notificationSettings.desktopNotifications
                        ? 'bg-accent-green'
                        : 'bg-gray-600'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full transition transform ${
                        preferences.notificationSettings.desktopNotifications
                          ? 'translate-x-6'
                          : 'translate-x-0.5'
                      } mt-0.5`}
                    ></div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-accent-green/20 bg-[#0a0a0f]">
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-red-400 transition"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-600/30 text-gray-400 rounded-lg hover:border-gray-500/50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-accent-green text-[#0a0a0f] font-semibold rounded-lg hover:bg-accent-green/80 transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
