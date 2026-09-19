import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

/* 🎨 COLOR THEMES */
const COLOR_THEMES = {
  Blue: {
    main: "steelblue",
    faded: "#c7d2fe"
  },
  Green: {
    main: "#16a34a",
    faded: "#bbf7d0"
  },
  Orange: {
    main: "#ea580c",
    faded: "#fed7aa"
  }
};

const MultiLineUnemploymentChart = () => {
  const ref = useRef(null);

  const [theme, setTheme] = useState("Blue");
  const [view, setView] = useState("2D"); // 2D / 3D

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const width = 928;
    const height = 600;
    const margin = { top: 70, right: 20, bottom: 40, left: 50 };

    svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("background", "white")
      .style("font", "11px sans-serif");

    /* 🏷️ TITLE */
    svg.append("text")
      .attr("x", margin.left)
      .attr("y", 30)
      .attr("font-size", 16)
      .attr("font-weight", 700)
      .text("Metropolitan Area Unemployment Trends");

    /* 🔥 LOAD LIVE CSV */
    d3.csv("/bls-metro-unemployment.csv", d => ({
      division: d.division,
      date: new Date(d.date),
      unemployment: +d.unemployment
    })).then(unemployment => {

      unemployment = unemployment.filter(
        d => d.date instanceof Date && !isNaN(d.date)
      );

      /* 🔢 GROUP BY DIVISION */
      const series = d3.groups(unemployment, d => d.division);

      /* 📏 SCALES */
      const x = d3.scaleUtc()
        .domain(d3.extent(unemployment, d => d.date))
        .range([margin.left, width - margin.right]);

      const y = d3.scaleLinear()
        .domain([0, d3.max(unemployment, d => d.unemployment)])
        .nice()
        .range([height - margin.bottom, margin.top]);

      /* 📐 AXES */
      svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0));

      svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y))
        .call(g => g.select(".domain").remove())
        .call(g =>
          g.append("text")
            .attr("x", -margin.left)
            .attr("y", 10)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .attr("font-weight", 600)
            .text("↑ Unemployment (%)")
        );

      const line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.unemployment));

      /* 🌗 Z-AXIS DEPTH (3D MODE) */
      const depth = view === "3D" ? 10 : 0;

      /* 🔹 BACK LINES (Z depth layer) */
      if (view === "3D") {
        svg.append("g")
          .attr("fill", "none")
          .attr("stroke", COLOR_THEMES[theme].faded)
          .attr("stroke-width", 1.5)
          .selectAll("path")
          .data(series)
          .join("path")
          .attr(
            "transform",
            `translate(${depth},${-depth})`
          )
          .attr("d", d => line(d[1]));
      }

      /* 🔵 MAIN LINES */
      const paths = svg.append("g")
        .attr("fill", "none")
        .attr("stroke", COLOR_THEMES[theme].main)
        .attr("stroke-width", 1.8)
        .selectAll("path")
        .data(series)
        .join("path")
        .attr("d", d => line(d[1]))
        .style("mix-blend-mode", "multiply");

      /* 🔥 INTERACTION DOT */
      const dot = svg.append("g").attr("display", "none");
      dot.append("circle").attr("r", 3);
      dot.append("text")
        .attr("y", -8)
        .attr("text-anchor", "middle")
        .attr("font-size", 10);

      const points = unemployment.map(d => [
        x(d.date),
        y(d.unemployment),
        d.division
      ]);

      svg
        .on("pointerenter", () => {
          paths.style("stroke", "#ddd");
          dot.attr("display", null);
        })
        .on("pointermove", (event) => {
          const [xm, ym] = d3.pointer(event);
          const i = d3.leastIndex(points, p =>
            Math.hypot(p[0] - xm, p[1] - ym)
          );
          const [px, py, division] = points[i];

          paths
            .style("stroke", d =>
              d[0] === division
                ? COLOR_THEMES[theme].main
                : "#ddd"
            )
            .filter(d => d[0] === division)
            .raise();

          dot.attr("transform", `translate(${px},${py})`);
          dot.select("text").text(division);
        })
        .on("pointerleave", () => {
          paths.style("stroke", COLOR_THEMES[theme].main);
          dot.attr("display", "none");
        });

      /* 🧭 Z-AXIS LABEL (3D MODE) */
      if (view === "3D") {
        svg.append("text")
          .attr("x", width - 110)
          .attr("y", margin.top)
          .attr("font-size", 11)
          .attr("fill", "#555")
          .text("Z → depth");
      }
    });
  }, [theme, view]);

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      {/* 🔽 CONTROLS */}
      <div className="flex gap-6 mb-4">
        <div>
          <label className="font-semibold mr-2">Color Theme:</label>
          <select value={theme} onChange={e => setTheme(e.target.value)}>
            {Object.keys(COLOR_THEMES).map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-semibold mr-2">View:</label>
          <select value={view} onChange={e => setView(e.target.value)}>
            <option value="2D">2D</option>
            <option value="3D">3D</option>
          </select>
        </div>
      </div>

      <svg ref={ref} />
    </div>
  );
};

export default MultiLineUnemploymentChart;