import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export default function DotPlot() {
  const ref = useRef();
  const [order, setOrder] = useState("<10");

  useEffect(() => {
    d3.csv("/us-population-state-age.csv", d3.autoType).then(raw => {

      const ages = raw.columns.slice(1);

      // ---- TRANSFORM DATA (SAFE) ----
      const total = new Map(
        raw.map(d => [d.name, d3.sum(ages, a => d[a])])
      );

      const data = ages.flatMap(age =>
        raw.map(d => ({
          state: d.name,
          age,
          share: d[age] / total.get(d.name)
        }))
      );

      const states = d3.group(data, d => d.state);

      const width = 928;
      const height = states.size * 16;
      const margin = { top: 30, right: 10, bottom: 10, left: 60 };

      d3.select(ref.current).selectAll("*").remove();

      // ---- SCALES ----
      const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.share)])
        .range([margin.left, width - margin.right]);

      const y = d3.scalePoint()
        .domain([...states.keys()])
        .range([margin.top, height - margin.bottom])
        .padding(1);

      const color = d3.scaleOrdinal()
        .domain(ages)
        .range(d3.schemeSpectral[ages.length]);

      // ---- SVG ----
      const svg = d3.select(ref.current)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("background", "#fff")
        .style("font", "10px sans-serif");

      // ---- X AXIS ----
      svg.append("g")
        .attr("transform", `translate(0,${margin.top})`)
        .call(d3.axisTop(x).ticks(6, "%"))
        .call(g => g.select(".domain").remove())
        .call(g =>
          g.append("text")
            .attr("x", width - margin.right)
            .attr("y", -22)
            .attr("text-anchor", "end")
            .attr("fill", "currentColor")
            .text("population →")
        );

      // ---- STATE GROUPS ----
      const g = svg.append("g")
        .selectAll("g")
        .data(states)
        .join("g")
        .attr("transform", ([state]) => `translate(0,${y(state)})`);

      // ---- RANGE LINE ----
      g.append("line")
        .attr("stroke", "#aaa")
        .attr("x1", ([, v]) => x(d3.min(v, d => d.share)))
        .attr("x2", ([, v]) => x(d3.max(v, d => d.share)));

      // ---- DOTS ----
      g.append("g")
        .selectAll("circle")
        .data(([, v]) => v)
        .join("circle")
          .attr("cx", d => x(d.share))
          .attr("r", 3.5)
          .attr("fill", d => color(d.age));

      // ---- STATE LABEL ----
      g.append("text")
        .attr("x", ([, v]) => x(d3.min(v, d => d.share)) - 6)
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .text(([state]) => state);

      // ---- UPDATE (SORT) ----
      function update(orderAge) {
        const list = data.filter(d => d.age === orderAge);
        const sorted = [...list]
          .sort((a, b) => d3.descending(a.share, b.share))
          .map(d => d.state);

        y.domain(sorted);

        g.transition()
          .duration(600)
          .attr("transform", ([state]) => `translate(0,${y(state)})`);
      }

      update(order);

    });
  }, [order]);

  return (
    <div>
      <label>Order by: </label>
      <select value={order} onChange={e => setOrder(e.target.value)}>
        <option>&lt;10</option>
        <option>10-19</option>
        <option>20-29</option>
        <option>30-39</option>
        <option>40-49</option>
        <option>50-59</option>
        <option>60-69</option>
        <option>70-79</option>
        <option>≥80</option>
      </select>

      <div ref={ref}></div>
    </div>
  );
}