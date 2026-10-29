// ZoomableIcicle.jsx
'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';

// Fresh vibrant color palettes per branch
const SECTOR_COLORS = {
  'Emergency & Acute': '#F43F5E',      // Rose
  'Surgical & Operative': '#8B5CF6',    // Violet
  'Diagnostics & Imaging': '#06B6D4',  // Electric Cyan
  'Outpatient & Telehealth': '#10B981',// Emerald
  'Pharmacy & Logistics': '#F59E0B'    // Amber
};

// Rich multi-level organizational capacity tree
const ICICLE_DATA = {
  name: "National Health Consortium",
  value: 0,
  children: [
    {
      name: "Emergency & Acute",
      children: [
        {
          name: "Trauma Centers",
          children: [
            { name: "Level 1 Resuscitation", value: 380 },
            { name: "Rapid Burn Unit", value: 240 },
            { name: "Pediatric Trauma", value: 290 }
          ]
        },
        {
          name: "Intensive Care Units",
          children: [
            { name: "Cardiac Care (CCU)", value: 420 },
            { name: "Neuro ICU", value: 310 },
            { name: "Neonatal ICU", value: 260 }
          ]
        },
        {
          name: "Rapid Response Dispatch",
          children: [
            { name: "Air Ambulance Fleet", value: 210 },
            { name: "Mobile Critical Care", value: 180 }
          ]
        }
      ]
    },
    {
      name: "Surgical & Operative",
      children: [
        {
          name: "Specialized Suites",
          children: [
            { name: "Cardiovascular Bypass", value: 510 },
            { name: "Stereotactic Neurosurgery", value: 430 },
            { name: "Complex Orthopedics", value: 370 }
          ]
        },
        {
          name: "Minimally Invasive",
          children: [
            { name: "Robotic Laparoscopy", value: 390 },
            { name: "Interventional Endoscopy", value: 280 }
          ]
        },
        {
          name: "Post-Anesthesia Recovery",
          children: [
            { name: "Step-Down Wing A", value: 250 },
            { name: "Step-Down Wing B", value: 220 }
          ]
        }
      ]
    },
    {
      name: "Diagnostics & Imaging",
      children: [
        {
          name: "Advanced Radiology",
          children: [
            { name: "7-Tesla MRI Matrix", value: 460 },
            { name: "Dual-Source CT Core", value: 380 },
            { name: "PET-Radiotracer Lab", value: 310 }
          ]
        },
        {
          name: "Molecular Diagnostics",
          children: [
            { name: "High-Throughput Sequencing", value: 410 },
            { name: "Pathology Biopsy AI", value: 320 },
            { name: "Immunology Bio-Assays", value: 270 }
          ]
        }
      ]
    },
    {
      name: "Outpatient & Telehealth",
      children: [
        {
          name: "Specialty Outposts",
          children: [
            { name: "Oncology Infusion Clinic", value: 440 },
            { name: "Vascular Health Center", value: 330 },
            { name: "Diabetic Care Center", value: 280 }
          ]
        },
        {
          name: "Digital Care Hubs",
          children: [
            { name: "24/7 Virtual Triage", value: 360 },
            { name: "Remote Biometrics Grid", value: 300 }
          ]
        }
      ]
    },
    {
      name: "Pharmacy & Logistics",
      children: [
        {
          name: "Therapeutic Supply",
          children: [
            { name: "Chemotherapy Cleanroom", value: 350 },
            { name: "Automated Robotic Dispensary", value: 290 },
            { name: "Cold-Chain Vaccines", value: 260 }
          ]
        },
        {
          name: "Bio-Engineering",
          children: [
            { name: "Prosthetics 3D Fab", value: 230 },
            { name: "Life-Support Systems Support", value: 200 }
          ]
        }
      ]
    }
  ]
};

const ZoomableIcicle = () => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [currentNode, setCurrentNode] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [hoveredCell, setHoveredCell] = useState(null);
  const zoomToNodeRef = useRef(null);

  // Compute Root and Layout
  const { root, totalCapacity } = useMemo(() => {
    const hierarchy = d3.hierarchy(ICICLE_DATA)
      .sum(d => d.value || 0)
      .sort((a, b) => b.value - a.value);
    return { root: hierarchy, totalCapacity: hierarchy.value };
  }, []);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = 960;
    const height = 500;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('viewBox', [0, 0, width, height])
      .attr('width', '100%')
      .attr('height', 'auto')
      .style('max-height', '600px')
      .style('background', '#0b1120')
      .style('border-radius', '12px');

    // Create D3 partition layout
    const partition = d3.partition()
      .size([height, (root.height + 1) * (width / (root.height + 1))]);

    partition(root);

    // Color assignment helper
    const getColor = (d) => {
      let topBranch = d;
      while (topBranch.depth > 1) topBranch = topBranch.parent;
      const base = SECTOR_COLORS[topBranch.data.name] || '#06B6D4';
      if (d.depth === 0) return '#10B981';
      if (d.depth === 1) return base;
      const alpha = Math.max(0.4, 1 - (d.depth - 1) * 0.22);
      return d3.color(base).copy({ opacity: alpha }).formatRgb();
    };

    let focus = root;

    const x = d3.scaleLinear().rangeRound([0, width]);
    const y = d3.scaleLinear().rangeRound([0, height]);

    const g = svg.append('g');

    const cell = g.selectAll('g')
      .data(root.descendants())
      .join('g')
      .attr('transform', d => `translate(${d.y0},${d.x0})`)
      .attr('cursor', 'pointer');

    const rect = cell.append('rect')
      .attr('width', d => d.y1 - d.y0 - 1)
      .attr('height', d => Math.max(0, d.x1 - d.x0 - 1))
      .attr('fill', d => getColor(d))
      .attr('stroke', '#020617')
      .attr('stroke-width', 1.5)
      .attr('rx', 3)
      .attr('ry', 3)
      .on('mouseenter', (event, d) => {
        setHoveredCell({
          name: d.data.name,
          value: d.value,
          depth: d.depth,
          pct: ((d.value / root.value) * 100).toFixed(1)
        });
      })
      .on('mouseleave', () => setHoveredCell(null))
      .on('click', (event, p) => clicked(p));

    const text = cell.append('text')
      .style('user-select', 'none')
      .attr('pointer-events', 'none')
      .attr('x', 6)
      .attr('y', 14)
      .attr('fill', '#ffffff')
      .attr('paint-order', 'stroke fill')
      .attr('stroke', '#020617')
      .attr('stroke-width', 3)
      .attr('stroke-linejoin', 'round')
      .attr('font-size', '11px')
      .attr('font-weight', d => d.depth <= 1 ? '700' : '500')
      .attr('font-family', 'Aldrich, sans-serif')
      .text(d => d.data.name);

    const tspan = cell.append('text')
      .style('user-select', 'none')
      .attr('pointer-events', 'none')
      .attr('x', 6)
      .attr('y', 28)
      .attr('fill', '#e2e8f0')
      .attr('paint-order', 'stroke fill')
      .attr('stroke', '#020617')
      .attr('stroke-width', 2.5)
      .attr('font-size', '9px')
      .attr('font-family', 'Aldrich, sans-serif')
      .text(d => `${d.value.toLocaleString()} beds`);

    // Zooming logic
    function clicked(p) {
      focus = focus === p ? p = p.parent || root : p;
      setCurrentNode(p.data);

      // Build breadcrumbs
      const crumbs = [];
      let curr = p;
      while (curr) {
        crumbs.unshift(curr);
        curr = curr.parent;
      }
      setBreadcrumbs(crumbs);

      root.each(d => {
        d.target = {
          x0: (d.x0 - p.x0) / (p.x1 - p.x0) * height,
          x1: (d.x1 - p.x0) / (p.x1 - p.x0) * height,
          y0: d.y0 - p.y0,
          y1: d.y1 - p.y0
        };
      });

      const t = cell.transition().duration(750)
        .attr('transform', d => `translate(${d.target.y0},${d.target.x0})`);

      rect.transition(t)
        .attr('height', d => Math.max(0, d.target.x1 - d.target.x0 - 1));

      text.transition(t)
        .attr('fill-opacity', d => +labelVisible(d.target))
        .attr('stroke-opacity', d => +labelVisible(d.target));

      tspan.transition(t)
        .attr('fill-opacity', d => +labelVisible(d.target))
        .attr('stroke-opacity', d => +labelVisible(d.target));
    }

    function labelVisible(d) {
      return d.y1 <= width && d.y0 >= 0 && d.x1 - d.x0 > 24;
    }

    zoomToNodeRef.current = clicked;

    // Initial breadcrumb setup
    setBreadcrumbs([root]);
    setCurrentNode(root.data);

  }, [root]);

  return (
    <div ref={containerRef} className="w-full flex flex-col gap-4 font-Aldrich text-slate-100 p-2 sm:p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-lg shadow-inner">
            🧊
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
              Zoomable Partition Icicle
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                D3 Partition Layout
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Rectangular hierarchical capacity partition • Click any block to zoom into subtree • Click parent or reset to zoom out
            </p>
          </div>
        </div>

        {/* Reset View Button */}
        <button
          onClick={() => zoomToNodeRef.current && zoomToNodeRef.current(root)}
          className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/30 transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
        >
          <span>Root View</span> ⟲
        </button>
      </div>

      {/* Interactive Breadcrumb Trail */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900/60 px-4 py-2.5 rounded-xl border border-slate-800 text-xs">
        <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">Ancestry Path:</span>
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={crumb.data.name + idx}>
            {idx > 0 && <span className="text-slate-600">›</span>}
            <button
              onClick={() => zoomToNodeRef.current && zoomToNodeRef.current(crumb)}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer font-medium ${
                idx === breadcrumbs.length - 1
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {crumb.data.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Category Legends */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900/50 px-4 py-2 rounded-xl border border-slate-800 text-xs">
        <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Divisions:</span>
        {Object.entries(SECTOR_COLORS).map(([dept, color]) => (
          <div key={dept} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
            <span className="text-slate-300 text-[11px]">{dept}</span>
          </div>
        ))}
        {hoveredCell && (
          <div className="ml-auto flex items-center gap-2 text-[11px] bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-700">
            <span className="text-white font-bold">{hoveredCell.name}</span>
            <span className="text-cyan-400 font-semibold">{hoveredCell.value} beds</span>
            <span className="text-emerald-400">({hoveredCell.pct}% of total)</span>
          </div>
        )}
      </div>

      {/* Main SVG Visualization */}
      <div className="relative w-full rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950/80 shadow-inner">
        <svg ref={svgRef} className="w-full h-auto select-none" />
      </div>

      {/* Telemetry Status Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Network Capacity</span>
          <span className="text-base font-bold text-cyan-400">{totalCapacity.toLocaleString()} Beds</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Active Focus Node</span>
          <span className="text-base font-bold text-white truncate block">{currentNode ? currentNode.name : 'All System'}</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Subtree Volume</span>
          <span className="text-base font-bold text-emerald-400">
            {currentNode && currentNode.value ? currentNode.value.toLocaleString() : totalCapacity.toLocaleString()} Beds
          </span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Hierarchy Levels</span>
          <span className="text-base font-bold text-purple-400">4 Tier Partition</span>
        </div>
      </div>
    </div>
  );
};

export default ZoomableIcicle;
