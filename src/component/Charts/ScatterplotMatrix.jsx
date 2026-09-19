import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function ScatterplotMatrix() {
  const ref = useRef();

  useEffect(() => {
    d3.csv("/penguins.csv", d3.autoType).then(raw => {

      // ---- SAFETY FILTER (NO NaN / undefined) ----
      const columns = [
        "culmen_length_mm",
        "culmen_depth_mm",
        "flipper_length_mm",
        "body_mass_g"
      ];

      const data = raw.filter(d =>
        columns.every(c => typeof d[c] === "number" && !isNaN(d[c]))
      );

      const width = 928;
      const padding = 28;
      const size =
        (width - (columns.length + 1) * padding) / columns.length + padding;
      const height = width;

      d3.select(ref.current).selectAll("*").remove();

      // ---- SCALES ----
      const x = columns.map(col =>
        d3.scaleLinear()
          .domain(d3.extent(data, d => d[col]))
          .nice()
          .range([padding / 2, size - padding / 2])
      );

      const y = x.map(s =>
        s.copy().range([size - padding / 2, padding / 2])
      );

      const color = d3.scaleOrdinal()
        .domain([...new Set(data.map(d => d.species))])
        .range(d3.schemeCategory10);

      // ---- SVG ----
      const svg = d3.select(ref.current)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-padding, 0, width, height])
        .style("background", "#fff")
        .style("font", "10px sans-serif");

      // ---- AXES ----
      const axisX = d3.axisBottom().ticks(6).tickSize(size * columns.length);
      const axisY = d3.axisLeft().ticks(6).tickSize(-size * columns.length);

      svg.append("g")
        .selectAll("g")
        .data(x)
        .join("g")
          .attr("transform", (_, i) => `translate(${i * size},0)`)
          .each(function (scale) {
            d3.select(this).call(axisX.scale(scale));
          })
          .call(g => g.select(".domain").remove())
          .call(g => g.selectAll(".tick line").attr("stroke", "#ddd"));

      svg.append("g")
        .selectAll("g")
        .data(y)
        .join("g")
          .attr("transform", (_, i) => `translate(0,${i * size})`)
          .each(function (scale) {
            d3.select(this).call(axisY.scale(scale));
          })
          .call(g => g.select(".domain").remove())
          .call(g => g.selectAll(".tick line").attr("stroke", "#ddd"));

      // ---- CELLS ----
      const cell = svg.append("g")
        .selectAll("g")
        .data(d3.cross(d3.range(columns.length), d3.range(columns.length)))
        .join("g")
          .attr("transform", ([i, j]) => `translate(${i * size},${j * size})`);

      cell.append("rect")
        .attr("x", padding / 2)
        .attr("y", padding / 2)
        .attr("width", size - padding)
        .attr("height", size - padding)
        .attr("fill", "none")
        .attr("stroke", "#aaa");

      cell.each(function ([i, j]) {
        d3.select(this)
          .selectAll("circle")
          .data(data)
          .join("circle")
            .attr("cx", d => x[i](d[columns[i]]))
            .attr("cy", d => y[j](d[columns[j]]))
            .attr("r", 3.5)
            .attr("fill", d => color(d.species))
            .attr("fill-opacity", 0.7);
      });

      // ---- DIAGONAL LABELS ----
      svg.append("g")
        .style("font", "bold 10px sans-serif")
        .selectAll("text")
        .data(columns)
        .join("text")
          .attr("x", (_, i) => i * size + padding)
          .attr("y", (_, i) => i * size + padding)
          .attr("dy", "0.8em")
          .text(d => d);
    });
  }, []);

  return <div ref={ref}></div>;
}