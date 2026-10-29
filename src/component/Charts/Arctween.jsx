// Arctween.jsx
'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';

// Concentric arc gauges configuration
const GAUGES = [
  { id: 'emergency', name: 'Emergency Capacity', color: '#F43F5E', baseRadius: 180, width: 22, initialVal: 84 },
  { id: 'inpatient', name: 'ICU & Inpatient Beds', color: '#06B6D4', baseRadius: 152, width: 20, initialVal: 72 },
  { id: 'surgical', name: 'Operating Theatre Load', color: '#8B5CF6', baseRadius: 126, width: 18, initialVal: 91 },
  { id: 'pharmacy', name: 'Pharmacy Throughput', color: '#10B981', baseRadius: 102, width: 16, initialVal: 65 }
];

const Arctween = () => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [gaugeValues, setGaugeValues] = useState({
    emergency: 84,
    inpatient: 72,
    surgical: 91,
    pharmacy: 65
  });
  const [isLiveSimulation, setIsLiveSimulation] = useState(true);
  const [activePreset, setActivePreset] = useState('Surge');
  const arcTweenFuncsRef = useRef({});

  // Preset triggers
  const setPreset = (presetName, values) => {
    setActivePreset(presetName);
    setGaugeValues(values);
  };

  // Live simulation ticker
  useEffect(() => {
    if (!isLiveSimulation) return;
    const interval = setInterval(() => {
      setGaugeValues(prev => ({
        emergency: Math.min(99, Math.max(25, Math.round(prev.emergency + (Math.random() * 12 - 6)))),
        inpatient: Math.min(98, Math.max(30, Math.round(prev.inpatient + (Math.random() * 10 - 5)))),
        surgical: Math.min(100, Math.max(20, Math.round(prev.surgical + (Math.random() * 14 - 7)))),
        pharmacy: Math.min(95, Math.max(35, Math.round(prev.pharmacy + (Math.random() * 8 - 4))))
      }));
    }, 1800);

    return () => clearInterval(interval);
  }, [isLiveSimulation]);

  // D3 Rendering with smooth concentric ArcTween
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = 560;
    const height = 500;
    const tau = 2 * Math.PI;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('viewBox', [-width / 2, -height / 2, width, height])
      .attr('width', '100%')
      .attr('height', 'auto')
      .style('max-height', '520px')
      .style('background', '#0b1120')
      .style('border-radius', '12px');

    // Defs & Filters
    const defs = svg.append('defs');

    // Drop shadow
    const filter = defs.append('filter')
      .attr('id', 'arc-shadow')
      .attr('x', '-20%').attr('y', '-20%')
      .attr('width', '140%').attr('height', '140%');
    filter.append('feDropShadow')
      .attr('dx', '0')
      .attr('dy', '0')
      .attr('stdDeviation', '4')
      .attr('flood-color', 'rgba(0,0,0,0.6)');

    // Center display group
    const centerGroup = svg.append('g').attr('class', 'center-readout').attr('text-anchor', 'middle');

    centerGroup.append('circle')
      .attr('r', 82)
      .attr('fill', '#0f172a')
      .attr('stroke', '#1e293b')
      .attr('stroke-width', 2);

    const overallAvg = Math.round(
      (gaugeValues.emergency + gaugeValues.inpatient + gaugeValues.surgical + gaugeValues.pharmacy) / 4
    );

    const centerNumber = centerGroup.append('text')
      .attr('dy', '-0.1em')
      .attr('font-size', '34px')
      .attr('font-weight', '900')
      .attr('fill', overallAvg > 85 ? '#F43F5E' : '#38bdf8')
      .attr('font-family', 'Aldrich, sans-serif')
      .text(`${overallAvg}%`);

    centerGroup.append('text')
      .attr('dy', '1.6em')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('fill', '#94a3b8')
      .attr('font-family', 'Aldrich, sans-serif')
      .text('OVERALL LOAD');

    centerGroup.append('text')
      .attr('dy', '3.1em')
      .attr('font-size', '9px')
      .attr('fill', overallAvg > 85 ? '#F43F5E' : '#10B981')
      .attr('font-family', 'Aldrich, sans-serif')
      .attr('font-weight', 'bold')
      .text(overallAvg > 85 ? 'HIGH SURGE ALERT' : 'OPTIMAL STATUS');

    // Draw concentric arcs
    GAUGES.forEach(gConf => {
      const val = gaugeValues[gConf.id];
      const targetAngle = (val / 100) * tau;

      const arcGen = d3.arc()
        .innerRadius(gConf.baseRadius - gConf.width)
        .outerRadius(gConf.baseRadius)
        .startAngle(0)
        .cornerRadius(6);

      const gArc = svg.append('g').attr('class', `arc-group-${gConf.id}`);

      // Background track
      gArc.append('path')
        .datum({ endAngle: tau })
        .attr('fill', '#1e293b')
        .attr('fill-opacity', 0.4)
        .attr('d', arcGen);

      // Foreground animated arc
      const foreground = gArc.append('path')
        .datum({ endAngle: targetAngle })
        .attr('fill', gConf.color)
        .attr('stroke', '#020617')
        .attr('stroke-width', 1.5)
        .attr('filter', 'url(#arc-shadow)')
        .attr('d', arcGen);

      // Arc Tip Pulse Indicator Dot
      const tipAngle = targetAngle - Math.PI / 2;
      const tipRadius = gConf.baseRadius - gConf.width / 2;
      gArc.append('circle')
        .attr('cx', tipRadius * Math.cos(tipAngle))
        .attr('cy', tipRadius * Math.sin(tipAngle))
        .attr('r', 3)
        .attr('fill', '#ffffff')
        .attr('stroke', gConf.color)
        .attr('stroke-width', 2);
    });

  }, [gaugeValues]);

  return (
    <div ref={containerRef} className="w-full flex flex-col gap-4 font-Aldrich text-slate-100 p-2 sm:p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-lg shadow-inner">
            ⭕
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
              Concentric ArcTween Operational Gauges
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Smooth D3 Interpolation
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Multi-layer radial arc tweening • Real-time clinical load monitoring • Interactive preset switches & manual overrides
            </p>
          </div>
        </div>

        {/* Live Simulation Toggle */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setIsLiveSimulation(!isLiveSimulation)}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5 ${
              isLiveSimulation
                ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
            }`}
          >
            <span>{isLiveSimulation ? '● Live Telemetry (On)' : '○ Paused (Manual)'}</span>
          </button>
        </div>
      </div>

      {/* Operational Scenario Presets */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-bold uppercase text-[10px]">Scenarios:</span>
          {[
            { id: 'Normal', label: 'Normal Shift (60%)', vals: { emergency: 55, inpatient: 62, surgical: 68, pharmacy: 58 } },
            { id: 'Surge', label: 'Peak Surge (88%)', vals: { emergency: 89, inpatient: 82, surgical: 94, pharmacy: 78 } },
            { id: 'Critical', label: 'Code Orange (96%)', vals: { emergency: 98, inpatient: 95, surgical: 97, pharmacy: 90 } },
            { id: 'Night', label: 'Night Reset (35%)', vals: { emergency: 32, inpatient: 45, surgical: 28, pharmacy: 36 } }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => {
                setIsLiveSimulation(false);
                setPreset(p.id, p.vals);
              }}
              className={`px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                activePreset === p.id
                  ? 'bg-cyan-600 text-white border-cyan-500 font-bold shadow'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Layout Grid: Gauge Left + Manual Sliders Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
        {/* Main D3 Arc SVG Visualizer */}
        <div className="lg:col-span-2 flex items-center justify-center rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950/80 p-2 shadow-inner">
          <svg ref={svgRef} className="w-full max-w-[480px] h-auto select-none" />
        </div>

        {/* Sliders and Telemetry Badges */}
        <div className="flex flex-col gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800 h-full justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2">
            Clinical Metric Overrides
          </h3>

          <div className="flex flex-col gap-3">
            {GAUGES.map(g => (
              <div key={g.id} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color }} />
                    {g.name}
                  </span>
                  <span className="font-bold font-Aldrich" style={{ color: g.color }}>
                    {gaugeValues[g.id]}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={gaugeValues[g.id]}
                  onChange={(e) => {
                    setIsLiveSimulation(false);
                    const val = +e.target.value;
                    setGaugeValues(prev => ({ ...prev, [g.id]: val }));
                  }}
                  className="w-full h-1.5 rounded-lg bg-slate-800 cursor-pointer"
                  style={{ accentColor: g.color }}
                />
              </div>
            ))}
          </div>

          {/* Status Box */}
          <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700 text-xs">
            <span className="text-slate-400 block text-[10px]">Triage Guidance:</span>
            <span className="text-cyan-300 font-bold block mt-0.5">
              {gaugeValues.emergency > 85 ? '🚨 Divert non-critical ambulances to Secondary Facility' : '✅ Emergency ward operating within optimal limits'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Arctween;
