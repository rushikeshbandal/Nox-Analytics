// CascadedTreemap.jsx
'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';

const HIERARCHY_DATA = {
  name: "Health System",
  children: [
    {
      name: "Acute Care Wards",
      children: [
        { name: "Emergency Trauma", value: 340 },
        { name: "Intensive Care Pod", value: 280 },
        { name: "Cardiac Recovery", value: 220 }
      ]
    },
    {
      name: "Surgical Suites",
      children: [
        { name: "Robotic OR 1", value: 310 },
        { name: "Neurosurgery OR", value: 260 },
        { name: "Orthopedic Suite", value: 200 }
      ]
    },
    {
      name: "Diagnostic Services",
      children: [
        { name: "PET-CT Nuclear", value: 250 },
        { name: "Genomics Core", value: 210 },
        { name: "Rapid Pathology", value: 160 }
      ]
    },
    {
      name: "Outpatient Network",
      children: [
        { name: "Chemo Infusion", value: 230 },
        { name: "Dialysis Pavilion", value: 170 },
        { name: "Rehab Center", value: 140 }
      ]
    }
  ]
};

const DIVISION_COLORS = {
  'Acute Care Wards': '#F43F5E',
  'Surgical Suites': '#8B5CF6',
  'Diagnostic Services': '#06B6D4',
  'Outpatient Network': '#10B981'
};

const CascadedTreemap = () => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [cascadeOffset, setCascadeOffset] = useState(6);
  const [hoveredNode, setHoveredNode] = useState(null);

  const totalBudget = useMemo(() => {
    return d3.hierarchy(HIERARCHY_DATA).sum(d => d.value).value;
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

    const defs = svg.append('defs');

    // Drop shadow filter for cascading cards
    const filter = defs.append('filter')
      .attr('id', 'cascade-shadow')
      .attr('x', '-20%').attr('y', '-20%')
      .attr('width', '150%').attr('height', '150%');
    filter.append('feDropShadow')
      .attr('dx', cascadeOffset * 0.7)
      .attr('dy', cascadeOffset)
      .attr('stdDeviation', '4')
      .attr('flood-color', '#020617')
      .attr('flood-opacity', '0.75');

    const root = d3.hierarchy(HIERARCHY_DATA)
      .sum(d => d.value)
      .sort((a, b) => b.value - a.value);

    d3.treemap()
      .size([width - cascadeOffset * 2, height - cascadeOffset * 2])
      .paddingInner(14)
      .paddingTop(22)
      .paddingRight(6)
      .paddingBottom(6)
      .paddingLeft(6)
      .round(true)(root);

    // Parent group cards
    const parents = svg.selectAll('g.parent')
      .data(root.children)
      .join('g')
      .attr('class', 'parent')
      .attr('transform', d => `translate(${d.x0},${d.y0})`);

    parents.append('rect')
      .attr('width', d => Math.max(0, d.x1 - d.x0 + cascadeOffset))
      .attr('height', d => Math.max(0, d.y1 - d.y0 + cascadeOffset))
      .attr('fill', '#0f172a')
      .attr('stroke', '#334155')
      .attr('stroke-width', 1.5)
      .attr('rx', 6)
      .attr('filter', 'url(#cascade-shadow)');

    parents.append('text')
      .attr('x', 10)
      .attr('y', 15)
      .attr('fill', '#94a3b8')
      .attr('font-size', '10.5px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'Aldrich, sans-serif')
      .text(d => d.data.name.toUpperCase());

    // Cascaded Leaf Tiles
    const leaves = svg.selectAll('g.leaf')
      .data(root.leaves())
      .join('g')
      .attr('class', 'leaf')
      .attr('transform', d => `translate(${d.x0 + cascadeOffset},${d.y0 + cascadeOffset})`);

    leaves.append('rect')
      .attr('width', d => Math.max(0, d.x1 - d.x0 - cascadeOffset))
      .attr('height', d => Math.max(0, d.y1 - d.y0 - cascadeOffset))
      .attr('fill', d => DIVISION_COLORS[d.parent.data.name] || '#06B6D4')
      .attr('fill-opacity', 0.88)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1)
      .attr('rx', 4)
      .attr('filter', 'url(#cascade-shadow)')
      .attr('cursor', 'pointer')
      .on('mouseenter', (event, d) => setHoveredNode(d))
      .on('mouseleave', () => setHoveredNode(null));

    // Cell title with halo stroke
    leaves.append('text')
      .attr('x', 8)
      .attr('y', 16)
      .attr('paint-order', 'stroke fill')
      .attr('stroke', '#020617')
      .attr('stroke-width', 3)
      .attr('stroke-linejoin', 'round')
      .attr('fill', '#ffffff')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'Aldrich, sans-serif')
      .style('display', d => (d.x1 - d.x0 > 60 && d.y1 - d.y0 > 30) ? 'block' : 'none')
      .text(d => d.data.name);

    // Cell value
    leaves.append('text')
      .attr('x', 8)
      .attr('y', 30)
      .attr('paint-order', 'stroke fill')
      .attr('stroke', '#020617')
      .attr('stroke-width', 2.5)
      .attr('fill', '#e2e8f0')
      .attr('font-size', '9px')
      .attr('font-family', 'Aldrich, sans-serif')
      .style('display', d => (d.x1 - d.x0 > 60 && d.y1 - d.y0 > 45) ? 'block' : 'none')
      .text(d => `$${d.data.value}M`);

  }, [totalBudget, cascadeOffset]);

  return (
    <div ref={containerRef} className="w-full flex flex-col gap-4 font-Aldrich text-slate-100 p-2 sm:p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 text-lg shadow-inner">
            🗂️
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
              Cascaded 2.5D Treemap
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Layered Elevation
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Layered multi-depth treemap with drop shadows and physical cascade offsets for enhanced hierarchical perception
            </p>
          </div>
        </div>

        {/* Cascade Offset Slider */}
        <div className="flex items-center gap-2 text-xs bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
          <span className="text-slate-400">Cascade Offset: <strong className="text-rose-300">{cascadeOffset}px</strong></span>
          <input
            type="range"
            min={2}
            max={14}
            value={cascadeOffset}
            onChange={(e) => setCascadeOffset(+e.target.value)}
            className="w-24 h-1.5 accent-rose-400 cursor-pointer"
          />
        </div>
      </div>

      {/* Main SVG Visualization */}
      <div className="relative w-full rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950/80 p-2 shadow-inner">
        <svg ref={svgRef} className="w-full h-auto select-none" />

        {hoveredNode && (
          <div className="absolute top-4 right-4 bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-md pointer-events-none">
            <span className="text-xs font-bold text-white block">{hoveredNode.data.name}</span>
            <span className="text-[10px] text-slate-400 block">{hoveredNode.parent?.data.name}</span>
            <span className="text-base font-bold text-rose-400 mt-1 block">
              ${hoveredNode.data.value} Million
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold">
              {((hoveredNode.data.value / totalBudget) * 100).toFixed(1)}% of Healthcare System
            </span>
          </div>
        )}
      </div>

      {/* Summary Telemetry */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Aggregated Allocation</span>
          <span className="text-base font-bold text-white">${totalBudget.toLocaleString()}M</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Cascade Depth Offset</span>
          <span className="text-base font-bold text-rose-400">{cascadeOffset}px 2.5D</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Divisions</span>
          <span className="text-base font-bold text-purple-400">4 Core Directorates</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Visual Clarity</span>
          <span className="text-base font-bold text-emerald-400">Multi-Plane Shading</span>
        </div>
      </div>
    </div>
  );
};

export default CascadedTreemap;
