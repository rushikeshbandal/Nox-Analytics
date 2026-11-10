// NormalQuantilePlot.jsx
'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';

function normalQuantile(p) {
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];

  const q = p - 0.5;
  if (Math.abs(q) <= 0.42) {
    const r = q * q;
    return q * (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  } else {
    const r = p < 0.5 ? p : 1 - p;
    const s = Math.sqrt(-Math.log(r));
    let x = (((((c[0] * s + c[1]) * s + c[2]) * s + c[3]) * s + c[4]) * s + c[5]) /
      ((((d[0] * s + d[1]) * s + d[2]) * s + d[3]) * s + 1);
    return p < 0.5 ? -x : x;
  }
}

function generateClinicalSample(type = 'vitals', n = 140) {
  const data = [];
  for (let i = 0; i < n; i++) {
    if (type === 'vitals') {
      data.push(d3.randomNormal(120, 14)());
    } else if (type === 'outliers') {
      const isOutlier = Math.random() < 0.08;
      data.push(isOutlier ? 120 + (Math.random() < 0.5 ? -55 : 55) : d3.randomNormal(120, 14)());
    } else {
      data.push(Math.exp(d3.randomNormal(4.7, 0.25)()));
    }
  }
  return data.sort(d3.ascending);
}

const NormalQuantilePlot = () => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [sampleType, setSampleType] = useState('vitals');
  const [confidenceLevel, setConfidenceLevel] = useState(0.95);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const rawData = useMemo(() => generateClinicalSample(sampleType, 140), [sampleType]);

  const { points, stats } = useMemo(() => {
    const n = rawData.length;
    const mean = d3.mean(rawData) || 0;
    const sd = d3.deviation(rawData) || 1;
    const zCrit = confidenceLevel === 0.99 ? 2.576 : confidenceLevel === 0.95 ? 1.96 : 1.645;

    let outliersCount = 0;
    const computed = rawData.map((val, i) => {
      const p = (i + 0.5) / n;
      const z = normalQuantile(p);
      const expected = mean + sd * z;
      // Standard error of quantile estimate: SE(q) = (sd / f(z)) * sqrt(p(1-p)/n)
      const phi = (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * z * z);
      const se = (sd / Math.max(0.01, phi)) * Math.sqrt((p * (1 - p)) / n);
      const upper = expected + zCrit * se;
      const lower = expected - zCrit * se;
      const isOut = val > upper || val < lower;
      if (isOut) outliersCount++;

      return {
        sample: val,
        p,
        z,
        expected,
        upper,
        lower,
        isOut
      };
    });

    return {
      points: computed,
      stats: { mean: mean.toFixed(1), sd: sd.toFixed(1), outliers: outliersCount }
    };
  }, [rawData, confidenceLevel]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = 950;
    const height = 480;
    const margin = { top: 30, right: 40, bottom: 50, left: 70 };

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('viewBox', [0, 0, width, height])
      .attr('width', '100%')
      .attr('height', 'auto')
      .style('max-height', '520px')
      .style('background', '#0b1120')
      .style('border-radius', '12px');

    const defs = svg.append('defs');
    const grad = defs.append('linearGradient')
      .attr('id', 'conf-band-grad')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    grad.append('stop').attr('offset', '0%').attr('stop-color', '#38bdf8').attr('stop-opacity', 0.15);
    grad.append('stop').attr('offset', '100%').attr('stop-color', '#38bdf8').attr('stop-opacity', 0.05);

    // Scales
    const x = d3.scaleLinear().domain([-3.2, 3.2]).range([margin.left, width - margin.right]);
    const yExt = d3.extent(points, d => d.sample);
    const yMin = Math.min(yExt[0], d3.min(points, d => d.lower)) * 0.95;
    const yMax = Math.max(yExt[1], d3.max(points, d => d.upper)) * 1.05;

    const y = d3.scaleLinear().domain([yMin, yMax]).range([height - margin.bottom, margin.top]);

    // Grid
    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(6).tickSize(-(width - margin.left - margin.right)).tickFormat(''))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').attr('stroke', '#1e293b').attr('stroke-dasharray', '3,3'));

    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(8).tickSize(-(height - margin.top - margin.bottom)).tickFormat(''))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').attr('stroke', '#1e293b').attr('stroke-dasharray', '3,3'));

    // Axes
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(8).tickFormat(d => `${d}σ`))
      .call(g => g.select('.domain').attr('stroke', '#334155'))
      .call(g => g.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '10px').attr('font-family', 'Aldrich, sans-serif'));

    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(6))
      .call(g => g.select('.domain').attr('stroke', '#334155'))
      .call(g => g.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '10px').attr('font-family', 'Aldrich, sans-serif'));

    // Confidence Band Envelope
    const confArea = d3.area()
      .curve(d3.curveMonotoneX)
      .x(d => x(d.z))
      .y0(d => y(d.lower))
      .y1(d => y(d.upper));

    svg.append('path')
      .datum(points)
      .attr('fill', 'url(#conf-band-grad)')
      .attr('d', confArea);

    svg.append('path')
      .datum(points)
      .attr('fill', 'none')
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 1.2)
      .attr('stroke-dasharray', '3,3')
      .attr('d', d3.line().curve(d3.curveMonotoneX).x(d => x(d.z)).y(d => y(d.upper)));

    svg.append('path')
      .datum(points)
      .attr('fill', 'none')
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 1.2)
      .attr('stroke-dasharray', '3,3')
      .attr('d', d3.line().curve(d3.curveMonotoneX).x(d => x(d.z)).y(d => y(d.lower)));

    // Center Reference Line
    const mean = +stats.mean;
    const sd = +stats.sd;
    svg.append('line')
      .attr('x1', x(-3.2))
      .attr('y1', y(mean + sd * -3.2))
      .attr('x2', x(3.2))
      .attr('y2', y(mean + sd * 3.2))
      .attr('stroke', '#10B981')
      .attr('stroke-width', 2);

    // Points
    svg.append('g').attr('class', 'pts')
      .selectAll('circle')
      .data(points)
      .join('circle')
      .attr('cx', d => x(d.z))
      .attr('cy', d => y(d.sample))
      .attr('r', 4.5)
      .attr('fill', d => d.isOut ? '#F43F5E' : '#06B6D4')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', d => d.isOut ? 2 : 1)
      .attr('cursor', 'pointer')
      .on('mouseenter', (event, d) => setHoveredPoint(d))
      .on('mouseleave', () => setHoveredPoint(null));

    // Axis Labels
    svg.append('text')
      .attr('x', width - margin.right)
      .attr('y', height - margin.bottom + 36)
      .attr('text-anchor', 'end')
      .attr('fill', '#64748b')
      .attr('font-size', '11px')
      .attr('font-family', 'Aldrich, sans-serif')
      .text('STANDARD NORMAL QUANTILES (Z) →');

    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -margin.top)
      .attr('y', margin.left - 48)
      .attr('text-anchor', 'end')
      .attr('fill', '#64748b')
      .attr('font-size', '11px')
      .attr('font-family', 'Aldrich, sans-serif')
      .text('ORDERED CLINICAL MEASUREMENTS →');

  }, [points, stats]);

  return (
    <div ref={containerRef} className="w-full flex flex-col gap-4 font-Aldrich text-slate-100 p-2 sm:p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-lg shadow-inner">
            📏
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
              Normal Quantile Plot with Confidence Bands
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {(confidenceLevel * 100).toFixed(0)}% Lilliefors Envelope
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Parametric quantile plot with point-wise asymptotic standard error confidence envelope to detect tail departures
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 text-xs bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Dataset:</span>
            {[
              { id: 'vitals', label: 'Vitals' },
              { id: 'outliers', label: 'With Outliers' },
              { id: 'lognorm', label: 'Log-Normal' }
            ].map(d => (
              <button
                key={d.id}
                onClick={() => setSampleType(d.id)}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer font-bold ${
                  sampleType === d.id ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 border-l border-slate-700 pl-3">
            <span className="text-slate-400">CI:</span>
            {[0.90, 0.95, 0.99].map(ci => (
              <button
                key={ci}
                onClick={() => setConfidenceLevel(ci)}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer font-bold ${
                  confidenceLevel === ci ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {(ci * 100).toFixed(0)}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main SVG Visualization */}
      <div className="relative w-full rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950/80 p-2 shadow-inner">
        <svg ref={svgRef} className="w-full h-auto select-none" />

        {hoveredPoint && (
          <div className="absolute top-4 right-4 bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-md pointer-events-none">
            <span className="text-xs font-bold text-white block">Quantile Diagnostic</span>
            <div className="grid grid-cols-2 gap-2 mt-2 pt-1 border-t border-slate-800 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">Observation:</span>
                <span className={`font-bold ${hoveredPoint.isOut ? 'text-rose-400' : 'text-cyan-400'}`}>
                  {hoveredPoint.sample.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Z Score:</span>
                <span className="text-white font-bold">{hoveredPoint.z.toFixed(2)}σ</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Expected:</span>
                <span className="text-emerald-400 font-bold">{hoveredPoint.expected.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Confidence CI:</span>
                <span className="text-purple-300 font-bold">[{hoveredPoint.lower.toFixed(1)}, {hoveredPoint.upper.toFixed(1)}]</span>
              </div>
            </div>
            {hoveredPoint.isOut && (
              <div className="mt-1.5 text-[10px] text-rose-300 font-bold bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/30">
                ⚠️ Outlier: Outside {(confidenceLevel * 100).toFixed(0)}% Confidence Envelope
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary Telemetry */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Observations</span>
          <span className="text-base font-bold text-white">{points.length} Samples</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Confidence Level</span>
          <span className="text-base font-bold text-purple-400">{(confidenceLevel * 100).toFixed(0)}% Lilliefors</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Envelope Violations</span>
          <span className={`text-base font-bold ${stats.outliers > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {stats.outliers} Outliers
          </span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Normality Diagnostic</span>
          <span className={`text-base font-bold ${stats.outliers > 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {stats.outliers > 5 ? 'Departures Present' : 'Normal Fit OK'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default NormalQuantilePlot;
