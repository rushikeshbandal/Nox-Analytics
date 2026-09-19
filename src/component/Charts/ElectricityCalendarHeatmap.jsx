import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

/* ================= COLOR THEMES ================= */
const COLOR_THEMES = {
  Reds: d3.interpolateReds,
  RdBu: t => d3.interpolateRdBu(1 - t),
  Viridis: d3.interpolateViridis,
  Turbo: d3.interpolateTurbo,
};

const ElectricityCalenderHeatmap = () => {
  const ref = useRef(null);

  const [view, setView] = useState("2D");      // 2D | 3D
  const [theme, setTheme] = useState("Reds"); // color theme

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const cellSize = 14;
    const depth = view === "3D" ? 6 : 0;
    const hours = d3.range(24);
    const margin = { top: 70, right: 20, bottom: 30, left: 80 };

    const parseDate = d3.utcParse("%Y-%m-%dT%H:%M");

    d3.csv("/pge-electric-data.csv", d => ({
      date: parseDate(`${d.DATE}T${d["START TIME"]}`),
      usage: +d.USAGE
    })).then(data => {
      data = data.filter(d => d.date && !isNaN(d.usage));
      data = data.filter(d => d.date.getUTCFullYear() === 2019);

      const days = d3.utcDays(
        d3.utcYear(data[0].date),
        d3.utcYear.offset(d3.utcYear(data[0].date), 1)
      );

      const height =
        days.length * cellSize + margin.top + margin.bottom + depth;
      const width =
        hours.length * cellSize + margin.left + margin.right + depth;

      svg
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("width", width)
        .attr("height", height)
        .style("background", "white")
        .style("font", "10px sans-serif");

      /* ===== TITLE ===== */
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", 28)
        .attr("text-anchor", "middle")
        .attr("font-size", 18)
        .attr("font-weight", 700)
        .text("Electricity Usage Calendar Heatmap (2019)");

      /* ===== SCALES ===== */
      const x = d3.scaleBand()
        .domain(hours)
        .range([margin.left, width - margin.right - depth]);

      const y = d3.scaleBand()
        .domain(days.map(d => +d))
        .range([margin.top, height - margin.bottom - depth]);

      let [min, max] = d3.extent(data, d => d.usage);
      if (min < 0) max = Math.max(-min, max);

      const color =
        min < 0
          ? d3.scaleDiverging([-max, 0, max], COLOR_THEMES[theme])
          : d3.scaleSequential([0, max], COLOR_THEMES[theme]);

      /* ===== CELLS (FRONT FACE) ===== */
      const rows = svg.append("g")
        .selectAll("rect")
        .data(data)
        .join("rect")
        .attr("x", d => x(d.date.getUTCHours()))
        .attr("y", d => y(+d3.utcDay(d.date)))
        .attr("width", x.bandwidth() - 1)
        .attr("height", y.bandwidth() - 1)
        .attr("fill", d => color(d.usage));

      rows.append("title")
        .text(d =>
          `${d3.utcFormat("%b %d, %I %p")(d.date)}\nUsage: ${d.usage}`
        );

      /* ===== Z AXIS (ONLY 3D) ===== */
      if (view === "3D") {
        svg.append("g")
          .selectAll("polygon")
          .data(data)
          .join("polygon")
          .attr("fill", d => d3.color(color(d.usage)).darker(0.8))
          .attr("points", d => {
            const x0 = x(d.date.getUTCHours());
            const y0 = y(+d3.utcDay(d.date));
            const w = x.bandwidth() - 1;
            const h = y.bandwidth() - 1;
            return `
              ${x0 + w},${y0}
              ${x0 + w + depth},${y0 + depth}
              ${x0 + w + depth},${y0 + h + depth}
              ${x0 + w},${y0 + h}
            `;
          });
      }

      /* ===== X AXIS ===== */
      svg.append("g")
        .attr("transform", `translate(0,${margin.top - 5})`)
        .call(
          d3.axisTop(x)
            .tickValues(hours)
            .tickFormat(h =>
              h === 0 ? "12 AM" :
              h < 12 ? `${h} AM` :
              h === 12 ? "12 PM" :
              `${h - 12} PM`
            )
        )
        .call(g => g.select(".domain").remove());

      /* ===== Y AXIS ===== */
      svg.append("g")
        .attr("transform", `translate(${margin.left - 6},0)`)
        .call(
          d3.axisLeft(y)
            .tickValues(
              d3.utcMonths(
                d3.utcYear(days[0]),
                d3.utcYear.offset(days[0], 1)
              ).map(d => +d)
            )
            .tickFormat(d3.utcFormat("%b"))
        )
        .call(g => g.select(".domain").remove());
    });
  }, [view, theme]);

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      {/* ===== CONTROLS ===== */}
      <div className="flex gap-6 mb-4 flex-wrap">
        <div>
          <label className="font-semibold mr-2">View:</label>
          <select value={view} onChange={e => setView(e.target.value)}>
            <option value="2D">2D</option>
            <option value="3D">3D</option>
          </select>
        </div>

        <div>
          <label className="font-semibold mr-2">Color Theme:</label>
          <select value={theme} onChange={e => setTheme(e.target.value)}>
            {Object.keys(COLOR_THEMES).map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <svg ref={ref} style={{ display: "block", overflow: "visible" }} />
    </div>
  );
};

export default ElectricityCalenderHeatmap;