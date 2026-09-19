import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as THREE from "three";

const THEMES = {
  Light: { bg:"#f8fafc", text:"#1e293b", grid:"#e2e8f0", axis:"#64748b", card:"#ffffff" },
  Dark:  { bg:"#0f172a", text:"#f1f5f9", grid:"#1e293b", axis:"#94a3b8", card:"#1e293b" },
};

const COLOR_THEMES = {
  Blue:   "#2563eb",
  Teal:   "#14b8a6",
  Orange: "#f97316",
  Purple: "#7c3aed",
  Slate:  "#475569",
};

const COND_EMOJI = {
  CLR:"☀️", FEW:"🌤", SCT:"⛅", BKN:"🌥", OVC:"☁️", "VV ":"🌫",
};
const COND_LABEL = {
  CLR:"Clear", FEW:"Few Clouds", SCT:"Scattered",
  BKN:"Broken", OVC:"Overcast", "VV ":"Fog/Mist",
};

// ─── Stats Side Panel ─────────────────────────────────────────────────────────
function StatsPanel({ data, color, theme }) {
  const t = THEMES[theme];
  const c = COLOR_THEMES[color];
  if (!data || !data.length) return null;

  const temps     = data.map(d => d.temperature);
  const minTemp   = d3.min(temps);
  const maxTemp   = d3.max(temps);
  const avgTemp   = d3.mean(temps).toFixed(1);
  const lastTemp  = data[data.length-1].temperature;
  const firstTemp = data[0].temperature;
  const trend     = lastTemp > firstTemp ? "↑" : lastTemp < firstTemp ? "↓" : "→";
  const trendCol  = lastTemp > firstTemp ? "#10b981" : lastTemp < firstTemp ? "#ef4444" : "#94a3b8";

  const condCounts = d3.rollup(data, v => v.length, d => d.condition.trim());
  const topCond    = [...condCounts.entries()].sort((a,b) => b[1]-a[1]).slice(0,4);

  const card = (label, value, sub, col) => (
    <div style={{
      background: t.card, border:`1px solid ${t.grid}`,
      borderRadius:8, padding:"10px 12px", marginBottom:8,
      borderLeft:`3px solid ${col || c}`,
    }}>
      <div style={{ fontSize:10, color:t.axis, fontWeight:600, marginBottom:3 }}>{label}</div>
      <div style={{ fontSize:18, fontWeight:700, color: col || c }}>{value}</div>
      {sub && <div style={{ fontSize:10, color:t.axis, marginTop:2 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ width:170, flexShrink:0 }}>
      <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:8 }}>STATS</div>
      {card("🔥 Max Temp",  `${maxTemp}°F`, "Highest recorded", "#ef4444")}
      {card("❄️ Min Temp",  `${minTemp}°F`, "Lowest recorded",  "#06b6d4")}
      {card("📊 Avg Temp",  `${avgTemp}°F`, "Overall average",  c)}
      {card("📈 Trend",     `${trend} ${lastTemp}°F`, `Started at ${firstTemp}°F`, trendCol)}

      <div style={{ background:t.card, border:`1px solid ${t.grid}`, borderRadius:8, padding:"10px 12px", marginBottom:8 }}>
        <div style={{ fontSize:10, color:t.axis, fontWeight:600, marginBottom:8 }}>SKY CONDITIONS</div>
        {topCond.map(([cond, count]) => (
          <div key={cond} style={{ marginBottom:7 }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:t.text, marginBottom:3 }}>
              <span>{COND_EMOJI[cond]||"🌡"} {COND_LABEL[cond]||cond}</span>
              <span style={{ color:t.axis }}>{((count/data.length)*100).toFixed(0)}%</span>
            </div>
            <div style={{ background:t.grid, borderRadius:4, height:4 }}>
              <div style={{ width:`${(count/data.length)*100}%`, height:"100%", background:c, borderRadius:4, opacity:0.75 }} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ background:t.card, border:`1px solid ${t.grid}`, borderRadius:8, padding:"10px 12px" }}>
        <div style={{ fontSize:10, color:t.axis, fontWeight:600, marginBottom:6 }}>LINE COLOR</div>
        {Object.entries(COLOR_THEMES).map(([k, col]) => (
          <div key={k} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:5 }}>
            <div style={{ width:20, height:3, background:col, borderRadius:2 }} />
            <span style={{ fontSize:10, color:t.text }}>{k}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 2D Chart ─────────────────────────────────────────────────────────────────
function Chart2D({ theme, color, onData }) {
  const svgRef = useRef(null);
  const wrapRef = useRef(null);
  const t = THEMES[theme];
  const c = COLOR_THEMES[color];

  useEffect(() => {
    if (!svgRef.current || !wrapRef.current) return;

    d3.csv("/fcm.csv").then(raw => {
      const data = raw.map(d => ({
        date:        new Date(d.date),
        temperature: +d.temperature,
        condition:   (d.condition || "").trim(),
      })).filter(d => isFinite(d.temperature));

      onData(data);

      // ── FIX: Use wrapper width for responsive full-width chart ────────────
      const W      = wrapRef.current.clientWidth || 700;
      const H      = 440;
      const margin = { top:28, right:60, bottom:48, left:58 };

      const x = d3.scaleUtc()
        .domain(d3.extent(data, d => d.date))
        .range([margin.left, W - margin.right]);

      const y = d3.scaleLinear()
        .domain(d3.extent(data, d => d.temperature)).nice()
        .range([H - margin.bottom, margin.top]);

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
          g.selectAll("line").style("stroke", t.grid).style("stroke-dasharray","3,3");
        });

      // 0°F line
      if (y.domain()[0] < 0) {
        svg.append("line")
          .attr("x1",margin.left).attr("x2",W-margin.right)
          .attr("y1",y(0)).attr("y2",y(0))
          .attr("stroke","#ef4444").attr("stroke-width",1.2)
          .attr("stroke-dasharray","6,4").attr("opacity",0.6);
        svg.append("text")
          .attr("x",margin.left+6).attr("y",y(0)-5)
          .attr("font-size","9px").attr("fill","#ef4444").attr("font-weight","600")
          .text("0°F");
      }

      // Area fill
      const areaCol = d3.color(c); areaCol.opacity = 0.10;
      svg.append("path").datum(data)
        .attr("fill", areaCol.formatRgb())
        .attr("d", d3.area()
          .x(d => x(d.date)).y0(H-margin.bottom).y1(d => y(d.temperature))
          .curve(d3.curveMonotoneX)
        );

      // Main line
      svg.append("path").datum(data)
        .attr("fill","none").attr("stroke", c)
        .attr("stroke-width", 2.2)
        .attr("stroke-linejoin","round").attr("stroke-linecap","round")
        .attr("d", d3.line()
          .x(d => x(d.date)).y(d => y(d.temperature))
          .curve(d3.curveMonotoneX)
        );

      // First value label
      const first = data[0];
      svg.append("circle")
        .attr("cx",x(first.date)).attr("cy",y(first.temperature))
        .attr("r",5).attr("fill",c).attr("stroke","#fff").attr("stroke-width",2);
      svg.append("text")
        .attr("x",x(first.date)-8).attr("y",y(first.temperature))
        .attr("text-anchor","end").attr("dy","0.35em")
        .attr("font-size","10px").attr("font-weight","700").attr("fill",c)
        .text(`${first.temperature}°F`);

      // Last value label
      const last = data[data.length-1];
      svg.append("circle")
        .attr("cx",x(last.date)).attr("cy",y(last.temperature))
        .attr("r",5).attr("fill",c).attr("stroke","#fff").attr("stroke-width",2);
      svg.append("text")
        .attr("x",x(last.date)+8).attr("y",y(last.temperature))
        .attr("text-anchor","start").attr("dy","0.35em")
        .attr("font-size","10px").attr("font-weight","700").attr("fill",c)
        .text(`${last.temperature}°F`);

      // Min dot + label
      const dMin = d3.least(data, d => d.temperature);
      svg.append("circle")
        .attr("cx",x(dMin.date)).attr("cy",y(dMin.temperature))
        .attr("r",6).attr("fill","#06b6d4").attr("stroke","#fff").attr("stroke-width",2);
      svg.append("text")
        .attr("x",x(dMin.date)).attr("y",y(dMin.temperature)+16)
        .attr("text-anchor","middle")
        .attr("font-size","9px").attr("font-weight","700").attr("fill","#06b6d4")
        .text(`❄️ ${dMin.temperature}°F`);

      // Max dot + label
      const dMax = d3.greatest(data, d => d.temperature);
      svg.append("circle")
        .attr("cx",x(dMax.date)).attr("cy",y(dMax.temperature))
        .attr("r",6).attr("fill","#ef4444").attr("stroke","#fff").attr("stroke-width",2);
      svg.append("text")
        .attr("x",x(dMax.date)).attr("y",y(dMax.temperature)-12)
        .attr("text-anchor","middle")
        .attr("font-size","9px").attr("font-weight","700").attr("fill","#ef4444")
        .text(`🔥 ${dMax.temperature}°F`);

      // Focus line + dot
      const focus = svg.append("g").style("display","none");
      focus.append("line").attr("y1",margin.top).attr("y2",H-margin.bottom)
        .attr("stroke",c).attr("stroke-width",1).attr("stroke-dasharray","4,3").attr("opacity",0.5);
      focus.append("circle").attr("r",5).attr("fill",c).attr("stroke","#fff").attr("stroke-width",2);
      const focusLabel = focus.append("g");
      focusLabel.append("rect").attr("rx",4).attr("fill",t.card).attr("stroke",c).attr("stroke-width",1);
      focusLabel.append("text").attr("class","flbl").attr("font-size","10px").attr("font-weight","700");

      // Tooltip
      const tooltip = d3.select("body").append("div")
        .style("position","absolute")
        .style("background", theme==="Dark" ? "rgba(15,23,42,0.97)" : "rgba(15,23,42,0.92)")
        .style("color","#fff").style("padding","8px 12px").style("border-radius","8px")
        .style("font-size","12px").style("pointer-events","none").style("opacity",0)
        .style("border",`1.5px solid ${c}`).style("z-index","9999").style("line-height","1.7");

      const bisect = d3.bisector(d => d.date).left;

      svg.append("rect")
        .attr("x",margin.left).attr("y",margin.top)
        .attr("width", W-margin.left-margin.right)
        .attr("height", H-margin.top-margin.bottom)
        .attr("fill","transparent").style("cursor","crosshair")
        .on("mousemove", function(event) {
          const mx   = d3.pointer(event,this)[0];
          const date = x.invert(mx + margin.left);
          const idx  = Math.min(bisect(data, date), data.length-1);
          const d    = data[idx];
          if (!d) return;

          const cx = x(d.date), cy = y(d.temperature);
          focus.style("display","block");
          focus.select("line").attr("x1",cx).attr("x2",cx);
          focus.select("circle").attr("cx",cx).attr("cy",cy);

          const lx = cx + (cx > W*0.75 ? -60 : 8);
          const ly = cy - 22;
          focusLabel.attr("transform",`translate(${lx},${ly})`);
          focusLabel.select(".flbl").attr("x",6).attr("y",14).attr("fill",c).text(`${d.temperature}°F`);
          const bbox = focusLabel.select(".flbl").node().getBBox();
          focusLabel.select("rect").attr("width",bbox.width+12).attr("height",bbox.height+8);

          tooltip.style("opacity",1)
            .html(
              `<div style="font-weight:700;color:${c};margin-bottom:4px">${d3.timeFormat("%b %d, %H:%M")(d.date)}</div>` +
              `🌡 Temperature: <b>${d.temperature}°F</b><br/>` +
              `${COND_EMOJI[d.condition]||"🌡"} Condition: <b>${COND_LABEL[d.condition]||d.condition}</b>`
            )
            .style("left",(event.pageX+14)+"px").style("top",(event.pageY-14)+"px");
        })
        .on("mouseleave", () => { focus.style("display","none"); tooltip.style("opacity",0); });

      // X axis
      svg.append("g").attr("transform",`translate(0,${H-margin.bottom})`)
        .call(d3.axisBottom(x).ticks(d3.timeDay.every(3)).tickFormat(d3.timeFormat("%b %d")))
        .call(g => {
          g.select(".domain").style("stroke",t.grid);
          g.selectAll("line").style("stroke",t.grid);
          g.selectAll("text").style("fill",t.axis).style("font-size","10px").attr("dy","1em");
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
  }, [theme, color]);

  return (
    <div ref={wrapRef} style={{
      border:`1px solid ${t.grid}`, borderRadius:8,
      overflow:"hidden", background:t.bg, width:"100%",
    }}>
      <svg ref={svgRef} style={{ display:"block", width:"100%" }} />
    </div>
  );
}

// ─── 3D Chart ─────────────────────────────────────────────────────────────────
function Chart3D({ theme, color }) {
  const mountRef   = useRef(null);
  const overlayRef = useRef(null);
  const t          = THEMES[theme];
  const c          = COLOR_THEMES[color];

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);

    const W = el.clientWidth || 700;
    const H = 460;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(theme==="Dark" ? 0x0f172a : 0xf8fafc);

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

    d3.csv("/fcm.csv").then(raw => {
      const data = raw.map(d => ({
        date:        new Date(d.date),
        temperature: +d.temperature,
        condition:   (d.condition||"").trim(),
      })).filter(d => isFinite(d.temperature));

      const dateExtent = d3.extent(data, d => d.date);
      const tempExtent = d3.extent(data, d => d.temperature);
      const xScale = d3.scaleUtc().domain(dateExtent).range([-9, 9]);
      const yScale = d3.scaleLinear().domain(tempExtent).nice().range([-6, 6]);
      const col    = new THREE.Color(c);

      for (let i = 0; i < data.length-1; i++) {
        const d1 = data[i], d2 = data[i+1];
        const p1 = new THREE.Vector3(xScale(d1.date), yScale(d1.temperature), 0);
        const p2 = new THREE.Vector3(xScale(d2.date), yScale(d2.temperature), 0);
        const tube = new THREE.Mesh(
          new THREE.TubeGeometry(new THREE.LineCurve3(p1,p2), 4, 0.045, 5, false),
          new THREE.MeshStandardMaterial({
            color:col, roughness:0.22, metalness:0.45,
            emissive:col, emissiveIntensity:0.20,
            transparent:true, opacity:0.88,
          })
        );
        tube.castShadow=true; pivot.add(tube);

        if (i % 12 === 0) {
          const drop = new THREE.Mesh(
            new THREE.BoxGeometry(0.015, yScale(d1.temperature)+7.5, 0.015),
            new THREE.MeshBasicMaterial({ color:col, transparent:true, opacity:0.12 })
          );
          drop.position.set(p1.x, (-6+yScale(d1.temperature))/2, 0);
          pivot.add(drop);
        }
      }

      // Min / Max dots
      const dMin = d3.least(data,    d => d.temperature);
      const dMax = d3.greatest(data, d => d.temperature);
      [
        { d:dMin, dc:new THREE.Color("#06b6d4"), emoji:"❄️", label:"Min" },
        { d:dMax, dc:new THREE.Color("#ef4444"), emoji:"🔥", label:"Max" },
      ].forEach(({ d, dc, emoji, label }) => {
        const dot = new THREE.Mesh(
          new THREE.SphereGeometry(0.20, 16, 16),
          new THREE.MeshStandardMaterial({ color:dc, roughness:0.1, metalness:0.6, emissive:dc, emissiveIntensity:0.7 })
        );
        dot.position.set(xScale(d.date), yScale(d.temperature), 0);
        pivot.add(dot);
        labelAnchors.push({
          pos:  new THREE.Vector3(xScale(d.date), yScale(d.temperature)+0.8, 0),
          text: `${emoji} ${label} ${d.temperature}°F`,
          col:  `#${dc.getHexString()}`, type:"val",
        });
      });

      // Edge dots
      [
        { d:data[0],              label:`Start: ${data[0].temperature}°F` },
        { d:data[data.length-1],  label:`End: ${data[data.length-1].temperature}°F` },
      ].forEach(({ d, label }) => {
        const dot = new THREE.Mesh(
          new THREE.SphereGeometry(0.13, 12, 12),
          new THREE.MeshStandardMaterial({ color:col, roughness:0.2, emissive:col, emissiveIntensity:0.4 })
        );
        dot.position.set(xScale(d.date), yScale(d.temperature), 0);
        pivot.add(dot);
        labelAnchors.push({ pos:new THREE.Vector3(xScale(d.date), yScale(d.temperature)+0.65, 0), text:label, col:c, type:"edge" });
      });

      // Date labels
      d3.timeDays(dateExtent[0], dateExtent[1], 4).forEach(day => {
        labelAnchors.push({ pos:new THREE.Vector3(xScale(day),-7.8,0), text:d3.timeFormat("%b %d")(day), col:t.axis, type:"date" });
      });

      // Temp labels
      yScale.ticks(6).forEach(temp => {
        labelAnchors.push({ pos:new THREE.Vector3(-10.2, yScale(temp), 0), text:`${temp}°F`, col:temp<0?"#ef4444":t.axis, type:"temp" });
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

      let isDragging=false, prevX=0, prevY=0, rotX=0.20, rotY=0, autoSpin=true;
      pivot.rotation.x=rotX; pivot.rotation.y=rotY;

      const onDown = e => { e.preventDefault(); isDragging=true; prevX=e.clientX; prevY=e.clientY; autoSpin=false; renderer.domElement.style.cursor="grabbing"; };
      const onUp   = () => { isDragging=false; renderer.domElement.style.cursor="grab"; };
      const onMove = e => {
        if (!isDragging) return;
        rotY += (e.clientX-prevX)*0.007;
        rotX  = Math.max(-0.6, Math.min(0.6, rotX+(e.clientY-prevY)*0.004));
        prevX=e.clientX; prevY=e.clientY;
      };

      renderer.domElement.addEventListener("mousedown", onDown);
      window.addEventListener("mouseup", onUp);
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
        window.removeEventListener("mouseup", onUp);
        window.removeEventListener("mousemove", onMove);
      };
    });

    return () => { cancelAnimationFrame(animId); renderer.dispose(); if(el.contains(renderer.domElement)) el.removeChild(renderer.domElement); };
  }, [theme, color]);

  const jsxLabels = Array.from({ length: 40 }, (_, i) => ({
    type: i < 2 ? "val" : i < 4 ? "edge" : i < 14 ? "date" : "temp",
  }));

  return (
    <div style={{ position:"relative", userSelect:"none", border:`1px solid ${t.grid}`, borderRadius:8, overflow:"hidden", width:"100%" }}>
      <div ref={mountRef} style={{ width:"100%", height:460, cursor:"grab", overflow:"hidden" }} />
      <div ref={overlayRef} style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
        {jsxLabels.map((a,i) => (
          <div key={i} className="shlbl" style={{
            position:"absolute",
            transform: a.type==="temp"  ? "translate(-100%,-50%)"
                     : a.type==="date"  ? "translate(-50%,0%)"
                     : "translate(-50%,-100%)",
            background: theme==="Dark" ? "rgba(15,23,42,0.92)" : "rgba(255,255,255,0.95)",
            color: theme==="Dark" ? "#f1f5f9" : "#334155",
            fontSize: a.type==="val" ? 10 : 8, fontWeight:"600",
            padding: a.type==="val" ? "3px 7px" : "2px 5px",
            borderRadius:4, border:`1px solid ${t.grid}`,
            whiteSpace:"nowrap", pointerEvents:"none",
            boxShadow:"0 1px 4px rgba(0,0,0,0.10)", opacity:0,
          }} />
        ))}
      </div>
      <div style={{ padding:"7px 14px", background:theme==="Dark"?"#1e293b":"#f8fafc", borderTop:`1px solid ${t.grid}`, fontSize:11, color:t.axis }}>
        💡 Drag to rotate · auto-spins ·
        <span style={{ color:"#06b6d4", fontWeight:700, marginLeft:6 }}>❄️ Min</span>
        <span style={{ color:"#ef4444", fontWeight:700, marginLeft:8 }}>🔥 Max</span>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const VariableColorChart = () => {
  const [viewMode,  setViewMode]  = useState("2d");
  const [theme,     setTheme]     = useState("Light");
  const [color,     setColor]     = useState("Blue");
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
        <div style={{ fontSize:16, fontWeight:"bold", color:t.text }}>Variable Color Chart</div>
        <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>
          Temperature readings · Nov–Dec 2019 · Hover for details
        </div>
      </div>

      {/* Controls — ── FIX: sirf dropdowns, no swatches ───────────────────── */}
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
          <label style={{ fontSize:11, color:"#94a3b8", fontWeight:"600" }}>Color</label>
          <select value={color} onChange={e => setColor(e.target.value)} style={ddStyle}>
            {Object.keys(COLOR_THEMES).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </div>

      {/* ── FIX: Chart takes full width, Stats on right ───────────────────── */}
      <div style={{ display:"flex", gap:14, alignItems:"flex-start", width:"100%" }}>
        <div style={{ flex:1, minWidth:0 }}>
          {viewMode === "2d"
            ? <Chart2D key={`2d-${theme}-${color}`} theme={theme} color={color} onData={setChartData} />
            : <Chart3D key={`3d-${theme}-${color}`} theme={theme} color={color} />
          }
        </div>
        <StatsPanel data={chartData} color={color} theme={theme} />
      </div>

      <div style={{ marginTop:10, fontSize:11, color:"#94a3b8" }}>
        💡 2D: Hover for temperature &amp; condition details · 3D: Drag to rotate
      </div>
    </div>
  );
};

export default VariableColorChart;