import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";

export default function BubbleMap() {
  const ref = useRef();
  const drawnRef = useRef(false); // 🔑 prevents double render

  useEffect(() => {
    if (drawnRef.current) return; // 🔒 stop 2nd run
    drawnRef.current = true;

    const width = 975;
    const height = 610;

    // 🔥 CLEAR ANY EXISTING SVG
    d3.select(ref.current).selectAll("*").remove();

    Promise.all([
      d3.json("/counties-albers-10m.json"),
      d3.json("/population.json")
    ]).then(([us, populationRaw]) => {

      const population = populationRaw
        .slice(1)
        .map(([p, state, county]) => ({
          fips: `${state}${county}`,
          population: +p
        }))
        .filter(d => !isNaN(d.population) && d.population > 0);

      const counties = topojson.feature(us, us.objects.counties);
      const states = topojson.mesh(us, us.objects.states, (a, b) => a !== b);

      const countyMap = new Map(
        counties.features.map(d => [d.id, d])
      );

      const data = population
        .map(d => ({
          ...d,
          county: countyMap.get(d.fips)
        }))
        .filter(d => d.county);

      const radius = d3.scaleSqrt()
        .domain([0, d3.max(data, d => d.population)])
        .range([0, 40]);

      const path = d3.geoPath();

      const svg = d3.select(ref.current)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .style("background", "#fff");

      // ---- MAP ----
      svg.append("path")
        .datum(topojson.feature(us, us.objects.nation))
        .attr("fill", "#e5e5e5")
        .attr("d", path);

      svg.append("path")
        .datum(states)
        .attr("fill", "none")
        .attr("stroke", "#fff")
        .attr("stroke-linejoin", "round")
        .attr("d", path);

      // ---- BUBBLES ----
      svg.append("g")
        .attr("fill", "brown")
        .attr("fill-opacity", 0.5)
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        .selectAll("circle")
        .data(data)
        .join("circle")
        .attr("transform", d => {
          const [x, y] = path.centroid(d.county);
          return isNaN(x) || isNaN(y) ? null : `translate(${x},${y})`;
        })
        .attr("r", d => radius(d.population));
    });

  }, []);

  return <div ref={ref} />;
}