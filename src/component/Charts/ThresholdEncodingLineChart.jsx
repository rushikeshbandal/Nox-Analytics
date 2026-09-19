import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as THREE from "three";

const THEMES = {
  Light: { bg:"#f8fafc", text:"#1e293b", grid:"#e2e8f0", axis:"#64748b", card:"#ffffff", threeBg:0xf8fafc },
  Dark:  { bg:"#0f172a", text:"#f1f5f9", grid:"#1e293b", axis:"#94a3b8", card:"#1e293b", threeBg:0x0f172a },
};

const THRESHOLD_COLORS = {
  RedBlack:    { above:"#ef4444", below:"#1e293b", aboveLabel:"Above median", belowLabel:"Below median" },
  BlueGray:    { above:"#2563eb", below:"#64748b", aboveLabel:"Above median", belowLabel:"Below median" },
  OrangeSlate: { above:"#f97316", below:"#475569", aboveLabel:"Above median", belowLabel:"Below median" },
  GreenPurple: { above:"#22c55e", below:"#7c3aed", aboveLabel:"Above median", belowLabel:"Below median" },
};

// ─── Stats + Legend Panel ─────────────────────────────────────────────────────
function StatsPanel({ data, thresholdColor, theme }) {
  const t = THEMES[theme];
  if (!data || !data.length) return null;

  const temps     = data.map(d => d.temperature);
  const minTemp   = d3.min(temps).toFixed(1);
  const maxTemp   = d3.max(temps).toFixed(1);
  const avgTemp   = d3.mean(temps).toFixed(1);
  const median    = d3.median(temps).toFixed(1);
  const { above, below } = THRESHOLD_COLORS[thresholdColor];

  const aboveCount = data.filter(d => d.temperature >= +median).length;
  const belowCount = data.length - aboveCount;

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

  return (
    <div style={{ width:165, flexShrink:0 }}>
      <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8",
        letterSpacing:"0.08em", marginBottom:8 }}>STATS</div>

      {card("🔥 Max Temp", maxTemp, above)}
      {card("❄️ Min Temp", minTemp, below)}
      {card("📊 Avg Temp", avgTemp, "#6366f1")}

      {/* Threshold info */}
      <div style={{ background:t.card, border:`1px solid ${t.grid}`,
        borderRadius:8, padding:"10px 12px", marginBottom:8 }}>
        <div style={{ fontSize:10, color:t.axis, fontWeight:600, marginBottom:8 }}>
          THRESHOLD
        </div>
        <div style={{ fontSize:14, fontWeight:700, color:t.text, marginBottom:6 }}>
          Median: {median}°F
        </div>
        {/* Split bar */}
        <div style={{ display:"flex", height:10, borderRadius:5, overflow:"hidden", marginBottom:8 }}>
          <div style={{
            width:`${(aboveCount/data.length)*100}%`,
            background:above, opacity:0.85,
          }} />
          <div style={{
            flex:1, background:below, opacity:0.85,
          }} />
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
          <div style={{ display:"flex", alignItems:"center", gap:7 }}>
            <div style={{ width:10, height:10, borderRadius:2, background:above }} />
            <span style={{ fontSize:10, color:t.text }}>Above median</span>
            <span style={{ fontSize:10, color:t.axis, marginLeft:"auto" }}>
              {((aboveCount/data.length)*100).toFixed(0)}%
            </span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:7 }}>
            <div style={{ width:10, height:10, borderRadius:2, background:below }} />
            <span style={{ fontSize:10, color:t.text }}>Below median</span>
            <span style={{ fontSize:10, color:t.axis, marginLeft:"auto" }}>
              {((belowCount/data.length)*100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Color scheme preview */}
      <div style={{ background:t.card, border:`1px solid ${t.grid}`,
        borderRadius:8, padding:"10px 12px" }}>
        <div style={{ fontSize:10, color:t.axis, fontWeight:600, marginBottom:8 }}>
          COLOR SCHEMES
        </div>
        {Object.entries(THRESHOLD_COLORS).map(([k, v]) => (
          <div key={k} style={{ marginBottom:7 }}>
            <div style={{ fontSize:10, color:t.text, marginBottom:3,
              fontWeight: k===thresholdColor ? "700" : "400" }}>{k}</div>
            <div style={{ display:"flex", height:6, borderRadius:3, overflow:"hidden",
              opacity: k===thresholdColor ? 1 : 0.4,
              border: k===thresholdColor ? `1px solid ${t.axis}` : "none",
            }}>
              <div style={{ flex:1, background:v.above }} />
              <div style={{ flex:1, background:v.below }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 2D Chart ─────────────────────────────────────────────────────────────────
function Chart2D({ theme, thresholdColor, onData }) {
  const svgRef  = useRef(null);
  const wrapRef = useRef(null);
  const t       = THEMES[theme];
  const { above, below } = THRESHOLD_COLORS[thresholdColor];

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

      const median    = d3.median(data, d => d.temperature);
      const threshY   = y(median);
      const totalH    = H - margin.top - margin.bottom;
      const offsetPct = ((threshY - margin.top) / totalH) * 100;

      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();
      svg.attr("width", W).attr("height", H);
      svg.append("rect").attr("width",W).attr("height",H)
        .attr("fill",t.bg).attr("rx",8);

      // Y grid
      svg.append("g").attr("transform",`translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(8).tickFormat("").tickSize(-(W-margin.left-margin.right)))
        .call(g => {
          g.select(".domain").remove();
          g.selectAll("line").style("stroke",t.grid).style("stroke-dasharray","3,3");
        });

      // Threshold reference line
      svg.append("line")
        .attr("x1",margin.left).attr("x2",W-margin.right)
        .attr("y1",threshY).attr("y2",threshY)
        .attr("stroke","#94a3b8").attr("stroke-width",1.2)
        .attr("stroke-dasharray","6,4").attr("opacity",0.7);
      svg.append("text")
        .attr("x",margin.left+6).attr("y",threshY-5)
        .attr("font-size","9px").attr("font-weight","700")
        .attr("fill","#94a3b8").text(`Median: ${median.toFixed(1)}°F`);

      // Above/below area fills
      const defs = svg.append("defs");

      // Clip for above-threshold area
      defs.append("clipPath").attr("id","clip-above")
        .append("rect")
        .attr("x",margin.left).attr("y",margin.top)
        .attr("width",W-margin.left-margin.right)
        .attr("height",threshY - margin.top);

      // Clip for below-threshold area
      defs.append("clipPath").attr("id","clip-below")
        .append("rect")
        .attr("x",margin.left).attr("y",threshY)
        .attr("width",W-margin.left-margin.right)
        .attr("height",H-margin.bottom - threshY);

      const aboveCol = d3.color(above); aboveCol.opacity = 0.10;
      const belowCol = d3.color(below); belowCol.opacity = 0.10;

      const areaGen = d3.area()
        .x(d => x(d.date)).y0(H-margin.bottom).y1(d => y(d.temperature))
        .curve(d3.curveMonotoneX);

      svg.append("path").datum(data)
        .attr("fill", aboveCol.formatRgb())
        .attr("clip-path","url(#clip-above)")
        .attr("d", areaGen);

      svg.append("path").datum(data)
        .attr("fill", belowCol.formatRgb())
        .attr("clip-path","url(#clip-below)")
        .attr("d", areaGen);

      // Threshold gradient def
      const gradId = "thresh-grad";
      const grad   = defs.append("linearGradient")
        .attr("id",gradId)
        .attr("gradientUnits","userSpaceOnUse")
        .attr("x1",0).attr("y1",margin.top)
        .attr("x2",0).attr("y2",H-margin.bottom);

      grad.append("stop").attr("offset",`${offsetPct}%`).attr("stop-color",above);
      grad.append("stop").attr("offset",`${offsetPct}%`).attr("stop-color",below);

      // Main line — smooth + threshold gradient
      svg.append("path").datum(data)
        .attr("fill","none")
        .attr("stroke",`url(#${gradId})`)
        .attr("stroke-width",2.5)
        .attr("stroke-linejoin","round").attr("stroke-linecap","round")
        .attr("d", d3.line()
          .x(d => x(d.date)).y(d => y(d.temperature))
          .curve(d3.curveMonotoneX)
        );

      // Min/Max dots
      const dMin = d3.least(data,    d => d.temperature);
      const dMax = d3.greatest(data, d => d.temperature);
      [
        { d:dMin, col:below, label:`❄️ ${dMin.temperature}°F`, off:14 },
        { d:dMax, col:above, label:`🔥 ${dMax.temperature}°F`, off:-12 },
      ].forEach(({ d, col, label, off }) => {
        svg.append("circle")
          .attr("cx",x(d.date)).attr("cy",y(d.temperature))
          .attr("r",6).attr("fill",col).attr("stroke","#fff").attr("stroke-width",2);
        svg.append("text")
          .attr("x",x(d.date)).attr("y",y(d.temperature)+off)
          .attr("text-anchor","middle")
          .attr("font-size","9px").attr("font-weight","700").attr("fill",col)
          .text(label);
      });

      // Focus + tooltip
      const focus = svg.append("g").style("display","none");
      focus.append("line").attr("y1",margin.top).attr("y2",H-margin.bottom)
        .attr("stroke","#94a3b8").attr("stroke-width",1).attr("stroke-dasharray","4,3");
      const focusDot = focus.append("circle").attr("r",5).attr("stroke","#fff").attr("stroke-width",2);
      const focusLbl = focus.append("g");
      focusLbl.append("rect").attr("rx",4).attr("fill",t.card).attr("stroke-width",1);
      focusLbl.append("text").attr("class","ft").attr("font-size","10px").attr("font-weight","700");

      const tooltip = d3.select("body").append("div")
        .style("position","absolute")
        .style("background", theme==="Dark"?"rgba(15,23,42,0.97)":"rgba(15,23,42,0.92)")
        .style("color","#fff").style("padding","8px 12px").style("border-radius","8px")
        .style("font-size","12px").style("pointer-events","none").style("opacity",0)
        .style("z-index","9999").style("line-height","1.7");

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

          const isAbove = d.temperature >= median;
          const dc      = isAbove ? above : below;
          const cx = x(d.date), cy = y(d.temperature);

          focus.style("display","block");
          focus.select("line").attr("x1",cx).attr("x2",cx);
          focusDot.attr("cx",cx).attr("cy",cy).attr("fill",dc);

          const lx = cx + (cx > W*0.75 ? -65 : 8);
          focusLbl.attr("transform",`translate(${lx},${cy-24})`);
          focusLbl.select(".ft").attr("x",6).attr("y",14).attr("fill",dc)
            .text(`${d.temperature}°F`);
          const bb = focusLbl.select(".ft").node().getBBox();
          focusLbl.select("rect").attr("width",bb.width+12).attr("height",bb.height+8)
            .attr("stroke",dc);

          tooltip.style("opacity",1)
            .style("border",`1.5px solid ${dc}`)
            .html(
              `<div style="font-weight:700;color:${dc};margin-bottom:4px">` +
              `${d3.timeFormat("%b %d, %Y")(d.date)}</div>` +
              `🌡 Temperature: <b>${d.temperature}°F</b><br/>` +
              `${isAbove ? "▲" : "▼"} <b>${isAbove ? "Above" : "Below"} median</b> (${median.toFixed(1)}°F)`
            )
            .style("left",(event.pageX+14)+"px").style("top",(event.pageY-14)+"px");
        })
        .on("mouseleave",() => { focus.style("display","none"); tooltip.style("opacity",0); });

      // Axes
      svg.append("g").attr("transform",`translate(0,${H-margin.bottom})`)
        .call(d3.axisBottom(x).ticks(8).tickFormat(d3.timeFormat("%b '%y")))
        .call(g => {
          g.select(".domain").style("stroke",t.grid);
          g.selectAll("line").style("stroke",t.grid);
          g.selectAll("text").style("fill",t.axis).style("font-size","10px");
        });

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
  }, [theme, thresholdColor]);

  return (
    <div ref={wrapRef} style={{
      border:`1px solid ${t.grid}`, borderRadius:8,
      overflow:"hidden", background:t.bg, width:"100%",
    }}>
      <svg ref={svgRef} style={{ display:"block", width:"100%" }} />
    </div>
  );
}

// ─── 3D Chart — AxesHelper REMOVED, tubes, pivot rotation ─────────────────────
function Chart3D({ theme, thresholdColor }) {
  const mountRef   = useRef(null);
  const overlayRef = useRef(null);
  const t          = THEMES[theme];
  const { above, below } = THRESHOLD_COLORS[thresholdColor];

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

      const median     = d3.median(data, d => d.temperature);
      const dateExtent = d3.extent(data, d => d.date);
      const tempExtent = d3.extent(data, d => d.temperature);

      const xScale = d3.scaleUtc().domain(dateExtent).range([-9, 9]);
      const yScale = d3.scaleLinear().domain(tempExtent).nice().range([-6, 6]);

      // Threshold plane (shows median level)
      const medY = yScale(median);
      const planeMat = new THREE.MeshBasicMaterial({
        color: 0x94a3b8, transparent:true, opacity:0.10,
        side: THREE.DoubleSide,
      });
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(18, 0.04), planeMat);
      plane.position.set(0, medY, 0);
      pivot.add(plane);

      // Median label anchor
      labelAnchors.push({
        pos:  new THREE.Vector3(-9.5, medY + 0.4, 0),
        text: `Median: ${median.toFixed(1)}°F`,
        col:  "#94a3b8", type:"median",
      });

      // ── Tubes colored by threshold ────────────────────────────────────────
      for (let i = 0; i < data.length-1; i++) {
        const d1 = data[i], d2 = data[i+1];
        const avgT = (d1.temperature + d2.temperature) / 2;
        const hex  = avgT >= median ? above : below;
        const col  = new THREE.Color(hex);

        const p1 = new THREE.Vector3(xScale(d1.date), yScale(d1.temperature), 0);
        const p2 = new THREE.Vector3(xScale(d2.date), yScale(d2.temperature), 0);

        const tube = new THREE.Mesh(
          new THREE.TubeGeometry(new THREE.LineCurve3(p1,p2), 4, 0.055, 6, false),
          new THREE.MeshStandardMaterial({
            color:col, roughness:0.22, metalness:0.45,
            emissive:col, emissiveIntensity:0.22,
            transparent:true, opacity:0.90,
          })
        );
        tube.castShadow = true;
        pivot.add(tube);

        // Subtle drop lines
        if (i % 14 === 0) {
          const dropH = yScale(d1.temperature) + 7.5;
          const drop  = new THREE.Mesh(
            new THREE.BoxGeometry(0.015, dropH, 0.015),
            new THREE.MeshBasicMaterial({ color:col, transparent:true, opacity:0.10 })
          );
          drop.position.set(p1.x, (-6 + yScale(d1.temperature))/2, 0);
          pivot.add(drop);
        }
      }

      // Min / Max glow dots
      const dMin = d3.least(data,    d => d.temperature);
      const dMax = d3.greatest(data, d => d.temperature);
      [
        { d:dMin, hex:below, label:`❄️ Min ${dMin.temperature}°F` },
        { d:dMax, hex:above, label:`🔥 Max ${dMax.temperature}°F` },
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

      // Month date labels
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
        const isAbove = temp >= median;
        labelAnchors.push({
          pos:  new THREE.Vector3(-10.2, yScale(temp), 0),
          text: `${temp}°F`,
          col:  isAbove ? above : below,
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
  }, [theme, thresholdColor]);

  // ~1 median + 2 val + 12 month + 6 temp = 21
  const jsxLabels = Array.from({ length: 26 }, (_, i) => ({
    type: i===0 ? "median" : i < 3 ? "val" : i < 15 ? "date" : "temp",
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
            transform:     a.type==="temp"   ? "translate(-100%,-50%)"
                         : a.type==="date"   ? "translate(-50%,0%)"
                         : a.type==="median" ? "translate(0,-50%)"
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
        <span style={{ color:above, fontWeight:700, marginLeft:6 }}>■ Above median</span>
        <span style={{ color:below, fontWeight:700, marginLeft:8 }}>■ Below median</span>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const ThresholdEncodingLineChart = () => {
  const [viewMode,        setViewMode]        = useState("2d");
  const [theme,           setTheme]           = useState("Light");
  const [thresholdColor,  setThresholdColor]  = useState("RedBlack");
  const [chartData,       setChartData]       = useState([]);

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
          Threshold Encoding – Temperature
        </div>
        <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>
          Daily temperature · Oct 2011 – Sep 2012 · Color encodes above/below median
        </div>
      </div>

      {/* Controls */}
      <div style={{ display:"flex", gap:10, alignItems:"flex-end",
        marginTop:14, marginBottom:20, flexWrap:"wrap" }}>
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
          <label style={{ fontSize:11, color:"#94a3b8", fontWeight:"600" }}>Colors</label>
          <select value={thresholdColor} onChange={e => setThresholdColor(e.target.value)} style={ddStyle}>
            {Object.keys(THRESHOLD_COLORS).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </div>

      {/* Chart + Stats */}
      <div style={{ display:"flex", gap:14, alignItems:"flex-start", width:"100%" }}>
        <div style={{ flex:1, minWidth:0 }}>
          {viewMode === "2d"
            ? <Chart2D key={`2d-${theme}-${thresholdColor}`} theme={theme} thresholdColor={thresholdColor} onData={setChartData} />
            : <Chart3D key={`3d-${theme}-${thresholdColor}`} theme={theme} thresholdColor={thresholdColor} />
          }
        </div>
        <StatsPanel data={chartData} thresholdColor={thresholdColor} theme={theme} />
      </div>

      <div style={{ marginTop:10, fontSize:11, color:"#94a3b8" }}>
        💡 2D: Hover for details · 3D: Drag to rotate · Dashed line = median threshold
      </div>
    </div>
  );
};

export default ThresholdEncodingLineChart;