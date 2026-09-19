import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const GanttSchedule = ({ data }) => {
  const svgRef = useRef();
  const tooltipRef = useRef();
  const [showGrid, setShowGrid] = useState(true);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const tooltip = d3.select(tooltipRef.current);
    const margin = { top: 40, right: 20, bottom: 80, left: 250 };
    const fullWidth = 850;
    const fullHeight = Math.max(data.length * 25 + 100, 600);
    const width = fullWidth - margin.left - margin.right;
    const height = fullHeight - margin.top - margin.bottom;

    const g = svg
      .attr('width', fullWidth)
      .attr('height', fullHeight)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const parseDate = (str) => {
      if (!str || str === ' - ') return null;
      if (!isNaN(str)) {
        return new Date((Math.floor(str - 25569)) * 86400 * 1000);
      }
      const parsed = new Date(str);
      return isNaN(parsed.getTime()) ? null : parsed;
    };

    const tasks = data
      .map(d => ({
        title: `${d.WBS}. ${d.TASK}`,
        owner: d.LEAD || 'Unassigned',
        start: parseDate(d.START),
        end: parseDate(d.END),
      }))
      .filter(d => d.start && d.end);

    const minStart = d3.min(tasks, d => d.start);
    const maxEnd = d3.max(tasks, d => d.end);

    const x = d3.scaleTime()
      .domain([d3.timeDay.offset(minStart, -1), d3.timeDay.offset(maxEnd, 1)])
      .range([0, width]);

    const y = d3.scaleBand()
      .domain(tasks.map(d => d.title))
      .range([0, height])
      .padding(0.2);

    const xAxis = d3.axisBottom(x)
      .ticks(d3.timeWeek.every(1))
      .tickFormat(d3.timeFormat('%b %d, %Y'));

    const yAxis = d3.axisLeft(y);

    g.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(xAxis)
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .style('font-size', '11px');
      

    // Y-axis with black color for text
    g.append('g').call(yAxis)
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', 'black'); // Set text color to black

    // Optional: Add black color to the Y-axis line (domain)
    g.selectAll('.domain')
      .style('stroke', 'black');
      

    if (showGrid) {
      // Gridlines with dashed style
      g.selectAll('.grid-line')
        .data(x.ticks(d3.timeDay.every(1)))
        .enter()
        .append('line')
        .attr('x1', d => x(d))
        .attr('x2', d => x(d))
        .attr('y1', 0)
        .attr('y2', height)
         
        .attr('stroke', '#ccc')
        .attr('stroke-dasharray',   '4,2'); // Dashed gridlines
    }

    const colorScale = d3.scaleOrdinal(d3.schemeSet3);
   
    
    g.selectAll('.task-bar')
      .data(tasks)
      .enter()
      .append('rect')
      .attr('x', d => x(d.start))
      .attr('y', d => y(d.title))
      .attr('width', d => x(d.end) - x(d.start))
      .attr('height', y.bandwidth())
      .attr('fill', (d, i) => colorScale(i))
      .attr('rx', 3)
      .on('mouseover', (event, d) => {
        tooltip
          .style('opacity', 1)
          .html(
            `<strong>${d.title}</strong><br/>
             Owner: ${d.owner}<br/>
             Start: ${d.start.toDateString()}<br/>
             End: ${d.end.toDateString()}`
          )
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 30}px`);
      })
      .on('mousemove', event => {
        tooltip
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 30}px`);
      })
      .on('mouseout', () => tooltip.style('opacity', 0));
  }, [data, showGrid]);

  return (
      <div style={{ overflowX: 'auto', overflowY: 'auto' }}>
    {(!data || data.length === 0) ? (
      <p>No data available</p>
    ) : (
      <>
        <div style={{ margin: '10px 0' }}>
          <label>
            <input
              type="checkbox"
              checked={showGrid}
              onChange={() => setShowGrid(prev => !prev)}
            />
            Show Gridlines
          </label>
        </div>
        <svg ref={svgRef} />
        <div ref={tooltipRef}
          style={{
            position: 'absolute',
            opacity: 0,
            background: '#fff',
            border: '1px solid #ccc',
            padding: '8px',
            borderRadius: '5px',
            pointerEvents: 'none',
            fontSize: '12px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            zIndex: 999
          }}
        ></div>
      </>
    )}
  </div>
  );
};

export default GanttSchedule;
