// HexbinArea.jsx
'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';

// Generate 450 bivariate patient records
function generateData() {
  const points = [];
  for (let i = 0; i < 450; i++) {
    const isPrimary = Math.random() < 0.65;
    const x = isPrimary ? d3.randomNormal(50, 14)() : d3.randomNormal(75, 9)();
    const y = isPrimary ? d3.randomNormal(16000, 5000)() : d3.randomNormal(32000, 6000)();
    points.push({
      x: Math.max(15, Math.min(95, x)),
      y: Math.max(2000, Math.min(48000, y))
    });
  }
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

const HexbinArea = () => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const rawPoints = useMemo(() => generateData(), []);

  const [maxRadius, setMaxRadius] = useState(22);
  const [hoveredHex, setHoveredHex] = useState(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = 950;
    const height = 480;
    const margin = { top: 30, right: 40, bottom: 50, left: 70 };

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('viewBox', [0, 0, width, height])
      .attr('width', '100%')
      .attr('height', 'auto')
      .style('max-height', '520px')
      .style('background', '#0b1120')
      .style('border-radius', '12px');

    const x = d3.scaleLinear().domain([10, 100]).range([margin.left, width - margin.right]);
    const y = d3.scaleLinear().domain([0, 52000]).range([height - margin.bottom, margin.top]);

    // Grid
    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(6).tickSize(-(width - margin.left - margin.right)).tickFormat(''))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').attr('stroke', '#1e293b').attr('stroke-dasharray', '3,3'));

    // Axes
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(10))
      .call(g => g.select('.domain').attr('stroke', '#334155'))
      .call(g => g.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '10px').attr('font-family', 'Aldrich, sans-serif'));

    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(6).tickFormat(d => `$${d / 1000}k`))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '10px').attr('font-family', 'Aldrich, sans-serif'));

    // Hexbin spacing
    const r = maxRadius;
    const dx = r * 2 * Math.sin(Math.PI / 3);
    const dy = r * 1.5;

    const screenPts = rawPoints.map(p => ({ x: x(p.x), y: y(p.y), raw: p }));
    const binsMap = new Map();

    screenPts.forEach(p => {
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
      b.count++;
      b.points.push(p.raw);
    });

    const bins = Array.from(binsMap.values());
    const maxCount = d3.max(bins, d => d.count) || 1;

    // Radius scale proportional to sqrt(count) so area is linear with count
    const radiusScale = d3.scaleSqrt()
      .domain([0, maxCount])
      .range([3, r]);

    const color = d3.scaleSequential(d3.interpolatePlasma)
      .domain([1, maxCount]);

    // Draw Hexagons with Area-scaled radii
    svg.append('g').attr('class', 'hex-area-layer')
      .selectAll('path.hex')
      .data(bins)
      .join('path')
      .attr('class', 'hex')
      .attr('transform', d => `translate(${d.cx},${d.cy})`)
      .attr('d', d => hexPath(radiusScale(d.count)))
      .attr('fill', d => color(d.count))
      .attr('fill-opacity', 0.88)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 0.8)
      .attr('cursor', 'pointer')
      .on('mouseenter', (event, d) => setHoveredHex(d))
      .on('mouseleave', () => setHoveredHex(null));

    // Labels
    svg.append('text')
      .attr('x', width - margin.right)
      .attr('y', height - margin.bottom + 36)
      .attr('text-anchor', 'end')
      .attr('fill', '#64748b')
      .attr('font-size', '11px')
      .attr('font-family', 'Aldrich, sans-serif')
      .text('PATIENT AGE (YEARS) →');

    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -margin.top)
      .attr('y', margin.left - 48)
      .attr('text-anchor', 'end')
      .attr('fill', '#64748b')
      .attr('font-size', '11px')
      .attr('font-family', 'Aldrich, sans-serif')
      .text('TOTAL EPISODE BILLING ($ USD) →');

  }, [rawPoints, maxRadius]);

  return (
    <div ref={containerRef} className="w-full flex flex-col gap-4 font-Aldrich text-slate-100 p-2 sm:p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 text-lg shadow-inner">
            💠
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
              Hexbin Area-Scaled Encoding
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                Area ∝ Frequency
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Hexagonal binning where each cell polygon area and color dual-encode point density
            </p>
          </div>
        </div>

        {/* Max Radius Slider */}
        <div className="flex items-center gap-2 text-xs bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
          <span className="text-slate-400">Max Radius: <strong className="text-pink-300">{maxRadius}px</strong></span>
          <input
            type="range"
            min={14}
            max={36}
            value={maxRadius}
            onChange={(e) => setMaxRadius(+e.target.value)}
            className="w-24 h-1.5 accent-pink-400 cursor-pointer"
          />
        </div>
      </div>

      {/* Main SVG Visualization */}
      <div className="relative w-full rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950/80 p-2 shadow-inner">
        <svg ref={svgRef} className="w-full h-auto select-none" />

        {hoveredHex && (
          <div className="absolute top-4 right-4 bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-md pointer-events-none">
            <span className="text-xs font-bold text-white block">Hexagonal Cell Aggregate</span>
            <span className="text-base font-bold text-pink-400 mt-1 block">
              {hoveredHex.count} Patient Records
            </span>
            <span className="text-[10px] text-slate-400">
              Mean Episode Cost: ${Math.round(d3.mean(hoveredHex.points, d => d.y)).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Summary Telemetry */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Observations Sample</span>
          <span className="text-base font-bold text-white">{rawPoints.length} Cohorts</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Encoding Paradigm</span>
          <span className="text-base font-bold text-pink-400">Area ∝ Sqrt(Count)</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Color Scale</span>
          <span className="text-base font-bold text-purple-400">Plasma Spectrum</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Boundary Clamping</span>
          <span className="text-base font-bold text-emerald-400">Zero Overlap</span>
        </div>
      </div>
    </div>
  );
};

export default HexbinArea;
