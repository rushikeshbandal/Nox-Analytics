// ZoomableTreemap.jsx
'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';

const DIVISION_COLORS = {
  'Clinical Care': '#06B6D4',       // Cyan
  'Diagnostics & Labs': '#10B981',  // Emerald
  'Therapeutics': '#8B5CF6',        // Violet
  'Emergency Logistics': '#F59E0B', // Amber
  'Genomics & Research': '#F43F5E'  // Rose
};

const HIERARCHY_DATA = {
  name: 'Global Health Network',
  children: [
    {
      name: 'Clinical Care',
      children: [
        {
          name: 'Inpatient Wards',
          children: [
            { name: 'ICU Unit A', value: 450 },
            { name: 'ICU Unit B', value: 380 },
            { name: 'Cardiology Ward', value: 520 },
            { name: 'Neurology Unit', value: 310 }
          ]
        },
        {
          name: 'Surgical Pavilion',
          children: [
            { name: 'OR Suite 1', value: 680 },
            { name: 'OR Suite 2', value: 620 },
            { name: 'Post-Op Recovery', value: 410 },
            { name: 'Anesthesia Center', value: 290 }
          ]
        },
        {
          name: 'Outpatient Clinic',
          children: [
            { name: 'General OPD', value: 340 },
            { name: 'Pediatrics Wing', value: 390 },
            { name: 'Geriatric Care', value: 260 }
          ]
        }
      ]
    },
    {
      name: 'Diagnostics & Labs',
      children: [
        {
          name: 'Pathology Division',
          children: [
            { name: 'Tissue Biopsy Lab', value: 480 },
            { name: 'Cytology Core', value: 360 },
            { name: 'Hematology Screening', value: 420 }
          ]
        },
        {
          name: 'Imaging Sciences',
          children: [
            { name: '3T MRI Suite', value: 640 },
            { name: 'CT Spectral Scanner', value: 590 },
            { name: 'Digital Radiography', value: 310 },
            { name: 'Ultrasound Bay', value: 220 }
          ]
        },
        {
          name: 'Microbiology',
          children: [
            { name: 'Viral PCR Array', value: 380 },
            { name: 'Bacterial Culture', value: 270 }
          ]
        }
      ]
    },
    {
      name: 'Therapeutics',
      children: [
        {
          name: 'Oncology Center',
          children: [
            { name: 'Infusion Suite', value: 590 },
            { name: 'Radiation Oncology', value: 650 },
            { name: 'Immunotherapy Lab', value: 490 }
          ]
        },
        {
          name: 'Specialty Pharmacy',
          children: [
            { name: 'Biologics Dispensary', value: 430 },
            { name: 'Sterile Compounding', value: 340 },
            { name: 'Formulary Inventory', value: 310 }
          ]
        }
      ]
    },
    {
      name: 'Emergency Logistics',
      children: [
        {
          name: 'Fleet Dispatch',
          children: [
            { name: 'Air Ambulance Medevac', value: 540 },
            { name: 'Rapid Response Fleet', value: 420 },
            { name: 'Mobile ICU Transit', value: 380 }
          ]
        },
        {
          name: 'Trauma Resupply',
          children: [
            { name: 'Blood Bank Depot', value: 460 },
            { name: 'Critical O2 Reserves', value: 370 },
            { name: 'Surgical Kit Cache', value: 320 }
          ]
        }
      ]
    },
    {
      name: 'Genomics & Research',
      children: [
        {
          name: 'Sequencing Hub',
          children: [
            { name: 'NextGen Sequencer A', value: 580 },
            { name: 'NextGen Sequencer B', value: 510 },
            { name: 'Long-Read Sequencing', value: 440 }
          ]
        },
        {
          name: 'Bio-Analytics',
          children: [
            { name: 'High-Perf Computing', value: 460 },
            { name: 'Proteomics Core', value: 390 },
            { name: 'Bio-Repository Vault', value: 340 }
          ]
        }
      ]
    }
  ]
};

export default function ZoomableTreemap({ width = 880, height = 520 }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  const [currentRoot, setCurrentRoot] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState(['Global Health Network']);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedDivision, setSelectedDivision] = useState(null);

  // Calculate hierarchy and total values
  const rootHierarchy = useMemo(() => {
    return d3.hierarchy(HIERARCHY_DATA)
      .sum(d => d.value || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));
  }, []);

  const divisionStats = useMemo(() => {
    const stats = {};
    Object.keys(DIVISION_COLORS).forEach(div => {
      stats[div] = { total: 0, count: 0, color: DIVISION_COLORS[div] };
    });

    const rootCopy = d3.hierarchy(HIERARCHY_DATA).sum(d => d.value || 0);
    (rootCopy.children || []).forEach(divNode => {
      if (stats[divNode.data.name]) {
        stats[divNode.data.name].total = divNode.value || 0;
        stats[divNode.data.name].count = divNode.leaves().length;
      }
    });
    return stats;
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const treemapLayout = d3.treemap()
      .size([width, height])
      .paddingOuter(4)
      .paddingTop(22)
      .paddingInner(3)
      .round(true);

    const activeNode = currentRoot || rootHierarchy;
    treemapLayout(activeNode);

    // Color mapper based on top ancestor
    const getColor = (d) => {
      let curr = d;
      while (curr.depth > 1) curr = curr.parent;
      return DIVISION_COLORS[curr.data.name] || '#38bdf8';
    };

    const g = svg.append('g').attr('class', 'treemap-viewport');

    // Create groups for each node at active depth
    const nodes = activeNode.children || [activeNode];
    const leaves = activeNode.leaves();

    const cell = g.selectAll('g.cell')
      .data(leaves)
      .enter()
      .append('g')
      .attr('class', 'cell')
      .attr('transform', d => `translate(${d.x0},${d.y0})`)
      .style('cursor', d => (d.parent && d.parent !== activeNode ? 'pointer' : 'default'));

    // Rectangles
    cell.append('rect')
      .attr('id', (d, i) => `rect-${i}`)
      .attr('width', d => Math.max(0, d.x1 - d.x0))
      .attr('height', d => Math.max(0, d.y1 - d.y0))
      .attr('fill', d => getColor(d))
      .attr('fill-opacity', d => {
        if (selectedDivision) {
          let top = d;
          while (top.depth > 1) top = top.parent;
          if (top.data.name !== selectedDivision) return 0.15;
        }
        return 0.85;
      })
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 1.5)
      .attr('rx', 4)
      .style('transition', 'fill-opacity 0.25s ease, filter 0.25s ease')
      .on('mouseenter', function(event, d) {
        d3.select(this)
          .attr('fill-opacity', 1)
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 2);
        setHoveredNode(d);
      })
      .on('mouseleave', function(event, d) {
        d3.select(this)
          .attr('fill-opacity', () => {
            if (selectedDivision) {
              let top = d;
              while (top.depth > 1) top = top.parent;
              if (top.data.name !== selectedDivision) return 0.15;
            }
            return 0.85;
          })
          .attr('stroke', '#0f172a')
          .attr('stroke-width', 1.5);
        setHoveredNode(null);
      })
      .on('click', (event, d) => {
        if (d.parent && d.parent !== activeNode && d.parent.depth > 0) {
          zoomToNode(d.parent);
        }
      });

    // Node Labels
    cell.each(function(d) {
      const w = d.x1 - d.x0;
      const h = d.y1 - d.y0;
      if (w < 45 || h < 26) return;

      const group = d3.select(this);

      group.append('text')
        .attr('x', 6)
        .attr('y', 14)
        .attr('font-size', w < 80 ? '9px' : '11px')
        .attr('font-weight', '700')
        .attr('fill', '#ffffff')
        .attr('style', 'paint-order: stroke fill; stroke: #0f172a; stroke-width: 2.5px;')
        .text(d.data.name.length > 18 && w < 90 ? d.data.name.slice(0, 15) + '…' : d.data.name);

      if (h >= 40) {
        group.append('text')
          .attr('x', 6)
          .attr('y', 28)
          .attr('font-size', '10px')
          .attr('font-family', 'monospace')
          .attr('font-weight', '600')
          .attr('fill', '#e2e8f0')
          .attr('style', 'paint-order: stroke fill; stroke: #0f172a; stroke-width: 2px;')
          .text(`$${d.data.value}K`);
      }
    });

  }, [currentRoot, rootHierarchy, width, height, selectedDivision]);

  const zoomToNode = (node) => {
    setCurrentRoot(node);
    const crumbs = [];
    let curr = node;
    while (curr) {
      crumbs.unshift(curr.data.name);
      curr = curr.parent;
    }
    setBreadcrumbs(crumbs);
  };

  const handleResetZoom = () => {
    setCurrentRoot(rootHierarchy);
    setBreadcrumbs(['Global Health Network']);
  };

  const handleCrumbClick = (idx) => {
    if (idx === 0) {
      handleResetZoom();
      return;
    }
    let node = currentRoot;
    while (node && node.depth > idx) {
      node = node.parent;
    }
    if (node) zoomToNode(node);
  };

  return (
    <div ref={containerRef} className="w-full flex flex-col rounded-2xl bg-slate-950 text-slate-100 border border-slate-800 shadow-2xl overflow-hidden font-sans select-none">
      {/* Header */}
      <div className="px-5 py-3.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-sm">
            🔲
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-white tracking-wide">Zoomable Treemap</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Hierarchical Partition
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive multilevel space-filling allocation &bull; Click to dive in
            </p>
          </div>
        </div>

        {/* Quick Stats Badges */}
        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center gap-2">
            <span className="text-slate-400">Total Budget:</span>
            <span className="font-mono font-bold text-emerald-400">
              ${d3.format(',')(rootHierarchy.value || 0)}K
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center gap-2">
            <span className="text-slate-400">Leaves:</span>
            <span className="font-mono font-bold text-cyan-400">
              {rootHierarchy.leaves().length} units
            </span>
          </div>
          <button
            onClick={handleResetZoom}
            disabled={!currentRoot || currentRoot === rootHierarchy}
            className={`px-3 py-1.5 rounded-lg font-semibold text-xs border transition ${
              currentRoot && currentRoot !== rootHierarchy
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 shadow-md cursor-pointer'
                : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed opacity-60'
            }`}
          >
            ⟲ Reset Zoom
          </button>
        </div>
      </div>

      {/* Breadcrumb Navigation Bar */}
      <div className="px-5 py-2.5 bg-slate-900/50 border-b border-slate-800 flex items-center gap-1.5 text-xs overflow-x-auto">
        <span className="text-slate-400 font-medium">Path:</span>
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={crumb}>
            {idx > 0 && <span className="text-slate-600">/</span>}
            <button
              onClick={() => handleCrumbClick(idx)}
              className={`px-2 py-0.5 rounded font-medium transition ${
                idx === breadcrumbs.length - 1
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {crumb}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Division Category Legend */}
      <div className="px-5 py-2 bg-slate-900/30 border-b border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {Object.entries(divisionStats).map(([div, stat]) => {
            const isSelected = selectedDivision === div;
            return (
              <button
                key={div}
                onClick={() => setSelectedDivision(isSelected ? null : div)}
                className={`flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs font-medium transition-all cursor-pointer ${
                  isSelected ? 'ring-2 ring-white/50 shadow-md' : 'bg-slate-800/50 hover:border-slate-600'
                }`}
                style={{
                  borderColor: isSelected ? stat.color : `${stat.color}40`,
                  backgroundColor: isSelected ? `${stat.color}25` : undefined
                }}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stat.color }} />
                <span className="text-slate-200">{div}</span>
                <span className="text-[10px] font-mono font-bold px-1.5 rounded" style={{ backgroundColor: `${stat.color}30`, color: stat.color }}>
                  ${d3.format(',')(stat.total)}K
                </span>
              </button>
            );
          })}
          {selectedDivision && (
            <button
              onClick={() => setSelectedDivision(null)}
              className="text-[11px] text-cyan-400 underline hover:text-cyan-300 ml-1"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* SVG Treemap Canvas */}
      <div className="relative w-full flex-1 bg-slate-950 p-3 min-h-[480px] flex items-center justify-center">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full max-h-[520px]"
          style={{ width: '100%', height: '100%', display: 'block' }}
        />

        {/* Hover Inspector Card */}
        {hoveredNode && (
          <div className="absolute top-4 right-4 z-20 w-64 p-3 rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-700 shadow-2xl text-xs flex flex-col gap-1.5 pointer-events-none animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="font-bold text-white text-sm">{hoveredNode.data.name}</span>
              <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-cyan-500/20 text-cyan-300">
                ${hoveredNode.data.value}K
              </span>
            </div>
            <div className="text-slate-400 text-[11px] flex justify-between">
              <span>Parent Branch:</span>
              <span className="text-slate-200 font-semibold">{hoveredNode.parent?.data.name || 'Root'}</span>
            </div>
            <div className="text-slate-400 text-[11px] flex justify-between">
              <span>Share of Root:</span>
              <span className="text-emerald-400 font-mono font-bold">
                {(((hoveredNode.data.value || 0) / (rootHierarchy.value || 1)) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
