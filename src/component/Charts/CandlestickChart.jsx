import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as THREE from "three";

const COLOR_THEMES = {
  Category10: { up: 0x22c55e, down: 0xef4444 },
  Tableau:    { up: 0x4e79a7, down: 0xf28e2b },
  Set2:       { up: 0x66c2a5, down: 0xfc8d62 },
};

const COLOR_THEMES_2D = {
  Category10: { up: "#22c55e", down: "#ef4444" },
  Tableau:    { up: "#4e79a7", down: "#f28e2b" },
  Set2:       { up: "#66c2a5", down: "#fc8d62" },
};

const buildOHLC = (raw) =>
  raw.map((d, i) => {
    const close = +d.close;
    const prev  = i > 0 ? +raw[i - 1].close : close;
    const open  = d.open != null && !isNaN(+d.open) ? +d.open : prev;
    const high  = d.high != null && !isNaN(+d.high) ? +d.high : Math.max(open, close) * (1 + Math.random() * 0.008);
    const low   = d.low  != null && !isNaN(+d.low)  ? +d.low  : Math.min(open, close) * (1 - Math.random() * 0.008);
    return { date: new Date(d.date), open, high, low, close };
  });

const CandlestickChart = () => {
  const svgRef   = useRef(null);
  const threeRef = useRef(null);
  const [theme, setTheme] = useState("Category10");
  const [view,  setView]  = useState("2D");
  const [stats, setStats] = useState(null);

  /* ═══════════════════════════ 2D ═══════════════════════════ */
  useEffect(() => {
    if (view !== "2D") return;

    const W = 900, H = 500;
    const margin = { top: 50, right: 30, bottom: 50, left: 65 };
    const { up, down } = COLOR_THEMES_2D[theme];

    const svg = d3.select(svgRef.current).attr("viewBox", [0, 0, W, H]);
    svg.selectAll("*").remove();

    d3.csv("/aapl.csv").then(raw => {
      const data = buildOHLC(raw).slice(-60);

      const maxHigh = d3.max(data, d => d.high);
      const minLow  = d3.min(data, d => d.low);
      const last    = data[data.length - 1];
      const first   = data[0];
      const bull    = data.filter(d => d.close >= d.open).length;
      const change  = ((last.close - first.open) / first.open * 100).toFixed(2);
      setStats({ last, maxHigh, minLow, bullish: bull, bearish: data.length - bull, change, total: data.length });

      const x = d3.scaleBand()
        .domain(data.map(d => d.date))
        .range([margin.left, W - margin.right])
        .padding(0.3);

      const y = d3.scaleLinear()
        .domain([minLow * 0.995, maxHigh * 1.005])
        .nice()
        .range([H - margin.bottom, margin.top]);

      svg.append("rect").attr("width", W).attr("height", H).attr("fill", "#f8fafc").attr("rx", 8);

      svg.append("g").selectAll("line").data(y.ticks(6)).enter()
        .append("line")
        .attr("x1", margin.left).attr("x2", W - margin.right)
        .attr("y1", d => y(d)).attr("y2", d => y(d))
        .attr("stroke", "#e2e8f0").attr("stroke-dasharray", "4,3");

      svg.append("g").attr("transform", `translate(0,${H - margin.bottom})`)
        .call(d3.axisBottom(x).tickValues(x.domain().filter((_, i) => i % 6 === 0)).tickFormat(d3.timeFormat("%b %d")))
        .call(g => {
          g.select(".domain").style("stroke", "#e2e8f0");
          g.selectAll("text").style("fill", "#64748b").style("font-size", "10px");
          g.selectAll("line").style("stroke", "#e2e8f0");
        });

      svg.append("g").attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(6).tickFormat(d => `$${d}`))
        .call(g => {
          g.select(".domain").style("stroke", "#e2e8f0");
          g.selectAll("text").style("fill", "#64748b").style("font-size", "10px");
          g.selectAll("line").style("stroke", "#e2e8f0");
        });

      const tip = d3.select("body").append("div")
        .style("position", "absolute")
        .style("background", "rgba(15,23,42,0.93)")
        .style("color", "#fff")
        .style("padding", "9px 13px")
        .style("border-radius", "7px")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("border", "1px solid #334155")
        .style("z-index", "9999")
        .style("font-family", "Inter,system-ui,sans-serif");

      svg.append("g").selectAll("line").data(data).enter().append("line")
        .attr("x1", d => x(d.date) + x.bandwidth() / 2)
        .attr("x2", d => x(d.date) + x.bandwidth() / 2)
        .attr("y1", d => y(d.high))
        .attr("y2", d => y(d.low))
        .attr("stroke", d => d.close >= d.open ? up : down)
        .attr("stroke-width", 1.2)
        .attr("opacity", 0.75);

      svg.append("g").selectAll("rect").data(data).enter().append("rect")
        .attr("x",      d => x(d.date))
        .attr("y",      d => y(Math.max(d.open, d.close)))
        .attr("width",  x.bandwidth())
        .attr("height", d => Math.max(1, Math.abs(y(d.open) - y(d.close))))
        .attr("fill",   d => d.close >= d.open ? up : down)
        .attr("rx", 2).attr("opacity", 0.92)
        .style("cursor", "pointer")
        .on("mouseover", function(event, d) {
          d3.select(this).attr("opacity", 1).attr("filter", "drop-shadow(0 2px 6px rgba(0,0,0,0.2))");
          tip.style("opacity", 1)
            .html(
              `<b>${d3.timeFormat("%b %d, %Y")(d.date)}</b><br/>` +
              `Open:  <b>$${d.open.toFixed(2)}</b><br/>` +
              `High:  <b style="color:#22c55e">$${d.high.toFixed(2)}</b><br/>` +
              `Low:   <b style="color:#ef4444">$${d.low.toFixed(2)}</b><br/>` +
              `Close: <b style="color:${d.close >= d.open ? up : down}">$${d.close.toFixed(2)}</b>`
            )
            .style("left", (event.pageX + 14) + "px")
            .style("top",  (event.pageY - 10) + "px");
        })
        .on("mousemove", function(event) {
          tip.style("left", (event.pageX + 14) + "px").style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function() {
          d3.select(this).attr("opacity", 0.92).attr("filter", null);
          tip.style("opacity", 0);
        });

      const leg = svg.append("g").attr("transform", `translate(${margin.left + 10},${margin.top - 20})`);
      [[up, "▲ Bullish"], [down, "▼ Bearish"]].forEach(([col, lbl], i) => {
        leg.append("rect").attr("x", i * 100).attr("y", 0).attr("width", 10).attr("height", 10).attr("rx", 2).attr("fill", col);
        leg.append("text").attr("x", i * 100 + 14).attr("y", 9).style("font-size", "10px").style("fill", "#475569").text(lbl);
      });

      svg.append("text").attr("x", W / 2).attr("y", 22).attr("text-anchor", "middle")
        .style("font-size", "14px").style("font-weight", "700").style("fill", "#1e293b")
        .text("AAPL Candlestick Chart · Last 60 Sessions");

      svg.append("text").attr("x", W / 2).attr("y", H - 10).attr("text-anchor", "middle")
        .style("font-size", "10px").style("fill", "#94a3b8").text("Source: aapl.csv");

      return () => tip.remove();
    });
  }, [theme, view]);

  /* ═══════════════════════════ 3D ═══════════════════════════ */
  useEffect(() => {
    if (view !== "3D") return;
    threeRef.current.innerHTML = "";

    const W = threeRef.current.clientWidth || 860;
    const H = 520;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5f9);

    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 2000);
    camera.position.set(0, 8, 22);
    camera.lookAt(0, 2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    threeRef.current.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 1.0));
    const sun = new THREE.DirectionalLight(0xffffff, 0.8);
    sun.position.set(10, 20, 15);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 20, bottom: -20, far: 100 });
    scene.add(sun);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xdde4f0, 0.5));

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 16),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 1 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(80, 40, 0xb0bec5, 0xcfd8dc);
    grid.position.y = 0.01;
    scene.add(grid);

    const { up: upHex, down: downHex } = COLOR_THEMES[theme];

    d3.csv("/aapl.csv").then(raw => {
      const all    = buildOHLC(raw).slice(-60);
      const minP   = d3.min(all, d => d.low);
      const maxP   = d3.max(all, d => d.high);
      const norm   = v => ((v - minP) / (maxP - minP)) * 10;

      const last   = all[all.length - 1];
      const first  = all[0];
      const change = ((last.close - first.open) / first.open * 100).toFixed(2);
      const bull   = all.filter(d => d.close >= d.open).length;
      setStats({ last, maxHigh: maxP, minLow: minP, bullish: bull, bearish: all.length - bull, change, total: all.length });

      const spacing = 60 / all.length;
      const barW    = spacing * 0.72;
      const offset  = (all.length * spacing) / 2;

      all.forEach((d, i) => {
        const isUp  = d.close >= d.open;
        const col   = new THREE.Color(isUp ? upHex : downHex);
        const xPos  = i * spacing - offset;

        const normOpen  = norm(d.open);
        const normClose = norm(d.close);
        const normHigh  = norm(d.high);
        const normLow   = norm(d.low);

        const bodyH   = Math.max(Math.abs(normClose - normOpen), 0.08);
        const bodyMid = (normOpen + normClose) / 2;

        const bodyGeo = new THREE.BoxGeometry(barW, bodyH, barW * 0.8);
        const body = new THREE.Mesh(bodyGeo, new THREE.MeshStandardMaterial({
          color: col, roughness: 0.25, metalness: 0.3,
          emissive: col, emissiveIntensity: 0.08,
        }));
        body.position.set(xPos, bodyMid, 0);
        body.castShadow = true;
        body.receiveShadow = true;
        scene.add(body);

        const el = new THREE.LineSegments(
          new THREE.EdgesGeometry(bodyGeo),
          new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 })
        );
        el.position.copy(body.position);
        scene.add(el);

        const wickH   = Math.max(normHigh - normLow, 0.05);
        const wickMid = (normHigh + normLow) / 2;
        const wick = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, wickH, 0.08),
          new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 })
        );
        wick.position.set(xPos, wickMid, 0);
        scene.add(wick);

        const capCol = col.clone().lerp(new THREE.Color(0xffffff), 0.35);
        const cap = new THREE.Mesh(
          new THREE.BoxGeometry(barW, 0.06, barW * 0.8),
          new THREE.MeshStandardMaterial({
            color: capCol, emissive: capCol,
            emissiveIntensity: 1.3, roughness: 0.02, metalness: 1,
          })
        );
        cap.position.set(xPos, bodyMid + bodyH / 2 + 0.03, 0);
        scene.add(cap);
      });

      // Y-axis price labels
      for (let t = 0; t <= 6; t++) {
        const frac  = t / 6;
        const price = minP + frac * (maxP - minP);
        const yPos  = frac * 10;

        const c = document.createElement("canvas");
        c.width = 160; c.height = 48;
        const cx = c.getContext("2d");
        cx.fillStyle = "rgba(255,255,255,0.92)";
        cx.roundRect(2, 2, 156, 44, 6); cx.fill();
        cx.font = "bold 22px Arial";
        cx.fillStyle = "#334155";
        cx.textAlign = "center"; cx.textBaseline = "middle";
        cx.fillText(`$${price.toFixed(0)}`, 80, 24);
        const sprite = new THREE.Sprite(
          new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true })
        );
        sprite.scale.set(2.2, 0.65, 1);
        sprite.position.set(-offset - 2.8, yPos, 0);
        scene.add(sprite);
      }
    });

    let isDragging = false, prevX = 0, prevY = 0;
    let rotX = 0.22, rotY = 0;

    const updateCamera = () => {
      const R = 28;
      camera.position.set(
        R * Math.sin(rotY) * Math.cos(rotX),
        R * Math.sin(rotX) + 3,
        R * Math.cos(rotY) * Math.cos(rotX)
      );
      camera.lookAt(0, 4, 0);
    };

    const onDown = e => {
      isDragging = true; prevX = e.clientX; prevY = e.clientY;
      renderer.domElement.style.cursor = "grabbing";
    };
    const onUp   = () => { isDragging = false; renderer.domElement.style.cursor = "grab"; };
    const onMove = e => {
      if (!isDragging) return;
      rotY -= (e.clientX - prevX) * 0.007;
      rotX  = Math.max(0.05, Math.min(1.0, rotX - (e.clientY - prevY) * 0.005));
      prevX = e.clientX; prevY = e.clientY;
      updateCamera();
    };

    renderer.domElement.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup",   onUp);
    window.addEventListener("mousemove", onMove);
    renderer.domElement.style.cursor = "grab";

    let animId;
    const animate = () => { animId = requestAnimationFrame(animate); renderer.render(scene, camera); };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      renderer.domElement.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup",   onUp);
      window.removeEventListener("mousemove", onMove);
      renderer.dispose();
      if (threeRef.current?.contains(renderer.domElement))
        threeRef.current.removeChild(renderer.domElement);
    };
  }, [theme, view]);

  /* ═══════════════════════════ Stats Panel ═══════════════════════════ */
  const StatsPanel = () => {
    if (!stats) return null;
    const { last, maxHigh, minLow, bullish, bearish, change, total } = stats;
    const isPos  = parseFloat(change) >= 0;
    const col2d  = COLOR_THEMES_2D[theme];

    const row = (label, value, color) => (
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0", borderBottom:"1px solid #f1f5f9" }}>
        <span style={{ fontSize:11, color:"#64748b", fontWeight:500 }}>{label}</span>
        <span style={{ fontSize:12, fontWeight:700, color: color || "#1e293b" }}>{value}</span>
      </div>
    );

    return (
      <div style={{
        width:190, flexShrink:0, background:"#fff",
        border:"1px solid #e2e8f0", borderRadius:10,
        padding:"14px 16px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)",
        fontFamily:"Inter,system-ui,sans-serif", alignSelf:"flex-start",
      }}>
        <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", letterSpacing:"0.08em", marginBottom:10 }}>
          SUMMARY · LAST 60
        </div>
        {row("Last Close",     `$${last.close.toFixed(2)}`)}
        {row("Last Open",      `$${last.open.toFixed(2)}`)}
        {row("Period High",    `$${maxHigh.toFixed(2)}`, "#22c55e")}
        {row("Period Low",     `$${minLow.toFixed(2)}`,  "#ef4444")}
        {row("Period Change",  `${isPos ? "+" : ""}${change}%`, isPos ? "#22c55e" : "#ef4444")}

        <div style={{ borderTop:"1px solid #e2e8f0", margin:"10px 0 8px" }} />
        <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", letterSpacing:"0.08em", marginBottom:10 }}>
          SESSIONS
        </div>
        {row("Total", total)}

        <div style={{ display:"flex", gap:8, marginTop:6 }}>
          <div style={{ flex:1, background:col2d.up+"18", border:`1px solid ${col2d.up}40`, borderRadius:7, padding:"8px 6px", textAlign:"center" }}>
            <div style={{ fontSize:18, fontWeight:800, color:col2d.up }}>{bullish}</div>
            <div style={{ fontSize:9, fontWeight:600, color:"#64748b", marginTop:2 }}>▲ BULLISH</div>
          </div>
          <div style={{ flex:1, background:col2d.down+"18", border:`1px solid ${col2d.down}40`, borderRadius:7, padding:"8px 6px", textAlign:"center" }}>
            <div style={{ fontSize:18, fontWeight:800, color:col2d.down }}>{bearish}</div>
            <div style={{ fontSize:9, fontWeight:600, color:"#64748b", marginTop:2 }}>▼ BEARISH</div>
          </div>
        </div>

        <div style={{ borderTop:"1px solid #e2e8f0", margin:"12px 0 8px" }} />
        <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", letterSpacing:"0.08em", marginBottom:8 }}>
          COLOR LEGEND
        </div>
        {[["▲ Bullish (Up)", col2d.up], ["▼ Bearish (Down)", col2d.down]].map(([lbl, col]) => (
          <div key={lbl} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7 }}>
            <div style={{ width:12, height:12, borderRadius:3, background:col, flexShrink:0 }} />
            <span style={{ fontSize:11, color:"#475569" }}>{lbl}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-1">Candlestick Chart</h2>
      <p style={{ fontSize:12, color:"#94a3b8", marginBottom:16 }}>
        AAPL stock data · aapl.csv
      </p>

      <div className="flex gap-6 mb-4">
        <div>
          <label className="font-semibold mr-2">Color Theme:</label>
          <select value={theme} onChange={e => setTheme(e.target.value)}>
            {Object.keys(COLOR_THEMES).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="font-semibold mr-2">View:</label>
          <select value={view} onChange={e => setView(e.target.value)}>
            <option value="2D">2D</option>
            <option value="3D">3D</option>
          </select>
        </div>
      </div>

      {view === "3D" && (
        <p style={{ fontSize:11, color:"#94a3b8", marginBottom:8 }}>
          🖱️ Drag to rotate the chart
        </p>
      )}

      <div style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
        <div style={{ flex:1, minWidth:0, border:"1px solid #e2e8f0", borderRadius:10, overflow:"hidden" }}>
          {view === "2D" && <svg ref={svgRef} width="100%" height="520" />}
          {view === "3D" && <div ref={threeRef} style={{ width:"100%", borderRadius:8, overflow:"hidden" }} />}
        </div>
        <StatsPanel />
      </div>
    </div>
  );
};

export default CandlestickChart;