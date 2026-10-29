// PieChartUpdate.jsx
'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';

// Fresh vibrant color scheme
const CATEGORY_CONFIG = {
  'Cardiology': { color: '#F43F5E', icon: '❤️' },
  'Neurology': { color: '#8B5CF6', icon: '🧠' },
  'Diagnostics': { color: '#06B6D4', icon: '🔬' },
  'Orthopedics': { color: '#10B981', icon: '🦴' },
  'Pediatrics': { color: '#F59E0B', icon: '👶' },
  'Oncology': { color: '#EC4899', icon: '🎗️' },
  'Immunology': { color: '#3B82F6', icon: '💉' }
};

// Multi-period dataset configurations
const DATASETS = {
  '2021 (Pandemic Response)': [
    { name: 'Cardiology', value: 1420 },
    { name: 'Neurology', value: 980 },
    { name: 'Diagnostics', value: 3840 },
    { name: 'Orthopedics', value: 1100 },
    { name: 'Pediatrics', value: 1250 },
    { name: 'Oncology', value: 1680 },
    { name: 'Immunology', value: 2950 }
  ],
  '2022 (Recovery & Electives)': [
    { name: 'Cardiology', value: 1850 },
    { name: 'Neurology', value: 1240 },
    { name: 'Diagnostics', value: 2980 },
    { name: 'Orthopedics', value: 1950 },
    { name: 'Pediatrics', value: 1620 },
    { name: 'Oncology', value: 2100 },
    { name: 'Immunology', value: 1800 }
  ],
  '2023 (Surgical Expansion)': [
    { name: 'Cardiology', value: 2450 },
    { name: 'Neurology', value: 1650 },
    { name: 'Diagnostics', value: 3100 },
    { name: 'Orthopedics', value: 2600 },
    { name: 'Pediatrics', value: 1890 },
    { name: 'Oncology', value: 2540 },
    { name: 'Immunology', value: 1450 }
  ],
  '2024 (Precision Medicine)': [
    { name: 'Cardiology', value: 2900 },
    { name: 'Neurology', value: 2100 },
    { name: 'Diagnostics', value: 3650 },
    { name: 'Orthopedics', value: 2850 },
    { name: 'Pediatrics', value: 2150 },
    { name: 'Oncology', value: 3200 },
    { name: 'Immunology', value: 1600 }
  ]
};

const PieChartUpdate = () => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [selectedPeriod, setSelectedPeriod] = useState('2024 (Precision Medicine)');
  const [isDonut, setIsDonut] = useState(true);
  const [padAngle, setPadAngle] = useState(0.02);
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const [hiddenCategories, setHiddenCategories] = useState([]);
  const previousArcsRef = useRef({});

  // Active dataset
  const currentData = useMemo(() => {
    const raw = DATASETS[selectedPeriod] || DATASETS['2024 (Precision Medicine)'];
    return raw.filter(d => !hiddenCategories.includes(d.name));
  }, [selectedPeriod, hiddenCategories]);

  // Aggregate stats
  const stats = useMemo(() => {
    const total = currentData.reduce((acc, c) => acc + c.value, 0);
    const sorted = [...currentData].sort((a, b) => b.value - a.value);
    const top = sorted[0] || { name: '-', value: 0 };
    return {
      total,
      topName: top.name,
      topValue: top.value,
      topPct: total ? ((top.value / total) * 100).toFixed(1) : 0
    };
  }, [currentData]);

  // Randomize data handler
  const handleRandomize = () => {
    const randomized = Object.keys(CATEGORY_CONFIG).map(name => ({
      name,
      value: Math.floor(Math.random() * 2500) + 800
    }));
    DATASETS['Custom Simulation'] = randomized;
    setSelectedPeriod('Custom Simulation');
  };

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || currentData.length === 0) return;

    const width = 600;
    const height = 520;
    const radius = Math.min(width, height) / 2 - 30;
    const innerRadius = isDonut ? radius * 0.55 : 0;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('viewBox', [-width / 2, -height / 2, width, height])
      .attr('width', '100%')
      .attr('height', 'auto')
      .style('max-height', '540px')
      .style('background', '#0b1120')
      .style('border-radius', '12px');

    // Pie Layout
    const pie = d3.pie()
      .value(d => d.value)
      .sort(null)
      .padAngle(padAngle);

    // Arc Generator
    const arc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(radius)
      .cornerRadius(4);

    // Hover Arc (pull out slightly)
    const arcHover = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(radius + 12)
      .cornerRadius(6);

    const arcs = pie(currentData);

    const gSlices = svg.append('g').attr('class', 'slices');
    const gLabels = svg.append('g').attr('class', 'labels').attr('pointer-events', 'none');

    // Center Display for Donut Mode
    const centerGroup = svg.append('g').attr('class', 'center-info').attr('pointer-events', 'none');
    if (isDonut) {
      centerGroup.append('circle')
        .attr('r', innerRadius - 6)
        .attr('fill', '#0f172a')
        .attr('stroke', '#1e293b')
        .attr('stroke-width', 2);

      centerGroup.append('text')
        .attr('class', 'center-val font-Aldrich')
        .attr('dy', '-0.1em')
        .attr('text-anchor', 'middle')
        .attr('font-size', '24px')
        .attr('font-weight', 'bold')
        .attr('fill', '#38bdf8')
        .text(stats.total.toLocaleString());

      centerGroup.append('text')
        .attr('class', 'center-lbl font-Aldrich')
        .attr('dy', '1.6em')
        .attr('text-anchor', 'middle')
        .attr('font-size', '11px')
        .attr('fill', '#94a3b8')
        .text('Total Patient Cases');
    }

    // Key function for object constancy
    function key(d) {
      return d.data.name;
    }

    // Stash arcs for tweening
    const prev = previousArcsRef.current;

    // Slices Join
    const slice = gSlices.selectAll('path.slice')
      .data(arcs, key);

    slice.enter()
      .append('path')
      .attr('class', 'slice')
      .attr('fill', d => CATEGORY_CONFIG[d.data.name]?.color || '#06B6D4')
      .attr('stroke', '#020617')
      .attr('stroke-width', 2)
      .attr('cursor', 'pointer')
      .each(function(d) {
        // Initial transition interpolation from 0 angle
        this._current = prev[d.data.name] || { startAngle: d.startAngle, endAngle: d.startAngle };
      })
      .on('mouseenter', function(event, d) {
        d3.select(this)
          .transition().duration(250)
          .attr('d', arcHover)
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 3);
        setHoveredSlice({
          name: d.data.name,
          value: d.data.value,
          pct: ((d.data.value / stats.total) * 100).toFixed(1)
        });
      })
      .on('mouseleave', function(event, d) {
        d3.select(this)
          .transition().duration(250)
          .attr('d', arc)
          .attr('stroke', '#020617')
          .attr('stroke-width', 2);
        setHoveredSlice(null);
      })
      .transition().duration(750)
      .attrTween('d', function(d) {
        const interpolate = d3.interpolate(this._current, d);
        this._current = interpolate(0);
        return function(t) {
          return arc(interpolate(t));
        };
      });

    slice.transition().duration(750)
      .attrTween('d', function(d) {
        const interpolate = d3.interpolate(this._current || d, d);
        this._current = interpolate(0);
        return function(t) {
          return arc(interpolate(t));
        };
      });

    slice.exit()
      .transition().duration(500)
      .attrTween('d', function(d) {
        const interpolate = d3.interpolate(this._current, { startAngle: d.startAngle, endAngle: d.startAngle });
        return function(t) {
          return arc(interpolate(t));
        };
      })
      .remove();

    // Labels Join with Halo Stroke
    const label = gLabels.selectAll('text.slice-label')
      .data(arcs.filter(d => (d.endAngle - d.startAngle) > 0.25), key);

    label.enter()
      .append('text')
      .attr('class', 'slice-label font-Aldrich')
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .attr('paint-order', 'stroke fill')
      .attr('stroke', '#020617')
      .attr('stroke-width', 3.5)
      .attr('stroke-linejoin', 'round')
      .attr('fill', '#ffffff')
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .text(d => `${((d.value / stats.total) * 100).toFixed(0)}%`)
      .attr('fill-opacity', 0)
      .transition().duration(750)
      .attr('fill-opacity', 1);

    label.transition().duration(750)
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .text(d => `${((d.value / stats.total) * 100).toFixed(0)}%`);

    label.exit().remove();

    // Stash current arcs for next update
    const newPrev = {};
    arcs.forEach(a => {
      newPrev[a.data.name] = a;
    });
    previousArcsRef.current = newPrev;

  }, [currentData, isDonut, padAngle, stats.total]);

  const toggleCategory = (catName) => {
    setHiddenCategories(prev =>
      prev.includes(catName) ? prev.filter(c => c !== catName) : [...prev, catName]
    );
  };

  return (
    <div ref={containerRef} className="w-full flex flex-col gap-4 font-Aldrich text-slate-100 p-2 sm:p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 text-lg shadow-inner">
            🥧
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
              Dynamic Pie / Donut Morphing
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                Smooth D3 ArcTween
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Smooth angle & radius interpolation when switching datasets • Toggle Donut mode & filter specialty slices
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setIsDonut(!isDonut)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer font-medium"
          >
            {isDonut ? '🍩 Donut Mode' : '🥧 Full Pie'}
          </button>
          <button
            onClick={handleRandomize}
            className="px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 transition-all cursor-pointer font-bold shadow-sm"
          >
            🎲 Randomize Data
          </button>
        </div>
      </div>

      {/* Dataset Period Selectors */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
        <span className="text-slate-500 font-bold uppercase text-[10px] mr-1">Dataset Cycle:</span>
        {Object.keys(DATASETS).map(period => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer font-medium ${
              selectedPeriod === period
                ? 'bg-pink-600 text-white border-pink-500 shadow-md font-bold'
                : 'bg-slate-800/70 text-slate-300 border-slate-700 hover:text-white'
            }`}
          >
            {period}
          </button>
        ))}
      </div>

      {/* Specialty Legend Badges */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900/40 px-4 py-2 rounded-xl border border-slate-800 text-xs">
        <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Specialties:</span>
        {Object.entries(CATEGORY_CONFIG).map(([name, conf]) => {
          const isHidden = hiddenCategories.includes(name);
          return (
            <button
              key={name}
              onClick={() => toggleCategory(name)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] transition-all cursor-pointer ${
                !isHidden
                  ? 'bg-slate-800 text-slate-200 border-slate-600 shadow-sm'
                  : 'bg-slate-900/40 text-slate-600 border-slate-800 line-through opacity-50'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: conf.color }} />
              <span>{name}</span>
            </button>
          );
        })}
      </div>

      {/* Main SVG Visualization */}
      <div className="relative w-full flex items-center justify-center rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950/80 p-2 shadow-inner">
        <svg ref={svgRef} className="w-full max-w-[500px] h-auto select-none" />

        {/* Hover slice card */}
        {hoveredSlice && (
          <div className="absolute top-4 right-4 bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-md">
            <span className="text-xs font-bold text-white block">
              {hoveredSlice.name}
            </span>
            <span className="text-base font-bold text-pink-400 mt-1 block">
              {hoveredSlice.value.toLocaleString()} patients
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold">
              {hoveredSlice.pct}% of cohort total
            </span>
          </div>
        )}
      </div>

      {/* Summary Telemetry */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Aggregated Caseload</span>
          <span className="text-base font-bold text-cyan-400">{stats.total.toLocaleString()}</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Leading Specialty</span>
          <span className="text-base font-bold text-pink-400">{stats.topName}</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Top Share</span>
          <span className="text-base font-bold text-emerald-400">{stats.topPct}%</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Active Slices</span>
          <span className="text-base font-bold text-purple-400">{currentData.length} Departments</span>
        </div>
      </div>
    </div>
  );
};

export default PieChartUpdate;
