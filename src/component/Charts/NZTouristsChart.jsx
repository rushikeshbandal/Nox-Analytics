import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as THREE from "three";

const THEMES = {
  Light: { bg:"#f8fafc", text:"#1e293b", grid:"#e2e8f0", axis:"#64748b", card:"#ffffff", threeBg:0xf8fafc },
  Dark:  { bg:"#0f172a", text:"#f1f5f9", grid:"#1e293b", axis:"#94a3b8", card:"#1e293b", threeBg:0x0f172a },
};

const COLORS = {
  SteelBlue: "#4682b4",
  Orange:    "#f97316",
  Purple:    "#7c3aed",
  Teal:      "#14b8a6",
  Crimson:   "#dc2626",
};

// ─── Stats Panel ──────────────────────────────────────────────────────────────
function StatsPanel({ data, color, theme }) {
  const t = THEMES[theme];
  if (!data || !data.length) return null;

  const vals     = data.map(d => d.value);
  const minD     = d3.least(data, d => d.value);
  const maxD     = d3.greatest(data, d => d.value);
  const avgVal   = d3.mean(vals).toFixed(0);
  const latest   = data[data.length-1];

  const card = (label, value, sub, col) => (
    <div style={{
      background:t.card, border:`1px solid ${t.grid}`,
      borderRadius:8, padding:"10px 12px", marginBottom:8,
      borderLeft:`3px solid ${col}`,
    }}>
      <div style={{ fontSize:10, color:t.axis, fontWeight:600, marginBottom:3 }}>{label}</div>
      <div style={{ fontSize:16, fontWeight:700, color:col }}>{value}</div>
      {sub && <div style={{ fontSize:10, color:t.axis, marginTop:2 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ width:165, flexShrink:0 }}>
      <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8",
        letterSpacing:"0.08em", marginBottom:8 }}>STATS</div>

      {card("🔥 Peak Month",  d3.format(",")(maxD.value), d3.timeFormat("%b %Y")(maxD.date), COLORS[color])}
      {card("📉 Lowest Month", d3.format(",")(minD.value), d3.timeFormat("%b %Y")(minD.date), "#94a3b8")}
      {card("📊 Avg per Month", d3.format(",")(avgVal), "across all years", "#6366f1")}
      {card("📅 Latest", d3.format(",")(latest.value), d3.timeFormat("%b %Y")(latest.date), COLORS[color])}

      <div style={{ background:t.card, border:`1px solid ${t.grid}`,
        borderRadius:8, padding:"10px 12px" }}>
        <div style={{ fontSize:10, color:t.axis, fontWeight:600, marginBottom:8 }}>LINE COLOR</div>
        {Object.entries(COLORS).map(([k, c]) => (
          <div key={k} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:5 }}>
            <div style={{ width:20, height:3, background:c, borderRadius:2,
              opacity: k===color ? 1 : 0.4 }} />
            <span style={{ fontSize:10, color:t.text, fontWeight: k===color?"700":"400" }}>{k}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 2D Chart — fixed log-scale tick overlap ───────────────────────────────────
function Chart2D({ theme, color, scaleType, onData }) {
  const svgRef  = useRef(null);
  const wrapRef = useRef(null);
  const t       = THEMES[theme];
  const lineCol = COLORS[color];

  useEffect(() => {
    if (!svgRef.current || !wrapRef.current) return;

    d3.csv("/nz-tourists@1.csv", d => ({
      date:  new Date(d.date),
      value: +d.value,
    })).then(raw => {
      const data = raw.filter(d => !isNaN(d.date) && d.value > 0);
      if (!data.length) return;
      onData(data);

      const W      = wrapRef.current.clientWidth || 700;
      const H      = 440;
      const margin = { top:36, right:24, bottom:44, left:70 };

      const x = d3.scaleTime()
        .domain(d3.extent(data, d => d.date))
        .range([margin.left, W - margin.right]);

      const yLinear = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.value)]).nice()
        .range([H - margin.bottom, margin.top]);

      const yLog = d3.scaleLog()
        .domain([d3.min(data, d => d.value), d3.max(data, d => d.value)])
        .range([H - margin.bottom, margin.top]);

      const y = scaleType === "linear" ? yLinear : yLog;

      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();
      svg.attr("width", W).attr("height", H);
      svg.append("rect").attr("width",W).attr("height",H).attr("fill",t.bg).attr("rx",8);

      // ── FIX: For log scale, only show major ticks (powers of 10) ──────────
      // d3's default log tick generator spits out 1,2,3...9 × each power
      // which collide when chart height is limited. Restrict to clean values.
      const logTickValues = () => {
        const [lo, hi] = y.domain();
        const ticks = [];
        let p = Math.pow(10, Math.floor(Math.log10(lo)));
        while (p <= hi) {
          if (p >= lo) ticks.push(p);
          // also add the "5×" mid-step for a bit more resolution, only if it fits
          if (p*5 >= lo && p*5 <= hi) ticks.push(p*5);
          p *= 10;
        }
        return ticks;
      };

      const yTickValues = scaleType === "log" ? logTickValues() : null;

      // Y grid — uses filtered ticks
      svg.append("g").attr("transform",`translate(${margin.left},0)`)
        .call(
          scaleType === "log"
            ? d3.axisLeft(y).tickValues(yTickValues).tickFormat("").tickSize(-(W-margin.left-margin.right))
            : d3.axisLeft(y).ticks(H/70).tickFormat("").tickSize(-(W-margin.left-margin.right))
        )
        .call(g => {
          g.select(".domain").remove();
          g.selectAll("line").style("stroke",t.grid).style("stroke-dasharray","3,3");
        });

      // Area fill
      const areaCol = d3.color(lineCol); areaCol.opacity = 0.08;
      svg.append("path").datum(data)
        .attr("fill", areaCol.formatRgb())
        .attr("d", d3.area()
          .x(d => x(d.date))
          .y0(H - margin.bottom)
          .y1(d => y(Math.max(d.value, y.domain()[0])))
          .curve(d3.curveMonotoneX)
        );

      // Main line
      svg.append("path").datum(data)
        .attr("fill","none").attr("stroke", lineCol)
        .attr("stroke-width", 1.8)
        .attr("stroke-linejoin","round").attr("stroke-linecap","round")
        .attr("d", d3.line()
          .x(d => x(d.date)).y(d => y(d.value))
          .curve(d3.curveMonotoneX)
        );

      // Min/Max dots
      const dMin = d3.least(data,    d => d.value);
      const dMax = d3.greatest(data, d => d.value);
      [
        { d:dMax, col:lineCol, label:`🔥 ${d3.format(",")(dMax.value)}`, off:-12 },
        { d:dMin, col:"#94a3b8", label:`📉 ${d3.format(",")(dMin.value)}`, off:16 },
      ].forEach(({ d, col, label, off }) => {
        svg.append("circle")
          .attr("cx",x(d.date)).attr("cy",y(d.value))
          .attr("r",5).attr("fill",col).attr("stroke","#fff").attr("stroke-width",1.5);
        svg.append("text")
          .attr("x",x(d.date)).attr("y",y(d.value)+off)
          .attr("text-anchor","middle")
          .attr("font-size","9px").attr("font-weight","700").attr("fill",col)
          .text(label);
      });

      // Focus + tooltip
      const focus = svg.append("g").style("display","none");
      focus.append("line").attr("y1",margin.top).attr("y2",H-margin.bottom)
        .attr("stroke",lineCol).attr("stroke-width",1).attr("stroke-dasharray","4,3").attr("opacity",0.5);
      focus.append("circle").attr("r",5).attr("fill",lineCol).attr("stroke","#fff").attr("stroke-width",2);

      const tooltip = d3.select("body").append("div")
        .style("position","absolute")
        .style("background", theme==="Dark"?"rgba(15,23,42,0.97)":"rgba(15,23,42,0.92)")
        .style("color","#fff").style("padding","8px 12px").style("border-radius","8px")
        .style("font-size","12px").style("pointer-events","none").style("opacity",0)
        .style("border",`1.5px solid ${lineCol}`).style("z-index","9999").style("line-height","1.7");

      const bisect = d3.bisector(d => d.date).left;

      svg.append("rect")
        .attr("x",margin.left).attr("y",margin.top)
        .attr("width",W-margin.left-margin.right)
        .attr("height",H-margin.top-margin.bottom)
        .attr("fill","transparent").style("cursor","crosshair")
        .on("mousemove", function(event) {
          const mx   = d3.pointer(event,this)[0];
          const date = x.invert(mx+margin.left);
          const idx  = Math.min(bisect(data,date), data.length-1);
          const d    = data[idx]; if (!d) return;

          const cx = x(d.date), cy = y(d.value);
          focus.style("display","block");
          focus.select("line").attr("x1",cx).attr("x2",cx);
          focus.select("circle").attr("cx",cx).attr("cy",cy);

          tooltip.style("opacity",1)
            .html(
              `<div style="font-weight:700;color:${lineCol};margin-bottom:4px">${d3.timeFormat("%B %Y")(d.date)}</div>` +
              `🧳 Visitors: <b>${d3.format(",")(d.value)}</b>`
            )
            .style("left",(event.pageX+14)+"px").style("top",(event.pageY-14)+"px");
        })
        .on("mouseleave",() => { focus.style("display","none"); tooltip.style("opacity",0); });

      // X axis
      svg.append("g").attr("transform",`translate(0,${H-margin.bottom})`)
        .call(d3.axisBottom(x).ticks(d3.timeYear.every(10)).tickFormat(d3.timeFormat("%Y")))
        .call(g => {
          g.select(".domain").style("stroke",t.grid);
          g.selectAll("line").style("stroke",t.grid);
          g.selectAll("text").style("fill",t.axis).style("font-size","10px");
        });

      // ── FIX: Y axis — log uses filtered tickValues, no overlap ────────────
      svg.append("g").attr("transform",`translate(${margin.left},0)`)
        .call(
          scaleType === "log"
            ? d3.axisLeft(y).tickValues(yTickValues).tickFormat(d3.format(","))
            : d3.axisLeft(y).ticks(H/70).tickFormat(d3.format("~s"))
        )
        .call(g => {
          g.select(".domain").remove(); g.selectAll("line").remove();
          g.selectAll("text").style("fill",t.axis).style("font-size","10px");
        });

      // Y label
      svg.append("text")
        .attr("x", margin.left)
        .attr("y", margin.top - 14)
        .attr("text-anchor","start")
        .attr("fill", t.text)
        .attr("font-size","11px")
        .attr("font-weight","600")
        .text("↑ Visitors per month");

      return () => tooltip.remove();
    });
  }, [theme, color, scaleType]);

  return (
    <div ref={wrapRef} style={{
      border:`1px solid ${t.grid}`, borderRadius:8,
      overflow:"hidden", background:t.bg, width:"100%",
    }}>
      <svg ref={svgRef} style={{ display:"block", width:"100%" }} />
    </div>
  );
}

// ─── 3D Chart — unchanged ──────────────────────────────────────────────────────
function Chart3D({ theme, color }) {
  const mountRef   = useRef(null);
  const overlayRef = useRef(null);
  const t          = THEMES[theme];
  const lineCol    = COLORS[color];

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);

    const W = el.clientWidth || 700;
    const H = 460;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(t.threeBg);

    const camera = new THREE.PerspectiveCamera(42, W/H, 0.1, 200);
    camera.position.set(0, 0, 22); camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.domElement.style.display    = "block";
    renderer.domElement.style.outline    = "none";
    renderer.domElement.style.userSelect = "none";
    el.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.80));
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(6,14,10); sun.castShadow=true; scene.add(sun);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xe0e7ff, 0.45));

    const floorCol = theme==="Dark" ? 0x1e293b : 0xf1f5f9;
    const gridCol  = theme==="Dark" ? 0x334155 : 0xe2e8f0;
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 20),
      new THREE.MeshStandardMaterial({ color:floorCol, roughness:0.9 })
    );
    floor.rotation.x = -Math.PI/2; floor.position.y = -7.5;
    floor.receiveShadow = true; scene.add(floor);
    const grid = new THREE.GridHelper(30, 24, gridCol, gridCol);
    grid.position.y = -7.45; scene.add(grid);

    const pivot = new THREE.Group();
    const labelAnchors = [];
    let animId;

    d3.csv("/nz-tourists@1.csv", d => ({
      date:  new Date(d.date),
      value: +d.value,
    })).then(raw => {
      const data = raw.filter(d => !isNaN(d.date) && d.value > 0);
      if (!data.length) return;

      const dateExtent = d3.extent(data, d => d.date);
      const xScale = d3.scaleTime().domain(dateExtent).range([-9, 9]);
      const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.value)]).nice()
        .range([-6, 6]);

      const col = new THREE.Color(lineCol);

      for (let i = 0; i < data.length - 1; i++) {
        const d1 = data[i], d2 = data[i+1];
        const p1 = new THREE.Vector3(xScale(d1.date), yScale(d1.value), 0);
        const p2 = new THREE.Vector3(xScale(d2.date), yScale(d2.value), 0);

        const tube = new THREE.Mesh(
          new THREE.TubeGeometry(new THREE.LineCurve3(p1,p2), 4, 0.045, 5, false),
          new THREE.MeshStandardMaterial({
            color:col, roughness:0.22, metalness:0.45,
            emissive:col, emissiveIntensity:0.20,
            transparent:true, opacity:0.88,
          })
        );
        tube.castShadow = true;
        pivot.add(tube);

        if (i % 60 === 0) {
          const dropH = yScale(d1.value) + 7.5;
          const drop  = new THREE.Mesh(
            new THREE.BoxGeometry(0.015, dropH, 0.015),
            new THREE.MeshBasicMaterial({ color:col, transparent:true, opacity:0.12 })
          );
          drop.position.set(p1.x, (-6 + yScale(d1.value))/2, 0);
          pivot.add(drop);
        }
      }

      const dMin = d3.least(data,    d => d.value);
      const dMax = d3.greatest(data, d => d.value);
      [
        { d:dMax, hex:lineCol,   emoji:"🔥", label:"Peak" },
        { d:dMin, hex:"#94a3b8", emoji:"📉", label:"Low"  },
      ].forEach(({ d, hex, emoji, label }) => {
        const dc = new THREE.Color(hex);
        const dot = new THREE.Mesh(
          new THREE.SphereGeometry(0.18, 16, 16),
          new THREE.MeshStandardMaterial({
            color:dc, roughness:0.1, metalness:0.6,
            emissive:dc, emissiveIntensity:0.7,
          })
        );
        dot.position.set(xScale(d.date), yScale(d.value), 0);
        pivot.add(dot);
        labelAnchors.push({
          pos:  new THREE.Vector3(xScale(d.date), yScale(d.value)+0.7, 0),
          text: `${emoji} ${label}: ${d3.format(",")(d.value)}`,
          col:  hex, type:"val",
        });
      });

      const decades = d3.timeYear.range(
        d3.timeYear.ceil(dateExtent[0]), dateExtent[1], 10
      );
      decades.forEach(dec => {
        labelAnchors.push({
          pos:  new THREE.Vector3(xScale(dec), -7.8, 0),
          text: d3.timeFormat("%Y")(dec),
          col:  t.axis, type:"date",
        });
      });

      yScale.ticks(6).forEach(v => {
        labelAnchors.push({
          pos:  new THREE.Vector3(-10.2, yScale(v), 0),
          text: d3.format("~s")(v),
          col:  t.axis, type:"val2",
        });
      });

      scene.add(pivot);

      if (overlayRef.current) {
        const divs = overlayRef.current.querySelectorAll(".shlbl");
        labelAnchors.forEach((a,i) => { if (divs[i]) divs[i].textContent = a.text; });
      }

      const toScreen = v3 => {
        const v = v3.clone().project(camera);
        return { sx:(v.x*0.5+0.5)*W, sy:(-v.y*0.5+0.5)*H, behind:v.z>1 };
      };

      let isDragging=false, prevX=0, prevY=0, rotX=0.18, rotY=0, autoSpin=true;
      pivot.rotation.x=rotX; pivot.rotation.y=rotY;

      const onDown = e => {
        e.preventDefault(); isDragging=true; prevX=e.clientX; prevY=e.clientY;
        autoSpin=false; renderer.domElement.style.cursor="grabbing";
      };
      const onUp   = () => { isDragging=false; renderer.domElement.style.cursor="grab"; };
      const onMove = e => {
        if (!isDragging) return;
        rotY += (e.clientX-prevX)*0.007;
        rotX  = Math.max(-0.6, Math.min(0.6, rotX+(e.clientY-prevY)*0.004));
        prevX=e.clientX; prevY=e.clientY;
      };

      renderer.domElement.addEventListener("mousedown", onDown);
      window.addEventListener("mouseup",   onUp);
      window.addEventListener("mousemove", onMove);
      renderer.domElement.style.cursor = "grab";

      const animate = () => {
        animId = requestAnimationFrame(animate);
        if (autoSpin) rotY += 0.003;
        pivot.rotation.y=rotY; pivot.rotation.x=rotX;
        camera.updateMatrixWorld();

        if (overlayRef.current) {
          overlayRef.current.querySelectorAll(".shlbl").forEach((div,i) => {
            const a = labelAnchors[i]; if (!a) return;
            const rv = new THREE.Vector3(a.pos.x,a.pos.y,a.pos.z).applyEuler(pivot.rotation);
            const { sx, sy, behind } = toScreen(rv);
            div.style.left=`${sx}px`; div.style.top=`${sy}px`;
            div.style.opacity = behind ? "0" : "1";
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

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [theme, color]);

  const jsxLabels = Array.from({ length: 20 }, (_, i) => ({
    type: i < 2 ? "val" : i < 12 ? "date" : "val2",
  }));

  return (
    <div style={{
      position:"relative", userSelect:"none",
      border:`1px solid ${t.grid}`, borderRadius:8,
      overflow:"hidden", width:"100%",
    }}>
      <div ref={mountRef} style={{ width:"100%", height:460, cursor:"grab", overflow:"hidden" }} />

      <div ref={overlayRef} style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
        {jsxLabels.map((a,i) => (
          <div key={i} className="shlbl" style={{
            position:      "absolute",
            transform:     a.type==="val2" ? "translate(-100%,-50%)"
                         : a.type==="date" ? "translate(-50%,0%)"
                         : "translate(-50%,-100%)",
            background:    theme==="Dark" ? "rgba(15,23,42,0.92)" : "rgba(255,255,255,0.95)",
            color:         theme==="Dark" ? "#f1f5f9" : "#334155",
            fontSize:      a.type==="val" ? 10 : 8,
            fontWeight:    "600",
            padding:       a.type==="val" ? "3px 7px" : "2px 5px",
            borderRadius:  4, border:`1px solid ${t.grid}`,
            whiteSpace:    "nowrap", pointerEvents:"none",
            boxShadow:     "0 1px 4px rgba(0,0,0,0.10)", opacity:0,
          }} />
        ))}
      </div>

      <div style={{
        padding:"7px 14px",
        background: theme==="Dark" ? "#1e293b" : "#f8fafc",
        borderTop:`1px solid ${t.grid}`, fontSize:11, color:t.axis,
      }}>
        💡 Drag to rotate · auto-spins ·
        <span style={{ color:lineCol, fontWeight:700, marginLeft:6 }}>🔥 Peak</span>
        <span style={{ color:"#94a3b8", fontWeight:700, marginLeft:8 }}>📉 Low</span>
        highlighted
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function NZTouristsChart() {
  const [scaleType, setScaleType] = useState("linear");
  const [viewMode,  setViewMode]  = useState("2d");
  const [theme,     setTheme]     = useState("Light");
  const [color,     setColor]     = useState("SteelBlue");
  const [chartData, setChartData] = useState([]);

  const t = THEMES[theme];

  const ddStyle = {
    padding:"5px 10px", borderRadius:6,
    border:`1px solid ${t.grid}`,
    background: theme==="Dark" ? "#1e293b" : "#fff",
    color: t.text, fontWeight:"500",
    cursor:"pointer", fontSize:12, outline:"none",
  };

  return (
    <div style={{
      background: theme==="Dark" ? "#0f172a" : "#ffffff",
      borderRadius:12, padding:"20px 24px 28px 24px",
      width:"100%", boxShadow:"0 1px 3px rgba(0,0,0,0.08)", boxSizing:"border-box",
    }}>
      <div style={{ marginBottom:4 }}>
        <div style={{ fontSize:16, fontWeight:"bold", color:t.text }}>
          New Zealand Tourists (1921–2018)
        </div>
        <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>
          Monthly visitor counts · 97 years of data
        </div>
      </div>

      <div style={{ display:"flex", gap:10, alignItems:"flex-end",
        marginTop:14, marginBottom:14, flexWrap:"wrap" }}>
        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
          <label style={{ fontSize:11, color:"#94a3b8", fontWeight:"600" }}>View</label>
          <select value={viewMode} onChange={e => setViewMode(e.target.value)} style={ddStyle}>
            <option value="2d">2D</option>
            <option value="3d">3D</option>
          </select>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
          <label style={{ fontSize:11, color:"#94a3b8", fontWeight:"600" }}>Theme</label>
          <select value={theme} onChange={e => setTheme(e.target.value)} style={ddStyle}>
            {Object.keys(THEMES).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
          <label style={{ fontSize:11, color:"#94a3b8", fontWeight:"600" }}>Color</label>
          <select value={color} onChange={e => setColor(e.target.value)} style={ddStyle}>
            {Object.keys(COLORS).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>

        {viewMode === "2d" && (
          <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
            <label style={{ fontSize:11, color:"#94a3b8", fontWeight:"600" }}>Scale</label>
            <div style={{ display:"flex", gap:10, height:30, alignItems:"center" }}>
              <label style={{ fontSize:12, color:t.text, display:"flex", alignItems:"center", gap:4 }}>
                <input type="radio" checked={scaleType==="linear"} onChange={() => setScaleType("linear")} />
                Linear
              </label>
              <label style={{ fontSize:12, color:t.text, display:"flex", alignItems:"center", gap:4 }}>
                <input type="radio" checked={scaleType==="log"} onChange={() => setScaleType("log")} />
                Log
              </label>
            </div>
          </div>
        )}
      </div>

      <div style={{ display:"flex", gap:14, alignItems:"flex-start", width:"100%" }}>
        <div style={{ flex:1, minWidth:0 }}>
          {viewMode === "2d"
            ? <Chart2D key={`2d-${theme}-${color}-${scaleType}`} theme={theme} color={color} scaleType={scaleType} onData={setChartData} />
            : <Chart3D key={`3d-${theme}-${color}`} theme={theme} color={color} />
          }
        </div>
        <StatsPanel data={chartData} color={color} theme={theme} />
      </div>

      <div style={{ marginTop:10, fontSize:11, color:"#94a3b8" }}>
        💡 2D: Hover for exact value · 3D: Drag to rotate · 🔥 Peak · 📉 Low highlighted
      </div>
    </div>
  );
}