import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as THREE from "three";

const UI_THEMES = {
  Light: { bg:"#ffffff", chartBg:"#f8fafc", text:"#1e293b", axis:"#64748b", grid:"#e2e8f0", card:"#ffffff", border:"#e2e8f0", subtext:"#94a3b8", threeBg:0xf8fafc },
  Dark:  { bg:"#0f172a", chartBg:"#1e293b", text:"#f1f5f9", axis:"#94a3b8", grid:"#334155", card:"#1e293b", border:"#334155", subtext:"#64748b", threeBg:0x0f172a },
};

const COLOR_THEMES = {
  Blue:   { fill:"#c7d7e6", stroke:"#3b5b7a" },
  Green:  { fill:"#bbf7d0", stroke:"#15803d" },
  Purple: { fill:"#e9d5ff", stroke:"#7c3aed" },
  Orange: { fill:"#fed7aa", stroke:"#c2410c" },
  Teal:   { fill:"#99f6e4", stroke:"#0f766e" },
};

// ── Parse CSV ─────────────────────────────────────────────────────────────────
function parseTraffic(raw) {
  const parse = d3.timeParse("%Y-%m-%dT%H:%M:%S");
  const traffic = raw
    .map(d => ({
      date:  parse(d.date.replace("Z","")),
      name:  d.name,
      value: +d.value,
    }))
    .filter(d => d.date instanceof Date && !isNaN(d.value));

  const dates = Array.from(d3.group(traffic, d => +d.date).keys()).sort(d3.ascending);
  const series = d3.groups(traffic, d => d.name).map(([name, values]) => {
    const map = new Map(values.map(d => [+d.date, d.value]));
    return { name, values: dates.map(d => map.get(d) ?? 0) };
  });

  return { traffic, dates, series };
}

// ─── Stats Panel ──────────────────────────────────────────────────────────────
function StatsPanel({ series, dates, theme, colorTheme }) {
  const T   = UI_THEMES[theme];
  const COL = COLOR_THEMES[colorTheme];
  if (!series || !series.length) return null;

  const topLoc   = d3.greatest(series, s => d3.max(s.values));
  const lowLoc   = d3.least(series,    s => d3.max(s.values));
  const allVals  = series.flatMap(s => s.values.filter(v => v > 0));
  const avgVal   = d3.mean(allVals).toFixed(0);
  const maxVal   = d3.max(allVals);

  const card = (label, value, sub, col) => (
    <div style={{
      background:T.card, border:`1px solid ${T.border}`,
      borderRadius:8, padding:"10px 12px", marginBottom:8,
      borderLeft:`3px solid ${col}`,
    }}>
      <div style={{ fontSize:10, color:T.subtext, fontWeight:600, marginBottom:3 }}>{label}</div>
      <div style={{ fontSize:13, fontWeight:700, color:col, whiteSpace:"nowrap" }}>{value}</div>
      {sub && <div style={{ fontSize:10, color:T.subtext, marginTop:2 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ width:175, flexShrink:0 }}>
      <div style={{ fontSize:10, fontWeight:"bold", color:T.subtext, letterSpacing:"0.08em", marginBottom:8 }}>STATS</div>
      {topLoc && card("🏆 Busiest Location", topLoc.name, `Peak: ${d3.max(topLoc.values)}`, COL.stroke)}
      {lowLoc && card("🔇 Quietest Location", lowLoc.name, `Peak: ${d3.max(lowLoc.values)}`, COL.fill.length > 4 ? COL.fill : "#94a3b8")}
      {card("📍 Locations", `${series.length}`, "tracked in chart", "#6366f1")}
      {card("📊 Avg Traffic", avgVal, "across all locations", "#8b5cf6")}
      {card("🔥 Peak Traffic", maxVal, "highest hourly value", "#ef4444")}

      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:"10px 12px" }}>
        <div style={{ fontSize:10, color:T.subtext, fontWeight:600, marginBottom:8 }}>COLOR SCHEMES</div>
        {Object.entries(COLOR_THEMES).map(([k, v]) => (
          <div key={k} style={{ marginBottom:7 }}>
            <div style={{ fontSize:10, color:T.text, marginBottom:3, fontWeight:k===colorTheme?"700":"400" }}>{k}</div>
            <div style={{ display:"flex", gap:3 }}>
              <div style={{ flex:3, height:6, borderRadius:3, background:v.fill,   opacity:k===colorTheme?1:0.4 }} />
              <div style={{ flex:1, height:6, borderRadius:3, background:v.stroke, opacity:k===colorTheme?1:0.4 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 2D Chart — label alignment fixed ─────────────────────────────────────────
function Chart2D({ theme, colorTheme, onParsed }) {
  const wrapRef = useRef(null);
  const T   = UI_THEMES[theme];
  const COL = COLOR_THEMES[colorTheme];

  useEffect(() => {
    if (!wrapRef.current) return;

    d3.csv("/traffic.csv", d => ({
      date:  d.date,
      name:  d.name,
      value: +d.value,
    })).then(raw => {
      const { traffic, dates, series } = parseTraffic(raw);
      if (!series.length) return;
      onParsed({ series, dates });

      const overlap = 8;
      const W       = wrapRef.current.clientWidth || 680;
      // ── FIX: enough height so each ridge has space ─────────────────────────
      const rowH    = 28;
      const margin  = { top:44, right:20, bottom:16, left:148 };
      const H       = series.length * rowH + margin.top + margin.bottom;

      d3.select(wrapRef.current).selectAll("*").remove();

      const x = d3.scaleTime()
        .domain(d3.extent(dates))
        .range([margin.left, W - margin.right]);

      const y = d3.scalePoint()
        .domain(series.map(d => d.name))
        .range([margin.top, H - margin.bottom])
        .padding(0.4);

      const z = d3.scaleLinear()
        .domain([0, d3.max(series, d => d3.max(d.values))]).nice()
        .range([0, -overlap * y.step()]);

      const area = d3.area()
        .curve(d3.curveBasis)
        .defined(d => d > 0)
        .x((d, i) => x(dates[i]))
        .y0(0).y1(d => z(d));

      const line = area.lineY1();

      const svg = d3.select(wrapRef.current).append("svg")
        .attr("width", W).attr("height", H)
        .style("background", T.chartBg).style("border-radius","8px");

      // Tooltip
      const tooltip = d3.select("body").append("div")
        .style("position","absolute").style("background","rgba(15,23,42,0.92)")
        .style("color","#fff").style("padding","8px 12px").style("border-radius","6px")
        .style("font-size","12px").style("pointer-events","none").style("opacity",0)
        .style("border",`1.5px solid ${COL.stroke}`).style("z-index","9999").style("line-height","1.7");

      // X axis (top)
      svg.append("g")
        .attr("transform",`translate(0,${margin.top - 10})`)
        .call(d3.axisTop(x).ticks(W/90).tickSizeOuter(0))
        .call(g => {
          g.select(".domain").remove();
          g.selectAll("text").style("fill",T.axis).style("font-size","10px");
          g.selectAll("line").style("stroke",T.grid);
        });

      // ── FIX: Left labels — proper alignment with actual y position ─────────
      svg.append("g")
        .attr("transform",`translate(${margin.left},0)`)
        .call(
          d3.axisLeft(y)
            .tickSize(0)
            .tickPadding(8)
        )
        .call(g => {
          g.select(".domain").remove();
          g.selectAll("text")
            .style("fill", T.text)
            .style("font-size","10px")
            .style("font-weight","500")
            .attr("text-anchor","end");
        });

      // Ridges
      const g = svg.append("g")
        .selectAll("g").data(series).join("g")
        .attr("transform", d => `translate(0,${y(d.name)})`);

      // Grid line per ridge
      g.append("line")
        .attr("x1",margin.left).attr("x2",W-margin.right)
        .attr("stroke",T.grid).attr("stroke-width",0.5).attr("opacity",0.5);

      // Fill area
      g.append("path")
        .attr("fill", COL.fill).attr("fill-opacity",0.82)
        .attr("d", d => area(d.values))
        .style("cursor","pointer")
        .on("mouseover", function(event, d) {
          d3.select(this).attr("fill-opacity",1);
          tooltip.style("opacity",1)
            .html(`<b style="color:${COL.stroke}">${d.name}</b><br/>Peak: <b>${d3.max(d.values)}</b>`);
        })
        .on("mousemove", e => tooltip.style("left",(e.pageX+12)+"px").style("top",(e.pageY-10)+"px"))
        .on("mouseout", function() { d3.select(this).attr("fill-opacity",0.82); tooltip.style("opacity",0); });

      // Stroke line
      g.append("path")
        .attr("fill","none")
        .attr("stroke", COL.stroke)
        .attr("stroke-width",1.2)
        .attr("d", d => line(d.values));

      // Y label
      svg.append("text")
        .attr("x",margin.left-4).attr("y",margin.top-20)
        .attr("text-anchor","end").attr("fill",T.text)
        .attr("font-size","11px").attr("font-weight","600")
        .text("Location");

      return () => tooltip.remove();
    });
  }, [theme, colorTheme]);

  return <div ref={wrapRef} style={{ border:`1px solid ${T.border}`, borderRadius:8, overflow:"hidden", width:"100%", overflowY:"auto" }} />;
}

// ─── 3D Chart — AxesHelper removed ────────────────────────────────────────────
function Chart3D({ theme, colorTheme }) {
  const mountRef   = useRef(null);
  const overlayRef = useRef(null);
  const T   = UI_THEMES[theme];
  const COL = COLOR_THEMES[colorTheme];

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);

    let animId, renderer, cleanupFn;

    const init = (W) => {
      if (renderer) return;
      const H = 500;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(T.threeBg);

      const camera = new THREE.PerspectiveCamera(42, W/H, 0.1, 200);
      camera.position.set(0, 0, 26); camera.lookAt(0, 0, 0);

      renderer = new THREE.WebGLRenderer({ antialias:true });
      renderer.setSize(W, H);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.domElement.style.display    = "block";
      renderer.domElement.style.outline    = "none";
      renderer.domElement.style.userSelect = "none";
      el.appendChild(renderer.domElement);

      // Lights — NO AxesHelper
      scene.add(new THREE.AmbientLight(0xffffff, 0.80));
      const sun = new THREE.DirectionalLight(0xffffff, 1.0);
      sun.position.set(6,14,10); sun.castShadow=true; scene.add(sun);
      scene.add(new THREE.HemisphereLight(0xffffff, 0xe0e7ff, 0.45));

      // Floor + clean grid — NO AxesHelper
      const floorC = theme==="Dark" ? 0x1e293b : 0xf1f5f9;
      const gridC  = theme==="Dark" ? 0x334155 : 0xe2e8f0;
      const floor  = new THREE.Mesh(new THREE.PlaneGeometry(36, 28),
        new THREE.MeshStandardMaterial({ color:floorC, roughness:0.9 }));
      floor.rotation.x = -Math.PI/2; floor.position.y = -8;
      floor.receiveShadow = true; scene.add(floor);
      const grid = new THREE.GridHelper(36, 28, gridC, gridC);
      grid.position.y = -7.95; scene.add(grid);

      const pivot        = new THREE.Group();
      const labelAnchors = [];

      d3.csv("/traffic.csv", d => ({
        date:  d.date,
        name:  d.name,
        value: +d.value,
      })).then(raw => {
        const { dates, series } = parseTraffic(raw);
        if (!series.length) return;

        const dateExtent = d3.extent(dates);
        const maxVal     = d3.max(series, s => d3.max(s.values));

        const xScale = d3.scaleTime().domain(dateExtent).range([-9, 9]);
        const yScale = d3.scaleLinear().domain([0, maxVal]).nice().range([0, 6]);

        // Z: each ridge at different depth
        const N      = series.length;
        const zGap   = 0.55;
        const startZ = -(N-1)/2 * zGap;

        const fillCol   = new THREE.Color(COL.fill);
        const strokeCol = new THREE.Color(COL.stroke);

        series.forEach((s, si) => {
          const z = startZ + si * zGap;

          // Base Y at floor
          const baseY = -7.5;

          // Tubes for ridge line
          const pts = s.values
            .map((v, i) => ({ x: xScale(dates[i]), y: v > 0 ? yScale(v) + baseY : baseY }));

          for (let i = 0; i < pts.length - 1; i++) {
            if (pts[i].y === baseY && pts[i+1].y === baseY) continue;
            const p1 = new THREE.Vector3(pts[i].x,   pts[i].y,   z);
            const p2 = new THREE.Vector3(pts[i+1].x, pts[i+1].y, z);

            // Area face fill
            const b1 = new THREE.Vector3(pts[i].x,   baseY, z);
            const b2 = new THREE.Vector3(pts[i+1].x, baseY, z);
            const geo = new THREE.BufferGeometry();
            geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array([
              p1.x,p1.y,p1.z, b1.x,b1.y,b1.z, p2.x,p2.y,p2.z,
              b1.x,b1.y,b1.z, b2.x,b2.y,b2.z, p2.x,p2.y,p2.z,
            ]),3));
            geo.computeVertexNormals();
            pivot.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
              color:fillCol, roughness:0.4, metalness:0.1,
              transparent:true, opacity:0.55, side:THREE.DoubleSide,
            })));

            // Stroke tube on top
            pivot.add(new THREE.Mesh(
              new THREE.TubeGeometry(new THREE.LineCurve3(p1,p2), 3, 0.04, 5, false),
              new THREE.MeshStandardMaterial({
                color:strokeCol, roughness:0.22, metalness:0.45,
                emissive:strokeCol, emissiveIntensity:0.18,
                transparent:true, opacity:0.90,
              })
            ));
          }

          // Peak glow dot
          const peakIdx = s.values.indexOf(d3.max(s.values));
          if (peakIdx >= 0) {
            const px = xScale(dates[peakIdx]);
            const py = yScale(s.values[peakIdx]) + baseY;
            const dot = new THREE.Mesh(
              new THREE.SphereGeometry(0.14, 12, 12),
              new THREE.MeshStandardMaterial({ color:strokeCol, roughness:0.1, metalness:0.6, emissive:strokeCol, emissiveIntensity:0.6 })
            );
            dot.position.set(px, py, z); pivot.add(dot);
          }

          // Location label at left edge
          const firstPt = pts.find(p => p.y > baseY);
          labelAnchors.push({
            pos:  new THREE.Vector3(-9.8, baseY + 0.3, z),
            text: s.name.length > 14 ? s.name.slice(0,14)+"…" : s.name,
            type: "name",
          });
        });

        // Date labels (bottom)
        const step = Math.max(1, Math.floor(dates.length / 8));
        dates.filter((_,i) => i % step === 0).forEach(d => {
          labelAnchors.push({
            pos:  new THREE.Vector3(xScale(d), -8.4, 0),
            text: d3.timeFormat("%H:%M")(new Date(d)),
            type: "date",
          });
        });

        // Value labels Y
        yScale.ticks(4).forEach(v => {
          labelAnchors.push({
            pos:  new THREE.Vector3(-10.5, yScale(v) - 7.5, 0),
            text: `${v}`,
            type: "val",
          });
        });

        scene.add(pivot);

        if (overlayRef.current) {
          const divs = overlayRef.current.querySelectorAll(".shlbl");
          labelAnchors.forEach((a,i) => { if(divs[i]) divs[i].textContent = a.text; });
        }

        const toScreen = v3 => {
          const v = v3.clone().project(camera);
          return { sx:(v.x*0.5+0.5)*W, sy:(-v.y*0.5+0.5)*H, behind:v.z>1 };
        };

        let isDragging=false, prevX=0, prevY=0, rotX=0.25, rotY=0.4, autoSpin=true;
        pivot.rotation.x=rotX; pivot.rotation.y=rotY;

        const onDown=e=>{e.preventDefault();isDragging=true;prevX=e.clientX;prevY=e.clientY;autoSpin=false;renderer.domElement.style.cursor="grabbing";};
        const onUp=()=>{isDragging=false;renderer.domElement.style.cursor="grab";};
        const onMove=e=>{
          if(!isDragging) return;
          rotY+=(e.clientX-prevX)*0.007;
          rotX=Math.max(-0.6,Math.min(0.6,rotX+(e.clientY-prevY)*0.004));
          prevX=e.clientX;prevY=e.clientY;
        };

        renderer.domElement.addEventListener("mousedown",onDown);
        window.addEventListener("mouseup",onUp);
        window.addEventListener("mousemove",onMove);
        renderer.domElement.style.cursor="grab";

        const animate=()=>{
          animId=requestAnimationFrame(animate);
          if(autoSpin) rotY+=0.003;
          pivot.rotation.y=rotY; pivot.rotation.x=rotX;
          camera.updateMatrixWorld();
          if(overlayRef.current){
            overlayRef.current.querySelectorAll(".shlbl").forEach((div,i)=>{
              const a=labelAnchors[i]; if(!a) return;
              const rv=new THREE.Vector3(a.pos.x,a.pos.y,a.pos.z).applyEuler(pivot.rotation);
              const {sx,sy,behind}=toScreen(rv);
              div.style.left=`${sx}px`; div.style.top=`${sy}px`;
              div.style.opacity=behind?"0":"1";
            });
          }
          renderer.render(scene,camera);
        };
        animate();

        cleanupFn=()=>{
          cancelAnimationFrame(animId);
          renderer.domElement.removeEventListener("mousedown",onDown);
          window.removeEventListener("mouseup",onUp);
          window.removeEventListener("mousemove",onMove);
          renderer.dispose();
          if(el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
        };
      });
    };

    const W0=el.clientWidth||el.parentElement?.clientWidth||0;
    if(W0>10){init(W0);}
    else{
      const obs=new ResizeObserver(entries=>{
        const W=entries[0].contentRect.width;
        if(W>10){init(W);obs.disconnect();}
      });
      obs.observe(el);
      return ()=>obs.disconnect();
    }
    return ()=>{if(cleanupFn) cleanupFn();};
  },[theme, colorTheme]);

  // ~N names + 8 dates + 4 vals
  const jsxLabels = Array.from({ length: 50 }, (_,i) => ({
    type: i<30?"name":i<38?"date":"val",
  }));

  return (
    <div style={{ position:"relative", userSelect:"none",
      border:`1px solid ${T.border}`, borderRadius:8, overflow:"hidden", width:"100%" }}>
      <div ref={mountRef} style={{ width:"100%", height:500, cursor:"grab", overflow:"hidden" }} />
      <div ref={overlayRef} style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
        {jsxLabels.map((a,i) => (
          <div key={i} className="shlbl" style={{
            position:  "absolute",
            transform: a.type==="val"?"translate(-100%,-50%)":a.type==="date"?"translate(-50%,0%)":"translate(-100%,-50%)",
            background: theme==="Dark"?"rgba(15,23,42,0.92)":"rgba(255,255,255,0.95)",
            color:      T.text, fontSize:a.type==="name"?9:8, fontWeight:"600",
            padding:    "2px 5px", borderRadius:3, border:`1px solid ${T.border}`,
            whiteSpace: "nowrap", pointerEvents:"none",
            boxShadow:  "0 1px 3px rgba(0,0,0,0.08)", opacity:0,
          }} />
        ))}
      </div>
      <div style={{ padding:"7px 14px", background:T.chartBg,
        borderTop:`1px solid ${T.border}`, fontSize:11, color:T.subtext }}>
        💡 Drag to rotate · auto-spins · Each ridge = one location · Z depth = location order
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function RidgelinePlot() {
  const [viewMode,   setViewMode]   = useState("2d");
  const [theme,      setTheme]      = useState("Light");
  const [colorTheme, setColorTheme] = useState("Blue");
  const [parsed,     setParsed]     = useState({ series:[], dates:[] });

  const T = UI_THEMES[theme];
  const ddStyle = {
    padding:"5px 10px", borderRadius:6, border:`1px solid ${T.border}`,
    background:theme==="Dark"?"#1e293b":"#fff",
    color:T.text, fontWeight:"500", cursor:"pointer", fontSize:12, outline:"none",
  };

  return (
    <div style={{
      background:T.bg, borderRadius:12, padding:"20px 24px 32px 24px",
      width:"100%", boxShadow:"0 1px 3px rgba(0,0,0,0.08)", boxSizing:"border-box",
    }}>
      <div style={{ marginBottom:4 }}>
        <div style={{ fontSize:16, fontWeight:"bold", color:T.text }}>
          Ridgeline Plot – Traffic by Location
        </div>
        <div style={{ fontSize:12, color:T.subtext, marginTop:2 }}>
          Hourly traffic density · Each ridge = one location
        </div>
      </div>

      <div style={{ display:"flex", gap:10, alignItems:"flex-end", marginTop:12, marginBottom:20, flexWrap:"wrap" }}>
        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
          <label style={{ fontSize:11, color:T.subtext, fontWeight:"600" }}>View</label>
          <select value={viewMode} onChange={e=>setViewMode(e.target.value)} style={ddStyle}>
            <option value="2d">2D</option>
            <option value="3d">3D</option>
          </select>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
          <label style={{ fontSize:11, color:T.subtext, fontWeight:"600" }}>Theme</label>
          <select value={theme} onChange={e=>setTheme(e.target.value)} style={ddStyle}>
            <option value="Light">Light</option>
            <option value="Dark">Dark</option>
          </select>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
          <label style={{ fontSize:11, color:T.subtext, fontWeight:"600" }}>Color Theme</label>
          <select value={colorTheme} onChange={e=>setColorTheme(e.target.value)} style={ddStyle}>
            {Object.keys(COLOR_THEMES).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%" }}>
        <div style={{ flex:1, minWidth:0 }}>
          {viewMode==="2d"
            ? <Chart2D key={`2d-${theme}-${colorTheme}`} theme={theme} colorTheme={colorTheme} onParsed={setParsed} />
            : <Chart3D key={`3d-${theme}-${colorTheme}`} theme={theme} colorTheme={colorTheme} />
          }
        </div>
        <StatsPanel series={parsed.series} dates={parsed.dates} theme={theme} colorTheme={colorTheme} />
      </div>
    </div>
  );
}