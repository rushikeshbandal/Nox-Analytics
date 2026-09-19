import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as THREE from "three";

const THEMES = {
  Light: { bg:"#f8fafc", text:"#1e293b", grid:"#e2e8f0", axis:"#64748b", card:"#ffffff", threeBg:0xf8fafc },
  Dark:  { bg:"#0f172a", text:"#f1f5f9", grid:"#1e293b", axis:"#94a3b8", card:"#1e293b", threeBg:0x0f172a },
};

const COLOR_SCALES = {
  Turbo:   d3.interpolateTurbo,
  Viridis: d3.interpolateViridis,
  Plasma:  d3.interpolatePlasma,
  Inferno: d3.interpolateInferno,
  Cool:    d3.interpolateCool,
};

// ─── Legend / Stats Panel ─────────────────────────────────────────────────────
function StatsPanel({ data, colorScheme, theme }) {
  const t = THEMES[theme];
  if (!data || !data.length) return null;

  const temps   = data.map(d => d.temperature);
  const minTemp = d3.min(temps).toFixed(1);
  const maxTemp = d3.max(temps).toFixed(1);
  const avgTemp = d3.mean(temps).toFixed(1);
  const interp  = COLOR_SCALES[colorScheme];

  const card = (label, value, col) => (
    <div style={{
      background:t.card, border:`1px solid ${t.grid}`,
      borderRadius:8, padding:"10px 12px", marginBottom:8,
      borderLeft:`3px solid ${col}`,
    }}>
      <div style={{ fontSize:10, color:t.axis, fontWeight:600, marginBottom:3 }}>{label}</div>
      <div style={{ fontSize:17, fontWeight:700, color:col }}>{value}°F</div>
    </div>
  );

  // Gradient bar
  const stops = d3.range(0, 1.01, 0.1).map(t => interp(t));

  return (
    <div style={{ width:160, flexShrink:0 }}>
      <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:8 }}>
        STATS
      </div>
      {card("🔥 Max Temp", maxTemp, "#ef4444")}
      {card("❄️ Min Temp", minTemp, "#06b6d4")}
      {card("📊 Avg Temp", avgTemp, "#6366f1")}

      <div style={{ background:t.card, border:`1px solid ${t.grid}`, borderRadius:8, padding:"10px 12px", marginBottom:8 }}>
        <div style={{ fontSize:10, color:t.axis, fontWeight:600, marginBottom:8 }}>
          COLOR SCALE
        </div>
        <div style={{ fontSize:11, fontWeight:700, color:t.text, marginBottom:6 }}>{colorScheme}</div>
        {/* Gradient bar */}
        <div style={{
          height:12, borderRadius:6, marginBottom:6,
          background:`linear-gradient(to right, ${stops.join(",")})`,
        }} />
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:9, color:t.axis }}>
          <span>{minTemp}°F</span>
          <span>{maxTemp}°F</span>
        </div>
      </div>

      <div style={{ background:t.card, border:`1px solid ${t.grid}`, borderRadius:8, padding:"10px 12px" }}>
        <div style={{ fontSize:10, color:t.axis, fontWeight:600, marginBottom:8 }}>ALL SCALES</div>
        {Object.keys(COLOR_SCALES).map(k => {
          const stops2 = d3.range(0,1.01,0.25).map(v => COLOR_SCALES[k](v));
          return (
            <div key={k} style={{ marginBottom:7 }}>
              <div style={{ fontSize:10, color:t.text, marginBottom:3, fontWeight: k===colorScheme?"700":"400" }}>{k}</div>
              <div style={{
                height:6, borderRadius:3,
                background:`linear-gradient(to right, ${stops2.join(",")})`,
                opacity: k===colorScheme ? 1 : 0.45,
                border: k===colorScheme ? `1px solid ${t.axis}` : "none",
              }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 2D Chart ─────────────────────────────────────────────────────────────────
function Chart2D({ theme, colorScheme, onData }) {
  const svgRef  = useRef(null);
  const wrapRef = useRef(null);
  const t       = THEMES[theme];

  useEffect(() => {
    if (!svgRef.current || !wrapRef.current) return;

    d3.csv("/temperature.csv", d => ({
      date:        new Date(d.date),
      temperature: +d.temperature,
    })).then(raw => {
      const data = raw.filter(d => d.date instanceof Date && isFinite(d.temperature));
      if (!data.length) return;
      onData(data);

      const W      = wrapRef.current.clientWidth || 640;
      const H      = 420;
      const margin = { top:28, right:20, bottom:44, left:56 };

      const x = d3.scaleUtc()
        .domain(d3.extent(data, d => d.date))
        .range([margin.left, W - margin.right]);

      const y = d3.scaleLinear()
        .domain(d3.extent(data, d => d.temperature)).nice()
        .range([H - margin.bottom, margin.top]);

      const color = d3.scaleSequential(y.domain(), COLOR_SCALES[colorScheme]);

      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();
      svg.attr("width", W).attr("height", H);

      svg.append("rect").attr("width",W).attr("height",H)
        .attr("fill", t.bg).attr("rx", 8);

      // Y grid
      svg.append("g").attr("transform",`translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(8).tickFormat("").tickSize(-(W-margin.left-margin.right)))
        .call(g => {
          g.select(".domain").remove();
          g.selectAll("line").style("stroke",t.grid).style("stroke-dasharray","3,3");
        });

      // Gradient def — vertical (temperature → color)
      const gradId = "temp-grad";
      const defs   = svg.append("defs");
      const grad   = defs.append("linearGradient")
        .attr("id", gradId)
        .attr("gradientUnits","userSpaceOnUse")
        .attr("x1",0).attr("y1", H-margin.bottom)
        .attr("x2",0).attr("y2", margin.top);

      d3.ticks(0, 1, 16).forEach(t_ => {
        grad.append("stop")
          .attr("offset", `${t_*100}%`)
          .attr("stop-color", color(y.invert(
            H - margin.bottom - t_*(H - margin.top - margin.bottom)
          )));
      });

      // Area fill (subtle, matching gradient)
      const areaGradId = "area-grad";
      const areaGrad   = defs.append("linearGradient")
        .attr("id", areaGradId)
        .attr("gradientUnits","userSpaceOnUse")
        .attr("x1",0).attr("y1", H-margin.bottom)
        .attr("x2",0).attr("y2", margin.top);
      areaGrad.append("stop").attr("offset","0%")
        .attr("stop-color", color(y.domain()[0])).attr("stop-opacity",0.08);
      areaGrad.append("stop").attr("offset","100%")
        .attr("stop-color", color(y.domain()[1])).attr("stop-opacity",0.18);

      svg.append("path").datum(data)
        .attr("fill", `url(#${areaGradId})`)
        .attr("d", d3.area()
          .x(d => x(d.date))
          .y0(H - margin.bottom)
          .y1(d => y(d.temperature))
          .curve(d3.curveMonotoneX)
        );

      // Main gradient line
      svg.append("path").datum(data)
        .attr("fill","none")
        .attr("stroke", `url(#${gradId})`)
        .attr("stroke-width", 2.5)
        .attr("stroke-linejoin","round")
        .attr("stroke-linecap","round")
        .attr("d", d3.line()
          .x(d => x(d.date))
          .y(d => y(d.temperature))
          .curve(d3.curveMonotoneX)
        );

      // Min/Max dots + labels
      const dMin = d3.least(data,    d => d.temperature);
      const dMax = d3.greatest(data, d => d.temperature);

      [{ d:dMin, label:`❄️ ${dMin.temperature}°F`, off:14, col:color(dMin.temperature) },
       { d:dMax, label:`🔥 ${dMax.temperature}°F`, off:-12, col:color(dMax.temperature) }]
        .forEach(({ d, label, off, col: dc }) => {
          svg.append("circle")
            .attr("cx",x(d.date)).attr("cy",y(d.temperature))
            .attr("r",6).attr("fill",dc).attr("stroke","#fff").attr("stroke-width",2);
          svg.append("text")
            .attr("x",x(d.date)).attr("y",y(d.temperature)+off)
            .attr("text-anchor","middle")
            .attr("font-size","9px").attr("font-weight","700").attr("fill",dc)
            .text(label);
        });

      // Focus line + dot for hover
      const focus = svg.append("g").style("display","none");
      focus.append("line")
        .attr("y1",margin.top).attr("y2",H-margin.bottom)
        .attr("stroke","#94a3b8").attr("stroke-width",1).attr("stroke-dasharray","4,3");
      const focusDot  = focus.append("circle").attr("r",5).attr("stroke","#fff").attr("stroke-width",2);
      const focusLbl  = focus.append("g");
      focusLbl.append("rect").attr("rx",4).attr("fill",t.card).attr("stroke","#94a3b8").attr("stroke-width",1);
      focusLbl.append("text").attr("class","ft").attr("font-size","10px").attr("font-weight","700");

      // Tooltip
      const tooltip = d3.select("body").append("div")
        .style("position","absolute")
        .style("background", theme==="Dark" ? "rgba(15,23,42,0.97)" : "rgba(15,23,42,0.92)")
        .style("color","#fff").style("padding","8px 12px").style("border-radius","8px")
        .style("font-size","12px").style("pointer-events","none").style("opacity",0)
        .style("z-index","9999").style("line-height","1.7");

      const bisect = d3.bisector(d => d.date).left;

      svg.append("rect")
        .attr("x",margin.left).attr("y",margin.top)
        .attr("width", W-margin.left-margin.right)
        .attr("height", H-margin.top-margin.bottom)
        .attr("fill","transparent").style("cursor","crosshair")
        .on("mousemove", function(event) {
          const mx   = d3.pointer(event,this)[0];
          const date = x.invert(mx + margin.left);
          const idx  = Math.min(bisect(data,date), data.length-1);
          const d    = data[idx];
          if (!d) return;

          const dc = color(d.temperature);
          const cx = x(d.date), cy = y(d.temperature);

          focus.style("display","block");
          focus.select("line").attr("x1",cx).attr("x2",cx);
          focusDot.attr("cx",cx).attr("cy",cy).attr("fill",dc);

          const lx = cx + (cx > W*0.75 ? -65 : 8);
          focusLbl.attr("transform",`translate(${lx},${cy-24})`);
          focusLbl.select(".ft").attr("x",6).attr("y",14).attr("fill",dc).text(`${d.temperature}°F`);
          const bb = focusLbl.select(".ft").node().getBBox();
          focusLbl.select("rect").attr("width",bb.width+12).attr("height",bb.height+8)
            .attr("stroke",dc);

          tooltip.style("opacity",1)
            .style("border",`1.5px solid ${dc}`)
            .html(
              `<div style="font-weight:700;color:${dc};margin-bottom:4px">${d3.timeFormat("%b %d, %Y")(d.date)}</div>` +
              `🌡 Temperature: <b>${d.temperature}°F</b>`
            )
            .style("left",(event.pageX+14)+"px").style("top",(event.pageY-14)+"px");
        })
        .on("mouseleave",() => { focus.style("display","none"); tooltip.style("opacity",0); });

      // X axis
      svg.append("g").attr("transform",`translate(0,${H-margin.bottom})`)
        .call(d3.axisBottom(x).ticks(8).tickFormat(d3.timeFormat("%b '%y")))
        .call(g => {
          g.select(".domain").style("stroke",t.grid);
          g.selectAll("line").style("stroke",t.grid);
          g.selectAll("text").style("fill",t.axis).style("font-size","10px");
        });

      // Y axis
      svg.append("g").attr("transform",`translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(8).tickFormat(d => `${d}°F`))
        .call(g => {
          g.select(".domain").remove(); g.selectAll("line").remove();
          g.selectAll("text").style("fill",t.axis).style("font-size","10px");
        });

      svg.append("text")
        .attr("transform","rotate(-90)").attr("x",-H/2).attr("y",16)
        .attr("text-anchor","middle").style("font-size","10px").style("fill",t.axis)
        .text("Temperature (°F)");

      return () => tooltip.remove();
    });
  }, [theme, colorScheme]);

  return (
    <div ref={wrapRef} style={{
      border:`1px solid ${t.grid}`, borderRadius:8,
      overflow:"hidden", background:t.bg, width:"100%",
    }}>
      <svg ref={svgRef} style={{ display:"block", width:"100%" }} />
    </div>
  );
}

// ─── 3D Chart — AxesHelper removed, gradient tubes, pivot rotation ─────────────
function Chart3D({ theme, colorScheme }) {
  const mountRef   = useRef(null);
  const overlayRef = useRef(null);
  const t          = THEMES[theme];

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);

    const W = el.clientWidth || 680;
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

    // Lights — NO AxesHelper
    scene.add(new THREE.AmbientLight(0xffffff, 0.80));
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(6,14,10); sun.castShadow=true; scene.add(sun);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xe0e7ff, 0.40));

    // Floor + clean grid
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

    d3.csv("/temperature.csv", d => ({
      date:        new Date(d.date),
      temperature: +d.temperature,
    })).then(raw => {
      const data = raw.filter(d => d.date instanceof Date && isFinite(d.temperature));
      if (!data.length) return;

      const dateExtent = d3.extent(data, d => d.date);
      const tempExtent = d3.extent(data, d => d.temperature);

      const xScale = d3.scaleUtc().domain(dateExtent).range([-9, 9]);
      const yScale = d3.scaleLinear().domain(tempExtent).nice().range([-6, 6]);
      const interp = COLOR_SCALES[colorScheme];
      const tNorm  = d3.scaleLinear().domain(tempExtent).range([0, 1]);

      // ── Gradient tubes — each segment colored by temperature ───────────────
      for (let i = 0; i < data.length-1; i++) {
        const d1 = data[i], d2 = data[i+1];
        const avgT = (d1.temperature + d2.temperature) / 2;
        const hex  = interp(tNorm(avgT));
        const col  = new THREE.Color(hex);

        const p1 = new THREE.Vector3(xScale(d1.date), yScale(d1.temperature), 0);
        const p2 = new THREE.Vector3(xScale(d2.date), yScale(d2.temperature), 0);

        const tube = new THREE.Mesh(
          new THREE.TubeGeometry(new THREE.LineCurve3(p1,p2), 4, 0.055, 6, false),
          new THREE.MeshStandardMaterial({
            color:col, roughness:0.20, metalness:0.50,
            emissive:col, emissiveIntensity:0.22,
            transparent:true, opacity:0.90,
          })
        );
        tube.castShadow = true;
        pivot.add(tube);

        // Subtle vertical drop line every 14 days
        if (i % 14 === 0) {
          const dropH = yScale(d1.temperature) + 7.5;
          const drop  = new THREE.Mesh(
            new THREE.BoxGeometry(0.015, dropH, 0.015),
            new THREE.MeshBasicMaterial({ color:col, transparent:true, opacity:0.12 })
          );
          drop.position.set(p1.x, (-6 + yScale(d1.temperature))/2, 0);
          pivot.add(drop);
        }
      }

      // Min / Max glow dots
      const dMin = d3.least(data,    d => d.temperature);
      const dMax = d3.greatest(data, d => d.temperature);

      [
        { d:dMin, hex:interp(0),   label:`❄️ Min ${dMin.temperature}°F` },
        { d:dMax, hex:interp(1),   label:`🔥 Max ${dMax.temperature}°F` },
      ].forEach(({ d, hex, label }) => {
        const col = new THREE.Color(hex);
        const dot = new THREE.Mesh(
          new THREE.SphereGeometry(0.20, 16, 16),
          new THREE.MeshStandardMaterial({
            color:col, roughness:0.1, metalness:0.6,
            emissive:col, emissiveIntensity:0.75,
          })
        );
        dot.position.set(xScale(d.date), yScale(d.temperature), 0);
        pivot.add(dot);
        labelAnchors.push({
          pos:  new THREE.Vector3(xScale(d.date), yScale(d.temperature)+0.85, 0),
          text: label, col: hex, type:"val",
        });
      });

      // Date labels (every ~30 days)
      const months = d3.timeMonth.range(dateExtent[0], dateExtent[1]);
      months.forEach(m => {
        labelAnchors.push({
          pos:  new THREE.Vector3(xScale(m), -7.8, 0),
          text: d3.timeFormat("%b '%y")(m),
          col:  t.axis, type:"date",
        });
      });

      // Temp labels on Y
      yScale.ticks(6).forEach(temp => {
        labelAnchors.push({
          pos:  new THREE.Vector3(-10.2, yScale(temp), 0),
          text: `${temp}°F`,
          col:  `#${new THREE.Color(interp(tNorm(temp))).getHexString()}`,
          type: "temp",
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

      let isDragging=false, prevX=0, prevY=0, rotX=0.22, rotY=0, autoSpin=true;
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
  }, [theme, colorScheme]);

  // ~2 val + 12 month + 6 temp = 20
  const jsxLabels = Array.from({ length: 24 }, (_, i) => ({
    type: i < 2 ? "val" : i < 14 ? "date" : "temp",
  }));

  return (
    <div style={{
      position:"relative", userSelect:"none",
      border:`1px solid ${t.grid}`, borderRadius:8, overflow:"hidden", width:"100%",
    }}>
      <div ref={mountRef} style={{ width:"100%", height:460, cursor:"grab", overflow:"hidden" }} />

      <div ref={overlayRef} style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
        {jsxLabels.map((a,i) => (
          <div key={i} className="shlbl" style={{
            position:      "absolute",
            transform:     a.type==="temp"  ? "translate(-100%,-50%)"
                         : a.type==="date"  ? "translate(-50%,0%)"
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
        💡 Drag to rotate · auto-spins · Color = temperature value ·
        <span style={{ fontWeight:700, marginLeft:6 }}>❄️ Min</span>
        <span style={{ fontWeight:700, marginLeft:8 }}>🔥 Max</span>
        highlighted
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const GradientEncodingLineChart = () => {
  const [viewMode,     setViewMode]     = useState("2d");
  const [theme,        setTheme]        = useState("Light");
  const [colorScheme,  setColorScheme]  = useState("Turbo");
  const [chartData,    setChartData]    = useState([]);

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
          Gradient Encoding – Temperature
        </div>
        <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>
          Daily temperature · Oct 2011 – Sep 2012 · Color encodes value
        </div>
      </div>

      {/* Controls */}
      <div style={{ display:"flex", gap:10, alignItems:"flex-end", marginTop:14, marginBottom:20, flexWrap:"wrap" }}>
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
          <label style={{ fontSize:11, color:"#94a3b8", fontWeight:"600" }}>Color Scale</label>
          <select value={colorScheme} onChange={e => setColorScheme(e.target.value)} style={ddStyle}>
            {Object.keys(COLOR_SCALES).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </div>

      {/* Chart + Stats */}
      <div style={{ display:"flex", gap:14, alignItems:"flex-start", width:"100%" }}>
        <div style={{ flex:1, minWidth:0 }}>
          {viewMode === "2d"
            ? <Chart2D key={`2d-${theme}-${colorScheme}`} theme={theme} colorScheme={colorScheme} onData={setChartData} />
            : <Chart3D key={`3d-${theme}-${colorScheme}`} theme={theme} colorScheme={colorScheme} />
          }
        </div>
        <StatsPanel data={chartData} colorScheme={colorScheme} theme={theme} />
      </div>

      <div style={{ marginTop:10, fontSize:11, color:"#94a3b8" }}>
        💡 2D: Hover for exact temperature · 3D: Drag to rotate · ❄️ Min · 🔥 Max highlighted
      </div>
    </div>
  );
};

export default GradientEncodingLineChart;