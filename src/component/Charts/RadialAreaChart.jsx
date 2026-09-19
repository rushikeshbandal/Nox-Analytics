import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";

const RadialAreaChart = () => {
  const ref = useRef();
  const [data, setData] = useState([]);
  const [cityName, setCityName] = useState("San Francisco");
  const [year, setYear] = useState(2000);
  const [coordinates, setCoordinates] = useState({ lat: 37.7749, lon: -122.4194 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch coordinates when cityName changes
  useEffect(() => {
    const fetchCoordinates = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}`);
        const json = await res.json();
        if (json.length === 0) {
          setError("City not found.");
          setLoading(false);
          return;
        }
        const { lat, lon } = json[0];
        setCoordinates({ lat, lon });
      } catch (err) {
        console.error(err);
        setError("Error fetching city coordinates.");
      } finally {
        setLoading(false);
      }
    };
    if (cityName) {
      fetchCoordinates();
    }
  }, [cityName]);

  // Fetch weather data when coordinates or year change
  useEffect(() => {
    const fetchWeatherData = async () => {
      if (!coordinates.lat || !year) return;

      setLoading(true);
      setError("");

      try {
        const start_date = `${year}-01-01`;
        const end_date = `${year}-12-31`;
        const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${coordinates.lat}&longitude=${coordinates.lon}&start_date=${start_date}&end_date=${end_date}&daily=temperature_2m_max,temperature_2m_min,temperature_2m_mean&timezone=auto`;

        const res = await fetch(url);
        const json = await res.json();

        if (!json.daily || !json.daily.time) {
          setError("No weather data available.");
          setData([]);
          setLoading(false);
          return;
        }

        const { time, temperature_2m_min, temperature_2m_max, temperature_2m_mean } = json.daily;

        const parsed = time.map((date, i) => ({
          date: new Date(date),
          min: temperature_2m_min[i],
          max: temperature_2m_max[i],
          avg: temperature_2m_mean[i],
          minmin: temperature_2m_min[i],
          maxmax: temperature_2m_max[i],
        }));

        setData(parsed);
      } catch (err) {
        console.error(err);
        setError("Error fetching weather data.");
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherData();
  }, [coordinates, year]);

  // Draw chart
  useEffect(() => {
    if (data.length === 0) return;

    const width = 728;
    const height = width;
    const margin = 10;
    const innerRadius = width / 5;
    const outerRadius = width / 2 - margin;

    const svg = d3.select(ref.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .attr("style", "width: 100%; height: auto; font: 10px sans-serif;")
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round");

    svg.selectAll("*").remove();

    const x = d3.scaleUtc()
      .domain([new Date(`${year}-01-01`), new Date(`${year + 1}-01-01`) - 1])
      .range([0, 2 * Math.PI]);

    const y = d3.scaleRadial()
      .domain([d3.min(data, d => d.min), d3.max(data, d => d.max)])
      .range([innerRadius, outerRadius]);

    const area = d3.areaRadial()
      .curve(d3.curveLinearClosed)
      .angle(d => x(d.date));

    const line = d3.lineRadial()
      .curve(d3.curveLinearClosed)
      .angle(d => x(d.date));

    svg.append("path")
      .attr("fill", "lightsteelblue")
      .attr("fill-opacity", 0.2)
      .attr("d", area
        .innerRadius(d => y(d.minmin))
        .outerRadius(d => y(d.maxmax))
        (data));

    svg.append("path")
      .attr("fill", "steelblue")
      .attr("fill-opacity", 0.2)
      .attr("d", area
        .innerRadius(d => y(d.min))
        .outerRadius(d => y(d.max))
        (data));

    svg.append("path")
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
      .attr("d", line
        .radius(d => y(d.avg))
        (data));

    const months = x.ticks(d3.utcMonth.every(1));
    svg.append("g")
      .selectAll("g")
      .data(months)
      .join("g")
      .each(function (d) {
        const g = d3.select(this);
        const id = `month-${d.getMonth()}`;
        g.append("path")
          .attr("stroke", "#000")
          .attr("stroke-opacity", 0.2)
          .attr("d", `
            M${d3.pointRadial(x(d), innerRadius)}
            L${d3.pointRadial(x(d), outerRadius)}
          `);
        g.append("path")
          .attr("id", id)
          .datum([d, d3.utcMonth.offset(d, 1)])
          .attr("fill", "none")
          .attr("d", ([a, b]) => `
            M${d3.pointRadial(x(a), innerRadius)}
            A${innerRadius},${innerRadius} 0,0,1 ${d3.pointRadial(x(b), innerRadius)}
          `);
        g.append("text")
          .append("textPath")
          .attr("startOffset", 6)
          .attr("xlink:href", `#${id}`)
          .text(d3.utcFormat("%B")(d));
      });

    svg.append("g")
      .attr("text-anchor", "middle")
      .selectAll("g")
      .data(y.ticks().reverse())
      .join("g")
      .call(g => g.append("circle")
        .attr("fill", "none")
        .attr("stroke", "currentColor")
        .attr("stroke-opacity", 0.2)
        .attr("r", y))
      .call(g => g.append("text")
        .attr("y", d => -y(d))
        .attr("dy", "0.35em")
        .attr("stroke", "#fff")
        .attr("stroke-width", 5)
        .attr("fill", "currentColor")
        .attr("paint-order", "stroke")
        .text((d, i) => `${d.toFixed(0)}${i === 0 ? "°C" : ""}`)
        .clone(true)
        .attr("y", d => y(d)));

  }, [data, year]);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold text-center mb-4">
        {year} - {cityName}
      </h2>

      {/* Inputs */}
      <div className="flex flex-col md:flex-row gap-4 justify-center mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">City Name</label>
          <input
            type="text"
            value={cityName}
            onChange={e => setCityName(e.target.value)}
            className="border px-3 py-2 rounded w-48"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Year</label>
          <input
            type="number"
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="border px-3 py-2 rounded w-28"
          />
        </div>
      </div>

      {error && <div className="text-red-500 text-center mb-4">{error}</div>}
      {loading && <div className="text-center text-gray-600 mb-4">Loading...</div>}

      {/* Chart */}
      <div className="overflow-auto w-full h-[600px] border rouded">
        <div className="min-w-[800px] min-h-[800px] relative">
          <svg ref={ref} className="absolute top-0 left-0 w-full h-full" />
        </div>
      </div>
    </div>
  );
};

export default RadialAreaChart;
