import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const GanttTimeline = ({ data }) => {
  const svgRef = useRef();
  const tooltipRef = useRef();
  const [showGridlines, setShowGridlines] = useState(true); // toggle state

  useEffect(() => {
    if (!data || data.length === 0) return;

    const margin = { top: 40, right: 30, bottom: 50, left: 120 };
    const width = 800 - margin.left - margin.right;
    const height = data.length * 25;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // clear SVG

    const chart = svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const parseExcelDate = (excelDate) => {
      if (!excelDate) return null;
      if (!isNaN(excelDate)) {
        return new Date((excelDate - 25569) * 86400 * 1000);
      }
      const parsed = new Date(excelDate);
      return isNaN(parsed.getTime()) ? null : parsed;
    };

    const tasks = data.map(d => ({
      ...d,
      startDate: parseExcelDate(d.START),
      endDate: parseExcelDate(d.END),
    })).filter(d => d.startDate && d.endDate);

    const xScale = d3.scaleTime()
      .domain([d3.min(tasks, d => d.startDate), d3.max(tasks, d => d.endDate)])
      .range([0, width]);

    const yScale = d3.scaleBand()
      .domain(tasks.map(d => d.TASK))
      .range([0, height])
      .padding(0.3);

    // Draw vertical gridlines only if enabled
    if (showGridlines) {
      chart.selectAll('.grid-line')
        .data(xScale.ticks(d3.timeDay.every(1)))
        .enter()
        .append('line')
        .attr('class', 'grid-line')
        .attr('x1', d => xScale(d))
        .attr('x2', d => xScale(d))
        .attr('y1', 0)
        .attr('y2', height)
        .attr('stroke', '#ccc')
        .attr('stroke-dasharray', '4 2');
    }

    // Axes
    chart.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).ticks(6).tickFormat(d3.timeFormat('%b %d, %Y')));

    chart.append('g')
      .call(d3.axisLeft(yScale));

    // Tooltip
    const tooltip = d3.select(tooltipRef.current)
      .style('position', 'fixed')
      .style('visibility', 'hidden')
      .style('background', '#333')
      .style('color', '#fff')
      .style('padding', '5px 8px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none');

    const colorScale = d3.scaleOrdinal(d3.schemeSet3);

    chart.selectAll('rect')
      .data(tasks)
      .enter()
      .append('rect')
      .attr('x', d => xScale(d.startDate))
      .attr('y', d => yScale(d.TASK))
      .attr('width', d => xScale(d.endDate) - xScale(d.startDate))
      .attr('height', yScale.bandwidth())
      .attr('fill', (d, i) => colorScale(i))
      .attr('rx', 4)
      .attr('ry', 4)
      .on('mouseover', (event, d) => {
        tooltip
          .style('visibility', 'visible')
          .html(`<strong>${d.TASK}</strong><br/>
            ${d3.timeFormat('%b %d, %Y')(d.startDate)} → ${d3.timeFormat('%b %d, %Y')(d.endDate)}`);
      })
      .on('mousemove', (event) => {
        tooltip
          .style('left', `${event.clientX + 10}px`)
          .style('top', `${event.clientY + 10}px`);
      })
      .on('mouseout', () => tooltip.style('visibility', 'hidden'));

    chart.selectAll('text.task-label')
      .data(tasks)
      .enter()
      .append('text')
      .attr('x', d => xScale(d.startDate) + 5)
      .attr('y', d => yScale(d.TASK) + yScale.bandwidth() / 1.6)
      .text(d => d.TASK)
      .attr('fill', 'white')
      .style('font-size', '11px')
      .style('pointer-events', 'none');

    // Today Line
    const today = new Date();
    chart.append('line')
      .attr('x1', xScale(today))
      .attr('x2', xScale(today))
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', 'red')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4');
  }, [data, showGridlines]);

  return (
    <div style={{ position: 'relative', overflowX: 'auto' }}>
    {data && data.length > 0 ? (
      <>
        <div style={{ marginBottom: '10px' }}>
          <label>
            <input
              type="checkbox"
              checked={showGridlines}
              onChange={() => setShowGridlines(prev => !prev)}
            />{' '}
            Show Gridlines
          </label>
        </div>
        <svg ref={svgRef}></svg>
        <div ref={tooltipRef}></div>
      </>
    ) : (
      <p style={{ padding: '10px', fontStyle: 'italic', color: '#888' }}>
        No data available
      </p>
    )}
  </div>
  );
};

export default GanttTimeline;
