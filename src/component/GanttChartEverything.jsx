import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

const statusColors = {
  complete: '#4caf50',
  'in progress': '#ff9800',
  'to do': '#f44336'
};

const GanttChartEverything = ({ tasks }) => {
  const ref = useRef();
  const [showGrid, setShowGrid] = useState(true);

  useEffect(() => {
    if (!tasks || tasks.length === 0) return;

    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 200 };
    const width = 800 - margin.left - margin.right;
    const height = tasks.length * 35;

    // Append main group
    const chart = svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .style('background', 'white')
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X scale and axis
    const x = d3.scaleTime()
      .domain([d3.min(tasks, d => new Date(d.start)), d3.max(tasks, d => new Date(d.end))])
      .range([0, width]);

    const xAxis = d3.axisBottom(x).tickFormat(d3.timeFormat('%b %d'));

    // Y scale and axis
    const y = d3.scaleBand()
      .domain(tasks.map(d => d.name))
      .range([0, height])
      .padding(0.1);

    const yAxis = d3.axisLeft(y);

    // Add horizontal gridlines for Y axis
    if (showGrid) {
      chart.append('g')
        .attr('class', 'grid grid-x')
        .attr('transform', `translate(0, ${height})`)
        .call(
          d3.axisBottom(x)
            .ticks(10)
            .tickSize(-height)
            .tickFormat('')
        )
        .selectAll('line')
        .attr('stroke', '#ddd')
        .attr('stroke-dasharray', '2,2');

      chart.append('g')
        .attr('class', 'grid grid-y')
        .call(
          d3.axisLeft(y)
            .tickSize(-width)
            .tickFormat('')
        )
        .selectAll('line')
        .attr('stroke', '#ddd')
        .attr('stroke-dasharray', '2,2');
    }

    // Draw axes on top of gridlines
    chart.append('g').call(yAxis)
      .selectAll('text')
      .attr('fill', 'black')
      .style('font-size', '12px');

    chart.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(xAxis)
      .selectAll('text')
      .attr('fill', 'black')
      .style('font-size', '12px');

    // Draw bars
    chart.selectAll('rect')
      .data(tasks)
      .enter()
      .append('rect')
      .attr('x', d => x(new Date(d.start)))
      .attr('y', d => y(d.name))
      .attr('width', d => {
        const start = new Date(d.start);
        const end = new Date(d.end);
        return Math.max(1, x(end) - x(start));
      })
      .attr('height', y.bandwidth())
      .attr('fill', d => statusColors[d.status?.toLowerCase()] || '#999')
      .append('title')
      .text(d => `Assignees: ${Array.isArray(d.assignees) ? d.assignees.join(', ') : ''}`);

  }, [tasks, showGrid]);

  return (
     <div style={{ overflowX: 'auto', maxWidth: '100%', backgroundColor: 'white', color: 'black', padding: '10px', borderRadius: '8px' }}>
    <h3 className="text-xl font-semibold mb-4">Gantt Chart</h3>

    {Array.isArray(tasks) && tasks.length > 0 ? (
      <>
        <button
          onClick={() => setShowGrid(!showGrid)}
          style={{
            marginBottom: '10px',
            padding: '6px 12px',
            backgroundColor: showGrid ? '#4caf50' : '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {showGrid ? 'Hide Gridlines' : 'Show Gridlines'}
        </button>
        <svg ref={ref}></svg>
      </>
    ) : (
      <div style={{ padding: '20px', textAlign: 'center', fontSize: '16px', color: '#777' }}>
        No data available
      </div>
    )}
  </div>
  );
};

export default GanttChartEverything;
