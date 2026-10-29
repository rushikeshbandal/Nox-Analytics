// ZoomableSunburst.jsx
'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';

// Sector primary colors
const PRIMARY_PALETTE = {
  'Cardiology & Vascular': '#F43F5E',   // Rose
  'Oncology Institute': '#8B5CF6',     // Violet
  'Neurosciences': '#06B6D4',          // Cyan
  'Surgical Services': '#10B981',      // Emerald
  'Pediatrics & Neonatal': '#F59E0B',  // Amber
  'Infectious Disease': '#EC4899'      // Pink
};

// Rich multi-level expenditure dataset
const SUNBURST_DATA = {
  name: "Apex Medical System",
  children: [
    {
      name: "Cardiology & Vascular",
      children: [
        {
          name: "Interventional",
          children: [
            { name: "Cath Lab 1", value: 140 },
            { name: "Cath Lab 2", value: 120 },
            { name: "Angioplasty Core", value: 95 }
          ]
        },
        {
          name: "Electrophysiology",
          children: [
            { name: "Pacemaker Implants", value: 85 },
            { name: "Ablation Suite", value: 110 }
          ]
        },
        {
          name: "Cardiac ICU",
          children: [
            { name: "Acute Coronary", value: 130 },
            { name: "Post-Surgical Stepdown", value: 90 }
          ]
        }
      ]
    },
    {
      name: "Oncology Institute",
      children: [
        {
          name: "Medical Oncology",
          children: [
            { name: "Chemotherapy Infusion", value: 180 },
            { name: "Targeted Immunotherapy", value: 160 },
            { name: "Clinical Trials Biobank", value: 75 }
          ]
        },
        {
          name: "Radiation Oncology",
          children: [
            { name: "Linear Accelerator 1", value: 130 },
            { name: "CyberKnife Robotic", value: 145 },
            { name: "Brachytherapy", value: 65 }
          ]
        },
        {
          name: "Surgical Oncology",
          children: [
            { name: "Tumor Resection Suite", value: 125 },
            { name: "Reconstructive Surgery", value: 80 }
          ]
        }
      ]
    },
    {
      name: "Neurosciences",
      children: [
        {
          name: "Neurosurgery",
          children: [
            { name: "Craniotomy Suite", value: 150 },
            { name: "Spine Reconstruction", value: 135 },
            { name: "Neuro-Endovascular", value: 95 }
          ]
        },
        {
          name: "Neurology",
          children: [
            { name: "Comprehensive Stroke Ctr", value: 140 },
            { name: "Epilepsy Monitoring", value: 80 },
            { name: "Movement Disorders", value: 70 }
          ]
        }
      ]
    },
    {
      name: "Surgical Services",
      children: [
        {
          name: "Transplant Pavilion",
          children: [
            { name: "Renal Transplant", value: 120 },
            { name: "Hepatic Transplant", value: 130 }
          ]
        },
        {
          name: "General & Bariatric",
          children: [
            { name: "Robotic Laparoscopy", value: 115 },
            { name: "Minimally Invasive OR", value: 90 }
          ]
        },
        {
          name: "Orthopedic Surgery",
          children: [
            { name: "Total Joint Replacement", value: 135 },
            { name: "Sports Medicine Unit", value: 85 }
          ]
        }
      ]
    },
    {
      name: "Pediatrics & Neonatal",
      children: [
        {
          name: "Neonatal Intensive Care",
          children: [
            { name: "NICU Pod Alpha", value: 110 },
            { name: "NICU Pod Beta", value: 95 }
          ]
        },
        {
          name: "Pediatric Subspecialties",
          children: [
            { name: "Pediatric Cardiology", value: 90 },
            { name: "Pediatric Surgery", value: 85 }
          ]
        }
      ]
    },
    {
      name: "Infectious Disease",
      children: [
        {
          name: "Bio-Containment Unit",
          children: [
            { name: "Negative Pressure Wards", value: 105 },
            { name: "Viral Surveillance", value: 80 }
          ]
        },
        {
          name: "Antimicrobial Stewardship",
          children: [
            { name: "Therapeutic Resistance Lab", value: 90 },
            { name: "Immunization Clinic", value: 75 }
          ]
        }
      ]
    }
  ]
};

const ZoomableSunburst = () => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [currentNode, setCurrentNode] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [hoveredArc, setHoveredArc] = useState(null);
  const zoomToArcRef = useRef(null);

  // Layout calculations
  const { root, totalBudget } = useMemo(() => {
    const hierarchy = d3.hierarchy(SUNBURST_DATA)
      .sum(d => d.value || 0)
      .sort((a, b) => b.value - a.value);
    return { root: hierarchy, totalBudget: hierarchy.value };
  }, []);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = 800;
    const height = width;
    const radius = width / 6;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('viewBox', [-width / 2, -height / 2, width, height])
      .attr('width', '100%')
      .attr('height', 'auto')
      .style('max-height', '600px')
      .style('background', '#0b1120')
      .style('border-radius', '12px');

    const partition = d3.partition()
      .size([2 * Math.PI, root.height + 1]);

    root.each(d => d.current = d);
    partition(root);

    // Arc generator
    const arc = d3.arc()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(radius * 1.5)
      .innerRadius(d => d.y0 * radius)
      .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1));

    // Color mapper
    const getColor = (d) => {
      let topBranch = d;
      while (topBranch.depth > 1) topBranch = topBranch.parent;
      const base = PRIMARY_PALETTE[topBranch.data.name] || '#06B6D4';
      if (d.depth === 0) return '#0f172a';
      if (d.depth === 1) return base;
      const alpha = Math.max(0.35, 1 - (d.depth - 1) * 0.22);
      return d3.color(base).copy({ opacity: alpha }).formatRgb();
    };

    // Central Circle (clickable to return to parent)
    const centerCircle = svg.append('circle')
      .attr('r', radius)
      .attr('fill', '#0f172a')
      .attr('stroke', '#334155')
      .attr('stroke-width', 2)
      .attr('cursor', 'pointer')
      .on('click', () => {
        if (rootRef.current && rootRef.current.parent) {
          clicked(rootRef.current.parent);
        } else {
          clicked(root);
        }
      });

    const centerTextGroup = svg.append('g')
      .attr('pointer-events', 'none')
      .attr('text-anchor', 'middle');

    centerTextGroup.append('text')
      .attr('class', 'center-return-icon')
      .attr('dy', '-0.5em')
      .attr('font-size', '16px')
      .attr('fill', '#38bdf8')
      .text('⟲ Back');

    centerTextGroup.append('text')
      .attr('class', 'center-node-name')
      .attr('dy', '1em')
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .attr('fill', '#f8fafc')
      .text(root.data.name);

    centerTextGroup.append('text')
      .attr('class', 'center-node-val')
      .attr('dy', '2.4em')
      .attr('font-size', '10px')
      .attr('fill', '#10B981')
      .text(`$${root.value}M`);

    // Arcs group
    const path = svg.append('g')
      .selectAll('path')
      .data(root.descendants().slice(1))
      .join('path')
      .attr('fill', d => getColor(d))
      .attr('fill-opacity', d => arcVisible(d.current) ? 1 : 0)
      .attr('pointer-events', d => arcVisible(d.current) ? 'auto' : 'none')
      .attr('cursor', 'pointer')
      .attr('stroke', '#020617')
      .attr('stroke-width', 1.2)
      .attr('d', d => arc(d.current))
      .on('mouseenter', (event, d) => {
        setHoveredArc({
          name: d.data.name,
          value: d.value,
          pct: ((d.value / root.value) * 100).toFixed(1)
        });
      })
      .on('mouseleave', () => setHoveredArc(null))
      .on('click', (event, p) => clicked(p));

    // Labels group
    const label = svg.append('g')
      .attr('pointer-events', 'none')
      .attr('text-anchor', 'middle')
      .style('user-select', 'none')
      .selectAll('text')
      .data(root.descendants().slice(1))
      .join('text')
      .attr('dy', '0.35em')
      .attr('fill-opacity', d => +labelVisible(d.current))
      .attr('paint-order', 'stroke fill')
      .attr('stroke', '#020617')
      .attr('stroke-width', 3)
      .attr('stroke-linejoin', 'round')
      .attr('fill', '#ffffff')
      .attr('font-size', '10px')
      .attr('font-family', 'Aldrich, sans-serif')
      .attr('transform', d => labelTransform(d.current))
      .text(d => d.data.name);

    const rootRef = { current: root };

    function clicked(p) {
      rootRef.current = p;
      setCurrentNode(p.data);

      // Build ancestry breadcrumbs
      const crumbs = [];
      let curr = p;
      while (curr) {
        crumbs.unshift(curr);
        curr = curr.parent;
      }
      setBreadcrumbs(crumbs);

      // Update center text
      centerTextGroup.select('.center-node-name').text(p.data.name);
      centerTextGroup.select('.center-node-val').text(`$${p.value}M`);
      centerTextGroup.select('.center-return-icon').text(p.parent ? '⟲ Up' : 'Root');

      root.each(d => d.target = {
        x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
        x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
        y0: Math.max(0, d.y0 - p.depth),
        y1: Math.max(0, d.y1 - p.depth)
      });

      const t = svg.transition().duration(750);

      path.transition(t)
        .tween('data', d => {
          const i = d3.interpolate(d.current, d.target);
          return t => d.current = i(t);
        })
        .filter(function(d) {
          return +this.getAttribute('fill-opacity') || arcVisible(d.target);
        })
        .attr('fill-opacity', d => arcVisible(d.target) ? 1 : 0)
        .attr('pointer-events', d => arcVisible(d.target) ? 'auto' : 'none')
        .attrTween('d', d => () => arc(d.current));

      label.filter(function(d) {
        return +this.getAttribute('fill-opacity') || labelVisible(d.target);
      }).transition(t)
        .attr('fill-opacity', d => +labelVisible(d.target))
        .attr('stroke-opacity', d => +labelVisible(d.target))
        .attrTween('transform', d => () => labelTransform(d.current));
    }

    function arcVisible(d) {
      return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
    }

    function labelVisible(d) {
      return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.035;
    }

    function labelTransform(d) {
      const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
      const y = (d.y0 + d.y1) / 2 * radius;
      return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
    }

    zoomToArcRef.current = clicked;

    // Initial state
    setBreadcrumbs([root]);
    setCurrentNode(root.data);

  }, [root]);

  return (
    <div ref={containerRef} className="w-full flex flex-col gap-4 font-Aldrich text-slate-100 p-2 sm:p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 text-lg shadow-inner">
            ☀️
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
              Zoomable Radial Sunburst
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                D3 Radial Partition
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Concentric multi-ring capital budget distribution • Click any arc to zoom in • Click center circle to return
            </p>
          </div>
        </div>

        {/* Reset View Button */}
        <button
          onClick={() => zoomToArcRef.current && zoomToArcRef.current(root)}
          className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
        >
          <span>Reset to Core</span> ⟲
        </button>
      </div>

      {/* Breadcrumb Trail */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900/60 px-4 py-2.5 rounded-xl border border-slate-800 text-xs">
        <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">Hierarchy Path:</span>
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={crumb.data.name + idx}>
            {idx > 0 && <span className="text-slate-600">›</span>}
            <button
              onClick={() => zoomToArcRef.current && zoomToArcRef.current(crumb)}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer font-medium ${
                idx === breadcrumbs.length - 1
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {crumb.data.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Legend & Hover Readout */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900/50 px-4 py-2 rounded-xl border border-slate-800 text-xs">
        <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Specialties:</span>
        {Object.entries(PRIMARY_PALETTE).map(([specialty, color]) => (
          <div key={specialty} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-slate-300 text-[11px]">{specialty}</span>
          </div>
        ))}
        {hoveredArc && (
          <div className="ml-auto flex items-center gap-2 text-[11px] bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-700">
            <span className="text-white font-bold">{hoveredArc.name}</span>
            <span className="text-purple-400 font-semibold">${hoveredArc.value}M</span>
            <span className="text-emerald-400">({hoveredArc.pct}% share)</span>
          </div>
        )}
      </div>

      {/* Main SVG Visualization */}
      <div className="relative w-full flex items-center justify-center rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950/80 p-2 shadow-inner">
        <svg ref={svgRef} className="w-full max-w-[650px] h-auto select-none" />
      </div>

      {/* Summary Telemetry Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Total Capital Allocation</span>
          <span className="text-base font-bold text-emerald-400">${totalBudget.toLocaleString()} Million</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Focal Center</span>
          <span className="text-base font-bold text-white truncate block">{currentNode ? currentNode.name : 'System Core'}</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Active Focus Budget</span>
          <span className="text-base font-bold text-purple-400">
            ${currentNode && currentNode.value ? currentNode.value.toLocaleString() : totalBudget.toLocaleString()}M
          </span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Ring Depth</span>
          <span className="text-base font-bold text-cyan-400">3 Concentric Tiers</span>
        </div>
      </div>
    </div>
  );
};

export default ZoomableSunburst;
