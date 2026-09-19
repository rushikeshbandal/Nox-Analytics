import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const generateRandomData = () => {
  return Array.from({ length: 10 }, (_, i) => ({
    name: `Item ${i + 1}`,
    value: Math.floor(Math.random() * 1000),
  }));
};

const BarChartTransitions = () => {
  const svgRef = useRef();
  const [data, setData] = useState(generateRandomData());

  const width = 800;
  const height = 400;
  const margin = { top: 20, right: 30, bottom: 40, left: 50 };

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous renders

    const chartG = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.name))
      .range([0, width - margin.left - margin.right])
      .padding(0.2);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.value)])
      .nice()
      .range([height - margin.top - margin.bottom, 0]);

    // X Axis
    chartG
      .append("g")
      .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
      .call(d3.axisBottom(x));

    // Y Axis
    chartG.append("g").call(d3.axisLeft(y));

    // Bars
    const bars = chartG.selectAll(".bar").data(data, (d) => d.name);

    bars
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.name))
      .attr("y", y(0))
      .attr("width", x.bandwidth())
      .attr("height", 0)
      .attr("fill", "steelblue")
      .transition()
      .duration(800)
      .attr("y", (d) => y(d.value))
      .attr("height", (d) => y(0) - y(d.value));

    // Labels
    chartG
      .selectAll(".label")
      .data(data)
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("x", (d) => x(d.name) + x.bandwidth() / 2)
      .attr("y", (d) => y(d.value) - 5)
      .attr("text-anchor", "middle")
      .text((d) => d.value);
  }, [data]);

  return (
    <div>
      <svg ref={svgRef}></svg>
      <button onClick={() => setData(generateRandomData())}>
        Update Data
      </button>
    </div>
  );
};

export default BarChartTransitions;




