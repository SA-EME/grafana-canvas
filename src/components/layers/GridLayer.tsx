// components/layers/GridLayer.tsx
import React from 'react';

export const GridLayer: React.FC = () => {
  const step = 100;

  return (
    <>
      <defs>
        <pattern id="gridPattern" width={step} height={step} patternUnits="userSpaceOnUse">
          <path d={`M ${step} 0 L 0 0 0 ${step}`} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        </pattern>
      </defs>

      {/* Grande surface remplie de grille */}
      <rect x={-5000} y={-5000} width={10000} height={10000} fill="url(#gridPattern)" />
      {/* axes */}
      <line x1={-5000} y1={0} x2={5000} y2={0} stroke="rgba(255,255,255,0.12)" strokeWidth={2} />
      <line x1={0} y1={-5000} x2={0} y2={5000} stroke="rgba(255,255,255,0.12)" strokeWidth={2} />
    </>
  );
};
