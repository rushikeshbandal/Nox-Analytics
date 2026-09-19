import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const IndexChart = () => {
  const svgRef = useRef();

  const data = [
    { Date: '2013-01-01', Symbol: 'AAPL', Close: 54 },
    { Date: '2013-01-01', Symbol: 'GOOG', Close: 68 },
    { Date: '2013-01-01', Symbol: 'MSFT', Close: 32 },
    { Date: '2013-01-08', Symbol: 'AAPL', Close: 56 },
    { Date: '2013-01-08', Symbol: 'GOOG', Close: 70 },
    { Date: '2013-01-08', Symbol: 'MSFT', Close: 34 },
    { Date: '2013-01-15', Symbol: 'AAPL', Close: 58 },
    { Date: '2013-01-15', Symbol: 'GOOG', Close: 74 },
    { Date: '2013-01-15', Symbol: 'MSFT', Close: 36 },
    { Date: '2013-01-22', Symbol: 'AAPL', Close: 60 },
    { Date: '2013-01-22', Symbol: 'GOOG', Close: 76 },
    { Date: '2013-01-22', Symbol: 'MSFT', Close: 38 },
    { Date: '2013-01-29', Symbol: 'AAPL', Close: 62 },
    { Date: '2013-01-29', Symbol: 'GOOG', Close: 78 },
    { Date: '2013-01-29', Symbol: 'MSFT', Close: 40 }
  ];

  useEffect(() => {
    const parseDate = d3.utcParse('%Y-%m-%d');
    const parsedData = data
      .map(d => ({
        Date: parseDate(d.Date),
        Symbol: d.Symbol,
        Close: +d.Close
      }))
      .filter(d => d.Date && !isNaN(d.Close) && d.Close > 0);

    const width = 928;
    const height = 600;
    const margin = { top: 20, right: 40, bottom: 30, left: 40 };

    const x = d3.scaleUtc()
      .domain(d3.extent(parsedData, d => d.Date))
      .range([margin.left, width - margin.right])
      .clamp(true);

    const sortedData = parsedData.sort((a, b) => d3.ascending(a.Date, b.Date));

    const series = d3.groups(sortedData, d => d.Symbol).map(([key, values]) => {
      values.sort((a, b) => d3.ascending(a.Date, b.Date));
      const base = values[0]?.Close || 1;
      return {
        key,
        values: values.map(({ Date, Close }) => ({
          Date,
          value: Close && base ? Close / base : 1
        }))
      };
    });

    const k = d3.max(series, s =>
      d3.max(s.values, d => d.value) / d3.min(s.values, d => d.value)
    );

    const y = d3.scaleLog()
      .domain([1 / k, k])
      .rangeRound([height - margin.bottom, margin.top]);

    const z = d3.scaleOrdinal(d3.schemeCategory10)
      .domain(series.map(d => d.key));

    const bisect = d3.bisector(d => d.Date).left;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('viewBox', [0, 0, width, height])
      .attr('width', width)
      .attr('height', height)
      .style('max-width', '100%')
      .style('height', 'auto');

    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0))
      .call(g => g.select('.domain').remove());

    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(null, x => +x.toFixed(6) + '×'))
      .call(g => g.selectAll('.tick line').clone()
        .attr('stroke-opacity', d => d === 1 ? null : 0.2)
        .attr('x2', width - margin.left - margin.right))
      .call(g => g.select('.domain').remove());

    const rule = svg.append('g')
      .append('line')
      .attr('y1', height)
      .attr('y2', 0)
      .attr('stroke', 'black');

    const serie = svg.append('g')
      .style('font', 'bold 10px sans-serif')
      .selectAll('g')
      .data(series)
      .join('g');

    const line = d3.line()
      .x(d => x(d.Date))
      .y(d => y(d.value));

    serie.append('path')
      .attr('fill', 'none')
      .attr('stroke-width', 1.5)
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('stroke', d => z(d.key))
      .attr('d', d => line(d.values));

    serie.append('text')
      .datum(d => ({
        key: d.key,
        value: d.values[d.values.length - 1].value
      }))
      .attr('fill', d => z(d.key))
      .attr('paint-order', 'stroke')
      .attr('stroke', 'white')
      .attr('stroke-width', 3)
      .attr('x', x.range()[1] + 3)
      .attr('y', d => y(d.value))
      .attr('dy', '0.35em')
      .text(d => d.key);

    function update(date) {
      date = d3.utcDay.round(date);
      rule.attr('transform', `translate(${x(date) + 0.5},0)`);
      serie.attr('transform', ({ values }) => {
        const i = bisect(values, date, 0, values.length - 1);
        const ratio = values[i].value / values[0].value;
        return `translate(0,${y(1) - y(ratio)})`;
      });
    }

    d3.transition()
      .ease(d3.easeCubicOut)
      .duration(1500)
      .tween('date', () => {
        const i = d3.interpolateDate(x.domain()[1], x.domain()[0]);
        return t => update(i(t));
      });

    svg.on('mousemove touchmove', function (event) {
      const [mx] = d3.pointer(event);
      update(x.invert(mx));
    });
  }, []);

  return (
    <div>
      <h2 style={{ textAlign: 'center' }}>Technology Stocks Index Chart (2013–2018)</h2>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default IndexChart;
