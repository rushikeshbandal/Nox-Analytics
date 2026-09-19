import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const N = 3; // Moving average window size

function movingAverage(values, N) {
  let i = 0;
  let sum = 0;
  const means = new Float64Array(values.length).fill(NaN);
  for (let n = Math.min(N - 1, values.length); i < n; ++i) sum += values[i];
  for (let n = values.length; i < n; ++i) {
    sum += values[i];
    means[i] = sum / N;
    sum -= values[i - N + 1];
  }
  return means;
}

const MovingAverageChart = () => {
  const ref = useRef();

  useEffect(() => {
    fetch('/dates.json') // dates.json should be in the /public folder
      .then(response => response.json())
      .then(jsonData => {
        const dates = jsonData.map(d => new Date(d.date));
        renderChart(dates);
      })
      .catch(error => console.error('Error fetching data.json:', error));
  }, []);

  function renderChart(dates) {
    const width = 928;
    const height = 500;
    const marginTop = 20;
    const marginRight = 20;
    const marginBottom = 30;
    const marginLeft = 40;

    const x = d3.scaleTime()
      .domain(d3.extent(dates))
      .range([marginLeft, width - marginRight]);

    const bins = d3.bin()
      .value(d => d.getTime())
      .domain(x.domain().map(d => d.getTime()))
      .thresholds(x.ticks(d3.timeDay).map(d => d.getTime()))(dates);

    const counts = bins.map(d => d.length);
    const values = movingAverage(counts, N);

    const y = d3.scaleLinear()
      .domain([0, d3.max(values)]).nice()
      .range([height - marginBottom, marginTop]);

    const svg = d3.select(ref.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("max-width", "100%")
      .style("height", "auto");

    svg.selectAll("*").remove();

    svg.append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(d3.axisBottom(x).tickSizeOuter(0));

    svg.append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(d3.axisLeft(y))
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line").clone()
        .attr("x2", width - marginLeft - marginRight)
        .attr("stroke-opacity", 0.1)
        .attr("stroke-dasharray", "2,2"));

    const plotData = values.map((v, i) => ({
      date: new Date(bins[i].x0),
      value: v
    }));

    const line = d3.line()
      .defined(d => !isNaN(d.value))
      .x(d => x(d.date))
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX);

    svg.append("path")
      .datum(plotData)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 2)
      .attr("d", line);
  }

  return <svg ref={ref}></svg>;
};

export default MovingAverageChart;
