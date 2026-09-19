import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const D3Chart = ({ data, xField, yField }) => {
  const chartRef = useRef();

  useEffect(() => {
    if (!data || !xField || !yField) return;

    // Clear previous chart
    d3.select(chartRef.current).selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 50, left: 60 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3
      .select(chartRef.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const filteredData = data.filter(
      (d) => d[xField] && d[yField] && !isNaN(+d[yField])
    );

    const x = d3
      .scaleBand()
      .domain(filteredData.map((d) => d[xField]))
      .range([0, width])
      .padding(0.2);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(filteredData, (d) => +d[yField])])
      .range([height, 0]);

    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');

    svg.append('g').call(d3.axisLeft(y));

    svg
      .selectAll('bars')
      .data(filteredData)
      .enter()
      .append('rect')
      .attr('x', (d) => x(d[xField]))
      .attr('y', (d) => y(+d[yField]))
      .attr('width', x.bandwidth())
      .attr('height', (d) => height - y(+d[yField]))
      .attr('fill', '#69b3a2');
  }, [data, xField, yField]);

  return <div ref={chartRef} style={{ width: '100%', minHeight: '400px' }} />;
};

export default D3Chart;
