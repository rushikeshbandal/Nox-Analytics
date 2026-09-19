import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const COLOR_THEMES = {
  PiYG: d3.interpolatePiYG,
  RdYlGn: d3.interpolateRdYlGn,
  Turbo: d3.interpolateTurbo,
  Viridis: d3.interpolateViridis,
};

const DJICalendarHeatmap = () => {
  const ref = useRef(null);

  const [view, setView] = useState("2D");     // 2D | 3D
  const [theme, setTheme] = useState("PiYG"); // color theme

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const cellSize = 16;
    const height = cellSize * 7;
    const width = (cellSize + 1.5) * 53;
    const depth = view === "3D" ? 6 : 0;

    const formatValue = d3.format("+.2%");
    const formatClose = d3.format("$,.2f");
    const formatDate = d3.utcFormat("%x");
    const formatDay = i => "SMTWTFS"[i];
    const formatMonth = d3.utcFormat("%b");

    const timeWeek = d3.utcMonday;
    const countDay = i => (i + 6) % 7;

    d3.csv("/^DJI.csv", d => ({
      Date: new Date(d.Date),
      Close: +d.Close,
    })).then(rows => {
      rows.sort((a, b) => d3.ascending(a.Date, b.Date));

      const data = d3.pairs(rows, (a, b) => ({
        date: b.Date,
        value: (b.Close - a.Close) / a.Close,
        close: b.Close,
      }));

      const max = d3.quantile(data, 0.9975, d => Math.abs(d.value));

      const color = d3.scaleSequential(COLOR_THEMES[theme])
        .domain([-max, max]);

      const years = d3.groups(
        data,
        d => d.date.getUTCFullYear()
      ).reverse();

      function pathMonth(t) {
        const d = Math.max(0, Math.min(5, countDay(t.getUTCDay())));
        const w = timeWeek.count(d3.utcYear(t), t);
        return `${d === 0
          ? `M${w * cellSize},0`
          : d === 5
          ? `M${(w + 1) * cellSize},0`
          : `M${(w + 1) * cellSize},0V${d * cellSize}H${w * cellSize}`
        }V${5 * cellSize}`;
      }

      svg
        .attr("width", width + 80 + depth)
        .attr("height", height * years.length + 80 + depth)
        .attr("viewBox", `0 0 ${width + 80 + depth} ${height * years.length + 80 + depth}`)
        .style("background", "white")
        .style("font", "10px sans-serif");

      /* ===== TITLE ===== */
      svg.append("text")
        .attr("x", (width + 80) / 2)
        .attr("y", 24)
        .attr("text-anchor", "middle")
        .attr("font-size", 18)
        .attr("font-weight", 700)
        .text("Dow Jones Industrial Average – Daily Returns Heatmap");

      const year = svg.selectAll("g.year")
        .data(years)
        .join("g")
        .attr("class", "year")
        .attr(
          "transform",
          (d, i) =>
            `translate(50,${height * i + 60})`
        );

      // year label
      year.append("text")
        .attr("x", -10)
        .attr("y", -6)
        .attr("font-weight", "bold")
        .attr("text-anchor", "end")
        .text(([y]) => y);

      // day labels
      year.append("g")
        .attr("text-anchor", "end")
        .selectAll("text")
        .data(d3.range(1, 6))
        .join("text")
        .attr("x", -10)
        .attr("y", i => (countDay(i) + 0.5) * cellSize)
        .attr("dy", "0.31em")
        .text(formatDay);

      // ===== CELLS =====
      const cells = year.append("g")
        .selectAll("rect")
        .data(([, values]) =>
          values.filter(d => ![0, 6].includes(d.date.getUTCDay()))
        )
        .join("rect")
        .attr("width", cellSize - 1)
        .attr("height", cellSize - 1)
        .attr("x", d =>
          timeWeek.count(d3.utcYear(d.date), d.date) * cellSize
        )
        .attr("y", d =>
          countDay(d.date.getUTCDay()) * cellSize
        )
        .attr("fill", d => color(d.value))
        .append("title")
        .text(
          d => `${formatDate(d.date)}
${formatValue(d.value)}
${formatClose(d.close)}`
        );

      /* ===== Z AXIS (3D DEPTH) ===== */
      if (view === "3D") {
        year.append("g")
          .selectAll("polygon")
          .data(([, values]) =>
            values.filter(d => ![0, 6].includes(d.date.getUTCDay()))
          )
          .join("polygon")
          .attr("fill", d => d3.color(color(d.value)).darker(0.8))
          .attr("points", d => {
            const x =
              timeWeek.count(d3.utcYear(d.date), d.date) * cellSize;
            const y =
              countDay(d.date.getUTCDay()) * cellSize;
            return `
              ${x + cellSize},${y}
              ${x + cellSize + depth},${y + depth}
              ${x + cellSize + depth},${y + cellSize + depth}
              ${x + cellSize},${y + cellSize}
            `;
          });
      }

      // months
      const month = year.append("g")
        .selectAll("g")
        .data(([, values]) =>
          d3.utcMonths(
            d3.utcMonth(values[0].date),
            values.at(-1).date
          )
        )
        .join("g");

      month.filter((d, i) => i)
        .append("path")
        .attr("fill", "none")
        .attr("stroke", "#fff")
        .attr("stroke-width", 3)
        .attr("d", pathMonth);

      month.append("text")
        .attr(
          "x",
          d =>
            timeWeek.count(d3.utcYear(d), timeWeek.ceil(d)) *
              cellSize +
            2
        )
        .attr("y", -6)
        .text(formatMonth);
    });
  }, [view, theme]);

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      {/* CONTROLS */}
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

      <svg ref={ref} style={{ display: "block" }} />
    </div>
  );
};

export default DJICalendarHeatmap;