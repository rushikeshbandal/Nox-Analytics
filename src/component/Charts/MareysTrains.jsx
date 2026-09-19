import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as THREE from "three";

function parseAnyTime(t) {
  if (!t) return null;
  t = t.toString().trim().toUpperCase();
  if (/AM|PM/.test(t) && !t.includes(" ")) t = t.replace(/(AM|PM)/, " $1");
  return d3.timeParse("%I:%M %p")(t);
}

function dirMatch(train, dir) {
  if (dir === "all") return true;
  const v = (train.direction || "").toLowerCase();
  if (dir === "north") return v.startsWith("n");
  if (dir === "south") return v.startsWith("s");
  return true;
}

const THEMES = {
  Modern:  { B:"#6366f1", L:"#06b6d4", N:"#94a3b8", W:"#10b981", S:"#f59e0b" },
  Neon:    { B:"#ff0080", L:"#00f5ff", N:"#39ff14", W:"#ffae00", S:"#ff6bff" },
  Sunset:  { B:"#ff6b6b", L:"#feca57", N:"#1dd1a1", W:"#f368e0", S:"#ff9f43" },
  Ocean:   { B:"#0077b6", L:"#48cae4", N:"#023e8a", W:"#90e0ef", S:"#0096c7" },
  Classic: { B:"#c03e1d", L:"#b77409", N:"#555",    W:"#2563eb", S:"#7c3aed" },
};

// ─── Legend ──────────────────────────────────────────────────────────────────
function LegendHTML({ theme, colors }) {
  return (
    <div style={{
      background:"#fff", border:"1px solid #e2e8f0", borderRadius:8,
      padding:"12px 14px", width:140, flexShrink:0,
      boxShadow:"0 1px 4px rgba(0,0,0,0.07)", alignSelf:"flex-start",
    }}>
      <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:10 }}>
        TRAIN TYPE
      </div>
      {[
        { key:"B", label:"Bullet"  },
        { key:"L", label:"Local"   },
        { key:"N", label:"Normal"  },
        { key:"W", label:"Weekend" },
        { key:"S", label:"Special" },
      ].map(({ key, label }) => (
        <div key={key} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7 }}>
          <div style={{ width:22, height:3, background:colors[key]||"#888", borderRadius:2 }} />
          <span style={{ color:"#334155", fontSize:11 }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── 2D ──────────────────────────────────────────────────────────────────────
function Chart2D({ data, dir, theme }) {
  const svgRef = useRef(null);
  const colors = THEMES[theme];

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const W      = 680;
    const H      = 520;
    // Extra bottom margin for angled station labels
    const margin = { top:20, right:16, bottom:100, left:60 };

    const filtered = data.trains
      .filter(d => dirMatch(d, dir))
      .filter(d => d.stops.length >= 2);

    const x = d3.scaleLinear()
      .domain(d3.extent(data.stations, d => d.distance))
      .range([margin.left, W - margin.right]);

    const start = new Date(2020,0,1,4,0);
    const end   = new Date(2020,0,2,2,0);

    const y = d3.scaleTime()
      .domain([start, end])
      .range([margin.top, H - margin.bottom]);

    const normalizeTime = t => {
      const d = new Date(start);
      d.setHours(t.getHours(), t.getMinutes());
      if (d < start) d.setDate(d.getDate() + 1);
      return d;
    };

    const lineGen = d3.line()
      .x(d => x(d.station.distance))
      .y(d => y(normalizeTime(d.time)));

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", W).attr("height", H);
    svg.append("rect").attr("width",W).attr("height",H).attr("fill","#f8fafc").attr("rx",8);

    // Y grid
    svg.append("g").attr("transform",`translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(10).tickFormat("").tickSize(-(W-margin.left-margin.right)))
      .call(g => {
        g.select(".domain").remove();
        g.selectAll("line").style("stroke","#e2e8f0").style("stroke-dasharray","3,3");
      });

    // Station vertical tick lines (light)
    data.stations.forEach(s => {
      svg.append("line")
        .attr("x1",x(s.distance)).attr("x2",x(s.distance))
        .attr("y1",margin.top).attr("y2",H-margin.bottom)
        .attr("stroke","#e2e8f0").attr("stroke-width",0.8);
    });

    // Tooltip
    const tooltip = d3.select("body").append("div")
      .style("position","absolute").style("background","rgba(15,23,42,0.92)")
      .style("color","#fff").style("padding","8px 12px").style("border-radius","6px")
      .style("font-size","12px").style("pointer-events","none").style("opacity",0)
      .style("border","1px solid #334155").style("z-index","9999");

    // Train lines
    svg.append("g").attr("fill","none")
      .selectAll("path").data(filtered).join("path")
      .attr("d", d => lineGen(d.stops))
      .attr("stroke", d => colors[d.type] || "#888")
      .attr("stroke-width", d => d.type==="B" ? 2.4 : d.type==="L" ? 1.4 : 1.0)
      .attr("opacity", d => d.type==="B" ? 0.85 : 0.60)
      .style("cursor","pointer")
      .on("mouseover", function(event, d) {
        d3.select(this).attr("stroke-width", d.type==="B" ? 3.5 : 2.2).attr("opacity",1);
        const label = { B:"Bullet", L:"Local", W:"Weekend", S:"Special", N:"Normal" };
        tooltip.style("opacity",1)
          .html(
            `<b style="color:${colors[d.type]||'#888'}">${label[d.type]||d.type} Train #${d.number}</b><br/>` +
            `Direction: ${d.direction === "N" ? "Northbound" : d.direction === "S" ? "Southbound" : d.direction}<br/>` +
            `Stops: ${d.stops.length}`
          )
          .style("left",(event.pageX+12)+"px").style("top",(event.pageY-10)+"px");
      })
      .on("mousemove", event => tooltip.style("left",(event.pageX+12)+"px").style("top",(event.pageY-10)+"px"))
      .on("mouseout", function(e, d) {
        d3.select(this).attr("stroke-width", d.type==="B" ? 2.4 : d.type==="L" ? 1.4 : 1.0);
        d3.select(this).attr("opacity", d.type==="B" ? 0.85 : 0.60);
        tooltip.style("opacity",0);
      });

    // ── Y axis (Time) — LEFT side, readable ──────────────────────────────────
    svg.append("g").attr("transform",`translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(10).tickFormat(d3.timeFormat("%-I %p")))
      .call(g => {
        g.select(".domain").remove();
        g.selectAll("text").style("fill","#64748b").style("font-size","10px");
        g.selectAll("line").remove();
      });

    // ── X axis (Distance) — BOTTOM with angled station names ─────────────────
    const xAxis = svg.append("g")
      .attr("transform",`translate(0,${H - margin.bottom})`);

    xAxis.call(
      d3.axisBottom(x)
        .tickValues(data.stations.map(s => s.distance))
        .tickFormat((d, i) => data.stations[i]?.name || "")
        .tickSize(6)
    ).call(g => {
      g.select(".domain").style("stroke","#e2e8f0");
      g.selectAll("line").style("stroke","#e2e8f0");
      g.selectAll("text")
        .style("fill","#334155")
        .style("font-size","9px")
        .style("font-weight","600")
        .attr("transform","rotate(-45)")
        .attr("text-anchor","end")
        .attr("dx","-0.4em")
        .attr("dy","0.1em");
    });

    // X axis label
    svg.append("text")
      .attr("x",(W - margin.right + margin.left)/2).attr("y",H-4)
      .attr("text-anchor","middle").style("font-size","10px").style("fill","#94a3b8")
      .text("← San Francisco · · · · Distance (miles) · · · · Gilroy →");

    return () => tooltip.remove();
  }, [data, dir, theme]);

  return (
    <div style={{ border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden", background:"#f8fafc", padding:8 }}>
      <svg ref={svgRef} style={{ display:"block" }} />
      <div style={{ padding:"5px 8px 0", fontSize:11, color:"#94a3b8" }}>
        💡 Hover line for details · Steeper line = faster train · Y = time of day · X = station distance
      </div>
    </div>
  );
}

// ─── 3D ──────────────────────────────────────────────────────────────────────
function Chart3D({ data, dir, theme }) {
  const mountRef   = useRef(null);
  const overlayRef = useRef(null);
  const colors     = THEMES[theme];

  useEffect(() => {
    const el = mountRef.current;
    if (!el || !data) return;
    while (el.firstChild) el.removeChild(el.firstChild);

    const W = el.clientWidth || 680;
    const H = 500;

    const scene  = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);

    const camera = new THREE.PerspectiveCamera(38, W/H, 0.1, 2000);
    // Better angle: slightly above and to the side
    camera.position.set(0, 0, 26);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.domElement.style.display    = "block";
    renderer.domElement.style.outline    = "none";
    renderer.domElement.style.userSelect = "none";
    el.appendChild(renderer.domElement);

    // Lights — NO AxesHelper
    scene.add(new THREE.AmbientLight(0xffffff, 0.80));
    const sun = new THREE.DirectionalLight(0xffffff, 0.9);
    sun.position.set(8, 16, 12); sun.castShadow=true; scene.add(sun);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xe0e7ff, 0.40));

    // Clean floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(36, 24),
      new THREE.MeshStandardMaterial({ color:0xf1f5f9, roughness:0.9 })
    );
    floor.rotation.x = -Math.PI/2; floor.position.y = -8;
    floor.receiveShadow = true; scene.add(floor);
    const grid = new THREE.GridHelper(36, 28, 0xd1d5db, 0xe5e7eb);
    grid.position.y = -7.95; scene.add(grid);

    const pivot = new THREE.Group();
    const labelAnchors = [];

    const filtered = data.trains
      .filter(d => dirMatch(d, dir))
      .filter(d => d.stops.length >= 2);

    const distExtent = d3.extent(data.stations, s => s.distance);
    const xScale = d3.scaleLinear().domain(distExtent).range([-9, 9]);

    const start  = new Date(2020,0,1,4,0);
    const end    = new Date(2020,0,2,2,0);
    const yScale = d3.scaleTime().domain([start, end]).range([-7, 7]);

    const normalizeTime = t => {
      const d = new Date(start);
      d.setHours(t.getHours(), t.getMinutes());
      if (d < start) d.setDate(d.getDate() + 1);
      return d;
    };

    // Z: northbound positive, southbound negative, with small per-train offset
    const northTrains = filtered.filter(d => d.direction.toLowerCase().startsWith("n"));
    const southTrains = filtered.filter(d => d.direction.toLowerCase().startsWith("s"));
    const otherTrains = filtered.filter(d =>
      !d.direction.toLowerCase().startsWith("n") &&
      !d.direction.toLowerCase().startsWith("s")
    );

    const trainZ = new Map();
    const zSpread = 0.12;
    northTrains.forEach((t, i) => trainZ.set(t.number,  1.5 + i * zSpread));
    southTrains.forEach((t, i) => trainZ.set(t.number, -1.5 - i * zSpread));
    otherTrains.forEach((t, i) => trainZ.set(t.number,  i * 0.08));

    filtered.forEach(train => {
      const z        = trainZ.get(train.number) ?? 0;
      const hex      = colors[train.type] || "#888";
      const col      = new THREE.Color(hex);
      const isBullet = train.type === "B";

      const sortedStops = [...train.stops]
        .sort((a,b) => normalizeTime(a.time) - normalizeTime(b.time));

      for (let si = 0; si < sortedStops.length-1; si++) {
        const s1 = sortedStops[si], s2 = sortedStops[si+1];
        const p1 = new THREE.Vector3(
          xScale(s1.station.distance), yScale(normalizeTime(s1.time)), z
        );
        const p2 = new THREE.Vector3(
          xScale(s2.station.distance), yScale(normalizeTime(s2.time)), z
        );
        const tubeR = isBullet ? 0.055 : 0.030;
        const tube  = new THREE.Mesh(
          new THREE.TubeGeometry(new THREE.LineCurve3(p1,p2), 4, tubeR, 5, false),
          new THREE.MeshStandardMaterial({
            color:col, roughness:0.25, metalness:0.40,
            emissive:col, emissiveIntensity: isBullet ? 0.25 : 0.10,
            transparent:true, opacity: isBullet ? 0.90 : 0.75,
          })
        );
        tube.castShadow = true;
        pivot.add(tube);
      }

      // Dot at first stop
      const fs = sortedStops[0];
      if (fs) {
        const dot = new THREE.Mesh(
          new THREE.SphereGeometry(isBullet ? 0.11 : 0.065, 8, 8),
          new THREE.MeshStandardMaterial({
            color:col, roughness:0.2, metalness:0.5,
            emissive:col, emissiveIntensity:0.5,
          })
        );
        dot.position.set(xScale(fs.station.distance), yScale(normalizeTime(fs.time)), z);
        pivot.add(dot);
      }
    });

    // Station reference lines (thin, subtle)
    data.stations.forEach(s => {
      const xp  = xScale(s.distance);
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(0.025, 14.5, 0.025),
        new THREE.MeshBasicMaterial({ color:0xd1d5db, transparent:true, opacity:0.5 })
      );
      bar.position.set(xp, 0.25, 0);
      pivot.add(bar);
      // Label anchor below chart
      labelAnchors.push({
        pos:  new THREE.Vector3(xp, -8.5, 0),
        text: s.name.split(",")[0], // shorten long names
        type: "station",
      });
    });

    // Direction zone labels
    labelAnchors.push({ pos:new THREE.Vector3(0, 7.8,  2.5), text:"▲ Northbound", type:"dir_n" });
    labelAnchors.push({ pos:new THREE.Vector3(0, 7.8, -2.5), text:"▼ Southbound", type:"dir_s" });

    // Time labels on left edge
    [4,6,8,10,12,14,16,18,20,22].forEach(hr => {
      const d = new Date(2020,0,1,hr,0);
      const norm = normalizeTime(d);
      const label = hr < 12 ? `${hr} AM` : hr === 12 ? "12 PM" : `${hr-12} PM`;
      labelAnchors.push({
        pos:  new THREE.Vector3(-10, yScale(norm), 0),
        text: label,
        type: "time",
      });
    });

    scene.add(pivot);

    // Set overlay text
    if (overlayRef.current) {
      const divs = overlayRef.current.querySelectorAll(".shlbl");
      labelAnchors.forEach((a,i) => { if (divs[i]) divs[i].textContent = a.text; });
    }

    const toScreen = v3 => {
      const v = v3.clone().project(camera);
      return { sx:(v.x*0.5+0.5)*W, sy:(-v.y*0.5+0.5)*H, behind:v.z>1 };
    };

    // Initial angle: slight tilt to show Z depth clearly
    let isDragging=false, prevX=0, prevY=0,
        rotX=0.22, rotY=0.35, autoSpin=true;
    pivot.rotation.x=rotX; pivot.rotation.y=rotY;

    const onDown = e => {
      e.preventDefault(); isDragging=true; prevX=e.clientX; prevY=e.clientY;
      autoSpin=false; renderer.domElement.style.cursor="grabbing";
    };
    const onUp   = () => { isDragging=false; renderer.domElement.style.cursor="grab"; };
    const onMove = e => {
      if (!isDragging) return;
      rotY += (e.clientX-prevX)*0.007;
      rotX  = Math.max(-0.65, Math.min(0.65, rotX+(e.clientY-prevY)*0.004));
      prevX=e.clientX; prevY=e.clientY;
    };

    renderer.domElement.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup",   onUp);
    window.addEventListener("mousemove", onMove);
    renderer.domElement.style.cursor = "grab";

    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (autoSpin) rotY += 0.002;
      pivot.rotation.y=rotY; pivot.rotation.x=rotX;
      camera.updateMatrixWorld();

      if (overlayRef.current) {
        overlayRef.current.querySelectorAll(".shlbl").forEach((div,i) => {
          const a = labelAnchors[i];
          if (!a) return;
          const rv = new THREE.Vector3(a.pos.x,a.pos.y,a.pos.z).applyEuler(pivot.rotation);
          const { sx, sy, behind } = toScreen(rv);
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
  }, [data, dir, theme]);

  // station labels + 2 direction + 10 time labels
  const stCount  = (data?.stations?.length || 26) + 2 + 10;
  const jsxLabels = Array.from({ length: stCount }, (_, i) => {
    const colors = THEMES[theme];
    const isDir  = i >= (data?.stations?.length || 26) && i < (data?.stations?.length || 26) + 2;
    const isTime = i >= (data?.stations?.length || 26) + 2;
    return {
      type:  isTime ? "time" : isDir ? "dir" : "station",
      col:   isDir ? (i % 2 === 0 ? colors.B : colors.L) : "#475569",
    };
  });

  return (
    <div style={{ border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <div style={{ position:"relative", userSelect:"none" }}>
        <div ref={mountRef} style={{ width:"100%", height:500, cursor:"grab", overflow:"hidden" }} />

        <div ref={overlayRef} style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
          {jsxLabels.map((a, i) => (
            <div key={i} className="shlbl" style={{
              position:      "absolute",
              transform:     a.type==="time"
                ? "translate(-100%,-50%)"
                : "translate(-50%,-100%)",
              background:    "rgba(255,255,255,0.92)",
              color:         a.col,
              fontSize:      a.type==="station" ? 8 : a.type==="time" ? 9 : 10,
              fontWeight:    "bold",
              padding:       a.type==="station" ? "1px 4px" : "2px 6px",
              borderRadius:  3,
              border:        "1px solid #e2e8f0",
              whiteSpace:    "nowrap",
              pointerEvents: "none",
              boxShadow:     "0 1px 3px rgba(0,0,0,0.08)",
              opacity:       0,
            }} />
          ))}
        </div>

        <div style={{ padding:"7px 14px", background:"#f8fafc", borderTop:"1px solid #e2e8f0", fontSize:11, color:"#94a3b8" }}>
          💡 Drag to rotate · auto-spins slowly ·
          <span style={{ color:THEMES[theme].B, fontWeight:700, marginLeft:6 }}>■ North</span>
          <span style={{ color:THEMES[theme].L, fontWeight:700, marginLeft:8 }}>■ South</span>
          · Z depth = direction
        </div>
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function MareysTrains() {
  const [data,     setData]     = useState(null);
  const [dir,      setDir]      = useState("all");
  const [viewMode, setViewMode] = useState("2d");
  const [theme,    setTheme]    = useState("Modern");

  useEffect(() => {
    d3.text("/schedule.tsv").then(text => {
      const raw      = d3.tsvParse(text);
      const stations = raw.columns
        .filter(c => c.startsWith("stop|"))
        .map(c => {
          const [, name, distance] = c.split("|");
          return { key:c, name, distance:+distance };
        });
      const trains = raw.map(d => ({
        number:    d.number,
        type:      d.type,
        direction: d.direction || "",
        stops: stations
          .map(s => ({ station:s, time:parseAnyTime(d[s.key]) }))
          .filter(s => s.time),
      }));
      setData({ trains, stations });
    });
  }, []);

  const ddStyle = {
    padding:"5px 10px", borderRadius:6, border:"1px solid #e2e8f0",
    background:"#fff", color:"#334155", fontWeight:"500",
    cursor:"pointer", fontSize:12, outline:"none",
  };

  const colors = THEMES[theme];

  return (
    <div style={{
      background:"#ffffff", borderRadius:12, padding:"20px 24px 32px 24px",
      width:"100%", boxShadow:"0 1px 3px rgba(0,0,0,0.08)", boxSizing:"border-box",
    }}>
      <div style={{ marginBottom:4 }}>
        <div style={{ fontSize:16, fontWeight:"bold", color:"#1e293b" }}>
          Marey's Train Schedule Diagram
        </div>
        <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>
          Time vs Distance · Steeper line = faster train
        </div>
      </div>

      {/* Controls row */}
      <div style={{ display:"flex", gap:10, alignItems:"flex-end", marginTop:12, marginBottom:20, flexWrap:"wrap" }}>
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
          <label style={{ fontSize:11, color:"#94a3b8", fontWeight:"600" }}>Direction</label>
          <select value={dir} onChange={e => setDir(e.target.value)} style={ddStyle}>
            <option value="all">All Directions</option>
            <option value="north">Northbound</option>
            <option value="south">Southbound</option>
          </select>
        </div>
      </div>

      {/* Chart + Legend side by side */}
      <div style={{ minHeight:500 }}>
        {!data ? (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:500, color:"#94a3b8", fontSize:15 }}>
            Loading schedule…
          </div>
        ) : (
          <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
            <div style={{ flex:1, minWidth:0 }}>
              {viewMode === "2d"
                ? <Chart2D key={`2d-${dir}-${theme}`} data={data} dir={dir} theme={theme} />
                : <Chart3D key={`3d-${dir}-${theme}`} data={data} dir={dir} theme={theme} />
              }
            </div>
            {/* Legend always on the RIGHT side */}
            <LegendHTML theme={theme} colors={colors} />
          </div>
        )}
      </div>
    </div>
  );
}