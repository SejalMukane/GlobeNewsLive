'use client';

import { useEffect, useRef } from 'react';

interface NKMissileVizProps {
  country?: 'north-korea' | 'iran' | 'india' | 'pakistan';
}

export default function NKMissileViz({ country = 'north-korea' }: NKMissileVizProps) {
  const containerRef = useRef<HTMLDivElement>(null);

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
      className="w-full h-screen bg-void"
      style={{ 
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        margin: 0,
        padding: 0,
      }}
    />
  );
}
