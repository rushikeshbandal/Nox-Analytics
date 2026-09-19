import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as THREE from "three";

const THEMES = {
  Modern:  { actual: "#6366f1", projected: "#06b6d4" },
  Neon:    { actual: "#ff0080", projected: "#00f5ff" },
  Pastel:  { actual: "#a5b4fc", projected: "#67e8f9" },
  Sunset:  { actual: "#ff6b6b", projected: "#feca57" },
  Ocean:   { actual: "#0077b6", projected: "#90e0ef" },
  Galaxy:  { actual: "#7b2cbf", projected: "#c77dff" },
  Forest:  { actual: "#2d6a4f", projected: "#74c69d" },
  Autumn:  { actual: "#9d0208", projected: "#f59e0b" },
  Candy:   { actual: "#8338ec", projected: "#ff006e" },
  Earth:   { actual: "#6b4f3c", projected: "#3a7d44" },
};

const MONTHS = ["Oct 2023","Nov 2023","Dec 2023","Jan 2024","Feb 2024","Mar 2024"];
const CATEGORIES = ["Software Dev","Data Analysis","UI/UX Design","QA","DevOps"];

// Stable seeded data — no random on every render
const buildData = (category) => {
  const seeds = {
    "Software Dev": [[72,68],[78,82],[65,70],[80,75],[85,88],[90,84]],
    "Data Analysis":[[60,65],[70,68],[75,72],[68,74],[72,70],[78,80]],
    "UI/UX Design": [[55,60],[62,58],[70,65],[75,72],[68,71],[80,76]],
    "QA":           [[80,75],[85,80],[78,82],[88,85],[92,90],[95,93]],
    "DevOps":       [[65,70],[72,68],[80,75],[78,82],[85,80],[88,86]],
    "All":          [[66,68],[73,71],[74,73],[78,78],[80,80],[86,84]],
  };
  return MONTHS.map((m, i) => ({
    month: m, category,
    actual:    seeds[category][i][0],
    projected: seeds[category][i][1],
    variance:  seeds[category][i][1] - seeds[category][i][0],
  }));
};

// ─── Shared Legend ────────────────────────────────────────────────────────────
function LegendHTML({ theme, data }) {
  const t = THEMES[theme];
  return (
    <div style={{
      background:"#fff", border:"1px solid #e2e8f0", borderRadius:8,
      padding:"12px 14px", width:155, flexShrink:0,
      boxShadow:"0 1px 4px rgba(0,0,0,0.07)", alignSelf:"flex-start",
    }}>
      <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:10 }}>
        LEGEND
      </div>
      {[
        { col:t.actual,    label:"Actual",    dash:false },
        { col:t.projected, label:"Projected", dash:true  },
      ].map(({ col,label,dash }) => (
        <div key={label} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
          <div style={{
            width:20, height:3, flexShrink:0,
            background: dash ? "none" : col,
            borderTop: dash ? `2px dashed ${col}` : "none",
            borderRadius:2,
          }} />
          <span style={{ color:"#334155", fontSize:11 }}>{label}</span>
        </div>
      ))}

      <div style={{ borderTop:"1px solid #e2e8f0", margin:"10px 0" }} />
      <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:8 }}>
        MONTHLY DATA
      </div>
      {data.map(d => (
        <div key={d.month} style={{ marginBottom:5 }}>
          <div style={{ fontSize:10, fontWeight:"600", color:"#334155" }}>{d.month}</div>
          <div style={{ display:"flex", gap:8, fontSize:9, color:"#64748b" }}>
            <span style={{ color:t.actual    }}>A: {d.actual}%</span>
            <span style={{ color:t.projected }}>P: {d.projected}%</span>
            <span style={{ color: d.variance>=0 ? "#10b981" : "#ef4444" }}>
              {d.variance>=0?"+":""}{d.variance}%
            </span>
          </div>
        </div>
      ))}
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

    const x  = d3.scaleBand().domain(data.map(d=>d.month)).range([0,cW]).padding(0.3);
    const y  = d3.scaleLinear().domain([40,105]).range([cH,0]);
    const cx = d => x(d.month) + x.bandwidth()/2;

    const chart = svg.append("g").attr("transform",`translate(${margin.left},${margin.top})`);

    // Grid
    y.ticks(5).forEach(v => {
      chart.append("line")
        .attr("x1",0).attr("x2",cW).attr("y1",y(v)).attr("y2",y(v))
        .attr("stroke","#e2e8f0").attr("stroke-dasharray","4,3").attr("stroke-width",1);
    });

    // Shaded band between lines
    chart.append("path")
      .datum(data)
      .attr("fill", t.actual).attr("opacity",0.07)
      .attr("d", d3.area()
        .x(d=>cx(d)).y0(d=>y(Math.min(d.actual,d.projected))).y1(d=>y(Math.max(d.actual,d.projected)))
        .curve(d3.curveMonotoneX));

    // Tooltip
    const tooltip = d3.select("body").append("div")
      .style("position","absolute").style("background","rgba(15,23,42,0.92)")
      .style("color","#fff").style("padding","8px 12px").style("border-radius","6px")
      .style("font-size","12px").style("pointer-events","none").style("opacity",0)
      .style("border","1px solid #334155").style("z-index","9999");

    // Lines
    const lineGen = key => d3.line().x(d=>cx(d)).y(d=>y(d[key])).curve(d3.curveMonotoneX);

    chart.append("path").datum(data)
      .attr("fill","none").attr("stroke",t.actual).attr("stroke-width",2.5)
      .attr("d", lineGen("actual"));

    chart.append("path").datum(data)
      .attr("fill","none").attr("stroke",t.projected).attr("stroke-width",2.5)
      .attr("stroke-dasharray","7,4")
      .attr("d", lineGen("projected"));

    // Dots + value labels
    const drawPoints = (key, col) => {
      data.forEach(d => {
        const px = cx(d), py = y(d[key]);
        chart.append("circle")
          .attr("cx",px).attr("cy",py).attr("r",4.5)
          .attr("fill",col).attr("stroke","#fff").attr("stroke-width",1.2)
          .style("cursor","pointer")
          .on("mouseover", function(event) {
            d3.select(this).attr("r",7);
            tooltip.style("opacity",1)
              .html(
                `<b style="color:${col}">${d.month}</b><br/>` +
                `${key==="actual"?"Actual":"Projected"}: <b>${d[key]}%</b><br/>` +
                `Variance: <span style="color:${d.variance>=0?"#10b981":"#ef4444"}">${d.variance>=0?"+":""}${d.variance}%</span>`
              )
              .style("left",(event.pageX+12)+"px").style("top",(event.pageY-10)+"px");
          })
          .on("mouseout", function() { d3.select(this).attr("r",4.5); tooltip.style("opacity",0); });

        chart.append("text")
          .attr("x",px).attr("y",py-9)
          .attr("text-anchor","middle").style("font-size","9px").style("font-weight","700")
          .style("fill",col).style("pointer-events","none")
          .text(`${d[key]}%`);
      });
    };
    drawPoints("actual",    t.actual);
    drawPoints("projected", t.projected);

    // Variance connectors
    data.forEach(d => {
      const px = cx(d);
      chart.append("line")
        .attr("x1",px).attr("x2",px)
        .attr("y1",y(d.actual)).attr("y2",y(d.projected))
        .attr("stroke", d.variance>=0 ? "#10b981" : "#ef4444")
        .attr("stroke-width",1).attr("stroke-dasharray","3,2").attr("opacity",0.5);
    });

    // X axis
    chart.append("g").attr("transform",`translate(0,${cH})`)
      .call(d3.axisBottom(x).tickSize(0))
      .call(g => {
        g.select(".domain").style("stroke","#e2e8f0");
        g.selectAll("text").style("fill","#334155").style("font-size","9px")
          .attr("transform","rotate(-25)").style("text-anchor","end");
      });

    // Y axis
    chart.append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat(d=>`${d}%`))
      .call(g => { g.select(".domain").remove(); g.selectAll("line").remove(); g.selectAll("text").style("fill","#94a3b8").style("font-size","10px"); });

    // Y label
    svg.append("text")
      .attr("transform","rotate(-90)").attr("x",-(margin.top+cH/2)).attr("y",14)
      .attr("text-anchor","middle").style("font-size","11px").style("fill","#94a3b8")
      .text("Completion Rate (%)");

    return () => tooltip.remove();
  }, [data, theme]);

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <svg ref={svgRef} style={{ display:"block", flex:1, minWidth:0, height:380 }} />
      <div style={{ padding:"12px 12px 12px 0" }}>
        <LegendHTML theme={theme} data={data} />
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

    const yScale = d3.scaleLinear().domain([40,105]).range([0.2,8]);

    const scene  = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    const camera = new THREE.PerspectiveCamera(42, W/H, 0.1, 200);
    camera.position.set(0, 8, 18);
    camera.lookAt(0, 3, 0);

    const renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.shadowMap.enabled = true;
    el.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(6,14,10); sun.castShadow=true;
    scene.add(sun);
    const rimL = new THREE.PointLight(new THREE.Color(t.actual), 0.45, 60);
    rimL.position.set(-10,6,-6);
    scene.add(rimL);
    scene.add(new THREE.HemisphereLight(0xffffff,0xe0e7ff,0.4));

    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(30,18),
      new THREE.MeshStandardMaterial({ color:0xf1f5f9, roughness:0.9 })
    );
    floor.rotation.x=-Math.PI/2; floor.receiveShadow=true;
    scene.add(floor);
    scene.add(new THREE.GridHelper(30,26,0xcccccc,0xe2e8f0));

    const spacing = 1.8;
    const pivot   = new THREE.Group();
    const labelAnchors = [];

    const makeBar = (d, key, col, zOff) => {
      const bh   = yScale(d[key]);
      const xPos = (data.indexOf(d) - (data.length-1)/2) * spacing;
      const hex  = new THREE.Color(col);

      const geo  = new THREE.BoxGeometry(0.55, bh, 0.55);
      const mat  = new THREE.MeshStandardMaterial({
        color:hex, roughness:0.25, metalness:0.4,
        emissive:hex, emissiveIntensity:0.1,
        transparent: key==="projected", opacity: key==="projected" ? 0.75 : 1,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(xPos, bh/2, zOff);
      mesh.castShadow=true;
      pivot.add(mesh);

      const eg = new THREE.EdgesGeometry(geo);
      const el2 = new THREE.LineSegments(eg, new THREE.LineBasicMaterial({ color:0xffffff }));
      el2.position.set(xPos, bh/2, zOff);
      pivot.add(el2);

      // Glow cap
      const capCol = hex.clone().lerp(new THREE.Color(0xffffff),0.25);
      const cap    = new THREE.Mesh(
        new THREE.BoxGeometry(0.55,0.06,0.55),
        new THREE.MeshStandardMaterial({ color:capCol, emissive:capCol, emissiveIntensity:1.2, roughness:0.04, metalness:1 })
      );
      cap.position.set(xPos, bh+0.03, zOff);
      pivot.add(cap);

      labelAnchors.push({ x:xPos, y:bh+0.55, z:zOff, text:`${d[key]}%`, col, isMonth:false });
    };

    data.forEach((d, i) => {
      makeBar(d, "actual",    t.actual,    -0.55);
      makeBar(d, "projected", t.projected,  0.55);
      // Month label
      const xPos = (i-(data.length-1)/2)*spacing;
      labelAnchors.push({ x:xPos, y:-0.65, z:0, text:d.month.slice(0,3), col:"#64748b", isMonth:true });
    });

    scene.add(pivot);

    const toScreen = (x3,y3,z3) => {
      const v = new THREE.Vector3(x3,y3,z3).project(camera);
      return { sx:(v.x*0.5+0.5)*W, sy:(-v.y*0.5+0.5)*H, behind:v.z>1 };
    };

    let isDragging=false, prevX=0, prevY=0, rotX=0.22, rotY=0, autoSpin=true;
    const onDown = e => { isDragging=true; prevX=e.clientX; prevY=e.clientY; autoSpin=false; renderer.domElement.style.cursor="grabbing"; };
    const onUp   = () => { isDragging=false; renderer.domElement.style.cursor="grab"; };
    const onMove = e => {
      if (!isDragging) return;
      rotY += (e.clientX-prevX)*0.006;
      rotX  = Math.max(-0.8,Math.min(0.8,rotX+(e.clientY-prevY)*0.004));
      prevX=e.clientX; prevY=e.clientY;
    };
    renderer.domElement.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("mousemove", onMove);
    renderer.domElement.style.cursor="grab";

    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (autoSpin) rotY+=0.003;
      pivot.rotation.y=rotY;
      pivot.rotation.x=rotX;
      camera.updateMatrixWorld();

      if (overlayRef.current) {
        overlayRef.current.querySelectorAll(".ptlbl").forEach((div,i) => {
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
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("mousemove", onMove);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [data, theme]);

  // Mirror labels for JSX
  const yScale = d3.scaleLinear().domain([40,105]).range([0.2,8]);
  const jsxLabels = [];
  data.forEach((d, i) => {
    jsxLabels.push({ text:`${d.actual}%`,    col:t.actual,    isMonth:false });
    jsxLabels.push({ text:`${d.projected}%`, col:t.projected, isMonth:false });
    jsxLabels.push({ text:d.month.slice(0,3),col:"#64748b",   isMonth:true  });
  });

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <div style={{ position:"relative", flex:1, minWidth:0 }}>
        <div ref={mountRef} style={{ width:"100%", height:380, cursor:"grab" }} />

        <div ref={overlayRef} style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
          {jsxLabels.map((a,i) => (
            <div key={i} className="ptlbl" style={{
              position:"absolute",
              transform: a.isMonth ? "translate(-50%,0%)" : "translate(-50%,-100%)",
              background: a.isMonth ? "rgba(255,255,255,0.90)" : "rgba(255,255,255,0.93)",
              color: a.col,
              fontSize:9, fontWeight:"bold",
              padding:"2px 5px", borderRadius:3,
              border: a.isMonth ? "1px solid #e2e8f0" : `1px solid ${a.col}55`,
              whiteSpace:"nowrap", transition:"opacity 0.1s", pointerEvents:"none",
              boxShadow:"0 1px 3px rgba(0,0,0,0.08)",
            }}>
              {a.text}
            </div>
          ))}
        </div>

        {/* Fixed corner labels */}
        <div style={{ position:"absolute", top:10, left:14, fontSize:10, fontWeight:"bold", color:THEMES[theme].actual, background:"rgba(255,255,255,0.88)", padding:"2px 7px", borderRadius:4, border:`1px solid ${THEMES[theme].actual}44` }}>
          ■ Actual (front)
        </div>
        <div style={{ position:"absolute", top:10, right:14, fontSize:10, fontWeight:"bold", color:THEMES[theme].projected, background:"rgba(255,255,255,0.88)", padding:"2px 7px", borderRadius:4, border:`1px solid ${THEMES[theme].projected}44` }}>
          ■ Projected (back)
        </div>

        <div style={{ padding:"7px 14px", background:"#f8fafc", borderTop:"1px solid #e2e8f0", fontSize:11, color:"#94a3b8" }}>
          💡 Drag to rotate · auto-spins · Front = Actual · Back = Projected
        </div>
      </div>

      <div style={{ padding:"12px 12px 12px 0" }}>
        <LegendHTML theme={theme} data={data} />
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const ProjectionTransitionChart = () => {
  const [viewMode,  setViewMode]  = useState("2d");
  const [theme,     setTheme]     = useState("Modern");
  const [category,  setCategory]  = useState("All");

  const data = buildData(category);

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
        <div style={{ fontSize:16, fontWeight:"bold", color:"#1e293b" }}>Projection Transition Chart</div>
        <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>
          Monthly completion rate · Actual vs Projected · Oct 2023 – Mar 2024
        </div>
      </div>

      {/* Dropdowns */}
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
          <label style={{ fontSize:11, color:"#94a3b8", fontWeight:"600" }}>Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)} style={ddStyle}>
            <option value="All">All</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Chart */}
      {viewMode === "2d"
        ? <Chart2D key={`2d-${theme}-${category}`} data={data} theme={theme} />
        : <Chart3D key={`3d-${theme}-${category}`} data={data} theme={theme} />
      }
    </div>
  );
};

export default ProjectionTransitionChart;