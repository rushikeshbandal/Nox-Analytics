// ZoomableBarChart.jsx
'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';

// Generate 48 weeks of department inpatient discharges
function generateWeeklyData() {
  const data = [];
  const start = new Date('2024-01-01');
  for (let i = 1; i <= 48; i++) {
    const d = new Date(start.getTime() + (i - 1) * 7 * 24 * 60 * 60 * 1000);
    const base = 120 + Math.sin((i / 8) * Math.PI) * 35;
    const count = Math.round(base + (Math.random() - 0.5) * 30);
    data.push({
      id: `W${i}`,
      week: `Wk ${i}`,
      date: d,
      discharges: count,
      category: count > 140 ? 'High Throughput' : count > 105 ? 'Standard' : 'Low Discharge'
    });
  }
  return data;
}

const CATEGORY_COLORS = {
  'High Throughput': '#10B981', // Emerald
  'Standard': '#06B6D4',        // Cyan
  'Low Discharge': '#F59E0B'    // Amber
};

const ZoomableBarChart = () => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const data = useMemo(() => generateWeeklyData(), []);

  const [hoveredBar, setHoveredBar] = useState(null);
  const [zoomK, setZoomK] = useState(1);
  const [stats, setStats] = useState({ total: 0, avg: 0, peak: 0, count: 48 });
  const zoomBehaviorRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = 950;
    const height = 460;
    const margin = { top: 30, right: 30, bottom: 60, left: 60 };

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('viewBox', [0, 0, width, height])
      .attr('width', '100%')
      .attr('height', 'auto')
      .style('max-height', '500px')
      .style('background', '#0b1120')
      .style('border-radius', '12px');

    const defs = svg.append('defs');

    // Clipping path for bars
    defs.append('clipPath')
      .attr('id', 'bars-clip')
      .append('rect')
      .attr('x', margin.left)
      .attr('y', margin.top)
      .attr('width', width - margin.left - margin.right)
      .attr('height', height - margin.top - margin.bottom);

    // Initial continuous X scale
    const x = d3.scaleLinear()
      .domain([0, data.length])
      .range([margin.left, width - margin.right]);

    const maxVal = d3.max(data, d => d.discharges) || 100;
    const y = d3.scaleLinear()
      .domain([0, maxVal * 1.15])
      .range([height - margin.bottom, margin.top]);

    // Grid
    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(6).tickSize(-(width - margin.left - margin.right)).tickFormat(''))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').attr('stroke', '#1e293b').attr('stroke-dasharray', '3,3'));

    // Axes
    const gx = svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(
        d3.axisBottom(x)
          .ticks(12)
          .tickFormat(i => {
            const idx = Math.round(i);
            return data[idx] ? data[idx].week : '';
          })
      )
      .call(g => g.select('.domain').attr('stroke', '#334155'))
      .call(g => g.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '10px').attr('font-family', 'Aldrich, sans-serif'));

    const gy = svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(6))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '10px').attr('font-family', 'Aldrich, sans-serif'));

    // Bars container with clip
    const barContent = svg.append('g').attr('clip-path', 'url(#bars-clip)');

    const bars = barContent.selectAll('rect.bar')
      .data(data)
      .join('rect')
      .attr('class', 'bar')
      .attr('x', (d, i) => x(i) + 2)
      .attr('y', d => y(d.discharges))
      .attr('width', Math.max(2, (x(1) - x(0)) * 0.75))
      .attr('height', d => Math.max(0, height - margin.bottom - y(d.discharges)))
      .attr('fill', d => CATEGORY_COLORS[d.category] || '#06B6D4')
      .attr('rx', 3)
      .attr('cursor', 'pointer')
      .on('mouseenter', (event, d) => setHoveredBar(d))
      .on('mouseleave', () => setHoveredBar(null));

    // Value Labels on top of bars
    const labels = barContent.selectAll('text.bar-label')
      .data(data)
      .join('text')
      .attr('class', 'bar-label font-Aldrich')
      .attr('x', (d, i) => x(i) + (x(1) - x(0)) * 0.375)
      .attr('y', d => y(d.discharges) - 6)
      .attr('text-anchor', 'middle')
      .attr('paint-order', 'stroke fill')
      .attr('stroke', '#020617')
      .attr('stroke-width', 3)
      .attr('fill', '#ffffff')
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .text(d => d.discharges);

    // Zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([1, 8])
      .translateExtent([[margin.left, -Infinity], [width - margin.right, Infinity]])
      .on('zoom', (event) => {
        setZoomK(event.transform.k);
        const xz = event.transform.rescaleX(x);

        gx.call(
          d3.axisBottom(xz)
            .ticks(Math.min(24, Math.round(12 * event.transform.k)))
            .tickFormat(i => {
              const idx = Math.round(i);
              return data[idx] ? data[idx].week : '';
            })
        ).call(g => g.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '10px').attr('font-family', 'Aldrich, sans-serif'));

        const barWidth = Math.max(3, (xz(1) - xz(0)) * 0.75);

        bars
          .attr('x', (d, i) => xz(i) + 2)
          .attr('width', barWidth);

        labels
          .attr('x', (d, i) => xz(i) + barWidth / 2)
          .style('display', barWidth > 18 ? 'block' : 'none');

        // Visible stats
        const [i0, i1] = [Math.max(0, Math.floor(xz.invert(margin.left))), Math.min(data.length, Math.ceil(xz.invert(width - margin.right)))];
        const visibleSlice = data.slice(i0, i1);
        if (visibleSlice.length > 0) {
          const vals = visibleSlice.map(d => d.discharges);
          setStats({
            total: d3.sum(vals),
            avg: Math.round(d3.mean(vals)),
            peak: d3.max(vals),
            count: visibleSlice.length
          });
        }
      });

    zoomBehaviorRef.current = zoom;
    svg.call(zoom);

    // Initial stats
    const allVals = data.map(d => d.discharges);
    setStats({
      total: d3.sum(allVals),
      avg: Math.round(d3.mean(allVals)),
      peak: d3.max(allVals),
      count: data.length
    });

  }, [data]);

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(750)
      .call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
  };

  return (
    <div ref={containerRef} className="w-full flex flex-col gap-4 font-Aldrich text-slate-100 p-2 sm:p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-lg shadow-inner">
            📊
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
              Zoomable Bar Chart
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Pannable Discrete Bands
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Interactive 48-week patient discharge volume • Pan and zoom to inspect high-density weekly intervals
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-400 text-[11px]">Zoom Level: <strong className="text-emerald-400">{zoomK.toFixed(1)}x</strong></span>
          <button
            onClick={handleResetZoom}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer font-bold shadow-sm"
          >
            Reset View 🎯
          </button>
        </div>
      </div>

      {/* Category Legend */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900/60 px-4 py-2 rounded-xl border border-slate-800 text-xs">
        <span className="text-slate-500 uppercase font-bold text-[10px]">Tiers:</span>
        {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
          <div key={cat} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
            <span className="text-slate-300 text-[11px]">{cat}</span>
          </div>
        ))}
      </div>

      {/* Main SVG Visualization */}
      <div className="relative w-full rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950/80 p-2 shadow-inner">
        <svg ref={svgRef} className="w-full h-auto cursor-ew-resize select-none" />

        {hoveredBar && (
          <div className="absolute top-4 right-4 bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-md pointer-events-none">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5 mb-1.5">
              <span className="text-xs font-bold text-white">{hoveredBar.week}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                {hoveredBar.category}
              </span>
            </div>
            <div className="text-[11px] text-slate-300">
              Discharges: <strong className="text-emerald-400 text-sm">{hoveredBar.discharges} patients</strong>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Week commencing: {d3.utcFormat('%b %d, %Y')(hoveredBar.date)}
            </div>
          </div>
        )}
      </div>

      {/* Summary Telemetry */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">In-View Discharges</span>
          <span className="text-base font-bold text-emerald-400">{stats.total.toLocaleString()}</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Weekly Average</span>
          <span className="text-base font-bold text-cyan-400">{stats.avg} / week</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Peak Single Week</span>
          <span className="text-base font-bold text-purple-400">{stats.peak}</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Active Visible Weeks</span>
          <span className="text-base font-bold text-amber-400">{stats.count} of 48 Wks</span>
        </div>
      </div>
    </div>
  );
};

export default ZoomableBarChart;
