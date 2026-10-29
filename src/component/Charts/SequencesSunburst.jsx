// SequencesSunburst.jsx
'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';

// Step categories and colors
const STAGE_COLORS = {
  'Intake': '#06B6D4',        // Electric Cyan
  'Triage': '#F59E0B',        // Warm Amber
  'Diagnostics': '#8B5CF6',   // Vivid Violet
  'Intervention': '#F43F5E',  // Rose
  'Pharmacy': '#10B981',      // Fresh Emerald
  'Discharge': '#3B82F6',     // Sky Blue
  'FollowUp': '#EC4899'       // Pink
};

// Sequences Data: Pathways and patient flow volumes
const SEQUENCES_DATA = [
  { path: ['Intake', 'Triage', 'Diagnostics', 'Intervention', 'Discharge'], value: 1420 },
  { path: ['Intake', 'Triage', 'Diagnostics', 'Pharmacy', 'Discharge'], value: 2180 },
  { path: ['Intake', 'Triage', 'Diagnostics', 'Intervention', 'FollowUp'], value: 890 },
  { path: ['Intake', 'Triage', 'Pharmacy', 'Discharge'], value: 3450 },
  { path: ['Intake', 'Triage', 'Pharmacy', 'FollowUp'], value: 1120 },
  { path: ['Intake', 'Diagnostics', 'Intervention', 'Discharge'], value: 760 },
  { path: ['Intake', 'Diagnostics', 'Pharmacy', 'Discharge'], value: 1540 },
  { path: ['Intake', 'Diagnostics', 'Pharmacy', 'FollowUp'], value: 680 },
  { path: ['Intake', 'Intervention', 'Discharge'], value: 520 },
  { path: ['Intake', 'Triage', 'Discharge'], value: 1890 },
  { path: ['Intake', 'Diagnostics', 'Discharge'], value: 940 }
];

// Build hierarchy tree from sequences
function buildHierarchy(data) {
  const root = { name: "root", children: [] };
  for (let i = 0; i < data.length; i++) {
    const sequence = data[i].path;
    const size = +data[i].value;
    let currentNode = root;
    for (let j = 0; j < sequence.length; j++) {
      const children = currentNode.children;
      const nodeName = sequence[j];
      let childNode;
      if (j + 1 < sequence.length) {
        let foundChild = false;
        for (let k = 0; k < children.length; k++) {
          if (children[k].name === nodeName) {
            childNode = children[k];
            foundChild = true;
            break;
          }
        }
        if (!foundChild) {
          childNode = { name: nodeName, children: [] };
          children.push(childNode);
        }
        currentNode = childNode;
      } else {
        childNode = { name: nodeName, value: size };
        children.push(childNode);
      }
    }
  }
  return root;
}

const SequencesSunburst = () => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [activeSequence, setActiveSequence] = useState([]);
  const [sequencePct, setSequencePct] = useState('100.0%');
  const [sequenceCount, setSequenceCount] = useState(0);
  const highlightPathRef = useRef(null);

  // Total patient journeys
  const totalJourneys = useMemo(() => {
    return SEQUENCES_DATA.reduce((acc, curr) => acc + curr.value, 0);
  }, []);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = 750;
    const height = width;
    const radius = width / 2;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('viewBox', [-radius, -radius, width, height])
      .attr('width', '100%')
      .attr('height', 'auto')
      .style('max-height', '580px')
      .style('background', '#0b1120')
      .style('border-radius', '12px');

    const rawTree = buildHierarchy(SEQUENCES_DATA);
    const root = d3.hierarchy(rawTree)
      .sum(d => d.value)
      .sort((a, b) => b.value - a.value);

    const partition = d3.partition()
      .size([2 * Math.PI, radius]);

    partition(root);

    // Arc generator
    const arc = d3.arc()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .innerRadius(d => d.y0)
      .outerRadius(d => d.y1 - 2);

    // Filter out root node itself
    const nodes = root.descendants().filter(d => d.depth > 0);

    const g = svg.append('g');

    // Sunburst path arcs
    const paths = g.selectAll('path')
      .data(nodes)
      .join('path')
      .attr('d', arc)
      .attr('fill', d => STAGE_COLORS[d.data.name] || '#64748b')
      .attr('stroke', '#020617')
      .attr('stroke-width', 1.5)
      .attr('cursor', 'pointer')
      .attr('fill-opacity', 0.88);

    // Center circular container
    const centerGroup = svg.append('g')
      .attr('pointer-events', 'none')
      .attr('text-anchor', 'middle');

    centerGroup.append('circle')
      .attr('r', 78)
      .attr('fill', '#0f172a')
      .attr('stroke', '#334155')
      .attr('stroke-width', 2);

    const centerPctText = centerGroup.append('text')
      .attr('dy', '-0.1em')
      .attr('font-size', '24px')
      .attr('font-weight', 'bold')
      .attr('fill', '#38bdf8')
      .text('100.0%');

    const centerLabelText = centerGroup.append('text')
      .attr('dy', '1.6em')
      .attr('font-size', '10px')
      .attr('fill', '#94a3b8')
      .text('of Total Journeys');

    const centerCountText = centerGroup.append('text')
      .attr('dy', '3.1em')
      .attr('font-size', '10px')
      .attr('fill', '#10B981')
      .attr('font-weight', 'bold')
      .text(`${totalJourneys.toLocaleString()} patients`);

    // Mouseover handler
    function mouseover(event, d) {
      const sequence = d.ancestors().reverse().slice(1);
      const percentage = ((100 * d.value) / root.value).toFixed(1) + '%';

      centerPctText.text(percentage);
      centerCountText.text(`${d.value.toLocaleString()} patients`);
      centerLabelText.text(`through ${d.data.name}`);

      setActiveSequence(sequence.map(s => s.data.name));
      setSequencePct(percentage);
      setSequenceCount(d.value);

      // Fade all paths
      paths.attr('fill-opacity', 0.18);

      // Highlight only ancestors of current node
      paths.filter(node => sequence.indexOf(node) >= 0)
        .attr('fill-opacity', 1)
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 2);
    }

    // Mouseleave handler
    function mouseleave() {
      paths
        .attr('fill-opacity', 0.88)
        .attr('stroke', '#020617')
        .attr('stroke-width', 1.5);

      centerPctText.text('100.0%');
      centerLabelText.text('of Total Journeys');
      centerCountText.text(`${totalJourneys.toLocaleString()} patients`);

      setActiveSequence([]);
      setSequencePct('100.0%');
      setSequenceCount(totalJourneys);
    }

    paths.on('mouseenter', mouseover);
    svg.on('mouseleave', mouseleave);

    // Function to programmatically highlight a known sequence
    highlightPathRef.current = (seqArray) => {
      let targetNode = root;
      for (const step of seqArray) {
        if (targetNode.children) {
          const match = targetNode.children.find(c => c.data.name === step);
          if (match) targetNode = match;
        }
      }
      if (targetNode && targetNode.depth > 0) {
        mouseover(null, targetNode);
      }
    };

    setSequenceCount(totalJourneys);

  }, [totalJourneys]);

  return (
    <div ref={containerRef} className="w-full flex flex-col gap-4 font-Aldrich text-slate-100 p-2 sm:p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 text-lg shadow-inner">
            🌀
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
              Clinical Sequences Sunburst
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                Multi-Stage Pathway
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Interactive clinical patient journey funnel • Hover over any sequence arc to trace pathway and measure conversion
            </p>
          </div>
        </div>

        {/* Global Journey Metric Badge */}
        <div className="flex items-center gap-3 bg-slate-800/80 px-3.5 py-1.5 rounded-lg border border-slate-700">
          <span className="text-slate-400 text-xs">Total Cohort:</span>
          <span className="text-emerald-400 font-bold text-sm">{totalJourneys.toLocaleString()} Cases</span>
        </div>
      </div>

      {/* Top Breadcrumb Trail showing current active sequence */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900/70 p-3 rounded-xl border border-slate-800 min-h-[46px]">
        <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Active Sequence:</span>
        {activeSequence.length === 0 ? (
          <span className="text-slate-500 text-xs italic">Hover over any ring arc or select a top pathway below...</span>
        ) : (
          activeSequence.map((step, idx) => (
            <React.Fragment key={step + idx}>
              {idx > 0 && <span className="text-slate-600 font-bold">➔</span>}
              <div
                className="px-3 py-1 rounded-md text-xs font-bold shadow-sm flex items-center gap-1.5"
                style={{ backgroundColor: STAGE_COLORS[step] || '#64748b', color: '#020617' }}
              >
                <span>{step}</span>
              </div>
            </React.Fragment>
          ))
        )}
        {activeSequence.length > 0 && (
          <span className="ml-auto text-xs text-cyan-300 bg-cyan-950/60 border border-cyan-800 px-2.5 py-1 rounded-md font-bold">
            {sequencePct} ({sequenceCount.toLocaleString()} patients)
          </span>
        )}
      </div>

      {/* Stage Color Legend */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900/50 px-4 py-2 rounded-xl border border-slate-800 text-xs">
        <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Stages:</span>
        {Object.entries(STAGE_COLORS).map(([stage, color]) => (
          <div key={stage} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-slate-300 text-[11px]">{stage}</span>
          </div>
        ))}
      </div>

      {/* Layout Grid: Sunburst Left + Top Journeys List Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
        {/* Main Sunburst Visualizer */}
        <div className="lg:col-span-2 flex items-center justify-center rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950/80 p-3 shadow-inner">
          <svg ref={svgRef} className="w-full max-w-[540px] h-auto select-none" />
        </div>

        {/* Top 5 Most Common Patient Journeys Sidebar */}
        <div className="flex flex-col gap-2.5 bg-slate-900/60 p-4 rounded-xl border border-slate-800 h-full">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
            <span>🔥</span> Top Patient Clinical Pathways
          </h3>
          <div className="flex flex-col gap-2 overflow-y-auto max-h-[420px] pr-1">
            {SEQUENCES_DATA.slice(0, 5).map((item, index) => {
              const pct = ((item.value / totalJourneys) * 100).toFixed(1);
              return (
                <button
                  key={index}
                  onClick={() => highlightPathRef.current && highlightPathRef.current(item.path)}
                  className="flex flex-col gap-1.5 p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-left border border-slate-700/60 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-200 group-hover:text-cyan-300">
                      #{index + 1} Pathway
                    </span>
                    <span className="text-emerald-400 font-semibold">{pct}% ({item.value.toLocaleString()})</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    {item.path.map((step, sIdx) => (
                      <React.Fragment key={sIdx}>
                        {sIdx > 0 && <span className="text-slate-500 text-[10px]">›</span>}
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                          style={{
                            backgroundColor: `${STAGE_COLORS[step]}22`,
                            color: STAGE_COLORS[step],
                            border: `1px solid ${STAGE_COLORS[step]}44`
                          }}
                        >
                          {step}
                        </span>
                      </React.Fragment>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SequencesSunburst;
