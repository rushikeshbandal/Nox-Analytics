// SortableBarChart.jsx
'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';

// Fresh vibrant color scheme mapped by department category
const CATEGORY_COLORS = {
  'Surgical': '#8B5CF6',     // Violet
  'Acute & ICU': '#F43F5E',  // Rose
  'Diagnostics': '#06B6D4',  // Cyan
  'Internal Med': '#10B981', // Emerald
  'Outpatient': '#F59E0B'    // Amber
};

const INITIAL_DATA = [
  { id: 'CARD', name: 'Cardiology & Stents', category: 'Surgical', volume: 1840, stayDays: 4.2, satisfaction: 94, growth: '+14.2%' },
  { id: 'NEUR', name: 'Neurosurgery & Spine', category: 'Surgical', volume: 1420, stayDays: 6.5, satisfaction: 91, growth: '+9.8%' },
  { id: 'ORTH', name: 'Orthopedics & Joint', category: 'Surgical', volume: 1680, stayDays: 3.8, satisfaction: 96, growth: '+18.1%' },
  { id: 'EMRG', name: 'Emergency Trauma Ctr', category: 'Acute & ICU', volume: 2950, stayDays: 1.8, satisfaction: 88, growth: '+22.4%' },
  { id: 'ICUM', name: 'Intensive Critical Care', category: 'Acute & ICU', volume: 1150, stayDays: 8.4, satisfaction: 89, growth: '+5.7%' },
  { id: 'ONCO', name: 'Oncology Infusion Hub', category: 'Internal Med', volume: 2240, stayDays: 2.9, satisfaction: 95, growth: '+16.5%' },
  { id: 'PULM', name: 'Pulmonology & Asthma', category: 'Internal Med', volume: 1390, stayDays: 4.1, satisfaction: 92, growth: '+7.3%' },
  { id: 'NEPH', name: 'Nephrology & Dialysis', category: 'Internal Med', volume: 1560, stayDays: 3.4, satisfaction: 93, growth: '+11.0%' },
  { id: 'GENO', name: 'Genomics Sequencing Lab', category: 'Diagnostics', volume: 2480, stayDays: 0.5, satisfaction: 97, growth: '+31.6%' },
  { id: 'RADI', name: 'Advanced MRI & PET-CT', category: 'Diagnostics', volume: 2720, stayDays: 0.6, satisfaction: 98, growth: '+24.1%' },
  { id: 'PEDS', name: 'Pediatric Care Clinic', category: 'Outpatient', volume: 2110, stayDays: 2.1, satisfaction: 96, growth: '+12.9%' },
  { id: 'TELE', name: 'Virtual Tele-Health Pod', category: 'Outpatient', volume: 3100, stayDays: 0.2, satisfaction: 95, growth: '+44.8%' }
];

const SortableBarChart = () => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [sortOrder, setSortOrder] = useState('descending'); // 'descending' | 'ascending' | 'alphabetical' | 'category'
  const [activeMetric, setActiveMetric] = useState('volume'); // 'volume' | 'stayDays' | 'satisfaction'
  const [hoveredBar, setHoveredBar] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState(Object.keys(CATEGORY_COLORS));

  // Filtered and Sorted Dataset
  const filteredData = useMemo(() => {
    return INITIAL_DATA.filter(d => selectedCategories.includes(d.category));
  }, [selectedCategories]);

  // Telemetry aggregates
  const stats = useMemo(() => {
    if (filteredData.length === 0) return { total: 0, avg: 0, top: '-', max: 0 };
    const values = filteredData.map(d => d[activeMetric]);
    const total = d3.sum(values);
    const avg = d3.mean(values);
    const sorted = [...filteredData].sort((a, b) => b[activeMetric] - a[activeMetric]);
    return {
      total: activeMetric === 'volume' ? total.toLocaleString() : total.toFixed(1),
      avg: avg ? avg.toFixed(1) : 0,
      top: sorted[0]?.name || '-',
      max: sorted[0]?.[activeMetric] || 0
    };
  }, [filteredData, activeMetric]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || filteredData.length === 0) return;

    const width = 950;
    const height = 480;
    const margin = { top: 35, right: 30, bottom: 90, left: 60 };

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('viewBox', [0, 0, width, height])
      .attr('width', '100%')
      .attr('height', 'auto')
      .style('max-height', '540px')
      .style('background', '#0b1120')
      .style('border-radius', '12px');

    // Create sort comparator
    const dataToSort = [...filteredData];
    if (sortOrder === 'descending') {
      dataToSort.sort((a, b) => b[activeMetric] - a[activeMetric]);
    } else if (sortOrder === 'ascending') {
      dataToSort.sort((a, b) => a[activeMetric] - b[activeMetric]);
    } else if (sortOrder === 'alphabetical') {
      dataToSort.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOrder === 'category') {
      dataToSort.sort((a, b) => a.category.localeCompare(b.category) || b[activeMetric] - a[activeMetric]);
    }

    // Scales
    const x = d3.scaleBand()
      .domain(dataToSort.map(d => d.name))
      .range([margin.left, width - margin.right])
      .padding(0.28);

    const maxVal = d3.max(dataToSort, d => d[activeMetric]) || 10;
    const y = d3.scaleLinear()
      .domain([0, maxVal * 1.15])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // Grid lines
    svg.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(${margin.left},0)`)
      .call(
        d3.axisLeft(y)
          .tickSize(-(width - margin.left - margin.right))
          .tickFormat('')
      )
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line')
        .attr('stroke', '#1e293b')
        .attr('stroke-dasharray', '3,3')
      );

    // X Axis with rotated labels
    const xAxis = svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickSize(0))
      .call(g => g.select('.domain').attr('stroke', '#334155').attr('stroke-width', 1.5));

    xAxis.selectAll('text')
      .attr('transform', 'rotate(-32)')
      .attr('text-anchor', 'end')
      .attr('dx', '-8px')
      .attr('dy', '10px')
      .attr('fill', '#94a3b8')
      .attr('font-size', '10.5px')
      .attr('font-family', 'Aldrich, sans-serif')
      .attr('font-weight', '500');

    // Y Axis
    const yAxis = svg.append('g')
      .attr('class', 'y-axis')
      .attr('transform', `translate(${margin.left},0)`)
      .call(
        d3.axisLeft(y)
          .ticks(6)
          .tickFormat(d => activeMetric === 'volume' ? `${d}` : activeMetric === 'stayDays' ? `${d}d` : `${d}%`)
      )
      .call(g => g.select('.domain').remove());

    yAxis.selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px')
      .attr('font-family', 'Aldrich, sans-serif');

    // Defs for gradients per category
    const defs = svg.append('defs');
    Object.entries(CATEGORY_COLORS).forEach(([cat, hex]) => {
      const grad = defs.append('linearGradient')
        .attr('id', `bar-grad-${cat.replace(/\s+/g, '')}`)
        .attr('x1', '0%').attr('y1', '0%')
        .attr('x2', '0%').attr('y2', '100%');
      grad.append('stop').attr('offset', '0%').attr('stop-color', hex).attr('stop-opacity', 1);
      grad.append('stop').attr('offset', '100%').attr('stop-color', hex).attr('stop-opacity', 0.45);
    });

    // Bars Group
    const barsGroup = svg.append('g').attr('class', 'bars');

    const bars = barsGroup.selectAll('rect.data-bar')
      .data(dataToSort, d => d.id)
      .join(
        enter => enter.append('rect')
          .attr('class', 'data-bar')
          .attr('x', d => x(d.name))
          .attr('y', height - margin.bottom)
          .attr('width', x.bandwidth())
          .attr('height', 0)
          .attr('rx', 4)
          .attr('ry', 4)
          .attr('fill', d => `url(#bar-grad-${d.category.replace(/\s+/g, '')})`)
          .attr('stroke', d => CATEGORY_COLORS[d.category] || '#38bdf8')
          .attr('stroke-width', 1.2)
          .attr('cursor', 'pointer')
          .call(enter => enter.transition().duration(650)
            .attr('y', d => y(d[activeMetric]))
            .attr('height', d => Math.max(0, height - margin.bottom - y(d[activeMetric])))
          ),
        update => update.call(update => update.transition().duration(650)
          .attr('x', d => x(d.name))
          .attr('y', d => y(d[activeMetric]))
          .attr('width', x.bandwidth())
          .attr('height', d => Math.max(0, height - margin.bottom - y(d[activeMetric])))
        ),
        exit => exit.call(exit => exit.transition().duration(400)
          .attr('y', height - margin.bottom)
          .attr('height', 0)
          .remove()
        )
      );

    // Value Labels on top of bars with Halo Stroke
    const labels = svg.append('g').attr('class', 'labels');

    labels.selectAll('text.val-label')
      .data(dataToSort, d => d.id)
      .join(
        enter => enter.append('text')
          .attr('class', 'val-label font-Aldrich')
          .attr('x', d => x(d.name) + x.bandwidth() / 2)
          .attr('y', height - margin.bottom)
          .attr('text-anchor', 'middle')
          .attr('paint-order', 'stroke fill')
          .attr('stroke', '#020617')
          .attr('stroke-width', 3.5)
          .attr('stroke-linejoin', 'round')
          .attr('fill', '#f8fafc')
          .attr('font-size', '10px')
          .attr('font-weight', 'bold')
          .text(d => activeMetric === 'volume' ? d.volume.toLocaleString() : activeMetric === 'stayDays' ? `${d.stayDays}d` : `${d.satisfaction}%`)
          .call(enter => enter.transition().duration(650)
            .attr('y', d => y(d[activeMetric]) - 7)
          ),
        update => update.call(update => update.transition().duration(650)
          .attr('x', d => x(d.name) + x.bandwidth() / 2)
          .attr('y', d => y(d[activeMetric]) - 7)
          .text(d => activeMetric === 'volume' ? d.volume.toLocaleString() : activeMetric === 'stayDays' ? `${d.stayDays}d` : `${d.satisfaction}%`)
        ),
        exit => exit.remove()
      );

    // Mouse interactions
    bars
      .on('mouseenter', (event, d) => {
        d3.select(event.currentTarget)
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 2.5)
          .attr('filter', 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.6))');
        setHoveredBar(d);
      })
      .on('mouseleave', (event, d) => {
        d3.select(event.currentTarget)
          .attr('stroke', CATEGORY_COLORS[d.category] || '#38bdf8')
          .attr('stroke-width', 1.2)
          .attr('filter', null);
        setHoveredBar(null);
      });

  }, [filteredData, sortOrder, activeMetric]);

  const toggleCategory = (cat) => {
    setSelectedCategories(prev =>
      prev.includes(cat)
        ? prev.length > 1 ? prev.filter(c => c !== cat) : prev
        : [...prev, cat]
    );
  };

  return (
    <div ref={containerRef} className="w-full flex flex-col gap-4 font-Aldrich text-slate-100 p-2 sm:p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl">
      {/* Top Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 text-lg shadow-inner">
            📊
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
              Sortable Clinical Performance Bars
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                Animated Transition
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Multi-axis dynamic sorting with smooth D3 band transitions • Filter series and switch clinical metrics
            </p>
          </div>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-lg border border-slate-700 text-xs">
          {[
            { id: 'volume', label: 'Patient Volume' },
            { id: 'stayDays', label: 'Avg Stay Days' },
            { id: 'satisfaction', label: 'Satisfaction %' }
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setActiveMetric(m.id)}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer font-medium ${
                activeMetric === m.id
                  ? 'bg-violet-600 text-white shadow font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sorting Buttons Toolbar & Category Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
        {/* Sort Buttons */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-bold uppercase text-[10px] mr-1">Sort Order:</span>
          {[
            { id: 'descending', label: 'Highest First ↓' },
            { id: 'ascending', label: 'Lowest First ↑' },
            { id: 'alphabetical', label: 'A to Z' },
            { id: 'category', label: 'By Category' }
          ].map(s => (
            <button
              key={s.id}
              onClick={() => setSortOrder(s.id)}
              className={`px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                sortOrder === s.id
                  ? 'bg-slate-700 text-cyan-300 border-cyan-500/50 font-bold shadow-sm'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Category Filter Toggles */}
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

        {/* Hover Inspector Card */}
        {hoveredBar && (
          <div className="absolute top-4 right-4 bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-md max-w-xs">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5 mb-2">
              <span className="text-xs font-bold text-white">{hoveredBar.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                {hoveredBar.category}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">Patient Volume:</span>
                <span className="font-bold text-cyan-400">{hoveredBar.volume.toLocaleString()} cases</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Avg Stay Days:</span>
                <span className="font-bold text-amber-400">{hoveredBar.stayDays} days</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Patient Satisfaction:</span>
                <span className="font-bold text-emerald-400">{hoveredBar.satisfaction}%</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">YoY Trend:</span>
                <span className="font-bold text-rose-400">{hoveredBar.growth}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Telemetry Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Aggregated Metric Sum</span>
          <span className="text-base font-bold text-cyan-400">{stats.total}</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Cohort Average</span>
          <span className="text-base font-bold text-purple-400">{stats.avg}</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Top Speciality</span>
          <span className="text-base font-bold text-emerald-400 truncate block">{stats.top}</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Active Cohort Units</span>
          <span className="text-base font-bold text-amber-400">{filteredData.length} Departments</span>
        </div>
      </div>
    </div>
  );
};

export default SortableBarChart;
