import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const sampleData = {
  name: "root",
  children: [
    { name: "React", value: 200 },
    { name: "D3.js", value: 300 },
    { name: "Next.js", value: 150 },
    {
      name: "Frameworks",
      children: [
        { name: "Angular", value: 100 },
        { name: "Vue", value: 180 }
      ]
    }
  ]
};

const AnimatedTreeMap = () => {
  const svgRef = useRef();

  useEffect(() => {
    const width = 600;
    const height = 400;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous chart

    const root = d3.hierarchy(sampleData).sum(d => d.value);
    d3.treemap().size([width, height]).padding(3)(root);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const nodes = svg
      .attr("width", width)
      .attr("height", height)
      .selectAll("g")
      .data(root.leaves())
      .join("g")
      .attr("transform", d => `translate(${d.x0},${d.y0})`);

    // Animated rectangles
    nodes
      .append("rect")
      .attr("width", 0)
      .attr("height", 0)
      .attr("fill", d => color(d.data.name))
      .transition()
      .duration(800)
      .attr("width", d => d.x1 - d.x0)
      .attr("height", d => d.y1 - d.y0);

    // Labels
    nodes
      .append("text")
      .attr("x", 5)
      .attr("y", 20)
      .text(d => d.data.name)
      .attr("fill", "white")
      .style("font-size", "12px");
  }, []);

  return (
    <div className="p-8 bg-white border shadow-2xl flex justify-center items-center rounded-2xl min-h-screen text-white">
      <div>
      <h2 className="text-2xl text-center text-black font-semibold mb-4">Animated Treemap</h2>
      <svg ref={svgRef}></svg>
      </div>
    </div>
  );
};

export default AnimatedTreeMap;
