'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface NKMissileVizProps {
  country?: 'north-korea' | 'iran' | 'india' | 'pakistan';
}

export default function NKMissileViz({ country = 'north-korea' }: NKMissileVizProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create iframe pointing to API route
    const iframe = document.createElement('iframe');
    iframe.src = '/api/missile-viz';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.margin = '0';
    iframe.style.padding = '0';

    // Set a timeout to detect if the visualization fails to load
    const loadTimeout = setTimeout(() => {
      setLoadFailed(true);
    }, 10000); // 10 second timeout

    iframe.onload = () => {
      clearTimeout(loadTimeout);
      setLoadFailed(false);
    };

    iframe.onerror = () => {
      clearTimeout(loadTimeout);
      setLoadFailed(true);
    };

    containerRef.current.appendChild(iframe);

    // Cleanup
    return () => {
      clearTimeout(loadTimeout);
      if (containerRef.current && iframe.parentNode === containerRef.current) {
        containerRef.current.removeChild(iframe);
      }
    };
  }, [country, iframeKey]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-screen bg-void relative"
      style={{ 
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        margin: 0,
        padding: 0,
      }}
    >
      {loadFailed && (
        <div className="absolute inset-0 flex items-center justify-center bg-void/90 backdrop-blur-sm z-50">
          <div className="text-center space-y-4">
            <AlertCircle className="mx-auto h-16 w-16 text-red-500/60" />
            <div className="font-mono space-y-2">
              <h3 className="text-lg font-bold text-white">3D Visualization Unavailable</h3>
              <p className="text-white/50 text-sm max-w-sm">
                The interactive 3D globe visualization is not available at the moment. 
                The missile data and statistics are displayed above.
              </p>
              <button
                onClick={() => setIframeKey(k => k + 1)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded border border-accent-green/50 text-accent-green hover:bg-accent-green/10 transition-colors text-sm font-mono"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
