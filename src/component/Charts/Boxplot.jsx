import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const Boxplot = () => {
  const ref = useRef();
  const [diamonds, setDiamonds] = useState([]);

  useEffect(() => {
    fetch('/diamonds.json') // Place diamonds.json in public folder
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch JSON: ' + response.status);
        }
        return response.json();
      })
      .then(data => {
        setDiamonds(data);
        renderChart(data);
      })
      .catch(error => console.error('Error loading JSON:', error));
  }, []);

  function renderChart(data) {
    if (!data.length) return;

    const width = 928, height = 600;
    const marginTop = 20, marginRight = 20, marginBottom = 30, marginLeft = 40;
    const n = width / 40;

    const bins = d3.bin()
      .thresholds(n)
      .value(d => d.carat)(data)
      .map(bin => {
        bin.sort((a, b) => a.price - b.price);
        const values = bin.map(d => d.price);
        if (!values.length) {
          bin.quartiles = [0, 0, 0];
          bin.range = [0, 0];
          bin.outliers = [];
          return bin;
        }
        const q1 = d3.quantile(values, 0.25);
        const q2 = d3.quantile(values, 0.5);
        const q3 = d3.quantile(values, 0.75);
        const iqr = q3 - q1;
        const min = values[0], max = values[values.length - 1];
        const r0 = Math.max(min, q1 - iqr * 1.5);
        const r1 = Math.min(max, q3 + iqr * 1.5);
        bin.quartiles = [q1, q2, q3];
        bin.range = [r0, r1];
        bin.outliers = bin.filter(v => v.price < r0 || v.price > r1);
        return bin;
      });

    const x = d3.scaleLinear()
      .domain([d3.min(bins, d => d.x0), d3.max(bins, d => d.x1)])
      .rangeRound([marginLeft, width - marginRight]);

    const y = d3.scaleLinear()
      .domain([d3.min(bins, d => d.range[0]), d3.max(bins, d => d.range[1])]).nice()
      .range([height - marginBottom, marginTop]);

    const svg = d3.select(ref.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .attr('style', 'max-width: 100%; height: auto; font: 10px sans-serif;')
      .attr('text-anchor', 'middle');

    svg.selectAll('*').remove();

    const g = svg.append('g')
      .selectAll('g')
      .data(bins)
      .join('g');

    // Range lines
    g.append('line')
      .attr('stroke', 'currentColor')
      .attr('x1', d => x((d.x0 + d.x1) / 2))
      .attr('x2', d => x((d.x0 + d.x1) / 2))
      .attr('y1', d => y(d.range[0]))
      .attr('y2', d => y(d.range[0]))
      .transition().duration(800)
      .attr('y2', d => y(d.range[1]));

    // Quartile boxes
    g.append('rect')
      .attr('x', d => x(d.x0) + 1)
      .attr('width', d => Math.max(1, x(d.x1) - x(d.x0) - 1))
      .attr('y', d => y(d.quartiles[2]))
      .attr('height', 0)
      .attr('fill', '#ddd')
      .transition().duration(800)
      .attr('height', d => y(d.quartiles[0]) - y(d.quartiles[2]));

    // Median line
    g.append('line')
      .attr('x1', d => x(d.x0) + 1)
      .attr('x2', d => x(d.x0) + 1)
      .attr('y1', d => y(d.quartiles[1]))
      .attr('y2', d => y(d.quartiles[1]))
      .attr('stroke', 'currentColor')
      .attr('stroke-width', 2)
      .transition().duration(800)
      .attr('x2', d => x(d.x1));

    // Outliers
    g.append('g')
      .attr('fill', 'currentColor')
      .attr('fill-opacity', 0.2)
      .attr('stroke', 'none')
      .attr('transform', d => `translate(${x((d.x0 + d.x1) / 2)},0)`)
      .selectAll('circle')
      .data(d => d.outliers)
      .join('circle')
      .attr('r', 0)
      .attr('cx', () => (Math.random() - 0.5) * 4)
      .attr('cy', d => y(d.price))
      .transition().duration(800)
      .attr('r', 2);

    // X Axis
    svg.append('g')
      .attr('transform', `translate(0,${height - marginBottom})`)
      .call(d3.axisBottom(x).ticks(n).tickSizeOuter(0));

    // Y Axis
    svg.append('g')
      .attr('transform', `translate(${marginLeft},0)`)
      .call(d3.axisLeft(y).ticks(null, 's'))
      .call(g => g.select('.domain').remove());
  }

  return <svg ref={ref}></svg>;
};

export default Boxplot;
