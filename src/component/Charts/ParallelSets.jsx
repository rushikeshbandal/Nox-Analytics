// ParallelSets.jsx
'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';

// Patient cohort flow through 4 clinical dimensions
const FLOW_DATA = [
  { triage: 'Emergency', specialty: 'Cardiology', pathway: 'Surgical', outcome: 'Discharged Home', count: 480 },
  { triage: 'Emergency', specialty: 'Cardiology', pathway: 'Medical', outcome: 'Transferred', count: 180 },
  { triage: 'Emergency', specialty: 'Trauma', pathway: 'Surgical', outcome: 'Discharged Home', count: 520 },
  { triage: 'Emergency', specialty: 'Trauma', pathway: 'ICU Stepdown', outcome: 'Long-term Care', count: 210 },
  { triage: 'Urgent', specialty: 'Neurology', pathway: 'Diagnostics', outcome: 'Discharged Home', count: 390 },
  { triage: 'Urgent', specialty: 'Neurology', pathway: 'Surgical', outcome: 'Rehab Facility', count: 260 },
  { triage: 'Urgent', specialty: 'Oncology', pathway: 'Medical', outcome: 'Discharged Home', count: 440 },
  { triage: 'Elective', specialty: 'Orthopedics', pathway: 'Surgical', outcome: 'Discharged Home', count: 610 },
  { triage: 'Elective', specialty: 'Orthopedics', pathway: 'Rehab Therapy', outcome: 'Discharged Home', count: 340 },
  { triage: 'Elective', specialty: 'Oncology', pathway: 'Chemo Infusion', outcome: 'Discharged Home', count: 410 }
];

const DIMENSIONS = [
  { key: 'triage', label: 'Triage Category' },
  { key: 'specialty', label: 'Specialty Department' },
  { key: 'pathway', label: 'Treatment Pathway' },
  { key: 'outcome', label: 'Discharge Outcome' }
];

const CATEGORY_COLORS = {
  'Emergency': '#F43F5E',
  'Urgent': '#F59E0B',
  'Elective': '#10B981'
};

const ParallelSets = () => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [hoveredFlow, setHoveredFlow] = useState(null);

  const totalPatients = useMemo(() => d3.sum(FLOW_DATA, d => d.count), []);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = 950;
    const height = 480;
    const margin = { top: 40, right: 60, bottom: 40, left: 60 };

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('viewBox', [0, 0, width, height])
      .attr('width', '100%')
      .attr('height', 'auto')
      .style('max-height', '520px')
      .style('background', '#0b1120')
      .style('border-radius', '12px');

    const chartW = width - margin.left - margin.right;
    const chartH = height - margin.top - margin.bottom;

    const x = d3.scalePoint()
      .domain(DIMENSIONS.map(d => d.key))
      .range([margin.left, width - margin.right]);

    // Compute category blocks and y-scales for each dimension
    const dimNodes = {};
    DIMENSIONS.forEach(dim => {
      const grouped = d3.rollup(FLOW_DATA, v => d3.sum(v, d => d.count), d => d[dim.key]);
      const cats = Array.from(grouped, ([name, value]) => ({ name, value }));
      const spacing = 12;
      const totalH = chartH - (cats.length - 1) * spacing;

      let currentY = margin.top;
      dimNodes[dim.key] = cats.map(c => {
        const h = (c.value / totalPatients) * totalH;
        const node = { ...c, y0: currentY, y1: currentY + h, height: h };
        currentY += h + spacing;
        return node;
      });
    });

    // Ribbons between consecutive dimensions
    const ribbonsGroup = svg.append('g').attr('class', 'ribbons');

    for (let i = 0; i < DIMENSIONS.length - 1; i++) {
      const dimA = DIMENSIONS[i].key;
      const dimB = DIMENSIONS[i + 1].key;
      const xA = x(dimA);
      const xB = x(dimB);

      // Group flows between dimA and dimB
      const flows = d3.rollups(
        FLOW_DATA,
        v => ({
          count: d3.sum(v, d => d.count),
          triage: v[0].triage,
          items: v
        }),
        d => d[dimA],
        d => d[dimB]
      );

      // Track offsets within each category block
      const offsetsA = {};
      const offsetsB = {};
      dimNodes[dimA].forEach(n => { offsetsA[n.name] = n.y0; });
      dimNodes[dimB].forEach(n => { offsetsB[n.name] = n.y0; });

      flows.forEach(([nameA, bMap]) => {
        const nodeA = dimNodes[dimA].find(n => n.name === nameA);
        bMap.forEach(([nameB, flowObj]) => {
          const nodeB = dimNodes[dimB].find(n => n.name === nameB);
          const totalSpacingA = chartH - (dimNodes[dimA].length - 1) * 12;
          const totalSpacingB = chartH - (dimNodes[dimB].length - 1) * 12;

          const hA = (flowObj.count / totalPatients) * totalSpacingA;
          const hB = (flowObj.count / totalPatients) * totalSpacingB;

          const y0A = offsetsA[nameA];
          const y1A = y0A + hA;
          offsetsA[nameA] += hA;

          const y0B = offsetsB[nameB];
          const y1B = y0B + hB;
          offsetsB[nameB] += hB;

          // Cubic Bézier ribbon path
          const path = d3.path();
          path.moveTo(xA, y0A);
          path.bezierCurveTo((xA + xB) / 2, y0A, (xA + xB) / 2, y0B, xB, y0B);
          path.lineTo(xB, y1B);
          path.bezierCurveTo((xA + xB) / 2, y1B, (xA + xB) / 2, y1A, xA, y1A);
          path.closePath();

          ribbonsGroup.append('path')
            .attr('d', path.toString())
            .attr('fill', CATEGORY_COLORS[flowObj.triage] || '#8B5CF6')
            .attr('fill-opacity', 0.45)
            .attr('stroke', '#020617')
            .attr('stroke-width', 0.8)
            .attr('cursor', 'pointer')
            .on('mouseenter', function() {
              d3.select(this).attr('fill-opacity', 0.85).attr('stroke', '#ffffff').attr('stroke-width', 1.5);
              setHoveredFlow({
                from: `${nameA} (${dimA})`,
                to: `${nameB} (${dimB})`,
                count: flowObj.count,
                pct: ((flowObj.count / totalPatients) * 100).toFixed(1)
              });
            })
            .on('mouseleave', function() {
              d3.select(this).attr('fill-opacity', 0.45).attr('stroke', '#020617').attr('stroke-width', 0.8);
              setHoveredFlow(null);
            });
        });
      });
    }

    // Category Vertical Blocks & Dimension Headers
    const axesGroup = svg.append('g').attr('class', 'parallel-axes');

    DIMENSIONS.forEach(dim => {
      const posX = x(dim.key);

      // Dimension Header
      axesGroup.append('text')
        .attr('x', posX)
        .attr('y', margin.top - 16)
        .attr('text-anchor', 'middle')
        .attr('fill', '#38bdf8')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'Aldrich, sans-serif')
        .text(dim.label);

      // Category Blocks
      dimNodes[dim.key].forEach(node => {
        axesGroup.append('rect')
          .attr('x', posX - 7)
          .attr('y', node.y0)
          .attr('width', 14)
          .attr('height', node.height)
          .attr('fill', '#1e293b')
          .attr('stroke', '#64748b')
          .attr('stroke-width', 1.5)
          .attr('rx', 2);

        // Category Text Label with halo stroke
        axesGroup.append('text')
          .attr('x', posX + (dim.key === 'outcome' ? -12 : 12))
          .attr('y', node.y0 + node.height / 2)
          .attr('dy', '0.35em')
          .attr('text-anchor', dim.key === 'outcome' ? 'end' : 'start')
          .attr('paint-order', 'stroke fill')
          .attr('stroke', '#020617')
          .attr('stroke-width', 3)
          .attr('stroke-linejoin', 'round')
          .attr('fill', '#ffffff')
          .attr('font-size', '10px')
          .attr('font-family', 'Aldrich, sans-serif')
          .attr('font-weight', '600')
          .text(`${node.name} (${node.value})`);
      });
    });

  }, [totalPatients]);

  return (
    <div ref={containerRef} className="w-full flex flex-col gap-4 font-Aldrich text-slate-100 p-2 sm:p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 text-lg shadow-inner">
            🔀
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
              Parallel Sets Categorical Flow
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                Multi-Stage Alluvial
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Interactive alluvial flow ribbons visualizing patient transitions from Triage to Specialty, Pathway, and Outcome
            </p>
          </div>
        </div>

        {/* Global Volume Badge */}
        <div className="flex items-center gap-2 text-xs bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
          <span className="text-slate-400">Total Cohort:</span>
          <span className="text-emerald-400 font-bold">{totalPatients.toLocaleString()} Patients</span>
        </div>
      </div>

      {/* Main SVG Visualization */}
      <div className="relative w-full rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950/80 p-2 shadow-inner">
        <svg ref={svgRef} className="w-full h-auto select-none" />

        {hoveredFlow && (
          <div className="absolute top-4 right-4 bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-md pointer-events-none">
            <span className="text-xs font-bold text-white block">Active Pathway Ribbon</span>
            <div className="text-[11px] text-cyan-300 mt-1">
              {hoveredFlow.from} ➔ {hoveredFlow.to}
            </div>
            <div className="text-base font-bold text-white mt-1">
              {hoveredFlow.count} Patients <span className="text-emerald-400 text-xs">({hoveredFlow.pct}% of cohort)</span>
            </div>
          </div>
        )}
      </div>

      {/* Summary Telemetry */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Dimensions</span>
          <span className="text-base font-bold text-white">4 Categorical Axes</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Primary Intake</span>
          <span className="text-base font-bold text-rose-400">Emergency (690 Pts)</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Top Outcome</span>
          <span className="text-base font-bold text-emerald-400">Home Discharge (76%)</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Alluvial Ribbons</span>
          <span className="text-base font-bold text-purple-400">Bézier Weighted Paths</span>
        </div>
      </div>
    </div>
  );
};

export default ParallelSets;
