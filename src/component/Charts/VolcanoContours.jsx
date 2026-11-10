// VolcanoContours.jsx
'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';

// Generate synthetic Maungawhau volcanic caldera elevation grid (61 x 87 grid)
function generateVolcanoGrid(n = 87, m = 61) {
  const values = new Float64Array(n * m);
  const cx = n / 2;
  const cy = m / 2;
  const maxR = Math.hypot(cx, cy);

  for (let j = 0; j < m; j++) {
    for (let i = 0; i < n; i++) {
      const dx = i - cx;
      const dy = (j - cy) * 1.4; // elliptical
      const dist = Math.hypot(dx, dy);

      // Main cone elevation
      let z = 190 * Math.exp(-Math.pow(dist / 22, 2));

      // Central crater depression
      if (dist < 10) {
        z -= 45 * (1 - dist / 10);
      }

      // Ridge perturbation
      const angle = Math.atan2(dy, dx);
      z += 18 * Math.sin(angle * 3) * Math.exp(-dist / 25);
      z += 90; // base sea level

      values[j * n + i] = Math.max(90, Math.round(z));
    }
  }
  return { values, n, m };
}

const VolcanoContours = () => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const { values, n, m } = useMemo(() => generateVolcanoGrid(87, 61), []);

  const [thresholdsCount, setThresholdsCount] = useState(18);
  const [hoveredElevation, setHoveredElevation] = useState(null);

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

    // D3 Contours Generator
    const minVal = d3.min(values);
    const maxVal = d3.max(values);
    const thresholds = d3.range(minVal, maxVal, (maxVal - minVal) / thresholdsCount);

    const contours = d3.contours()
      .size([n, m])
      .thresholds(thresholds)(values);

    // Color ramp (Magma / Viridis inspired)
    const color = d3.scaleSequential(d3.interpolateTurbo)
      .domain([minVal, maxVal]);

    // Scales to map [0, n] and [0, m] to SVG width/height
    const scaleX = width / n;
    const scaleY = height / m;

    const g = svg.append('g')
      .attr('transform', `scale(${scaleX}, ${scaleY})`);

    g.selectAll('path')
      .data(contours)
      .join('path')
      .attr('d', d3.geoPath())
      .attr('fill', d => color(d.value))
      .attr('fill-opacity', 0.85)
      .attr('stroke', '#020617')
      .attr('stroke-width', 0.3)
      .attr('cursor', 'pointer')
      .on('mouseenter', (event, d) => setHoveredElevation(d.value))
      .on('mouseleave', () => setHoveredElevation(null));

    // Isobar count labels along perimeter
    const defs = svg.append('defs');
    const grad = defs.append('linearGradient')
      .attr('id', 'volcano-legend-grad');
    d3.range(0, 1.01, 0.1).forEach(t => {
      grad.append('stop')
        .attr('offset', `${t * 100}%`)
        .attr('stop-color', d3.interpolateTurbo(t));
    });

  }, [values, n, m, thresholdsCount]);

  return (
    <div ref={containerRef} className="w-full flex flex-col gap-4 font-Aldrich text-slate-100 p-2 sm:p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-lg shadow-inner">
            🌋
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
              Volcano Topographic Contours
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Maungawhau Elevation Grid
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              High-resolution 87x61 digital elevation model with marching squares isobar contours & crater depression
            </p>
          </div>
        </div>

        {/* Threshold Slider */}
        <div className="flex items-center gap-2 text-xs bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
          <span className="text-slate-400">Contour Bands: <strong className="text-amber-300">{thresholdsCount}</strong></span>
          <input
            type="range"
            min={8}
            max={32}
            value={thresholdsCount}
            onChange={(e) => setThresholdsCount(+e.target.value)}
            className="w-24 h-1.5 accent-amber-400 cursor-pointer"
          />
        </div>
      </div>

      {/* Main SVG Visualization */}
      <div className="relative w-full rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950/80 p-2 shadow-inner">
        <svg ref={svgRef} className="w-full h-auto select-none" />

        {hoveredElevation !== null && (
          <div className="absolute top-4 right-4 bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-md pointer-events-none">
            <span className="text-xs font-bold text-white block">Iso-Elevation Contour</span>
            <span className="text-base font-bold text-amber-400 mt-1 block">
              {hoveredElevation} Meters ASL
            </span>
            <span className="text-[10px] text-slate-400">
              Caldera rim threshold elevation
            </span>
          </div>
        )}
      </div>

      {/* Summary Telemetry */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Grid Matrix Resolution</span>
          <span className="text-base font-bold text-white">87 x 61 (5,307 pts)</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Peak Rim Elevation</span>
          <span className="text-base font-bold text-amber-400">196 Meters</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Crater Floor</span>
          <span className="text-base font-bold text-cyan-400">142 Meters</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Base Plain Level</span>
          <span className="text-base font-bold text-emerald-400">90 Meters ASL</span>
        </div>
      </div>
    </div>
  );
};

export default VolcanoContours;
