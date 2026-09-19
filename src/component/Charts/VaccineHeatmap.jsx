import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

/* ================= COLOR THEMES ================= */
const COLOR_THEMES = {
  PuRd: d3.interpolatePuRd,
  Viridis: d3.interpolateViridis,
  Turbo: d3.interpolateTurbo,
  Inferno: d3.interpolateInferno,
};

const VaccineHeatmap = () => {
  const ref = useRef(null);

  const [view, setView] = useState("2D");      // 2D | 3D
  const [theme, setTheme] = useState("PuRd"); // color theme

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    d3.json("/vaccines (1).json").then(raw => {
      /* ===== DATA (UNCHANGED) ===== */
      const dataset = raw[0].data.values.data;

      const names = [
        "Alaska","Ala.","Ark.","Ariz.","Calif.","Colo.","Conn.","D.C.","Del.",
        "Fla.","Ga.","Hawaii","Iowa","Idaho","Ill.","Ind.","Kan.","Ky.","La.",
        "Mass.","Md.","Maine","Mich.","Minn.","Mo.","Miss.","Mont.","N.C.",
        "N.D.","Neb.","N.H.","N.J.","N.M","Nev.","N.Y.","Ohio","Okla.","Ore.",
        "Pa.","R.I.","S.C.","S.D.","Tenn.","Texas","Utah","Va.","Vt.","Wash.",
        "Wis.","W.Va.","Wyo."
      ];

      const values = [];
      const year0 = d3.min(dataset, d => d[0]);
      const year1 = d3.max(dataset, d => d[0]);
      const years = d3.range(year0, year1 + 1);

      for (const [year, i, value] of dataset) {
        if (value == null) continue;
        (values[i] || (values[i] = []))[year - year0] = value;
      }

      /* ===== LAYOUT ===== */
      const marginTop = 70;
      const marginRight = 10;
      const marginBottom = 40;
      const marginLeft = 70;
      const rowHeight = 16;
      const width = 1000;
      const depth = view === "3D" ? 8 : 0;

      const height =
        rowHeight * names.length +
        marginTop +
        marginBottom +
        depth;

      svg
        .attr("viewBox", `0 0 ${width + depth} ${height}`)
        .attr("width", width + depth)
        .attr("height", height)
        .style("background", "white")
        .style("font", "10px sans-serif");

      /* ===== TITLE ===== */
      svg.append("text")
        .attr("x", (width + depth) / 2)
        .attr("y", 28)
        .attr("text-anchor", "middle")
        .attr("font-size", 18)
        .attr("font-weight", 700)
        .text("US Vaccine Coverage Heatmap");

      const x = d3.scaleLinear()
        .domain([year0, year1 + 1])
        .range([marginLeft, width - marginRight]);

      const y = d3.scaleBand()
        .domain(names)
        .range([marginTop, height - marginBottom - depth]);

      const color = d3.scaleSequentialSqrt(
        [0, d3.max(values, d => d3.max(d))],
        COLOR_THEMES[theme]
      );

      /* ===== AXES ===== */
      svg.append("g")
        .attr("transform", `translate(0,${marginTop})`)
        .call(d3.axisTop(x).ticks(10, "d"))
        .call(g => g.select(".domain").remove());

      svg.append("g")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(d3.axisLeft(y).tickSize(0))
        .call(g => g.select(".domain").remove());

      /* ===== ROW GROUPS ===== */
      const rows = svg.append("g")
        .selectAll("g")
        .data(values)
        .join("g")
        .attr("transform", (d, i) =>
          `translate(0,${y(names[i])})`
        );

      /* ===== FRONT CELLS (2D FACE) ===== */
      rows.selectAll("rect")
        .data(d => d)
        .join("rect")
        .attr("x", (d, i) => x(years[i]) + 1)
        .attr("width", (d, i) => x(years[i] + 1) - x(years[i]) - 1)
        .attr("height", y.bandwidth() - 1)
        .attr("fill", d =>
          d == null ? "#eee" : d === 0 ? "#fff" : color(d)
        )
        .append("title")
        .text((d, i) =>
          `${years[i]}: ${d == null ? "N/A" : d + " cases"}`
        );

      /* ===== Z AXIS (ONLY IN 3D MODE) ===== */
      if (view === "3D") {
        rows.selectAll("polygon")
          .data(d => d)
          .join("polygon")
          .attr("fill", d =>
            d == null
              ? "#ddd"
              : d3.color(color(d)).darker(0.9)
          )
          .attr("points", (d, i) => {
            const x0 = x(years[i]) + 1;
            const w = x(years[i] + 1) - x(years[i]) - 1;
            const h = y.bandwidth() - 1;
            return `
              ${x0 + w},0
              ${x0 + w + depth},${depth}
              ${x0 + w + depth},${h + depth}
              ${x0 + w},${h}
            `;
          });
      }
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

      <svg ref={ref} />
    </div>
  );
};

export default VaccineHeatmap;