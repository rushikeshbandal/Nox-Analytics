import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as THREE from "three";

const THEMES = {
  Light: { bg:"#f8fafc", text:"#1e293b", grid:"#e2e8f0", axis:"#64748b", card:"#ffffff", threeBg:0xf8fafc },
  Dark:  { bg:"#0f172a", text:"#f1f5f9", grid:"#1e293b", axis:"#94a3b8", card:"#1e293b", threeBg:0x0f172a },
};

const COLOR_OPTIONS = {
  OrangeRed:   { start:"#ff7f0e", end:"#d62728" },
  BluePurple:  { start:"#2563eb", end:"#7c3aed" },
  GreenTeal:   { start:"#22c55e", end:"#14b8a6" },
  PinkSlate:   { start:"#ec4899", end:"#475569" },
};

// ─── Stats Panel ──────────────────────────────────────────────────────────────
function StatsPanel({ data, colorScheme, theme }) {
  const t = THEMES[theme];
  const { start, end } = COLOR_OPTIONS[colorScheme];
  if (!data || !data.length) return null;

  const grew        = data.filter(d => d.POP_2015 > d.POP_1980).length;
  const moreIneq     = data.filter(d => d.R90_10_2015 > d.R90_10_1980).length;
  const highlighted  = data.filter(d => d.highlight == 1);

  const card = (label, value, col, sub) => (
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

      {card("📈 Total Metros", data.length, end, "in dataset")}
      {card("🏙️ Pop. Growth", `${grew}/${data.length}`, start, "metros grew 1980→2015")}
      {card("⚖️ More Unequal", `${moreIneq}/${data.length}`, end, "R90/10 increased")}
      {card("⭐ Highlighted", highlighted.length, "#6366f1", "notable metros")}

      <div style={{ background:t.card, border:`1px solid ${t.grid}`,
        borderRadius:8, padding:"10px 12px", marginBottom:8 }}>
        <div style={{ fontSize:10, color:t.axis, fontWeight:600, marginBottom:8 }}>ARC COLORS</div>
        <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:6 }}>
          <div style={{ width:16, height:16, borderRadius:"50%", background:start, flexShrink:0 }} />
          <span style={{ fontSize:10, color:t.text }}>Start point (1980)</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:10 }}>
          <div style={{ width:16, height:3, background:end, borderRadius:2, flexShrink:0 }} />
          <span style={{ fontSize:10, color:t.text }}>Arc → 2015</span>
        </div>
        <div style={{ fontSize:10, color:t.axis, fontWeight:600, marginBottom:6 }}>ALL SCHEMES</div>
        {Object.entries(COLOR_OPTIONS).map(([k, v]) => (
          <div key={k} style={{ marginBottom:6 }}>
            <div style={{ fontSize:10, color:t.text, marginBottom:2,
              fontWeight: k===colorScheme ? "700" : "400" }}>{k}</div>
            <div style={{ display:"flex", height:6, borderRadius:3, overflow:"hidden",
              opacity: k===colorScheme ? 1 : 0.4,
              border: k===colorScheme ? `1px solid ${t.axis}` : "none" }}>
              <div style={{ flex:1, background:v.start }} />
              <div style={{ flex:1, background:v.end }} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ background:t.card, border:`1px solid ${t.grid}`,
        borderRadius:8, padding:"10px 12px" }}>
        <div style={{ fontSize:10, color:t.axis, fontWeight:600, marginBottom:8 }}>NOTABLE METROS</div>
        {highlighted.slice(0,8).map((d,i) => (
          <div key={i} style={{ fontSize:10, color:t.text, marginBottom:5,
            paddingBottom:5, borderBottom: i<highlighted.length-1 ? `1px solid ${t.grid}` : "none" }}>
            <div style={{ fontWeight:700, color:end }}>{d.nyt_display}</div>
            <div style={{ color:t.axis }}>R90/10: {d.R90_10_1980} → {d.R90_10_2015}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 2D Chart — improved readability ──────────────────────────────────────────
function Chart2D({ theme, colorScheme, onData }) {
  const svgRef  = useRef(null);
  const wrapRef = useRef(null);
  const t       = THEMES[theme];
  const { start: startColor, end: endColor } = COLOR_OPTIONS[colorScheme];

  useEffect(() => {
    if (!svgRef.current || !wrapRef.current) return;

    d3.csv("/metros.csv", d3.autoType).then(data => {
      if (!data || !data.length) return;
      onData(data);

      const W      = wrapRef.current.clientWidth || 640;
      const H      = 560;
      // ── FIX: more bottom margin so X axis numbers fully visible ───────────
      const margin = { top:46, right:24, bottom:60, left:64 };

      const padLinear = ([x0,x1], k) => { const dx=(x1-x0)*k/2; return [x0-dx, x1+dx]; };
      const padLog = (x, k) => padLinear(x.map(Math.log), k).map(Math.exp);

      const x = d3.scaleLog()
        .domain(padLog(d3.extent(data.flatMap(d => [d.POP_1980, d.POP_2015])), 0.1))
        .range([margin.left, W-margin.right]);

      const y = d3.scaleLinear()
        .domain(padLinear(d3.extent(data.flatMap(d => [d.R90_10_1980, d.R90_10_2015])), 0.1))
        .range([H-margin.bottom, margin.top]);

      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();
      svg.attr("width", W).attr("height", H);
      svg.append("rect").attr("width",W).attr("height",H).attr("fill",t.bg).attr("rx",8);

      // Title inside chart
      svg.append("text")
        .attr("x",margin.left).attr("y",24)
        .attr("font-size","12px").attr("font-weight","700").attr("fill",t.text)
        .text("Each line traces one metro area's path from 1980 to 2015");

      // Grid
      svg.append("g").attr("stroke",t.grid).attr("stroke-opacity",0.6)
        .selectAll("line").data(x.ticks(6)).join("line")
        .attr("x1",d=>x(d)).attr("x2",d=>x(d))
        .attr("y1",margin.top).attr("y2",H-margin.bottom);

      svg.append("g").attr("stroke",t.grid).attr("stroke-opacity",0.6)
        .selectAll("line").data(y.ticks(8)).join("line")
        .attr("y1",d=>y(d)).attr("y2",d=>y(d))
        .attr("x1",margin.left).attr("x2",W-margin.right);

      const tooltip = d3.select("body").append("div")
        .style("position","absolute")
        .style("background", theme==="Dark"?"rgba(15,23,42,0.97)":"rgba(15,23,42,0.92)")
        .style("color","#fff").style("padding","8px 12px").style("border-radius","8px")
        .style("font-size","12px").style("pointer-events","none").style("opacity",0)
        .style("z-index","9999").style("line-height","1.7");

      const arc = (x1,y1,x2,y2) => {
        const r = Math.hypot(x2-x1, y2-y1) * 1.2;
        return `M ${x1},${y1} A ${r},${r} 0 0,1 ${x2},${y2}`;
      };

      // ── FIX: non-highlighted arcs much fainter so highlighted pop visually ─
      const normal = data.filter(d => d.highlight != 1);
      const hl     = data.filter(d => d.highlight == 1);

      // Draw normal (faint) arcs first
      svg.append("g").attr("fill","none")
        .selectAll("path.arc-normal").data(normal).join("path")
        .attr("d", d => arc(x(d.POP_1980), y(d.R90_10_1980), x(d.POP_2015), y(d.R90_10_2015)))
        .attr("stroke", endColor)
        .attr("stroke-width", 1)
        .attr("opacity", 0.22)
        .style("cursor","pointer")
        .on("mouseover", function(event, d) {
          d3.select(this).attr("stroke-width",2.5).attr("opacity",0.9);
          showTooltip(event, d);
        })
        .on("mousemove", event => tooltip.style("left",(event.pageX+14)+"px").style("top",(event.pageY-14)+"px"))
        .on("mouseout", function() {
          d3.select(this).attr("stroke-width",1).attr("opacity",0.22);
          tooltip.style("opacity",0);
        });

      // Draw highlighted (bold) arcs on top
      svg.append("g").attr("fill","none")
        .selectAll("path.arc-hl").data(hl).join("path")
        .attr("d", d => arc(x(d.POP_1980), y(d.R90_10_1980), x(d.POP_2015), y(d.R90_10_2015)))
        .attr("stroke", endColor)
        .attr("stroke-width", 2.6)
        .attr("opacity", 0.95)
        .style("cursor","pointer")
        .on("mouseover", function(event, d) {
          d3.select(this).attr("stroke-width",4);
          showTooltip(event, d);
        })
        .on("mousemove", event => tooltip.style("left",(event.pageX+14)+"px").style("top",(event.pageY-14)+"px"))
        .on("mouseout", function() {
          d3.select(this).attr("stroke-width",2.6);
          tooltip.style("opacity",0);
        });

      function showTooltip(event, d) {
        const chgPop  = ((d.POP_2015 - d.POP_1980)/d.POP_1980*100).toFixed(1);
        const chgIneq = (d.R90_10_2015 - d.R90_10_1980).toFixed(2);
        tooltip.style("opacity",1)
          .style("border",`1.5px solid ${endColor}`)
          .html(
            `<div style="font-weight:700;color:${endColor};margin-bottom:4px">${d.nyt_display || d.Metro}</div>` +
            `👥 Pop: <b>${d3.format(".2s")(d.POP_1980)}</b> → <b>${d3.format(".2s")(d.POP_2015)}</b> (<b>${chgPop>0?"+":""}${chgPop}%</b>)<br/>` +
            `⚖️ R90/10: <b>${d.R90_10_1980}</b> → <b>${d.R90_10_2015}</b> (<b>${chgIneq>0?"+":""}${chgIneq}</b>)`
          )
          .style("left",(event.pageX+14)+"px").style("top",(event.pageY-14)+"px");
      }

      // Start dots — normal small + faint
      svg.append("g")
        .selectAll("circle.dot-normal").data(normal).join("circle")
        .attr("cx", d => x(d.POP_1980)).attr("cy", d => y(d.R90_10_1980))
        .attr("r", 2.5).attr("fill", startColor).attr("opacity", 0.45);

      // Start dots — highlighted bigger + bold
      svg.append("g")
        .selectAll("circle.dot-hl").data(hl).join("circle")
        .attr("cx", d => x(d.POP_1980)).attr("cy", d => y(d.R90_10_1980))
        .attr("r", 5.5).attr("fill", startColor)
        .attr("stroke","#fff").attr("stroke-width",1.5);

      // End dots for highlighted (so trajectory clear)
      svg.append("g")
        .selectAll("circle.end-hl").data(hl).join("circle")
        .attr("cx", d => x(d.POP_2015)).attr("cy", d => y(d.R90_10_2015))
        .attr("r", 4.5).attr("fill", endColor)
        .attr("stroke","#fff").attr("stroke-width",1.5);

      // ── FIX: smart label placement — avoid overlap with simple offset ─────
      const labelData = [...hl].sort((a,b) => y(a.R90_10_2015) - y(b.R90_10_2015));
      let lastY = -Infinity;
      labelData.forEach(d => {
        let ly = y(d.R90_10_2015);
        if (ly - lastY < 14) ly = lastY + 14;
        lastY = ly;
        d._labelY = ly;
      });

      svg.append("g")
        .selectAll("text").data(labelData).join("text")
        .attr("x", d => x(d.POP_2015) + 9)
        .attr("y", d => d._labelY)
        .attr("dy","0.35em")
        .attr("font-size","10px").attr("font-weight","700")
        .attr("fill", endColor)
        .attr("stroke",t.bg).attr("stroke-width",3).attr("paint-order","stroke")
        .text(d => d.nyt_display || "");

      // ── FIX: X axis with visible formatted numbers + more ticks ───────────
      svg.append("g").attr("transform",`translate(0,${H-margin.bottom})`)
        .call(d3.axisBottom(x).ticks(6, "~s"))
        .call(g => {
          g.select(".domain").style("stroke",t.grid);
          g.selectAll("line").style("stroke",t.grid);
          g.selectAll("text")
            .style("fill",t.axis).style("font-size","10px").style("font-weight","600");
        });

      svg.append("g").attr("transform",`translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(8))
        .call(g => {
          g.select(".domain").remove(); g.selectAll("line").remove();
          g.selectAll("text").style("fill",t.axis).style("font-size","10px");
        });

      svg.append("text")
        .attr("x",(W+margin.left)/2).attr("y",H-12)
        .attr("text-anchor","middle").style("font-size","11px").style("fill",t.axis).style("font-weight","600")
        .text("Metro Area Population (log scale)");

      svg.append("text")
        .attr("transform","rotate(-90)").attr("x",-H/2).attr("y",16)
        .attr("text-anchor","middle").style("font-size","11px").style("fill",t.axis).style("font-weight","600")
        .text("Income Inequality (90th/10th percentile ratio)");

      // Mini legend
      const leg = svg.append("g").attr("transform",`translate(${margin.left+8},${margin.top+10})`);
      leg.append("rect").attr("width",190).attr("height",44).attr("rx",5)
        .attr("fill",t.card).attr("stroke",t.grid).attr("opacity",0.95);
      leg.append("circle").attr("cx",14).attr("cy",14).attr("r",4.5).attr("fill",startColor);
      leg.append("text").attr("x",24).attr("y",18)
        .attr("font-size","9px").attr("fill",t.text).text("Start point (1980)");
      leg.append("line").attr("x1",8).attr("x2",22).attr("y1",32).attr("y2",32)
        .attr("stroke",endColor).attr("stroke-width",2.5);
      leg.append("text").attr("x",26).attr("y",36)
        .attr("font-size","9px").attr("fill",t.text).text("Trajectory to 2015 (bold = notable)");

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

// ─── 3D Chart (unchanged from before, still AxesHelper-free) ─────────────────
function Chart3D({ theme, colorScheme }) {
  const mountRef   = useRef(null);
  const overlayRef = useRef(null);
  const t          = THEMES[theme];
  const { start: startColor, end: endColor } = COLOR_OPTIONS[colorScheme];

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);

    const W = el.clientWidth || 680;
    const H = 460;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(t.threeBg);

    const camera = new THREE.PerspectiveCamera(42, W/H, 0.1, 500);
    camera.position.set(0, 0, 28); camera.lookAt(0, 0, 0);

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
      new THREE.PlaneGeometry(40, 30),
      new THREE.MeshStandardMaterial({ color:floorCol, roughness:0.9 })
    );
    floor.rotation.x = -Math.PI/2; floor.position.y = -8;
    floor.receiveShadow = true; scene.add(floor);
    const grid = new THREE.GridHelper(40, 30, gridCol, gridCol);
    grid.position.y = -7.95; scene.add(grid);

    const pivot        = new THREE.Group();
    const labelAnchors = [];
    let animId;

    d3.csv("/metros.csv", d3.autoType).then(data => {
      if (!data || !data.length) return;

      const xScale = d3.scaleLog()
        .domain(d3.extent(data.flatMap(d => [d.POP_1980, d.POP_2015])))
        .range([-9, 9]);
      const yScale = d3.scaleLinear()
        .domain(d3.extent(data.flatMap(d => [d.R90_10_1980, d.R90_10_2015])))
        .range([-6, 6]);
      const zScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.POP_2015 - d.POP_1980))
        .range([-5, 5]);

      const sCol = new THREE.Color(startColor);
      const eCol = new THREE.Color(endColor);

      data.forEach(d => {
        const isHL = d.highlight == 1;
        const p1   = new THREE.Vector3(xScale(d.POP_1980), yScale(d.R90_10_1980), 0);
        const p2   = new THREE.Vector3(xScale(d.POP_2015), yScale(d.R90_10_2015), zScale(d.POP_2015 - d.POP_1980));

        const mid = new THREE.Vector3(
          (p1.x+p2.x)/2,
          (p1.y+p2.y)/2 + Math.hypot(p2.x-p1.x, p2.y-p1.y)*0.3,
          (p1.z+p2.z)/2
        );
        const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
        const tubeR = isHL ? 0.08 : 0.03;

        const tube = new THREE.Mesh(
          new THREE.TubeGeometry(curve, 12, tubeR, 6, false),
          new THREE.MeshStandardMaterial({
            color:eCol, roughness:0.25, metalness:0.45,
            emissive:eCol, emissiveIntensity: isHL ? 0.35 : 0.10,
            transparent:true, opacity: isHL ? 0.92 : 0.40,
          })
        );
        tube.castShadow = true; pivot.add(tube);

        const dot = new THREE.Mesh(
          new THREE.SphereGeometry(isHL ? 0.18 : 0.08, 10, 10),
          new THREE.MeshStandardMaterial({ color:sCol, roughness:0.2, metalness:0.5, emissive:sCol, emissiveIntensity:isHL?0.5:0.15 })
        );
        dot.position.copy(p1); pivot.add(dot);

        const dot2 = new THREE.Mesh(
          new THREE.SphereGeometry(isHL ? 0.14 : 0.06, 10, 10),
          new THREE.MeshStandardMaterial({ color:eCol, roughness:0.2, metalness:0.5, emissive:eCol, emissiveIntensity:isHL?0.5:0.15 })
        );
        dot2.position.copy(p2); pivot.add(dot2);

        if (isHL) {
          labelAnchors.push({ pos:new THREE.Vector3(p2.x+0.2, p2.y+0.7, p2.z), text:d.nyt_display||"", col:endColor, type:"name" });
        }
      });

      labelAnchors.push({ pos:new THREE.Vector3(0,-8.4,0), text:"Population (log) →", col:t.axis, type:"axis" });
      labelAnchors.push({ pos:new THREE.Vector3(-10.2,0,0), text:"Inequality ↑", col:t.axis, type:"axis" });
      labelAnchors.push({ pos:new THREE.Vector3(0,0,6), text:"Pop Growth →", col:t.axis, type:"axis" });

      scene.add(pivot);

      if (overlayRef.current) {
        const divs = overlayRef.current.querySelectorAll(".shlbl");
        labelAnchors.forEach((a,i) => { if (divs[i]) divs[i].textContent = a.text; });
      }

      const toScreen = v3 => {
        const v = v3.clone().project(camera);
        return { sx:(v.x*0.5+0.5)*W, sy:(-v.y*0.5+0.5)*H, behind:v.z>1 };
      };

      let isDragging=false, prevX=0, prevY=0, rotX=0.25, rotY=0.4, autoSpin=true;
      pivot.rotation.x=rotX; pivot.rotation.y=rotY;

      const onDown = e => { e.preventDefault(); isDragging=true; prevX=e.clientX; prevY=e.clientY; autoSpin=false; renderer.domElement.style.cursor="grabbing"; };
      const onUp   = () => { isDragging=false; renderer.domElement.style.cursor="grab"; };
      const onMove = e => {
        if (!isDragging) return;
        rotY += (e.clientX-prevX)*0.007;
        rotX  = Math.max(-0.7, Math.min(0.7, rotX+(e.clientY-prevY)*0.004));
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
  }, [theme, colorScheme]);

  const jsxLabels = Array.from({ length: 12 }, (_, i) => ({ type: i<9 ? "name" : "axis" }));

  return (
    <div style={{ position:"relative", userSelect:"none", border:`1px solid ${t.grid}`, borderRadius:8, overflow:"hidden", width:"100%" }}>
      <div ref={mountRef} style={{ width:"100%", height:460, cursor:"grab", overflow:"hidden" }} />
      <div ref={overlayRef} style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
        {jsxLabels.map((a,i) => (
          <div key={i} className="shlbl" style={{
            position:"absolute", transform:"translate(-50%,-100%)",
            background: theme==="Dark" ? "rgba(15,23,42,0.92)" : "rgba(255,255,255,0.95)",
            color: theme==="Dark" ? "#f1f5f9" : "#334155",
            fontSize: a.type==="name" ? 9 : 8, fontWeight:"600",
            padding:"2px 6px", borderRadius:4, border:`1px solid ${t.grid}`,
            whiteSpace:"nowrap", pointerEvents:"none",
            boxShadow:"0 1px 4px rgba(0,0,0,0.10)", opacity:0,
          }} />
        ))}
      </div>
      <div style={{ padding:"7px 14px", background: theme==="Dark"?"#1e293b":"#f8fafc", borderTop:`1px solid ${t.grid}`, fontSize:11, color:t.axis }}>
        💡 Drag to rotate · auto-spins ·
        <span style={{ color:startColor, fontWeight:700, marginLeft:6 }}>● 1980 start</span>
        <span style={{ color:endColor, fontWeight:700, marginLeft:8 }}>— Arc → 2015</span>
        · Z = population growth
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const InequalityChart = () => {
  const [viewMode,     setViewMode]     = useState("2d");
  const [theme,        setTheme]        = useState("Light");
  const [colorScheme,  setColorScheme]  = useState("OrangeRed");
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
          Inequality Change: Population vs Income Gap
        </div>
        <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>
          1980 → 2015 · Bold arcs = notable metros · Faint = all others
        </div>
      </div>

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
          <select value={colorScheme} onChange={e => setColorScheme(e.target.value)} style={ddStyle}>
            {Object.keys(COLOR_OPTIONS).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </div>

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
        💡 2D: Hover any arc (faint or bold) for metro details · 3D: Drag to rotate
      </div>
    </div>
  );
};

export default InequalityChart;