import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const data = [
  { date: "2007-04-23", close: 93.24 },
  { date: "2007-04-24", close: 95.35 },
  { date: "2007-04-25", close: 98.84 },
  { date: "2007-08-14", close: 119.9 }
];

const PannableChart = () => {
  const containerRef = useRef();

  useEffect(() => {
    if (!containerRef.current) return;

    const parsedData = data.map(d => ({
      date: new Date(d.date),
      close: +d.close
    }));

    const width = containerRef.current.clientWidth || window.innerWidth;
    const totalWidth = 600;  // Reduced width
    const height = 300;      // Reduced height
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };

    const x = d3.scaleUtc()
      .domain(d3.extent(parsedData, d => d.date))
      .range([margin.left, totalWidth - margin.right]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(parsedData, d => d.close)]).nice()
      .range([height - margin.bottom, margin.top]);

    const area = d3.area()
      .curve(d3.curveStep)
      .x(d => x(d.date))
      .y0(y(0))
      .y1(d => y(d.close));

    d3.select(containerRef.current).selectAll('*').remove();

    const parent = d3.select(containerRef.current).style('position', 'relative');

    parent.append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('position', 'absolute')
      .style('pointer-events', 'none')
      .append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5))
      .call(g => g.select('.domain').remove())
      .call(g => g.select('.tick:last-of-type text').clone()
        .attr('x', 3)
        .attr('text-anchor', 'start')
        .attr('font-weight', 'bold')
        .text('$ Close'));

    const body = parent.append('div')
      .style('overflow-x', 'scroll')
      .style('height', `${height}px`)
      .style('width', '100%')
      .style('-webkit-overflow-scrolling', 'touch');

    const svg = body.append('svg')
      .attr('width', totalWidth)
      .attr('height', height)
      .style('display', 'block');

    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(3).tickSizeOuter(0));  // Fewer ticks

    svg.append('path')
      .datum(parsedData)
      .attr('fill', 'steelblue')
      .attr('d', area);

    body.node().scrollLeft = body.node().scrollWidth;
  }, []);

  return (
    <div ref={containerRef} style={{ height: '300px', position: 'relative' }} />
  );
};

export default PannableChart;
