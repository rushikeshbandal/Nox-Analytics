// Treemap.jsx
'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';

const TREE_DATA = {
  name: "Apex Healthcare",
  children: [
    {
      name: "Surgical Services",
      children: [
        { name: "Cardiac Surgery", value: 420 },
        { name: "Neurosurgery", value: 360 },
        { name: "Orthopedic Pavilion", value: 310 },
        { name: "Robotic Laparoscopy", value: 240 }
      ]
    },
    {
      name: "Critical Care",
      children: [
        { name: "ICU Resuscitation", value: 380 },
        { name: "Pediatric ICU", value: 220 },
        { name: "Burn Trauma Unit", value: 180 }
      ]
    },
    {
      name: "Diagnostics & Imaging",
      children: [
        { name: "MRI & PET-CT Core", value: 340 },
        { name: "Genomics Sequencing", value: 290 },
        { name: "Pathology Biopsy AI", value: 210 }
      ]
    },
    {
      name: "Specialty Outpatient",
      children: [
        { name: "Oncology Infusion", value: 350 },
        { name: "Vascular Health", value: 200 },
        { name: "Dialysis Suites", value: 170 }
      ]
    },
    {
      name: "Pharmacy & Supply",
      children: [
        { name: "Automated Dispensary", value: 260 },
        { name: "Cold-Chain Biologics", value: 190 }
      ]
    }
  ]
};

const DIVISION_COLORS = {
  'Surgical Services': '#8B5CF6',
  'Critical Care': '#F43F5E',
  'Diagnostics & Imaging': '#06B6D4',
  'Specialty Outpatient': '#10B981',
  'Pharmacy & Supply': '#F59E0B'
};

const Treemap = () => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [tileMethod, setTileMethod] = useState('treemapSquarify');
  const [hoveredNode, setHoveredNode] = useState(null);

  const totalValue = useMemo(() => {
    return d3.hierarchy(TREE_DATA).sum(d => d.value).value;
  }, []);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = 950;
    const height = 480;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('viewBox', [0, 0, width, height])
      .attr('width', '100%')
      .attr('height', 'auto')
      .style('max-height', '520px')
      .style('background', '#0b1120')
      .style('border-radius', '12px');

    const root = d3.hierarchy(TREE_DATA)
      .sum(d => d.value)
      .sort((a, b) => b.value - a.value);

    const tileFn = tileMethod === 'treemapBinary'
      ? d3.treemapBinary
      : tileMethod === 'treemapSliceDice'
      ? d3.treemapSliceDice
      : d3.treemapSquarify;

    d3.treemap()
      .tile(tileFn)
      .size([width, height])
      .paddingInner(3)
      .paddingTop(18)
      .paddingRight(2)
      .paddingBottom(2)
      .paddingLeft(2)
      .round(true)(root);

    // Division header backgrounds
    const parents = svg.selectAll('g.parent')
      .data(root.children)
      .join('g')
      .attr('class', 'parent');

    parents.append('text')
      .attr('x', d => d.x0 + 6)
      .attr('y', d => d.y0 + 13)
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'Aldrich, sans-serif')
      .text(d => d.data.name.toUpperCase());

    // Leaves
    const leaf = svg.selectAll('g.leaf')
      .data(root.leaves())
      .join('g')
      .attr('class', 'leaf')
      .attr('transform', d => `translate(${d.x0},${d.y0})`);

    leaf.append('rect')
      .attr('width', d => Math.max(0, d.x1 - d.x0))
      .attr('height', d => Math.max(0, d.y1 - d.y0))
      .attr('fill', d => DIVISION_COLORS[d.parent.data.name] || '#38bdf8')
      .attr('fill-opacity', 0.85)
      .attr('stroke', '#020617')
      .attr('stroke-width', 1.5)
      .attr('rx', 3)
      .attr('cursor', 'pointer')
      .on('mouseenter', (event, d) => setHoveredNode(d))
      .on('mouseleave', () => setHoveredNode(null));

    // Cell title with halo stroke
    leaf.append('text')
      .attr('x', 6)
      .attr('y', 16)
      .attr('paint-order', 'stroke fill')
      .attr('stroke', '#020617')
      .attr('stroke-width', 3)
      .attr('stroke-linejoin', 'round')
      .attr('fill', '#ffffff')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'Aldrich, sans-serif')
      .style('display', d => (d.x1 - d.x0 > 55 && d.y1 - d.y0 > 25) ? 'block' : 'none')
      .text(d => d.data.name);

    // Cell value
    leaf.append('text')
      .attr('x', 6)
      .attr('y', 30)
      .attr('paint-order', 'stroke fill')
      .attr('stroke', '#020617')
      .attr('stroke-width', 2.5)
      .attr('fill', '#e2e8f0')
      .attr('font-size', '9px')
      .attr('font-family', 'Aldrich, sans-serif')
      .style('display', d => (d.x1 - d.x0 > 55 && d.y1 - d.y0 > 40) ? 'block' : 'none')
      .text(d => `$${d.data.value}M`);

  }, [totalValue, tileMethod]);

  return (
    <div ref={containerRef} className="w-full flex flex-col gap-4 font-Aldrich text-slate-100 p-2 sm:p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 text-lg shadow-inner">
            🔲
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
              Clinical Capital Treemap
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Tiled Layout
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Squarified rectangular area partitioning of clinical budget allocations across healthcare divisions
            </p>
          </div>
        </div>

        {/* Tiling Algorithm Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-lg border border-slate-700 text-xs">
          {[
            { id: 'treemapSquarify', label: 'Squarify' },
            { id: 'treemapBinary', label: 'Binary' },
            { id: 'treemapSliceDice', label: 'SliceDice' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTileMethod(t.id)}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer font-bold ${
                tileMethod === t.id ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Division Legend */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900/60 px-4 py-2 rounded-xl border border-slate-800 text-xs">
        <span className="text-slate-500 uppercase font-bold text-[10px]">Divisions:</span>
        {Object.entries(DIVISION_COLORS).map(([div, color]) => (
          <div key={div} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
            <span className="text-slate-300 text-[11px]">{div}</span>
          </div>
        ))}
      </div>

      {/* Main SVG Visualization */}
      <div className="relative w-full rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950/80 p-2 shadow-inner">
        <svg ref={svgRef} className="w-full h-auto select-none" />

        {hoveredNode && (
          <div className="absolute top-4 right-4 bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-md pointer-events-none">
            <span className="text-xs font-bold text-white block">{hoveredNode.data.name}</span>
            <span className="text-[10px] text-slate-400 block">{hoveredNode.parent?.data.name}</span>
            <span className="text-base font-bold text-purple-400 mt-1 block">
              ${hoveredNode.data.value} Million
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold">
              {((hoveredNode.data.value / totalValue) * 100).toFixed(1)}% of Network Capital
            </span>
          </div>
        )}
      </div>

      {/* Summary Telemetry */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Total Capital Allocation</span>
          <span className="text-base font-bold text-emerald-400">${totalValue.toLocaleString()}M</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Tiling Method</span>
          <span className="text-base font-bold text-cyan-400">{tileMethod.replace('treemap', '')}</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Divisions</span>
          <span className="text-base font-bold text-purple-400">5 Directorates</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Specialty Units</span>
          <span className="text-base font-bold text-amber-400">14 Operating Units</span>
        </div>
      </div>
    </div>
  );
};

export default Treemap;
