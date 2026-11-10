// NestedTreemap.jsx
'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';

const NESTED_DATA = {
  name: "National Health Consortium",
  children: [
    {
      name: "Critical Care Directorate",
      children: [
        {
          name: "Trauma Resuscitation",
          children: [
            { name: "Level 1 Shock OR", value: 160 },
            { name: "Acute Burn Station", value: 110 }
          ]
        },
        {
          name: "Intensive Care Units",
          children: [
            { name: "Coronary ICU", value: 180 },
            { name: "Neurocritical ICU", value: 130 }
          ]
        }
      ]
    },
    {
      name: "Surgical Operative",
      children: [
        {
          name: "Specialized ORs",
          children: [
            { name: "Cardiothoracic Suite", value: 210 },
            { name: "Robotic Laparoscopy", value: 170 }
          ]
        },
        {
          name: "Recovery Wards",
          children: [
            { name: "Post-Op Stepdown", value: 140 },
            { name: "Short-Stay Surgical", value: 90 }
          ]
        }
      ]
    },
    {
      name: "Advanced Diagnostics",
      children: [
        {
          name: "Genomic Sciences",
          children: [
            { name: "Sequencing Core", value: 150 },
            { name: "Bio-Informatics Lab", value: 110 }
          ]
        },
        {
          name: "Medical Imaging",
          children: [
            { name: "High-Field 7T MRI", value: 175 },
            { name: "PET-Radiotracer", value: 125 }
          ]
        }
      ]
    }
  ]
};

const DIRECTORATE_COLORS = {
  'Critical Care Directorate': '#F43F5E',
  'Surgical Operative': '#8B5CF6',
  'Advanced Diagnostics': '#06B6D4'
};

const NestedTreemap = () => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [maxDepth, setMaxDepth] = useState(3); // 1, 2, 3
  const [hoveredNode, setHoveredNode] = useState(null);

  const totalValue = useMemo(() => {
    return d3.hierarchy(NESTED_DATA).sum(d => d.value).value;
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

    const root = d3.hierarchy(NESTED_DATA)
      .sum(d => d.value)
      .sort((a, b) => b.value - a.value);

    d3.treemap()
      .size([width, height])
      .paddingTop(22)
      .paddingInner(6)
      .paddingOuter(4)
      .round(true)(root);

    // Color helper
    function getNodeColor(d) {
      let top = d;
      while (top.depth > 1) top = top.parent;
      const base = DIRECTORATE_COLORS[top.data.name] || '#06B6D4';
      if (d.depth === 1) return '#0f172a';
      if (d.depth === 2) return '#1e293b';
      const alpha = Math.max(0.4, 1 - (d.depth - 2) * 0.25);
      return d3.color(base).copy({ opacity: alpha }).formatRgb();
    }

    // Nodes group
    const nodes = svg.selectAll('g.node')
      .data(root.descendants().filter(d => d.depth > 0 && d.depth <= maxDepth))
      .join('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x0},${d.y0})`);

    nodes.append('rect')
      .attr('width', d => Math.max(0, d.x1 - d.x0))
      .attr('height', d => Math.max(0, d.y1 - d.y0))
      .attr('fill', d => getNodeColor(d))
      .attr('stroke', d => d.children ? '#334155' : '#020617')
      .attr('stroke-width', d => d.children ? 1.5 : 1)
      .attr('rx', 4)
      .attr('cursor', 'pointer')
      .on('mouseenter', (event, d) => setHoveredNode(d))
      .on('mouseleave', () => setHoveredNode(null));

    // Headers for containers
    nodes.filter(d => d.children)
      .append('text')
      .attr('x', 8)
      .attr('y', 15)
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'Aldrich, sans-serif')
      .text(d => d.data.name.toUpperCase());

    // Labels for leaves
    nodes.filter(d => !d.children)
      .append('text')
      .attr('x', 6)
      .attr('y', 15)
      .attr('paint-order', 'stroke fill')
      .attr('stroke', '#020617')
      .attr('stroke-width', 3)
      .attr('fill', '#ffffff')
      .attr('font-size', '9.5px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'Aldrich, sans-serif')
      .style('display', d => (d.x1 - d.x0 > 55 && d.y1 - d.y0 > 25) ? 'block' : 'none')
      .text(d => d.data.name);

    nodes.filter(d => !d.children)
      .append('text')
      .attr('x', 6)
      .attr('y', 28)
      .attr('paint-order', 'stroke fill')
      .attr('stroke', '#020617')
      .attr('stroke-width', 2.5)
      .attr('fill', '#e2e8f0')
      .attr('font-size', '8.5px')
      .attr('font-family', 'Aldrich, sans-serif')
      .style('display', d => (d.x1 - d.x0 > 55 && d.y1 - d.y0 > 38) ? 'block' : 'none')
      .text(d => `$${d.data.value}M`);

  }, [totalValue, maxDepth]);

  return (
    <div ref={containerRef} className="w-full flex flex-col gap-4 font-Aldrich text-slate-100 p-2 sm:p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 text-lg shadow-inner">
            📦
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
              Nested Hierarchical Treemap
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Multi-Tier Containers
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Structured multi-tier container bounding boxes with explicit parent headers and depth controls
            </p>
          </div>
        </div>

        {/* Depth Selector */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-lg border border-slate-700 text-xs">
          <span className="text-slate-400 text-[10px] uppercase font-bold mr-1">Depth:</span>
          {[1, 2, 3].map(d => (
            <button
              key={d}
              onClick={() => setMaxDepth(d)}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer font-bold ${
                maxDepth === d ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tier {d}
            </button>
          ))}
        </div>
      </div>

      {/* Main SVG Visualization */}
      <div className="relative w-full rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950/80 p-2 shadow-inner">
        <svg ref={svgRef} className="w-full h-auto select-none" />

        {hoveredNode && (
          <div className="absolute top-4 right-4 bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-md pointer-events-none">
            <span className="text-xs font-bold text-white block">{hoveredNode.data.name}</span>
            <span className="text-[10px] text-slate-400 block">Tier {hoveredNode.depth} • {hoveredNode.parent?.data.name}</span>
            <span className="text-base font-bold text-cyan-400 mt-1 block">
              ${hoveredNode.value} Million
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold">
              {((hoveredNode.value / totalValue) * 100).toFixed(1)}% of System Allocation
            </span>
          </div>
        )}
      </div>

      {/* Summary Telemetry */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Aggregated Allocation</span>
          <span className="text-base font-bold text-emerald-400">${totalValue.toLocaleString()}M</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Active Visible Depth</span>
          <span className="text-base font-bold text-purple-400">Level {maxDepth}</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Directorates</span>
          <span className="text-base font-bold text-cyan-400">3 Divisions</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Leaf Units</span>
          <span className="text-base font-bold text-amber-400">8 Operating Stations</span>
        </div>
      </div>
    </div>
  );
};

export default NestedTreemap;
