// Pannablechart.jsx
'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';

// Generate 18 months of daily clinical admissions & emergency footfall
function generateTimeSeries() {
  const data = [];
  const start = new Date('2023-01-01');
  let currentVal = 140;

  for (let i = 0; i < 540; i++) {
    const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const dayOfWeek = d.getDay();
    const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? -28 : 12;
    const seasonality = Math.sin((i / 365) * 2 * Math.PI) * 24;
    const noise = (Math.random() - 0.48) * 16;
    currentVal = Math.max(60, Math.min(320, currentVal + (noise * 0.4)));

    const total = Math.round(currentVal + weekendFactor + seasonality + (Math.random() * 20));
    data.push({
      date: d,
      admissions: Math.max(50, total),
      emergency: Math.round(total * 0.42),
      scheduled: Math.round(total * 0.58)
    });
  }

  return data;
}

const PannableChart = () => {
  const focusSvgRef = useRef(null);
  const contextSvgRef = useRef(null);
  const containerRef = useRef(null);
  const data = useMemo(() => generateTimeSeries(), []);

  const [activePreset, setActivePreset] = useState('All');
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [viewMetrics, setViewMetrics] = useState({ totalInView: 0, avgInView: 0, peak: 0 });
  const brushBehaviorRef = useRef(null);
  const brushGroupRef = useRef(null);
  const contextXRef = useRef(null);

  useEffect(() => {
    if (!focusSvgRef.current || !contextSvgRef.current || !containerRef.current) return;

    const width = 950;
    const focusHeight = 360;
    const contextHeight = 85;
    const margin = { top: 25, right: 30, bottom: 30, left: 60 };
    const contextMargin = { top: 10, right: 30, bottom: 25, left: 60 };

    const focusSvg = d3.select(focusSvgRef.current);
    const contextSvg = d3.select(contextSvgRef.current);

    focusSvg.selectAll('*').remove();
    contextSvg.selectAll('*').remove();

    focusSvg
      .attr('viewBox', [0, 0, width, focusHeight])
      .attr('width', '100%')
      .attr('height', 'auto')
      .style('max-height', '400px')
      .style('background', '#0b1120')
      .style('border-radius', '12px 12px 0 0');

    contextSvg
      .attr('viewBox', [0, 0, width, contextHeight])
      .attr('width', '100%')
      .attr('height', 'auto')
      .style('max-height', '95px')
      .style('background', '#0f172a')
      .style('border-radius', '0 0 12px 12px');

    // Focus scales
    const xFocus = d3.scaleUtc()
      .domain(d3.extent(data, d => d.date))
      .range([margin.left, width - margin.right]);

    const yFocus = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.admissions) * 1.15])
      .range([focusHeight - margin.bottom, margin.top]);

    // Context scales
    const xContext = d3.scaleUtc()
      .domain(xFocus.domain())
      .range([contextMargin.left, width - contextMargin.right]);
    contextXRef.current = xContext;

    const yContext = d3.scaleLinear()
      .domain(yFocus.domain())
      .range([contextHeight - contextMargin.bottom, contextMargin.top]);

    // Defs & Clipping path
    const defs = focusSvg.append('defs');
    defs.append('clipPath')
      .attr('id', 'focus-clip')
      .append('rect')
      .attr('x', margin.left)
      .attr('y', margin.top)
      .attr('width', width - margin.left - margin.right)
      .attr('height', focusHeight - margin.top - margin.bottom);

    // Gradient fill
    const grad = defs.append('linearGradient')
      .attr('id', 'pannable-area-grad')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    grad.append('stop').attr('offset', '0%').attr('stop-color', '#06B6D4').attr('stop-opacity', 0.65);
    grad.append('stop').attr('offset', '100%').attr('stop-color', '#10B981').attr('stop-opacity', 0.05);

    // Focus Area & Line generators
    const areaFocus = d3.area()
      .curve(d3.curveMonotoneX)
      .x(d => xFocus(d.date))
      .y0(yFocus(0))
      .y1(d => yFocus(d.admissions));

    const lineFocus = d3.line()
      .curve(d3.curveMonotoneX)
      .x(d => xFocus(d.date))
      .y(d => yFocus(d.admissions));

    // Focus Grid
    const gridFocus = focusSvg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(yFocus).ticks(5).tickSize(-(width - margin.left - margin.right)).tickFormat(''))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').attr('stroke', '#1e293b').attr('stroke-dasharray', '3,3'));

    // Focus Axes
    const xAxisFocus = focusSvg.append('g')
      .attr('transform', `translate(0,${focusHeight - margin.bottom})`)
      .call(d3.axisBottom(xFocus).ticks(8).tickSizeOuter(0))
      .call(g => g.select('.domain').attr('stroke', '#334155'))
      .call(g => g.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '10px').attr('font-family', 'Aldrich, sans-serif'));

    const yAxisFocus = focusSvg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(yFocus).ticks(5).tickFormat(d => `${d}`))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '10px').attr('font-family', 'Aldrich, sans-serif'));

    // Focus clipped data paths
    const focusDataGroup = focusSvg.append('g')
      .attr('clip-path', 'url(#focus-clip)');

    const pathArea = focusDataGroup.append('path')
      .datum(data)
      .attr('fill', 'url(#pannable-area-grad)')
      .attr('d', areaFocus);

    const pathLine = focusDataGroup.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#06B6D4')
      .attr('stroke-width', 2.2)
      .attr('d', lineFocus);

    // Focus hover crosshair
    const crosshair = focusDataGroup.append('g').style('display', 'none');
    const crosshairLine = crosshair.append('line')
      .attr('y1', margin.top)
      .attr('y2', focusHeight - margin.bottom)
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,4');

    const crosshairDot = crosshair.append('circle')
      .attr('r', 5)
      .attr('fill', '#38bdf8')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2);

    // Overlay for focus mouse tracking
    focusSvg.append('rect')
      .attr('x', margin.left)
      .attr('y', margin.top)
      .attr('width', width - margin.left - margin.right)
      .attr('height', focusHeight - margin.top - margin.bottom)
      .attr('fill', 'transparent')
      .attr('cursor', 'crosshair')
      .on('mouseenter', () => crosshair.style('display', null))
      .on('mouseleave', () => {
        crosshair.style('display', 'none');
        setHoveredPoint(null);
      })
      .on('mousemove', (event) => {
        const [xm] = d3.pointer(event);
        const hoveredDate = xFocus.invert(xm);
        const bisect = d3.bisector(d => d.date).center;
        const i = bisect(data, hoveredDate);
        const d = data[i];
        if (d) {
          crosshairLine.attr('x1', xFocus(d.date)).attr('x2', xFocus(d.date));
          crosshairDot.attr('cx', xFocus(d.date)).attr('cy', yFocus(d.admissions));
          setHoveredPoint(d);
        }
      });

    // ──────────────── CONTEXT MINI-MAP ────────────────
    const areaContext = d3.area()
      .curve(d3.curveMonotoneX)
      .x(d => xContext(d.date))
      .y0(yContext(0))
      .y1(d => yContext(d.admissions));

    contextSvg.append('path')
      .datum(data)
      .attr('fill', '#06B6D4')
      .attr('fill-opacity', 0.25)
      .attr('stroke', '#06B6D4')
      .attr('stroke-width', 1)
      .attr('d', areaContext);

    contextSvg.append('g')
      .attr('transform', `translate(0,${contextHeight - contextMargin.bottom})`)
      .call(d3.axisBottom(xContext).ticks(6).tickSize(3))
      .call(g => g.select('.domain').attr('stroke', '#334155'))
      .call(g => g.selectAll('text').attr('fill', '#64748b').attr('font-size', '9px').attr('font-family', 'Aldrich, sans-serif'));

    // D3 Brush on Context
    const brush = d3.brushX()
      .extent([[contextMargin.left, contextMargin.top], [width - contextMargin.right, contextHeight - contextMargin.bottom]])
      .on('brush end', (event) => {
        const selection = event.selection;
        if (!selection) return;

        const [x0, x1] = selection.map(xContext.invert);
        xFocus.domain([x0, x1]);

        // Redraw focus elements
        pathArea.attr('d', areaFocus);
        pathLine.attr('d', lineFocus);
        xAxisFocus.call(d3.axisBottom(xFocus).ticks(8).tickSizeOuter(0))
          .call(g => g.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '10px').attr('font-family', 'Aldrich, sans-serif'));

        // Compute metrics in selected range
        const inView = data.filter(d => d.date >= x0 && d.date <= x1);
        if (inView.length > 0) {
          const sum = d3.sum(inView, d => d.admissions);
          const avg = Math.round(d3.mean(inView, d => d.admissions));
          const peak = d3.max(inView, d => d.admissions);
          setViewMetrics({ totalInView: sum, avgInView: avg, peak });
        }
      });

    brushBehaviorRef.current = brush;

    const gBrush = contextSvg.append('g')
      .attr('class', 'brush')
      .call(brush);
    brushGroupRef.current = gBrush;

    // Custom styling for brush selection
    gBrush.selectAll('.selection')
      .attr('fill', '#38bdf8')
      .attr('fill-opacity', 0.22)
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 1.5)
      .attr('rx', 3);

    // Set initial full brush selection
    gBrush.call(brush.move, [contextMargin.left, width - contextMargin.right]);

  }, [data]);

  // Handle Preset Range Clicks
  const handleRangePreset = (range) => {
    setActivePreset(range);
    if (!brushBehaviorRef.current || !brushGroupRef.current || !contextXRef.current) return;

    const xContext = contextXRef.current;
    const maxDate = data[data.length - 1].date;
    let minDate = data[0].date;

    if (range === '1M') {
      minDate = new Date(maxDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (range === '3M') {
      minDate = new Date(maxDate.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (range === '6M') {
      minDate = new Date(maxDate.getTime() - 180 * 24 * 60 * 60 * 1000);
    } else if (range === '1Y') {
      minDate = new Date(maxDate.getTime() - 365 * 24 * 60 * 60 * 1000);
    }

    const x0 = xContext(minDate);
    const x1 = xContext(maxDate);
    brushGroupRef.current.call(brushBehaviorRef.current.move, [x0, x1]);
  };

  return (
    <div ref={containerRef} className="w-full flex flex-col gap-4 font-Aldrich text-slate-100 p-2 sm:p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-lg shadow-inner">
            ↔️
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
              Pannable Time-Series & Context Brush
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                D3 BrushX & Dual Scales
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Drag or resize the lower mini-map brush to pan through 18 months of admissions • Real-time viewport statistics
            </p>
          </div>
        </div>

        {/* Quick Range Presets */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-lg border border-slate-700 text-xs">
          {['1M', '3M', '6M', '1Y', 'All'].map(range => (
            <button
              key={range}
              onClick={() => handleRangePreset(range)}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer font-bold ${
                activePreset === range ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Main Visualizer Container: Focus Chart on Top + Mini-Map on Bottom */}
      <div className="relative flex flex-col rounded-xl overflow-hidden border border-slate-800/80 shadow-inner">
        {/* Focus Chart */}
        <svg ref={focusSvgRef} className="w-full h-auto select-none" />

        {/* Floating Point Card on Hover */}
        {hoveredPoint && (
          <div className="absolute top-4 right-4 bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-md max-w-xs pointer-events-none">
            <span className="text-xs font-bold text-white block">
              {d3.utcFormat('%A, %B %d, %Y')(hoveredPoint.date)}
            </span>
            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">Total Admissions:</span>
                <span className="text-cyan-400 font-bold text-sm">{hoveredPoint.admissions} patients</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Emergency Inflow:</span>
                <span className="text-rose-400 font-bold">{hoveredPoint.emergency} cases</span>
              </div>
            </div>
          </div>
        )}

        {/* Context Mini-Map Brush */}
        <div className="w-full relative border-t border-slate-800">
          <svg ref={contextSvgRef} className="w-full h-auto select-none cursor-ew-resize" />
          <div className="absolute bottom-1 right-3 text-[9px] text-slate-500 pointer-events-none font-bold">
            DRAG BRUSH TO PAN ↔
          </div>
        </div>
      </div>

      {/* Telemetry Status Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Viewport Admissions</span>
          <span className="text-base font-bold text-cyan-400">{viewMetrics.totalInView.toLocaleString()} Cases</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Daily Inflow Mean</span>
          <span className="text-base font-bold text-purple-400">{viewMetrics.avgInView} / day</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Peak Single-Day Inflow</span>
          <span className="text-base font-bold text-emerald-400">{viewMetrics.peak} Patients</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Total Timeline Span</span>
          <span className="text-base font-bold text-amber-400">540 Consecutive Days</span>
        </div>
      </div>
    </div>
  );
};

export default PannableChart;
