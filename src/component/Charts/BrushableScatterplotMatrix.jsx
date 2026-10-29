// BrushableScatterplotMatrix.jsx
'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';

// Category color palettes
const CATEGORY_COLORS = {
  'Cardiology': '#F43F5E',   // Rose
  'Oncology': '#8B5CF6',     // Violet
  'Neurology': '#06B6D4',    // Cyan
  'Orthopedics': '#10B981'   // Emerald
};

const DIMENSIONS = [
  { key: 'age', label: 'Age (Years)', format: d => `${d}y` },
  { key: 'cost', label: 'Cost ($USD)', format: d => `$${d / 1000}k` },
  { key: 'stay', label: 'Stay (Days)', format: d => `${d}d` },
  { key: 'outcome', label: 'Recovery Score', format: d => `${d}%` }
];

// Procedural multi-variable clinical cohort dataset (160 patient records)
function generateSPLOMData() {
  const categories = Object.keys(CATEGORY_COLORS);
  const data = [];

  for (let i = 0; i < 160; i++) {
    const cat = categories[Math.floor(Math.random() * categories.length)];
    let age = 30 + Math.random() * 50;
    let cost = 5000 + Math.random() * 25000;
    let stay = 2 + Math.random() * 12;
    let outcome = 60 + Math.random() * 38;

    if (cat === 'Cardiology') {
      age += 12;
      cost += 8000;
    } else if (cat === 'Oncology') {
      cost += 14000;
      stay += 4;
    } else if (cat === 'Orthopedics') {
      stay -= 2;
      outcome += 5;
    }

    data.push({
      id: `SPLOM-${i + 1}`,
      category: cat,
      age: Math.round(age),
      cost: Math.round(cost),
      stay: Math.round(stay),
      outcome: Math.round(outcome)
    });
  }

  return data;
}

const BrushableScatterplotMatrix = () => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const rawData = useMemo(() => generateSPLOMData(), []);

  const [selectedCategories, setSelectedCategories] = useState(Object.keys(CATEGORY_COLORS));
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [brushedCohort, setBrushedCohort] = useState([]);
  const clearAllBrushesRef = useRef(null);

  // Filtered dataset
  const visibleData = useMemo(() => {
    return rawData.filter(d => selectedCategories.includes(d.category));
  }, [rawData, selectedCategories]);

  // Statistics
  const stats = useMemo(() => {
    const active = brushedCohort.length > 0 ? brushedCohort : visibleData;
    return {
      count: active.length,
      pct: visibleData.length > 0 ? ((active.length / visibleData.length) * 100).toFixed(1) : 0,
      isBrushed: brushedCohort.length > 0,
      meanAge: (d3.mean(active, d => d.age) || 0).toFixed(1),
      meanCost: Math.round(d3.mean(active, d => d.cost) || 0).toLocaleString(),
      meanOutcome: (d3.mean(active, d => d.outcome) || 0).toFixed(1)
    };
  }, [brushedCohort, visibleData]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || visibleData.length === 0) return;

    const size = 180; // size of each cell
    const padding = 28;
    const n = DIMENSIONS.length;
    const width = n * size + padding * 2;
    const height = width;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('viewBox', [-padding, -padding, width, height])
      .attr('width', '100%')
      .attr('height', 'auto')
      .style('max-height', '680px')
      .style('background', '#0b1120')
      .style('border-radius', '12px');

    // Position scales for the matrix columns & rows
    const columns = DIMENSIONS.map(d => d.key);

    const xScales = {};
    const yScales = {};

    DIMENSIONS.forEach(dim => {
      const ext = d3.extent(visibleData, d => d[dim.key]);
      xScales[dim.key] = d3.scaleLinear()
        .domain([ext[0] * 0.9, ext[1] * 1.08])
        .range([padding / 2, size - padding / 2]);

      yScales[dim.key] = d3.scaleLinear()
        .domain([ext[0] * 0.9, ext[1] * 1.08])
        .range([size - padding / 2, padding / 2]);
    });

    // Create matrix cells
    const cell = svg.append('g')
      .selectAll('g.matrix-cell')
      .data(d3.cross(d3.range(n), d3.range(n)))
      .join('g')
      .attr('class', 'matrix-cell')
      .attr('transform', ([i, j]) => `translate(${i * size},${j * size})`);

    // Cell frame
    cell.append('rect')
      .attr('fill', '#0f172a')
      .attr('fill-opacity', 0.8)
      .attr('stroke', '#1e293b')
      .attr('stroke-width', 1)
      .attr('x', padding / 2)
      .attr('y', padding / 2)
      .attr('width', size - padding)
      .attr('height', size - padding)
      .attr('rx', 4);

    // Diagonal dimension headers & histograms
    cell.filter(([i, j]) => i === j)
      .each(function([i]) {
        const dim = DIMENSIONS[i];
        const gDiag = d3.select(this);

        gDiag.select('rect')
          .attr('fill', '#1e293b')
          .attr('fill-opacity', 0.6)
          .attr('stroke', '#334155');

        gDiag.append('text')
          .attr('x', size / 2)
          .attr('y', size / 2 - 8)
          .attr('text-anchor', 'middle')
          .attr('fill', '#38bdf8')
          .attr('font-size', '12px')
          .attr('font-weight', 'bold')
          .attr('font-family', 'Aldrich, sans-serif')
          .text(dim.label);

        const ext = d3.extent(visibleData, d => d[dim.key]);
        gDiag.append('text')
          .attr('x', size / 2)
          .attr('y', size / 2 + 12)
          .attr('text-anchor', 'middle')
          .attr('fill', '#94a3b8')
          .attr('font-size', '10px')
          .attr('font-family', 'Aldrich, sans-serif')
          .text(`[${dim.format(ext[0])} - ${dim.format(ext[1])}]`);
      });

    // Off-diagonal scatter points
    const offDiagonal = cell.filter(([i, j]) => i !== j);

    offDiagonal.each(function([i, j]) {
      const xKey = columns[i];
      const yKey = columns[j];
      const x = xScales[xKey];
      const y = yScales[yKey];

      const gCell = d3.select(this);

      gCell.selectAll('circle')
        .data(visibleData)
        .join('circle')
        .attr('class', d => `pt-${d.id}`)
        .attr('cx', d => x(d[xKey]))
        .attr('cy', d => y(d[yKey]))
        .attr('r', 3)
        .attr('fill', d => CATEGORY_COLORS[d.category] || '#38bdf8')
        .attr('stroke', '#020617')
        .attr('stroke-width', 0.8)
        .attr('fill-opacity', 0.8)
        .on('mouseenter', (event, d) => setHoveredPoint(d))
        .on('mouseleave', () => setHoveredPoint(null));
    });

    // Linked 2D Brush on off-diagonal cells
    let activeBrushCell = null;

    const brush = d3.brush()
      .extent([[padding / 2, padding / 2], [size - padding / 2, size - padding / 2]])
      .on('start', function() {
        if (activeBrushCell && activeBrushCell !== this) {
          d3.select(activeBrushCell).call(brush.move, null);
        }
        activeBrushCell = this;
      })
      .on('brush end', function(event, [i, j]) {
        const selection = event.selection;
        const allDots = svg.selectAll('circle');

        if (!selection) {
          allDots
            .attr('fill-opacity', 0.8)
            .attr('r', 3)
            .attr('stroke', '#020617')
            .attr('stroke-width', 0.8);
          setBrushedCohort([]);
          return;
        }

        const [[x0, y0], [x1, y1]] = selection;
        const xKey = columns[i];
        const yKey = columns[j];
        const x = xScales[xKey];
        const y = yScales[yKey];

        const selectedIds = new Set();
        const selectedList = [];

        visibleData.forEach(d => {
          const cx = x(d[xKey]);
          const cy = y(d[yKey]);
          if (cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1) {
            selectedIds.add(d.id);
            selectedList.push(d);
          }
        });

        // Update all points across all cells
        allDots.each(function(d) {
          if (selectedIds.has(d.id)) {
            d3.select(this)
              .attr('fill-opacity', 1)
              .attr('r', 4.5)
              .attr('stroke', '#ffffff')
              .attr('stroke-width', 1.5);
          } else {
            d3.select(this)
              .attr('fill-opacity', 0.12)
              .attr('r', 2.5)
              .attr('stroke', '#020617')
              .attr('stroke-width', 0.5);
          }
        });

        setBrushedCohort(selectedList);
      });

    offDiagonal.call(brush);

    // Style brush selections
    svg.selectAll('.selection')
      .attr('fill', '#38bdf8')
      .attr('fill-opacity', 0.2)
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3,3');

    clearAllBrushesRef.current = () => {
      if (activeBrushCell) {
        d3.select(activeBrushCell).call(brush.move, null);
      }
      svg.selectAll('circle')
        .attr('fill-opacity', 0.8)
        .attr('r', 3)
        .attr('stroke', '#020617')
        .attr('stroke-width', 0.8);
      setBrushedCohort([]);
    };

  }, [visibleData]);

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
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 text-lg shadow-inner">
            🔲
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
              Brushable Scatter Plot Matrix (SPLOM)
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                Linked Cross-Brushing
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              4x4 pairwise clinical correlations • Drag a brush in ANY cell to highlight that cohort across all 16 cells simultaneously
            </p>
          </div>
        </div>

        {/* Clear Brush Control */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => clearAllBrushesRef.current && clearAllBrushesRef.current()}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer font-medium"
          >
            Reset Matrix Brush ✕
          </button>
        </div>
      </div>

      {/* Category Legends */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
        <span className="text-slate-500 font-bold uppercase text-[10px] mr-1">Specialties:</span>
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
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col }} />
              <span>{cat}</span>
            </button>
          );
        })}

        {hoveredPoint && (
          <div className="ml-auto flex items-center gap-2 bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-700 text-[11px]">
            <span className="text-white font-bold">{hoveredPoint.id} ({hoveredPoint.category})</span>
            <span className="text-cyan-400">Age: {hoveredPoint.age}</span>
            <span className="text-emerald-400">Cost: ${hoveredPoint.cost.toLocaleString()}</span>
            <span className="text-amber-400">Recovery: {hoveredPoint.outcome}%</span>
          </div>
        )}
      </div>

      {/* Main SPLOM SVG Visualization */}
      <div className="relative w-full flex items-center justify-center rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950/80 p-3 shadow-inner">
        <svg ref={svgRef} className="w-full max-w-[680px] h-auto select-none" />
      </div>

      {/* Linked Cohort Telemetry */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">
            {stats.isBrushed ? 'Brushed Cohort' : 'Total Patients'}
          </span>
          <span className="text-base font-bold text-cyan-400">{stats.count} ({stats.pct}%)</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Cohort Mean Age</span>
          <span className="text-base font-bold text-purple-400">{stats.meanAge} Years</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Cohort Mean Cost</span>
          <span className="text-base font-bold text-emerald-400">${stats.meanCost}</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Mean Recovery</span>
          <span className="text-base font-bold text-amber-400">{stats.meanOutcome}%</span>
        </div>
      </div>
    </div>
  );
};

export default BrushableScatterplotMatrix;
