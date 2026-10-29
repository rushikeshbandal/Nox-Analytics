// VersorDragging.jsx
'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import versor from 'versor';

// Global Medical Outposts
const OUTPOSTS = [
  { id: 'WHO_HQ', name: 'WHO Strategic Command', city: 'Geneva', coords: [6.1432, 46.2044], beds: 1200, status: 'Active HQ', alert: 'Normal' },
  { id: 'CDC_ATL', name: 'CDC Global Surveillance', city: 'Atlanta', coords: [-84.3880, 33.7490], beds: 850, status: 'Level 4 Bio', alert: 'Advisory' },
  { id: 'AFR_HUB', name: 'Africa Epidemic Outpost', city: 'Nairobi', coords: [36.8219, -1.2921], beds: 640, status: 'Field Testing', alert: 'Surge' },
  { id: 'ASIA_CTR', name: 'Asia-Pacific Genomics', city: 'Singapore', coords: [103.8198, 1.3521], beds: 920, status: 'Sequencing', alert: 'Normal' },
  { id: 'TOKYO_RES', name: 'Tokyo Bio-Informatics', city: 'Tokyo', coords: [139.6917, 35.6895], beds: 780, status: 'Rapid PCR', alert: 'Normal' },
  { id: 'LATAM_SUR', name: 'Pan-American Outreach', city: 'São Paulo', coords: [-46.6333, -23.5505], beds: 560, status: 'Mobile Clinics', alert: 'Advisory' },
  { id: 'AUS_CRIT', name: 'Oceania Emergency Care', city: 'Sydney', coords: [151.2093, -33.8688], beds: 480, status: 'Air Ambulance', alert: 'Normal' },
  { id: 'LON_PHAR', name: 'European Vaccines Core', city: 'London', coords: [-0.1278, 51.5074], beds: 1100, status: 'Cold Chain Hub', alert: 'Normal' }
];

const VersorDragging = () => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [rotationAngles, setRotationAngles] = useState([0, -20, 0]);
  const [scale, setScale] = useState(240);
  const [isAutoSpin, setIsAutoSpin] = useState(false);
  const [hoveredOutpost, setHoveredOutpost] = useState(null);
  const [selectedOutpost, setSelectedOutpost] = useState(OUTPOSTS[0]);
  const spinTimerRef = useRef(null);
  const projectionRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = 850;
    const height = 520;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('viewBox', [0, 0, width, height])
      .attr('width', '100%')
      .attr('height', 'auto')
      .style('max-height', '580px')
      .style('background', '#0b1120')
      .style('border-radius', '12px');

    const defs = svg.append('defs');

    // Sphere atmosphere gradient
    const radialGrad = defs.append('radialGradient')
      .attr('id', 'ocean-sphere-grad')
      .attr('cx', '45%').attr('cy', '45%');
    radialGrad.append('stop').attr('offset', '0%').attr('stop-color', '#1e293b');
    radialGrad.append('stop').attr('offset', '70%').attr('stop-color', '#0f172a');
    radialGrad.append('stop').attr('offset', '100%').attr('stop-color', '#020617');

    // Glow filter
    const glow = defs.append('filter').attr('id', 'versor-glow');
    glow.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
    const merge = glow.append('feMerge');
    merge.append('feMergeNode').attr('in', 'coloredBlur');
    merge.append('feMergeNode').attr('in', 'SourceGraphic');

    const projection = d3.geoOrthographic()
      .scale(scale)
      .translate([width / 2, height / 2])
      .rotate(rotationAngles)
      .clipAngle(90);

    projectionRef.current = projection;

    const path = d3.geoPath(projection);
    const graticule = d3.geoGraticule();

    // Outer atmospheric ring
    svg.append('circle')
      .attr('cx', width / 2)
      .attr('cy', height / 2)
      .attr('r', scale + 4)
      .attr('fill', 'none')
      .attr('stroke', '#06B6D4')
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.4);

    // Globe background sphere
    const sphere = svg.append('circle')
      .attr('cx', width / 2)
      .attr('cy', height / 2)
      .attr('r', scale)
      .attr('fill', 'url(#ocean-sphere-grad)')
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 2);

    // Graticules
    const gratPath = svg.append('path')
      .datum(graticule())
      .attr('d', path)
      .attr('fill', 'none')
      .attr('stroke', '#334155')
      .attr('stroke-width', 0.6)
      .attr('stroke-opacity', 0.5);

    const landGroup = svg.append('g').attr('class', 'land');
    const pinsGroup = svg.append('g').attr('class', 'outpost-pins');

    // Render Outpost Pins
    function renderPins() {
      pinsGroup.selectAll('*').remove();

      OUTPOSTS.forEach(outpost => {
        const coords = outpost.coords;
        const pt = projection(coords);

        // Check if on visible hemisphere
        const centerCoords = projection.invert([width / 2, height / 2]);
        const dist = d3.geoDistance(coords, centerCoords);
        if (dist > Math.PI / 2) return; // Behind the globe

        if (pt) {
          const pinG = pinsGroup.append('g')
            .attr('transform', `translate(${pt[0]},${pt[1]})`)
            .attr('cursor', 'pointer')
            .on('mouseenter', () => setHoveredOutpost(outpost))
            .on('mouseleave', () => setHoveredOutpost(null))
            .on('click', () => setSelectedOutpost(outpost));

          // Radar pulse ring
          pinG.append('circle')
            .attr('r', 10)
            .attr('fill', outpost.alert === 'Surge' ? '#F43F5E' : '#10B981')
            .attr('fill-opacity', 0.25)
            .attr('stroke', outpost.alert === 'Surge' ? '#F43F5E' : '#10B981')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '2,2');

          // Core pin
          pinG.append('circle')
            .attr('r', 4.5)
            .attr('fill', outpost.alert === 'Surge' ? '#F43F5E' : '#38bdf8')
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 1.5)
            .attr('filter', 'url(#versor-glow)');

          // Outpost label with halo stroke
          pinG.append('text')
            .attr('x', 9)
            .attr('y', 3)
            .attr('font-size', '10px')
            .attr('font-weight', 'bold')
            .attr('font-family', 'Aldrich, sans-serif')
            .attr('paint-order', 'stroke fill')
            .attr('stroke', '#020617')
            .attr('stroke-width', 3)
            .attr('fill', '#f8fafc')
            .text(outpost.city);
        }
      });
    }

    // Load Geo Data
    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(world => {
        const countries = topojson.feature(world, world.objects.countries).features;
        landGroup.selectAll('path')
          .data(countries)
          .join('path')
          .attr('d', path)
          .attr('fill', '#1e293b')
          .attr('stroke', '#475569')
          .attr('stroke-width', 0.7);

        renderPins();
      })
      .catch(() => {
        // Fallback procedural land geometry if offline
        const circleGen = d3.geoCircle().radius(35);
        const fallbackFeatures = [
          circleGen.center([15, 50])(),
          circleGen.center([-95, 40])(),
          circleGen.center([80, 20])(),
          circleGen.center([25, 0])(),
          circleGen.center([135, -25])()
        ];
        landGroup.selectAll('path')
          .data(fallbackFeatures)
          .join('path')
          .attr('d', path)
          .attr('fill', '#1e293b')
          .attr('stroke', '#334155')
          .attr('stroke-width', 0.8);

        renderPins();
      });

    // Versor Quaternion Dragging
    let v0, q0, r0;

    const drag = d3.drag()
      .on('start', (event) => {
        const p = projection.invert([event.x, event.y]);
        if (!p) return;
        v0 = versor.cartesian(p);
        r0 = projection.rotate();
        q0 = versor(r0);
      })
      .on('drag', (event) => {
        const p = projection.invert([event.x, event.y]);
        if (!p || !v0) return;
        const v1 = versor.cartesian(p);
        const delta = versor.delta(v0, v1);
        const q1 = versor.multiply(q0, delta);
        const r1 = versor.rotation(q1);

        projection.rotate(r1);
        setRotationAngles(r1);

        landGroup.selectAll('path').attr('d', path);
        gratPath.attr('d', path);
        renderPins();
      });

    svg.call(drag);

    // Auto-spin logic
    if (isAutoSpin) {
      spinTimerRef.current = d3.timer(() => {
        const rot = projection.rotate();
        const nextRot = [rot[0] + 0.45, rot[1], rot[2]];
        projection.rotate(nextRot);
        setRotationAngles(nextRot);

        landGroup.selectAll('path').attr('d', path);
        gratPath.attr('d', path);
        renderPins();
      });
    }

    return () => {
      if (spinTimerRef.current) spinTimerRef.current.stop();
    };

  }, [scale, isAutoSpin]);

  return (
    <div ref={containerRef} className="w-full flex flex-col gap-4 font-Aldrich text-slate-100 p-2 sm:p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-lg shadow-inner">
            🌐
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
              3D Orthographic Versor Dragging
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Quaternion Rotation
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Interactive 3D planetary sphere with true versor quaternion dragging • Zero gimbal lock • Global emergency network telemetry
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setIsAutoSpin(!isAutoSpin)}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5 ${
              isAutoSpin
                ? 'bg-cyan-600 text-white shadow-cyan-600/30'
                : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
            }`}
          >
            <span>{isAutoSpin ? '⏸ Pause Spin' : '▶ Auto-Rotate 3D'}</span>
          </button>
          <button
            onClick={() => {
              if (projectionRef.current) {
                projectionRef.current.rotate([0, -20, 0]);
                setRotationAngles([0, -20, 0]);
              }
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
          >
            Reset View 🎯
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas & Outpost Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
        {/* SVG Globe Visualizer */}
        <div className="lg:col-span-2 relative flex items-center justify-center rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950/80 p-2 shadow-inner">
          <svg ref={svgRef} className="w-full h-auto cursor-grab active:cursor-grabbing select-none" />

          {/* Zoom controls float */}
          <div className="absolute bottom-4 left-4 flex items-center gap-1.5 bg-slate-900/90 border border-slate-700 p-1.5 rounded-lg text-xs">
            <button
              onClick={() => setScale(prev => Math.max(160, prev - 30))}
              className="w-7 h-7 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded font-bold text-slate-200"
            >
              −
            </button>
            <span className="px-2 text-slate-400 font-bold">{Math.round((scale / 240) * 100)}%</span>
            <button
              onClick={() => setScale(prev => Math.min(380, prev + 30))}
              className="w-7 h-7 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded font-bold text-slate-200"
            >
              ＋
            </button>
          </div>

          {/* Hover Outpost Card */}
          {hoveredOutpost && (
            <div className="absolute top-4 right-4 bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-md max-w-xs pointer-events-none">
              <span className="text-xs font-bold text-white block">{hoveredOutpost.name}</span>
              <span className="text-[10px] text-slate-400 block">{hoveredOutpost.city}</span>
              <div className="flex items-center gap-2 mt-2 pt-1 border-t border-slate-800 text-[11px]">
                <span className="text-cyan-400 font-bold">{hoveredOutpost.beds} Critical Beds</span>
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                  hoveredOutpost.alert === 'Surge' ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {hoveredOutpost.status}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Global Outposts List / Inspector */}
        <div className="flex flex-col gap-2.5 bg-slate-900/60 p-4 rounded-xl border border-slate-800 h-full">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between border-b border-slate-800 pb-2">
            <span>📡 Active Global Outposts</span>
            <span className="text-[10px] text-emerald-400 font-normal">8 Centers Online</span>
          </h3>

          <div className="flex flex-col gap-2 overflow-y-auto max-h-[400px] pr-1">
            {OUTPOSTS.map(outpost => {
              const isSelected = selectedOutpost?.id === outpost.id;
              return (
                <button
                  key={outpost.id}
                  onClick={() => {
                    setSelectedOutpost(outpost);
                    if (projectionRef.current) {
                      // Smoothly rotate globe to face the outpost
                      const target = [-outpost.coords[0], -outpost.coords[1], 0];
                      d3.transition().duration(800)
                        .tween('rotate', () => {
                          const r = d3.interpolate(projectionRef.current.rotate(), target);
                          return t => {
                            projectionRef.current.rotate(r(t));
                            setRotationAngles(r(t));
                          };
                        });
                    }
                  }}
                  className={`flex items-center justify-between p-2.5 rounded-lg text-left border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/50 border-cyan-500 text-white shadow-sm'
                      : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold">{outpost.city}</span>
                    <span className="text-[10px] text-slate-400">{outpost.name}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-bold text-cyan-400">{outpost.beds} beds</span>
                    <span className={`text-[9px] font-semibold ${outpost.alert === 'Surge' ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {outpost.status}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Real-time Versor Telemetry Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Yaw (Longitude)</span>
          <span className="text-base font-bold text-cyan-400">{rotationAngles[0]?.toFixed(1)}°</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Pitch (Latitude)</span>
          <span className="text-base font-bold text-purple-400">{rotationAngles[1]?.toFixed(1)}°</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Roll Orientation</span>
          <span className="text-base font-bold text-emerald-400">{rotationAngles[2]?.toFixed(1)}°</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Quaternion Math</span>
          <span className="text-base font-bold text-amber-400">Euler/Versor OK</span>
        </div>
      </div>
    </div>
  );
};

export default VersorDragging;
