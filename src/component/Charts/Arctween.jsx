import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const Arctween = () => {
  const svgRef = useRef();

  useEffect(() => {
    const width = 500;
    const height = Math.min(500, width / 2);
    const outerRadius = height / 2 - 10;
    const innerRadius = outerRadius * 0.75;
    const tau = 2 * Math.PI;

    // Clear old SVG content (for hot reload safety)
    d3.select(svgRef.current).selectAll('*').remove();

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Add shadow filter
    svg.append('defs').append('filter')
      .attr('id', 'drop-shadow')
      .attr('height', '130%')
      .append('feDropShadow')
      .attr('dx', '0')
      .attr('dy', '2')
      .attr('stdDeviation', '4')
      .attr('flood-color', 'rgba(0,0,0,0.4)');

    // Group container
    const g = svg.append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // Arc generator
    const arc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .startAngle(0);

    // Background arc
    g.append('path')
      .datum({ endAngle: tau })
      .style('fill', '#ddd')
      .attr('d', arc);

    // Foreground arc with stroke + shadow
    const foreground = g.append('path')
      .datum({ endAngle: 0 })
      .style('fill', 'blue')
      .style('stroke', '#333')           // border color
      .style('stroke-width', '2px')      // border width
      .attr('filter', 'url(#drop-shadow)') // apply drop shadow
      .attr('d', arc);

    // Centered percentage text
    const text = g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('font-size', '30px')
      .attr('fill', 'black')
      .text('0%');

    // Arc tween animation
    function arcTween(newAngle) {
      return function (d) {
        const interpolate = d3.interpolate(d.endAngle, newAngle);
        return function (t) {
          d.endAngle = interpolate(t);
          return arc(d);
        };
      };
    }

    // Update every 1.5s
    const interval = d3.interval(() => {
      const randomPercentage = Math.floor(Math.random() * 100);
      const newAngle = (randomPercentage / 100) * tau;

      foreground.interrupt().transition()
        .duration(750)
        .attrTween('d', arcTween(newAngle));

      text.interrupt().transition()
        .duration(750)
        .tween('text', () => {
          const current = +text.text().replace('%', '');
          const interpolate = d3.interpolate(current, randomPercentage);
          return function (t) {
            text.text(`${Math.round(interpolate(t))}%`);
          };
        });
    }, 1500);

    return () => {
      interval.stop(); // cleanup
    };
  }, []);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default Arctween;
