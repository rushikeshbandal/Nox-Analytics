import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function AreaWithMissingData() {
  const ref = useRef();

  useEffect(() => {
    d3.csv("/aapl.csv", d => ({
      date: new Date(d.date),
      close: +d.close
    })).then(aapl => {

      // safety
      aapl = aapl.filter(d => !isNaN(d.date));

      // simulate missing data (Jan–Mar gaps)
      const aaplMissing = aapl.map(d => ({
        ...d,
        close: d.date.getUTCMonth() < 3 ? NaN : d.close
      }));

      const width = 928;
      const height = 500;
      const margin = { top: 20, right: 30, bottom: 40, left: 50 };

      d3.select(ref.current).selectAll("*").remove();

      // X scale
      const x = d3.scaleUtc()
        .domain(d3.extent(aapl, d => d.date))
        .range([margin.left, width - margin.right]);

      // Y scale
      const y = d3.scaleLinear()
        .domain([0, d3.max(aapl, d => d.close)])
        .nice()
        .range([height - margin.bottom, margin.top]);

      // Area generator with gaps
      const area = d3.area()
        .defined(d => !isNaN(d.close))
        .x(d => x(d.date))
        .y0(y(0))
        .y1(d => y(d.close));

      const svg = d3.select(ref.current)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("background", "#fff");

      // Interpolated area (light gray)
      svg.append("path")
        .datum(aaplMissing.filter(d => !isNaN(d.close)))
        .attr("fill", "#ccc")
        .attr("d", area);

      // Area with gaps (steelblue)
      svg.append("path")
        .datum(aaplMissing)
        .attr("fill", "steelblue")
        .attr("opacity", 0.85)
        .attr("d", area);

      // X axis
      svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(width / 80))
        .call(g => g.select(".domain").remove());    

      // Y axis + grid + label
      svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(height / 40))
        .call(g => g.select(".domain").remove())
        .call(g =>
          g.selectAll(".tick line")
            .clone()
            .attr("x2", width - margin.left - margin.right)
            .attr("stroke-opacity", 0.1)
        )
        .call(g =>
          g.append("text")
            .attr("x", -margin.left)
            .attr("y", 12)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .text("↑ Daily close ($)")
        );
    });
  }, []);

  return <div ref={ref}></div>;
}