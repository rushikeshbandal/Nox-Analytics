// HexbinMap.jsx
'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';

// Clinical outreach data distributed across geographical coordinates
function generateGeoOutreach() {
  const regions = [
    { name: 'Northeast Corridor', center: [-74.0, 41.0], cases: 1420 },
    { name: 'Mid-Atlantic Hub', center: [-77.0, 38.9], cases: 1180 },
    { name: 'Southeast Care Grid', center: [-84.4, 33.7], cases: 1650 },
    { name: 'Great Lakes Health', center: [-87.6, 41.8], cases: 1320 },
    { name: 'Texas Gulf Medical', center: [-95.4, 29.8], cases: 1890 },
    { name: 'Southwest Outpost', center: [-112.0, 33.4], cases: 940 },
    { name: 'Pacific Northwest', center: [-122.3, 47.6], cases: 1080 },
    { name: 'California Valley', center: [-119.5, 36.5], cases: 2150 },
    { name: 'Mountain West Core', center: [-105.0, 39.7], cases: 860 }
  ];

  const points = [];
  regions.forEach(reg => {
    const numPts = Math.round(reg.cases / 25);
    for (let i = 0; i < numPts; i++) {
      points.push({
        region: reg.name,
        lon: reg.center[0] + d3.randomNormal(0, 1.8)(),
        lat: reg.center[1] + d3.randomNormal(0, 1.4)(),
        severity: Math.round(1 + Math.random() * 4)
      });
    }
  });
  return points;
}

function hexPath(radius) {
  const angles = d3.range(0, 2 * Math.PI, Math.PI / 3);
  return angles.map((a, i) => {
    const px = radius * Math.sin(a);
    const py = -radius * Math.cos(a);
    return `${i === 0 ? 'M' : 'L'}${px.toFixed(2)},${py.toFixed(2)}`;
  }).join(' ') + 'Z';
}

const HexbinMap = () => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const rawPoints = useMemo(() => generateGeoOutreach(), []);

  const [hexRadius, setHexRadius] = useState(18);
  const [hoveredHex, setHoveredHex] = useState(null);

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

    // Albers projection centered on continental US
    const projection = d3.geoAlbersUsa()
      .scale(1150)
      .translate([width / 2, height / 2]);

    const projectedPoints = rawPoints
      .map(p => {
        const pt = projection([p.lon, p.lat]);
        return pt ? { x: pt[0], y: pt[1], raw: p } : null;
      })
      .filter(Boolean);

    // Hexbin grouping
    const r = hexRadius;
    const dx = r * 2 * Math.sin(Math.PI / 3);
    const dy = r * 1.5;

    const binsMap = new Map();

    projectedPoints.forEach(p => {
      const py = p.y / dy;
      const pj = Math.round(py);
      const px = (p.x / dx) - (pj % 2 ? 0.5 : 0);
      const pi = Math.round(px);

      const cx = (pi + (pj % 2 ? 0.5 : 0)) * dx;
      const cy = pj * dy;

      const key = `${Math.round(cx)},${Math.round(cy)}`;
      if (!binsMap.has(key)) {
        binsMap.set(key, { cx, cy, count: 0, points: [] });
      }
      const b = binsMap.get(key);
      b.count += 25; // scaled cases
      b.points.push(p.raw);
    });

    const bins = Array.from(binsMap.values());
    const maxCount = d3.max(bins, d => d.count) || 100;

    const color = d3.scaleSequential(d3.interpolateTurbo)
      .domain([25, maxCount]);

    const hexString = hexPath(r);

    // Map outlines background grid
    const graticule = d3.geoGraticule();
    svg.append('path')
      .datum(graticule())
      .attr('fill', 'none')
      .attr('stroke', '#1e293b')
      .attr('stroke-width', 0.5);

    // Draw Hexagons
    svg.append('g').attr('class', 'hex-map-layer')
      .selectAll('path.hex')
      .data(bins)
      .join('path')
      .attr('class', 'hex')
      .attr('transform', d => `translate(${d.cx},${d.cy})`)
      .attr('d', hexString)
      .attr('fill', d => color(d.count))
      .attr('fill-opacity', 0.85)
      .attr('stroke', '#020617')
      .attr('stroke-width', 1.2)
      .attr('cursor', 'pointer')
      .on('mouseenter', (event, d) => setHoveredHex(d))
      .on('mouseleave', () => setHoveredHex(null));

  }, [rawPoints, hexRadius]);

  return (
    <div ref={containerRef} className="w-full flex flex-col gap-4 font-Aldrich text-slate-100 p-2 sm:p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-lg shadow-inner">
            🗺️
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
              Geographic Hexbin Density Map
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Albers Hexagonal Spatial Grid
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Spatial aggregation of regional patient admissions & outreach visits into regular hexagonal choropleth cells
            </p>
          </div>
        </div>

        {/* Radius Slider */}
        <div className="flex items-center gap-2 text-xs bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
          <span className="text-slate-400">Hex Spacing: <strong className="text-cyan-300">{hexRadius}px</strong></span>
          <input
            type="range"
            min={12}
            max={28}
            value={hexRadius}
            onChange={(e) => setHexRadius(+e.target.value)}
            className="w-24 h-1.5 accent-cyan-400 cursor-pointer"
          />
        </div>
      </div>

      {/* Main SVG Visualization */}
      <div className="relative w-full rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950/80 p-2 shadow-inner">
        <svg ref={svgRef} className="w-full h-auto select-none" />

        {hoveredHex && (
          <div className="absolute top-4 right-4 bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-md pointer-events-none">
            <span className="text-xs font-bold text-white block">
              {hoveredHex.points[0]?.region || 'Outreach Sector'}
            </span>
            <span className="text-base font-bold text-cyan-400 mt-1 block">
              {hoveredHex.count} Clinical Cases
            </span>
            <span className="text-[10px] text-slate-400">
              Mean Case Severity: {(d3.mean(hoveredHex.points, d => d.severity) || 1).toFixed(1)} / 5.0
            </span>
          </div>
        )}
      </div>

      {/* Summary Telemetry */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Aggregated Caseload</span>
          <span className="text-base font-bold text-white">12,480 Encounters</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Projection</span>
          <span className="text-base font-bold text-cyan-400">Albers USA Conic</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Color Scale</span>
          <span className="text-base font-bold text-emerald-400">Turbo Spatial Density</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Outreach Sectors</span>
          <span className="text-base font-bold text-purple-400">9 Active Regional Zones</span>
        </div>
      </div>
    </div>
  );
};

export default HexbinMap;
