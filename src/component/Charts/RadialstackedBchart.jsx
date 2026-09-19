import React, { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import ColorWheel from "../colorwheel.jsx";

const RadialstackedBchart = () => {
  const svgRef = useRef(null);
  const [showWheel, setShowWheel] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Category colors - each category has its own color
  const [categoryColors, setCategoryColors] = useState({
    electronics: "#6366f1",
    clothing: "#22c55e",
    accent: "#f59e0b"
  });

  const sampleData = [
    { month: "Jan", electronics: 30, clothing: 20, total: 50 },
    { month: "Feb", electronics: 50, clothing: 30, total: 80 },
    { month: "Mar", electronics: 40, clothing: 25, total: 65 },
    { month: "Apr", electronics: 60, clothing: 35, total: 95 },
    { month: "May", electronics: 45, clothing: 40, total: 85 },
    { month: "Jun", electronics: 55, clothing: 45, total: 100 }
  ];

  // Listen for palette changes from Palette Manager
  useEffect(() => {
    const loadActivePalette = () => {
      const savedPalette = localStorage.getItem("global_activePalette");
      if (savedPalette) {
        try {
          const palette = JSON.parse(savedPalette);
          if (palette.primaryColors && palette.primaryColors.length >= 2) {
            setCategoryColors({
              electronics: palette.primaryColors[0],
              clothing: palette.primaryColors[1] || "#22c55e",
              accent: palette.accentColors?.[0] || "#f59e0b"
            });
          }
        } catch (e) {
          console.error("Error loading palette:", e);
        }
      }
    };
    
    loadActivePalette();
    
    const handlePaletteChange = (event) => {
      if (event.detail && event.detail.palette) {
        const palette = event.detail.palette;
        if (palette.primaryColors && palette.primaryColors.length >= 2) {
          setCategoryColors({
            electronics: palette.primaryColors[0],
            clothing: palette.primaryColors[1] || "#22c55e",
            accent: palette.accentColors?.[0] || "#f59e0b"
          });
        }
      }
    };
    
    window.addEventListener('paletteChanged', handlePaletteChange);
    return () => window.removeEventListener('paletteChanged', handlePaletteChange);
  }, []);

  // Handle color wheel apply - updates specific category color
  const handleApplyColor = (colors, segmentData) => {
    if (segmentData && segmentData.category) {
      setCategoryColors(prev => ({
        ...prev,
        [segmentData.category]: colors[0]
      }));
    }
    setShowWheel(false);
  };

  useEffect(() => {
    drawChart();
  }, [categoryColors]);

  const drawChart = () => {
    const keys = ["electronics", "clothing"];
    const width = 850;
    const height = 700;
    const innerRadius = 100;
    const outerRadius = 260;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .style("background", "#1a1a2e");

    const g = svg
      .append("g")
      .attr("transform", `translate(${width / 2 - 50}, ${height / 2})`);

    const stackedData = d3.stack().keys(keys)(sampleData);

    const angleScale = d3
      .scaleBand()
      .domain(sampleData.map((d) => d.month))
      .range([0, 2 * Math.PI])
      .padding(0.08);

    const maxValue = d3.max(
      stackedData[stackedData.length - 1],
      (d) => d[1]
    );

    const radiusScale = d3
      .scaleRadial()
      .domain([0, maxValue])
      .range([innerRadius, outerRadius]);

    const arc = d3
      .arc()
      .innerRadius((d) => radiusScale(d[0]))
      .outerRadius((d) => radiusScale(d[1]))
      .startAngle((d) => angleScale(d.data.month))
      .endAngle(
        (d) => angleScale(d.data.month) + angleScale.bandwidth()
      )
      .padAngle(0.02);

    // Draw electronics arcs
    const electronicsLayer = stackedData[0];
    g.selectAll(`.arc-electronics`)
      .data(electronicsLayer)
      .enter()
      .append("path")
      .attr("d", arc)
      .attr("fill", categoryColors.electronics)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0.9)
      .attr("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        setSelectedCategory("electronics");
        setShowWheel(true);
      });

    // Draw clothing arcs
    const clothingLayer = stackedData[1];
    g.selectAll(`.arc-clothing`)
      .data(clothingLayer)
      .enter()
      .append("path")
      .attr("d", arc)
      .attr("fill", categoryColors.clothing)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0.9)
      .attr("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        setSelectedCategory("clothing");
        setShowWheel(true);
      });

    // Value labels for electronics
    g.selectAll(`.label-electronics`)
      .data(electronicsLayer)
      .enter()
      .append("text")
      .attr("transform", (d) => {
        const angle = angleScale(d.data.month) + angleScale.bandwidth() / 2 - Math.PI / 2;
        const radius = (radiusScale(d[0]) + radiusScale(d[1])) / 2;
        return `translate(${Math.cos(angle) * radius}, ${Math.sin(angle) * radius})`;
      })
      .attr("text-anchor", "middle")
      .attr("fill", "#fff")
      .attr("font-size", "11px")
      .attr("font-weight", "bold")
      .text((d) => d[1] - d[0]);

    // Value labels for clothing
    g.selectAll(`.label-clothing`)
      .data(clothingLayer)
      .enter()
      .append("text")
      .attr("transform", (d) => {
        const angle = angleScale(d.data.month) + angleScale.bandwidth() / 2 - Math.PI / 2;
        const radius = (radiusScale(d[0]) + radiusScale(d[1])) / 2;
        return `translate(${Math.cos(angle) * radius}, ${Math.sin(angle) * radius})`;
      })
      .attr("text-anchor", "middle")
      .attr("fill", "#fff")
      .attr("font-size", "11px")
      .attr("font-weight", "bold")
      .text((d) => d[1] - d[0]);

    // Month labels
    const labelRadius = outerRadius + 35;
    sampleData.forEach((d) => {
      const angle = angleScale(d.month) + angleScale.bandwidth() / 2 - Math.PI / 2;
      g.append("text")
        .attr("x", Math.cos(angle) * labelRadius)
        .attr("y", Math.sin(angle) * labelRadius)
        .attr("text-anchor", "middle")
        .attr("fill", "#fff")
        .attr("font-size", "13px")
        .attr("font-weight", "600")
        .text(d.month);
    });

    // Center circle with accent color - clickable
    const avg = Math.round(d3.mean(sampleData, (d) => d.total));
    g.append("circle")
      .attr("r", innerRadius - 30)
      .attr("fill", categoryColors.accent)
      .attr("opacity", 0.85)
      .attr("cursor", "pointer")
      .on("click", () => {
        setSelectedCategory("accent");
        setShowWheel(true);
      });

    g.append("text")
      .attr("text-anchor", "middle")
      .attr("fill", "#fff")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .text("AVG");

    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "20")
      .attr("fill", "#fff")
      .attr("font-size", "16px")
      .attr("font-weight", "bold")
      .text(avg);

    // Legend
    const legend = svg.append("g").attr("transform", `translate(${width - 180}, 120)`);
    legend.append("text")
      .attr("fill", "#fff")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .text("Legend");

    const items = [
      { label: "Electronics", color: categoryColors.electronics },
      { label: "Clothing", color: categoryColors.clothing },
      { label: "Accent", color: categoryColors.accent }
    ];

    items.forEach((item, i) => {
      const row = legend.append("g").attr("transform", `translate(0, ${30 + i * 30})`);
      row.append("rect").attr("width", 15).attr("height", 15).attr("fill", item.color).attr("rx", 3);
      row.append("text").attr("x", 25).attr("y", 12).attr("fill", "#fff").attr("font-size", "13px").text(item.label);
    });

    // Title
    svg.append("text")
      .attr("x", width / 2 - 50)
      .attr("y", 40)
      .attr("text-anchor", "middle")
      .attr("fill", "#fff")
      .attr("font-size", "20px")
      .attr("font-weight", "bold")
      .text("Radial Stacked Bar Chart");
  };

  return (
    <div style={{ background: "#1a1a2e", padding: "20px", borderRadius: "12px" }}>
      <svg ref={svgRef}></svg>

      {/* Color Wheel Modal */}
      {showWheel && (
        <ColorWheel
          onClose={() => setShowWheel(false)}
          onApply={handleApplyColor}
          initialColor={categoryColors[selectedCategory] || categoryColors.electronics}
          categoryName={selectedCategory}
        />
      )}
    </div>
  );
};

export default RadialstackedBchart;