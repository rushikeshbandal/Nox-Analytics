// BollingerBands.jsx
'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';

// Generate 180 days of volatile financial / clinical procurement cost data
function generateVolatilityData() {
  const data = [];
  const start = new Date('2024-01-01');
  let price = 120;
  for (let i = 0; i < 180; i++) {
    const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const shock = Math.random() < 0.08 ? (Math.random() - 0.5) * 22 : (Math.random() - 0.49) * 5;
    price = Math.max(50, Math.min(240, price + shock));
    data.push({
      date: d,
      price: +price.toFixed(2)
    });
  }
  return data;
}

// Compute Bollinger Bands (SMA, Upper, Lower, %B)
function calculateBollinger(data, period = 20, multiplier = 2) {
  return data.map((d, i, arr) => {
    if (i < period - 1) {
      return { ...d, sma: null, upper: null, lower: null, bandwidth: null, isBreakout: false };
    }
    const slice = arr.slice(i - period + 1, i + 1).map(x => x.price);
    const mean = d3.mean(slice);
    const stdDev = d3.deviation(slice) || 0;
    const upper = mean + multiplier * stdDev;
    const lower = mean - multiplier * stdDev;
    const bandwidth = mean ? ((upper - lower) / mean) * 100 : 0;
    const isBreakout = d.price > upper || d.price < lower;

    return {
      ...d,
      sma: +mean.toFixed(2),
      upper: +upper.toFixed(2),
      lower: +lower.toFixed(2),
      bandwidth: +bandwidth.toFixed(2),
      isBreakout,
      breakoutType: d.price > upper ? 'upper' : d.price < lower ? 'lower' : null
    };
  });
}

const BollingerBands = () => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const rawData = useMemo(() => generateVolatilityData(), []);

  const [period, setPeriod] = useState(20);
  const [multiplier, setMultiplier] = useState(2.0);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Computed series
  const data = useMemo(() => {
    return calculateBollinger(rawData, period, multiplier);
  }, [rawData, period, multiplier]);

  // Telemetry stats
  const stats = useMemo(() => {
    const valid = data.filter(d => d.sma !== null);
    const breakouts = valid.filter(d => d.isBreakout).length;
    const current = valid[valid.length - 1] || {};
    return {
      currentPrice: current.price || 0,
      currentSMA: current.sma || 0,
      bandwidth: current.bandwidth || 0,
      breakouts
    };
  }, [data]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = 950;
    const height = 460;
    const margin = { top: 30, right: 40, bottom: 50, left: 60 };

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

    // Bollinger band fill gradient
    const grad = defs.append('linearGradient')
      .attr('id', 'bollinger-fill')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    grad.append('stop').attr('offset', '0%').attr('stop-color', '#8B5CF6').attr('stop-opacity', 0.25);
    grad.append('stop').attr('offset', '100%').attr('stop-color', '#06B6D4').attr('stop-opacity', 0.05);

    // Scales
    const x = d3.scaleUtc()
      .domain(d3.extent(data, d => d.date))
      .range([margin.left, width - margin.right]);

    const yMin = d3.min(data, d => d.lower || d.price) * 0.92;
    const yMax = d3.max(data, d => d.upper || d.price) * 1.08;

    const y = d3.scaleLinear()
      .domain([yMin, yMax])
      .nice()
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
      .call(d3.axisBottom(x).ticks(8).tickFormat(d3.utcFormat('%b %d')))
      .call(g => g.select('.domain').attr('stroke', '#334155'))
      .call(g => g.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '10px').attr('font-family', 'Aldrich, sans-serif'));

    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(6).tickFormat(d => `$${d}`))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '10px').attr('font-family', 'Aldrich, sans-serif'));

    const validData = data.filter(d => d.sma !== null);

    // Area envelope between upper and lower bands
    const bandArea = d3.area()
      .curve(d3.curveMonotoneX)
      .x(d => x(d.date))
      .y0(d => y(d.lower))
      .y1(d => y(d.upper));

    svg.append('path')
      .datum(validData)
      .attr('fill', 'url(#bollinger-fill)')
      .attr('d', bandArea);

    // Upper band line
    svg.append('path')
      .datum(validData)
      .attr('fill', 'none')
      .attr('stroke', '#8B5CF6')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3,3')
      .attr('d', d3.line().curve(d3.curveMonotoneX).x(d => x(d.date)).y(d => y(d.upper)));

    // Lower band line
    svg.append('path')
      .datum(validData)
      .attr('fill', 'none')
      .attr('stroke', '#10B981')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3,3')
      .attr('d', d3.line().curve(d3.curveMonotoneX).x(d => x(d.date)).y(d => y(d.lower)));

    // Middle SMA Line
    svg.append('path')
      .datum(validData)
      .attr('fill', 'none')
      .attr('stroke', '#06B6D4')
      .attr('stroke-width', 2)
      .attr('d', d3.line().curve(d3.curveMonotoneX).x(d => x(d.date)).y(d => y(d.sma)));

    // Actual price line
    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .attr('d', d3.line().curve(d3.curveMonotoneX).x(d => x(d.date)).y(d => y(d.price)));

    // Breakout anomaly dots
    svg.append('g').attr('class', 'breakouts')
      .selectAll('circle')
      .data(validData.filter(d => d.isBreakout))
      .join('circle')
      .attr('cx', d => x(d.date))
      .attr('cy', d => y(d.price))
      .attr('r', 4.5)
      .attr('fill', d => d.breakoutType === 'upper' ? '#F43F5E' : '#F59E0B')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1.5);

    // Crosshair
    const crosshair = svg.append('g').style('display', 'none');
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

    svg.append('rect')
      .attr('x', margin.left)
      .attr('y', margin.top)
      .attr('width', width - margin.left - margin.right)
      .attr('height', height - margin.top - margin.bottom)
      .attr('fill', 'transparent')
      .attr('cursor', 'crosshair')
      .on('mouseenter', () => crosshair.style('display', null))
      .on('mouseleave', () => {
        crosshair.style('display', 'none');
        setHoveredPoint(null);
      })
      .on('mousemove', (event) => {
        const [mx] = d3.pointer(event);
        const hoveredDate = x.invert(mx);
        const bisect = d3.bisector(d => d.date).center;
        const idx = bisect(data, hoveredDate);
        const pt = data[idx];
        if (pt) {
          vLine.attr('x1', x(pt.date)).attr('x2', x(pt.date));
          dot.attr('cx', x(pt.date)).attr('cy', y(pt.price));
          setHoveredPoint(pt);
        }
      });

  }, [data]);

  return (
    <div ref={containerRef} className="w-full flex flex-col gap-4 font-Aldrich text-slate-100 p-2 sm:p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 text-lg shadow-inner">
            ⚡
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
              Bollinger Bands Volatility Envelope
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                Statistical 2-Sigma Dispersion
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Procurement price trends with 20-period moving average & dynamic standard deviation expansion/contraction bands
            </p>
          </div>
        </div>

        {/* Sliders */}
        <div className="flex flex-wrap items-center gap-4 text-xs bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Period: <strong className="text-cyan-300">{period}d</strong></span>
            <input
              type="range"
              min={10}
              max={35}
              value={period}
              onChange={(e) => setPeriod(+e.target.value)}
              className="w-20 h-1.5 accent-cyan-400 cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Sigma (k): <strong className="text-purple-300">{multiplier}σ</strong></span>
            <input
              type="range"
              min={1.5}
              max={3.0}
              step={0.1}
              value={multiplier}
              onChange={(e) => setMultiplier(+e.target.value)}
              className="w-20 h-1.5 accent-purple-400 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900/60 px-4 py-2 rounded-xl border border-slate-800 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-white" />
          <span className="text-slate-300">Price Series</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-[#06B6D4]" />
          <span className="text-slate-300">SMA ({period}d)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-[#8B5CF6] border-b border-dashed" />
          <span className="text-slate-300">Upper Band (+{multiplier}σ)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-[#10B981] border-b border-dashed" />
          <span className="text-slate-300">Lower Band (-{multiplier}σ)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#F43F5E]" />
          <span className="text-slate-300">Breakout Anomaly</span>
        </div>
      </div>

      {/* Main SVG Visualization */}
      <div className="relative w-full rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950/80 p-2 shadow-inner">
        <svg ref={svgRef} className="w-full h-auto select-none" />

        {hoveredPoint && (
          <div className="absolute top-4 right-4 bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-md pointer-events-none">
            <span className="text-xs font-bold text-white block">
              {d3.utcFormat('%A, %b %d, %Y')(hoveredPoint.date)}
            </span>
            <div className="grid grid-cols-2 gap-2 mt-2 pt-1 border-t border-slate-800 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">Price:</span>
                <span className="text-white font-bold text-sm">${hoveredPoint.price}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">SMA ({period}d):</span>
                <span className="text-cyan-400 font-bold">${hoveredPoint.sma || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Upper (+{multiplier}σ):</span>
                <span className="text-purple-400 font-bold">${hoveredPoint.upper || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Lower (-{multiplier}σ):</span>
                <span className="text-emerald-400 font-bold">${hoveredPoint.lower || 'N/A'}</span>
              </div>
            </div>
            {hoveredPoint.bandwidth && (
              <div className="mt-1 text-[10px] text-amber-300 font-semibold">
                Bandwidth: {hoveredPoint.bandwidth}% volatility width
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary Telemetry */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Current Price</span>
          <span className="text-base font-bold text-white">${stats.currentPrice}</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Moving Average</span>
          <span className="text-base font-bold text-cyan-400">${stats.currentSMA}</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Bandwidth (Spread)</span>
          <span className="text-base font-bold text-purple-400">{stats.bandwidth}%</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Total Breakout Events</span>
          <span className="text-base font-bold text-rose-400">{stats.breakouts} Instances</span>
        </div>
      </div>
    </div>
  );
};

export default BollingerBands;
