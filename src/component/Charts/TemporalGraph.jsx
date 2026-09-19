// TemporalGraph.jsx
'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';

// Fresh vibrant color scheme mapped by functional categories
const CATEGORY_COLORS = {
  'Genomics & Diagnostics': '#10B981', // Fresh Emerald
  'Clinical Care & Wards': '#8B5CF6',  // Vivid Violet
  'Core Infrastructure': '#06B6D4',    // Electric Cyan
  'Emergency & Response': '#F59E0B',   // Warm Amber
  'Surveillance & Outreach': '#F43F5E' // Vibrant Rose
};

// Base date: 2024-05-10
const BASE_DATE = '2024-05-10';
const createTime = (hours, minutes) => {
  const h = String(hours).padStart(2, '0');
  const m = String(minutes).padStart(2, '0');
  return new Date(`${BASE_DATE}T${h}:${m}:00`).getTime();
};

const formatTimeLabel = (timestamp) => {
  const d = new Date(timestamp);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Rich temporal network dataset
const RAW_GRAPH_DATA = {
  nodes: [
    // Core Infrastructure
    { id: 'H1', label: 'Central Gateway', group: 'Core Infrastructure', role: 'Main Router', start: createTime(8, 0), end: createTime(18, 0), radius: 20 },
    { id: 'H2', label: 'EHR Data Core', group: 'Core Infrastructure', role: 'Data Lake', start: createTime(8, 0), end: createTime(18, 0), radius: 18 },
    { id: 'H3', label: 'Tele-Health Hub', group: 'Core Infrastructure', role: 'Virtual Care', start: createTime(9, 30), end: createTime(16, 30), radius: 16 },

    // Clinical Care & Wards
    { id: 'C1', label: 'Triage Alpha', group: 'Clinical Care & Wards', role: 'Emergency Intake', start: createTime(8, 0), end: createTime(14, 30), radius: 17 },
    { id: 'C2', label: 'Inpatient Ward A', group: 'Clinical Care & Wards', role: 'Acute Recovery', start: createTime(9, 0), end: createTime(18, 0), radius: 16 },
    { id: 'C3', label: 'Intensive Care Unit', group: 'Clinical Care & Wards', role: 'Critical Care', start: createTime(8, 0), end: createTime(18, 0), radius: 19 },
    { id: 'C4', label: 'Surgical Pavilion', group: 'Clinical Care & Wards', role: 'Operative Suites', start: createTime(10, 0), end: createTime(17, 30), radius: 17 },

    // Genomics & Diagnostics
    { id: 'G1', label: 'Genomics Hub', group: 'Genomics & Diagnostics', role: 'Sequencing Lab', start: createTime(8, 30), end: createTime(16, 0), radius: 18 },
    { id: 'G2', label: 'Pathology Center', group: 'Genomics & Diagnostics', role: 'Specimen Analysis', start: createTime(8, 30), end: createTime(17, 0), radius: 16 },
    { id: 'G3', label: 'Viral Screening', group: 'Genomics & Diagnostics', role: 'Rapid PCR Unit', start: createTime(9, 0), end: createTime(15, 30), radius: 15 },
    { id: 'G4', label: 'Bio-Analytics Lab', group: 'Genomics & Diagnostics', role: 'Metabolomics', start: createTime(10, 30), end: createTime(18, 0), radius: 16 },

    // Emergency & Response
    { id: 'E1', label: 'Rapid Dispatch', group: 'Emergency & Response', role: 'Paramedic Comms', start: createTime(8, 30), end: createTime(15, 0), radius: 16 },
    { id: 'E2', label: 'Mobile Med Unit 1', group: 'Emergency & Response', role: 'Field Clinic', start: createTime(10, 0), end: createTime(16, 30), radius: 15 },
    { id: 'E3', label: 'Mobile Med Unit 2', group: 'Emergency & Response', role: 'Specialized Transit', start: createTime(11, 0), end: createTime(17, 30), radius: 15 },
    { id: 'E4', label: 'Trauma Resupply', group: 'Emergency & Response', role: 'Pharma Logistics', start: createTime(11, 30), end: createTime(18, 0), radius: 15 },

    // Surveillance & Outreach
    { id: 'S1', label: 'Regional Tracker', group: 'Surveillance & Outreach', role: 'Epidemic Monitor', start: createTime(8, 0), end: createTime(18, 0), radius: 18 },
    { id: 'S2', label: 'Field Surveillance', group: 'Surveillance & Outreach', role: 'Outbreak Scout', start: createTime(9, 30), end: createTime(15, 30), radius: 15 },
    { id: 'S3', label: 'Outreach Clinic', group: 'Surveillance & Outreach', role: 'Community Testing', start: createTime(10, 0), end: createTime(17, 0), radius: 16 }
  ],
  links: [
    // Core Backbone
    { source: 'H1', target: 'H2', start: createTime(8, 0), end: createTime(18, 0), type: 'Data Stream', strength: 2 },
    { source: 'H1', target: 'C3', start: createTime(8, 0), end: createTime(18, 0), type: 'Critical Telemetry', strength: 3 },
    { source: 'H1', target: 'C1', start: createTime(8, 0), end: createTime(14, 30), type: 'Patient Intake', strength: 2 },
    { source: 'H1', target: 'S1', start: createTime(8, 0), end: createTime(18, 0), type: 'Epidemic Feed', strength: 2 },
    { source: 'H2', target: 'G1', start: createTime(8, 30), end: createTime(16, 0), type: 'Genomic Pipeline', strength: 2 },
    { source: 'H2', target: 'G2', start: createTime(8, 30), end: createTime(17, 0), type: 'Pathology Records', strength: 2 },
    { source: 'H3', target: 'C2', start: createTime(9, 30), end: createTime(16, 0), type: 'Remote Rounds', strength: 1.5 },
    { source: 'H3', target: 'S3', start: createTime(10, 0), end: createTime(16, 30), type: 'Tele-Consult', strength: 1.5 },

    // Clinical Interactions
    { source: 'C1', target: 'C2', start: createTime(9, 0), end: createTime(14, 30), type: 'Patient Transfer', strength: 2.5 },
    { source: 'C1', target: 'C3', start: createTime(8, 30), end: createTime(14, 0), type: 'ICU Escalation', strength: 3 },
    { source: 'C1', target: 'G3', start: createTime(9, 0), end: createTime(14, 0), type: 'Rapid Swab Test', strength: 2 },
    { source: 'C2', target: 'C4', start: createTime(10, 30), end: createTime(17, 0), type: 'Surgical Referral', strength: 2 },
    { source: 'C3', target: 'C4', start: createTime(11, 0), end: createTime(17, 30), type: 'Post-Op Transfer', strength: 2.5 },

    // Diagnostics & Genomics
    { source: 'G1', target: 'G2', start: createTime(8, 30), end: createTime(16, 0), type: 'Cross Validation', strength: 1.5 },
    { source: 'G2', target: 'C3', start: createTime(9, 0), end: createTime(17, 0), type: 'Lab Biopsy Result', strength: 2 },
    { source: 'G3', target: 'S1', start: createTime(9, 30), end: createTime(15, 30), type: 'Positive Cluster', strength: 2.5 },
    { source: 'G4', target: 'G1', start: createTime(10, 30), end: createTime(16, 0), type: 'Bioinformatics', strength: 1.5 },
    { source: 'G4', target: 'H2', start: createTime(11, 0), end: createTime(18, 0), type: 'Data Sync', strength: 2 },

    // Emergency & Response
    { source: 'E1', target: 'C1', start: createTime(8, 30), end: createTime(14, 30), type: 'Ambulance Arrival', strength: 3 },
    { source: 'E1', target: 'H1', start: createTime(8, 30), end: createTime(15, 0), type: 'CAD GPS Alert', strength: 1.5 },
    { source: 'E2', target: 'S2', start: createTime(10, 0), end: createTime(15, 30), type: 'Cluster Containment', strength: 2 },
    { source: 'E2', target: 'C1', start: createTime(10, 30), end: createTime(14, 0), type: 'Field Admission', strength: 2 },
    { source: 'E3', target: 'C3', start: createTime(11, 30), end: createTime(17, 0), type: 'Critical Transfer', strength: 2.5 },
    { source: 'E4', target: 'C3', start: createTime(12, 0), end: createTime(17, 30), type: 'Plasma & O2 Delivery', strength: 2 },
    { source: 'E4', target: 'C4', start: createTime(12, 30), end: createTime(17, 30), type: 'Surgical Kits', strength: 1.5 },

    // Surveillance & Outreach
    { source: 'S1', target: 'S2', start: createTime(9, 30), end: createTime(15, 30), type: 'Contact Tracing', strength: 2 },
    { source: 'S2', target: 'S3', start: createTime(10, 0), end: createTime(15, 30), type: 'Mobile Outreach', strength: 1.5 },
    { source: 'S3', target: 'G3', start: createTime(10, 30), end: createTime(15, 0), type: 'Batch Sampling', strength: 2 }
  ]
};

const START_TIME = createTime(8, 0);
const END_TIME = createTime(18, 0);
const TIME_STEP_MS = 15 * 60 * 1000; // 15 min per step

const TemporalGraph = ({ width = 880, height = 540 }) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  // Playback & Filtering state
  const [currentTime, setCurrentTime] = useState(createTime(10, 30));
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [displayMode, setDisplayMode] = useState('window'); // 'window' or 'cumulative'
  const [showLabels, setShowLabels] = useState(true);
  const [dimInactive, setDimInactive] = useState(true);

  // Simulation persistent refs
  const simulationRef = useRef(null);
  const gRef = useRef(null);
  const zoomBehaviorRef = useRef(null);

  // Deep clone data to keep D3 simulation mutations safe
  const graphData = useMemo(() => {
    return {
      nodes: RAW_GRAPH_DATA.nodes.map(n => ({ ...n })),
      links: RAW_GRAPH_DATA.links.map(l => ({ ...l }))
    };
  }, []);

  // Compute active status for each node and link
  const temporalStatus = useMemo(() => {
    const activeNodeMap = new Map();
    const isCumulative = displayMode === 'cumulative';

    graphData.nodes.forEach(node => {
      const isActive = isCumulative
        ? node.start <= currentTime
        : (node.start <= currentTime && node.end >= currentTime);
      activeNodeMap.set(node.id, isActive);
    });

    const activeLinkMap = new Map();
    graphData.links.forEach((link, idx) => {
      const sId = typeof link.source === 'object' ? link.source.id : link.source;
      const tId = typeof link.target === 'object' ? link.target.id : link.target;
      const nodesActive = activeNodeMap.get(sId) && activeNodeMap.get(tId);
      const isLinkTimeActive = isCumulative
        ? link.start <= currentTime
        : (link.start <= currentTime && link.end >= currentTime);
      activeLinkMap.set(idx, nodesActive && isLinkTimeActive);
    });

    let activeNodesCount = 0;
    activeNodeMap.forEach(v => { if (v) activeNodesCount++; });

    let activeLinksCount = 0;
    activeLinkMap.forEach(v => { if (v) activeLinksCount++; });

    return { activeNodeMap, activeLinkMap, activeNodesCount, activeLinksCount };
  }, [graphData, currentTime, displayMode]);

  // Group summary for legends
  const groupStats = useMemo(() => {
    const stats = {};
    Object.keys(CATEGORY_COLORS).forEach(cat => {
      stats[cat] = { total: 0, active: 0, color: CATEGORY_COLORS[cat] };
    });

    graphData.nodes.forEach(n => {
      if (stats[n.group]) {
        stats[n.group].total += 1;
        if (temporalStatus.activeNodeMap.get(n.id)) {
          stats[n.group].active += 1;
        }
      }
    });

    return stats;
  }, [graphData, temporalStatus]);

  // Initialize D3 Force Simulation once
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // SVG Defs: Gradients, Markers & Glow Filters
    const defs = svg.append('defs');

    // Glow filter for fresh aesthetic
    const filter = defs.append('filter')
      .attr('id', 'node-glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');

    filter.append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'coloredBlur');

    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Subtle drop shadow filter for text labels
    const textFilter = defs.append('filter')
      .attr('id', 'text-bg')
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('width', '140%')
      .attr('height', '140%');

    textFilter.append('feDropShadow')
      .attr('dx', '0')
      .attr('dy', '1')
      .attr('stdDeviation', '2')
      .attr('flood-color', '#0f172a')
      .attr('flood-opacity', '0.9');

    // Arrow markers for links
    Object.entries(CATEGORY_COLORS).forEach(([category, color], idx) => {
      defs.append('marker')
        .attr('id', `arrow-${idx}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 22)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-4L8,0L0,4')
        .attr('fill', color)
        .attr('opacity', 0.8);
    });

    // Main Zoomable Group
    const g = svg.append('g').attr('class', 'chart-viewport');
    gRef.current = g;

    // Subgroups for layering
    const linkGroup = g.append('g').attr('class', 'links-layer');
    const nodeGlowGroup = g.append('g').attr('class', 'node-glow-layer');
    const nodeGroup = g.append('g').attr('class', 'nodes-layer');
    const labelGroup = g.append('g').attr('class', 'labels-layer');

    // D3 Zoom
    const zoom = d3.zoom()
      .scaleExtent([0.4, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);
    zoomBehaviorRef.current = zoom;

    // Force Simulation
    const simulation = d3.forceSimulation(graphData.nodes)
      .force('link', d3.forceLink(graphData.links).id(d => d.id).distance(110).strength(0.6))
      .force('charge', d3.forceManyBody().strength(-300).distanceMax(400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide().radius(d => d.radius + 20).iterations(2))
      .force('x', d3.forceX(width / 2).strength(0.04))
      .force('y', d3.forceY(height / 2).strength(0.04));

    simulationRef.current = simulation;

    // Drag helper
    const drag = () => d3.drag()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    // Create persistent link DOM
    const links = linkGroup.selectAll('line')
      .data(graphData.links)
      .enter()
      .append('line')
      .attr('stroke', d => {
        const s = typeof d.source === 'object' ? d.source : graphData.nodes.find(n => n.id === d.source);
        return CATEGORY_COLORS[s?.group] || '#64748b';
      })
      .attr('stroke-width', d => (d.strength || 1.5) * 1.4)
      .attr('stroke-linecap', 'round');

    // Create persistent glow aura circles
    const glowCircles = nodeGlowGroup.selectAll('circle')
      .data(graphData.nodes)
      .enter()
      .append('circle')
      .attr('r', d => d.radius + 6)
      .attr('fill', d => CATEGORY_COLORS[d.group])
      .attr('opacity', 0.25)
      .attr('filter', 'url(#node-glow)');

    // Create persistent node groups
    const nodeElements = nodeGroup.selectAll('g.node-unit')
      .data(graphData.nodes)
      .enter()
      .append('g')
      .attr('class', 'node-unit')
      .style('cursor', 'pointer')
      .call(drag());

    // Outer ring
    nodeElements.append('circle')
      .attr('class', 'ring')
      .attr('r', d => d.radius + 3)
      .attr('fill', 'none')
      .attr('stroke', d => CATEGORY_COLORS[d.group])
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.9);

    // Inner filled circle
    nodeElements.append('circle')
      .attr('class', 'core')
      .attr('r', d => d.radius)
      .attr('fill', d => CATEGORY_COLORS[d.group])
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2);

    // Node center indicator
    nodeElements.append('circle')
      .attr('class', 'dot')
      .attr('r', 3.5)
      .attr('fill', '#ffffff');

    // Text labels
    const labels = labelGroup.selectAll('g.label-unit')
      .data(graphData.nodes)
      .enter()
      .append('g')
      .attr('class', 'label-unit')
      .style('pointer-events', 'none');

    // Node Title Text
    labels.append('text')
      .attr('class', 'title-text')
      .attr('dy', d => d.radius + 15)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('fill', '#f8fafc')
      .attr('filter', 'url(#text-bg)')
      .text(d => d.label);

    // Node Subtitle Role Text
    labels.append('text')
      .attr('class', 'role-text')
      .attr('dy', d => d.radius + 27)
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px')
      .attr('font-weight', '500')
      .attr('fill', '#94a3b8')
      .text(d => d.role);

    // Mouse interactions
    nodeElements
      .on('mouseenter', (event, d) => {
        setHoveredNode(d);
      })
      .on('mouseleave', () => {
        setHoveredNode(null);
      });

    // Simulation tick callback
    simulation.on('tick', () => {
      links
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      glowCircles
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);

      nodeElements
        .attr('transform', d => `translate(${d.x},${d.y})`);

      labels
        .attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [graphData, width, height]);

  // Update visual states (transitions, opacity, colors, filters) whenever temporal state or selections change
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    const { activeNodeMap, activeLinkMap } = temporalStatus;

    // Compute neighbors for hovered node highlight
    const neighborSet = new Set();
    if (hoveredNode) {
      neighborSet.add(hoveredNode.id);
      graphData.links.forEach(l => {
        const sId = typeof l.source === 'object' ? l.source.id : l.source;
        const tId = typeof l.target === 'object' ? l.target.id : l.target;
        if (sId === hoveredNode.id) neighborSet.add(tId);
        if (tId === hoveredNode.id) neighborSet.add(sId);
      });
    }

    // 1. Update Nodes & Glows
    svg.selectAll('.nodes-layer .node-unit').each(function(d) {
      const nodeEl = d3.select(this);
      const isActive = activeNodeMap.get(d.id);
      const isCategoryMatch = !selectedGroup || d.group === selectedGroup;
      const isNeighbor = !hoveredNode || neighborSet.has(d.id);

      let targetOpacity = 1;
      let display = 'inline';

      if (!isActive) {
        if (!dimInactive) {
          display = 'none';
          targetOpacity = 0;
        } else {
          targetOpacity = 0.15;
        }
      } else if (!isCategoryMatch || !isNeighbor) {
        targetOpacity = 0.22;
      }

      nodeEl.style('display', display)
        .transition().duration(250)
        .style('opacity', targetOpacity);

      // Pulse ring for actively hovered or selected
      const isHighlight = hoveredNode?.id === d.id;
      nodeEl.select('.ring')
        .transition().duration(200)
        .attr('r', isHighlight ? d.radius + 6 : d.radius + 3)
        .attr('stroke-width', isHighlight ? 3.5 : 2)
        .attr('stroke', isHighlight ? '#ffffff' : CATEGORY_COLORS[d.group]);
    });

    // 2. Update Glow Aura
    svg.selectAll('.node-glow-layer circle').each(function(d) {
      const isActive = activeNodeMap.get(d.id);
      const isCategoryMatch = !selectedGroup || d.group === selectedGroup;
      const isNeighbor = !hoveredNode || neighborSet.has(d.id);

      const isVisible = isActive && isCategoryMatch && isNeighbor;
      d3.select(this)
        .transition().duration(250)
        .style('opacity', isVisible ? (hoveredNode?.id === d.id ? 0.65 : 0.3) : 0);
    });

    // 3. Update Links
    svg.selectAll('.links-layer line').each(function(d, idx) {
      const isLinkActive = activeLinkMap.get(idx);
      const sId = typeof d.source === 'object' ? d.source.id : d.source;
      const tId = typeof d.target === 'object' ? d.target.id : d.target;

      const isHoverConnected = hoveredNode
        ? (sId === hoveredNode.id || tId === hoveredNode.id)
        : true;

      const isCatMatch = !selectedGroup ||
        (d.source?.group === selectedGroup && d.target?.group === selectedGroup);

      let linkOpacity = 0.55;
      let strokeWidth = (d.strength || 1.5) * 1.3;

      if (!isLinkActive) {
        linkOpacity = dimInactive ? 0.04 : 0;
      } else if (hoveredNode && !isHoverConnected) {
        linkOpacity = 0.08;
      } else if (selectedGroup && !isCatMatch) {
        linkOpacity = 0.12;
      } else if (hoveredNode && isHoverConnected) {
        linkOpacity = 0.95;
        strokeWidth = (d.strength || 1.5) * 2.2;
      }

      d3.select(this)
        .transition().duration(250)
        .attr('stroke-opacity', linkOpacity)
        .attr('stroke-width', strokeWidth);
    });

    // 4. Update Labels
    svg.selectAll('.labels-layer .label-unit').each(function(d) {
      const labelEl = d3.select(this);
      const isActive = activeNodeMap.get(d.id);
      const isCategoryMatch = !selectedGroup || d.group === selectedGroup;
      const isNeighbor = !hoveredNode || neighborSet.has(d.id);

      let visible = showLabels && isActive && isCategoryMatch && isNeighbor;
      if (!dimInactive && !isActive) visible = false;

      labelEl
        .transition().duration(200)
        .style('opacity', visible ? 1 : 0);
    });
  }, [temporalStatus, selectedGroup, hoveredNode, showLabels, dimInactive, graphData]);

  // Timeline Auto-Play Timer
  useEffect(() => {
    let timerId = null;
    if (isPlaying) {
      timerId = setInterval(() => {
        setCurrentTime(prev => {
          const next = prev + TIME_STEP_MS;
          if (next > END_TIME) {
            return START_TIME; // Loop back to start
          }
          return next;
        });
      }, 700 / playbackSpeed);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [isPlaying, playbackSpeed]);

  // Navigation handlers
  const handleTogglePlay = () => setIsPlaying(p => !p);
  const handleResetTime = () => {
    setIsPlaying(false);
    setCurrentTime(START_TIME);
  };
  const handleStepBack = () => {
    setCurrentTime(prev => Math.max(START_TIME, prev - TIME_STEP_MS));
  };
  const handleStepForward = () => {
    setCurrentTime(prev => Math.min(END_TIME, prev + TIME_STEP_MS));
  };

  const handleZoomReset = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current)
        .transition().duration(400)
        .call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
    }
  };

  const handleZoomIn = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current)
        .transition().duration(300)
        .call(zoomBehaviorRef.current.scaleBy, 1.3);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current)
        .transition().duration(300)
        .call(zoomBehaviorRef.current.scaleBy, 0.77);
    }
  };

  // Compute node metrics for inspector
  const hoveredNodeDetails = useMemo(() => {
    if (!hoveredNode) return null;
    const connectedLinks = graphData.links.filter(l => {
      const sId = typeof l.source === 'object' ? l.source.id : l.source;
      const tId = typeof l.target === 'object' ? l.target.id : l.target;
      return sId === hoveredNode.id || tId === hoveredNode.id;
    });

    const isActive = temporalStatus.activeNodeMap.get(hoveredNode.id);

    return {
      ...hoveredNode,
      isActive,
      connectionsCount: connectedLinks.length,
      links: connectedLinks
    };
  }, [hoveredNode, graphData, temporalStatus]);

  return (
    <div ref={containerRef} className="w-full flex flex-col rounded-2xl bg-slate-950 text-slate-100 border border-slate-800 shadow-2xl overflow-hidden font-sans select-none">
      {/* ── TOP HEADER / CONTROLS BAR ── */}
      <div className="px-5 py-4 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        {/* Title & Live Status */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30 text-indigo-400">
            <svg className="w-5 h-5 animate-spin-slow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 3v9l5 3" />
            </svg>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isPlaying ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isPlaying ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base tracking-wide text-white">Temporal Network Dynamics</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Force-Directed D3
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive timeline simulation &bull; Time: <span className="text-cyan-400 font-mono font-medium">{formatTimeLabel(currentTime)}</span>
            </p>
          </div>
        </div>

        {/* Quick Stats Badges */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-slate-400">Active Nodes:</span>
            <span className="font-semibold text-emerald-300 font-mono">{temporalStatus.activeNodesCount} / {graphData.nodes.length}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span className="text-slate-400">Active Links:</span>
            <span className="font-semibold text-cyan-300 font-mono">{temporalStatus.activeLinksCount} / {graphData.links.length}</span>
          </div>
        </div>

        {/* Zoom & View Controls */}
        <div className="flex items-center gap-1.5 bg-slate-800/60 p-1 rounded-lg border border-slate-700/50">
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className="w-8 h-8 flex items-center justify-center rounded-md text-slate-300 hover:text-white hover:bg-slate-700/80 transition-colors text-sm font-bold"
          >
            +
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className="w-8 h-8 flex items-center justify-center rounded-md text-slate-300 hover:text-white hover:bg-slate-700/80 transition-colors text-sm font-bold"
          >
            &minus;
          </button>
          <button
            onClick={handleZoomReset}
            title="Reset View"
            className="w-8 h-8 flex items-center justify-center rounded-md text-slate-300 hover:text-white hover:bg-slate-700/80 transition-colors text-xs font-semibold"
          >
            ⟲
          </button>
        </div>
      </div>

      {/* ── TIMELINE SCRUBBER & PLAYBACK CONTROLS ── */}
      <div className="px-5 py-3 bg-slate-900/40 border-b border-slate-800/70 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Playback Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetTime}
            title="Rewind to Start"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" />
            </svg>
          </button>
          <button
            onClick={handleStepBack}
            title="Step Back (15m)"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleTogglePlay}
            className={`px-4 py-2 rounded-lg font-semibold text-xs flex items-center gap-2 transition shadow-lg ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-cyan-500/20'
            }`}
          >
            {isPlaying ? (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                <span>Pause</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                <span>Play Simulation</span>
              </>
            )}
          </button>
          <button
            onClick={handleStepForward}
            title="Step Forward (15m)"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Speed Selector */}
          <div className="flex items-center rounded-lg bg-slate-800/80 border border-slate-700/60 p-0.5 ml-2">
            {[1, 2, 4].map(speed => (
              <button
                key={speed}
                onClick={() => setPlaybackSpeed(speed)}
                className={`px-2 py-1 text-[11px] font-semibold rounded ${
                  playbackSpeed === speed
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Timeline Slider with Active Progress */}
        <div className="flex-1 w-full max-w-md flex flex-col gap-1">
          <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono">
            <span>{formatTimeLabel(START_TIME)}</span>
            <span className="font-semibold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-700/50">
              {formatTimeLabel(currentTime)}
            </span>
            <span>{formatTimeLabel(END_TIME)}</span>
          </div>
          <div className="relative flex items-center">
            <input
              type="range"
              min={START_TIME}
              max={END_TIME}
              step={TIME_STEP_MS}
              value={currentTime}
              onChange={e => setCurrentTime(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
            />
          </div>
        </div>

        {/* View Options */}
        <div className="flex items-center gap-2">
          {/* Cumulative vs Window */}
          <button
            onClick={() => setDisplayMode(m => m === 'window' ? 'cumulative' : 'window')}
            title="Toggle between instant active window and cumulative history"
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium border transition bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200"
          >
            Mode: <span className="font-bold text-cyan-400 capitalize">{displayMode}</span>
          </button>

          {/* Labels Toggle */}
          <button
            onClick={() => setShowLabels(s => !s)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
              showLabels
                ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-200'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            Labels: {showLabels ? 'ON' : 'OFF'}
          </button>

          {/* Dim vs Hide */}
          <button
            onClick={() => setDimInactive(d => !d)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
              dimInactive
                ? 'bg-slate-800 border-slate-700 text-slate-300'
                : 'bg-amber-600/30 border-amber-500/50 text-amber-200'
            }`}
          >
            {dimInactive ? 'Ghost Inactive' : 'Hide Inactive'}
          </button>
        </div>
      </div>

      {/* ── FRESH VIBRANT CATEGORY LEGEND BAR ── */}
      <div className="px-5 py-2.5 bg-slate-900/30 border-b border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400 font-medium">
          <span>Categories:</span>
          {selectedGroup && (
            <button
              onClick={() => setSelectedGroup(null)}
              className="text-[10px] text-cyan-400 underline hover:text-cyan-300 ml-1"
            >
              Clear Filter
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {Object.entries(groupStats).map(([group, stat]) => {
            const isSelected = selectedGroup === group;
            return (
              <button
                key={group}
                onClick={() => setSelectedGroup(isSelected ? null : group)}
                className={`flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs font-medium transition-all ${
                  isSelected
                    ? 'ring-2 ring-white/50 shadow-md'
                    : 'hover:border-slate-600 bg-slate-800/50'
                }`}
                style={{
                  borderColor: isSelected ? stat.color : `${stat.color}40`,
                  backgroundColor: isSelected ? `${stat.color}25` : undefined
                }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shadow-sm"
                  style={{ backgroundColor: stat.color }}
                />
                <span className="text-slate-200">{group}</span>
                <span
                  className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold"
                  style={{ backgroundColor: `${stat.color}30`, color: stat.color }}
                >
                  {stat.active}/{stat.total}
                </span>
              </button>
            );
          })}
        </div>

        {/* Link Legend */}
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-4 h-0.5 bg-cyan-400 inline-block"></span> Active Link
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-0.5 bg-slate-700 inline-block"></span> Inactive Link
          </span>
        </div>
      </div>

      {/* ── MAIN SVG CANVAS CONTAINER ── */}
      <div className="relative w-full flex-1 bg-radial from-slate-900 via-slate-950 to-black overflow-hidden flex items-center justify-center min-h-[500px]">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#94a3b8 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />

        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full max-h-[600px] cursor-grab active:cursor-grabbing"
          style={{ width: '100%', height: '100%', display: 'block' }}
        />

        {/* ── FLOATING NODE INSPECTOR CARD (ON HOVER) ── */}
        {hoveredNodeDetails && (
          <div className="absolute top-4 right-4 z-20 w-72 p-4 rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-700/80 shadow-2xl text-xs flex flex-col gap-2.5 pointer-events-none animate-fadeIn">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2">
              <div>
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${CATEGORY_COLORS[hoveredNodeDetails.group]}25`,
                    color: CATEGORY_COLORS[hoveredNodeDetails.group]
                  }}
                >
                  {hoveredNodeDetails.group}
                </span>
                <h4 className="font-bold text-sm text-white mt-1">{hoveredNodeDetails.label}</h4>
                <p className="text-[11px] text-slate-400">{hoveredNodeDetails.role}</p>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono ${
                  hoveredNodeDetails.isActive
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {hoveredNodeDetails.isActive ? 'Active' : 'Offline'}
              </span>
            </div>

            {/* Timings */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-slate-800/60 p-2 rounded-lg border border-slate-700/50">
                <span className="text-slate-400 block text-[10px]">Active Window</span>
                <span className="font-mono text-cyan-300">
                  {formatTimeLabel(hoveredNodeDetails.start)} - {formatTimeLabel(hoveredNodeDetails.end)}
                </span>
              </div>
              <div className="bg-slate-800/60 p-2 rounded-lg border border-slate-700/50">
                <span className="text-slate-400 block text-[10px]">Total Edges</span>
                <span className="font-mono text-indigo-300 font-bold">{hoveredNodeDetails.connectionsCount} links</span>
              </div>
            </div>

            {/* Connected Neighbors Preview */}
            <div>
              <span className="text-[10px] text-slate-400 block mb-1 font-semibold uppercase tracking-wider">
                Active Connections ({hoveredNodeDetails.links.length}):
              </span>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                {hoveredNodeDetails.links.map((link, idx) => {
                  const sId = typeof link.source === 'object' ? link.source.id : link.source;
                  const tId = typeof link.target === 'object' ? link.target.id : link.target;
                  const otherId = sId === hoveredNodeDetails.id ? tId : sId;
                  const otherNode = graphData.nodes.find(n => n.id === otherId);

                  return (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] border border-slate-700 flex items-center gap-1"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: CATEGORY_COLORS[otherNode?.group] || '#38bdf8' }}
                      />
                      {otherNode?.label || otherId}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Bottom helper tip */}
        <div className="absolute bottom-3 left-4 text-[11px] text-slate-500 pointer-events-none flex items-center gap-2">
          <span>💡 Drag nodes to pin position &bull; Scroll to zoom &bull; Hover node for telemetry</span>
        </div>
      </div>
    </div>
  );
};

export default TemporalGraph;
