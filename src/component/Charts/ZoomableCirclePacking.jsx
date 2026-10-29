// ZoomableCirclePacking.jsx
'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';

const CLUSTER_COLORS = {
  'Digital Infrastructure': '#06B6D4', // Cyan
  'Clinical Science': '#10B981',       // Emerald
  'Pharma & Vaccines': '#8B5CF6',      // Violet
  'Emergency Care': '#F59E0B',         // Amber
  'Genomic Mapping': '#F43F5E'         // Rose
};

const PACK_DATA = {
  name: 'Global Life Sciences',
  children: [
    {
      name: 'Digital Infrastructure',
      children: [
        {
          name: 'Telemetry & IoT',
          children: [
            { name: 'Ward Sensor Grid', value: 320 },
            { name: 'ICU Vitals Stream', value: 410 },
            { name: 'Telemetry Gateway', value: 280 }
          ]
        },
        {
          name: 'Cloud Lakehouse',
          children: [
            { name: 'EHR Clinical Lake', value: 520 },
            { name: 'Imaging PACS Archive', value: 610 },
            { name: 'Realtime Analytics', value: 390 }
          ]
        }
      ]
    },
    {
      name: 'Clinical Science',
      children: [
        {
          name: 'Acute Medicine',
          children: [
            { name: 'Cardio Intensive Care', value: 560 },
            { name: 'Neuro Critical Unit', value: 480 },
            { name: 'Trauma Surgery Core', value: 530 }
          ]
        },
        {
          name: 'Diagnostics',
          children: [
            { name: 'Molecular Pathology', value: 440 },
            { name: 'Spectral MRI Lab', value: 590 },
            { name: 'Automated Cytology', value: 350 }
          ]
        }
      ]
    },
    {
      name: 'Pharma & Vaccines',
      children: [
        {
          name: 'Therapeutics',
          children: [
            { name: 'Targeted Oncology', value: 620 },
            { name: 'Monoclonal Antibodies', value: 540 },
            { name: 'Cell Therapy Unit', value: 470 }
          ]
        },
        {
          name: 'Vaccinology',
          children: [
            { name: 'mRNA Platform', value: 580 },
            { name: 'Viral Vector R&D', value: 420 },
            { name: 'Cold-Chain Depot', value: 360 }
          ]
        }
      ]
    },
    {
      name: 'Emergency Care',
      children: [
        {
          name: 'Rapid Dispatch',
          children: [
            { name: 'Medevac Aviation', value: 510 },
            { name: 'Mobile ICU Fleet', value: 430 },
            { name: 'Triage Response', value: 370 }
          ]
        }
      ]
    },
    {
      name: 'Genomic Mapping',
      children: [
        {
          name: 'Sequencing Cores',
          children: [
            { name: 'Whole Genome Array', value: 640 },
            { name: 'Transcriptomics Lab', value: 490 },
            { name: 'Epigenetic Profiling', value: 410 }
          ]
        }
      ]
    }
  ]
};

export default function ZoomableCirclePacking({ width = 880, height = 540 }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  const [breadcrumbs, setBreadcrumbs] = useState(['Global Life Sciences']);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [zoomDepth, setZoomDepth] = useState(0);
  const [selectedCluster, setSelectedCluster] = useState(null);

  const rootHierarchy = useMemo(() => {
    return d3.hierarchy(PACK_DATA)
      .sum(d => d.value || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));
  }, []);

  const clusterStats = useMemo(() => {
    const stats = {};
    Object.keys(CLUSTER_COLORS).forEach(c => {
      stats[c] = { total: 0, count: 0, color: CLUSTER_COLORS[c] };
    });
    (rootHierarchy.children || []).forEach(child => {
      if (stats[child.data.name]) {
        stats[child.data.name].total = child.value || 0;
        stats[child.data.name].count = child.leaves().length;
      }
    });
    return stats;
  }, [rootHierarchy]);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const diameter = Math.min(width, height) - 20;

    const pack = d3.pack()
      .size([diameter, diameter])
      .padding(4);

    const root = pack(rootHierarchy);
    let focus = root;
    let view;

    const getColor = (d) => {
      if (d.depth === 0) return '#0f172a';
      let curr = d;
      while (curr.depth > 1) curr = curr.parent;
      return CLUSTER_COLORS[curr.data.name] || '#38bdf8';
    };

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    // Circle Elements
    const circle = g.selectAll('circle')
      .data(root.descendants())
      .enter()
      .append('circle')
      .attr('class', d => d.parent ? (d.children ? 'node' : 'node node--leaf') : 'node node--root')
      .attr('fill', d => {
        if (d.depth === 0) return '#020617';
        return getColor(d);
      })
      .attr('fill-opacity', d => {
        if (d.depth === 0) return 0.2;
        if (!d.children) return 0.85;
        return 0.25;
      })
      .attr('stroke', d => {
        if (d.depth === 0) return '#334155';
        return getColor(d);
      })
      .attr('stroke-width', d => d.children ? 1.5 : 2)
      .style('cursor', d => d.children ? 'pointer' : 'default')
      .on('mouseenter', function(event, d) {
        if (d.depth > 0) {
          d3.select(this)
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 3);
          setHoveredNode(d);
        }
      })
      .on('mouseleave', function(event, d) {
        if (d.depth > 0) {
          d3.select(this)
            .attr('stroke', getColor(d))
            .attr('stroke-width', d.children ? 1.5 : 2);
          setHoveredNode(null);
        }
      })
      .on('click', (event, d) => {
        if (d.children && focus !== d) {
          zoom(event, d);
          event.stopPropagation();
        }
      });

    // Node Labels
    const text = g.selectAll('text')
      .data(root.descendants())
      .enter()
      .append('text')
      .attr('class', 'label')
      .style('fill-opacity', d => d.parent === root ? 1 : 0)
      .style('display', d => d.parent === root ? 'inline' : 'none')
      .attr('text-anchor', 'middle')
      .attr('font-size', d => d.children ? '12px' : '10px')
      .attr('font-weight', '700')
      .attr('fill', '#ffffff')
      .attr('style', 'paint-order: stroke fill; stroke: #020617; stroke-width: 3px; pointer-events: none;')
      .text(d => d.data.name);

    svg.on('click', (event) => zoom(event, root));

    zoomTo([root.x, root.y, root.r * 2]);

    function zoomTo(v) {
      const k = diameter / v[2];
      view = v;

      circle.attr('transform', d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
      circle.attr('r', d => d.r * k);

      text.attr('transform', d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
    }

    function zoom(event, d) {
      focus = d;
      setZoomDepth(d.depth);

      const crumbs = [];
      let curr = d;
      while (curr) {
        crumbs.unshift(curr.data.name);
        curr = curr.parent;
      }
      setBreadcrumbs(crumbs);

      const transition = svg.transition()
        .duration(750)
        .tween('zoom', () => {
          const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
          return t => zoomTo(i(t));
        });

      text
        .filter(function(d) { return d.parent === focus || this.style.display === 'inline'; })
        .transition(transition)
        .style('fill-opacity', d => d.parent === focus ? 1 : 0)
        .on('start', function(d) { if (d.parent === focus) this.style.display = 'inline'; })
        .on('end', function(d) { if (d.parent !== focus) this.style.display = 'none'; });
    }

    window.__circlePackZoomReset = () => zoom(null, root);

  }, [rootHierarchy, width, height]);

  return (
    <div ref={containerRef} className="w-full flex flex-col rounded-2xl bg-slate-950 text-slate-100 border border-slate-800 shadow-2xl overflow-hidden font-sans select-none">
      {/* Header */}
      <div className="px-5 py-3.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-sm">
            🫧
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-white tracking-wide">Zoomable Circle Packing</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Hierarchical Enclosure
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Click circle bubbles to smoothly zoom &bull; Click backdrop to zoom out
            </p>
          </div>
        </div>

        {/* Metrics Badges */}
        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center gap-2">
            <span className="text-slate-400">Total Enclosed:</span>
            <span className="font-mono font-bold text-emerald-400">${d3.format(',')(rootHierarchy.value || 0)}K</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center gap-2">
            <span className="text-slate-400">Depth:</span>
            <span className="font-mono font-bold text-cyan-400">Level {zoomDepth}</span>
          </div>
          <button
            onClick={() => window.__circlePackZoomReset && window.__circlePackZoomReset()}
            className="px-3 py-1.5 rounded-lg font-semibold text-xs bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500 shadow-md cursor-pointer transition"
          >
            ⟲ Reset Zoom
          </button>
        </div>
      </div>

      {/* Breadcrumb Bar */}
      <div className="px-5 py-2 bg-slate-900/50 border-b border-slate-800 flex items-center gap-1.5 text-xs overflow-x-auto">
        <span className="text-slate-400 font-medium">Path:</span>
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={crumb}>
            {idx > 0 && <span className="text-slate-600">/</span>}
            <span className={`px-2 py-0.5 rounded font-medium ${idx === breadcrumbs.length - 1 ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30' : 'text-slate-400'}`}>
              {crumb}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Cluster Legend Bar */}
      <div className="px-5 py-2 bg-slate-900/30 border-b border-slate-800/60 flex flex-wrap items-center gap-2 text-xs">
        {Object.entries(clusterStats).map(([cluster, stat]) => (
          <div
            key={cluster}
            className="flex items-center gap-2 px-2.5 py-1 rounded-full border border-slate-700/60 bg-slate-800/40"
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stat.color }} />
            <span className="text-slate-200">{cluster}</span>
            <span className="text-[10px] font-mono font-bold px-1.5 rounded" style={{ backgroundColor: `${stat.color}25`, color: stat.color }}>
              ${d3.format(',')(stat.total)}K
            </span>
          </div>
        ))}
      </div>

      {/* Canvas */}
      <div className="relative w-full flex-1 bg-radial from-slate-900 via-slate-950 to-black p-3 min-h-[500px] flex items-center justify-center">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full max-h-[540px]"
          style={{ width: '100%', height: '100%', display: 'block' }}
        />

        {/* Hover Inspector */}
        {hoveredNode && (
          <div className="absolute top-4 right-4 z-20 w-64 p-3 rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-700 shadow-2xl text-xs flex flex-col gap-1.5 pointer-events-none animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="font-bold text-white text-sm">{hoveredNode.data.name}</span>
              <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-purple-500/20 text-purple-300">
                ${hoveredNode.value || 0}K
              </span>
            </div>
            <div className="text-slate-400 text-[11px] flex justify-between">
              <span>Parent Circle:</span>
              <span className="text-slate-200 font-semibold">{hoveredNode.parent?.data.name || 'Root'}</span>
            </div>
            <div className="text-slate-400 text-[11px] flex justify-between">
              <span>Type:</span>
              <span className="text-cyan-300 font-semibold">{hoveredNode.children ? 'Parent Cluster' : 'Leaf Resource'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
