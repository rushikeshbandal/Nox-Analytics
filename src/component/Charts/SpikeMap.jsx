import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";

export default function SpikeMap() {
  const ref = useRef();

  useEffect(() => {
    const width = 975;
    const height = 610;

    // Clear old SVG (IMPORTANT)
    d3.select(ref.current).selectAll("*").remove();

    const svg = d3
      .select(ref.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .style("max-width", "100%");

    Promise.all([
      d3.json("/counties-albers-10m.json"),
      d3.json("/population.json")
    ]).then(([us, populationRaw]) => {

      // ---- POPULATION DATA ----
      const population = populationRaw
        .slice(1)
        .map(([p, state, county]) => ({
          fips: `${state}${county}`,
          population: +p
        }));

      const counties = new Map(
        topojson
          .feature(us, us.objects.counties)
          .features.map(d => [d.id, d])
      );

      const states = new Map(
        topojson
          .feature(us, us.objects.states)
          .features.map(d => [d.id, d])
      );

      const data = population
        .map(d => ({
          ...d,
          county: counties.get(d.fips),
          state: states.get(d.fips.slice(0, 2))
        }))
        .filter(d => d.county);

      // ---- SCALES ----
      const spikeScale = d3
        .scaleLinear()
        .domain([0, d3.max(data, d => d.population)])
        .range([0, 200]);

      const path = d3.geoPath();

      const centroid = feature => path.centroid(feature);

      const spike = (h, w = 6) =>
        `M${-w / 2},0L0,${-h}L${w / 2},0`;

      // ---- MAP BACKGROUND ----
      svg.append("path")
        .datum(topojson.feature(us, us.objects.nation))
        .attr("fill", "#eee")
        .attr("d", path);

      svg.append("path")
        .datum(
          topojson.mesh(us, us.objects.states, (a, b) => a !== b)
        )
        .attr("fill", "none")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
        .attr("d", path);

      // ---- SPIKES ----
      const format = d3.format(",");

      svg.append("g")
        .attr("fill", "red")
        .attr("fill-opacity", 0.55)
        .attr("stroke", "red")
        .attr("stroke-width", 0.6)
        .selectAll("path")
        .data(data)
        .join("path")
          .attr("transform", d => {
            const [x, y] = centroid(d.county);
            return `translate(${x},${y})`;
          })
          .attr("d", d => spike(spikeScale(d.population)))
        .append("title") // ✅ HOVER TOOLTIP
          .text(d =>
            `${d.county.properties.name}, ${d.state?.properties?.name || ""}
Population: ${format(d.population)}`
          );
    });
  }, []);

  return <div ref={ref} />;
}