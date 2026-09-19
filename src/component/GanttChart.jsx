import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const GanttChart = ({ data }) => {
  const svgRef = useRef();
  const tooltipRef = useRef();
  const [showGrid, setShowGrid] = useState(true); // Gridlines toggle

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    if (!tooltipRef.current) {
      const tooltipDiv = d3.select('body')
        .append('div')
        .attr('class', 'gantt-tooltip')
        .style('position', 'absolute')
        .style('opacity', 0)
        .style('padding', '8px')
        .style('background', '#fefefe')
        .style('border', '1px solid #999')
        .style('border-radius', '5px')
        .style('pointer-events', 'none')
        .style('font-size', '12px')
        .style('box-shadow', '0 0 5px rgba(0,0,0,0.3)')
        .style('z-index', 999);
      tooltipRef.current = tooltipDiv.node();
    }

    const tooltip = d3.select(tooltipRef.current);

    const margin = { top: 40, right: 20, bottom: 80, left: 150 };
    const width = 850 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    const g = svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const toDate = (serial) => {
      if (!serial) return null;
      if (!isNaN(serial)) {
        return new Date((Math.floor(serial - 25569)) * 86400 * 1000);
      }
      const parsed = new Date(serial);
      return isNaN(parsed.getTime()) ? null : parsed;
    };

    const tasks = data
      .filter(t => t['TASK TITLE'] && t['START DATE'] && t['DUE DATE'])
      .map((t, i) => ({
        title: `${i + 1}. ${t['TASK TITLE']}`,
        owner: t['TASK OWNER'],
        start: toDate(t['START DATE']),
        end: toDate(t['DUE DATE']),
        duration: t['DURATION']
      }));

    if (!tasks.length) return;

    const minStart = d3.timeDay.floor(d3.min(tasks, d => d.start));
    const maxEnd = d3.timeDay.ceil(d3.max(tasks, d => d.end));

    const x = d3.scaleTime()
      .domain([minStart, maxEnd])
      .range([0, width]);

    const y = d3.scaleBand()
      .domain(tasks.map(d => d.title))
      .range([0, height])
      .padding(0.3);

    // x-axis
    const xAxis = g.append('g')
      .attr('transform', `translate(8,${height})`)
      .call(d3.axisBottom(x)
        .ticks(d3.timeDay.every(1))
        .tickFormat(d3.timeFormat("%b %d")));

    xAxis.selectAll("text")
      .attr("transform", "rotate(-45)")
      .attr("x", -10)
      .style("text-anchor", "end")
      .style("font-size", "10px");

    // ✅ Conditionally draw vertical grid lines
    if (showGrid) {
      g.selectAll('.grid-line')
        .data(x.ticks(d3.timeDay.every(1)))
        .enter()
        .append('line')
        .attr('class', 'grid-line')
        .attr('x1', d => x(d) + 8)
        .attr('x2', d => x(d) + 8)
        .attr('y1', 0)
        .attr('y2', height)
        .attr('stroke', '#ccc')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4 2');
    }

    // y-axis
    g.append('g').call(d3.axisLeft(y));

     const colorScale = d3.scaleOrdinal(d3.schemeSet3);
    // task bars
    g.selectAll('.task-bar')
      .data(tasks)
      .enter()
      .append('rect')
      .attr('class', 'task-bar')
      .attr('x', d => x(d.start))
      .attr('y', d => y(d.title))
      .attr('width', d => Math.max(x(d.end) - x(d.start), 4))
      .attr('height', y.bandwidth())
      .attr('fill', (d, i) => colorScale(i))
      .attr('rx', 4)
      .on('mouseover', function (event, d) {
        tooltip.transition().duration(200).style('opacity', 1);
        tooltip.html(
          `<strong>${d.title}</strong><br/>
          Owner: ${d.owner}<br/>
          Start: ${d.start.toDateString()}<br/>
          Due: ${d.end.toDateString()}<br/>
          Duration: ${d.duration} day(s)`
        )
          .style('left', `${event.pageX + 15}px`)
          .style('top', `${event.pageY - 28}px`);
      })
      .on('mousemove', function (event) {
        tooltip
          .style('left', `${event.pageX + 15}px`)
          .style('top', `${event.pageY - 28}px`);
      })
      .on('mouseout', () => {
        tooltip.transition().duration(300).style('opacity', 0);
      });

    // task labels
    g.selectAll('.task-label')
      .data(tasks)
      .enter()
      .append('text')
      .attr('x', d => x(d.start) + 5)
      .attr('y', d => y(d.title) + y.bandwidth() / 2 + 4)
      .attr('fill', 'white')
      .attr('font-size', '12px')
      .text(d => `${d.owner} (${d.duration}d)`);

  }, [data, showGrid]);

  return (
   <div style={{ overflowX: 'auto' }}>
    <div style={{ marginBottom: '10px' }}>
      <label>
        <input
          type="checkbox"
          checked={showGrid}
          onChange={() => setShowGrid(prev => !prev)}
        />{' '}
        Show Gridlines
      </label>
    </div>

    {(!data || data.length === 0) ? (
      <div style={{ padding: '20px', color: '#888' }}>No Data Available</div>
    ) : (
      <svg ref={svgRef}></svg>
    )}
  </div>
  );
};

export default GanttChart;
