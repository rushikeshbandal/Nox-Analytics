// QQPlot.jsx
'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';

// Generate distributions
function generateSample(type = 'normal', n = 150) {
  const data = [];
  for (let i = 0; i < n; i++) {
    if (type === 'normal') {
      data.push(d3.randomNormal(100, 15)());
    } else if (type === 'skewed') {
      data.push(Math.exp(d3.randomNormal(4.2, 0.45)()));
    } else if (type === 'heavy') {
      // Student-t like (ratio of normal to sqrt(chi2))
      const u = d3.randomNormal(100, 15)();
      const v = (Math.random() + Math.random() + Math.random()) / 3;
      data.push(100 + (u - 100) / Math.max(0.4, v));
    } else {
      data.push(50 + Math.random() * 100);
    }
  }
  return data.sort(d3.ascending);
}

// Standard normal quantile approximation (Acklam's algorithm)
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

const QQPlot = () => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [distType, setDistType] = useState('normal'); // 'normal' | 'skewed' | 'heavy' | 'uniform'
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const rawData = useMemo(() => generateSample(distType, 160), [distType]);

  // Compute Q-Q pairs
  const { qqPoints, stats } = useMemo(() => {
    const n = rawData.length;
    const mean = d3.mean(rawData) || 0;
    const sd = d3.deviation(rawData) || 1;

    const points = rawData.map((val, i) => {
      const p = (i + 0.5) / n;
      const theoretical = normalQuantile(p);
      return {
        sample: val,
        theoretical,
        expectedLine: mean + sd * theoretical,
        percentile: +(p * 100).toFixed(1)
      };
    });

    // Approximate Skewness & Kurtosis
    const skewness = (d3.mean(rawData, x => Math.pow((x - mean) / sd, 3)) || 0).toFixed(2);
    const kurtosis = (d3.mean(rawData, x => Math.pow((x - mean) / sd, 4)) || 0).toFixed(2);

    return {
      qqPoints: points,
      stats: { mean: mean.toFixed(1), sd: sd.toFixed(1), skewness, kurtosis }
    };
  }, [rawData]);

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

    // Scales
    const xExt = d3.extent(qqPoints, d => d.theoretical);
    const x = d3.scaleLinear()
      .domain([Math.min(-3.0, xExt[0]), Math.max(3.0, xExt[1])])
      .range([margin.left, width - margin.right]);

    const yExt = d3.extent(qqPoints, d => d.sample);
    const y = d3.scaleLinear()
      .domain([yExt[0] * 0.95, yExt[1] * 1.05])
      .range([height - margin.bottom, margin.top]);

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

    // 45-Degree Theoretical Line
    const xMin = x.domain()[0];
    const xMax = x.domain()[1];
    const mean = +stats.mean;
    const sd = +stats.sd;

    svg.append('line')
      .attr('x1', x(xMin))
      .attr('y1', y(mean + sd * xMin))
      .attr('x2', x(xMax))
      .attr('y2', y(mean + sd * xMax))
      .attr('stroke', '#F43F5E')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,4');

    // Scatter Q-Q Points
    svg.append('g').attr('class', 'qq-dots')
      .selectAll('circle')
      .data(qqPoints)
      .join('circle')
      .attr('cx', d => x(d.theoretical))
      .attr('cy', d => y(d.sample))
      .attr('r', 4.5)
      .attr('fill', '#06B6D4')
      .attr('fill-opacity', 0.8)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1)
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
      .text('THEORETICAL STANDARD NORMAL QUANTILES (Z) →');

    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -margin.top)
      .attr('y', margin.left - 48)
      .attr('text-anchor', 'end')
      .attr('fill', '#64748b')
      .attr('font-size', '11px')
      .attr('font-family', 'Aldrich, sans-serif')
      .text('SAMPLE CLINICAL QUANTILES Q(p) →');

  }, [qqPoints, stats]);

  return (
    <div ref={containerRef} className="w-full flex flex-col gap-4 font-Aldrich text-slate-100 p-2 sm:p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-lg shadow-inner">
            📈
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
              Quantile-Quantile (Q–Q) Plot
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Normality Diagnostic
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Evaluates whether clinical trial measurements follow a theoretical Gaussian distribution by plotting sample quantiles against standard normal Z-scores
            </p>
          </div>
        </div>

        {/* Distribution Toggles */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-lg border border-slate-700 text-xs">
          {[
            { id: 'normal', label: 'Gaussian' },
            { id: 'skewed', label: 'Log-Normal (Skewed)' },
            { id: 'heavy', label: 'Heavy-Tailed' },
            { id: 'uniform', label: 'Uniform' }
          ].map(d => (
            <button
              key={d.id}
              onClick={() => setDistType(d.id)}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer font-bold ${
                distType === d.id ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main SVG Visualization */}
      <div className="relative w-full rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950/80 p-2 shadow-inner">
        <svg ref={svgRef} className="w-full h-auto select-none" />

        {hoveredPoint && (
          <div className="absolute top-4 right-4 bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-md pointer-events-none">
            <span className="text-xs font-bold text-white block">Observation Quantile ({hoveredPoint.percentile}th %)</span>
            <div className="grid grid-cols-2 gap-2 mt-2 pt-1 border-t border-slate-800 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">Sample Value:</span>
                <span className="text-cyan-400 font-bold">{hoveredPoint.sample.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Z Theoretical:</span>
                <span className="text-white font-bold">{hoveredPoint.theoretical.toFixed(2)}σ</span>
              </div>
            </div>
            <div className="text-[10px] text-rose-400 mt-1 font-semibold">
              Deviation from Line: {(hoveredPoint.sample - hoveredPoint.expectedLine).toFixed(2)}
            </div>
          </div>
        )}
      </div>

      {/* Summary Telemetry */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Sample Mean</span>
          <span className="text-base font-bold text-white">{stats.mean}</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Std Deviation</span>
          <span className="text-base font-bold text-cyan-400">{stats.sd}</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Sample Skewness</span>
          <span className={`text-base font-bold ${Math.abs(+stats.skewness) > 0.5 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {stats.skewness}
          </span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Kurtosis</span>
          <span className={`text-base font-bold ${Math.abs(+stats.kurtosis - 3) > 1 ? 'text-purple-400' : 'text-emerald-400'}`}>
            {stats.kurtosis}
          </span>
        </div>
      </div>
    </div>
  );
};

export default QQPlot;
