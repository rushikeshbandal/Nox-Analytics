// ZoomableAreaChart.jsx
'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';

// Generate 365 days of clinical sensor / vitals monitoring stream
function generateStreamData() {
  const data = [];
  const start = new Date('2024-01-01');
  let val = 95;
  for (let i = 0; i < 365; i++) {
    const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const noise = (Math.random() - 0.49) * 8;
    const seasonal = Math.sin((i / 40) * Math.PI) * 12;
    val = Math.max(45, Math.min(185, val + noise * 0.4));
    data.push({
      date: d,
      value: Math.round(val + seasonal + (Math.random() * 6)),
      baseline: 100
    });
  }
  return data;
}

const ZoomableAreaChart = () => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const data = useMemo(() => generateStreamData(), []);

  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [activePreset, setActivePreset] = useState('All');
  const [stats, setStats] = useState({ min: 0, max: 0, mean: 0, count: 365 });
  const zoomBehaviorRef = useRef(null);
  const xOrigRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = 950;
    const height = 460;
    const margin = { top: 30, right: 30, bottom: 50, left: 60 };

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

    // Clipping path so zoomed curve stays inside chart boundaries
    defs.append('clipPath')
      .attr('id', 'area-clip')
      .append('rect')
      .attr('x', margin.left)
      .attr('y', margin.top)
      .attr('width', width - margin.left - margin.right)
      .attr('height', height - margin.top - margin.bottom);

    // Area gradient
    const grad = defs.append('linearGradient')
      .attr('id', 'zoomable-area-grad')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    grad.append('stop').attr('offset', '0%').attr('stop-color', '#06B6D4').attr('stop-opacity', 0.7);
    grad.append('stop').attr('offset', '100%').attr('stop-color', '#10B981').attr('stop-opacity', 0.05);

    // Initial scales
    const x = d3.scaleUtc()
      .domain(d3.extent(data, d => d.date))
      .range([margin.left, width - margin.right]);
    xOrigRef.current = x;

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value) * 1.15])
      .range([height - margin.bottom, margin.top]);

    // Grid lines
    const gridY = svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(6).tickSize(-(width - margin.left - margin.right)).tickFormat(''))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').attr('stroke', '#1e293b').attr('stroke-dasharray', '3,3'));

    // X Axis
    const gx = svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(8).tickSizeOuter(0))
      .call(g => g.select('.domain').attr('stroke', '#334155'))
      .call(g => g.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '10px').attr('font-family', 'Aldrich, sans-serif'));

    // Y Axis
    const gy = svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(6))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '10px').attr('font-family', 'Aldrich, sans-serif'));

    // Generators
    const area = d3.area()
      .curve(d3.curveMonotoneX)
      .x(d => x(d.date))
      .y0(y(0))
      .y1(d => y(d.value));

    const line = d3.line()
      .curve(d3.curveMonotoneX)
      .x(d => x(d.date))
      .y(d => y(d.value));

    // Data paths inside clip group
    const content = svg.append('g').attr('clip-path', 'url(#area-clip)');

    const areaPath = content.append('path')
      .datum(data)
      .attr('fill', 'url(#zoomable-area-grad)')
      .attr('d', area);

    const linePath = content.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#06B6D4')
      .attr('stroke-width', 2.2)
      .attr('d', line);

    // Crosshair group
    const crosshair = content.append('g').style('display', 'none');
    const vLine = crosshair.append('line')
      .attr('y1', margin.top)
      .attr('y2', height - margin.bottom)
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3,3');
    const dot = crosshair.append('circle')
      .attr('r', 5)
      .attr('fill', '#38bdf8')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2);

    // Zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([1, 16])
      .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
      .translateExtent([[margin.left, -Infinity], [width - margin.right, Infinity]])
      .on('zoom', (event) => {
        const xz = event.transform.rescaleX(x);
        gx.call(d3.axisBottom(xz).ticks(8).tickSizeOuter(0))
          .call(g => g.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '10px').attr('font-family', 'Aldrich, sans-serif'));

        areaPath.attr('d', area.x(d => xz(d.date)));
        linePath.attr('d', line.x(d => xz(d.date)));

        // Update stats for visible domain
        const [d0, d1] = xz.domain();
        const inView = data.filter(d => d.date >= d0 && d.date <= d1);
        if (inView.length > 0) {
          const vals = inView.map(d => d.value);
          setStats({
            min: d3.min(vals),
            max: d3.max(vals),
            mean: Math.round(d3.mean(vals)),
            count: inView.length
          });
        }
      });

    zoomBehaviorRef.current = zoom;
    svg.call(zoom);

    // Initial stats
    const allVals = data.map(d => d.value);
    setStats({
      min: d3.min(allVals),
      max: d3.max(allVals),
      mean: Math.round(d3.mean(allVals)),
      count: data.length
    });

    // Pointer tracker
    svg.on('mousemove', (event) => {
      const [mx] = d3.pointer(event);
      if (mx < margin.left || mx > width - margin.right) {
        crosshair.style('display', 'none');
        setHoveredPoint(null);
        return;
      }
      const transform = d3.zoomTransform(svg.node());
      const xz = transform.rescaleX(x);
      const hoveredDate = xz.invert(mx);
      const bisect = d3.bisector(d => d.date).center;
      const idx = bisect(data, hoveredDate);
      const pt = data[idx];
      if (pt) {
        crosshair.style('display', null);
        const px = xz(pt.date);
        const py = y(pt.value);
        vLine.attr('x1', px).attr('x2', px);
        dot.attr('cx', px).attr('cy', py);
        setHoveredPoint(pt);
      }
    });

    svg.on('mouseleave', () => {
      crosshair.style('display', 'none');
      setHoveredPoint(null);
    });

  }, [data]);

  // Preset Handler
  const handlePreset = (preset) => {
    setActivePreset(preset);
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const svg = d3.select(svgRef.current);
    if (preset === 'All') {
      svg.transition().duration(750).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
    } else {
      const k = preset === '1M' ? 12 : preset === '3M' ? 4 : 2;
      svg.transition().duration(750).call(zoomBehaviorRef.current.scaleTo, k);
    }
  };

  return (
    <div ref={containerRef} className="w-full flex flex-col gap-4 font-Aldrich text-slate-100 p-2 sm:p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-lg shadow-inner">
            📈
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
              Zoomable Area Chart
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Continuous D3 Zoom
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Scroll wheel or drag horizontally to zoom and inspect high-frequency patient vitals • Clipping mask bounded
            </p>
          </div>
        </div>

        {/* Quick Range Presets */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-lg border border-slate-700 text-xs">
          {['1M', '3M', '6M', 'All'].map(p => (
            <button
              key={p}
              onClick={() => handlePreset(p)}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer font-bold ${
                activePreset === p ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Main SVG Visualization */}
      <div className="relative w-full rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950/80 p-2 shadow-inner">
        <svg ref={svgRef} className="w-full h-auto cursor-ew-resize select-none" />

        {hoveredPoint && (
          <div className="absolute top-4 right-4 bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-md pointer-events-none">
            <span className="text-xs font-bold text-white block">
              {d3.utcFormat('%A, %B %d, %Y')(hoveredPoint.date)}
            </span>
            <span className="text-base font-bold text-cyan-400 mt-1 block">
              {hoveredPoint.value} bpm / Vitals Index
            </span>
            <span className="text-[10px] text-emerald-400">
              Baseline: {hoveredPoint.baseline} (Delta: {hoveredPoint.value - hoveredPoint.baseline > 0 ? `+${hoveredPoint.value - hoveredPoint.baseline}` : hoveredPoint.value - hoveredPoint.baseline})
            </span>
          </div>
        )}
      </div>

      {/* Summary Telemetry */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">In-View Observations</span>
          <span className="text-base font-bold text-cyan-400">{stats.count} Days</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Mean Vitals Index</span>
          <span className="text-base font-bold text-purple-400">{stats.mean}</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Max Peak</span>
          <span className="text-base font-bold text-emerald-400">{stats.max}</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Min Trough</span>
          <span className="text-base font-bold text-amber-400">{stats.min}</span>
        </div>
      </div>
    </div>
  );
};

export default ZoomableAreaChart;
