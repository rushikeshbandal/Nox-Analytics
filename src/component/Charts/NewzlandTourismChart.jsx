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

const DATA = [
  { year:1921, tourists:5000,   period:"Early 20th C."  },
  { year:1925, tourists:6000,   period:"Early 20th C."  },
  { year:1930, tourists:8000,   period:"Great Depression"},
  { year:1935, tourists:7000,   period:"Great Depression"},
  { year:1940, tourists:3000,   period:"WWII Period"     },
  { year:1945, tourists:4000,   period:"WWII Period"     },
  { year:1950, tourists:15000,  period:"Post-War"        },
  { year:1955, tourists:25000,  period:"Post-War"        },
  { year:1960, tourists:35000,  period:"Jet Age"         },
  { year:1965, tourists:55000,  period:"Jet Age"         },
  { year:1970, tourists:75000,  period:"Mass Tourism"    },
  { year:1975, tourists:120000, period:"Mass Tourism"    },
  { year:1980, tourists:150000, period:"Mass Tourism"    },
  { year:1985, tourists:250000, period:"Economic Reform" },
  { year:1990, tourists:450000, period:"Economic Reform" },
  { year:1995, tourists:650000, period:"Digital Age"     },
  { year:2000, tourists:850000, period:"Digital Age"     },
  { year:2005, tourists:1250000,period:"LOTR Boom"       },
  { year:2010, tourists:1650000,period:"LOTR Boom"       },
  { year:2015, tourists:2150000,period:"Record Growth"   },
  { year:2018, tourists:2450000,period:"Record Growth"   },
];

const PERIODS = [...new Set(DATA.map(d => d.period))];

// ─── Shared Legend ────────────────────────────────────────────────────────────
function LegendHTML({ theme, selPeriod, onSelect }) {
  const palette = THEMES[theme];
  const color   = d3.scaleOrdinal().domain(PERIODS).range(palette);
  const total   = DATA[DATA.length - 1].tourists;
  const start   = DATA[0].tourists;
  const growth  = (((total - start) / start) * 100).toFixed(0);

  return (
    <div style={{
      background:"#fff", border:"1px solid #e2e8f0", borderRadius:8,
      padding:"12px 14px", width:155, flexShrink:0,
      boxShadow:"0 1px 4px rgba(0,0,0,0.07)", alignSelf:"flex-start",
    }}>
      <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:8 }}>
        PERIODS
      </div>
      {PERIODS.map((p) => (
        <div
          key={p}
          onClick={() => onSelect(selPeriod === p ? "all" : p)}
          style={{
            display:"flex", alignItems:"center", gap:7, marginBottom:5,
            cursor:"pointer", opacity: selPeriod === "all" || selPeriod === p ? 1 : 0.4,
          }}
        >
          <div style={{ width:9, height:9, borderRadius:2, flexShrink:0, background:color(p) }} />
          <span style={{ color: selPeriod === p ? "#334155" : "#64748b", fontSize:10, fontWeight: selPeriod === p ? "700" : "400" }}>
            {p}
          </span>
        </div>
      ))}
      <div style={{ borderTop:"1px solid #e2e8f0", marginTop:8, paddingTop:8 }}>
        <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:4 }}>
          STATS
        </div>
        <div style={{ fontSize:10, color:"#64748b" }}>1921: <b>5k</b></div>
        <div style={{ fontSize:10, color:"#64748b" }}>2018: <b>2.45M</b></div>
        <div style={{ marginTop:4, fontSize:12, fontWeight:"bold", color:palette[0] }}>
          +{growth}% growth
        </div>
      </div>
    </div>
  );
}

// ─── 2D Chart ─────────────────────────────────────────────────────────────────
function Chart2D({ selPeriod, onSelect, theme }) {
  const svgRef  = useRef(null);
  const palette = THEMES[theme];
  const color   = d3.scaleOrdinal().domain(PERIODS).range(palette);
  const filtered = selPeriod === "all" ? DATA : DATA.filter(d => d.period === selPeriod);

  useEffect(() => {
    if (!svgRef.current) return;

    const W = 620, H = 430;
    // ── FIX: generous top margin so value labels never clip ──
    const margin = { top: 48, right: 24, bottom: 50, left: 68 };
    const cW = W - margin.left - margin.right;
    const cH = H - margin.top  - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${W} ${H}`).attr("preserveAspectRatio", "xMidYMid meet");
    svg.append("rect").attr("width", W).attr("height", H).attr("fill", "#f8fafc").attr("rx", 8);

    const x = d3.scaleLinear().domain([1921, 2018]).range([0, cW]);
    const y = d3.scaleLinear()
      .domain([0, d3.max(DATA, d => d.tourists) * 1.15])  // ── FIX: 1.15x so tallest bar has room ──
      .range([cH, 0])
      .nice();

    const chart = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // Grid lines
    y.ticks(5).forEach(v => {
      chart.append("line")
        .attr("x1", 0).attr("x2", cW).attr("y1", y(v)).attr("y2", y(v))
        .attr("stroke", "#e2e8f0").attr("stroke-dasharray", "4,3").attr("stroke-width", 1);
    });

    // Gradient defs
    const defs = svg.append("defs");
    const gr   = defs.append("linearGradient").attr("id", `nzg-${theme}`)
      .attr("x1","0%").attr("x2","0%").attr("y1","0%").attr("y2","100%");
    gr.append("stop").attr("offset","0%").attr("stop-color", palette[0]).attr("stop-opacity", 0.7);
    gr.append("stop").attr("offset","100%").attr("stop-color", palette[0]).attr("stop-opacity", 0.08);

    // Area fill
    chart.append("path").datum(filtered)
      .attr("fill", `url(#nzg-${theme})`)
      .attr("d", d3.area().x(d => x(d.year)).y0(cH).y1(d => y(d.tourists)).curve(d3.curveMonotoneX));

    // Line shadow
    chart.append("path").datum(filtered)
      .attr("fill", "none").attr("stroke", "#cbd5e1").attr("stroke-width", 4).attr("opacity", 0.4)
      .attr("d", d3.line().x(d => x(d.year) + 2).y(d => y(d.tourists) + 2).curve(d3.curveMonotoneX));

    // Main line
    chart.append("path").datum(filtered)
      .attr("fill", "none").attr("stroke", palette[0]).attr("stroke-width", 2.5)
      .attr("d", d3.line().x(d => x(d.year)).y(d => y(d.tourists)).curve(d3.curveMonotoneX));

    // Tooltip
    const tooltip = d3.select("body").append("div")
      .style("position", "absolute").style("background", "rgba(15,23,42,0.92)")
      .style("color", "#fff").style("padding", "8px 12px").style("border-radius", "6px")
      .style("font-size", "12px").style("pointer-events", "none").style("opacity", 0)
      .style("border", "1px solid #334155").style("z-index", "9999");

    // Dots + value labels on significant points
    filtered.forEach(d => {
      const col = color(d.period);
      const cx  = x(d.year);
      const cy  = y(d.tourists);

      // Value label above dot for notable points
      const isNotable = d.tourists >= 500000 || d === filtered[filtered.length - 1] || d === filtered[0];
      if (isNotable) {
        const lbl = d.tourists >= 1000000
          ? `${(d.tourists / 1000000).toFixed(1)}M`
          : `${(d.tourists / 1000).toFixed(0)}k`;
        chart.append("text")
          .attr("x", cx).attr("y", cy - 10)
          .attr("text-anchor", "middle")
          .style("font-size", "9px").style("font-weight", "700")
          .style("fill", col)
          .style("stroke", "#f8fafc").style("stroke-width", "2px").style("paint-order", "stroke")
          .text(lbl);
      }

      chart.append("circle")
        .attr("cx", cx).attr("cy", cy)
        .attr("r", 5).attr("fill", col).attr("stroke", "#fff").attr("stroke-width", 1.5)
        .style("cursor", "pointer")
        .on("mouseover", function(event) {
          d3.select(this).attr("r", 8);
          tooltip.style("opacity", 1)
            .html(
              `<b style="color:${col}">${d.year}</b><br/>` +
              `Tourists: <b>${d3.format(",")(d.tourists)}</b><br/>` +
              `Period: ${d.period}`
            )
            .style("left", (event.pageX + 12) + "px")
            .style("top",  (event.pageY - 10) + "px");
        })
        .on("mousemove", function(event) {
          tooltip.style("left", (event.pageX + 12) + "px").style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function() {
          d3.select(this).attr("r", 5);
          tooltip.style("opacity", 0);
        });
    });

    // Decade markers
    [1940, 1960, 1980, 2000].forEach(yr => {
      chart.append("line")
        .attr("x1", x(yr)).attr("x2", x(yr)).attr("y1", 0).attr("y2", cH)
        .attr("stroke", palette[0]).attr("stroke-width", 1)
        .attr("stroke-dasharray", "4,4").attr("opacity", 0.25);
    });

    // X axis
    chart.append("g").attr("transform", `translate(0,${cH})`)
      .call(d3.axisBottom(x).tickValues([1921, 1940, 1960, 1980, 2000, 2018]).tickFormat(d3.format("d")))
      .call(g => {
        g.select(".domain").style("stroke", "#e2e8f0");
        g.selectAll("text").style("fill", "#64748b").style("font-size", "10px");
      });

    // Y axis
    chart.append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat(d =>
        d >= 1000000 ? `${(d / 1000000).toFixed(1)}M` :
        d >= 1000    ? `${(d / 1000).toFixed(0)}k`    : d
      ))
      .call(g => {
        g.select(".domain").remove();
        g.selectAll("line").remove();
        g.selectAll("text").style("fill", "#94a3b8").style("font-size", "10px");
      });

    // Axis labels
    svg.append("text")
      .attr("transform", `translate(${margin.left + cW / 2},${H - 4})`)
      .attr("text-anchor", "middle").style("font-size", "11px").style("fill", "#94a3b8")
      .text("Year");
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -(margin.top + cH / 2)).attr("y", 16)
      .attr("text-anchor", "middle").style("font-size", "11px").style("fill", "#94a3b8")
      .text("Patient Arrivals (Frequency)");

    return () => tooltip.remove();
  }, [selPeriod, theme]);

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <svg ref={svgRef} style={{ display:"block", flex:1, minWidth:0, height:430 }} />
      <div style={{ padding:"12px 12px 12px 0" }}>
        <LegendHTML theme={theme} selPeriod={selPeriod} onSelect={onSelect} />
      </div>
    </div>
  );
}

// ─── 3D Chart ─────────────────────────────────────────────────────────────────
function Chart3D({ selPeriod, onSelect, theme }) {
  const mountRef   = useRef(null);
  const overlayRef = useRef(null);
  const palette    = THEMES[theme];
  const color      = d3.scaleOrdinal().domain(PERIODS).range(palette);
  const filtered   = selPeriod === "all" ? DATA : DATA.filter(d => d.period === selPeriod);

  useEffect(() => {
    if (!mountRef.current) return;
    const el = mountRef.current;
    const W  = el.offsetWidth || 620, H = 430;

    const maxT   = d3.max(DATA, d => d.tourists);
    const maxH3D = 10;
    const spanX  = 20;
    const xOf    = yr => ((yr - 1921) / (2018 - 1921)) * spanX - spanX / 2;
    const yOf    = t  => (t / maxT) * maxH3D;

    const scene  = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);

    // ── FIX: pull camera back and up so tallest bars + labels fit ──
    const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 200);
    camera.position.set(0, 12, 22);
    camera.lookAt(0, 3, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    el.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(6, 14, 10); sun.castShadow = true; scene.add(sun);
    const rimL = new THREE.PointLight(new THREE.Color(palette[0]), 0.45, 80);
    rimL.position.set(-10, 6, -6); scene.add(rimL);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xe0e7ff, 0.4));

    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(32, 20),
      new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.9 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    scene.add(new THREE.GridHelper(32, 28, 0xcccccc, 0xe2e8f0));

    const pivot        = new THREE.Group();
    const labelAnchors = [];
    const barW         = 0.55;

    filtered.forEach((d, i) => {
      const bh  = Math.max(0.06, yOf(d.tourists));
      const xp  = xOf(d.year);
      const col = new THREE.Color(color(d.period));

      // Drop shadow
      const sm = new THREE.Mesh(
        new THREE.BoxGeometry(barW, bh * 0.15, barW),
        new THREE.MeshBasicMaterial({ color: 0xbbbbbb, transparent: true, opacity: 0.15 })
      );
      sm.position.set(xp + 0.06, bh * 0.075, 0.06);
      pivot.add(sm);

      // Bar
      const geo  = new THREE.BoxGeometry(barW, bh, barW);
      const mat  = new THREE.MeshStandardMaterial({
        color: col, roughness: 0.22, metalness: 0.45,
        emissive: col, emissiveIntensity: 0.1,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(xp, bh / 2, 0);
      mesh.castShadow = true;
      pivot.add(mesh);

      // Edges
      const eg  = new THREE.EdgesGeometry(geo);
      const edgeLines = new THREE.LineSegments(eg, new THREE.LineBasicMaterial({ color: 0xffffff }));
      edgeLines.position.set(xp, bh / 2, 0);
      pivot.add(edgeLines);

      // Glow cap
      const capC = col.clone().lerp(new THREE.Color(0xffffff), 0.25);
      const cap  = new THREE.Mesh(
        new THREE.BoxGeometry(barW, 0.07, barW),
        new THREE.MeshStandardMaterial({ color: capC, emissive: capC, emissiveIntensity: 1.2, roughness: 0.04, metalness: 1 })
      );
      cap.position.set(xp, bh + 0.035, 0);
      pivot.add(cap);

      // ── FIX: push label anchor higher above bar so it clears the cap ──
      const isNotable = d.tourists >= 500000 || d === filtered[filtered.length - 1];
      if (isNotable) {
        labelAnchors.push({
          x: xp, y: bh + 0.9, z: 0,
          text: d.tourists >= 1000000
            ? `${(d.tourists / 1000000).toFixed(1)}M`
            : `${(d.tourists / 1000).toFixed(0)}k`,
          col: `#${col.getHexString()}`,
          isYear: false,
        });
      }

      // Year labels on first, last, every 20 years
      if (i === 0 || i === filtered.length - 1 || d.year % 20 === 0) {
        labelAnchors.push({
          x: xp, y: -0.75, z: 0,
          text: String(d.year),
          col: "#64748b",
          isYear: true,
        });
      }
    });

    scene.add(pivot);

    // ── FIX: use matrixWorld for correct label projection ──
    pivot.updateMatrixWorld(true);

    let isDragging = false, prevX = 0, prevY = 0;
    let rotX = 0.22, rotY = 0, autoSpin = true;

    const onDown = e => {
      isDragging = true; prevX = e.clientX; prevY = e.clientY;
      autoSpin = false;
      renderer.domElement.style.cursor = "grabbing";
    };
    const onUp   = () => { isDragging = false; renderer.domElement.style.cursor = "grab"; };
    const onMove = e => {
      if (!isDragging) return;
      rotY += (e.clientX - prevX) * 0.006;
      rotX  = Math.max(-0.8, Math.min(0.8, rotX + (e.clientY - prevY) * 0.004));
      prevX = e.clientX; prevY = e.clientY;
    };

    renderer.domElement.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup",   onUp);
    window.addEventListener("mousemove", onMove);
    renderer.domElement.style.cursor = "grab";

    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (autoSpin) rotY += 0.003;
      pivot.rotation.set(rotX, rotY, 0);
      pivot.updateMatrixWorld(true);
      camera.updateMatrixWorld(true);

      if (overlayRef.current) {
        const divs = overlayRef.current.querySelectorAll(".nzlbl");
        divs.forEach((div, i) => {
          if (i >= labelAnchors.length) return;
          const a = labelAnchors[i];
          // ── FIX: apply full matrixWorld (not just rotation euler) ──
          const localPos  = new THREE.Vector3(a.x, a.y, a.z);
          const worldPos  = localPos.applyMatrix4(pivot.matrixWorld);
          const ndc       = worldPos.clone().project(camera);
          const sx        = ( ndc.x * 0.5 + 0.5) * W;
          const sy        = (-ndc.y * 0.5 + 0.5) * H;
          const behind    = ndc.z > 1;
          div.style.left    = `${sx}px`;
          div.style.top     = `${sy}px`;
          div.style.opacity = behind ? "0" : "1";
        });
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      renderer.domElement.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup",   onUp);
      window.removeEventListener("mousemove", onMove);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [selPeriod, theme]);

  // Build HTML label list that mirrors labelAnchors exactly
  const labelItems = (() => {
    const items = [];
    filtered.forEach((d, i) => {
      const col = palette[PERIODS.indexOf(d.period) % palette.length];
      const isNotable = d.tourists >= 500000 || d === filtered[filtered.length - 1];
      if (isNotable) {
        items.push(
          <div key={`v-${i}`} className="nzlbl" style={{
            position:"absolute", transform:"translate(-50%,-100%)",
            background:"rgba(255,255,255,0.93)", color: col,
            fontSize:9, fontWeight:"bold", padding:"2px 5px", borderRadius:3,
            border:`1px solid ${col}55`, whiteSpace:"nowrap",
            transition:"opacity 0.08s", pointerEvents:"none",
            boxShadow:"0 1px 3px rgba(0,0,0,0.10)",
          }}>
            {d.tourists >= 1000000
              ? `${(d.tourists / 1000000).toFixed(1)}M`
              : `${(d.tourists / 1000).toFixed(0)}k`}
          </div>
        );
      }
      if (i === 0 || i === filtered.length - 1 || d.year % 20 === 0) {
        items.push(
          <div key={`y-${i}`} className="nzlbl" style={{
            position:"absolute", transform:"translate(-50%,0%)",
            background:"rgba(255,255,255,0.90)", color:"#64748b",
            fontSize:9, fontWeight:"600", padding:"1px 4px", borderRadius:2,
            border:"1px solid #e2e8f0", whiteSpace:"nowrap",
            transition:"opacity 0.08s", pointerEvents:"none",
          }}>
            {d.year}
          </div>
        );
      }
    });
    return items;
  })();

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <div style={{ position:"relative", flex:1, minWidth:0 }}>
        <div ref={mountRef} style={{ width:"100%", height:430, cursor:"grab" }} />
        <div ref={overlayRef} style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
          {labelItems}
        </div>
        <div style={{ padding:"7px 14px", background:"#f8fafc", borderTop:"1px solid #e2e8f0", fontSize:11, color:"#94a3b8" }}>
          💡 Drag to rotate · auto-spins until you interact · NZ tourist arrivals 1921–2018
        </div>
      </div>
      <div style={{ padding:"12px 12px 12px 0" }}>
        <LegendHTML theme={theme} selPeriod={selPeriod} onSelect={onSelect} />
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const NewZealandTourismChart = () => {
  const [viewMode,  setViewMode]  = useState("2d");
  const [theme,     setTheme]     = useState("Modern");
  const [selPeriod, setSelPeriod] = useState("all");

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
      <div style={{ marginBottom:4 }}>
        <div style={{ fontSize:16, fontWeight:"bold", color:"#1e293b" }}>New Zealand Tourist Arrivals</div>
        <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>
          1921–2018 · 100+ years of tourism history · click a period to filter
        </div>
      </div>

      <div style={{ display:"flex", gap:10, alignItems:"flex-end", marginTop:12, marginBottom:16, flexWrap:"wrap" }}>
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
        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
          <label style={{ fontSize:11, color:"#94a3b8", fontWeight:"600" }}>Period Filter</label>
          <select value={selPeriod} onChange={e => setSelPeriod(e.target.value)} style={ddStyle}>
            <option value="all">All Periods</option>
            {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {viewMode === "2d"
        ? <Chart2D key={`2d-${theme}-${selPeriod}`} selPeriod={selPeriod} onSelect={setSelPeriod} theme={theme} />
        : <Chart3D key={`3d-${theme}-${selPeriod}`} selPeriod={selPeriod} onSelect={setSelPeriod} theme={theme} />
      }
    </div>
  );
};

export default NewZealandTourismChart;