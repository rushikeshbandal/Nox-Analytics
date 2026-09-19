import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

const sampleData = [
  { state: "CA", age: "<10", population: 5038433 },
  { state: "TX", age: "<10", population: 3983091 },
  { state: "FL", age: "<10", population: 2211012 },
  { state: "NY", age: "<10", population: 2319945 },
  { state: "IL", age: "<10", population: 1619682 },
  { state: "PA", age: "<10", population: 1458931 },
  { state: "CA", age: "10-19", population: 5170341 },
  { state: "TX", age: "10-19", population: 3910528 },
  { state: "FL", age: "10-19", population: 2331102 },
  { state: "NY", age: "10-19", population: 2445591 },
  { state: "IL", age: "10-19", population: 1715984 },
  { state: "PA", age: "10-19", population: 1608018 },
  { state: "CA", age: "20-29", population: 5809455 },
  { state: "TX", age: "20-29", population: 3946447 },
  { state: "FL", age: "20-29", population: 2597830 },
  { state: "NY", age: "20-29", population: 2894266 },
  { state: "IL", age: "20-29", population: 1789739 },
  { state: "PA", age: "20-29", population: 1712448 },
  { state: "CA", age: "30-39", population: 5354112 },
  { state: "TX", age: "30-39", population: 3770534 },
  { state: "FL", age: "30-39", population: 2416176 },
  { state: "NY", age: "30-39", population: 2605355 },
  { state: "IL", age: "30-39", population: 1721954 },
  { state: "PA", age: "30-39", population: 1520409 },
  { state: "CA", age: "40-49", population: 5179258 },
  { state: "TX", age: "40-49", population: 3545746 },
  { state: "FL", age: "40-49", population: 2575576 },
  { state: "NY", age: "40-49", population: 2617327 },
  { state: "IL", age: "40-49", population: 1697069 },
  { state: "PA", age: "40-49", population: 1645291 },
  { state: "CA", age: "50-59", population: 5042094 },
  { state: "TX", age: "50-59", population: 3344930 },
  { state: "FL", age: "50-59", population: 2762983 },
  { state: "NY", age: "50-59", population: 2755620 },
  { state: "IL", age: "50-59", population: 1773366 },
  { state: "PA", age: "50-59", population: 1881378 },
  { state: "CA", age: "60-69", population: 3737461 },
  { state: "TX", age: "60-69", population: 2431494 },
  { state: "FL", age: "60-69", population: 2404659 },
  { state: "NY", age: "60-69", population: 2095207 },
  { state: "IL", age: "60-69", population: 1326121 },
  { state: "PA", age: "60-69", population: 1491536 },
  { state: "CA", age: "70-79", population: 2011678 },
  { state: "TX", age: "70-79", population: 1291486 },
  { state: "FL", age: "70-79", population: 1615547 },
  { state: "NY", age: "70-79", population: 1160055 },
  { state: "IL", age: "70-79", population: 728821 },
  { state: "PA", age: "70-79", population: 850897 },
  { state: "CA", age: "≥80", population: 1311374 },
  { state: "TX", age: "≥80", population: 732179 },
  { state: "FL", age: "≥80", population: 1019566 },
  { state: "NY", age: "≥80", population: 804091 },
  { state: "IL", age: "≥80", population: 478948 },
  { state: "PA", age: "≥80", population: 615069 }
];

const GroupBarChart = () => {
  const ref = useRef();

  useEffect(() => {
    const data = sampleData;
    const width = 1000;
    const height = 500;
    const marginTop = 30;
    const marginRight = 30;
    const marginBottom = 50;
    const marginLeft = 60;

    d3.select(ref.current).selectAll("*").remove();

    const svg = d3
      .select(ref.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

    const states = Array.from(new Set(data.map(d => d.state)));
    const ages = Array.from(new Set(data.map(d => d.age)));

    const fx = d3
      .scaleBand()
      .domain(states)
      .rangeRound([marginLeft, width - marginRight])
      .paddingInner(0.1);

    const x = d3
      .scaleBand()
      .domain(ages)
      .rangeRound([0, fx.bandwidth()])
      .padding(0.05);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, d => d.population)])
      .nice()
      .rangeRound([height - marginBottom, marginTop]);

    const color = d3
      .scaleOrdinal()
      .domain(ages)
      .range(d3.schemeSpectral[ages.length]);

    // Draw bars
    svg
      .append("g")
      .selectAll("g")
      .data(d3.group(data, d => d.state))
      .join("g")
      .attr("transform", ([state]) => `translate(${fx(state)},0)`)
      .selectAll("rect")
      .data(([, group]) => group)
      .join("rect")
      .attr("x", d => x(d.age))
      .attr("y", d => y(d.population))
      .attr("width", x.bandwidth())
      .attr("height", d => y(0) - y(d.population))
      .attr("fill", d => color(d.age));

    // X Axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(d3.axisBottom(fx))
      .selectAll("text")
      .attr("transform", "rotate(-40)")
      .style("text-anchor", "end");

    // Y Axis
    svg
      .append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(d3.axisLeft(y).ticks(null, "s"));

    // Legend
    const legend = svg
      .append("g")
      .attr("transform", `translate(${width - marginRight - 100},${marginTop})`);

    ages.forEach((age, i) => {
      const g = legend.append("g").attr("transform", `translate(0, ${i * 20})`);
      g.append("rect").attr("width", 15).attr("height", 15).attr("fill", color(age));
      g.append("text").attr("x", 20).attr("y", 12).text(age);
    });
  }, []);

  return (
    <div className="flex justify-center items-center p-4 bg-white">
      <svg ref={ref}></svg>
    </div>
  );
};

export default GroupBarChart;
