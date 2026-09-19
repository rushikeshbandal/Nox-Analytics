import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const LineChart = ({ data, xField, yField }) => {
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

    // Sort data if xField is time-like (like Month)
    const parseTime = d3.timeParse('%B');
    const isMonth = filteredData.every((d) => parseTime(d[xField]));

    const sortedData = isMonth
      ? filteredData
          .map((d) => ({ ...d, parsedX: parseTime(d[xField]) }))
          .sort((a, b) => a.parsedX - b.parsedX)
      : filteredData;

    const x = isMonth
      ? d3
          .scaleTime()
          .domain(d3.extent(sortedData, (d) => d.parsedX))
          .range([0, width])
      : d3
          .scalePoint()
          .domain(sortedData.map((d) => d[xField]))
          .range([0, width]);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(sortedData, (d) => +d[yField])])
      .range([height, 0]);

    const line = d3
      .line()
      .x((d) => (isMonth ? x(d.parsedX) : x(d[xField])))
      .y((d) => y(+d[yField]));

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(isMonth ? d3.axisBottom(x).tickFormat(d3.timeFormat('%b')) : d3.axisBottom(x));

    svg.append('g').call(d3.axisLeft(y));

    svg
      .append('path')
      .datum(sortedData)
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 2)
      .attr('d', line);

    svg
      .selectAll('circle')
      .data(sortedData)
      .enter()
      .append('circle')
      .attr('cx', (d) => (isMonth ? x(d.parsedX) : x(d[xField])))
      .attr('cy', (d) => y(+d[yField]))
      .attr('r', 4)
      .attr('fill', '#3b82f6');
  }, [data, xField, yField]);

  return <div ref={chartRef} style={{ width: '100%', minHeight: '400px' }} />;
};

export default LineChart;
