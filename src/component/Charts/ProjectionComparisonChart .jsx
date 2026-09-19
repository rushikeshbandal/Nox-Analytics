import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as THREE from "three";

const THEMES = {
  Modern:  { actual: "#6366f1", projected: "#06b6d4", today: "#ef4444" },
  Neon:    { actual: "#ff0080", projected: "#00f5ff", today: "#39ff14" },
  Pastel:  { actual: "#a5b4fc", projected: "#67e8f9", today: "#fca5a5" },
  Sunset:  { actual: "#ff6b6b", projected: "#feca57", today: "#1dd1a1" },
  Ocean:   { actual: "#0096c7", projected: "#48cae4", today: "#ef4444" },
  Galaxy:  { actual: "#7b2cbf", projected: "#c77dff", today: "#ef4444" },
  Forest:  { actual: "#40916c", projected: "#95d5b2", today: "#ef4444" },
  Autumn:  { actual: "#9d0208", projected: "#e63946", today: "#ffd166" },
  Candy:   { actual: "#8338ec", projected: "#ff006e", today: "#06d6a0" },
  Earth:   { actual: "#6b4f3c", projected: "#3a7d44", today: "#ef4444" },
};

// ─── Shared Legend ────────────────────────────────────────────────────────────
function LegendHTML({ theme }) {
  const t = THEMES[theme];
  return (
    <div style={{
      background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8,
      padding: "12px 14px", width: 150, flexShrink: 0,
      boxShadow: "0 1px 4px rgba(0,0,0,0.07)", alignSelf: "flex-start",
    }}>
      <div style={{
        fontSize: 10, fontWeight: "bold", color: "#94a3b8",
        letterSpacing: "0.08em", marginBottom: 10,
      }}>
        LEGEND
      </div>
      {[
        { col: t.actual,    label: "Actual temp",   dash: false },
        { col: t.projected, label: "Forecast temp", dash: true  },
        { col: t.today,     label: "Today",         dash: true  },
      ].map(({ col, label, dash }) => (
        <div key={label} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
          <div style={{
            width: 22, height: 3, flexShrink: 0,
            background: dash ? "none" : col,
            borderTop: dash ? `2px dashed ${col}` : "none",
            borderRadius: 2,
          }} />
          <span style={{ color:"#334155", fontSize:11 }}>{label}</span>
        </div>
      ))}
      <div style={{ borderTop:"1px solid #e2e8f0", marginTop:8, paddingTop:8 }}>
        <div style={{ fontSize:9, color:"#94a3b8" }}>
          Pune, India · Open-Meteo API
        </div>
      </div>
    </div>
  );
}

// ─── 2D Chart ─────────────────────────────────────────────────────────────────
function Chart2D({ data, theme }) {
  const svgRef = useRef(null);
  const t      = THEMES[theme];

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const W = 620, H = 380;
    const margin = { top:20, right:20, bottom:52, left:48 };
    const cW = W - margin.left - margin.right;
    const cH = H - margin.top  - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox",`0 0 ${W} ${H}`).attr("preserveAspectRatio","xMidYMid meet");
    svg.append("rect").attr("width",W).attr("height",H).attr("fill","#f8fafc").attr("rx",8);

    const temps = data.flatMap(d => [d.actual, d.projected]).filter(v => v != null);
    const x     = d3.scaleTime().domain(d3.extent(data, d => d.date)).range([0, cW]);
    const y     = d3.scaleLinear()
      .domain([d3.min(temps)-2, d3.max(temps)+3])
      .range([cH, 0]).nice();

    const chart = svg.append("g").attr("transform",`translate(${margin.left},${margin.top})`);

    // Grid
    y.ticks(5).forEach(v => {
      chart.append("line")
        .attr("x1",0).attr("x2",cW).attr("y1",y(v)).attr("y2",y(v))
        .attr("stroke","#e2e8f0").attr("stroke-dasharray","4,3").attr("stroke-width",1);
    });

    // Tooltip
    const tooltip = d3.select("body").append("div")
      .style("position","absolute").style("background","rgba(15,23,42,0.92)")
      .style("color","#fff").style("padding","7px 11px").style("border-radius","6px")
      .style("font-size","12px").style("pointer-events","none").style("opacity",0)
      .style("border","1px solid #334155").style("z-index","9999");

    // Shaded area under actual
    const actualData = data.filter(d => d.actual != null);
    chart.append("path")
      .datum(actualData)
      .attr("fill", t.actual).attr("opacity",0.1)
      .attr("d", d3.area()
        .x(d => x(d.date)).y0(cH).y1(d => y(d.actual))
        .curve(d3.curveMonotoneX));

    // Actual line
    chart.append("path")
      .datum(actualData)
      .attr("fill","none").attr("stroke",t.actual).attr("stroke-width",2.5)
      .attr("d", d3.line().x(d=>x(d.date)).y(d=>y(d.actual)).curve(d3.curveMonotoneX));

    // Projected dashed line
    const projData = data.filter(d => d.projected != null);
    chart.append("path")
      .datum(projData)
      .attr("fill","none").attr("stroke",t.projected).attr("stroke-width",2.5)
      .attr("stroke-dasharray","7,4")
      .attr("d", d3.line().x(d=>x(d.date)).y(d=>y(d.projected)).curve(d3.curveMonotoneX));

    // Dots + labels
    const drawPoints = (pts, col, key) => {
      pts.forEach(d => {
        const px = x(d.date), py = y(d[key]);
        chart.append("circle")
          .attr("cx",px).attr("cy",py).attr("r",4.5)
          .attr("fill",col).attr("stroke","#fff").attr("stroke-width",1.2)
          .style("cursor","pointer")
          .on("mouseover", function(event) {
            d3.select(this).attr("r",7);
            tooltip.style("opacity",1)
              .html(
                `<b style="color:${col}">${d3.timeFormat("%d %b")(d.date)}</b><br/>` +
                `${key==="actual"?"Actual":"Forecast"}: <b>${d[key].toFixed(1)}°C</b>`
              )
              .style("left",(event.pageX+12)+"px").style("top",(event.pageY-10)+"px");
          })
          .on("mouseout", function() {
            d3.select(this).attr("r",4.5);
            tooltip.style("opacity",0);
          });

        chart.append("text")
          .attr("x",px).attr("y",py-9)
          .attr("text-anchor","middle")
          .style("font-size","9px").style("font-weight","700")
          .style("fill",col).style("pointer-events","none")
          .text(`${d[key].toFixed(1)}°`);
      });
    };
    drawPoints(actualData, t.actual,    "actual");
    drawPoints(projData,   t.projected, "projected");

    // Today vertical line
    const today = new Date(); today.setHours(0,0,0,0);
    const todayX = x(today);
    chart.append("line")
      .attr("x1",todayX).attr("x2",todayX).attr("y1",0).attr("y2",cH)
      .attr("stroke",t.today).attr("stroke-width",1.5).attr("stroke-dasharray","5,4");
    chart.append("text")
      .attr("x",todayX+4).attr("y",10)
      .style("font-size","9px").style("font-weight","700").style("fill",t.today)
      .text("Today");

    // X axis
    chart.append("g").attr("transform",`translate(0,${cH})`)
      .call(d3.axisBottom(x).ticks(data.length).tickFormat(d3.timeFormat("%d %b")))
      .call(g => {
        g.select(".domain").style("stroke","#e2e8f0");
        g.selectAll("text")
          .style("fill","#64748b").style("font-size","9px")
          .attr("transform","rotate(-30)").style("text-anchor","end");
      });

    // Y axis
    chart.append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat(d=>`${d}°C`))
      .call(g => {
        g.select(".domain").remove();
        g.selectAll("line").remove();
        g.selectAll("text").style("fill","#94a3b8").style("font-size","10px");
      });

    svg.append("text")
      .attr("transform","rotate(-90)")
      .attr("x",-(margin.top+cH/2)).attr("y",14)
      .attr("text-anchor","middle")
      .style("font-size","11px").style("fill","#94a3b8")
      .text("Temperature (°C)");

    return () => tooltip.remove();
  }, [data, theme]);

  return (
    <div style={{
      display:"flex", gap:12, alignItems:"flex-start",
      width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden",
    }}>
      <svg ref={svgRef} style={{ display:"block", flex:1, minWidth:0, height:380 }} />
      <div style={{ padding:"12px 12px 12px 0" }}>
        <LegendHTML theme={theme} />
      </div>
    </div>
  );
}

// ─── 3D Chart ─────────────────────────────────────────────────────────────────
function Chart3D({ data, theme }) {
  const mountRef   = useRef(null);
  const overlayRef = useRef(null);
  const t          = THEMES[theme];

  useEffect(() => {
    if (!mountRef.current || !data.length) return;
    const el = mountRef.current;
    const W  = el.offsetWidth || 620, H = 380;

    const temps  = data.flatMap(d=>[d.actual,d.projected]).filter(v=>v!=null);
    const xScale = d3.scaleTime().domain(d3.extent(data,d=>d.date)).range([-9,9]);
    const yScale = d3.scaleLinear()
      .domain([d3.min(temps)-2, d3.max(temps)+3])
      .range([0.2, 9]);

    const scene  = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);

    const camera = new THREE.PerspectiveCamera(42, W/H, 0.1, 200);
    // ── FIX 2: position camera to show both rows clearly on first render ──
    camera.position.set(0, 9, 20);
    camera.lookAt(0, 3, 0);

    const renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.shadowMap.enabled = true;
    el.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(6,14,10); sun.castShadow=true; scene.add(sun);
    const rimL = new THREE.PointLight(new THREE.Color(t.actual), 0.5, 80);
    rimL.position.set(-10,6,-6); scene.add(rimL);
    // ── FIX 2: extra fill light from front so bars are bright on first view ──
    const frontL = new THREE.PointLight(0xffffff, 0.5, 80);
    frontL.position.set(0, 8, 20); scene.add(frontL);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xe0e7ff, 0.5));

    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(32,20),
      new THREE.MeshStandardMaterial({ color:0xf1f5f9, roughness:0.9 })
    );
    floor.rotation.x = -Math.PI/2;
    floor.receiveShadow = true;
    scene.add(floor);
    scene.add(new THREE.GridHelper(32, 28, 0xcccccc, 0xe2e8f0));

    const pivot        = new THREE.Group();
    const labelAnchors = [];

    const makeBar = (d, key, col, zOffset) => {
      const bh  = yScale(d[key]);
      const xp  = xScale(d.date);
      const hex = new THREE.Color(col);
      const bw  = 0.55;

      // Shadow
      const sm = new THREE.Mesh(
        new THREE.BoxGeometry(bw, bh*0.12, bw),
        new THREE.MeshBasicMaterial({ color:0xbbbbbb, transparent:true, opacity:0.15 })
      );
      sm.position.set(xp+0.06, bh*0.06, zOffset+0.06);
      pivot.add(sm);

      // Main bar
      const geo = new THREE.BoxGeometry(bw, bh, bw);
      const mat = new THREE.MeshStandardMaterial({
        color: hex,
        roughness: 0.22,
        metalness: 0.45,
        emissive: hex,
        // ── FIX 2: higher emissiveIntensity so color is vivid without needing hover ──
        emissiveIntensity: 0.25,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(xp, bh/2, zOffset);
      mesh.castShadow = true;
      pivot.add(mesh);

      // Edge outline
      const eg  = new THREE.EdgesGeometry(geo);
      const el2 = new THREE.LineSegments(
        eg,
        new THREE.LineBasicMaterial({ color:0xffffff, transparent:true, opacity:0.5 })
      );
      el2.position.set(xp, bh/2, zOffset);
      pivot.add(el2);

      // Glow cap
      const capCol = hex.clone().lerp(new THREE.Color(0xffffff), 0.3);
      const cap = new THREE.Mesh(
        new THREE.BoxGeometry(bw, 0.07, bw),
        new THREE.MeshStandardMaterial({
          color: capCol, emissive: capCol,
          emissiveIntensity: 1.4, roughness: 0.04, metalness: 1,
        })
      );
      cap.position.set(xp, bh+0.035, zOffset);
      pivot.add(cap);

      // Value label anchor
      labelAnchors.push({
        x:xp, y:bh+0.65, z:zOffset,
        text:`${d[key].toFixed(1)}°`,
        col, isDate:false,
      });
    };

    // ── FIX 1: Build bars first, date labels after — clear separation ──
    const actualData = data.filter(d => d.actual    != null);
    const projData   = data.filter(d => d.projected != null);

    actualData.forEach(d => makeBar(d, "actual",    t.actual,    -0.9));
    projData.forEach(d   => makeBar(d, "projected", t.projected,  0.9));

    // ── FIX 1: Date labels added last, placed carefully below floor ──
    // Only add one label per unique date (no duplicates)
    const seenDates = new Set();
    data.forEach(d => {
      const key = d3.timeFormat("%d%b")(d.date);
      if (seenDates.has(key)) return;
      seenDates.add(key);
      labelAnchors.push({
        x: xScale(d.date), y: -0.65, z: 0,
        text: d3.timeFormat("%d %b")(d.date),
        col: "#64748b", isDate: true,
      });
    });

    // Today plane — contained within bars only, no stray line
    const today  = new Date(); today.setHours(0,0,0,0);
    const todayX = xScale(today);
    const maxBarH = yScale(d3.max(temps));
    const todayMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.07, maxBarH + 1.5),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(t.today),
        transparent: true, opacity: 0.55,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    // ── FIX 1: centre the plane exactly at mid-height so it doesn't extend ──
    todayMesh.position.set(todayX, (maxBarH + 1.5) / 2, 0);
    pivot.add(todayMesh);

    scene.add(pivot);

    const toScreen = (x3,y3,z3) => {
      const v = new THREE.Vector3(x3,y3,z3).project(camera);
      return { sx:(v.x*0.5+0.5)*W, sy:(-v.y*0.5+0.5)*H, behind:v.z>1 };
    };

    // ── FIX 2: start with a slight tilt so both rows are visible immediately ──
    let rotX = 0.30, rotY = 0.0, autoSpin = true, isDragging = false, prevX = 0, prevY = 0;
    pivot.rotation.x = rotX;
    pivot.rotation.y = rotY;

    const onDown = e => {
      isDragging=true; prevX=e.clientX; prevY=e.clientY;
      autoSpin=false;
      renderer.domElement.style.cursor="grabbing";
    };
    const onUp = () => {
      isDragging=false;
      renderer.domElement.style.cursor="grab";
    };
    const onMove = e => {
      if (!isDragging) return;
      rotY += (e.clientX-prevX)*0.006;
      rotX  = Math.max(-0.8, Math.min(0.8, rotX+(e.clientY-prevY)*0.004));
      prevX=e.clientX; prevY=e.clientY;
    };
    renderer.domElement.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup",   onUp);
    window.addEventListener("mousemove", onMove);
    renderer.domElement.style.cursor = "grab";

    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      // ── FIX 1: single clean assignment, no duplicate ──
      if (autoSpin) rotY += 0.003;
      pivot.rotation.y = rotY;
      pivot.rotation.x = rotX;
      camera.updateMatrixWorld();

      if (overlayRef.current) {
        overlayRef.current.querySelectorAll(".pclbl").forEach((div, i) => {
          const a      = labelAnchors[i];
          const rotVec = new THREE.Vector3(a.x,a.y,a.z).applyEuler(pivot.rotation);
          const { sx,sy,behind } = toScreen(rotVec.x,rotVec.y,rotVec.z);
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
  }, [data, theme]);

  // Mirror label list for JSX
  const temps  = data.flatMap(d=>[d.actual,d.projected]).filter(v=>v!=null);
  const jsxLabels = [];
  if (data.length && temps.length) {
    data.filter(d=>d.actual!=null).forEach(d =>
      jsxLabels.push({ text:`${d.actual.toFixed(1)}°`,    col:t.actual,    isDate:false }));
    data.filter(d=>d.projected!=null).forEach(d =>
      jsxLabels.push({ text:`${d.projected.toFixed(1)}°`, col:t.projected, isDate:false }));
    const seenDates = new Set();
    data.forEach(d => {
      const key = d3.timeFormat("%d%b")(d.date);
      if (seenDates.has(key)) return;
      seenDates.add(key);
      jsxLabels.push({ text:d3.timeFormat("%d %b")(d.date), col:"#64748b", isDate:true });
    });
  }

  return (
    <div style={{
      display:"flex", gap:12, alignItems:"flex-start",
      width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden",
    }}>
      <div style={{ position:"relative", flex:1, minWidth:0 }}>
        <div ref={mountRef} style={{ width:"100%", height:380, cursor:"grab" }} />

        <div ref={overlayRef} style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
          {jsxLabels.map((a,i) => (
            <div key={i} className="pclbl" style={{
              position:  "absolute",
              transform: a.isDate ? "translate(-50%,0%)" : "translate(-50%,-100%)",
              background: a.isDate ? "rgba(255,255,255,0.90)" : "rgba(255,255,255,0.93)",
              color: a.col,
              fontSize:   a.isDate ? 9 : 10,
              fontWeight: "bold",
              padding:"2px 5px", borderRadius:3,
              border: a.isDate ? "1px solid #e2e8f0" : `1px solid ${a.col}55`,
              whiteSpace:"nowrap", transition:"opacity 0.1s", pointerEvents:"none",
              boxShadow:"0 1px 3px rgba(0,0,0,0.08)",
            }}>
              {a.text}
            </div>
          ))}
        </div>

        <div style={{
          padding:"7px 14px", background:"#f8fafc",
          borderTop:"1px solid #e2e8f0", fontSize:11, color:"#94a3b8",
        }}>
          💡 Drag to rotate · auto-spins · Front row = Actual · Back row = Forecast
        </div>
      </div>

      <div style={{ padding:"12px 12px 12px 0" }}>
        <LegendHTML theme={theme} />
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const ProjectionComparisonChart = () => {
  const [viewMode, setViewMode] = useState("2d");
  const [theme,    setTheme]    = useState("Modern");
  const [data,     setData]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [dataInfo, setDataInfo] = useState("");

  useEffect(() => {
    fetch("https://api.open-meteo.com/v1/forecast?latitude=18.52&longitude=73.86&daily=temperature_2m_max&timezone=auto&forecast_days=12")
      .then(r => r.json())
      .then(json => {
        const today = new Date(); today.setHours(0,0,0,0);
        const rows  = [];
        for (let i=0; i<7; i++) {
          const d = new Date(today); d.setDate(today.getDate()-6+i);
          rows.push({ date:d, actual:+json.daily.temperature_2m_max[i].toFixed(1), projected:null });
        }
        for (let i=7; i<12; i++) {
          const d = new Date(today); d.setDate(today.getDate()+(i-6));
          rows.push({ date:d, actual:null, projected:+json.daily.temperature_2m_max[i].toFixed(1) });
        }
        setData(rows);
        setDataInfo("Pune, India · Open-Meteo API");
        setLoading(false);
      })
      .catch(() => {
        const today = new Date(); today.setHours(0,0,0,0);
        const base  = [28,30,32,31,29,27,26,28,30,33,31,29];
        const rows  = [];
        for (let i=0; i<7; i++) {
          const d = new Date(today); d.setDate(today.getDate()-6+i);
          rows.push({ date:d, actual:base[i], projected:null });
        }
        for (let i=7; i<12; i++) {
          const d = new Date(today); d.setDate(today.getDate()+(i-6));
          rows.push({ date:d, actual:null, projected:base[i] });
        }
        setData(rows);
        setDataInfo("Sample data (API unavailable)");
        setLoading(false);
      });
  }, []);

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
        <div style={{ fontSize:16, fontWeight:"bold", color:"#1e293b" }}>
          Projection Comparison Chart
        </div>
        <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>
          Past 7 days actual vs next 5 days forecast · {dataInfo}
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

      <div style={{ minHeight:380 }}>
        {loading ? (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
            height:380, color:"#94a3b8", fontSize:15 }}>
            Loading data…
          </div>
        ) : viewMode === "2d" ? (
          <Chart2D key={`2d-${theme}`} data={data} theme={theme} />
        ) : (
          <Chart3D key={`3d-${theme}`} data={data} theme={theme} />
        )}
      </div>
    </div>
  );
};

export default ProjectionComparisonChart;