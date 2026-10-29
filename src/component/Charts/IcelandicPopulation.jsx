// IcelandicPopulation.jsx
'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';

// Demographic age brackets
const AGE_BRACKETS = [
  '0-4', '5-9', '10-14', '15-19', '20-24', '25-29', '30-34',
  '35-39', '40-44', '45-49', '50-54', '55-59', '60-64', '65-69',
  '70-74', '75-79', '80-84', '85+'
];

// Historical milestones
const MILESTONES = {
  1841: 'First modern census (~57,000 residents)',
  1882: 'Severe famine & Western emigration wave',
  1918: 'Act of Union & Spanish Flu pandemic',
  1944: 'Foundation of the Republic of Iceland',
  1970: 'Post-war modernization & urban expansion',
  2000: 'Turn of millennium & tech boom',
  2019: 'Modern peak population (~364,000)'
};

// Procedural realistic model of Icelandic population cohorts across 1841–2019
function generateIcelandicData() {
  const years = [];
  for (let y = 1841; y <= 2019; y += (y < 1900 ? 5 : y < 1950 ? 2 : 1)) {
    years.push(y);
  }
  if (!years.includes(2019)) years.push(2019);

  const data = {};
  years.forEach(year => {
    // Total pop model: 1841 ~ 57k -> 1900 ~ 78k -> 1950 ~ 143k -> 2000 ~ 281k -> 2019 ~ 364k
    const t = (year - 1841) / (2019 - 1841);
    const totalPop = Math.round(57000 + 40000 * Math.pow(t, 1.5) + 267000 * Math.pow(t, 2.8));

    // Age distribution shifts from young heavy pyramid in 1841 to aging column in 2019
    const cohorts = AGE_BRACKETS.map((bracket, idx) => {
      // In 1841, younger brackets have high share, older brackets drop quickly
      const youngWeight = Math.exp(-idx * 0.18);
      // In 2019, middle and older brackets are much thicker
      const modernWeight = Math.exp(-Math.pow(idx - 7, 2) / 35) + 0.3 * Math.exp(-idx * 0.08);
      const weight = (1 - t) * youngWeight + t * modernWeight;
      return { bracket, weight };
    });

    const sumWeights = cohorts.reduce((acc, c) => acc + c.weight, 0);
    const male = [];
    const female = [];

    cohorts.forEach(c => {
      const cohortTotal = (c.weight / sumWeights) * totalPop;
      // Slight sex ratio variation (more males at birth, more females in 75+)
      const maleShare = 0.51 - (cohorts.indexOf(c) * 0.0035);
      male.push({ bracket: c.bracket, value: Math.round(cohortTotal * maleShare) });
      female.push({ bracket: c.bracket, value: Math.round(cohortTotal * (1 - maleShare)) });
    });

    data[year] = { year, totalPop, male, female };
  });

  return { years, data };
}

const IcelandicPopulation = () => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const { years, data } = useMemo(() => generateIcelandicData(), []);

  const [currentYear, setCurrentYear] = useState(2019);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [viewMode, setViewMode] = useState('pyramid'); // 'pyramid' | 'timeline'
  const [hoveredCohort, setHoveredCohort] = useState(null);

  // Playback timer
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentYear(prev => {
        const nextIdx = years.indexOf(prev) + 1;
        if (nextIdx >= years.length) {
          setIsPlaying(false);
          return years[0];
        }
        return years[nextIdx];
      });
    }, 180 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, years]);

  const yearData = data[currentYear] || data[2019];

  // Draw Pyramid or Timeline
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !yearData) return;

    const width = 920;
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

    if (viewMode === 'pyramid') {
      // Bilateral mirrored pyramid: Male on Left, Female on Right
      const margin = { top: 40, right: 60, bottom: 40, left: 60 };
      const centerX = width / 2;
      const innerGap = 35; // gap for age bracket text
      const halfWidth = (width - margin.left - margin.right - innerGap * 2) / 2;

      const y = d3.scaleBand()
        .domain(AGE_BRACKETS)
        .range([height - margin.bottom, margin.top])
        .padding(0.18);

      // Max population in any single cohort bracket across all years (~18,000)
      const maxCohortVal = 18000;

      const xMale = d3.scaleLinear()
        .domain([0, maxCohortVal])
        .range([centerX - innerGap, margin.left]);

      const xFemale = d3.scaleLinear()
        .domain([0, maxCohortVal])
        .range([centerX + innerGap, width - margin.right]);

      // Center background spine
      svg.append('rect')
        .attr('x', centerX - innerGap)
        .attr('y', margin.top)
        .attr('width', innerGap * 2)
        .attr('height', height - margin.top - margin.bottom)
        .attr('fill', '#0f172a')
        .attr('rx', 6);

      // Center Age Bracket Labels with halo stroke
      const ageLabels = svg.append('g').attr('class', 'age-labels');
      AGE_BRACKETS.forEach(bracket => {
        ageLabels.append('text')
          .attr('x', centerX)
          .attr('y', y(bracket) + y.bandwidth() / 2)
          .attr('dy', '0.35em')
          .attr('text-anchor', 'middle')
          .attr('paint-order', 'stroke fill')
          .attr('stroke', '#020617')
          .attr('stroke-width', 3)
          .attr('fill', '#f1f5f9')
          .attr('font-size', '10px')
          .attr('font-weight', 'bold')
          .attr('font-family', 'Aldrich, sans-serif')
          .text(bracket);
      });

      // Axis Ticks
      const maleAxis = d3.axisBottom(xMale).ticks(4).tickFormat(d => `${d / 1000}k`);
      const femaleAxis = d3.axisBottom(xFemale).ticks(4).tickFormat(d => `${d / 1000}k`);

      svg.append('g')
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .call(maleAxis)
        .call(g => g.select('.domain').attr('stroke', '#334155'))
        .call(g => g.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '10px'));

      svg.append('g')
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .call(femaleAxis)
        .call(g => g.select('.domain').attr('stroke', '#334155'))
        .call(g => g.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '10px'));

      // Headers: Males (Left, Cyan), Females (Right, Rose)
      svg.append('text')
        .attr('x', centerX - innerGap - halfWidth / 2)
        .attr('y', margin.top - 15)
        .attr('text-anchor', 'middle')
        .attr('fill', '#06B6D4')
        .attr('font-size', '13px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'Aldrich, sans-serif')
        .text('♂ MALE POPULATION');

      svg.append('text')
        .attr('x', centerX + innerGap + halfWidth / 2)
        .attr('y', margin.top - 15)
        .attr('text-anchor', 'middle')
        .attr('fill', '#F43F5E')
        .attr('font-size', '13px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'Aldrich, sans-serif')
        .text('♀ FEMALE POPULATION');

      // Male Bars (grow leftwards)
      const maleBars = svg.append('g').attr('class', 'male-bars')
        .selectAll('rect')
        .data(yearData.male)
        .join('rect')
        .attr('x', d => xMale(d.value))
        .attr('y', d => y(d.bracket))
        .attr('width', d => Math.max(0, (centerX - innerGap) - xMale(d.value)))
        .attr('height', y.bandwidth())
        .attr('fill', '#06B6D4')
        .attr('fill-opacity', 0.85)
        .attr('stroke', '#0891b2')
        .attr('stroke-width', 1)
        .attr('rx', 3)
        .attr('cursor', 'pointer')
        .on('mouseenter', (event, d) => setHoveredCohort({ sex: 'Male', bracket: d.bracket, value: d.value }))
        .on('mouseleave', () => setHoveredCohort(null));

      // Female Bars (grow rightwards)
      const femaleBars = svg.append('g').attr('class', 'female-bars')
        .selectAll('rect')
        .data(yearData.female)
        .join('rect')
        .attr('x', centerX + innerGap)
        .attr('y', d => y(d.bracket))
        .attr('width', d => Math.max(0, xFemale(d.value) - (centerX + innerGap)))
        .attr('height', y.bandwidth())
        .attr('fill', '#F43F5E')
        .attr('fill-opacity', 0.85)
        .attr('stroke', '#e11d48')
        .attr('stroke-width', 1)
        .attr('rx', 3)
        .attr('cursor', 'pointer')
        .on('mouseenter', (event, d) => setHoveredCohort({ sex: 'Female', bracket: d.bracket, value: d.value }))
        .on('mouseleave', () => setHoveredCohort(null));

      // Year Watermark in Center Top
      svg.append('text')
        .attr('x', centerX)
        .attr('y', margin.top + 30)
        .attr('text-anchor', 'middle')
        .attr('font-size', '46px')
        .attr('font-weight', '900')
        .attr('fill', '#ffffff')
        .attr('fill-opacity', 0.08)
        .attr('font-family', 'Aldrich, sans-serif')
        .text(currentYear);

    } else {
      // Historical Timeline Area View (1841 - 2019)
      const margin = { top: 40, right: 40, bottom: 50, left: 70 };
      const seriesList = years.map(y => data[y]);

      const x = d3.scaleLinear()
        .domain([1841, 2019])
        .range([margin.left, width - margin.right]);

      const y = d3.scaleLinear()
        .domain([0, 400000])
        .range([height - margin.bottom, margin.top]);

      // Grid
      svg.append('g')
        .attr('transform', `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(6).tickSize(-(width - margin.left - margin.right)).tickFormat(''))
        .call(g => g.select('.domain').remove())
        .call(g => g.selectAll('.tick line').attr('stroke', '#1e293b').attr('stroke-dasharray', '3,3'));

      // Area generator
      const area = d3.area()
        .x(d => x(d.year))
        .y0(y(0))
        .y1(d => y(d.totalPop))
        .curve(d3.curveMonotoneX);

      // Gradient fill
      const defs = svg.append('defs');
      const grad = defs.append('linearGradient')
        .attr('id', 'iceland-area-grad')
        .attr('x1', '0%').attr('y1', '0%').attr('x2', '0%').attr('y2', '100%');
      grad.append('stop').attr('offset', '0%').attr('stop-color', '#10B981').attr('stop-opacity', 0.8);
      grad.append('stop').attr('offset', '100%').attr('stop-color', '#06B6D4').attr('stop-opacity', 0.1);

      svg.append('path')
        .datum(seriesList)
        .attr('fill', 'url(#iceland-area-grad)')
        .attr('d', area);

      const line = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.totalPop))
        .curve(d3.curveMonotoneX);

      svg.append('path')
        .datum(seriesList)
        .attr('fill', 'none')
        .attr('stroke', '#10B981')
        .attr('stroke-width', 2.5)
        .attr('d', line);

      // Scrubber vertical line at currentYear
      svg.append('line')
        .attr('x1', x(currentYear))
        .attr('x2', x(currentYear))
        .attr('y1', margin.top)
        .attr('y2', height - margin.bottom)
        .attr('stroke', '#38bdf8')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4,4');

      svg.append('circle')
        .attr('cx', x(currentYear))
        .attr('cy', y(yearData.totalPop))
        .attr('r', 6)
        .attr('fill', '#38bdf8')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 2);

      // Axes
      svg.append('g')
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(10).tickFormat(d3.format('d')))
        .call(g => g.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '10px'));

      svg.append('g')
        .attr('transform', `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(6).tickFormat(d => `${d / 1000}k`))
        .call(g => g.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '10px'));
    }

  }, [yearData, viewMode, currentYear, years, data]);

  return (
    <div ref={containerRef} className="w-full flex flex-col gap-4 font-Aldrich text-slate-100 p-2 sm:p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-lg shadow-inner">
            🇮🇸
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
              Icelandic Population by Age (1841–2019)
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                D3 Demographic Scrubber
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Historical age-sex pyramid & demographic transition • Scrubber controls over 178 years of demographic data
            </p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-lg border border-slate-700 text-xs">
          <button
            onClick={() => setViewMode('pyramid')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer font-medium ${
              viewMode === 'pyramid'
                ? 'bg-cyan-600 text-white shadow font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Age Pyramid
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer font-medium ${
              viewMode === 'timeline'
                ? 'bg-cyan-600 text-white shadow font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Total Growth Curve
          </button>
        </div>
      </div>

      {/* Timeline Scrubber & Animation Controls */}
      <div className="flex flex-col gap-2 bg-slate-900/70 p-3.5 rounded-xl border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all cursor-pointer shadow-md flex items-center gap-1.5"
            >
              <span>{isPlaying ? '⏸ Pause' : '▶ Play Timeline'}</span>
            </button>
            <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-md border border-slate-700 text-[11px]">
              <span className="text-slate-400">Speed:</span>
              {[1, 2, 4].map(spd => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`px-1.5 py-0.5 rounded ${playbackSpeed === spd ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300'}`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* Current Year Readout */}
          <div className="flex items-center gap-3">
            <span className="text-slate-400">Selected Year:</span>
            <span className="text-2xl font-black text-cyan-400 tracking-wider">{currentYear}</span>
            <span className="text-xs bg-slate-800 px-2.5 py-1 rounded-full text-emerald-300 border border-slate-700 font-bold">
              {yearData.totalPop.toLocaleString()} Citizens
            </span>
          </div>
        </div>

        {/* Range Slider */}
        <input
          type="range"
          min={1841}
          max={2019}
          value={currentYear}
          onChange={(e) => {
            setIsPlaying(false);
            const val = +e.target.value;
            // Find closest available year
            const closest = years.reduce((prev, curr) => Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev);
            setCurrentYear(closest);
          }}
          className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
        />

        {/* Historical milestone note */}
        {MILESTONES[currentYear] && (
          <div className="text-[11px] text-amber-300/90 flex items-center gap-1.5 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
            <span>📜</span> Milestone: {MILESTONES[currentYear]}
          </div>
        )}
      </div>

      {/* Main SVG Visualization */}
      <div className="relative w-full rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950/80 p-2 shadow-inner">
        <svg ref={svgRef} className="w-full h-auto select-none" />

        {/* Hover Readout Card */}
        {hoveredCohort && (
          <div className="absolute top-4 right-4 bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-md">
            <span className="text-xs font-bold text-white block">
              {hoveredCohort.sex}s Aged {hoveredCohort.bracket}
            </span>
            <span className="text-sm font-bold text-cyan-400 mt-1 block">
              {hoveredCohort.value.toLocaleString()} individuals
            </span>
            <span className="text-[10px] text-slate-400">
              {((hoveredCohort.value / yearData.totalPop) * 100).toFixed(1)}% of total Icelandic population in {currentYear}
            </span>
          </div>
        )}
      </div>

      {/* Summary Telemetry */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Historical Base (1841)</span>
          <span className="text-base font-bold text-slate-300">57,059 Citizens</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Current Year Total</span>
          <span className="text-base font-bold text-cyan-400">{yearData.totalPop.toLocaleString()}</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Net Growth Multiplier</span>
          <span className="text-base font-bold text-emerald-400">{(yearData.totalPop / 57059).toFixed(2)}x Expansion</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Demographic Phase</span>
          <span className="text-base font-bold text-purple-400">
            {currentYear < 1900 ? 'Stage 1 High Fertility' : currentYear < 1970 ? 'Stage 2 Industrial Boom' : 'Stage 4 Mature Column'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default IcelandicPopulation;
