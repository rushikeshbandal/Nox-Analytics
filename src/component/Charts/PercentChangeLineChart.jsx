import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function PercentChangeLineChart() {
  const ref = useRef(null);
  const hasRendered = useRef(false); 
  const BASIS = 153.65;

  useEffect(() => {
   
    if (hasRendered.current) return;
    hasRendered.current = true;

   
    d3.select(ref.current).selectAll("*").remove();

    d3.csv(
      "https://raw.githubusercontent.com/plotly/datasets/master/finance-charts-apple.csv",
      d => {
        const close = +d["AAPL.Close"];
        const date = new Date(d.Date);
        if (!date || isNaN(close) || close <= 0) return null;
        return { date, close };
      }
    ).then(raw => {
      const data = raw.filter(Boolean);
      if (!data.length) return;

      const width = 928;
      const height = 600;
      const margin = { top: 20, right: 30, bottom: 30, left: 55 };

      const x = d3.scaleTime()
        .domain(d3.extent(data, d => d.date))
        .range([margin.left, width - margin.right]);

      const y = d3.scaleLog()
        .domain([
          d3.min(data, d => d.close / BASIS) * 0.95,
          d3.max(data, d => d.close / BASIS) * 1.05
        ])
        .range([height - margin.bottom, margin.top]);

      const formatPct = d =>
        d === 1 ? "0%" : `${d > 1 ? "+" : ""}${Math.round((d - 1) * 100)}%`;

      const svg = d3.select(ref.current)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("background", "#fff");

      // X axis at 0%
      svg.append("g")
        .attr("transform", `translate(0,${y(1)})`)
        .call(d3.axisBottom(x).ticks(width / 80))
        .call(g => g.select(".domain").remove());

      // Y axis
      svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(
          d3.axisLeft(y)
            .ticks(10)
            .tickFormat(formatPct)
        )
        .call(g => g.select(".domain").remove())
        .call(g =>
          g.selectAll(".tick line")
            .clone()
            .attr("x2", width - margin.left - margin.right)
            .attr("stroke-opacity", 0.15)
        );

      const line = d3.line()
        .defined(d => !isNaN(d.close))
        .x(d => x(d.date))
        .y(d => y(d.close / BASIS));

      svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("d", line);
    });

  }, []);

  return (
    <div style={{ margin: 40 }}>
      <h2>Line chart – Percent Change (Apple)</h2>
      <div ref={ref} />
    </div>
  );
}