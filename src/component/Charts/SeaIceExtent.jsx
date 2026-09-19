import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as THREE from "three";

const THEMES = {
  Light: { bg:"#f8fafc", text:"#1e293b", grid:"#e2e8f0", axis:"#64748b", card:"#ffffff", threeBg:0xf8fafc },
  Dark:  { bg:"#0f172a", text:"#f1f5f9", grid:"#1e293b", axis:"#94a3b8", card:"#1e293b", threeBg:0x0f172a },
};

const COLOR_SCHEMES = {
  Spectral: t => d3.interpolateSpectral(1 - t),
  Viridis:  d3.interpolateViridis,
  Plasma:   d3.interpolatePlasma,
  Turbo:    d3.interpolateTurbo,
};

function intrayear(date) {
  const d = new Date(+date);
  d.setUTCFullYear(2000);
  return d;
}

function ChartExplainer({ data, theme, mode }) {
  const t = THEMES[theme];
  if (!data || !data.length) return null;
  const years = [...new Set(data.map(d => d.date.getUTCFullYear()))].sort((a,b)=>a-b);
  return (
    <div style={{ background:t.card, border:`1px solid ${t.grid}`, borderRadius:8, padding:"10px 12px", marginBottom:8 }}>
      <div style={{ fontSize:10, color:t.axis, fontWeight:600, marginBottom:6 }}>HOW TO READ THIS</div>
      <div style={{ fontSize:11, color:t.text, lineHeight:1.6 }}>
        Each line = <b>one full year</b> ({years[0]}–{years[years.length-1]}).<br/>
        Ice <b>grows in winter</b>, <b>melts in summer</b>.<br/>
        {mode === "3d" && <>Each year = own <b>Z depth</b> — drag to see.</>}
      </div>
    </div>
  );
}

function StatsPanel({ data, colorScheme, theme }) {
  const t = THEMES[theme];
  if (!data || !data.length) return null;
  const years  = [...new Set(data.map(d => d.date.getUTCFullYear()))];
  const minD   = d3.least(data,    d => d.value);
  const maxD   = d3.greatest(data, d => d.value);
  const interp = COLOR_SCHEMES[colorScheme];
  const card = (label, value, sub, col) => (
    <div style={{ background:t.card, border:`1px solid ${t.grid}`, borderRadius:8, padding:"10px 12px", marginBottom:8, borderLeft:`3px solid ${col}` }}>
      <div style={{ fontSize:10, color:t.axis, fontWeight:600, marginBottom:3, whiteSpace:"nowrap" }}>{label}</div>
      <div style={{ fontSize:15, fontWeight:700, color:col, whiteSpace:"nowrap" }}>{value}</div>
      {sub && <div style={{ fontSize:10, color:t.axis, marginTop:2 }}>{sub}</div>}
    </div>
  );
  const stops = d3.range(0,1.01,0.1).map(v => interp(v));
  return (
    <>
      {card("YEARS TRACKED", years.length, `${years[0]}–${years[years.length-1]}`, "#6366f1")}
      {card("🔥 MAX EXTENT", `${maxD.value.toFixed(2)}M km²`, d3.timeFormat("%b %Y")(maxD.date), interp(1))}
      {card("❄️ MIN EXTENT", `${minD.value.toFixed(2)}M km²`, d3.timeFormat("%b %Y")(minD.date), interp(0))}
      <div style={{ background:t.card, border:`1px solid ${t.grid}`, borderRadius:8, padding:"10px 12px" }}>
        <div style={{ fontSize:10, color:t.axis, fontWeight:600, marginBottom:8 }}>{colorScheme.toUpperCase()} SCALE</div>
        <div style={{ height:12, borderRadius:6, marginBottom:6, background:`linear-gradient(to right, ${stops.join(",")})` }} />
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:9, color:t.axis, marginBottom:10 }}>
          <span>Early years</span><span>Recent years</span>
        </div>
        {Object.keys(COLOR_SCHEMES).map(k => {
          const s2 = d3.range(0,1.01,0.25).map(v => COLOR_SCHEMES[k](v));
          return (
            <div key={k} style={{ marginBottom:7 }}>
              <div style={{ fontSize:10, color:t.text, marginBottom:3, fontWeight: k===colorScheme?"700":"400" }}>{k}</div>
              <div style={{ height:6, borderRadius:3, background:`linear-gradient(to right, ${s2.join(",")})`, opacity: k===colorScheme?1:0.4 }} />
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── 2D Chart — FIX: only key years labeled, rest via hover ───────────────────
function Chart2D({ theme, colorScheme, replay, onData, highlightYear, setHighlightYear }) {
  const wrapRef = useRef(null);
  const t       = THEMES[theme];

  useEffect(() => {
    if (!wrapRef.current) return;
    d3.csv("/sea-ice-extent.csv", d => ({ date:new Date(d.date), value:+d.extent })).then(raw => {
      const data = raw.filter(d => !isNaN(d.date) && d.value > 0);
      if (!data.length) return;
      onData(data);

      const W = wrapRef.current.clientWidth || 640;
      const H = 480;
      const margin = { top:24, right:68, bottom:38, left:60 };

      d3.select(wrapRef.current).selectAll("*").remove();

      const allYears = [...new Set(data.map(d => d.date.getUTCFullYear()))].sort((a,b)=>a-b);
      const firstY = allYears[0], lastY = allYears[allYears.length-1];

      const x = d3.scaleUtc().domain([Date.UTC(2000,0,1), Date.UTC(2001,0,0)]).range([margin.left, W-margin.right]);
      const y = d3.scaleLinear().domain([0, d3.max(data,d=>d.value)]).nice().range([H-margin.bottom, margin.top]);
      const color = d3.scaleSequential().domain(d3.extent(data,d=>d.date.getUTCFullYear())).interpolator(COLOR_SCHEMES[colorScheme]);
      const lineGen = d3.line().defined(d=>!isNaN(d.value)).x(d=>x(intrayear(d.date))).y(d=>y(d.value));

      // ── FIX: which years to permanently label ─────────────────────────────
      // Only show first year, last year, and every 10 years in between
      const labelYears = new Set(
        allYears.filter(yr => yr === firstY || yr === lastY || yr % 10 === 0)
      );

      const svg = d3.select(wrapRef.current).append("svg")
        .attr("width",W).attr("height",H).style("background",t.bg).style("border-radius","8px");

      // Grid
      svg.append("g").attr("transform",`translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(8).tickFormat("").tickSize(-(W-margin.left-margin.right)))
        .call(g => { g.select(".domain").remove(); g.selectAll("line").style("stroke",t.grid).style("stroke-dasharray","3,3"); });

      // X axis
      svg.append("g").attr("transform",`translate(0,${H-margin.bottom})`)
        .call(d3.axisBottom(x).ticks(W/80,"%B"))
        .call(g => { g.select(".domain").style("stroke",t.grid); g.selectAll("line").style("stroke",t.grid); g.selectAll("text").style("fill",t.axis).style("font-size","10px"); });

      // Y axis
      svg.append("g").attr("transform",`translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(8,"s"))
        .call(g => { g.select(".domain").remove(); g.selectAll("line").remove(); g.selectAll("text").style("fill",t.axis).style("font-size","10px"); });

      svg.append("text").attr("x",margin.left).attr("y",margin.top-8)
        .attr("fill",t.text).attr("font-size","11px").attr("font-weight","600").text("↑ Sea ice extent (million km²)");

      const linesG = svg.append("g").attr("fill","none").attr("stroke-width",1.4);

      // Tooltip
      const tooltip = d3.select("body").append("div")
        .style("position","absolute").style("background","rgba(15,23,42,0.92)")
        .style("color","#fff").style("padding","8px 12px").style("border-radius","8px")
        .style("font-size","12px").style("pointer-events","none").style("opacity",0)
        .style("z-index","9999").style("line-height","1.7");

      // ── FIX: Inline tooltip near line end — shows on hover instead of permanent label ──
      const inlineTip = svg.append("g").style("display","none");
      inlineTip.append("rect").attr("rx",4).attr("fill","rgba(15,23,42,0.85)").attr("stroke","transparent").attr("stroke-width",1);
      inlineTip.append("text").attr("class","itxt").attr("font-size",10).attr("font-weight","700").attr("fill","#fff");

      let cancelled = false;
      const yearEndPoints = []; // store {year, col, px, py} for permanent labels

      (async function animate() {
        const groups = [...d3.group(data, d => d.date.getUTCFullYear())];

        for (const [year, values] of groups) {
          if (cancelled) break;
          const yearCol = color(year);
          const validValues = values.filter(d => !isNaN(d.value));
          const lastValid = validValues[validValues.length-1];

          const path = linesG.append("path").datum(values).attr("class",`yline-${year}`)
            .attr("stroke",yearCol).attr("d",lineGen).attr("stroke-dasharray","0,1")
            .style("cursor","pointer")
            .on("mouseover", function(event) {
              setHighlightYear(year);
              const last = validValues[validValues.length-1];
              // Show inline tip near end of line
              if (lastValid) {
                const lx = x(intrayear(lastValid.date)) + 6;
                const ly = y(lastValid.value);
                inlineTip.style("display","block");
                const txt = inlineTip.select(".itxt").text(year);
                const bb  = txt.node().getBBox();
                inlineTip.attr("transform",`translate(${lx},${ly - bb.height/2 - 3})`);
                inlineTip.select("rect")
                  .attr("x",-3).attr("y",-1)
                  .attr("width", bb.width+10).attr("height", bb.height+4)
                  .attr("stroke", yearCol);
                txt.attr("x",3).attr("y", bb.height-2).attr("fill", yearCol);
              }
              tooltip.style("opacity",1).style("border",`1.5px solid ${yearCol}`)
                .html(`<b style="color:${yearCol}">${year}</b><br/>Dec: <b>${last.value.toFixed(2)}M km²</b><br/>Annual min: <b>${d3.min(validValues,d=>d.value).toFixed(2)}M km²</b>`)
                .style("left",(event.pageX+16)+"px").style("top",(event.pageY-14)+"px");
            })
            .on("mousemove", e => tooltip.style("left",(e.pageX+16)+"px").style("top",(e.pageY-14)+"px"))
            .on("mouseout", () => {
              setHighlightYear(null);
              tooltip.style("opacity",0);
              inlineTip.style("display","none");
            });

          // Store end point for permanent labels
          if (lastValid) {
            yearEndPoints.push({ year, col:yearCol, px: x(intrayear(lastValid.date)), py: y(lastValid.value) });
          }

          const len = path.node().getTotalLength();
          if (!len) continue;
          await path.transition().duration(350).ease(d3.easeLinear)
            .attr("stroke-dasharray",`${len},${len}`).end().catch(()=>{});
        }

        if (cancelled) return;

        // ── FIX: Only draw permanent labels for key years ────────────────────
        // Use a simple min-distance filter to avoid any overlap
        const labelG = svg.append("g");
        const drawnYs = []; // track Y positions already drawn

        // Sort by Y so we process from top to bottom
        const sorted = [...yearEndPoints].sort((a,b) => a.py - b.py);

        sorted.forEach(d => {
          if (!labelYears.has(d.year)) return;

          // Skip if too close to already-drawn label (within 12px)
          const tooClose = drawnYs.some(dy => Math.abs(dy - d.py) < 12);
          if (tooClose) return;
          drawnYs.push(d.py);

          // Short leader line
          labelG.append("line")
            .attr("x1", d.px + 3).attr("y1", d.py)
            .attr("x2", d.px + 12).attr("y2", d.py)
            .attr("stroke", d.col).attr("stroke-width", 0.9).attr("opacity", 0.7);

          labelG.append("text")
            .attr("class", `ylabel-${d.year}`)
            .attr("x", d.px + 14).attr("y", d.py)
            .attr("dy","0.32em").attr("fill", d.col)
            .attr("font-size", 9).attr("font-weight", 700)
            .attr("stroke", t.bg).attr("stroke-width", 2.5).attr("paint-order","stroke")
            .style("cursor","pointer")
            .text(d.year)
            .on("mouseover", () => setHighlightYear(d.year))
            .on("mouseout",  () => setHighlightYear(null));
        });

        // ── FIX: Hover guide text at bottom right ────────────────────────────
        svg.append("text")
          .attr("x", W - margin.right - 4).attr("y", H - margin.bottom - 6)
          .attr("text-anchor","end")
          .attr("font-size","10px").attr("fill",t.axis).attr("opacity",0.7)
          .text("hover line for year →");
      })();

      return () => { cancelled = true; tooltip.remove(); };
    });
  }, [theme, colorScheme, replay]);

  // highlight / dim effect
  useEffect(() => {
    if (!wrapRef.current) return;
    const svg = d3.select(wrapRef.current).select("svg");
    if (svg.empty()) return;
    svg.selectAll("g > path").each(function() {
      const cls = d3.select(this).attr("class") || "";
      const isH = highlightYear == null || cls === `yline-${highlightYear}`;
      d3.select(this)
        .attr("stroke-width", cls===`yline-${highlightYear}` ? 3.2 : 1.4)
        .attr("opacity", highlightYear==null ? 1 : (isH ? 1 : 0.10));
      if (cls === `yline-${highlightYear}`) d3.select(this).raise();
    });
    svg.selectAll("text[class^='ylabel-']").each(function() {
      const cls = d3.select(this).attr("class") || "";
      const isH = highlightYear == null || cls === `ylabel-${highlightYear}`;
      d3.select(this).attr("opacity", highlightYear==null ? 1 : (isH ? 1 : 0.1));
    });
  }, [highlightYear]);

  return <div ref={wrapRef} style={{ border:`1px solid ${t.grid}`, borderRadius:8, overflow:"hidden", width:"100%" }} />;
}

// ─── 3D Chart ─────────────────────────────────────────────────────────────────
function Chart3D({ theme, colorScheme }) {
  const mountRef   = useRef(null);
  const overlayRef = useRef(null);
  const t          = THEMES[theme];

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);

    let frameId = requestAnimationFrame(() => {
      const W = el.clientWidth || el.parentElement?.clientWidth || 640;
      const H = 480;
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(t.threeBg);
      const camera = new THREE.PerspectiveCamera(40, W/H, 0.1, 300);
      camera.position.set(0, 0, 24); camera.lookAt(0, 0, 0);
      const renderer = new THREE.WebGLRenderer({ antialias:true });
      renderer.setSize(W, H);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.domElement.style.display = "block";
      renderer.domElement.style.outline = "none";
      renderer.domElement.style.userSelect = "none";
      el.appendChild(renderer.domElement);

      scene.add(new THREE.AmbientLight(0xffffff, 0.85));
      const sun = new THREE.DirectionalLight(0xffffff, 1.0);
      sun.position.set(6,14,10); scene.add(sun);
      scene.add(new THREE.HemisphereLight(0xffffff, 0xe0e7ff, 0.45));

      const floorCol = theme==="Dark" ? 0x1e293b : 0xf1f5f9;
      const gridCol  = theme==="Dark" ? 0x334155 : 0xe2e8f0;
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(36,36),
        new THREE.MeshStandardMaterial({ color:floorCol, roughness:0.9 }));
      floor.rotation.x = -Math.PI/2; floor.position.y = -8; scene.add(floor);
      const grid = new THREE.GridHelper(36, 28, gridCol, gridCol);
      grid.position.y = -7.95; scene.add(grid);

      const pivot = new THREE.Group();
      const labelAnchors = [];
      let animId;

      d3.csv("/sea-ice-extent.csv", d => ({ date:new Date(d.date), value:+d.extent })).then(raw => {
        const data = raw.filter(d => !isNaN(d.date) && d.value > 0);
        if (!data.length) return;

        const years = [...new Set(data.map(d => d.date.getUTCFullYear()))].sort((a,b)=>a-b);
        const maxVal = d3.max(data, d => d.value);
        const xScale = d3.scaleUtc().domain([Date.UTC(2000,0,1), Date.UTC(2001,0,0)]).range([-9,9]);
        const yScale = d3.scaleLinear().domain([0,maxVal]).nice().range([-6,6]);
        const N = years.length;
        const zGap = 0.4;
        const startZ = -(N-1)/2 * zGap;
        const zFor = new Map(years.map((y,i) => [y, startZ+i*zGap]));
        const colorScale = d3.scaleSequential().domain(d3.extent(years)).interpolator(COLOR_SCHEMES[colorScheme]);

        // ── FIX: 3D labels also only key years ────────────────────────────────
        const firstY = years[0], lastY = years[years.length-1];
        const labelYears3D = new Set(years.filter(yr => yr===firstY || yr===lastY || yr%10===0));

        years.forEach(year => {
          const values = data.filter(d => d.date.getUTCFullYear()===year).sort((a,b)=>intrayear(a.date)-intrayear(b.date));
          if (values.length < 2) return;
          const z = zFor.get(year);
          const hex = colorScale(year);
          const col = new THREE.Color(hex);
          for (let i=0; i<values.length-1; i++) {
            const p1 = new THREE.Vector3(xScale(intrayear(values[i].date)), yScale(values[i].value), z);
            const p2 = new THREE.Vector3(xScale(intrayear(values[i+1].date)), yScale(values[i+1].value), z);
            const tube = new THREE.Mesh(
              new THREE.TubeGeometry(new THREE.LineCurve3(p1,p2), 3, 0.05, 5, false),
              new THREE.MeshStandardMaterial({ color:col, roughness:0.25, metalness:0.4, emissive:col, emissiveIntensity:0.22, transparent:true, opacity:0.9 })
            );
            pivot.add(tube);
          }
          const last = values[values.length-1];
          if (labelYears3D.has(year)) {
            labelAnchors.push({ pos:new THREE.Vector3(xScale(intrayear(last.date))+0.35, yScale(last.value), z), text:`${year}`, type:"year" });
          }
        });

        const months = d3.timeMonth.range(new Date(Date.UTC(2000,0,1)), new Date(Date.UTC(2001,0,1)));
        months.forEach(m => labelAnchors.push({ pos:new THREE.Vector3(xScale(m),-7.5,startZ-0.5), text:d3.timeFormat("%b")(m), type:"month" }));
        yScale.ticks(6).forEach(v => labelAnchors.push({ pos:new THREE.Vector3(-10.2,yScale(v),0), text:`${v}M`, type:"val" }));
        labelAnchors.push({ pos:new THREE.Vector3(0,7.5,startZ-0.5), text:"each row = one year · drag to rotate", type:"axis" });

        scene.add(pivot);

        if (overlayRef.current) {
          const divs = overlayRef.current.querySelectorAll(".shlbl");
          labelAnchors.forEach((a,i) => { if (divs[i]) divs[i].textContent = a.text; });
        }

        const toScreen = v3 => {
          const v = v3.clone().project(camera);
          return { sx:(v.x*0.5+0.5)*W, sy:(-v.y*0.5+0.5)*H, behind:v.z>1 };
        };

        let isDragging=false, prevX=0, prevY=0;
        let rotX=0.28, rotY=0.55, autoSpin=true;
        pivot.rotation.x=rotX; pivot.rotation.y=rotY;

        const onDown = e => { e.preventDefault(); isDragging=true; prevX=e.clientX; prevY=e.clientY; autoSpin=false; renderer.domElement.style.cursor="grabbing"; };
        const onUp = () => { isDragging=false; renderer.domElement.style.cursor="grab"; };
        const onMove = e => {
          if (!isDragging) return;
          rotY += (e.clientX-prevX)*0.008;
          rotX = Math.max(-0.7, Math.min(0.7, rotX+(e.clientY-prevY)*0.005));
          prevX=e.clientX; prevY=e.clientY;
        };
        renderer.domElement.addEventListener("mousedown", onDown);
        window.addEventListener("mouseup", onUp);
        window.addEventListener("mousemove", onMove);
        renderer.domElement.style.cursor = "grab";

        const animate = () => {
          animId = requestAnimationFrame(animate);
          if (autoSpin) rotY += 0.004;
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

        el._cleanup = () => {
          cancelAnimationFrame(animId);
          renderer.domElement.removeEventListener("mousedown", onDown);
          window.removeEventListener("mouseup", onUp);
          window.removeEventListener("mousemove", onMove);
          renderer.dispose();
          if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
        };
      });
    });

    return () => { cancelAnimationFrame(frameId); if (el._cleanup) el._cleanup(); };
  }, [theme, colorScheme]);

  // 3D: ~7 key year labels + 12 months + 6 vals + 1 axis = 26
  const jsxLabels = Array.from({ length: 28 }, (_, i) => ({
    type: i < 7 ? "year" : i < 19 ? "month" : i < 25 ? "val" : "axis",
  }));

  return (
    <div style={{ position:"relative", userSelect:"none", border:`1px solid ${THEMES[theme].grid}`, borderRadius:8, overflow:"hidden", width:"100%" }}>
      <div ref={mountRef} style={{ width:"100%", height:480, cursor:"grab", overflow:"hidden" }} />
      <div ref={overlayRef} style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
        {jsxLabels.map((a,i) => (
          <div key={i} className="shlbl" style={{
            position:"absolute",
            transform: a.type==="val" ? "translate(-100%,-50%)" : a.type==="month" ? "translate(-50%,0%)" : a.type==="axis" ? "translate(-50%,-100%)" : "translate(0,-50%)",
            background: theme==="Dark" ? "rgba(15,23,42,0.90)" : "rgba(255,255,255,0.93)",
            color: theme==="Dark" ? "#f1f5f9" : "#334155",
            fontSize: a.type==="axis" ? 10 : 9,
            fontWeight:700,
            padding: a.type==="axis" ? "3px 8px" : "2px 5px",
            borderRadius:3, border:`1px solid ${THEMES[theme].grid}`,
            whiteSpace:"nowrap", pointerEvents:"none",
            boxShadow:"0 1px 3px rgba(0,0,0,0.08)", opacity:0,
          }} />
        ))}
      </div>
      <div style={{ padding:"7px 14px", background: theme==="Dark"?"#1e293b":"#f8fafc", borderTop:`1px solid ${THEMES[theme].grid}`, fontSize:11, color:THEMES[theme].axis }}>
        💡 Drag to rotate · auto-spins
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SeaIceExtent() {
  const [replay,        setReplay]        = useState(0);
  const [viewMode,      setViewMode]      = useState("2d");
  const [theme,         setTheme]         = useState("Light");
  const [colorScheme,   setColorScheme]   = useState("Spectral");
  const [chartData,     setChartData]     = useState([]);
  const [highlightYear, setHighlightYear] = useState(null);

  const t = THEMES[theme];
  const ddStyle = {
    padding:"5px 10px", borderRadius:6, border:`1px solid ${t.grid}`,
    background: theme==="Dark" ? "#1e293b" : "#fff",
    color: t.text, fontWeight:"500", cursor:"pointer", fontSize:12, outline:"none",
  };

  return (
    <div style={{ background: theme==="Dark"?"#0f172a":"#ffffff", borderRadius:12,
      padding:"20px 24px 28px 24px", width:"100%", boxShadow:"0 1px 3px rgba(0,0,0,0.08)", boxSizing:"border-box" }}>
      <div style={{ marginBottom:4 }}>
        <div style={{ fontSize:16, fontWeight:"bold", color:t.text }}>Arctic Sea Ice Extent (1978–2017)</div>
        <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>
          Each line = one year · Hover any line to identify it
        </div>
      </div>

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
          <label style={{ fontSize:11, color:"#94a3b8", fontWeight:"600" }}>Colors</label>
          <select value={colorScheme} onChange={e => setColorScheme(e.target.value)} style={ddStyle}>
            {Object.keys(COLOR_SCHEMES).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        {viewMode === "2d" && (
          <button onClick={() => setReplay(v=>v+1)} style={{ ...ddStyle, cursor:"pointer", fontWeight:"600" }}>↻ Replay</button>
        )}
      </div>

      <div style={{ display:"flex", gap:14, alignItems:"flex-start", width:"100%" }}>
        <div style={{ flex:1, minWidth:0 }}>
          {viewMode === "2d"
            ? <Chart2D key={`2d-${theme}-${colorScheme}`} theme={theme} colorScheme={colorScheme}
                replay={replay} onData={setChartData} highlightYear={highlightYear} setHighlightYear={setHighlightYear} />
            : <Chart3D key={`3d-${theme}-${colorScheme}`} theme={theme} colorScheme={colorScheme} />
          }
        </div>
        <div style={{ width:200, flexShrink:0 }}>
          <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:8 }}>STATS</div>
          <ChartExplainer data={chartData} theme={theme} mode={viewMode} />
          <StatsPanel data={chartData} colorScheme={colorScheme} theme={theme} />
        </div>
      </div>

      <div style={{ marginTop:10, fontSize:11, color:"#94a3b8" }}>
        💡 2D: Hover a line to spotlight + see inline year label · 3D: Drag to rotate
      </div>
    </div>
  );
}