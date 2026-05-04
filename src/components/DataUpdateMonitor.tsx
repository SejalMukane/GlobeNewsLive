'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, ExternalLink, AlertTriangle, CheckCircle, Clock, Database } from 'lucide-react';

interface UpdateStatus {
  country: string;
  lastChecked: string;
  lastUpdated: string | null;
  newTestsFound: number;
  status: 'success' | 'error' | 'no_change';
  message: string;
}

export default function DataUpdateMonitor() {
  const [status, setStatus] = useState<UpdateStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<string | null>(null);

  useEffect(() => {
    fetchStatus();
    // Auto-check every 30 minutes
    const interval = setInterval(fetchStatus, 1800000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/data-updates');
      const data = await response.json();
      setStatus(data.status || []);
      setLastCheck(data.lastCheck);
    } catch (error) {
      console.error('Failed to fetch update status:', error);
    }
  };

  const checkForUpdates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/data-updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check' })
      });
      const data = await response.json();
      setStatus(data.results || []);
      setLastCheck(new Date().toISOString());
    } catch (error) {
      console.error('Failed to check for updates:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-emerald-400" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-400" />;
      default: return <Clock className="h-4 w-4 text-yellow-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'border-emerald-500/30 bg-emerald-500/5';
      case 'error': return 'border-red-500/30 bg-red-500/5';
      default: return 'border-yellow-500/30 bg-yellow-500/5';
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Database className="h-5 w-5 text-white/60" />
          <h2 className="text-lg font-semibold">Data Source Monitor</h2>
        </div>
        <button
          onClick={checkForUpdates}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Checking...' : 'Check Now'}
        </button>
      </div>

      {lastCheck && (
        <p className="text-xs text-white/40 mb-4">
          Last checked: {new Date(lastCheck).toLocaleString()}
        </p>
      )}

      <div className="space-y-3">
        {status.map((item) => (
          <div
            key={item.country}
            className={`flex items-center justify-between rounded-lg border p-3 ${getStatusColor(item.status)}`}
          >
            <div className="flex items-center gap-3">
              {getStatusIcon(item.status)}
              <div>
                <p className="text-sm font-medium capitalize">{item.country.replace('-', ' ')}</p>
                <p className="text-xs text-white/40">{item.message}</p>
              </div>
            </div>
            <div className="text-right">
              {item.lastUpdated && (
                <p className="text-xs text-white/40">
                  Updated: {new Date(item.lastUpdated).toLocaleDateString()}
                </p>
              )}
              {item.newTestsFound > 0 && (
                <p className="text-xs text-emerald-400">
                  +{item.newTestsFound} new tests
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-white/5">
        <p className="text-xs text-white/40 mb-2">Data Sources:</p>
        <div className="flex gap-2">
          <a
            href="https://www.nti.org/analysis/articles/cns-north-korea-missile-test-database/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-lg bg-white/5 px-3 py-2 text-xs hover:bg-white/10 transition-all"
          >
            <ExternalLink className="h-3 w-3" />
            NTI Database
          </a>
        </div>
      </div>
    </div>
  );
}
