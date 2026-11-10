// KernelDensityEstimation.jsx
'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';

// Generate multimodal clinical biomarker data (e.g. 250 patient glucose/recovery metrics)
function generateBiomarkerData() {
  const data = [];
  // Bimodal mixture: Group A (mean 85, sd 12), Group B (mean 145, sd 18)
  for (let i = 0; i < 140; i++) {
    data.push(Math.round(d3.randomNormal(85, 12)()));
  }
  for (let i = 0; i < 110; i++) {
    data.push(Math.round(d3.randomNormal(145, 18)()));
  }
  return data.filter(d => d >= 40 && d <= 210);
}

// Epanechnikov Kernel
function kernelEpanechnikov(k) {
  return function(v) {
    return Math.abs(v /= k) <= 1 ? (0.75 * (1 - v * v)) / k : 0;
  };
}

// Gaussian Kernel
function kernelGaussian(k) {
  return function(v) {
    return (Math.exp(-0.5 * (v / k) * (v / k)) / (Math.sqrt(2 * Math.PI) * k));
  };
}

// Kernel Density Estimator
function kde(kernel, thresholds, data) {
  return thresholds.map(t => [t, d3.mean(data, d => kernel(t - d))]);
}

const KernelDensityEstimation = () => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const rawData = useMemo(() => generateBiomarkerData(), []);

  const [bandwidth, setBandwidth] = useState(8);
  const [kernelType, setKernelType] = useState('Epanechnikov'); // 'Epanechnikov' | 'Gaussian'
  const [hoveredDensity, setHoveredDensity] = useState(null);

  // Compute KDE curve
  const { densityCurve, xDomain, peakValue } = useMemo(() => {
    const xMin = 40;
    const xMax = 210;
    const thresholds = d3.range(xMin, xMax, 1);
    const kernel = kernelType === 'Epanechnikov' ? kernelEpanechnikov(bandwidth) : kernelGaussian(bandwidth);
    const density = kde(kernel, thresholds, rawData);
    const maxVal = d3.max(density, d => d[1]) || 0.01;
    return { densityCurve: density, xDomain: [xMin, xMax], peakValue: maxVal };
  }, [rawData, bandwidth, kernelType]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = 950;
    const height = 460;
    const margin = { top: 30, right: 40, bottom: 65, left: 65 };

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('viewBox', [0, 0, width, height])
      .attr('width', '100%')
      .attr('height', 'auto')
      .style('max-height', '500px')
      .style('background', '#0b1120')
      .style('border-radius', '12px');

    const defs = svg.append('defs');

    // Fill gradient
    const grad = defs.append('linearGradient')
      .attr('id', 'kde-grad')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    grad.append('stop').attr('offset', '0%').attr('stop-color', '#8B5CF6').attr('stop-opacity', 0.7);
    grad.append('stop').attr('offset', '100%').attr('stop-color', '#06B6D4').attr('stop-opacity', 0.05);

    // Scales
    const x = d3.scaleLinear()
      .domain(xDomain)
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain([0, peakValue * 1.2])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // Grid
    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(6).tickSize(-(width - margin.left - margin.right)).tickFormat(''))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').attr('stroke', '#1e293b').attr('stroke-dasharray', '3,3'));

    // Axes
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(10))
      .call(g => g.select('.domain').attr('stroke', '#334155'))
      .call(g => g.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '10px').attr('font-family', 'Aldrich, sans-serif'));

    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(6).tickFormat(d3.format('.3f')))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '10px').attr('font-family', 'Aldrich, sans-serif'));

    // Axis Labels
    svg.append('text')
      .attr('x', width - margin.right)
      .attr('y', height - margin.bottom + 36)
      .attr('text-anchor', 'end')
      .attr('fill', '#64748b')
      .attr('font-size', '11px')
      .attr('font-family', 'Aldrich, sans-serif')
      .text('PATIENT BIOMARKER VALUE (mg/dL) →');

    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -margin.top)
      .attr('y', margin.left - 48)
      .attr('text-anchor', 'end')
      .attr('fill', '#64748b')
      .attr('font-size', '11px')
      .attr('font-family', 'Aldrich, sans-serif')
      .text('PROBABILITY DENSITY ESTIMATE f(x) →');

    // Area
    const area = d3.area()
      .curve(d3.curveBasis)
      .x(d => x(d[0]))
      .y0(y(0))
      .y1(d => y(d[1]));

    svg.append('path')
      .datum(densityCurve)
      .attr('fill', 'url(#kde-grad)')
      .attr('d', area);

    // Line
    const line = d3.line()
      .curve(d3.curveBasis)
      .x(d => x(d[0]))
      .y(d => y(d[1]));

    svg.append('path')
      .datum(densityCurve)
      .attr('fill', 'none')
      .attr('stroke', '#8B5CF6')
      .attr('stroke-width', 2.5)
      .attr('d', line);

    // Rug Plot (Ticks for individual observations)
    const rugG = svg.append('g').attr('class', 'rug-plot');
    rawData.forEach(val => {
      rugG.append('line')
        .attr('x1', x(val))
        .attr('x2', x(val))
        .attr('y1', height - margin.bottom)
        .attr('y2', height - margin.bottom + 8)
        .attr('stroke', '#06B6D4')
        .attr('stroke-width', 1.2)
        .attr('stroke-opacity', 0.55);
    });

    // Crosshair on hover
    const crosshair = svg.append('g').style('display', 'none');
    const vLine = crosshair.append('line')
      .attr('y1', margin.top)
      .attr('y2', height - margin.bottom)
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3,3');
    const dot = crosshair.append('circle')
      .attr('r', 5)
      .attr('fill', '#38bdf8')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2);

    svg.append('rect')
      .attr('x', margin.left)
      .attr('y', margin.top)
      .attr('width', width - margin.left - margin.right)
      .attr('height', height - margin.top - margin.bottom)
      .attr('fill', 'transparent')
      .attr('cursor', 'crosshair')
      .on('mouseenter', () => crosshair.style('display', null))
      .on('mouseleave', () => {
        crosshair.style('display', 'none');
        setHoveredDensity(null);
      })
      .on('mousemove', (event) => {
        const [mx] = d3.pointer(event);
        const valX = Math.round(x.invert(mx));
        const match = densityCurve.find(d => d[0] === valX);
        if (match) {
          vLine.attr('x1', x(match[0])).attr('x2', x(match[0]));
          dot.attr('cx', x(match[0])).attr('cy', y(match[1]));
          setHoveredDensity({ x: match[0], density: match[1] });
        }
      });

  }, [densityCurve, xDomain, peakValue, rawData]);

  return (
    <div ref={containerRef} className="w-full flex flex-col gap-4 font-Aldrich text-slate-100 p-2 sm:p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 text-lg shadow-inner">
            🔔
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
              Kernel Density Estimation (KDE)
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Non-Parametric PDF
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Continuous probability density estimation with Epanechnikov / Gaussian kernels & individual rug-plot observations
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4 text-xs bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Bandwidth (h): <strong className="text-purple-300">{bandwidth}</strong></span>
            <input
              type="range"
              min={3}
              max={25}
              value={bandwidth}
              onChange={(e) => setBandwidth(+e.target.value)}
              className="w-24 h-1.5 accent-purple-400 cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-1.5">
            {['Epanechnikov', 'Gaussian'].map(k => (
              <button
                key={k}
                onClick={() => setKernelType(k)}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer font-bold ${
                  kernelType === k ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main SVG Visualization */}
      <div className="relative w-full rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950/80 p-2 shadow-inner">
        <svg ref={svgRef} className="w-full h-auto select-none" />

        {hoveredDensity && (
          <div className="absolute top-4 right-4 bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-md pointer-events-none">
            <span className="text-xs font-bold text-white block">Biomarker Level: {hoveredDensity.x} mg/dL</span>
            <span className="text-sm font-bold text-purple-400 mt-1 block">
              f(x) Density: {hoveredDensity.density.toFixed(5)}
            </span>
            <span className="text-[10px] text-slate-400">
              Estimated sample probability mass density
            </span>
          </div>
        )}
      </div>

      {/* Summary Telemetry */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Cohort Sample Size</span>
          <span className="text-base font-bold text-white">{rawData.length} Patients</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Kernel Function</span>
          <span className="text-base font-bold text-purple-400">{kernelType}</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Peak Density Mode</span>
          <span className="text-base font-bold text-cyan-400">{peakValue.toFixed(4)}</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Smoothing Bandwidth</span>
          <span className="text-base font-bold text-emerald-400">h = {bandwidth}</span>
        </div>
      </div>
    </div>
  );
};

export default KernelDensityEstimation;
