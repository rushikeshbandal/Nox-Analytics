// BrushableScatterplot.jsx
'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';

// Category color palettes
const CATEGORY_COLORS = {
  'Cardiology': '#F43F5E',   // Rose
  'Oncology': '#8B5CF6',     // Violet
  'Neurology': '#06B6D4',    // Cyan
  'Orthopedics': '#10B981',  // Emerald
  'Pediatrics': '#F59E0B'    // Amber
};

// Procedurally generate 350 realistic clinical patient records
function generatePatients() {
  const categories = Object.keys(CATEGORY_COLORS);
  const data = [];

  for (let i = 0; i < 350; i++) {
    const cat = categories[Math.floor(Math.random() * categories.length)];
    let age = Math.round(20 + Math.random() * 65);
    let cost = Math.round(3000 + Math.random() * 24000);
    let stayDays = Math.round(1 + Math.random() * 14);
    let recoveryScore = Math.round(55 + Math.random() * 42);

    if (cat === 'Pediatrics') {
      age = Math.round(1 + Math.random() * 16);
      cost = Math.round(2000 + Math.random() * 12000);
    } else if (cat === 'Cardiology') {
      age = Math.round(50 + Math.random() * 35);
      cost = Math.round(8000 + Math.random() * 35000);
    } else if (cat === 'Oncology') {
      cost = Math.round(12000 + Math.random() * 45000);
    }

    data.push({
      id: `PT-${1000 + i}`,
      category: cat,
      age,
      cost,
      stayDays,
      recoveryScore
    });
  }

  return data;
}

const BrushableScatterplot = () => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const rawPatients = useMemo(() => generatePatients(), []);

  const [xAxisMetric, setXAxisMetric] = useState('age'); // 'age' | 'stayDays'
  const [yAxisMetric, setYAxisMetric] = useState('cost'); // 'cost' | 'recoveryScore'
  const [selectedCategories, setSelectedCategories] = useState(Object.keys(CATEGORY_COLORS));
  const [hoveredPatient, setHoveredPatient] = useState(null);
  const [selectedPoints, setSelectedPoints] = useState([]);
  const clearBrushRef = useRef(null);

  // Filtered points based on category checkboxes
  const visibleData = useMemo(() => {
    return rawPatients.filter(d => selectedCategories.includes(d.category));
  }, [rawPatients, selectedCategories]);

  // Telemetry stats for current brushed selection
  const stats = useMemo(() => {
    const activeCohort = selectedPoints.length > 0 ? selectedPoints : visibleData;
    const count = activeCohort.length;
    const avgAge = d3.mean(activeCohort, d => d.age) || 0;
    const avgCost = d3.mean(activeCohort, d => d.cost) || 0;
    const avgRecovery = d3.mean(activeCohort, d => d.recoveryScore) || 0;

    return {
      count,
      pct: visibleData.length > 0 ? ((count / visibleData.length) * 100).toFixed(1) : '0',
      isFiltered: selectedPoints.length > 0,
      avgAge: avgAge.toFixed(1),
      avgCost: Math.round(avgCost).toLocaleString(),
      avgRecovery: avgRecovery.toFixed(1)
    };
  }, [selectedPoints, visibleData]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || visibleData.length === 0) return;

    const width = 950;
    const height = 480;
    const margin = { top: 30, right: 40, bottom: 50, left: 75 };

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('viewBox', [0, 0, width, height])
      .attr('width', '100%')
      .attr('height', 'auto')
      .style('max-height', '540px')
      .style('background', '#0b1120')
      .style('border-radius', '12px');

    // Scales
    const xExtent = d3.extent(visibleData, d => d[xAxisMetric]);
    const x = d3.scaleLinear()
      .domain([Math.max(0, xExtent[0] * 0.9), xExtent[1] * 1.08])
      .range([margin.left, width - margin.right]);

    const yExtent = d3.extent(visibleData, d => d[yAxisMetric]);
    const y = d3.scaleLinear()
      .domain([Math.max(0, yExtent[0] * 0.85), yExtent[1] * 1.1])
      .range([height - margin.bottom, margin.top]);

    // Grid
    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(6).tickSize(-(width - margin.left - margin.right)).tickFormat(''))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').attr('stroke', '#1e293b').attr('stroke-dasharray', '3,3'));

    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(8).tickSize(-(height - margin.top - margin.bottom)).tickFormat(''))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').attr('stroke', '#1e293b').attr('stroke-dasharray', '3,3'));

    // Axes
    const xAxis = svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(8))
      .call(g => g.select('.domain').attr('stroke', '#334155'))
      .call(g => g.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '10px').attr('font-family', 'Aldrich, sans-serif'));

    const yAxis = svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(6).tickFormat(d => yAxisMetric === 'cost' ? `$${d / 1000}k` : `${d}%`))
      .call(g => g.select('.domain').attr('stroke', '#334155'))
      .call(g => g.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '10px').attr('font-family', 'Aldrich, sans-serif'));

    // Axis Labels
    svg.append('text')
      .attr('x', width - margin.right)
      .attr('y', height - margin.bottom + 36)
      .attr('text-anchor', 'end')
      .attr('fill', '#64748b')
      .attr('font-size', '11px')
      .attr('font-family', 'Aldrich, sans-serif')
      .text(xAxisMetric === 'age' ? 'PATIENT AGE (YEARS) →' : 'LENGTH OF STAY (DAYS) →');

    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -margin.top)
      .attr('y', margin.left - 48)
      .attr('text-anchor', 'end')
      .attr('fill', '#64748b')
      .attr('font-size', '11px')
      .attr('font-family', 'Aldrich, sans-serif')
      .text(yAxisMetric === 'cost' ? 'TOTAL BILLING AMOUNT ($ USD) →' : 'TREATMENT OUTCOME RECOVERY SCORE (%) →');

    // Scatter circles group
    const circlesGroup = svg.append('g').attr('class', 'circles');

    const dots = circlesGroup.selectAll('circle.dot')
      .data(visibleData, d => d.id)
      .join('circle')
      .attr('class', 'dot')
      .attr('cx', d => x(d[xAxisMetric]))
      .attr('cy', d => y(d[yAxisMetric]))
      .attr('r', 5.5)
      .attr('fill', d => CATEGORY_COLORS[d.category] || '#38bdf8')
      .attr('stroke', '#020617')
      .attr('stroke-width', 1.2)
      .attr('fill-opacity', 0.85)
      .attr('cursor', 'pointer')
      .on('mouseenter', (event, d) => setHoveredPatient(d))
      .on('mouseleave', () => setHoveredPatient(null));

    // D3 2D Brush setup
    const brush = d3.brush()
      .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
      .on('start brush end', ({ selection }) => {
        if (!selection) {
          dots.attr('fill-opacity', 0.85)
            .attr('stroke', '#020617')
            .attr('stroke-width', 1.2)
            .attr('r', 5.5);
          setSelectedPoints([]);
          return;
        }

        const [[x0, y0], [x1, y1]] = selection;

        const brushed = [];
        dots.each(function(d) {
          const cx = x(d[xAxisMetric]);
          const cy = y(d[yAxisMetric]);
          const isInside = cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1;

          if (isInside) {
            brushed.push(d);
            d3.select(this)
              .attr('fill-opacity', 1)
              .attr('stroke', '#ffffff')
              .attr('stroke-width', 2.2)
              .attr('r', 7.5);
          } else {
            d3.select(this)
              .attr('fill-opacity', 0.12)
              .attr('stroke', '#020617')
              .attr('stroke-width', 1)
              .attr('r', 4.5);
          }
        });

        setSelectedPoints(brushed);
      });

    const brushG = svg.append('g')
      .attr('class', 'brush')
      .call(brush);

    // Custom brush selection rectangle style
    brushG.selectAll('.selection')
      .attr('fill', '#38bdf8')
      .attr('fill-opacity', 0.18)
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,4');

    clearBrushRef.current = () => {
      brushG.call(brush.move, null);
      setSelectedPoints([]);
    };

  }, [visibleData, xAxisMetric, yAxisMetric]);

  const toggleCategory = (cat) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? (prev.length > 1 ? prev.filter(c => c !== cat) : prev) : [...prev, cat]
    );
  };

  return (
    <div ref={containerRef} className="w-full flex flex-col gap-4 font-Aldrich text-slate-100 p-2 sm:p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-lg shadow-inner">
            🎯
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
              Brushable 2D Clinical Scatterplot
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                D3 Bounding Box Selection
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Drag anywhere to create a 2D bounding selection box • Real-time stats recalculate across the brushed patient cohort
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => clearBrushRef.current && clearBrushRef.current()}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer font-medium"
          >
            Clear Selection ✕
          </button>
        </div>
      </div>

      {/* Axis Metric Switchers & Category Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
        {/* Metric axes */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 uppercase font-bold text-[10px]">X Axis:</span>
            <button
              onClick={() => setXAxisMetric('age')}
              className={`px-2.5 py-1 rounded-md border ${xAxisMetric === 'age' ? 'bg-cyan-600 text-white border-cyan-500 font-bold' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
            >
              Age
            </button>
            <button
              onClick={() => setXAxisMetric('stayDays')}
              className={`px-2.5 py-1 rounded-md border ${xAxisMetric === 'stayDays' ? 'bg-cyan-600 text-white border-cyan-500 font-bold' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
            >
              Length of Stay
            </button>
          </div>

          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-slate-500 uppercase font-bold text-[10px]">Y Axis:</span>
            <button
              onClick={() => setYAxisMetric('cost')}
              className={`px-2.5 py-1 rounded-md border ${yAxisMetric === 'cost' ? 'bg-purple-600 text-white border-purple-500 font-bold' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
            >
              Billing Cost
            </button>
            <button
              onClick={() => setYAxisMetric('recoveryScore')}
              className={`px-2.5 py-1 rounded-md border ${yAxisMetric === 'recoveryScore' ? 'bg-purple-600 text-white border-purple-500 font-bold' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
            >
              Recovery %
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap items-center gap-2">
          {Object.entries(CATEGORY_COLORS).map(([cat, col]) => {
            const isSelected = selectedCategories.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800 text-slate-200 border-slate-600 shadow-sm'
                    : 'bg-slate-900/40 text-slate-600 border-slate-800 line-through opacity-50'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col }} />
                <span>{cat}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main SVG Visualization */}
      <div className="relative w-full rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950/80 p-2 shadow-inner">
        <svg ref={svgRef} className="w-full h-auto select-none" />

        {/* Hover Patient Card */}
        {hoveredPatient && (
          <div className="absolute top-4 right-4 bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-md max-w-xs pointer-events-none">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5 mb-1.5">
              <span className="text-xs font-bold text-white">{hoveredPatient.id}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {hoveredPatient.category}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">Age:</span>
                <span className="font-bold text-white">{hoveredPatient.age} yrs</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Stay Duration:</span>
                <span className="font-bold text-amber-400">{hoveredPatient.stayDays} days</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Billing Cost:</span>
                <span className="font-bold text-emerald-400">${hoveredPatient.cost.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Recovery Score:</span>
                <span className="font-bold text-cyan-400">{hoveredPatient.recoveryScore}%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Real-time Brushed Cohort Telemetry */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">
            {stats.isFiltered ? 'Brushed Cohort Count' : 'Total Patients Visible'}
          </span>
          <span className="text-base font-bold text-cyan-400">
            {stats.count} ({stats.pct}%)
          </span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Cohort Mean Age</span>
          <span className="text-base font-bold text-purple-400">{stats.avgAge} Years</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Cohort Mean Billing</span>
          <span className="text-base font-bold text-emerald-400">${stats.avgCost}</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Mean Recovery Score</span>
          <span className="text-base font-bold text-amber-400">{stats.avgRecovery}%</span>
        </div>
      </div>
    </div>
  );
};

export default BrushableScatterplot;
