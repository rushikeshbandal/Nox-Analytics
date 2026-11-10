// DensityContours.jsx
'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';

// Generate 2D patient cluster points (Age vs Care Cost with 2 dense clusters)
function generateScatterPoints() {
  const points = [];
  // Cluster 1: Young Adult Outpatient
  for (let i = 0; i < 160; i++) {
    points.push({
      x: Math.max(18, Math.min(45, d3.randomNormal(32, 6)())),
      y: Math.max(2000, Math.min(18000, d3.randomNormal(8500, 2400)()))
    });
  }
  // Cluster 2: Senior Complex Inpatient
  for (let i = 0; i < 160; i++) {
    points.push({
      x: Math.max(50, Math.min(88, d3.randomNormal(68, 8)())),
      y: Math.max(12000, Math.min(48000, d3.randomNormal(28000, 6500)()))
    });
  }
  return points;
}

const DensityContours = () => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const points = useMemo(() => generateScatterPoints(), []);

  const [bandwidth, setBandwidth] = useState(25);
  const [thresholdsCount, setThresholdsCount] = useState(12);
  const [hoveredLevel, setHoveredLevel] = useState(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = 950;
    const height = 480;
    const margin = { top: 30, right: 40, bottom: 50, left: 75 };

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('viewBox', [0, 0, width, height])
      .attr('width', '100%')
      .attr('height', 'auto')
      .style('max-height', '520px')
      .style('background', '#0b1120')
      .style('border-radius', '12px');

    // Scales
    const x = d3.scaleLinear()
      .domain([15, 90])
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain([0, 52000])
      .range([height - margin.bottom, margin.top]);

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

    // Compute 2D Density Contours
    const density = d3.contourDensity()
      .x(d => x(d.x))
      .y(d => y(d.y))
      .size([width, height])
      .bandwidth(bandwidth)
      .thresholds(thresholdsCount)(points);

    const color = d3.scaleSequential(d3.interpolateSpectral)
      .domain(d3.extent(density, d => d.value).reverse());

    // Render Filled Contours
    svg.append('g')
      .attr('class', 'contours')
      .selectAll('path')
      .data(density)
      .join('path')
      .attr('d', d3.geoPath())
      .attr('fill', d => color(d.value))
      .attr('fill-opacity', 0.28)
      .attr('stroke', d => color(d.value))
      .attr('stroke-width', 1.2)
      .attr('cursor', 'pointer')
      .on('mouseenter', (event, d) => setHoveredLevel(d.value))
      .on('mouseleave', () => setHoveredLevel(null));

    // Scatter dots overlay
    svg.append('g')
      .attr('class', 'dots')
      .selectAll('circle')
      .data(points)
      .join('circle')
      .attr('cx', d => x(d.x))
      .attr('cy', d => y(d.y))
      .attr('r', 3)
      .attr('fill', '#38bdf8')
      .attr('fill-opacity', 0.55)
      .attr('stroke', '#020617')
      .attr('stroke-width', 0.8);

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

  }, [points, bandwidth, thresholdsCount]);

  return (
    <div ref={containerRef} className="w-full flex flex-col gap-4 font-Aldrich text-slate-100 p-2 sm:p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-lg shadow-inner">
            🌀
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
              Bivariate Density Contours
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                2D Kernel Heatmap
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Topographic probability density contours computed via d3.contourDensity over 320 patient billing observations
            </p>
          </div>
        </div>

        {/* Sliders */}
        <div className="flex flex-wrap items-center gap-4 text-xs bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Bandwidth: <strong className="text-cyan-300">{bandwidth}px</strong></span>
            <input
              type="range"
              min={12}
              max={45}
              value={bandwidth}
              onChange={(e) => setBandwidth(+e.target.value)}
              className="w-20 h-1.5 accent-cyan-400 cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Thresholds: <strong className="text-purple-300">{thresholdsCount}</strong></span>
            <input
              type="range"
              min={6}
              max={24}
              value={thresholdsCount}
              onChange={(e) => setThresholdsCount(+e.target.value)}
              className="w-20 h-1.5 accent-purple-400 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Main SVG Visualization */}
      <div className="relative w-full rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950/80 p-2 shadow-inner">
        <svg ref={svgRef} className="w-full h-auto select-none" />

        {hoveredLevel !== null && (
          <div className="absolute top-4 right-4 bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-md pointer-events-none">
            <span className="text-xs font-bold text-white block">Contour Level Threshold</span>
            <span className="text-sm font-bold text-cyan-400 mt-1 block">
              Iso-Density: {hoveredLevel.toExponential(3)}
            </span>
          </div>
        )}
      </div>

      {/* Summary Telemetry */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Patient Sample Size</span>
          <span className="text-base font-bold text-white">{points.length} Cohorts</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Density Bands</span>
          <span className="text-base font-bold text-cyan-400">{thresholdsCount} Iso-Levels</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Primary Cluster</span>
          <span className="text-base font-bold text-emerald-400">Age 68 • $28k Cost</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Secondary Cluster</span>
          <span className="text-base font-bold text-purple-400">Age 32 • $8.5k Cost</span>
        </div>
      </div>
    </div>
  );
};

export default DensityContours;
