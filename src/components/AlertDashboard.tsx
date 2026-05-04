'use client';

import { useEffect, useState } from 'react';
import { Bell, CheckCircle, AlertTriangle, Info, X, Settings, Clock } from 'lucide-react';

interface AlertEvent {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
  acknowledged: boolean;
}

interface AlertConfig {
  id: string;
  name: string;
  type: string;
  country: string;
  enabled: boolean;
}

export default function AlertDashboard() {
  const [events, setEvents] = useState<AlertEvent[]>([]);
  const [alerts, setAlerts] = useState<AlertConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/alerts');
      const data = await response.json();
      setEvents(data.events || []);
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeEvent = async (eventId: string) => {
    try {
      await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'acknowledge', eventId })
      });
      fetchAlerts();
    } catch (error) {
      console.error('Failed to acknowledge event:', error);
    }
  };

  const toggleAlert = async (alertId: string, enabled: boolean) => {
    try {
      await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', alertId, updates: { enabled } })
      });
      fetchAlerts();
    } catch (error) {
      console.error('Failed to update alert:', error);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-5 w-5 text-red-400" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      default: return <Info className="h-5 w-5 text-blue-400" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500/30 bg-red-500/5';
      case 'warning': return 'border-yellow-500/30 bg-yellow-500/5';
      default: return 'border-blue-500/30 bg-blue-500/5';
    }
  };

  const unacknowledgedEvents = events.filter(e => !e.acknowledged);
  const acknowledgedEvents = events.filter(e => e.acknowledged);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Bell className="h-8 w-8 text-white/60" />
            {unacknowledgedEvents.length > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs flex items-center justify-center font-bold">
                {unacknowledgedEvents.length}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">Alert Center</h1>
            <p className="text-sm text-white/40">Real-time missile test monitoring</p>
          </div>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 transition-all"
        >
          <Settings className="h-4 w-4" />
          Settings
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto" />
            <p className="text-white/40">Loading alerts...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-red-500/10 p-2">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-white/40">Critical Alerts</p>
                  <p className="text-2xl font-bold">
                    {events.filter(e => e.severity === 'critical' && !e.acknowledged).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-yellow-500/10 p-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-xs text-white/40">Warnings</p>
                  <p className="text-2xl font-bold">
                    {events.filter(e => e.severity === 'warning' && !e.acknowledged).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-500/10 p-2">
                  <Info className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-white/40">Info</p>
                  <p className="text-2xl font-bold">
                    {events.filter(e => e.severity === 'info' && !e.acknowledged).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="mb-8 rounded-xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-lg font-semibold mb-4">Alert Configuration</h2>
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{alert.name}</p>
                      <p className="text-xs text-white/40">{alert.country} • {alert.type}</p>
                    </div>
                    <button
                      onClick={() => toggleAlert(alert.id, !alert.enabled)}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        alert.enabled ? 'bg-blue-500' : 'bg-white/10'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform ${
                          alert.enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unacknowledged Events */}
          {unacknowledgedEvents.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Bell className="h-5 w-5 text-red-400" />
                Active Alerts ({unacknowledgedEvents.length})
              </h2>
              <div className="space-y-3">
                {unacknowledgedEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`flex items-start gap-4 rounded-xl border p-4 ${getSeverityColor(event.severity)}`}
                  >
                    {getSeverityIcon(event.severity)}
                    <div className="flex-1">
                      <h3 className="font-semibold">{event.title}</h3>
                      <p className="mt-1 text-sm text-white/60 whitespace-pre-line">{event.message}</p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-white/40">
                        <Clock className="h-3 w-3" />
                        {new Date(event.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => acknowledgeEvent(event.id)}
                      className="rounded-lg bg-white/10 p-2 hover:bg-white/20 transition-all"
                    >
                      <CheckCircle className="h-5 w-5 text-emerald-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Acknowledged Events */}
          {acknowledgedEvents.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 text-white/40">
                History ({acknowledgedEvents.length})
              </h2>
              <div className="space-y-2">
                {acknowledgedEvents.slice(0, 10).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-4 rounded-lg border border-white/5 bg-white/5 p-3 opacity-50"
                  >
                    {getSeverityIcon(event.severity)}
                    <div className="flex-1">
                      <h3 className="text-sm font-medium">{event.title}</h3>
                      <p className="text-xs text-white/40">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
