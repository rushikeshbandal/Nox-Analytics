import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const DoughnutChart = ({ high, medium, low, completed, inProgress }) => {
  const ref = useRef();


useEffect(() => {
  const hasPriorityData = high > 0 || medium > 0 || low > 0;
  console.log(high, medium, low, completed, inProgress);
  
  const data = hasPriorityData
    ? [
        ...(high > 0 ? [{ label: "High", value: high, color: "#ef4444" }] : []),
        ...(medium > 0 ? [{ label: "Medium", value: medium, color: "#facc15" }] : []),
        ...(low > 0 ? [{ label: "Low", value: low, color: "#22c55e" }] : []),
      ]
    : [
        ...(inProgress > 0
          ? [{ label: "In Progress", value: inProgress, color: "#3b82f6" }]
          : []),
        ...(completed > 0
          ? [{ label: "Completed", value: completed, color: "#10b981" }]
          : []),
      ];

  const total = data.reduce((sum, d) => sum + d.value, 0);

  const width = 300;
  const height = 300;
  const thickness = 60;
  const radius = Math.min(width, height) / 2;

  d3.select(ref.current).select("svg").remove(); // Clear previous renders

  const svg = d3
    .select(ref.current)
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const g = svg
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

  const arc = d3
    .arc()
    .innerRadius(radius - thickness)
    .outerRadius(radius);

  const pie = d3
    .pie()
    .value((d) => d.value)
    .sort(null);

  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "#1f2937")
    .style("color", "#fff")
    .style("padding", "6px 12px")
    .style("border-radius", "6px")
    .style("font-size", "14px")
    .style("pointer-events", "none")
    .style("opacity", 0)
    .style("z-index", 9999)
    .style("transition", "opacity 0.2s ease");

  const arcs = g.selectAll("path").data(pie(data)).enter().append("g");

  arcs
    .append("path")
    .attr("fill", (d) => d.data.color)
    .transition()
    .duration(1000)
    .attrTween("d", function (d) {
      const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
      return function (t) {
        return arc(i(t));
      };
    });

  arcs
    .selectAll("path")
    .on("mouseover", (event, d) => {
      const percent = ((d.data.value / total) * 100).toFixed(1);
      tooltip
        .style("opacity", 1)
        .html(
          `<strong>${d.data.label}</strong><br/>
           Count: ${d.data.value}<br/>
           ${percent}%`
        );
    })
    .on("mousemove", (event) => {
      const tooltipWidth = tooltip.node().offsetWidth;
      const tooltipHeight = tooltip.node().offsetHeight;

      let x = event.pageX + 15;
      let y = event.pageY + 15;

      if (x + tooltipWidth > window.innerWidth) {
        x = event.pageX - tooltipWidth - 15;
      }

      if (y + tooltipHeight > window.innerHeight) {
        y = event.pageY - tooltipHeight - 15;
      }

      tooltip.style("left", `${x}px`).style("top", `${y}px`);
    })
    .on("mouseout", () => {
      tooltip.style("opacity", 0);
    });

  arcs
    .append("text")
    .attr("transform", (d) => `translate(${arc.centroid(d)})`)
    .attr("text-anchor", "middle")
    .attr("dy", "0.35em")
    .style("fill", "#fff")
    .style("font-size", "14px")
    .text((d) => d.data.label);

  const centerGroup = g.append("g")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle");

  const lineHeight = 20;
  const textShadow = "2px 2px 5px rgba(0, 0, 0, 0.3)";

  const lines = [
    { text: `Total: ${total}`, fontWeight: "bold", fontSize: 18, color: "#4b5563" },
    ...data.map((d) => ({
      text: `${d.label}: ${d.value}`,
      fontWeight: "normal",
      fontSize: 14,
      color: d.color,
    })),
  ];

  const startY = -((lines.length - 1) * lineHeight) / 2;

  lines.forEach((line, i) => {
    centerGroup.append("text")
      .attr("y", startY + i * lineHeight)
      .attr("x", 0)
      .style("font-size", `${line.fontSize}px`)
      .style("font-weight", line.fontWeight)
      .style("fill", line.color)
      .style("text-shadow", textShadow)
      .style("letter-spacing", "0.5px")
      .text(line.text);
  });

  return () => {
    tooltip.remove();
  };
}, [high, medium, low, inProgress, completed]) // Watch all values

  return <div ref={ref} className="relative" />;
};

export default DoughnutChart;
