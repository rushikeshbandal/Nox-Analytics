import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function GlobalTemperatureTrends() {
  const ref = useRef();

  useEffect(() => {
    d3.csv("/temperatures.csv", d3.autoType).then(rows => {

      // ---- PIVOT TO LONG FORMAT (SAFE) ----
      const data = [];
      rows.forEach(d => {
        for (let m = 0; m < 12; m++) {
          const value = d3.autoType(d[Object.keys(d)[m + 1]]);
          if (!isNaN(value)) {
            data.push({
              date: new Date(Date.UTC(d.Year, m, 1)),
              value
            });
          }
        }
      });

      const width = 928;
      const height = 600;
      const margin = { top: 20, right: 30, bottom: 30, left: 50 };

      d3.select(ref.current).selectAll("*").remove();

      // ---- SCALES ----
      const x = d3.scaleUtc()
        .domain(d3.extent(data, d => d.date))
        .range([margin.left, width - margin.right]);

      const y = d3.scaleLinear()
        .domain(d3.extent(data, d => d.value))
        .nice()
        .range([height - margin.bottom, margin.top]);

      const max = d3.max(data, d => Math.abs(d.value));

      const color = d3.scaleSequential()
        .domain([max, -max])
        .interpolator(d3.interpolateRdBu);

      // ---- SVG ----
      const svg = d3.select(ref.current)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("background", "#fff")
        .style("font", "10px sans-serif");

      // ---- X AXIS ----
      svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(width / 80))
        .call(g => g.select(".domain").remove());

      // ---- Y AXIS + GRID ----
      svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(null, "+"))
        .call(g => g.select(".domain").remove())
        .call(g =>
          g.selectAll(".tick line")
            .clone()
            .attr("x2", width - margin.left - margin.right)
            .attr("stroke-opacity", d => (d === 0 ? 0.6 : 0.1))
        )
        .call(g =>
          g.append("text")
            .attr("x", 4)
            .attr("y", margin.top)
            .attr("dy", "0.32em")
            .attr("fill", "#000")
            .attr("font-weight", "bold")
            .text("Anomaly (°C)")
        );

      // ---- POINTS ----
      svg.append("g")
        .attr("stroke", "#000")
        .attr("stroke-opacity", 0.2)
        .selectAll("circle")
        .data(data)
        .join("circle")
          .attr("cx", d => x(d.date))
          .attr("cy", d => y(d.value))
          .attr("r", 2.5)
          .attr("fill", d => color(d.value));
    });
  }, []);

  return <div ref={ref}></div>;
}