import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const BarChart = ({ changeType, accentColor = "#4e73df" }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!changeType) return;

    // Clear existing chart
    d3.select(svgRef.current).selectAll("*").remove();

    const margin = { top: 30, right: 30, bottom: 50, left: 60 };
    const width = 400 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const data = [
      { type: "Enhancement", count: changeType.enhancement },
      { type: "New Feature", count: changeType.newFeature },
    ];

    const x = d3.scaleBand()
      .domain(data.map(d => d.type))
      .range([0, width])
      .padding(0.3);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.count) || 10])
      .nice()
      .range([height, 0]);

    // Add grid lines
    svg.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(y)
        .tickSize(-width)
        .tickFormat("")
      )
      .selectAll("line")
      .attr("stroke", "#e0e0e0");

    // Add x-axis
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("font-size", "13px")
      .style("font-weight", "500");

    // Add y-axis
    svg.append("g")
      .call(d3.axisLeft(y).ticks(5))
      .selectAll("text")
      .style("font-size", "13px")
      .style("font-weight", "500");

    // Define gradient
    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
      .attr("id", "barGradient")
      .attr("x1", "0")
      .attr("x2", "0")
      .attr("y1", "0")
      .attr("y2", "1");

    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", accentColor)
      .attr("stop-opacity", 0.95);
    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", accentColor)
      .attr("stop-opacity", 0.4);

    // Draw bars
    const bars = svg.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.type))
      .attr("y", height)
      .attr("width", x.bandwidth())
      .attr("height", 0)
      .attr("rx", 6) // Rounded corners
      .attr("fill", "url(#barGradient)");

    // Animate bars
    bars.transition()
      .duration(1000)
      .attr("y", d => y(d.count))
      .attr("height", d => height - y(d.count));

    // Tooltip
    const tooltip = d3.select("#bar-tooltip");
    if (tooltip.empty()) {
      d3.select("body").append("div")
        .attr("id", "bar-tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background-color", "#fff")
        .style("color", "#333")
        .style("padding", "8px 12px")
        .style("border-radius", "6px")
        .style("box-shadow", "0 2px 6px rgba(0,0,0,0.2)")
        .style("font-size", "14px")
        .style("pointer-events", "none");
    }

    const tooltipDiv = d3.select("#bar-tooltip");

    bars.on("mouseover", (event, d) => {
      tooltipDiv
        .style("visibility", "visible")
        .text(`${d.type}: ${d.count} Requests`);
    })
      .on("mousemove", event => {
        tooltipDiv
          .style("top", `${event.pageY - 40}px`)
          .style("left", `${event.pageX + 10}px`);
      })
      .on("mouseout", () => {
        tooltipDiv.style("visibility", "hidden");
      });

  }, [changeType]);

  return (
    <div>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default BarChart;
