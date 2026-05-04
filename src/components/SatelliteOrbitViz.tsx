'use client';

import { useEffect, useRef } from 'react';

interface SatelliteOrbitVizProps {
  country?: 'north-korea' | 'iran' | 'india' | 'pakistan';
}

export default function SatelliteOrbitViz({ country = 'north-korea' }: SatelliteOrbitVizProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Map country to visualization path
    const countryPaths: Record<string, string> = {
      'north-korea': '/missile-viz/index.html',
      'iran': '/missile-viz/iran/index.html',
      'india': '/missile-viz/india/index.html',
      'pakistan': '/missile-viz/pakistan/index.html'
    };

    // Create iframe pointing to satellite visualization (NOT missile viz)
    const iframe = document.createElement('iframe');
    iframe.src = `/satellite-viz/index.html?country=${country}`;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.margin = '0';
    iframe.style.padding = '0';

    containerRef.current.appendChild(iframe);

    // Cleanup
    return () => {
      if (containerRef.current && iframe.parentNode === containerRef.current) {
        containerRef.current.removeChild(iframe);
      }
    };
  }, [country]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full"
      style={{ 
        width: '100%',
        height: '100%',
        minHeight: '500px',
        position: 'relative',
        overflow: 'hidden',
        margin: 0,
        padding: 0,
      }}
    />
  );
}