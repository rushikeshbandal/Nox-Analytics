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

const LineChartMissingData = () => {
  const ref = useRef(null);

  const [theme, setTheme] = useState("Blue");
  const [view, setView] = useState("2D"); // 2D / 3D

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const width = 928;
    const height = 500;
    const margin = { top: 60, right: 30, bottom: 40, left: 50 };

    svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("background", "white")
      .style("font", "12px sans-serif");

    // 🏷️ TITLE
    svg.append("text")
      .attr("x", margin.left)
      .attr("y", 30)
      .attr("font-size", 16)
      .attr("font-weight", 700)
      .text("AAPL Stock Price – Line Chart with Missing Data");

    // 🔽 LOAD LIVE CSV
    d3.csv("/aapl.csv").then(raw => {
      const aapl = raw
        .map(d => ({
          date: new Date(d.Date || d.date),
          close: +d.Close || +d.close
        }))
        .filter(d => !isNaN(d.date) && !isNaN(d.close));

      // simulate missing data
      const aaplMissing = aapl.map(d => ({
        ...d,
        close: d.date.getMonth() < 3 ? NaN : d.close
      }));

      const x = d3.scaleTime()
        .domain(d3.extent(aapl, d => d.date))
        .range([margin.left, width - margin.right]);

      const y = d3.scaleLinear()
        .domain([0, d3.max(aapl, d => d.close)])
        .nice()
        .range([height - margin.bottom, margin.top]);

      const line = d3.line()
        .defined(d => !isNaN(d.close))
        .x(d => x(d.date))
        .y(d => y(d.close));

      /* 🌗 3D Z-AXIS EFFECT (pseudo depth) */
      const depth = view === "3D" ? 12 : 0;

      // BACK LINE (Z depth)
      if (view === "3D") {
        svg.append("path")
          .attr("fill", "none")
          .attr("stroke", COLOR_THEMES[theme].faded)
          .attr("stroke-width", 2)
          .attr("transform", `translate(${depth},${-depth})`)
          .attr("d", line(aaplMissing));
      }

      // MAIN LINE (with gaps)
      svg.append("path")
        .attr("fill", "none")
        .attr("stroke", COLOR_THEMES[theme].main)
        .attr("stroke-width", 2.2)
        .attr("d", line(aaplMissing));

      // AXES
      svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x));

      svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

      // Z AXIS LABEL (3D MODE)
      if (view === "3D") {
        svg.append("text")
          .attr("x", width - 110)
          .attr("y", margin.top)
          .attr("fill", "#555")
          .attr("font-size", 11)
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

export default LineChartMissingData;