// IndexChart.jsx
'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';

// Fresh vibrant series colors
const SERIES_CONFIG = {
  'Pharmaceuticals': { color: '#10B981', code: 'PHAR', desc: 'Prescription Therapeutics & Vaccines' },
  'Biotech Genomics': { color: '#06B6D4', code: 'BIOT', desc: 'CRISPR & Gene Therapy Pipelines' },
  'Medical Robotics': { color: '#8B5CF6', code: 'ROBO', desc: 'Surgical Automation & Prosthetics' },
  'Diagnostics Core': { color: '#F59E0B', code: 'DIAG', desc: 'Pathology & Imaging Networks' },
  'Digital Telehealth': { color: '#F43F5E', code: 'DIGI', desc: 'Virtual Consultations & Telemetry' }
};

// Generate realistic multi-year indexed time-series dataset (2022 to 2024)
function generateIndexData() {
  const data = [];
  const startDate = new Date('2022-01-01');
  const endDate = new Date('2024-06-30');
  const totalDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));

  let valPhar = 100;
  let valBiot = 100;
  let valRobo = 100;
  let valDiag = 100;
  let valDigi = 100;

  for (let i = 0; i <= totalDays; i += 7) { // weekly intervals
    const currentDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);

    // Drifting random walks
    valPhar += (Math.random() - 0.46) * 4.2;
    valBiot += (Math.random() - 0.44) * 6.5;
    valRobo += (Math.random() - 0.45) * 5.1;
    valDiag += (Math.random() - 0.47) * 3.8;
    valDigi += (Math.random() - 0.48) * 5.4;

    data.push({
      date: currentDate,
      'Pharmaceuticals': Math.max(20, +valPhar.toFixed(2)),
      'Biotech Genomics': Math.max(20, +valBiot.toFixed(2)),
      'Medical Robotics': Math.max(20, +valRobo.toFixed(2)),
      'Diagnostics Core': Math.max(20, +valDiag.toFixed(2)),
      'Digital Telehealth': Math.max(20, +valDigi.toFixed(2))
    });
  }

  return data;
}

const IndexChart = () => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const fullData = useMemo(() => generateIndexData(), []);

  const [dateRange, setDateRange] = useState('All'); // '3M' | '6M' | '1Y' | 'All'
  const [scaleType, setScaleType] = useState('linear'); // 'linear' | 'log'
  const [referenceDate, setReferenceDate] = useState(null);
  const [normalizedMetrics, setNormalizedMetrics] = useState({});
  const [hiddenSeries, setHiddenSeries] = useState([]);

  // Filtered dataset based on range
  const filteredData = useMemo(() => {
    if (dateRange === 'All') return fullData;
    const lastDate = fullData[fullData.length - 1].date;
    const months = dateRange === '3M' ? 3 : dateRange === '6M' ? 6 : 12;
    const cutoff = new Date(lastDate.getTime() - months * 30 * 24 * 60 * 60 * 1000);
    return fullData.filter(d => d.date >= cutoff);
  }, [fullData, dateRange]);

  // Active series keys
  const seriesKeys = useMemo(() => {
    return Object.keys(SERIES_CONFIG).filter(k => !hiddenSeries.includes(k));
  }, [hiddenSeries]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || filteredData.length === 0) return;

    const width = 950;
    const height = 480;
    const margin = { top: 30, right: 110, bottom: 40, left: 60 };

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('viewBox', [0, 0, width, height])
      .attr('width', '100%')
      .attr('height', 'auto')
      .style('max-height', '540px')
      .style('background', '#0b1120')
      .style('border-radius', '12px');

    const bisect = d3.bisector(d => d.date).center;

    // Default reference date to first point in visible range if not set or out of bounds
    let baseDate = referenceDate;
    if (!baseDate || baseDate < filteredData[0].date || baseDate > filteredData[filteredData.length - 1].date) {
      baseDate = filteredData[0].date;
    }

    const baseIndex = bisect(filteredData, baseDate);
    const baseRow = filteredData[baseIndex] || filteredData[0];

    // Compute normalized series values (value / baseValue)
    const series = seriesKeys.map(key => {
      const baseVal = baseRow[key] || 1;
      return {
        key,
        values: filteredData.map(d => ({
          date: d.date,
          value: d[key] / baseVal
        }))
      };
    });

    // Update live readout state
    const latestRow = filteredData[filteredData.length - 1];
    const latestMetrics = {};
    seriesKeys.forEach(k => {
      const b = baseRow[k] || 1;
      const cur = latestRow[k] || 1;
      const change = ((cur - b) / b) * 100;
      latestMetrics[k] = {
        ratio: (cur / b).toFixed(2),
        pctChange: (change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`),
        isPositive: change >= 0
      };
    });
    setNormalizedMetrics(latestMetrics);

    // Scales
    const x = d3.scaleUtc()
      .domain(d3.extent(filteredData, d => d.date))
      .range([margin.left, width - margin.right]);

    // Compute Y domain
    let yMin = d3.min(series, s => d3.min(s.values, d => d.value)) || 0.5;
    let yMax = d3.max(series, s => d3.max(s.values, d => d.value)) || 2.0;

    let y;
    if (scaleType === 'log') {
      const k = Math.max(1 / yMin, yMax);
      y = d3.scaleLog()
        .domain([1 / k, k])
        .rangeRound([height - margin.bottom, margin.top]);
    } else {
      y = d3.scaleLinear()
        .domain([Math.min(0.7, yMin * 0.95), Math.max(1.3, yMax * 1.05)])
        .range([height - margin.bottom, margin.top]);
    }

    // Grid
    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(6).tickSize(-(width - margin.left - margin.right)).tickFormat(''))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').attr('stroke', '#1e293b').attr('stroke-dasharray', '3,3'));

    // Horizontal Baseline Rule at 1.0 (0% change)
    svg.append('line')
      .attr('x1', margin.left)
      .attr('x2', width - margin.right)
      .attr('y1', y(1.0))
      .attr('y2', y(1.0))
      .attr('stroke', '#475569')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,4');

    svg.append('text')
      .attr('x', margin.left + 8)
      .attr('y', y(1.0) - 6)
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'Aldrich, sans-serif')
      .text('BASELINE (1.00x / 0.0%)');

    // Axes
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(8).tickFormat(d3.utcFormat('%b %Y')))
      .call(g => g.select('.domain').attr('stroke', '#334155'))
      .call(g => g.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '10px').attr('font-family', 'Aldrich, sans-serif'));

    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(6).tickFormat(d => `${d.toFixed(2)}x`))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '10px').attr('font-family', 'Aldrich, sans-serif'));

    // Line generator
    const line = d3.line()
      .x(d => x(d.date))
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX);

    // Draw series paths
    const linesGroup = svg.append('g').attr('class', 'lines');

    series.forEach(s => {
      const color = SERIES_CONFIG[s.key]?.color || '#38bdf8';

      // Path
      linesGroup.append('path')
        .datum(s.values)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 2.5)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('d', line);

      // Label at line end with halo stroke
      const lastPoint = s.values[s.values.length - 1];
      if (lastPoint) {
        const changePct = ((lastPoint.value - 1) * 100).toFixed(1);
        const sign = lastPoint.value >= 1 ? '+' : '';

        const labelG = linesGroup.append('g')
          .attr('transform', `translate(${width - margin.right + 8},${y(lastPoint.value)})`);

        labelG.append('text')
          .attr('dy', '0.35em')
          .attr('paint-order', 'stroke fill')
          .attr('stroke', '#020617')
          .attr('stroke-width', 3)
          .attr('fill', color)
          .attr('font-size', '10px')
          .attr('font-weight', 'bold')
          .attr('font-family', 'Aldrich, sans-serif')
          .text(`${SERIES_CONFIG[s.key]?.code} (${sign}${changePct}%)`);
      }
    });

    // Vertical tracking rule for reference date
    const rule = svg.append('line')
      .attr('y1', margin.top)
      .attr('y2', height - margin.bottom)
      .attr('x1', x(baseDate))
      .attr('x2', x(baseDate))
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 2);

    const ruleBadge = svg.append('g')
      .attr('transform', `translate(${x(baseDate)},${margin.top - 8})`);

    ruleBadge.append('rect')
      .attr('x', -40)
      .attr('y', -12)
      .attr('width', 80)
      .attr('height', 16)
      .attr('rx', 4)
      .attr('fill', '#0284c7');

    ruleBadge.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 0)
      .attr('fill', '#ffffff')
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'Aldrich, sans-serif')
      .text(d3.utcFormat('%b %d, %y')(baseDate));

    // Interactive Overlay for Mouse Drag / Move
    svg.append('rect')
      .attr('class', 'overlay')
      .attr('x', margin.left)
      .attr('y', margin.top)
      .attr('width', width - margin.left - margin.right)
      .attr('height', height - margin.top - margin.bottom)
      .attr('fill', 'transparent')
      .attr('cursor', 'crosshair')
      .on('mousemove', (event) => {
        const [xm] = d3.pointer(event);
        const hoveredDate = x.invert(xm);
        const i = bisect(filteredData, hoveredDate);
        if (filteredData[i]) {
          setReferenceDate(filteredData[i].date);
        }
      });

  }, [filteredData, seriesKeys, referenceDate, scaleType]);

  const toggleSeries = (key) => {
    setHiddenSeries(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  return (
    <div ref={containerRef} className="w-full flex flex-col gap-4 font-Aldrich text-slate-100 p-2 sm:p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-lg shadow-inner">
            📈
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
              Healthcare Capital & Sector Index Chart
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Dynamic Base Normalization
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Hover along timeline to move reference date • All 5 clinical sectors automatically re-index to 1.0 at that point
            </p>
          </div>
        </div>

        {/* Range & Scale Selectors */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
            {['3M', '6M', '1Y', 'All'].map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer font-bold ${
                  dateRange === range ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <button
            onClick={() => setScaleType(scaleType === 'linear' ? 'log' : 'linear')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer font-medium"
          >
            {scaleType === 'linear' ? '📏 Linear Scale' : '📐 Log Scale'}
          </button>
        </div>
      </div>

      {/* Interactive Legend Swatches with Live Normalized % Change */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
        <span className="text-slate-500 font-bold uppercase text-[10px] mr-1">Sectors:</span>
        {Object.entries(SERIES_CONFIG).map(([name, conf]) => {
          const isHidden = hiddenSeries.includes(name);
          const metric = normalizedMetrics[name];
          return (
            <button
              key={name}
              onClick={() => toggleSeries(name)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                !isHidden
                  ? 'bg-slate-800 text-slate-200 border-slate-700 shadow-sm'
                  : 'bg-slate-900/40 text-slate-600 border-slate-800 line-through opacity-50'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: conf.color }} />
              <span className="font-bold">{conf.code}</span>
              {metric && !isHidden && (
                <span className={`text-[10px] font-bold px-1 rounded ${metric.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {metric.pctChange}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main SVG Visualization */}
      <div className="relative w-full rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950/80 p-2 shadow-inner">
        <svg ref={svgRef} className="w-full h-auto select-none" />
      </div>

      {/* Summary Telemetry Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Base Reference Date</span>
          <span className="text-base font-bold text-cyan-400">
            {referenceDate ? d3.utcFormat('%b %d, %Y')(referenceDate) : 'Start of Range'}
          </span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Leading Sector</span>
          <span className="text-base font-bold text-emerald-400">Biotech Genomics</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Normalization Mode</span>
          <span className="text-base font-bold text-purple-400">Ratio Index (Base = 1.0)</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Active Assets</span>
          <span className="text-base font-bold text-amber-400">{seriesKeys.length} Clinical Series</span>
        </div>
      </div>
    </div>
  );
};

export default IndexChart;
