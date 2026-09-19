// LineChart.js
import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const Line = ({ data }) => {
  const ref = useRef();

  useEffect(() => {
    // Clear previous SVG contents
    d3.select(ref.current).selectAll("*").remove();

    // Format data: count tasks by date
    const dateCount = d3.rollup(
      data,
      v => v.length,
      d => d.Date
    );

    const parsedData = Array.from(dateCount, ([date, count]) => ({
      date: d3.timeParse("%d-%b-%y")(date),
      count
    })).sort((a, b) => a.date - b.date);

    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    const width = 600 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3
      .select(ref.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleTime()
      .domain(d3.extent(parsedData, d => d.date))
      .range([0, width]);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(parsedData, d => d.count)])
      .range([height, 0]);

    // Axes
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(6));

    svg.append("g")
      .call(d3.axisLeft(y));

    // Line generator
    const line = d3.line()
      .x(d => x(d.date))
      .y(d => y(d.count));

    // Draw line
    svg.append("path")
      .datum(parsedData)
      .attr("fill", "none")
      .attr("stroke", "#4BC0C0")
      .attr("stroke-width", 2)
      .attr("d", line);

    // Add dots
    svg.selectAll("circle")
      .data(parsedData)
      .enter()
      .append("circle")
      .attr("cx", d => x(d.date))
      .attr("cy", d => y(d.count))
      .attr("r", 4)
      .attr("fill", "#FF6384");
  }, [data]);

  return <svg ref={ref}></svg>;
};

export default Line;