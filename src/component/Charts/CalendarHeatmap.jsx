import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function CalendarHeatmap() {
  const ref = useRef(null);
  const hasRendered = useRef(false); // 🔑 StrictMode fix

  useEffect(() => {
    if (hasRendered.current) return;
    hasRendered.current = true;

    d3.select(ref.current).selectAll("*").remove();  

    // 🔹 Sample daily data (GitHub contributions style)
    d3.csv(
      "https://raw.githubusercontent.com/vega/vega-datasets/master/data/seattle-weather.csv",
      d => {
        const date = new Date(d.date);
        const value = +d.temp_max;
        if (!date || isNaN(value)) return null;
        return { date, value };
      }
    ).then(raw => {
      const data = raw.filter(Boolean);
      if (!data.length) return;

      const width = 960;
      const cellSize = 17;
      const height = cellSize * 8;
      const marginTop = 40;
      const marginLeft = 40;

      const years = d3.groups(data, d => d.date.getFullYear());

      const color = d3.scaleSequential()
        .domain(d3.extent(data, d => d.value))
        .interpolator(d3.interpolateYlOrRd);

      const svg = d3.select(ref.current)
        .append("svg")
        .attr("width", width)
        .attr("height", years.length * height + marginTop + 20)
        .style("font", "10px sans-serif");

      const formatDay = d => "SMTWTFS"[d.getDay()];
      const formatWeek = d3.timeFormat("%U");

      const yearGroup = svg.append("g")
        .selectAll("g")
        .data(years)
        .join("g")
        .attr(
          "transform",
          (d, i) => `translate(${marginLeft},${marginTop + i * height})`
        );

      // Year label
      yearGroup.append("text")
        .attr("x", -5)
        .attr("y", -5)
        .attr("text-anchor", "end")
        .attr("font-weight", "bold")
        .text(d => d[0]);

      // Day labels
      yearGroup.append("g")
        .selectAll("text")
        .data(d3.range(7))
        .join("text")
        .attr("x", -10)
        .attr("y", d => (d + 0.5) * cellSize)
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .text(d => formatDay(new Date(2023, 0, d)));

      // Cells
      yearGroup.append("g")
        .selectAll("rect")
        .data(d => d[1])
        .join("rect")
        .attr("width", cellSize - 1)
        .attr("height", cellSize - 1)
        .attr(
          "x",
          d => formatWeek(d.date) * cellSize
        )
        .attr(
          "y",
          d => d.date.getDay() * cellSize
        )
        .attr("fill", d => color(d.value))
        .append("title")
        .text(d =>
          `${d3.timeFormat("%Y-%m-%d")(d.date)}\nValue: ${d.value}`
        );
    });
  }, []);

  return (
    <div style={{ margin: 40 }}>
      <h2>Calendar Heatmap</h2>
      <div ref={ref}></div>
    </div>
  );
}




// import React, { useEffect, useState } from "react";
// import Plot from "react-plotly.js";
// import * as d3 from "d3";

// export default function CalendarHeatmap3D() {
//   const [plotData, setPlotData] = useState([]);

//   useEffect(() => {
//     d3.csv(
//       "https://raw.githubusercontent.com/vega/vega-datasets/master/data/seattle-weather.csv",
//       d => {
//         const date = new Date(d.date);
//         return {
//           week: +d3.timeFormat("%U")(date),
//           day: date.getDay(),
//           value: +d.temp_max
//         };
//       }
//     ).then(data => {
//       const weeks = [...new Set(data.map(d => d.week))];
//       const days = [...new Set(data.map(d => d.day))];

//       const z = days.map(day =>
//         weeks.map(week => {
//           const match = data.find(
//             d => d.week === week && d.day === day
//           );
//           return match ? match.value : 0;
//         })
//       );

//       setPlotData([
//         {
//           type: "surface",
//           x: weeks,
//           y: days,
//           z: z,
//           colorscale: "YlOrRd"
//         }
//       ]);
//     });
//   }, []);

//   return (
//     <div>
//       <h2>3D Calendar Heatmap</h2>

//       <Plot
//         data={plotData}
//         layout={{
//           width: 900,
//           height: 600,
//           scene: {
//             xaxis: { title: "Week Number" },
//             yaxis: { title: "Day (0=Sun)" },
//             zaxis: { title: "Max Temperature" }
//           }
//         }}
//       />
//     </div>
//   );
// }