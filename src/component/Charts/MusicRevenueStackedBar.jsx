import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as THREE from "three";

const THEMES = {
  Modern:  ["#6366f1","#06b6d4","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#14b8a6","#f97316","#6b7280"],
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

// ─── Legend ───────────────────────────────────────────────────────────────────
function LegendHTML({ formats, theme }) {
  const palette = THEMES[theme];
  const color   = d3.scaleOrdinal().domain(formats).range(
    formats.map((_, i) => palette[i % palette.length])
  );
  return (
    <div style={{
      background:"#fff", border:"1px solid #e2e8f0", borderRadius:8,
      padding:"12px 14px", width:180, flexShrink:0,
      boxShadow:"0 1px 4px rgba(0,0,0,0.07)", alignSelf:"flex-start",
      maxHeight:520, overflowY:"auto",
    }}>
      <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:8 }}>
        FORMATS
      </div>
      {formats.map((f, i) => (
        <div key={f} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:5 }}>
          <div style={{ width:10, height:10, borderRadius:2, flexShrink:0, background:color(f) }} />
          <span style={{ color:"#334155", fontSize:10, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:150 }}>{f}</span>
        </div>
      ))}
      <div style={{ borderTop:"1px solid #e2e8f0", margin:"10px 0 8px" }} />
      <div style={{ fontSize:10, color:"#94a3b8", lineHeight:1.6 }}>
        Revenue inflation adjusted<br/>1973 – 2018
      </div>
    </div>
  );
}

// ─── 2D Chart ─────────────────────────────────────────────────────────────────
function Chart2D({ theme }) {
  const svgRef    = useRef(null);
  const [formats, setFormats] = useState([]);

  useEffect(() => {
    if (!svgRef.current) return;

    d3.csv("/music.csv").then(raw => {
      // Parse all records — filter zero revenue
      const data = raw
        .map(d => ({
          year:   +d.Year,
          format: d.Format,
          value:  Math.max(0, +d["Revenue (Inflation Adjusted)"] || 0),
        }))
        .filter(d => d.value > 0);

      const fmts  = [...new Set(data.map(d => d.format))];
      const years = [...new Set(data.map(d => d.year))].sort((a,b) => a-b);
      setFormats(fmts);

      const palette = THEMES[theme];
      const color   = d3.scaleOrdinal()
        .domain(fmts)
        .range(fmts.map((_, i) => palette[i % palette.length]));

      // Build pivot: year → { format: value }
      const pivot = years.map(year => {
        const row = { year };
        fmts.forEach(f => {
          const rec = data.find(d => d.year === year && d.format === f);
          row[f] = rec ? rec.value : 0;
        });
        return row;
      });

      const stack       = d3.stack().keys(fmts).order(d3.stackOrderNone).offset(d3.stackOffsetNone);
      const stackedData = stack(pivot);
      const maxVal      = d3.max(stackedData[stackedData.length-1], d => d[1]);

      const W      = 680;
      const H      = 420;
      const margin = { top:24, right:20, bottom:48, left:64 };

      const x = d3.scaleBand()
        .domain(years)
        .range([margin.left, W - margin.right])
        .padding(0.18);

      const y = d3.scaleLinear()
        .domain([0, maxVal * 1.06]).nice()
        .range([H - margin.bottom, margin.top]);

      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();
      svg.attr("width", W).attr("height", H);
      svg.append("rect").attr("width",W).attr("height",H).attr("fill","#f8fafc").attr("rx",8);

      // Grid
      svg.append("g").attr("transform",`translate(0,${H-margin.bottom})`)
        .call(d3.axisBottom(x).tickFormat("").tickSize(-(H-margin.top-margin.bottom)))
        .call(g => { g.select(".domain").remove(); g.selectAll("line").style("stroke","#e2e8f0").style("stroke-dasharray","4,3"); });

      // Tooltip
      const tooltip = d3.select("body").append("div")
        .style("position","absolute").style("background","rgba(15,23,42,0.92)")
        .style("color","#fff").style("padding","8px 12px").style("border-radius","6px")
        .style("font-size","12px").style("pointer-events","none").style("opacity",0)
        .style("border","1px solid #334155").style("z-index","9999");

      // Stacked bars
      stackedData.forEach(layer => {
        svg.append("g").selectAll("rect").data(layer).join("rect")
          .attr("x",      d => x(d.data.year))
          .attr("y",      d => y(Math.max(0, d[1])))
          .attr("height", d => Math.max(0, y(d[0]) - y(d[1])))
          .attr("width",  x.bandwidth())
          .attr("fill",   color(layer.key))
          .attr("opacity",0.88)
          .attr("stroke","#fff").attr("stroke-width",0.4)
          .style("cursor","pointer")
          .on("mouseover", function(event, d) {
            d3.select(this).attr("opacity",1);
            const rev = d[1] - d[0];
            tooltip.style("opacity",1)
              .html(
                `<b style="color:${color(layer.key)}">${layer.key}</b><br/>` +
                `Year: <b>${d.data.year}</b><br/>` +
                `Revenue: <b>$${(rev/1e9).toFixed(2)}B</b>`
              )
              .style("left",(event.pageX+12)+"px").style("top",(event.pageY-10)+"px");
          })
          .on("mousemove", event => {
            tooltip.style("left",(event.pageX+12)+"px").style("top",(event.pageY-10)+"px");
          })
          .on("mouseout", function() {
            d3.select(this).attr("opacity",0.88);
            tooltip.style("opacity",0);
          });
      });

      // X axis — show every 5 years
      svg.append("g").attr("transform",`translate(0,${H-margin.bottom})`)
        .call(
          d3.axisBottom(x)
            .tickValues(years.filter(y => y % 5 === 0))
            .tickFormat(d => `'${String(d).slice(-2)}`)
            .tickSize(0)
        )
        .call(g => {
          g.select(".domain").style("stroke","#e2e8f0");
          g.selectAll("text").style("fill","#64748b").style("font-size","10px");
        });

      // Y axis
      svg.append("g").attr("transform",`translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(6).tickFormat(d => `$${(d/1e9).toFixed(0)}B`))
        .call(g => {
          g.select(".domain").remove();
          g.selectAll("line").remove();
          g.selectAll("text").style("fill","#64748b").style("font-size","10px");
        });

      // Y label
      svg.append("text")
        .attr("transform","rotate(-90)")
        .attr("x", -H/2).attr("y", 16)
        .attr("text-anchor","middle")
        .style("font-size","11px").style("fill","#94a3b8")
        .text("Revenue (Inflation Adjusted, $B)");

      // X label
      svg.append("text")
        .attr("x", (W+margin.left)/2).attr("y", H-4)
        .attr("text-anchor","middle")
        .style("font-size","11px").style("fill","#94a3b8")
        .text("Year");

      return () => tooltip.remove();
    });
  }, [theme]);

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <div style={{ flex:1, minWidth:0, overflowX:"auto" }}>
        <svg ref={svgRef} style={{ display:"block" }} />
      </div>
      <div style={{ padding:"12px 12px 12px 0" }}>
        <LegendHTML formats={formats} theme={theme} />
      </div>
    </div>
  );
}

// ─── 3D Chart — AxesHelper removed, all formats, glow caps, drag+spin ─────────
function Chart3D({ theme }) {
  const mountRef   = useRef(null);
  const overlayRef = useRef(null);
  const [formats,  setFormats] = useState([]);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);

    const W = el.clientWidth || 680;
    const H = 480;

    const scene  = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);

    const camera = new THREE.PerspectiveCamera(42, W/H, 0.1, 200);
    camera.position.set(0, 10, 22);
    camera.lookAt(0, 2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.domElement.style.display    = "block";
    renderer.domElement.style.outline    = "none";
    renderer.domElement.style.userSelect = "none";
    el.appendChild(renderer.domElement);

    // Lights — NO AxesHelper
    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(6,14,10); sun.castShadow=true; scene.add(sun);
    const pal0 = new THREE.Color(THEMES[theme][0]);
    scene.add(new THREE.PointLight(pal0, 0.4, 60));
    scene.add(new THREE.HemisphereLight(0xffffff, 0xe0e7ff, 0.45));

    // Floor + clean grid
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 18),
      new THREE.MeshStandardMaterial({ color:0xf1f5f9, roughness:0.9 })
    );
    floor.rotation.x = -Math.PI/2; floor.receiveShadow=true; scene.add(floor);
    scene.add(new THREE.GridHelper(60, 50, 0xcccccc, 0xe2e8f0));

    const labelAnchors = [];
    let   animId;

    d3.csv("/music.csv").then(raw => {
      const data = raw.map(d => ({
        year:   +d.Year,
        format: d.Format,
        value:  Math.max(0, +d["Revenue (Inflation Adjusted)"] || 0),
      }));

      const fmts  = [...new Set(data.map(d => d.format))];
      const years = [...new Set(data.map(d => d.year))].sort((a,b) => a-b);
      setFormats(fmts);

      const palette    = THEMES[theme];
      const colorScale = d3.scaleOrdinal()
        .domain(fmts)
        .range(fmts.map((_, i) => palette[i % palette.length]));

      // Max total revenue across all years
      const maxTotal = d3.max(years, year =>
        d3.sum(fmts, f => {
          const r = data.find(d => d.year === year && d.format === f);
          return r ? r.value : 0;
        })
      );

      const maxH     = 8;
      const barW     = 0.45;
      const barD     = 0.45;
      const groupGap = 1.2;
      const totalW   = years.length * groupGap;
      const startX   = -totalW / 2 + groupGap / 2;

      const pivot = new THREE.Group();

      years.forEach((year, xi) => {
        const xp = startX + xi * groupGap;
        let yAcc = 0;

        // Get all formats active this year (non-zero)
        const activeFormats = fmts.filter(f => {
          const r = data.find(d => d.year === year && d.format === f);
          return r && r.value > 0;
        });

        activeFormats.forEach((fmt, fi) => {
          const rec = data.find(d => d.year === year && d.format === fmt);
          const val = rec ? rec.value : 0;
          const bh  = (val / maxTotal) * maxH;
          const col = new THREE.Color(colorScale(fmt));

          // Main bar segment
          const geo  = new THREE.BoxGeometry(barW, bh, barD);
          const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
            color:col, roughness:0.22, metalness:0.45,
            emissive:col, emissiveIntensity:0.18,
          }));
          mesh.position.set(xp, yAcc + bh/2, 0);
          mesh.castShadow = true;
          pivot.add(mesh);

          // Edge outline
          const eln = new THREE.LineSegments(
            new THREE.EdgesGeometry(geo),
            new THREE.LineBasicMaterial({ color:0xffffff, transparent:true, opacity:0.30 })
          );
          eln.position.set(xp, yAcc + bh/2, 0);
          pivot.add(eln);

          yAcc += bh;
        });

        // Glow cap at total top
        if (yAcc > 0) {
          const topCol = new THREE.Color(colorScale(activeFormats[activeFormats.length-1]));
          const capC   = topCol.clone().lerp(new THREE.Color(0xffffff), 0.30);
          const cap    = new THREE.Mesh(
            new THREE.BoxGeometry(barW, 0.07, barD),
            new THREE.MeshStandardMaterial({
              color:capC, emissive:capC,
              emissiveIntensity:1.3, roughness:0.04, metalness:1,
            })
          );
          cap.position.set(xp, yAcc + 0.035, 0);
          pivot.add(cap);

          // Total revenue label above bar
          const totalRev = d3.sum(activeFormats, f => {
            const r = data.find(d => d.year === year && d.format === f);
            return r ? r.value : 0;
          });
          labelAnchors.push({
            x:xp, y: yAcc + 0.65, z:0,
            text: `$${(totalRev/1e9).toFixed(1)}B`,
            col:  `#${topCol.getHexString()}`,
            type: "value",
          });
        }

        // Year label below floor
        labelAnchors.push({
          x:xp, y:-0.65, z:0,
          text: xi % 5 === 0 ? `'${String(year).slice(-2)}` : "",
          col:  "#334155",
          type: "year",
        });
      });

      scene.add(pivot);

      // Set overlay text
      if (overlayRef.current) {
        const divs = overlayRef.current.querySelectorAll(".shlbl");
        labelAnchors.forEach((a, i) => { if (divs[i]) divs[i].textContent = a.text; });
      }

      const toScreen = (x3,y3,z3) => {
        const v = new THREE.Vector3(x3,y3,z3).project(camera);
        return { sx:(v.x*0.5+0.5)*W, sy:(-v.y*0.5+0.5)*H, behind:v.z>1 };
      };

      // Drag rotation + auto-spin
      let isDragging=false, prevX=0, prevY=0,
          rotX=0.28, rotY=0, autoSpin=true;
      pivot.rotation.x = rotX;
      pivot.rotation.y = rotY;

      const onDown = e => {
        e.preventDefault();
        isDragging=true; prevX=e.clientX; prevY=e.clientY;
        autoSpin=false; renderer.domElement.style.cursor="grabbing";
      };
      const onUp   = () => { isDragging=false; renderer.domElement.style.cursor="grab"; };
      const onMove = e => {
        if (!isDragging) return;
        rotY += (e.clientX-prevX)*0.006;
        rotX  = Math.max(-0.8, Math.min(0.8, rotX+(e.clientY-prevY)*0.004));
        prevX=e.clientX; prevY=e.clientY;
      };

      renderer.domElement.addEventListener("mousedown", onDown);
      window.addEventListener("mouseup",   onUp);
      window.addEventListener("mousemove", onMove);

      const animate = () => {
        animId = requestAnimationFrame(animate);
        if (autoSpin) rotY += 0.003;
        pivot.rotation.y = rotY;
        pivot.rotation.x = rotX;
        camera.updateMatrixWorld();

        if (overlayRef.current) {
          overlayRef.current.querySelectorAll(".shlbl").forEach((div, i) => {
            const a = labelAnchors[i];
            if (!a) return;
            const rotVec = new THREE.Vector3(a.x,a.y,a.z).applyEuler(pivot.rotation);
            const { sx, sy, behind } = toScreen(rotVec.x, rotVec.y, rotVec.z);
            div.style.left    = `${sx}px`;
            div.style.top     = `${sy}px`;
            div.style.opacity = (behind || !a.text) ? "0" : "1";
          });
        }
        renderer.render(scene, camera);
      };
      animate();

      return () => {
        renderer.domElement.removeEventListener("mousedown", onDown);
        window.removeEventListener("mouseup",   onUp);
        window.removeEventListener("mousemove", onMove);
      };
    });

    renderer.domElement.style.cursor = "grab";

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [theme]);

  // 46 years × 2 labels (value + year) = 92
  const jsxLabels = Array.from({ length: 92 }, (_, i) => ({
    col:  THEMES[theme][i % THEMES[theme].length],
    type: i % 2 === 0 ? "value" : "year",
  }));

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <div style={{ position:"relative", flex:1, minWidth:0, userSelect:"none" }}>
        <div ref={mountRef} style={{ width:"100%", height:480, cursor:"grab", overflow:"hidden" }} />

        <div ref={overlayRef} style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
          {jsxLabels.map((a, i) => (
            <div key={i} className="shlbl" style={{
              position:      "absolute",
              transform:     a.type==="year" ? "translate(-50%,0%)" : "translate(-50%,-100%)",
              background:    a.type==="year" ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.93)",
              color:         a.col,
              fontSize:      a.type==="value" ? 9 : 10,
              fontWeight:    "bold",
              padding:       "2px 5px",
              borderRadius:  3,
              border:        a.type==="year" ? "1px solid #e2e8f0" : `1px solid ${a.col}55`,
              whiteSpace:    "nowrap",
              pointerEvents: "none",
              boxShadow:     "0 1px 3px rgba(0,0,0,0.08)",
              opacity:       0,
            }} />
          ))}
        </div>

        <div style={{ padding:"7px 14px", background:"#f8fafc", borderTop:"1px solid #e2e8f0", fontSize:11, color:"#94a3b8" }}>
          💡 Drag to rotate · auto-spins · Bar height = total revenue · Hover 2D for format details
        </div>
      </div>

      <div style={{ padding:"12px 12px 12px 0" }}>
        <LegendHTML formats={formats} theme={theme} />
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const MusicRevenueStackedBar = () => {
  const [viewMode, setViewMode] = useState("2d");
  const [theme,    setTheme]    = useState("Modern");

  const ddStyle = {
    padding:"5px 10px", borderRadius:6, border:"1px solid #e2e8f0",
    background:"#fff", color:"#334155", fontWeight:"500",
    cursor:"pointer", fontSize:12, outline:"none",
  };

  return (
    <div style={{
      background:"#ffffff", borderRadius:12, padding:"20px 24px 32px 24px",
      width:"100%", boxShadow:"0 1px 3px rgba(0,0,0,0.08)", boxSizing:"border-box",
    }}>
      <div style={{ marginBottom:4 }}>
        <div style={{ fontSize:16, fontWeight:"bold", color:"#1e293b" }}>
          Music Revenue – Stacked Bar Chart
        </div>
        <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>
          Revenue by format · Inflation adjusted · 1973–2018
        </div>
      </div>

      <div style={{ display:"flex", gap:10, alignItems:"flex-end", marginTop:12, marginBottom:20 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
          <label style={{ fontSize:11, color:"#94a3b8", fontWeight:"600" }}>View</label>
          <select value={viewMode} onChange={e => setViewMode(e.target.value)} style={ddStyle}>
            <option value="2d">2D</option>
            <option value="3d">3D</option>
          </select>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
          <label style={{ fontSize:11, color:"#94a3b8", fontWeight:"600" }}>Color Theme</label>
          <select value={theme} onChange={e => setTheme(e.target.value)} style={ddStyle}>
            {Object.keys(THEMES).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </div>

      <div style={{ minHeight:480 }}>
        {viewMode === "2d"
          ? <Chart2D key={`2d-${theme}`} theme={theme} />
          : <Chart3D key={`3d-${theme}`} theme={theme} />
        }
      </div>
    </div>
  );
};

export default MusicRevenueStackedBar;