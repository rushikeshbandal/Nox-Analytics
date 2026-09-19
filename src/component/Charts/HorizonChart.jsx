import { useEffect, useRef } from "react";
import * as d3 from "d3";

const HorizonChart = () => {
  const ref = useRef();

  useEffect(() => {
    const bands = 8;
    const padding = 1;
    const size = 25;
    const width = 928;
    const marginTop = 30;
    const marginRight = 10;
    const marginBottom = 0;
    const marginLeft = 10;

    const colors = [
      "#fff5eb",
      "#fee6ce",
      "#fdd0a2",
      "#fdae6b",
      "#fd8d3c",
      "#f16913",
      "#d94801",
      "#8c2d04"
    ];

    d3.csv("/traffic.csv", d3.autoType).then(data => {
      // CLEAR OLD SVG
      d3.select(ref.current).selectAll("*").remove();

      // GROUP DATA
      const series = d3.rollup(
        data,
        v => v.sort((a, b) => a.date - b.date),
        d => d.name
      );

      const height =
        series.size * size + marginTop + marginBottom;

      // SCALES
      const x = d3.scaleUtc()
        .domain(d3.extent(data, d => d.date))
        .range([0, width]);

      const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.value)])
        .range([size, size - bands * (size - padding)]);

      const area = d3.area()
        .defined(d => !isNaN(d.value))
        .x(d => x(d.date))
        .y0(size)
        .y1(d => y(d.value));

      const uid = `horizon-${Math.random().toString(16).slice(2)}`;

      // SVG
      const svg = d3.select(ref.current)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .style("font", "10px sans-serif");

      // ROW GROUPS
      const g = svg.append("g")
        .selectAll("g")
        .data(series)
        .join("g")
        .attr(
          "transform",
          (d, i) => `translate(0, ${i * size + marginTop})`
        );

      const defs = g.append("defs");

      // CLIP PATH
      defs.append("clipPath")
        .attr("id", (_, i) => `${uid}-clip-${i}`)
        .append("rect")
        .attr("y", padding)
        .attr("width", width)
        .attr("height", size - padding);

      // AREA PATH
      defs.append("path")
        .attr("id", (_, i) => `${uid}-path-${i}`)
        .attr("d", ([, values]) => area(values));

      // BANDS
      g.append("g")
        .attr(
          "clip-path",
          (_, i) => `url(#${uid}-clip-${i})`
        )
        .selectAll("use")
        .data((_, i) => new Array(bands).fill(i))
        .enter()
        .append("use")
        .attr("href", i => `#${uid}-path-${i}`)
        .attr("fill", (_, i) => colors[i])
        .attr(
          "transform",
          (_, i) => `translate(0, ${i * size})`
        );

      // LABELS
      g.append("text")
        .attr("x", 4)
        .attr("y", (size + padding) / 2)
        .attr("dy", "0.35em")
        .text(([name]) => name);

      // X AXIS
      svg.append("g")
        .attr("transform", `translate(0,${marginTop})`)
        .call(
          d3.axisTop(x)
            .ticks(width / 80)
            .tickSizeOuter(0)
        )
        .call(g => g.select(".domain").remove());
    });
  }, []);

  return <div ref={ref} />;
};

export default HorizonChart;