import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import * as THREE from "three";

// ─── THEMES ──────────────────────────────────────────────────────────────────
const UI_THEMES = {
  Light: {
    bg: "#ffffff",
    chartBg: "#f8fafc",
    text: "#0f172a",
    subtext: "#64748b",
    grid: "#e2e8f0",
    card: "#ffffff",
    border: "#cbd5e1",
    watermark: "rgba(100, 116, 139, 0.12)",
    threeBg: 0xf8fafc,
  },
  Dark: {
    bg: "#0b0f19",
    chartBg: "#111827",
    text: "#f8fafc",
    subtext: "#94a3b8",
    grid: "#1f2937",
    card: "#182234",
    border: "#374151",
    watermark: "rgba(255, 255, 255, 0.08)",
    threeBg: 0x0b0f19,
  },
};

const REGIONS = ["Asia", "Europe", "Africa", "Americas", "Oceania"];

const PALETTES = {
  Gapminder: {
    Asia: "#00d2d3",
    Europe: "#ff9f43",
    Africa: "#10ac84",
    Americas: "#ee5253",
    Oceania: "#5f27cd",
  },
  Modern: {
    Asia: "#3b82f6",
    Europe: "#f59e0b",
    Africa: "#10b981",
    Americas: "#ef4444",
    Oceania: "#8b5cf6",
  },
  Neon: {
    Asia: "#00f5ff",
    Europe: "#ffe600",
    Africa: "#39ff14",
    Americas: "#ff007f",
    Oceania: "#b537f2",
  },
  Pastel: {
    Asia: "#93c5fd",
    Europe: "#fde68a",
    Africa: "#86efac",
    Americas: "#fca5a5",
    Oceania: "#c4b5fd",
  },
};

// ─── GAPMINDER GLOBAL DATASET (1800 - 2024) ──────────────────────────────────
// Representative historical trajectory across 22 nations worldwide
const NATIONS_DATA = [
  {
    name: "China",
    region: "Asia",
    timeline: [
      { year: 1800, income: 980, lifeExp: 32.0, pop: 330 },
      { year: 1850, income: 990, lifeExp: 32.0, pop: 410 },
      { year: 1900, income: 960, lifeExp: 32.0, pop: 400 },
      { year: 1950, income: 640, lifeExp: 43.5, pop: 544 },
      { year: 1960, income: 850, lifeExp: 36.3, pop: 654 },
      { year: 1970, income: 1150, lifeExp: 63.2, pop: 818 },
      { year: 1980, income: 1520, lifeExp: 67.0, pop: 981 },
      { year: 1990, income: 2420, lifeExp: 69.3, pop: 1153 },
      { year: 2000, income: 4700, lifeExp: 71.9, pop: 1264 },
      { year: 2010, income: 11200, lifeExp: 75.3, pop: 1337 },
      { year: 2024, income: 21500, lifeExp: 78.2, pop: 1410 },
    ],
  },
  {
    name: "India",
    region: "Asia",
    timeline: [
      { year: 1800, income: 1050, lifeExp: 25.4, pop: 190 },
      { year: 1850, income: 1060, lifeExp: 25.4, pop: 220 },
      { year: 1900, income: 1100, lifeExp: 23.8, pop: 240 },
      { year: 1950, income: 1130, lifeExp: 36.8, pop: 376 },
      { year: 1970, income: 1530, lifeExp: 48.8, pop: 555 },
      { year: 1980, income: 1780, lifeExp: 54.2, pop: 698 },
      { year: 1990, income: 2400, lifeExp: 59.2, pop: 873 },
      { year: 2000, income: 3600, lifeExp: 63.1, pop: 1056 },
      { year: 2010, income: 5900, lifeExp: 66.9, pop: 1234 },
      { year: 2024, income: 9800, lifeExp: 71.5, pop: 1430 },
    ],
  },
  {
    name: "United States",
    region: "Americas",
    timeline: [
      { year: 1800, income: 2120, lifeExp: 39.4, pop: 6 },
      { year: 1850, income: 3400, lifeExp: 39.5, pop: 23 },
      { year: 1900, income: 6900, lifeExp: 48.5, pop: 76 },
      { year: 1950, income: 15300, lifeExp: 68.2, pop: 152 },
      { year: 1970, income: 24000, lifeExp: 70.8, pop: 205 },
      { year: 1980, income: 29500, lifeExp: 73.7, pop: 227 },
      { year: 1990, income: 37000, lifeExp: 75.3, pop: 249 },
      { year: 2000, income: 46000, lifeExp: 76.8, pop: 282 },
      { year: 2010, income: 51700, lifeExp: 78.5, pop: 309 },
      { year: 2024, income: 72000, lifeExp: 79.2, pop: 340 },
    ],
  },
  {
    name: "Japan",
    region: "Asia",
    timeline: [
      { year: 1800, income: 1050, lifeExp: 36.4, pop: 31 },
      { year: 1850, income: 1100, lifeExp: 36.4, pop: 32 },
      { year: 1900, income: 1650, lifeExp: 38.6, pop: 44 },
      { year: 1950, income: 3400, lifeExp: 60.5, pop: 83 },
      { year: 1970, income: 17200, lifeExp: 72.0, pop: 104 },
      { year: 1980, income: 24500, lifeExp: 76.1, pop: 116 },
      { year: 1990, income: 34200, lifeExp: 78.9, pop: 123 },
      { year: 2000, income: 37800, lifeExp: 81.1, pop: 126 },
      { year: 2010, income: 39500, lifeExp: 82.9, pop: 128 },
      { year: 2024, income: 45000, lifeExp: 84.8, pop: 124 },
    ],
  },
  {
    name: "United Kingdom",
    region: "Europe",
    timeline: [
      { year: 1800, income: 3430, lifeExp: 38.6, pop: 10 },
      { year: 1850, income: 4800, lifeExp: 40.2, pop: 21 },
      { year: 1900, income: 8100, lifeExp: 47.3, pop: 38 },
      { year: 1950, income: 12500, lifeExp: 69.2, pop: 50 },
      { year: 1970, income: 18500, lifeExp: 71.9, pop: 55 },
      { year: 1990, income: 27500, lifeExp: 75.8, pop: 57 },
      { year: 2000, income: 34800, lifeExp: 77.9, pop: 59 },
      { year: 2010, income: 38200, lifeExp: 80.2, pop: 63 },
      { year: 2024, income: 49500, lifeExp: 81.8, pop: 68 },
    ],
  },
  {
    name: "Germany",
    region: "Europe",
    timeline: [
      { year: 1800, income: 1640, lifeExp: 38.4, pop: 18 },
      { year: 1850, income: 2400, lifeExp: 38.5, pop: 24 },
      { year: 1900, income: 5400, lifeExp: 45.3, pop: 56 },
      { year: 1950, income: 8500, lifeExp: 67.5, pop: 69 },
      { year: 1970, income: 20500, lifeExp: 70.6, pop: 78 },
      { year: 1990, income: 31800, lifeExp: 75.4, pop: 79 },
      { year: 2000, income: 37500, lifeExp: 78.1, pop: 82 },
      { year: 2010, income: 43200, lifeExp: 80.3, pop: 81 },
      { year: 2024, income: 56000, lifeExp: 81.6, pop: 84 },
    ],
  },
  {
    name: "Brazil",
    region: "Americas",
    timeline: [
      { year: 1800, income: 1100, lifeExp: 32.0, pop: 4 },
      { year: 1850, income: 1200, lifeExp: 32.0, pop: 7 },
      { year: 1900, income: 1300, lifeExp: 32.0, pop: 18 },
      { year: 1950, income: 3100, lifeExp: 50.8, pop: 54 },
      { year: 1970, income: 6400, lifeExp: 59.5, pop: 95 },
      { year: 1980, income: 10400, lifeExp: 62.6, pop: 121 },
      { year: 1990, income: 9800, lifeExp: 66.3, pop: 149 },
      { year: 2000, income: 11200, lifeExp: 70.2, pop: 175 },
      { year: 2010, income: 14500, lifeExp: 73.3, pop: 195 },
      { year: 2024, income: 17800, lifeExp: 76.4, pop: 217 },
    ],
  },
  {
    name: "Nigeria",
    region: "Africa",
    timeline: [
      { year: 1800, income: 830, lifeExp: 30.4, pop: 12 },
      { year: 1900, income: 910, lifeExp: 30.4, pop: 17 },
      { year: 1950, income: 1600, lifeExp: 35.6, pop: 38 },
      { year: 1970, income: 2700, lifeExp: 42.1, pop: 56 },
      { year: 1980, income: 3900, lifeExp: 45.8, pop: 73 },
      { year: 1990, income: 2800, lifeExp: 46.1, pop: 95 },
      { year: 2000, income: 3200, lifeExp: 46.6, pop: 122 },
      { year: 2010, income: 5100, lifeExp: 50.9, pop: 158 },
      { year: 2024, income: 6200, lifeExp: 55.4, pop: 224 },
    ],
  },
  {
    name: "Egypt",
    region: "Africa",
    timeline: [
      { year: 1800, income: 790, lifeExp: 33.0, pop: 4 },
      { year: 1900, income: 1400, lifeExp: 33.0, pop: 10 },
      { year: 1950, income: 2100, lifeExp: 42.8, pop: 21 },
      { year: 1970, income: 3100, lifeExp: 52.2, pop: 35 },
      { year: 1990, income: 6100, lifeExp: 64.6, pop: 57 },
      { year: 2000, income: 8200, lifeExp: 68.6, pop: 69 },
      { year: 2010, income: 11000, lifeExp: 70.3, pop: 84 },
      { year: 2024, income: 14800, lifeExp: 72.8, pop: 112 },
    ],
  },
  {
    name: "South Africa",
    region: "Africa",
    timeline: [
      { year: 1800, income: 1400, lifeExp: 33.5, pop: 1.5 },
      { year: 1900, income: 3100, lifeExp: 33.5, pop: 5 },
      { year: 1950, income: 6100, lifeExp: 45.2, pop: 13 },
      { year: 1970, income: 9400, lifeExp: 53.4, pop: 22 },
      { year: 1990, income: 9700, lifeExp: 62.1, pop: 36 },
      { year: 2000, income: 10200, lifeExp: 56.2, pop: 45 },
      { year: 2010, income: 12500, lifeExp: 57.4, pop: 51 },
      { year: 2024, income: 15400, lifeExp: 65.1, pop: 60 },
    ],
  },
  {
    name: "Australia",
    region: "Oceania",
    timeline: [
      { year: 1800, income: 800, lifeExp: 34.0, pop: 0.3 },
      { year: 1850, income: 4200, lifeExp: 44.0, pop: 0.4 },
      { year: 1900, income: 7500, lifeExp: 51.5, pop: 3.7 },
      { year: 1950, income: 13200, lifeExp: 69.1, pop: 8.2 },
      { year: 1970, income: 20500, lifeExp: 71.3, pop: 12.7 },
      { year: 1990, income: 28400, lifeExp: 76.9, pop: 17 },
      { year: 2000, income: 37500, lifeExp: 79.7, pop: 19 },
      { year: 2010, income: 45000, lifeExp: 81.9, pop: 22 },
      { year: 2024, income: 55000, lifeExp: 83.9, pop: 26 },
    ],
  },
  {
    name: "Indonesia",
    region: "Asia",
    timeline: [
      { year: 1800, income: 990, lifeExp: 31.0, pop: 16 },
      { year: 1900, income: 1150, lifeExp: 31.0, pop: 40 },
      { year: 1950, income: 1350, lifeExp: 37.5, pop: 79 },
      { year: 1970, income: 2100, lifeExp: 49.3, pop: 119 },
      { year: 1990, income: 4600, lifeExp: 62.4, pop: 181 },
      { year: 2000, income: 5800, lifeExp: 66.3, pop: 211 },
      { year: 2010, income: 9200, lifeExp: 69.2, pop: 242 },
      { year: 2024, income: 14500, lifeExp: 72.4, pop: 278 },
    ],
  },
  {
    name: "France",
    region: "Europe",
    timeline: [
      { year: 1800, income: 2300, lifeExp: 34.0, pop: 29 },
      { year: 1850, income: 3200, lifeExp: 39.5, pop: 36 },
      { year: 1900, income: 5600, lifeExp: 46.8, pop: 40 },
      { year: 1950, income: 9800, lifeExp: 66.5, pop: 41 },
      { year: 1970, income: 21500, lifeExp: 72.1, pop: 51 },
      { year: 1990, income: 30500, lifeExp: 76.9, pop: 57 },
      { year: 2000, income: 36800, lifeExp: 79.1, pop: 59 },
      { year: 2010, income: 39900, lifeExp: 81.7, pop: 63 },
      { year: 2024, income: 50500, lifeExp: 83.1, pop: 68 },
    ],
  },
  {
    name: "South Korea",
    region: "Asia",
    timeline: [
      { year: 1800, income: 850, lifeExp: 26.0, pop: 9 },
      { year: 1900, income: 950, lifeExp: 27.5, pop: 12 },
      { year: 1950, income: 1200, lifeExp: 28.2, pop: 19 },
      { year: 1970, income: 3400, lifeExp: 61.3, pop: 32 },
      { year: 1980, income: 6800, lifeExp: 66.1, pop: 38 },
      { year: 1990, income: 15400, lifeExp: 71.7, pop: 43 },
      { year: 2000, income: 24500, lifeExp: 76.0, pop: 47 },
      { year: 2010, income: 35000, lifeExp: 80.2, pop: 49 },
      { year: 2024, income: 48000, lifeExp: 83.6, pop: 52 },
    ],
  },
  {
    name: "Mexico",
    region: "Americas",
    timeline: [
      { year: 1800, income: 1370, lifeExp: 29.5, pop: 6 },
      { year: 1900, income: 2200, lifeExp: 29.5, pop: 13 },
      { year: 1950, income: 4800, lifeExp: 50.7, pop: 28 },
      { year: 1970, income: 9200, lifeExp: 61.3, pop: 52 },
      { year: 1990, income: 12500, lifeExp: 71.0, pop: 85 },
      { year: 2000, income: 15400, lifeExp: 74.0, pop: 101 },
      { year: 2010, income: 17200, lifeExp: 75.1, pop: 114 },
      { year: 2024, income: 21500, lifeExp: 75.8, pop: 130 },
    ],
  },
];

// Linear interpolation between milestone years
function interpolateData(year) {
  return NATIONS_DATA.map((nation) => {
    const tl = nation.timeline;
    if (year <= tl[0].year) {
      return { name: nation.name, region: nation.region, ...tl[0] };
    }
    if (year >= tl[tl.length - 1].year) {
      return { name: nation.name, region: nation.region, ...tl[tl.length - 1] };
    }
    const idx = tl.findIndex((d) => d.year >= year);
    const a = tl[idx - 1];
    const b = tl[idx];
    const t = (year - a.year) / (b.year - a.year);
    return {
      name: nation.name,
      region: nation.region,
      income: Math.round(a.income + t * (b.income - a.income)),
      lifeExp: +(a.lifeExp + t * (b.lifeExp - a.lifeExp)).toFixed(1),
      pop: +(a.pop + t * (b.pop - a.pop)).toFixed(1),
    };
  });
}

// ─── STATS PANEL ─────────────────────────────────────────────────────────────
function StatsPanel({ data, year, theme, palette, selectedNation, setSelectedNation }) {
  const T = UI_THEMES[theme];

  const highestLife = useMemo(() => d3.greatest(data, (d) => d.lifeExp), [data]);
  const highestIncome = useMemo(() => d3.greatest(data, (d) => d.income), [data]);
  const mostPopulous = useMemo(() => d3.greatest(data, (d) => d.pop), [data]);
  const avgLife = useMemo(() => d3.mean(data, (d) => d.lifeExp)?.toFixed(1), [data]);
  const avgIncome = useMemo(() => Math.round(d3.mean(data, (d) => d.income) || 0), [data]);
  const totalPop = useMemo(() => d3.sum(data, (d) => d.pop)?.toFixed(0), [data]);

  const card = (label, value, sub, col) => (
    <div
      style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: 8,
        padding: "10px 12px",
        marginBottom: 8,
        borderLeft: `3.5px solid ${col}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ fontSize: 10, color: T.subtext, fontWeight: 700, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 800, color: col, marginTop: 2, whiteSpace: "nowrap" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.subtext, marginTop: 2 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ width: 220, flexShrink: 0 }}>
      <div style={{ fontSize: 11, fontWeight: "bold", color: T.subtext, letterSpacing: "0.08em", marginBottom: 8 }}>
        YEAR {year} GLOBAL METRICS
      </div>

      {card("🥇 Longest Life Exp", `${highestLife?.lifeExp} yrs`, highestLife?.name, palette[highestLife?.region] || "#10b981")}
      {card("💰 Highest Income", `$${d3.format(",")(highestIncome?.income)}`, highestIncome?.name, palette[highestIncome?.region] || "#f59e0b")}
      {card("👥 Most Populous", `${mostPopulous?.pop}M`, mostPopulous?.name, palette[mostPopulous?.region] || "#3b82f6")}
      {card("📊 World Avg Life", `${avgLife} yrs`, "Population weighted", "#06b6d4")}
      {card("📈 World Avg Income", `$${d3.format(",")(avgIncome)}`, "Per capita GDP", "#8b5cf6")}
      {card("🌐 Sample Population", `${d3.format(",")(totalPop)}M`, "Across 15 key nations", "#ec4899")}

      {/* Region Legend */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px", marginTop: 6 }}>
        <div style={{ fontSize: 10, color: T.subtext, fontWeight: 700, marginBottom: 8, textTransform: "uppercase" }}>
          World Regions
        </div>
        {REGIONS.map((r) => (
          <div key={r} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: palette[r] }} />
            <span style={{ fontSize: 11, color: T.text, fontWeight: "600" }}>{r}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 2D GAPMINDER BUBBLE CHART (D3) ──────────────────────────────────────────
function Chart2D({ theme, palette, year, selectedNation, setSelectedNation, regionFilter }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const T = UI_THEMES[theme];

  const currentData = useMemo(() => {
    const all = interpolateData(year);
    if (regionFilter === "All") return all;
    return all.filter((d) => d.region === regionFilter);
  }, [year, regionFilter]);

  useEffect(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth || 740;
    const height = 520;
    const margin = { top: 35, right: 35, bottom: 55, left: 65 };

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .attr("width", "100%")
      .attr("height", height)
      .style("background", T.chartBg)
      .style("border-radius", "8px")
      .style("font-family", "system-ui, -apple-system, sans-serif");

    // Scales
    // Logarithmic scale for Income: $400 to $120,000
    const xScale = d3
      .scaleLog()
      .domain([400, 100000])
      .range([margin.left, width - margin.right]);

    // Linear scale for Life Expectancy: 20 to 88 years
    const yScale = d3
      .scaleLinear()
      .domain([20, 88])
      .range([height - margin.bottom, margin.top]);

    // Square root scale for population radius
    const rScale = d3.scaleSqrt().domain([0, 1500]).range([4, 38]);

    // Background Watermark Year
    svg
      .append("text")
      .attr("x", width - margin.right - 20)
      .attr("y", height - margin.bottom - 20)
      .attr("text-anchor", "end")
      .attr("font-size", "110px")
      .attr("font-weight", "900")
      .attr("fill", T.watermark)
      .style("user-select", "none")
      .text(year);

    // Gridlines
    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(
        d3
          .axisBottom(xScale)
          .tickValues([500, 1000, 2000, 5000, 10000, 20000, 50000, 100000])
          .tickSize(-(height - margin.top - margin.bottom))
          .tickFormat("")
      )
      .call((g) => {
        g.select(".domain").remove();
        g.selectAll("line").style("stroke", T.grid).style("stroke-dasharray", "3,3");
      });

    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(
        d3
          .axisLeft(yScale)
          .ticks(8)
          .tickSize(-(width - margin.left - margin.right))
          .tickFormat("")
      )
      .call((g) => {
        g.select(".domain").remove();
        g.selectAll("line").style("stroke", T.grid).style("stroke-dasharray", "3,3");
      });

    // Axes
    const xAxis = d3
      .axisBottom(xScale)
      .tickValues([500, 1000, 2000, 5000, 10000, 20000, 50000, 100000])
      .tickFormat((d) => (d >= 1000 ? `$${d / 1000}k` : `$${d}`));

    const yAxis = d3.axisLeft(yScale).ticks(8);

    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(xAxis)
      .call((g) => {
        g.select(".domain").style("stroke", T.border);
        g.selectAll("line").style("stroke", T.border);
        g.selectAll("text").style("fill", T.text).style("font-size", "11px");
      });

    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(yAxis)
      .call((g) => {
        g.select(".domain").style("stroke", T.border);
        g.selectAll("line").style("stroke", T.border);
        g.selectAll("text").style("fill", T.text).style("font-size", "11px");
      });

    // Labels with arrows
    svg
      .append("text")
      .attr("x", (width + margin.left) / 2)
      .attr("y", height - 14)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "600")
      .style("fill", T.text)
      .text("Income Per Person (GDP / Capita, PPP$ inflation-adjusted log scale) →");

    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 22)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "600")
      .style("fill", T.text)
      .text("↑ Life Expectancy (Years)");

    // Historical trail for selected nation
    if (selectedNation) {
      const nat = NATIONS_DATA.find((n) => n.name === selectedNation);
      if (nat) {
        const trailPoints = nat.timeline.filter((t) => t.year <= year);
        const trailLine = d3
          .line()
          .x((d) => xScale(d.income))
          .y((d) => yScale(d.lifeExp))
          .curve(d3.curveCatmullRom);

        svg
          .append("path")
          .datum(trailPoints)
          .attr("fill", "none")
          .attr("stroke", palette[nat.region] || "#3b82f6")
          .attr("stroke-width", 2.5)
          .attr("stroke-dasharray", "3,3")
          .attr("d", trailLine);
      }
    }

    // Tooltip
    const tooltip = d3
      .select(containerRef.current)
      .selectAll(".wh-tooltip")
      .data([null])
      .join("div")
      .attr("class", "wh-tooltip")
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("background", theme === "Dark" ? "rgba(17,24,39,0.95)" : "rgba(255,255,255,0.98)")
      .style("color", T.text)
      .style("padding", "9px 13px")
      .style("border-radius", "6px")
      .style("border", `1px solid ${T.border}`)
      .style("box-shadow", "0 4px 12px rgba(0,0,0,0.15)")
      .style("font-size", "12px")
      .style("z-index", "50");

    // Bubbles (sorted so smaller bubbles are on top)
    const sortedData = [...currentData].sort((a, b) => b.pop - a.pop);

    const bubbleG = svg.append("g");
    const bubbles = bubbleG
      .selectAll("circle")
      .data(sortedData, (d) => d.name)
      .join("circle")
      .attr("cx", (d) => xScale(d.income))
      .attr("cy", (d) => yScale(d.lifeExp))
      .attr("r", (d) => rScale(d.pop))
      .attr("fill", (d) => palette[d.region] || "#3b82f6")
      .attr("fill-opacity", (d) => (selectedNation && selectedNation !== d.name ? 0.25 : 0.8))
      .attr("stroke", "#ffffff")
      .attr("stroke-width", (d) => (selectedNation === d.name ? 2.5 : 1.2))
      .style("cursor", "pointer");

    // ─── Country text labels with values & collision deconfliction ───
    const labeledNations = sortedData.filter((d) => d.pop > 100 || selectedNation === d.name);

    // Compute collision-free placements for each badge
    const placedBoxes = [];
    const labelItems = labeledNations.map((d) => {
      const cx = xScale(d.income);
      const cy = yScale(d.lifeExp);
      const r = rScale(d.pop);
      const valStr = `$${d.income >= 1000 ? (d.income / 1000).toFixed(1) + "k" : d.income} · ${d.lifeExp}y`;
      const badgeW = Math.max(88, d.name.length * 6.5 + valStr.length * 5.8 + 18);
      const badgeH = 21;

      // Candidate anchor positions relative to bubble
      const candidates = [
        { lx: cx, ly: cy - r - 13, leader: false }, // top
        { lx: cx, ly: cy + r + 13, leader: true },  // bottom
        { lx: cx + r + badgeW / 2 + 5, ly: cy, leader: true }, // right
        { lx: cx - r - badgeW / 2 - 5, ly: cy, leader: true }, // left
        { lx: cx + r * 0.7 + badgeW / 2 + 3, ly: cy - r * 0.7 - 9, leader: true }, // top-right
        { lx: cx - r * 0.7 - badgeW / 2 - 3, ly: cy - r * 0.7 - 9, leader: true }, // top-left
      ];

      // Pick candidate with minimum overlap against already placed boxes
      let bestPos = candidates[0];
      let minOverlap = Infinity;

      for (const cand of candidates) {
        // Clamp to chart boundaries
        const clampedX = Math.max(margin.left + badgeW / 2 + 4, Math.min(width - margin.right - badgeW / 2 - 4, cand.lx));
        const clampedY = Math.max(margin.top + badgeH / 2 + 4, Math.min(height - margin.bottom - badgeH / 2 - 4, cand.ly));

        let overlapCount = 0;
        const halfW = badgeW / 2 + 5;
        const halfH = badgeH / 2 + 3;

        for (const pb of placedBoxes) {
          if (
            Math.abs(clampedX - pb.x) < halfW + pb.w / 2 &&
            Math.abs(clampedY - pb.y) < halfH + pb.h / 2
          ) {
            overlapCount += 1;
          }
        }

        if (overlapCount < minOverlap) {
          minOverlap = overlapCount;
          bestPos = { lx: clampedX, ly: clampedY, leader: cand.leader };
          if (overlapCount === 0) break;
        }
      }

      // If still overlapping with existing placed boxes, shift vertically
      for (const pb of placedBoxes) {
        if (
          Math.abs(bestPos.lx - pb.x) < (badgeW + pb.w) / 2 + 4 &&
          Math.abs(bestPos.ly - pb.y) < (badgeH + pb.h) / 2 + 3
        ) {
          const shift = (badgeH + pb.h) / 2 + 4 - Math.abs(bestPos.ly - pb.y);
          if (bestPos.ly >= pb.y) {
            bestPos.ly = Math.min(height - margin.bottom - badgeH / 2 - 4, bestPos.ly + shift);
          } else {
            bestPos.ly = Math.max(margin.top + badgeH / 2 + 4, bestPos.ly - shift);
          }
          bestPos.leader = true;
        }
      }

      placedBoxes.push({ x: bestPos.lx, y: bestPos.ly, w: badgeW, h: badgeH });

      return {
        d,
        cx,
        cy,
        r,
        valStr,
        badgeW,
        badgeH,
        lx: bestPos.lx,
        ly: bestPos.ly,
        needsLeader: Math.hypot(bestPos.lx - cx, bestPos.ly - (cy - r - 13)) > 12,
      };
    });

    const labelsG = svg.append("g").attr("class", "c-labels-layer").style("pointer-events", "none");

    // Optional leader lines for offset badges
    labelItems.forEach((item) => {
      if (item.needsLeader) {
        labelsG
          .append("line")
          .attr("x1", item.cx)
          .attr("y1", item.ly > item.cy ? item.cy + item.r : item.cy - item.r)
          .attr("x2", item.lx)
          .attr("y2", item.ly > item.cy ? item.ly - item.badgeH / 2 : item.ly + item.badgeH / 2)
          .attr("stroke", palette[item.d.region] || "#3b82f6")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "2,2")
          .attr("stroke-opacity", 0.6);
      }
    });

    // Pill Badges for Country Name + Value
    const labelGroups = labelsG
      .selectAll("g.c-label-group")
      .data(labelItems, (item) => item.d.name)
      .join("g")
      .attr("class", "c-label-group")
      .attr("transform", (item) => `translate(${item.lx},${item.ly})`);

    labelGroups
      .append("rect")
      .attr("x", (item) => -item.badgeW / 2)
      .attr("y", (item) => -item.badgeH / 2)
      .attr("width", (item) => item.badgeW)
      .attr("height", (item) => item.badgeH)
      .attr("rx", 5)
      .attr("ry", 5)
      .attr("fill", theme === "Dark" ? "rgba(15, 23, 42, 0.92)" : "rgba(255, 255, 255, 0.95)")
      .attr("stroke", (item) => palette[item.d.region] || "#3b82f6")
      .attr("stroke-width", (item) => (selectedNation === item.d.name ? 2.2 : 1.2))
      .attr("filter", "drop-shadow(0px 1px 2px rgba(0,0,0,0.15))");

    labelGroups
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("font-size", "10.5px")
      .call((text) => {
        text
          .append("tspan")
          .attr("font-weight", "800")
          .attr("fill", (item) => palette[item.d.region] || "#3b82f6")
          .text((item) => item.d.name);
        text
          .append("tspan")
          .attr("font-weight", "600")
          .attr("fill", theme === "Dark" ? "#cbd5e1" : "#475569")
          .text((item) => ` ${item.valStr}`);
      });

    // Mouse Interaction
    bubbles
      .on("mouseover", function (event, d) {
        d3.select(this).attr("fill-opacity", 1).attr("stroke", palette[d.region]);
        tooltip
          .style("opacity", 1)
          .html(
            `<div style="font-weight:700;color:${palette[d.region]};font-size:13px;margin-bottom:3px">${d.name} (${d.region})</div>` +
            `❤️ Life Expectancy: <b>${d.lifeExp} yrs</b><br/>` +
            `💵 Income per Capita: <b>$${d3.format(",")(d.income)}</b><br/>` +
            `👥 Population: <b>${d.pop} Million</b><br/>` +
            `<span style="font-size:10px;color:${T.subtext}">Click to trace trajectory</span>`
          )
          .style("left", `${event.offsetX + 16}px`)
          .style("top", `${event.offsetY - 16}px`);
      })
      .on("mousemove", function (event) {
        tooltip.style("left", `${event.offsetX + 16}px`).style("top", `${event.offsetY - 16}px`);
      })
      .on("mouseout", function (event, d) {
        d3.select(this)
          .attr("fill-opacity", selectedNation && selectedNation !== d.name ? 0.25 : 0.8)
          .attr("stroke", "#ffffff");
        tooltip.style("opacity", 0);
      })
      .on("click", function (event, d) {
        setSelectedNation((prev) => (prev === d.name ? null : d.name));
      });

  }, [theme, palette, year, selectedNation, regionFilter]);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
      <svg ref={svgRef}></svg>
    </div>
  );
}

// ─── 3D GAPMINDER SPHERES (THREE.JS) ─────────────────────────────────────────
function Chart3D({ theme, palette, year }) {
  const mountRef = useRef(null);
  const T = UI_THEMES[theme];

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);

    let animId, renderer;
    const W = el.clientWidth || 740;
    const H = 520;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(T.threeBg);

    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000);
    camera.position.set(0, 8, 30);
    camera.lookAt(0, 1, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    el.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(15, 25, 18);
    sun.castShadow = true;
    scene.add(sun);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 0.45));

    // Floor & 3D Grid
    const floorGeo = new THREE.PlaneGeometry(36, 36);
    const floorMat = new THREE.MeshStandardMaterial({
      color: theme === "Dark" ? 0x111827 : 0xf1f5f9,
      roughness: 0.9,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -8;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(36, 18, theme === "Dark" ? 0x374151 : 0xcbd5e1, theme === "Dark" ? 0x1f2937 : 0xe2e8f0);
    grid.position.y = -7.95;
    scene.add(grid);

    const pivot = new THREE.Group();
    scene.add(pivot);

    // 3D Scales: X = Log Income, Y = Life Exp, Z = Region index
    const data = interpolateData(year);
    const xScale = d3.scaleLog().domain([400, 100000]).range([-10, 10]);
    const yScale = d3.scaleLinear().domain([20, 88]).range([-6, 8]);
    const rScale = d3.scaleSqrt().domain([0, 1500]).range([0.25, 1.6]);
    const regionZ = { Asia: -5, Europe: -2.5, Africa: 0, Americas: 2.5, Oceania: 5 };

    data.forEach((d) => {
      const colHex = palette[d.region] || "#3b82f6";
      const rad = rScale(d.pop);
      const sphereGeo = new THREE.SphereGeometry(rad, 24, 24);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(colHex),
        roughness: 0.25,
        metalness: 0.45,
        emissive: new THREE.Color(colHex),
        emissiveIntensity: 0.35,
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      const zPos = regionZ[d.region] || 0;
      sphere.position.set(xScale(d.income), yScale(d.lifeExp), zPos);
      sphere.castShadow = true;
      pivot.add(sphere);

      // ─── 3D Country Name + Value Badge Sprite ───
      if (d.pop > 100 || d.name === "China" || d.name === "United States" || d.name === "India") {
        const valStr = `$${d.income >= 1000 ? (d.income / 1000).toFixed(1) + "k" : d.income} · ${d.lifeExp}y`;
        const c = document.createElement("canvas");
        c.width = 300;
        c.height = 64;
        const cx = c.getContext("2d");
        cx.fillStyle = theme === "Dark" ? "rgba(15, 23, 42, 0.94)" : "rgba(255, 255, 255, 0.96)";
        cx.beginPath();
        cx.roundRect(3, 3, 294, 58, 10);
        cx.fill();
        cx.strokeStyle = colHex;
        cx.lineWidth = 3;
        cx.stroke();

        cx.font = "bold 20px system-ui, -apple-system, sans-serif";
        cx.fillStyle = colHex;
        cx.textAlign = "center";
        cx.textBaseline = "middle";
        cx.fillText(`${d.name}: ${valStr}`, 150, 32);

        const tex = new THREE.CanvasTexture(c);
        tex.minFilter = THREE.LinearFilter;
        const spMat = new THREE.SpriteMaterial({ map: tex, transparent: true });
        const sp = new THREE.Sprite(spMat);
        sp.scale.set(3.2, 0.72, 1);
        sp.position.set(xScale(d.income), yScale(d.lifeExp) + rad + 0.65, zPos);
        pivot.add(sp);
      }

      // Floor stem
      const stemGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(xScale(d.income), yScale(d.lifeExp), zPos),
        new THREE.Vector3(xScale(d.income), -7.95, zPos),
      ]);
      const stemMat = new THREE.LineBasicMaterial({
        color: theme === "Dark" ? 0x374151 : 0xcbd5e1,
        transparent: true,
        opacity: 0.3,
      });
      const stem = new THREE.Line(stemGeo, stemMat);
      pivot.add(stem);
    });

    // ─── 3D Year Display Banner ───
    const yCan = document.createElement("canvas");
    yCan.width = 240;
    yCan.height = 70;
    const yCtx = yCan.getContext("2d");
    yCtx.fillStyle = theme === "Dark" ? "rgba(15, 23, 42, 0.94)" : "rgba(255, 255, 255, 0.94)";
    yCtx.beginPath();
    yCtx.roundRect(4, 4, 232, 62, 12);
    yCtx.fill();
    yCtx.strokeStyle = palette.Asia || "#3b82f6";
    yCtx.lineWidth = 3;
    yCtx.stroke();
    yCtx.font = "bold 36px system-ui, -apple-system, sans-serif";
    yCtx.fillStyle = palette.Asia || "#3b82f6";
    yCtx.textAlign = "center";
    yCtx.textBaseline = "middle";
    yCtx.fillText(`YEAR: ${year}`, 120, 35);

    const yTex = new THREE.CanvasTexture(yCan);
    yTex.minFilter = THREE.LinearFilter;
    const ySp = new THREE.Sprite(new THREE.SpriteMaterial({ map: yTex, transparent: true }));
    ySp.scale.set(3.2, 0.9, 1);
    ySp.position.set(0, 9.2, 0);
    pivot.add(ySp);

    // Orbit Controls
    let isDragging = false, prevX = 0, prevY = 0;
    let rotX = 0.2, rotY = 0.4, autoSpin = true;
    pivot.rotation.x = rotX;
    pivot.rotation.y = rotY;

    const onDown = (e) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
      autoSpin = false;
      renderer.domElement.style.cursor = "grabbing";
    };
    const onUp = () => {
      isDragging = false;
      renderer.domElement.style.cursor = "grab";
    };
    const onMove = (e) => {
      if (!isDragging) return;
      rotY += (e.clientX - prevX) * 0.006;
      rotX = Math.max(-0.6, Math.min(0.8, rotX + (e.clientY - prevY) * 0.004));
      prevX = e.clientX;
      prevY = e.clientY;
    };

    renderer.domElement.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("mousemove", onMove);
    renderer.domElement.style.cursor = "grab";

    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (autoSpin) rotY += 0.003;
      pivot.rotation.y = rotY;
      pivot.rotation.x = rotX;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      renderer.domElement.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("mousemove", onMove);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [theme, palette, year]);

  return (
    <div style={{ position: "relative", width: "100%", border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
      <div ref={mountRef} style={{ width: "100%", height: 520 }} />
      <div
        style={{
          position: "absolute",
          bottom: 10,
          left: 12,
          background: theme === "Dark" ? "rgba(17,24,39,0.85)" : "rgba(255,255,255,0.85)",
          backdropFilter: "blur(4px)",
          padding: "5px 10px",
          borderRadius: 6,
          fontSize: 11,
          color: T.subtext,
          border: `1px solid ${T.border}`,
        }}
      >
        💡 Drag to rotate in 3D · X=Log Income · Y=Life Expectancy · Z=Continent · Size=Population
      </div>
    </div>
  );
}

// ─── MAIN WEALTH & HEALTH COMPONENT ──────────────────────────────────────────
export default function WealthHealthChart() {
  const [viewMode, setViewMode] = useState("2d");
  const [theme, setTheme] = useState("Light");
  const [colorTheme, setColorTheme] = useState("Gapminder");
  const [year, setYear] = useState(1970);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [regionFilter, setRegionFilter] = useState("All");
  const [selectedNation, setSelectedNation] = useState(null);

  const T = UI_THEMES[theme];
  const palette = PALETTES[colorTheme] || PALETTES.Gapminder;
  const currentData = useMemo(() => interpolateData(year), [year]);

  // Animation Loop
  useEffect(() => {
    let timer;
    if (isPlaying) {
      const step = speed === 0.5 ? 1 : speed === 2 ? 3 : 2;
      timer = setInterval(() => {
        setYear((prev) => {
          if (prev >= 2024) {
            setIsPlaying(false);
            return 2024;
          }
          return Math.min(2024, prev + step);
        });
      }, 150);
    }
    return () => clearInterval(timer);
  }, [isPlaying, speed]);

  const ddStyle = {
    padding: "6px 12px",
    borderRadius: 6,
    border: `1px solid ${T.border}`,
    background: theme === "Dark" ? "#1f2937" : "#ffffff",
    color: T.text,
    fontWeight: "600",
    fontSize: 12,
    cursor: "pointer",
    outline: "none",
  };

  const btnStyle = {
    padding: "6px 14px",
    borderRadius: 6,
    border: `1px solid ${T.border}`,
    background: palette.Asia || "#3b82f6",
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 12,
    cursor: "pointer",
  };

  return (
    <div
      style={{
        background: T.bg,
        borderRadius: 12,
        padding: "24px 28px",
        width: "100%",
        boxSizing: "border-box",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        border: `1px solid ${T.border}`,
      }}
    >
      {/* Header */}
      <div>
        <h2 style={{ fontSize: 20, fontWeight: "800", color: T.text, margin: 0 }}>
          The Wealth & Health of Nations (Hans Rosling Gapminder)
        </h2>
        <p style={{ fontSize: 13, color: T.subtext, margin: "4px 0 0 0" }}>
          Logarithmic GDP per capita vs Life Expectancy (1800–2024) · Bubble size represents population · Color indicates world region.
        </p>
      </div>

      {/* Controls Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginTop: 18,
          marginBottom: 20,
          flexWrap: "wrap",
          background: T.chartBg,
          padding: "10px 16px",
          borderRadius: 8,
          border: `1px solid ${T.border}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: T.subtext }}>VIEW:</label>
          <select value={viewMode} onChange={(e) => setViewMode(e.target.value)} style={ddStyle}>
            <option value="2d">2D Bubble Chart (D3)</option>
            <option value="3d">3D Spheres (Three.js)</option>
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: T.subtext }}>THEME:</label>
          <select value={theme} onChange={(e) => setTheme(e.target.value)} style={ddStyle}>
            <option value="Light">Light Mode</option>
            <option value="Dark">Dark Mode</option>
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: T.subtext }}>PALETTE:</label>
          <select value={colorTheme} onChange={(e) => setColorTheme(e.target.value)} style={ddStyle}>
            {Object.keys(PALETTES).map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: T.subtext }}>REGION:</label>
          <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)} style={ddStyle}>
            <option value="All">All Regions</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Playback & Year Scrubber */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto", flexWrap: "wrap" }}>
          <button
            onClick={() => {
              if (year >= 2024) setYear(1800);
              setIsPlaying(!isPlaying);
            }}
            style={btnStyle}
          >
            {isPlaying ? "⏸ Pause" : year >= 2024 ? "🔄 Replay" : "▶ Play History"}
          </button>

          <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} style={ddStyle}>
            <option value={0.5}>0.5x Speed</option>
            <option value={1}>1.0x Speed</option>
            <option value={2}>2.0x Speed</option>
          </select>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: palette.Asia || "#3b82f6", minWidth: 40 }}>{year}</span>
            <input
              type="range"
              min={1800}
              max={2024}
              value={year}
              onChange={(e) => {
                setIsPlaying(false);
                setYear(Number(e.target.value));
              }}
              style={{ width: 140, cursor: "pointer", accentColor: palette.Asia || "#3b82f6" }}
            />
          </div>
        </div>
      </div>

      {/* Visual Canvas + Stats Panel */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", width: "100%", flexWrap: "nowrap" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {viewMode === "2d" ? (
            <Chart2D
              theme={theme}
              palette={palette}
              year={year}
              selectedNation={selectedNation}
              setSelectedNation={setSelectedNation}
              regionFilter={regionFilter}
            />
          ) : (
            <Chart3D theme={theme} palette={palette} year={year} />
          )}
        </div>
        <StatsPanel
          data={currentData}
          year={year}
          theme={theme}
          palette={palette}
          selectedNation={selectedNation}
          setSelectedNation={setSelectedNation}
        />
      </div>
    </div>
  );
}
