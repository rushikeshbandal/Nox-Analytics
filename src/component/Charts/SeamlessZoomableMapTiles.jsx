// SeamlessZoomableMapTiles.jsx
'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';

// Clinical outpost locations
const MEDICAL_OUTPOSTS = [
  { id: 'LDN', name: 'St. Thomas Acute Clinic', city: 'London', lat: 51.5074, lon: -0.1278, beds: 840, status: 'Active' },
  { id: 'PAR', name: 'Pitié-Salpêtrière Center', city: 'Paris', lat: 48.8566, lon: 2.3522, beds: 920, status: 'Active' },
  { id: 'BER', name: 'Charité University Hub', city: 'Berlin', lat: 52.5200, lon: 13.4050, beds: 780, status: 'Surge' },
  { id: 'AMS', name: 'Amsterdam Medical Core', city: 'Amsterdam', lat: 52.3676, lon: 4.9041, beds: 650, status: 'Active' },
  { id: 'GEN', name: 'Geneva WHO Strategic Center', city: 'Geneva', lat: 46.2044, lon: 6.1432, beds: 1100, status: 'Active' },
  { id: 'ROM', name: 'Policlinico Gemelli', city: 'Rome', lat: 41.9028, lon: 12.4964, beds: 810, status: 'Active' },
  { id: 'MAD', name: 'Hospital La Paz', city: 'Madrid', lat: 40.4168, lon: -3.7038, beds: 750, status: 'Active' }
];

// Slippy Map Tile Math
function tileMath(x, y, k, width, height) {
  const z = Math.max(0, Math.floor(Math.log2(k)));
  const zScale = Math.pow(2, z);
  const tileSize = 256;

  // Center tile offsets
  const minX = Math.floor((-x) / (tileSize * (k / zScale)));
  const maxX = Math.ceil((width - x) / (tileSize * (k / zScale)));
  const minY = Math.floor((-y) / (tileSize * (k / zScale)));
  const maxY = Math.ceil((height - y) / (tileSize * (k / zScale)));

  const tiles = [];
  for (let ty = Math.max(0, minY); ty <= Math.min(zScale - 1, maxY); ty++) {
    for (let tx = Math.max(0, minX); tx <= Math.min(zScale - 1, maxX); tx++) {
      tiles.push({
        x: tx,
        y: ty,
        z: z,
        url: `https://tile.openstreetmap.org/${z}/${tx}/${ty}.png`
      });
    }
  }
  return { tiles, z, zScale, tileSize };
}

const SeamlessZoomableMapTiles = () => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [hoveredOutpost, setHoveredOutpost] = useState(null);
  const [mapTelemetry, setMapTelemetry] = useState({ zoom: 4, lon: 2.35, lat: 48.85, tilesCount: 16 });
  const zoomBehaviorRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = 950;
    const height = 520;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('viewBox', [0, 0, width, height])
      .attr('width', '100%')
      .attr('height', 'auto')
      .style('max-height', '560px')
      .style('background', '#0b1120')
      .style('border-radius', '12px');

    const defs = svg.append('defs');
    defs.append('clipPath')
      .attr('id', 'map-clip')
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', width)
      .attr('height', height);

    // Initial projection setup focused over Western Europe
    const initialScale = 1 << 12;
    const projection = d3.geoMercator()
      .scale(initialScale / (2 * Math.PI))
      .translate([width / 2, height / 2])
      .center([4.0, 49.0]);

    const mapGroup = svg.append('g').attr('clip-path', 'url(#map-clip)');
    const tileLayer = mapGroup.append('g').attr('class', 'tiles');
    const pinsLayer = mapGroup.append('g').attr('class', 'outpost-pins');

    function updateTiles(transform) {
      const k = transform.k * initialScale;
      const x = transform.x;
      const y = transform.y;

      // Rescaled projection
      const proj = d3.geoMercator()
        .scale(k / (2 * Math.PI))
        .translate([x, y])
        .center([4.0, 49.0]);

      // Calculate tile indices
      const z = Math.max(2, Math.min(18, Math.floor(Math.log2(k / 256))));
      const zScale = Math.pow(2, z);
      const tileSize = 256;

      const tiles = [];
      const numTiles = Math.pow(2, z);

      for (let tx = 0; tx < numTiles; tx++) {
        for (let ty = 0; ty < numTiles; ty++) {
          // Check bounds
          const p0 = proj([((tx / numTiles) * 360) - 180, latFromTile(ty, z)]);
          const p1 = proj([(((tx + 1) / numTiles) * 360) - 180, latFromTile(ty + 1, z)]);
          if (p0 && p1 && p1[0] >= -50 && p0[0] <= width + 50 && p1[1] >= -50 && p0[1] <= height + 50) {
            tiles.push({
              key: `${z}/${tx}/${ty}`,
              url: `https://tile.openstreetmap.org/${z}/${tx}/${ty}.png`,
              x: p0[0],
              y: p0[1],
              w: p1[0] - p0[0],
              h: p1[1] - p0[1]
            });
          }
        }
      }

      // Draw or update tiles
      const tileImg = tileLayer.selectAll('image.tile')
        .data(tiles.slice(0, 36), d => d.key);

      tileImg.enter()
        .append('image')
        .attr('class', 'tile')
        .attr('href', d => d.url)
        .attr('x', d => d.x)
        .attr('y', d => d.y)
        .attr('width', d => Math.max(10, d.w))
        .attr('height', d => Math.max(10, d.h))
        .style('opacity', 0)
        .transition().duration(250)
        .style('opacity', 0.85);

      tileImg
        .attr('x', d => d.x)
        .attr('y', d => d.y)
        .attr('width', d => Math.max(10, d.w))
        .attr('height', d => Math.max(10, d.h));

      tileImg.exit().remove();

      // Update Outpost Pins
      pinsLayer.selectAll('*').remove();
      MEDICAL_OUTPOSTS.forEach(outpost => {
        const pt = proj([outpost.lon, outpost.lat]);
        if (pt && pt[0] >= 0 && pt[0] <= width && pt[1] >= 0 && pt[1] <= height) {
          const pin = pinsLayer.append('g')
            .attr('transform', `translate(${pt[0]},${pt[1]})`)
            .attr('cursor', 'pointer')
            .on('mouseenter', () => setHoveredOutpost(outpost))
            .on('mouseleave', () => setHoveredOutpost(null));

          // Beacon circle
          pin.append('circle')
            .attr('r', 12)
            .attr('fill', outpost.status === 'Surge' ? '#F43F5E' : '#10B981')
            .attr('fill-opacity', 0.25)
            .attr('stroke', outpost.status === 'Surge' ? '#F43F5E' : '#10B981')
            .attr('stroke-width', 1.5)
            .attr('stroke-dasharray', '2,2');

          pin.append('circle')
            .attr('r', 5)
            .attr('fill', outpost.status === 'Surge' ? '#F43F5E' : '#06B6D4')
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 1.8);

          pin.append('text')
            .attr('x', 9)
            .attr('y', 4)
            .attr('paint-order', 'stroke fill')
            .attr('stroke', '#020617')
            .attr('stroke-width', 3.5)
            .attr('stroke-linejoin', 'round')
            .attr('fill', '#ffffff')
            .attr('font-size', '10px')
            .attr('font-weight', 'bold')
            .attr('font-family', 'Aldrich, sans-serif')
            .text(outpost.city);
        }
      });

      const centerCoord = proj.invert([width / 2, height / 2]);
      setMapTelemetry({
        zoom: z,
        lon: centerCoord ? +centerCoord[0].toFixed(2) : 0,
        lat: centerCoord ? +centerCoord[1].toFixed(2) : 0,
        tilesCount: tiles.length
      });
    }

    function latFromTile(y, z) {
      const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
      return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
    }

    // D3 Zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.5, 32])
      .on('zoom', (event) => {
        updateTiles(event.transform);
      });

    zoomBehaviorRef.current = zoom;
    svg.call(zoom);

    // Initial render
    updateTiles(d3.zoomIdentity);

  }, []);

  const handleZoomIn = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(400).call(zoomBehaviorRef.current.scaleBy, 1.6);
  };

  const handleZoomOut = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(400).call(zoomBehaviorRef.current.scaleBy, 0.625);
  };

  const handleReset = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(750).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
  };

  return (
    <div ref={containerRef} className="w-full flex flex-col gap-4 font-Aldrich text-slate-100 p-2 sm:p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-lg shadow-inner">
            🗺️
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
              Seamless Zoomable Slippy Map Tiles
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Mercator Tile Quadtree
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Interactive continuous slippy tiles with D3 pan & zoom • Real-time coordinate projection & emergency outpost beacons
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={handleZoomIn}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold border border-slate-700 transition-all cursor-pointer"
          >
            ＋
          </button>
          <button
            onClick={handleZoomOut}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold border border-slate-700 transition-all cursor-pointer"
          >
            −
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/30 transition-all cursor-pointer font-bold shadow-sm"
          >
            Reset Center 🎯
          </button>
        </div>
      </div>

      {/* Main SVG Visualization */}
      <div className="relative w-full rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950/80 p-2 shadow-inner">
        <svg ref={svgRef} className="w-full h-auto cursor-grab active:cursor-grabbing select-none" />

        {hoveredOutpost && (
          <div className="absolute top-4 right-4 bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-md pointer-events-none">
            <span className="text-xs font-bold text-white block">{hoveredOutpost.name}</span>
            <span className="text-[10px] text-slate-400 block">{hoveredOutpost.city} ({hoveredOutpost.lat}°, {hoveredOutpost.lon}°)</span>
            <div className="flex items-center gap-2 mt-2 pt-1 border-t border-slate-800 text-[11px]">
              <span className="text-cyan-400 font-bold">{hoveredOutpost.beds} Acute Beds</span>
              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                hoveredOutpost.status === 'Surge' ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
              }`}>
                {hoveredOutpost.status}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Summary Telemetry */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Current Tile Zoom (Z)</span>
          <span className="text-base font-bold text-cyan-400">Level {mapTelemetry.zoom}</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Viewport Center</span>
          <span className="text-base font-bold text-purple-400">{mapTelemetry.lat}°N, {mapTelemetry.lon}°E</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Active Raster Tiles</span>
          <span className="text-base font-bold text-emerald-400">{mapTelemetry.tilesCount} Loaded</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Outpost Stations</span>
          <span className="text-base font-bold text-amber-400">{MEDICAL_OUTPOSTS.length} In-Network</span>
        </div>
      </div>
    </div>
  );
};

export default SeamlessZoomableMapTiles;
