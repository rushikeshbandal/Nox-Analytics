import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const Histogram = () => {
  const svgRef = useRef();

  useEffect(() => {
    fetch('/unemployment.json')
      .then(response => response.json())
      .then(data => renderChart(data))
      .catch(error => console.error('Error loading data:', error));
  }, []);

  const renderChart = (unemploymentData) => {
    const width = 960;
    const height = 500;
    const marginTop = 20, marginRight = 20, marginBottom = 30, marginLeft = 40;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .attr('style', 'max-width: 100%; height: auto;');

    svg.selectAll('*').remove(); // Clear previous chart

    const xDomain = d3.extent(unemploymentData, d => d.rate);
    // Generate thresholds with step 1.0
    const thresholds = d3.range(Math.floor(xDomain[0]), Math.ceil(xDomain[1]) + 1, 1);

    const bins = d3.bin()
      .domain(xDomain)
      .thresholds(thresholds)
      .value(d => d.rate)(unemploymentData);

    const x = d3.scaleLinear()
      .domain([bins[0].x0, bins[bins.length - 1].x1])
      .range([marginLeft, width - marginRight]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(bins, d => d.length)]).nice()
      .range([height - marginBottom, marginTop]);

    svg.append('g')
      .attr('fill', 'steelblue')
      .selectAll('rect')
      .data(bins)
      .join('rect')
      .attr('x', d => x(d.x0) + 1)
      .attr('width', d => Math.max(0, x(d.x1) - x(d.x0) - 1))
      .attr('y', d => y(d.length))
      .attr('height', d => y(0) - y(d.length));

    // X Axis
    svg.append('g')
      .attr('transform', `translate(0,${height - marginBottom})`)
      .call(d3.axisBottom(x).ticks(thresholds.length).tickSizeOuter(0))
      .call(g => g.append('text')
        .attr('x', width)
        .attr('y', marginBottom - 4)
        .attr('fill', 'currentColor')
        .attr('text-anchor', 'end')
        .text('Unemployment rate (%) →'));

    // Y Axis
    svg.append('g')
      .attr('transform', `translate(${marginLeft},0)`)
      .call(d3.axisLeft(y).ticks(height / 40))
      .call(g => g.select('.domain').remove())
      .call(g => g.append('text')
        .attr('x', -marginLeft)
        .attr('y', 10)
        .attr('fill', 'currentColor')
        .attr('text-anchor', 'start')
        .text('↑ Frequency (number of counties)'));
  };

  return <svg ref={svgRef}></svg>;
};

export default Histogram;
