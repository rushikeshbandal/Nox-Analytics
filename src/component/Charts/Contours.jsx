// Contours.jsx
'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';

// Generate continuous potential field grid (n x m)
function generateFieldGrid(mode = 'potential', n = 80, m = 60) {
  const values = new Float64Array(n * m);

  for (let j = 0; j < m; j++) {
    for (let i = 0; i < n; i++) {
      const x = ((i / (n - 1)) * 4) - 2;
      const y = ((j / (m - 1)) * 3) - 1.5;
      let val = 0;

      if (mode === 'potential') {
        // Multi-pole electric potential
        const d1 = Math.hypot(x - 0.7, y - 0.2);
        const d2 = Math.hypot(x + 0.7, y + 0.2);
        const d3 = Math.hypot(x, y - 0.6);
        val = (1 / Math.max(0.2, d1)) - (0.8 / Math.max(0.25, d2)) + (0.6 / Math.max(0.3, d3));
      } else if (mode === 'ripple') {
        // Concentric damped ripple wave
        const r = Math.hypot(x, y) * 5;
        val = Math.sin(r) / Math.max(0.5, r * 0.4);
      } else {
        // Hyperbolic saddle
        val = (x * x - y * y) * 1.2;
      }

      values[j * n + i] = +val.toFixed(4);
    }
  }
  return { values, n, m };
}

const Contours = () => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [fieldMode, setFieldMode] = useState('potential');
  const [thresholdsCount, setThresholdsCount] = useState(16);
  const [hoveredLevel, setHoveredLevel] = useState(null);

  const { values, n, m } = useMemo(() => {
    return generateFieldGrid(fieldMode, 80, 60);
  }, [fieldMode]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = 950;
    const height = 520;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('viewBox', [0, 0, width, height])
      .attr('width', '100%')
      .attr('height', 'auto')
      .style('max-height', '560px')
      .style('background', '#0b1120')
      .style('border-radius', '12px');

    const minVal = d3.min(values);
    const maxVal = d3.max(values);
    const thresholds = d3.range(minVal, maxVal, (maxVal - minVal) / thresholdsCount);

    const contours = d3.contours()
      .size([n, m])
      .thresholds(thresholds)(values);

    const color = d3.scaleSequential(d3.interpolateViridis)
      .domain([minVal, maxVal]);

    const scaleX = width / n;
    const scaleY = height / m;

    const g = svg.append('g')
      .attr('transform', `scale(${scaleX}, ${scaleY})`);

    // Draw contour polygons
    g.selectAll('path.contour-fill')
      .data(contours)
      .join('path')
      .attr('class', 'contour-fill')
      .attr('d', d3.geoPath())
      .attr('fill', d => color(d.value))
      .attr('fill-opacity', 0.55)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 0.25)
      .attr('stroke-opacity', 0.6)
      .attr('cursor', 'pointer')
      .on('mouseenter', (event, d) => setHoveredLevel(d.value))
      .on('mouseleave', () => setHoveredLevel(null));

  }, [values, n, m, thresholdsCount]);

  return (
    <div ref={containerRef} className="w-full flex flex-col gap-4 font-Aldrich text-slate-100 p-2 sm:p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-lg shadow-inner">
            📐
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
              Continuous Mathematical Isolines
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                D3 Contours
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Isoline contour bands generated across continuous potential fields using Marching Squares
            </p>
          </div>
        </div>

        {/* Function Mode Toggles */}
        <div className="flex items-center gap-2 bg-slate-800/80 p-1 rounded-lg border border-slate-700 text-xs">
          {[
            { id: 'potential', label: 'Multi-Pole' },
            { id: 'ripple', label: 'Wave Ripple' },
            { id: 'saddle', label: 'Saddle' }
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setFieldMode(m.id)}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer font-bold ${
                fieldMode === m.id ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main SVG Visualization */}
      <div className="relative w-full rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950/80 p-2 shadow-inner">
        <svg ref={svgRef} className="w-full h-auto select-none" />

        {hoveredLevel !== null && (
          <div className="absolute top-4 right-4 bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-md pointer-events-none">
            <span className="text-xs font-bold text-white block">Field Potential Level</span>
            <span className="text-base font-bold text-cyan-400 mt-1 block">
              ψ = {hoveredLevel.toFixed(3)}
            </span>
          </div>
        )}
      </div>

      {/* Summary Telemetry */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Function Mode</span>
          <span className="text-base font-bold text-white uppercase">{fieldMode}</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Contour Resolution</span>
          <span className="text-base font-bold text-cyan-400">{thresholdsCount} Iso-Levels</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Algorithm</span>
          <span className="text-base font-bold text-emerald-400">Marching Squares</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Domain Dimension</span>
          <span className="text-base font-bold text-purple-400">80 x 60 Grid</span>
        </div>
      </div>
    </div>
  );
};

export default Contours;
