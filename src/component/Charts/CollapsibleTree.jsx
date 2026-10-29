// CollapsibleTree.jsx
'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';

// Fresh vibrant color scheme mapped by hierarchy depth / category
const DEPTH_COLORS = {
  0: '#10B981', // Emerald - Root Health System
  1: '#06B6D4', // Electric Cyan - Divisional Directorate
  2: '#8B5CF6', // Vivid Violet - Department / Clinical Speciality
  3: '#F59E0B', // Warm Amber - Specialized Care Units
  4: '#F43F5E', // Rose - Operating Station / Clinics
};

// Rich hierarchical healthcare operational tree dataset
const HIERARCHY_DATA = {
  name: "Apex Healthcare Network",
  category: "Health System",
  budget: "$2.4B",
  headcount: 8400,
  children: [
    {
      name: "Clinical Services",
      category: "Directorate",
      budget: "$980M",
      headcount: 3800,
      children: [
        {
          name: "Critical & Emergency Care",
          category: "Department",
          budget: "$320M",
          headcount: 1200,
          children: [
            { name: "Emergency Trauma Ctr", category: "Unit", budget: "$140M", headcount: 520, value: 520 },
            { name: "Intensive Care Unit (ICU)", category: "Unit", budget: "$110M", headcount: 410, value: 410 },
            { name: "Pediatric ICU", category: "Unit", budget: "$70M", headcount: 270, value: 270 }
          ]
        },
        {
          name: "Surgical Specialties",
          category: "Department",
          budget: "$380M",
          headcount: 1450,
          children: [
            { name: "Cardiothoracic Surgery", category: "Unit", budget: "$160M", headcount: 580, value: 580 },
            { name: "Neurosurgery Pavilion", category: "Unit", budget: "$130M", headcount: 490, value: 490 },
            { name: "Orthopedic Ortho-Spine", category: "Unit", budget: "$90M", headcount: 380, value: 380 }
          ]
        },
        {
          name: "General & Internal Medicine",
          category: "Department",
          budget: "$280M",
          headcount: 1150,
          children: [
            { name: "Oncology & Hematology", category: "Unit", budget: "$120M", headcount: 480, value: 480 },
            { name: "Cardiology & Vascular", category: "Unit", budget: "$95M", headcount: 390, value: 390 },
            { name: "Pulmonology & Respiratory", category: "Unit", budget: "$65M", headcount: 280, value: 280 }
          ]
        }
      ]
    },
    {
      name: "Diagnostics & Genomics",
      category: "Directorate",
      budget: "$540M",
      headcount: 1950,
      children: [
        {
          name: "Advanced Laboratory Sciences",
          category: "Department",
          budget: "$290M",
          headcount: 1050,
          children: [
            { name: "Genomic Sequencing Core", category: "Unit", budget: "$130M", headcount: 440, value: 440 },
            { name: "Histopathology & Biopsy", category: "Unit", budget: "$90M", headcount: 330, value: 330 },
            { name: "Molecular Immunology", category: "Unit", budget: "$70M", headcount: 280, value: 280 }
          ]
        },
        {
          name: "Diagnostic Imaging & Radiology",
          category: "Department",
          budget: "$250M",
          headcount: 900,
          children: [
            { name: "High-Field MRI Suite", category: "Unit", budget: "$110M", headcount: 390, value: 390 },
            { name: "PET-CT Nuclear Medicine", category: "Unit", budget: "$85M", headcount: 310, value: 310 },
            { name: "Interventional Angio", category: "Unit", budget: "$55M", headcount: 200, value: 200 }
          ]
        }
      ]
    },
    {
      name: "Digital Health & Informatics",
      category: "Directorate",
      budget: "$420M",
      headcount: 1350,
      children: [
        {
          name: "Clinical AI & Analytics",
          category: "Department",
          budget: "$230M",
          headcount: 720,
          children: [
            { name: "Predictive Triage AI", category: "Unit", budget: "$105M", headcount: 320, value: 320 },
            { name: "Bio-Imaging Machine Vision", category: "Unit", budget: "$75M", headcount: 230, value: 230 },
            { name: "Real-Time Telemetry Grid", category: "Unit", budget: "$50M", headcount: 170, value: 170 }
          ]
        },
        {
          name: "Telehealth & Remote Care",
          category: "Department",
          budget: "$190M",
          headcount: 630,
          children: [
            { name: "Virtual Outpatient Clinic", category: "Unit", budget: "$95M", headcount: 310, value: 310 },
            { name: "Home Monitoring Gateway", category: "Unit", budget: "$55M", headcount: 190, value: 190 },
            { name: "Emergency Dispatch Comms", category: "Unit", budget: "$40M", headcount: 130, value: 130 }
          ]
        }
      ]
    },
    {
      name: "Operations & Logistics",
      category: "Directorate",
      budget: "$460M",
      headcount: 1300,
      children: [
        {
          name: "Pharmacy & Therapeutics",
          category: "Department",
          budget: "$260M",
          headcount: 750,
          children: [
            { name: "Central Automated Dispensary", category: "Unit", budget: "$120M", headcount: 340, value: 340 },
            { name: "Sterile Compounding Cleanroom", category: "Unit", budget: "$80M", headcount: 240, value: 240 },
            { name: "Cold-Chain Biologics Hub", category: "Unit", budget: "$60M", headcount: 170, value: 170 }
          ]
        },
        {
          name: "Biomedical & Facilities",
          category: "Department",
          budget: "$200M",
          headcount: 550,
          children: [
            { name: "Medical Device Engineering", category: "Unit", budget: "$100M", headcount: 270, value: 270 },
            { name: "Sterilization & Decon", category: "Unit", budget: "$60M", headcount: 170, value: 170 },
            { name: "Life Safety & Power Systems", category: "Unit", budget: "$40M", headcount: 110, value: 110 }
          ]
        }
      ]
    }
  ]
};

const CollapsibleTree = () => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [treeStats, setTreeStats] = useState({ totalNodes: 0, visibleNodes: 0, collapsedNodes: 0 });
  const [zoomTransform, setZoomTransform] = useState({ k: 1, x: 0, y: 0 });
  const rootRef = useRef(null);
  const updateTreeRef = useRef(null);
  const zoomBehaviorRef = useRef(null);

  // Initialize and maintain D3 Collapsible Tree
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = 1100;
    const dx = 42; // vertical separation between nodes
    const dy = 230; // horizontal separation between levels

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // SVG Layout Setup
    svg
      .attr('viewBox', [-80, -30, width + 180, 800])
      .attr('width', '100%')
      .attr('height', 'auto')
      .style('max-height', '650px')
      .style('background', '#0b1120')
      .style('border-radius', '12px');

    // Defs for glowing gradients and filters
    const defs = svg.append('defs');

    // Glow filter
    const filter = defs.append('filter')
      .attr('id', 'glow-tree')
      .attr('x', '-30%')
      .attr('y', '-30%')
      .attr('width', '160%')
      .attr('height', '160%');
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'blur');
    filter.append('feMerge')
      .selectAll('feMergeNode')
      .data(['blur', 'SourceGraphic'])
      .join('feMergeNode')
      .attr('in', d => d);

    // Zoom container
    const gContainer = svg.append('g').attr('class', 'main-tree-container');
    const gLink = gContainer.append('g').attr('class', 'links').attr('fill', 'none');
    const gNode = gContainer.append('g').attr('class', 'nodes').attr('cursor', 'pointer');

    // Zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        gContainer.attr('transform', event.transform);
        setZoomTransform(event.transform);
      });

    svg.call(zoom);
    zoomBehaviorRef.current = zoom;

    // Tree layout
    const tree = d3.tree().nodeSize([dx, dy]);

    // Build hierarchy
    const root = d3.hierarchy(HIERARCHY_DATA);
    root.x0 = 350;
    root.y0 = 0;

    // Collapse from depth 2 downwards by default to keep initial view clean
    const collapseSubtree = (d) => {
      if (d.children) {
        d._children = d.children;
        d._children.forEach(collapseSubtree);
        d.children = null;
      }
    };

    if (root.children) {
      root.children.forEach(child => {
        if (child.children) {
          child.children.forEach(collapseSubtree);
        }
      });
    }

    rootRef.current = root;

    let totalCount = 0;
    root.each(() => totalCount++);

    function update(source) {
      const duration = 500;
      const nodes = root.descendants().reverse();
      const links = root.links();

      // Compute tree layout
      tree(root);

      let left = root;
      let right = root;
      root.eachBefore(node => {
        if (node.x < left.x) left = node;
        if (node.x > right.x) right = node;
      });

      // Update node counts
      let visible = 0;
      let collapsed = 0;
      root.each(d => {
        visible++;
        if (d._children && d._children.length > 0) collapsed++;
      });
      setTreeStats({ totalNodes: totalCount, visibleNodes: visible, collapsedNodes: collapsed });

      // Node Join
      const node = gNode.selectAll('g.tree-node')
        .data(nodes, d => d.id || (d.id = ++source.uniqueId || Math.random()));

      // Enter new nodes at parent's previous position
      const nodeEnter = node.enter().append('g')
        .attr('class', 'tree-node')
        .attr('transform', () => `translate(${source.y0},${source.x0})`)
        .attr('fill-opacity', 0)
        .attr('stroke-opacity', 0)
        .on('click', (event, d) => {
          event.stopPropagation();
          if (d.children) {
            d._children = d.children;
            d.children = null;
          } else {
            d.children = d._children;
            d._children = null;
          }
          setSelectedNode(d.data);
          update(d);
        });

      // Node halo circle
      nodeEnter.append('circle')
        .attr('class', 'node-pulse')
        .attr('r', 16)
        .attr('fill', d => DEPTH_COLORS[d.depth] || '#06B6D4')
        .attr('fill-opacity', 0.15)
        .attr('stroke', d => DEPTH_COLORS[d.depth] || '#06B6D4')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '2,2');

      // Core Node circle
      nodeEnter.append('circle')
        .attr('class', 'node-core')
        .attr('r', d => d.depth === 0 ? 12 : d.depth === 1 ? 10 : 8)
        .attr('fill', d => d._children ? (DEPTH_COLORS[d.depth] || '#10B981') : '#0f172a')
        .attr('stroke', d => DEPTH_COLORS[d.depth] || '#10B981')
        .attr('stroke-width', 2.5)
        .attr('filter', 'url(#glow-tree)');

      // Plus / minus indicator for collapsible nodes
      nodeEnter.append('text')
        .attr('class', 'node-icon')
        .attr('dy', '0.35em')
        .attr('text-anchor', 'middle')
        .attr('font-size', '9px')
        .attr('font-weight', 'bold')
        .attr('fill', d => d._children ? '#0f172a' : (DEPTH_COLORS[d.depth] || '#fff'))
        .text(d => d._children ? '+' : d.children ? '−' : '●');

      // Subtree count badge for collapsed nodes
      nodeEnter.append('g')
        .attr('class', 'badge-group')
        .attr('transform', 'translate(14, -10)')
        .append('rect')
        .attr('rx', 6)
        .attr('ry', 6)
        .attr('width', 22)
        .attr('height', 14)
        .attr('fill', '#1e293b')
        .attr('stroke', d => DEPTH_COLORS[d.depth] || '#06B6D4')
        .attr('stroke-width', 1)
        .style('display', d => d._children ? 'block' : 'none');

      nodeEnter.select('g.badge-group')
        .append('text')
        .attr('x', 11)
        .attr('y', 10)
        .attr('text-anchor', 'middle')
        .attr('font-size', '9px')
        .attr('font-weight', 'bold')
        .attr('fill', '#38bdf8')
        .text(d => d._children ? d._children.length : '');

      // Node label with high-contrast halo stroke
      nodeEnter.append('text')
        .attr('class', 'node-label font-Aldrich')
        .attr('dy', '0.32em')
        .attr('x', d => d.children || d._children ? -18 : 18)
        .attr('text-anchor', d => d.children || d._children ? 'end' : 'start')
        .attr('paint-order', 'stroke fill')
        .attr('stroke', '#020617')
        .attr('stroke-width', 4)
        .attr('stroke-linejoin', 'round')
        .attr('fill', '#f8fafc')
        .attr('font-size', d => d.depth === 0 ? '14px' : d.depth === 1 ? '12px' : '11px')
        .attr('font-weight', d => d.depth <= 1 ? '700' : '500')
        .text(d => d.data.name);

      // Node category / budget subtitle
      nodeEnter.append('text')
        .attr('class', 'node-sublabel font-Aldrich')
        .attr('dy', '1.6em')
        .attr('x', d => d.children || d._children ? -18 : 18)
        .attr('text-anchor', d => d.children || d._children ? 'end' : 'start')
        .attr('paint-order', 'stroke fill')
        .attr('stroke', '#020617')
        .attr('stroke-width', 3)
        .attr('fill', '#94a3b8')
        .attr('font-size', '9px')
        .text(d => `${d.data.category} • ${d.data.budget}`);

      // Transition nodes to new positions
      const nodeUpdate = node.merge(nodeEnter).transition()
        .duration(duration)
        .attr('transform', d => `translate(${d.y},${d.x})`)
        .attr('fill-opacity', 1)
        .attr('stroke-opacity', 1);

      nodeUpdate.select('.node-core')
        .attr('fill', d => d._children ? (DEPTH_COLORS[d.depth] || '#10B981') : '#0f172a');

      nodeUpdate.select('.node-icon')
        .attr('fill', d => d._children ? '#0f172a' : (DEPTH_COLORS[d.depth] || '#fff'))
        .text(d => d._children ? '+' : d.children ? '−' : '●');

      nodeUpdate.select('g.badge-group')
        .style('display', d => d._children ? 'block' : 'none');

      nodeUpdate.select('g.badge-group text')
        .text(d => d._children ? d._children.length : '');

      // Transition exiting nodes to parent's new position
      const nodeExit = node.exit().transition()
        .duration(duration)
        .attr('transform', () => `translate(${source.y},${source.x})`)
        .attr('fill-opacity', 0)
        .attr('stroke-opacity', 0)
        .remove();

      nodeExit.select('circle').attr('r', 0);
      nodeExit.select('text').style('fill-opacity', 0);

      // Links update
      const link = gLink.selectAll('path.tree-link')
        .data(links, d => d.target.id);

      // Enter any new links at the parent's previous position
      const linkEnter = link.enter().append('path')
        .attr('class', 'tree-link')
        .attr('stroke', d => DEPTH_COLORS[d.source.depth] || '#334155')
        .attr('stroke-width', 1.5)
        .attr('stroke-opacity', 0.6)
        .attr('d', () => {
          const o = { x: source.x0, y: source.y0 };
          return d3.linkHorizontal().x(d => d.y).y(d => d.x)({ source: o, target: o });
        });

      // Transition links to their new position
      link.merge(linkEnter).transition()
        .duration(duration)
        .attr('stroke', d => DEPTH_COLORS[d.source.depth] || '#334155')
        .attr('stroke-opacity', 0.65)
        .attr('d', d3.linkHorizontal().x(d => d.y).y(d => d.x));

      // Transition exiting nodes to the parent's new position
      link.exit().transition()
        .duration(duration)
        .attr('d', () => {
          const o = { x: source.x, y: source.y };
          return d3.linkHorizontal().x(d => d.y).y(d => d.x)({ source: o, target: o });
        })
        .remove();

      // Stash the old positions for transition
      root.eachBefore(d => {
        d.x0 = d.x;
        d.y0 = d.y;
      });
    }

    updateTreeRef.current = update;
    update(root);

    // Initial root selection
    setSelectedNode(root.data);

  }, []);

  // Expand All handler
  const handleExpandAll = () => {
    if (!rootRef.current || !updateTreeRef.current) return;
    const expand = (d) => {
      if (d._children) {
        d.children = d._children;
        d._children = null;
      }
      if (d.children) d.children.forEach(expand);
    };
    expand(rootRef.current);
    updateTreeRef.current(rootRef.current);
  };

  // Collapse All handler
  const handleCollapseAll = () => {
    if (!rootRef.current || !updateTreeRef.current) return;
    const collapse = (d) => {
      if (d.children) {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = null;
      }
    };
    if (rootRef.current.children) {
      rootRef.current.children.forEach(collapse);
    }
    updateTreeRef.current(rootRef.current);
  };

  // Reset Zoom handler
  const handleResetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(750)
      .call(zoomBehaviorRef.current.transform, d3.zoomIdentity.translate(0, 0).scale(1));
  };

  return (
    <div ref={containerRef} className="w-full flex flex-col gap-4 font-Aldrich text-slate-100 p-2 sm:p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl">
      {/* Top Header & Interactive Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-lg shadow-inner">
            🌳
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
              Collapsible Healthcare Hierarchy
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                D3 Diagonal Tree
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Interactive node-link tree • Click circles to toggle child branches • Drag to pan & scroll to zoom
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExpandAll}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
          >
            Expand All ＋
          </button>
          <button
            onClick={handleCollapseAll}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
          >
            Collapse All −
          </button>
          <button
            onClick={handleResetZoom}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 transition-all cursor-pointer shadow-sm"
          >
            Reset View 🎯
          </button>
        </div>
      </div>

      {/* Depth Category Legend Badges */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900/60 px-4 py-2.5 rounded-xl border border-slate-800 text-xs">
        <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Depth Hierarchy:</span>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#10B981] shadow-sm shadow-emerald-500/50" />
          <span className="text-slate-200">System (Root)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#06B6D4] shadow-sm shadow-cyan-500/50" />
          <span className="text-slate-200">Directorate</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#8B5CF6] shadow-sm shadow-purple-500/50" />
          <span className="text-slate-200">Department</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#F59E0B] shadow-sm shadow-amber-500/50" />
          <span className="text-slate-200">Specialized Unit</span>
        </div>

        <div className="ml-auto flex items-center gap-4 text-slate-400 text-[11px]">
          <span>Nodes: <strong className="text-emerald-400">{treeStats.visibleNodes}</strong> / {treeStats.totalNodes}</span>
          <span>Collapsed Branches: <strong className="text-amber-400">{treeStats.collapsedNodes}</strong></span>
        </div>
      </div>

      {/* Main Interactive SVG Canvas */}
      <div className="relative w-full rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950/80 shadow-inner">
        <svg ref={svgRef} className="w-full h-auto select-none" />

        {/* Selected Node Details Floating Overlay */}
        {selectedNode && (
          <div className="absolute top-4 right-4 max-w-xs bg-slate-900/95 border border-slate-700/80 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2 mb-2">
              <span className="text-xs font-bold text-white truncate">{selectedNode.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {selectedNode.category}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 block">Annual Budget:</span>
                <span className="font-semibold text-emerald-400">{selectedNode.budget || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Personnel:</span>
                <span className="font-semibold text-cyan-400">{selectedNode.headcount ? `${selectedNode.headcount} staff` : 'N/A'}</span>
              </div>
            </div>
            {selectedNode.children && (
              <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                Active Sub-Units: <span className="text-amber-400 font-semibold">{selectedNode.children.length} active branches</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CollapsibleTree;
