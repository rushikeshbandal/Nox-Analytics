import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function BubbleChart() {
  const ref = useRef();

  useEffect(() => {
    const width = 928;
    const height = 928;
    const margin = 2;

   
    d3.select(ref.current).selectAll("*").remove();

    const svg = d3
      .select(ref.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-margin, -margin, width, height])
      .style("max-width", "100%")
      .style("font", "10px sans-serif")
      .attr("text-anchor", "middle");

    d3.csv("/flare.csv", d3.autoType).then(raw => {
      const data = raw.filter(d => d.value != null);

      // ---- HELPERS ----
      const name = d => d.id.split(".").pop();
      const group = d => d.id.split(".")[1];
      const words = d =>
        name(d).split(/(?=[A-Z][a-z])|\s+/g);

      // ---- COLOR ----
      const color = d3.scaleOrdinal(d3.schemeTableau10);

      // ---- PACK LAYOUT ----
      const pack = d3.pack()
        .size([width - margin * 2, height - margin * 2])
        .padding(3);

      const root = pack(
        d3.hierarchy({ children: data })
          .sum(d => d.value)
      );

      // ---- NODES ----
      const node = svg.append("g")
        .selectAll("g")
        .data(root.leaves())
        .join("g")
          .attr("transform", d => `translate(${d.x},${d.y})`);

      // ---- TOOLTIP ----
      const format = d3.format(",");

      node.append("title")
        .text(d => `${d.data.id}\n${format(d.value)}`);

      // ---- CIRCLE ----
      node.append("circle")
        .attr("r", d => d.r)
        .attr("fill", d => color(group(d.data)))
        .attr("fill-opacity", 0.75);

      // ---- LABEL ----
      const text = node.append("text")
        .attr("clip-path", d => `circle(${d.r})`);

      text.selectAll("tspan")
        .data(d => words(d.data))
        .join("tspan")
          .attr("x", 0)
          .attr("y", (d, i, n) =>
            `${i - n.length / 2 + 0.35}em`
          )
          .text(d => d);

      text.append("tspan")
        .attr("x", 0)
        .attr("y", d =>
          `${words(d.data).length / 2 + 0.35}em`
        )
        .attr("fill-opacity", 0.7)
        .text(d => format(d.value));
    });
  }, []);

  return <div ref={ref} />;
}