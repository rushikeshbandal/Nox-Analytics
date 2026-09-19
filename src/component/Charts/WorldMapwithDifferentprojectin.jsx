import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";

const THEMES = {
  Modern:  d3.schemeTableau10,
  Neon:    ["#ff0080","#00f5ff","#39ff14","#ffae00","#ff3131","#ff6bff","#00ff9d","#ff4400","#ff00aa","#00ccff"],
  Pastel:  ["#a5b4fc","#67e8f9","#6ee7b7","#fde68a","#fca5a5","#c4b5fd","#f9a8d4","#99f6e4","#fdba74","#d1d5db"],
  Sunset:  ["#ff6b6b","#feca57","#ff9ff3","#48dbfb","#1dd1a1","#f368e0","#ff9f43","#10ac84","#5f27cd","#00d2d3"],
  Ocean:   ["#03045e","#0077b6","#00b4d8","#90e0ef","#023e8a","#0096c7","#48cae4","#ade8f4","#caf0f8","#7ec8e3"],
  Galaxy:  ["#4a306d","#7b2cbf","#9d4edd","#c77dff","#e0aaff","#3c1e4d","#5e2e7d","#803ead","#a24edd","#c45eed"],
  Forest:  ["#1b4332","#2d6a4f","#40916c","#52b788","#74c69d","#95d5b2","#b7e4c7","#a7c957","#6a994e","#386641"],
  Autumn:  ["#7f4f24","#936639","#a68a64","#c2c5aa","#e63946","#c1121f","#9d0208","#6a040f","#370617","#b5838d"],
  Candy:   ["#ff006e","#fb5607","#ffbe0b","#8338ec","#3a86ff","#06d6a0","#ef476f","#ffd166","#26547c","#05c7f2"],
  Earth:   ["#6b4f3c","#8b6914","#a07850","#b8975a","#c9a96e","#3a7d44","#2d6a4f","#1b4332","#52796f","#84a98c"],
};

// ── Safe projection builder — never throws ────────────────────────────────────
// Robinson was removed from d3-geo-projection in d3 v7 core.
// We replace it with Natural Earth (visually similar, always available).
const PROJECTIONS = {
  mercator:            { name:"Mercator",            desc:"Standard navigation map, preserves angles"     },
  equirectangular:     { name:"Equirectangular",     desc:"Simple cylindrical, equal spacing of lat/lon"  },
  orthographic:        { name:"Orthographic (Globe)", desc:"3D globe view — drag to rotate"               },
  naturalEarth:        { name:"Natural Earth",       desc:"Low distortion, ideal for world maps"          },
  conicEqualArea:      { name:"Conic Equal Area",    desc:"Equal-area conic, good for mid-latitudes"      },
  azimuthalEquidistant:{ name:"Azimuthal Equidist.", desc:"Distances measured from a central point"       },
};

const isGlobe = p => p === "orthographic" || p === "azimuthalEquidistant";

function buildProjection(type, W, H, rotX, rotY) {
  const half = Math.min(W, H) / 2 - 10;
  // Every branch uses only projections that are guaranteed in d3 v7 core
  try {
    switch (type) {
      case "mercator":
        return d3.geoMercator()
          .scale(W / (2 * Math.PI))
          .translate([W / 2, H / 2]);

      case "equirectangular":
        return d3.geoEquirectangular()
          .scale(W / (2 * Math.PI))
          .translate([W / 2, H / 2]);

      case "orthographic":
        return d3.geoOrthographic()
          .scale(half)
          .translate([W / 2, H / 2])
          .rotate([rotX, rotY]);

      case "naturalEarth":
        return d3.geoNaturalEarth1()
          .scale(W / (2 * Math.PI))
          .translate([W / 2, H / 2]);

      case "conicEqualArea":
        return d3.geoConicEqualArea()
          .parallels([20, 60])
          .scale(W / (2 * Math.PI) * 1.1)
          .translate([W / 2, H / 2]);

      case "azimuthalEquidistant":
        return d3.geoAzimuthalEquidistant()
          .scale(half)
          .translate([W / 2, H / 2])
          .rotate([rotX, rotY]);

      default:
        // Safe fallback — Natural Earth always works
        return d3.geoNaturalEarth1()
          .scale(W / (2 * Math.PI))
          .translate([W / 2, H / 2]);
    }
  } catch (err) {
    // If anything goes wrong, return a guaranteed-safe projection
    console.warn("Projection error, falling back to Natural Earth:", err);
    return d3.geoNaturalEarth1()
      .scale(W / (2 * Math.PI))
      .translate([W / 2, H / 2]);
  }
}

// ─── Legend ───────────────────────────────────────────────────────────────────
function LegendHTML({ projType, selected, theme }) {
  const t = THEMES[theme];
  return (
    <div style={{
      background:"#fff", border:"1px solid #e2e8f0", borderRadius:8,
      padding:"12px 14px", width:160, flexShrink:0,
      boxShadow:"0 1px 4px rgba(0,0,0,0.07)", alignSelf:"flex-start",
    }}>
      <div style={{
        fontSize:10, fontWeight:"bold", color:"#94a3b8",
        letterSpacing:"0.08em", marginBottom:8,
      }}>
        PROJECTIONS
      </div>
      {Object.entries(PROJECTIONS).map(([key, p]) => (
        <div key={key} style={{ display:"flex", alignItems:"flex-start", gap:7, marginBottom:7 }}>
          <div style={{
            width:9, height:9, borderRadius:2, flexShrink:0, marginTop:1,
            background: key===projType ? t[0] : "#e2e8f0",
            border: key===projType ? `1px solid ${t[0]}` : "1px solid #cbd5e1",
          }} />
          <div style={{
            color: key===projType ? "#334155" : "#64748b",
            fontSize:10,
            fontWeight: key===projType ? "700" : "500",
          }}>
            {p.name}
          </div>
        </div>
      ))}

      {selected && (
        <>
          <div style={{ borderTop:"1px solid #e2e8f0", margin:"8px 0" }} />
          <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:4 }}>
            SELECTED
          </div>
          <div style={{ fontSize:10, color:t[0], fontWeight:"bold" }}>{selected}</div>
        </>
      )}

      <div style={{ borderTop:"1px solid #e2e8f0", marginTop:8, paddingTop:8 }}>
        <div style={{ fontSize:9, color:"#94a3b8", lineHeight:1.5 }}>
          {PROJECTIONS[projType]?.desc}
        </div>
      </div>
    </div>
  );
}

// ─── Map ──────────────────────────────────────────────────────────────────────
function MapChart({ projType, theme }) {
  const svgRef  = useRef(null);
  const [rotX,     setRotX]     = useState(0);
  const [rotY,     setRotY]     = useState(0);
  const [selected, setSelected] = useState(null);
  const [world,    setWorld]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const palette    = THEMES[theme];
  const globeMode  = isGlobe(projType);

  // Load world atlas once
  useEffect(() => {
    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then(raw => { setWorld(raw); setLoading(false); })
      .catch(err => { setError("Failed to load map data."); setLoading(false); });
  }, []);

  // Redraw on any relevant change
  useEffect(() => {
    if (!svgRef.current || !world) return;

    let proj;
    try {
      proj = buildProjection(projType, 600, 400, rotX, rotY);
    } catch (err) {
      console.error("Projection failed:", err);
      return;
    }

    const W = 600, H = 400;
    const countries = feature(world, world.objects.countries);
    const path      = d3.geoPath().projection(proj);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${W} ${H}`)
       .attr("preserveAspectRatio", "xMidYMid meet");

    // Ocean background
    svg.append("rect")
      .attr("width", W).attr("height", H)
      .attr("fill", "#e8f4fd").attr("rx", 8);

    // Globe clip for spherical projections
    if (globeMode) {
      svg.append("defs").append("clipPath").attr("id", "globeClip")
        .append("circle")
        .attr("cx", W/2).attr("cy", H/2)
        .attr("r", Math.min(W, H)/2 - 10);

      svg.append("circle")
        .attr("cx", W/2).attr("cy", H/2)
        .attr("r", Math.min(W, H)/2 - 10)
        .attr("fill", "#e8f4fd")
        .attr("stroke", "#b8c4d0").attr("stroke-width", 1);
    }

    const g = svg.append("g")
      .attr("clip-path", globeMode ? "url(#globeClip)" : null);

    // Graticule
    g.append("path")
      .datum(d3.geoGraticule()())
      .attr("d", path)
      .attr("fill", "none")
      .attr("stroke", "#c8d3e0")
      .attr("stroke-width", 0.4)
      .attr("opacity", 0.7);

    // Tooltip
    const tooltip = d3.select("body").append("div")
      .style("position","absolute")
      .style("background","rgba(15,23,42,0.92)")
      .style("color","#fff")
      .style("padding","8px 12px")
      .style("border-radius","6px")
      .style("font-size","12px")
      .style("pointer-events","none")
      .style("opacity", 0)
      .style("border","1px solid #334155")
      .style("z-index","9999");

    // Countries
    g.selectAll(".cty")
      .data(countries.features)
      .enter()
      .append("path")
      .attr("class","cty")
      .attr("d", d => {
        try { return path(d) || ""; }
        catch { return ""; }
      })
      .attr("fill", (d, i) =>
        d.properties?.name === selected ? palette[0] : palette[i % palette.length]
      )
      .attr("stroke","#fff")
      .attr("stroke-width", 0.4)
      .attr("opacity", 0.88)
      .style("cursor","pointer")
      .on("mouseover", function(event, d) {
        d3.select(this).attr("opacity",1).attr("stroke-width",1.5).attr("stroke","#1e293b");
        tooltip.style("opacity",1)
          .html(`<b>${d.properties?.name||"Unknown"}</b><br/><span style="color:#94a3b8">ID: ${d.id}</span>`)
          .style("left",(event.pageX+12)+"px")
          .style("top",(event.pageY-10)+"px");
      })
      .on("mouseout", function() {
        d3.select(this).attr("opacity",0.88).attr("stroke","#fff").attr("stroke-width",0.4);
        tooltip.style("opacity",0);
      })
      .on("click", (_, d) => setSelected(d.properties?.name || null));

    // Globe drag
    if (globeMode) {
      let prevX = 0, prevY = 0;
      svg.call(
        d3.drag()
          .on("start", e => { prevX = e.x; prevY = e.y; })
          .on("drag",  e => {
            setRotX(rx => rx + (e.x - prevX) * 0.5);
            setRotY(ry => Math.max(-90, Math.min(90, ry - (e.y - prevY) * 0.5)));
            prevX = e.x; prevY = e.y;
          })
      );
    }

    return () => tooltip.remove();
  }, [world, projType, theme, rotX, rotY, selected]);

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:400, color:"#94a3b8", fontSize:14 }}>
      Loading map data…
    </div>
  );

  if (error) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:400, color:"#ef4444", fontSize:14 }}>
      {error}
    </div>
  );

  return (
    <div style={{
      display:"flex", gap:12, alignItems:"flex-start",
      width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden",
    }}>
      <div style={{ position:"relative", flex:1, minWidth:0 }}>
        <svg ref={svgRef} style={{ display:"block", width:"100%", height:400 }} />
        <div style={{
          padding:"7px 14px", background:"#f8fafc",
          borderTop:"1px solid #e2e8f0", fontSize:11, color:"#94a3b8",
        }}>
          {globeMode
            ? "💡 Drag globe to rotate · Click a country to select"
            : "💡 Click a country to select it · Hover for details"}
        </div>
      </div>
      <div style={{ padding:"12px 12px 12px 0" }}>
        <LegendHTML projType={projType} selected={selected} theme={theme} />
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const WorldMapWithProjections = () => {
  const [projType, setProjType] = useState("naturalEarth");
  const [theme,    setTheme]    = useState("Modern");

  const ddStyle = {
    padding:"5px 10px", borderRadius:6, border:"1px solid #e2e8f0",
    background:"#fff", color:"#334155", fontWeight:"500",
    cursor:"pointer", fontSize:12, outline:"none",
  };

  return (
    <div style={{
      background:"#ffffff", borderRadius:12,
      padding:"20px 24px 32px 24px", width:"100%",
      boxShadow:"0 1px 3px rgba(0,0,0,0.08)", boxSizing:"border-box",
    }}>
      {/* Title */}
      <div style={{ marginBottom:4 }}>
        <div style={{ fontSize:16, fontWeight:"bold", color:"#1e293b" }}>
          World Map — Multiple Projections
        </div>
        <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>
          {PROJECTIONS[projType].name} · {PROJECTIONS[projType].desc}
        </div>
      </div>

      {/* Controls */}
      <div style={{
        display:"flex", gap:10, alignItems:"flex-end",
        marginTop:12, marginBottom:20, flexWrap:"wrap",
      }}>
        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
          <label style={{ fontSize:11, color:"#94a3b8", fontWeight:"600" }}>Projection</label>
          <select value={projType} onChange={e => setProjType(e.target.value)} style={ddStyle}>
            {Object.entries(PROJECTIONS).map(([k,p]) => (
              <option key={k} value={k}>{p.name}</option>
            ))}
          </select>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
          <label style={{ fontSize:11, color:"#94a3b8", fontWeight:"600" }}>Color Theme</label>
          <select value={theme} onChange={e => setTheme(e.target.value)} style={ddStyle}>
            {Object.keys(THEMES).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>

        {/* Quick-select projection pills */}
        <div style={{ display:"flex", gap:6, alignItems:"flex-end", paddingBottom:1, flexWrap:"wrap" }}>
          {Object.entries(PROJECTIONS).map(([k,p]) => (
            <button key={k} onClick={() => setProjType(k)} style={{
              padding:"5px 10px", borderRadius:6, border:"1px solid #e2e8f0",
              background: k===projType ? THEMES[theme][0] : "#f8fafc",
              color:       k===projType ? "#fff" : "#64748b",
              fontSize:11, fontWeight:"600", cursor:"pointer",
              transition:"all 0.15s",
            }}>
              {p.name.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      <MapChart key={`${projType}-${theme}`} projType={projType} theme={theme} />
    </div>
  );
};

export default WorldMapWithProjections;