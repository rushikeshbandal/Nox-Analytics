import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

// ✅ Renamed to flatData for consistency
const flatData = [
  { name: "a", imports: ["b", "c"] },
  { name: "b", imports: ["d"] },
  { name: "c", imports: ["d", "e"] },
  { name: "d", imports: [] },
  { name: "e", imports: ["a"] }
];

// Convert flat data into hierarchy with dummy root
function hierarchy(data) {
  return d3.hierarchy({ name: "root", children: data });
}

// Add outgoing/incoming links for edge bundling
function bilink(root) {
  const map = new Map(root.leaves().map(d => [d.data.name, d]));
  for (const d of root.leaves()) {
    d.incoming = [];
    d.outgoing = d.data.imports.map(name => [d, map.get(name)]);
  }
  for (const d of root.leaves()) {
    for (const [, target] of d.outgoing) {
      target.incoming.push([d, target]);
    }
  }
  return root;
}

// Generate unique node ID
function id(node) {
  return `${node.parent ? id(node.parent) + "." : ""}${node.data.name}`;
}

const HierarchicalEdgeBundling = () => {
  const svgRef = useRef();

  useEffect(() => {
    const width = 954;
    const radius = width / 2;

    const tree = d3.cluster().size([2 * Math.PI, radius - 100]);

    const root = tree(
      bilink(
        hierarchy(flatData).sort(
          (a, b) =>
            d3.ascending(a.height, b.height) ||
            d3.ascending(a.data.name, b.data.name)
        )
      )
    );

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", width)
      .attr("viewBox", [-width / 2, -width / 2, width, width])
      .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

    const line = d3
      .lineRadial()
      .curve(d3.curveBundle.beta(0.85))
      .radius(d => d.y)
      .angle(d => d.x);

    const color = d3.scaleSequential([0, 1], d3.interpolateRainbow);

    // 🧠 Draw bundled edges
    svg
      .append("g")
      .attr("fill", "none")
      .attr("stroke-opacity", 0.4)
      .selectAll("path")
      .data(root.leaves().flatMap(leaf => leaf.outgoing))
      .join("path")
      .attr("stroke", (d, i) => color(i / root.leaves().length))
      .attr("d", ([from, to]) => line(from.path(to)))
      .style("mix-blend-mode", "darken");

    // 🧠 Draw node labels
    const node = svg
      .append("g")
      .selectAll("g")
      .data(root.leaves())
      .join("g")
      .attr("transform", d => `rotate(${(d.x * 180) / Math.PI - 90}) translate(${d.y},0)`);

    node
      .append("text")
      .attr("dy", "0.31em")
      .attr("x", d => (d.x < Math.PI ? 6 : -6))
      .attr("text-anchor", d => (d.x < Math.PI ? "start" : "end"))
      .attr("transform", d => (d.x >= Math.PI ? "rotate(180)" : null))
      .text(d => d.data.name)
      .append("title")
      .text(d => `${id(d)}\n${d.outgoing.length} outgoing\n${d.incoming.length} incoming`);
  }, []);

  return (
    <div className="flex justify-center items-center p-4 bg-white">
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default HierarchicalEdgeBundling;
