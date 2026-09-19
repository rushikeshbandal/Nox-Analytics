import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const ZoomableTreemap = () => {
  const svgRef = useRef();

  useEffect(() => {
    const width = 928;
    const height = 924;

    const data = {
      name: "Root",
      children: [
        {
          name: "Technology",
          children: [
            {
              name: "Hardware",
              children: [
                { name: "Laptops", value: 500 },
                { name: "Desktops", value: 300 },
                { name: "Monitors", value: 200 }
              ]
            },
            {
              name: "Software",
              children: [
                { name: "Operating Systems", value: 250 },
                { name: "Productivity", value: 180 },
                { name: "Antivirus", value: 120 }
              ]
            }
          ]
        },
        {
          name: "Finance",
          children: [
            {
              name: "Banking",
              children: [
                { name: "Retail Banking", value: 220 },
                { name: "Investment Banking", value: 280 }
              ]
            },
            {
              name: "Insurance",
              children: [
                { name: "Health Insurance", value: 190 },
                { name: "Life Insurance", value: 170 },
                { name: "Auto Insurance", value: 160 }
              ]
            }
          ]
        },
        {
          name: "Retail",
          children: [
            {
              name: "Clothing",
              children: [
                { name: "Men", value: 300 },
                { name: "Women", value: 350 },
                { name: "Kids", value: 250 }
              ]
            },
            {
              name: "Groceries",
              children: [
                { name: "Fresh", value: 400 },
                { name: "Packaged", value: 320 }
              ]
            }
          ]
        }
      ]
    };

    // Clean up SVG
    d3.select(svgRef.current).selectAll("*").remove();

    const format = d3.format(",d");
    const x = d3.scaleLinear().rangeRound([0, width]);
    const y = d3.scaleLinear().rangeRound([0, height]);

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", [0.5, -30.5, width, height + 30])
      .attr("width", width)
      .attr("height", height + 30)
      .style("font", "10px sans-serif");

    const tile = (node, x0, y0, x1, y1) => {
      d3.treemapBinary(node, 0, 0, width, height);
      for (const child of node.children || []) {
        child.x0 = x0 + (child.x0 / width) * (x1 - x0);
        child.x1 = x0 + (child.x1 / width) * (x1 - x0);
        child.y0 = y0 + (child.y0 / height) * (y1 - y0);
        child.y1 = y0 + (child.y1 / height) * (y1 - y0);
      }
    };

    const name = d => d.ancestors().reverse().map(d => d.data.name).join("/");

    const hierarchy = d3
      .hierarchy(data)
      .sum(d => d.value)
      .sort((a, b) => b.value - a.value);

    const root = d3.treemap().tile(tile)(hierarchy);
    let group = svg.append("g").call(render, root);

    function render(group, root) {
      const node = group
        .selectAll("g")
        .data(root.children.concat(root))
        .join("g");

      node
        .filter(d => (d === root ? d.parent : d.children))
        .attr("cursor", "pointer")
        .on("click", (event, d) => (d === root ? zoomout(d) : zoomin(d)));

      node
        .append("title")
        .text(d => `${name(d)}\n${format(d.value)}`);

      node
        .append("rect")
        .attr("fill", d => (d === root ? "#fff" : d.children ? "#ccc" : "#ddd"))
        .attr("stroke", "#fff");

      node
        .append("clipPath")
        .attr("id", d => `clip-${d.data.name.replace(/\s+/g, "-")}`)
        .append("use")
        .attr("xlink:href", d => `#${d.data.name.replace(/\s+/g, "-")}`);

      node
        .append("text")
        .attr("clip-path", d => `url(#clip-${d.data.name.replace(/\s+/g, "-")})`)
        .attr("font-weight", d => (d === root ? "bold" : null))
        .selectAll("tspan")
        .data(d =>
          (d === root ? name(d) : d.data.name)
            .split(/(?=[A-Z][^A-Z])/g)
            .concat(format(d.value))
        )
        .join("tspan")
        .attr("x", 3)
        .attr("y", (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`)
        .attr("fill-opacity", (d, i, nodes) => (i === nodes.length - 1 ? 0.7 : null))
        .attr("font-weight", (d, i, nodes) => (i === nodes.length - 1 ? "normal" : null))
        .text(d => d);

      group.call(position, root);
    }

    function position(group, root) {
      group
        .selectAll("g")
        .attr("transform", d =>
          d === root ? `translate(0,-30)` : `translate(${x(d.x0)},${y(d.y0)})`
        )
        .select("rect")
        .attr("width", d => (d === root ? width : x(d.x1) - x(d.x0)))
        .attr("height", d => (d === root ? 30 : y(d.y1) - y(d.y0)));
    }

    function zoomin(d) {
      const group0 = group.attr("pointer-events", "none");
      const group1 = (group = svg.append("g").call(render, d));

      x.domain([d.x0, d.x1]);
      y.domain([d.y0, d.y1]);

      svg
        .transition()
        .duration(750)
        .call(t =>
          group0
            .transition(t)
            .remove()
            .call(position, d.parent)
        )
        .call(t =>
          group1
            .transition(t)
            .attrTween("opacity", () => d3.interpolate(0, 1))
            .call(position, d)
        );
    }

    function zoomout(d) {
      const group0 = group.attr("pointer-events", "none");
      const group1 = (group = svg.insert("g", "*").call(render, d.parent));

      x.domain([d.parent.x0, d.parent.x1]);
      y.domain([d.parent.y0, d.parent.y1]);

      svg
        .transition()
        .duration(750)
        .call(t =>
          group0
            .transition(t)
            .attrTween("opacity", () => d3.interpolate(1, 0))
            .remove()
            .call(position, d)
        )
        .call(t => group1.transition(t).call(position, d.parent));
    }
  }, []);

  return (
    <div>
      <h2 style={{ textAlign: "center" }}>Zoomable Treemap (Extended Data)</h2>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default ZoomableTreemap;
