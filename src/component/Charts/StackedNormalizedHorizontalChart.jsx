import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as THREE from "three";

const THEMES = {
  Modern:  ["#6366f1","#06b6d4","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#14b8a6","#f97316","#6b7280"],
  Neon:    ["#ff0080","#00f5ff","#39ff14","#ffae00","#ff3131","#ff6bff","#00ff9d","#ff4400","#ff00aa","#00ccff"],
  Pastel:  ["#a5b4fc","#67e8f9","#6ee7b7","#fde68a","#fca5a5","#c4b5fd","#f9a8d4","#99f6e4","#fdba74","#d1d5db"],
  Sunset:  ["#ff6b6b","#feca57","#ff9ff3","#48dbfb","#1dd1a1","#f368e0","#ff9f43","#10ac84","#5f27cd","#00d2d3"],
  Ocean:   ["#03045e","#0077b6","#00b4d8","#90e0ef","#023e8a","#0096c7","#48cae4","#ade8f4","#caf0f8","#7ec8e3"],
  Galaxy:  ["#4a306d","#7b2cbf","#9d4edd","#c77dff","#e0aaff","#3c1e4d","#5e2e7d","#803ead","#a24edd","#c45eed"],
  Forest:  ["#1b4332","#2d6a4f","#40916c","#52b788","#74c69d","#95d5b2","#b7e4c7","#a7c957","#6a994e","#386641"],
  Autumn:  ["#7f4f24","#936639","#a68a64","#c2c5aa","#e63946","#c1121f","#9d0208","#6a040f","#370617","#b5838d"],
  Candy:   ["#ff006e","#fb5607","#ffbe0b","#8338ec","#3a86ff","#06d6a0","#ef476f","#ffd166","#26547c","#05c7f2"],
  Earth:   ["#6b4f3c","#8b6914","#a07850","#b8975a","#c9a96e","#3a7d44","#2d6a4f","#1b4332","#52796f","#84a98c"],
};

const KEYS = ["EUR", "INR", "JPY"];

const FALLBACK = [
  { date: "2024-02-10", EUR: 0.920, INR: 82.8, JPY: 147.5 },
  { date: "2024-02-11", EUR: 0.921, INR: 82.9, JPY: 147.8 },
  { date: "2024-02-12", EUR: 0.919, INR: 83.1, JPY: 148.2 },
  { date: "2024-02-13", EUR: 0.923, INR: 83.0, JPY: 148.0 },
  { date: "2024-02-14", EUR: 0.925, INR: 82.7, JPY: 147.9 },
];

// ─── Shared Legend ────────────────────────────────────────────────────────────
function LegendHTML({ data, palette }) {
  const color = d3.scaleOrdinal().domain(KEYS).range(palette);
  // compute per-key averages for context
  const avgs = KEYS.map(k => ({
    key: k,
    avg: d3.mean(data, d => d[k]),
  }));

  return (
    <div style={{
      background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8,
      padding: "12px 14px", width: 150, flexShrink: 0,
      boxShadow: "0 1px 4px rgba(0,0,0,0.07)", alignSelf: "flex-start",
    }}>
      <div style={{ fontSize: 10, fontWeight: "bold", color: "#94a3b8", letterSpacing: "0.08em", marginBottom: 8 }}>
        CURRENCIES
      </div>
      {avgs.map(({ key, avg }) => (
        <div key={key} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, flexShrink: 0, background: color(key) }} />
          <span style={{ color: "#334155", fontSize: 11, flex: 1 }}>{key}</span>
          <span style={{ color: color(key), fontSize: 10, fontWeight: "bold" }}>
            {avg.toFixed(2)}
          </span>
        </div>
      ))}
      <div style={{ borderTop: "1px solid #e2e8f0", marginTop: 8, paddingTop: 8 }}>
        <div style={{ fontSize: 9, color: "#94a3b8" }}>avg. rate vs USD</div>
      </div>
    </div>
  );
}

// ─── 2D Chart ─────────────────────────────────────────────────────────────────
function Chart2D({ data, theme }) {
  const svgRef  = useRef(null);
  const palette = THEMES[theme];
  const color   = d3.scaleOrdinal().domain(KEYS).range(palette);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const W = 640, H = 380;
    const margin = { top: 16, right: 20, bottom: 36, left: 90 };
    const cW = W - margin.left - margin.right;
    const cH = H - margin.top  - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${W} ${H}`).attr("preserveAspectRatio", "xMidYMid meet");
    svg.append("rect").attr("width", W).attr("height", H).attr("fill", "#f8fafc").attr("rx", 8);

    // Gradient defs
    const defs = svg.append("defs");
    KEYS.forEach((k, i) => {
      const c  = color(k);
      const gr = defs.append("linearGradient")
        .attr("id", `snhg-${i}-${theme}`).attr("x1","0%").attr("x2","100%");
      gr.append("stop").attr("offset","0%").attr("stop-color", d3.color(c).brighter(0.5).formatHex()).attr("stop-opacity",0.95);
      gr.append("stop").attr("offset","100%").attr("stop-color", d3.color(c).darker(0.4).formatHex()).attr("stop-opacity",0.95);
    });

    const stack       = d3.stack().keys(KEYS).offset(d3.stackOffsetExpand);
    const stackedData = stack(data);

    const x = d3.scaleLinear().domain([0, 1]).range([0, cW]);
    const y = d3.scaleBand().domain(data.map(d => d.date)).range([0, cH]).padding(0.28);

    const chart = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // Grid
    [0, 0.25, 0.5, 0.75, 1].forEach(t => {
      chart.append("line")
        .attr("x1", x(t)).attr("x2", x(t)).attr("y1", 0).attr("y2", cH)
        .attr("stroke", "#e2e8f0").attr("stroke-dasharray", "4,3").attr("stroke-width", 1);
    });

    // Tooltip
    const tooltip = d3.select("body").append("div")
      .style("position","absolute").style("background","rgba(15,23,42,0.92)")
      .style("color","#fff").style("padding","8px 12px").style("border-radius","6px")
      .style("font-size","12px").style("pointer-events","none").style("opacity",0)
      .style("border","1px solid #334155").style("z-index","9999");

    // Bars
    stackedData.forEach((layer, li) => {
      const key = KEYS[li];
      const col = color(key);

      chart.selectAll(null).data(layer).enter().append("rect")
        .attr("y", d => y(d.data.date))
        .attr("x", d => x(d[0]))
        .attr("height", y.bandwidth())
        .attr("width", d => Math.max(0, x(d[1]) - x(d[0])))
        .attr("fill", `url(#snhg-${li}-${theme})`)
        .attr("rx", 4).attr("opacity", 0.9)
        .attr("stroke", "#fff").attr("stroke-width", 0.8)
        .style("cursor", "pointer")
        .on("mouseover", function (event, d) {
          d3.select(this).attr("opacity", 1).attr("stroke-width", 1.8);
          const pct = ((d[1] - d[0]) * 100).toFixed(1);
          tooltip.style("opacity", 1)
            .html(
              `<b style="color:${col}">${key}</b><br/>` +
              `Date: ${d.data.date}<br/>` +
              `Share: <b>${pct}%</b><br/>` +
              `Rate: ${d.data[key].toFixed(3)}`
            )
            .style("left",(event.pageX+12)+"px").style("top",(event.pageY-10)+"px");
        })
        .on("mouseout", function () {
          d3.select(this).attr("opacity",0.9).attr("stroke-width",0.8);
          tooltip.style("opacity",0);
        });

      // Percentage label inside bar segment
      chart.selectAll(null).data(layer).enter().append("text")
        .filter(d => (x(d[1]) - x(d[0])) > 36)
        .attr("x", d => (x(d[0]) + x(d[1])) / 2)
        .attr("y", d => y(d.data.date) + y.bandwidth() / 2)
        .attr("dy","0.35em").attr("text-anchor","middle")
        .style("font-size","10px").style("font-weight","700")
        .style("fill","#fff").style("pointer-events","none")
        .text(d => `${key} ${((d[1]-d[0])*100).toFixed(0)}%`);
    });

    // Y axis — dates
    chart.append("g")
      .call(d3.axisLeft(y).tickSize(0))
      .call(g => {
        g.select(".domain").remove();
        g.selectAll("text").style("font-size","10px").style("font-weight","600").style("fill","#334155");
      });

    // X axis — percentage
    chart.append("g").attr("transform",`translate(0,${cH})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format(".0%")))
      .call(g => {
        g.select(".domain").style("stroke","#e2e8f0");
        g.selectAll("text").style("fill","#94a3b8").style("font-size","10px");
      });

    // X label
    svg.append("text")
      .attr("transform",`translate(${margin.left + cW/2},${H-4})`)
      .attr("text-anchor","middle").style("font-size","11px").style("fill","#94a3b8")
      .text("Normalized share of exchange rate (EUR · INR · JPY vs USD)");

    return () => tooltip.remove();
  }, [data, theme]);

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <svg ref={svgRef} style={{ display:"block", flex:1, minWidth:0, height:380 }} />
      <div style={{ padding:"12px 12px 12px 0" }}>
        <LegendHTML data={data} palette={THEMES[theme]} />
      </div>
    </div>
  );
}

// ─── 3D Chart ─────────────────────────────────────────────────────────────────
function Chart3D({ data, theme }) {
  const mountRef   = useRef(null);
  const overlayRef = useRef(null);
  const palette    = THEMES[theme];
  const color      = d3.scaleOrdinal().domain(KEYS).range(palette);

  useEffect(() => {
    if (!mountRef.current || !data.length) return;
    const el  = mountRef.current;
    const W   = el.offsetWidth || 640, H = 380;

    // Pre-compute normalized stacks
    const stack       = d3.stack().keys(KEYS).offset(d3.stackOffsetExpand);
    const stackedData = stack(data);

    const scene  = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 200);
    camera.position.set(0, 6, 14);
    camera.lookAt(0, 1.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    el.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(6, 12, 8); sun.castShadow = true;
    scene.add(sun);
    const rimL = new THREE.PointLight(0x6366f1, 0.5, 60);
    rimL.position.set(-8, 5, -5);
    scene.add(rimL);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xe0e7ff, 0.4));

    // Floor + grid
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 20),
      new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.9 })
    );
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
    scene.add(floor);
    scene.add(new THREE.GridHelper(30, 26, 0xcccccc, 0xe2e8f0));

    const maxBarW   = 10;  // total width = 100%
    const barH      = 0.52;
    const barD      = 0.52;
    const spacing   = 1.1;
    const pivot     = new THREE.Group();
    const labelAnchors = [];

    data.forEach((row, ri) => {
      const yPos = (ri - (data.length - 1) / 2) * spacing;

      stackedData.forEach((layer, li) => {
        const seg   = layer[ri];
        const segW  = Math.max(0.05, (seg[1] - seg[0]) * maxBarW);
        const segX  = seg[0] * maxBarW - maxBarW / 2 + segW / 2;
        const col   = new THREE.Color(color(KEYS[li]));

        // Shadow
        const sm = new THREE.Mesh(
          new THREE.BoxGeometry(segW, barH * 0.18, barD),
          new THREE.MeshBasicMaterial({ color: 0xbbbbbb, transparent: true, opacity: 0.15 })
        );
        sm.position.set(segX + 0.06, yPos - barH / 2, 0.06);
        pivot.add(sm);

        // Bar segment
        const geo  = new THREE.BoxGeometry(segW, barH, barD);
        const mat  = new THREE.MeshStandardMaterial({
          color: col, roughness: 0.25, metalness: 0.4,
          emissive: col, emissiveIntensity: 0.1,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(segX, yPos, 0);
        mesh.castShadow = true;
        pivot.add(mesh);

        // Edge outline
        const edgesGeo  = new THREE.EdgesGeometry(geo);
        const edgesLine = new THREE.LineSegments(edgesGeo, new THREE.LineBasicMaterial({ color: 0xffffff }));
        edgesLine.position.set(segX, yPos, 0);
        pivot.add(edgesLine);

        // Glow cap on top edge
        const capCol = col.clone().lerp(new THREE.Color(0xffffff), 0.25);
        const cap    = new THREE.Mesh(
          new THREE.BoxGeometry(segW, 0.06, barD),
          new THREE.MeshStandardMaterial({ color: capCol, emissive: capCol, emissiveIntensity: 1.2, roughness: 0.04, metalness: 1 })
        );
        cap.position.set(segX, yPos + barH / 2 + 0.03, 0);
        pivot.add(cap);

        // Label anchor — only for wide enough segments
        if (segW > 1.2) {
          labelAnchors.push({
            x: segX, y: yPos, z: barD / 2 + 0.1,
            text: `${KEYS[li]} ${((seg[1]-seg[0])*100).toFixed(0)}%`,
            col: color(KEYS[li]),
          });
        }
      });

      // Date label anchor — left of bar
      labelAnchors.push({
        x: -maxBarW / 2 - 0.5, y: yPos, z: 0,
        text: row.date.slice(5), // show MM-DD
        col: "#334155",
        isDate: true,
      });
    });

    scene.add(pivot);

    const toScreen = (x3, y3, z3) => {
      const v = new THREE.Vector3(x3, y3, z3).project(camera);
      return { sx: (v.x * 0.5 + 0.5) * W, sy: (-v.y * 0.5 + 0.5) * H, behind: v.z > 1 };
    };

    // Drag orbit
    let isDragging = false, prevX = 0, prevY = 0, rotX = 0.18, rotY = 0, autoSpin = true;
    const onDown = e => { isDragging = true; prevX = e.clientX; prevY = e.clientY; autoSpin = false; renderer.domElement.style.cursor = "grabbing"; };
    const onUp   = () => { isDragging = false; renderer.domElement.style.cursor = "grab"; };
    const onMove = e => {
      if (!isDragging) return;
      rotY += (e.clientX - prevX) * 0.006;
      rotX  = Math.max(-0.8, Math.min(0.8, rotX + (e.clientY - prevY) * 0.004));
      prevX = e.clientX; prevY = e.clientY;
    };
    renderer.domElement.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("mousemove", onMove);
    renderer.domElement.style.cursor = "grab";

    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (autoSpin) rotY += 0.003;
      pivot.rotation.y = rotY;
      pivot.rotation.x = rotX;
      camera.updateMatrixWorld();

      if (overlayRef.current) {
        overlayRef.current.querySelectorAll(".lbl3d").forEach((elDiv, i) => {
          const a      = labelAnchors[i];
          const rotVec = new THREE.Vector3(a.x, a.y, a.z).applyEuler(pivot.rotation);
          const { sx, sy, behind } = toScreen(rotVec.x, rotVec.y, rotVec.z);
          elDiv.style.left    = `${sx}px`;
          elDiv.style.top     = `${sy}px`;
          elDiv.style.opacity = behind ? "0" : "1";
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

  // Mirror labelAnchors for JSX render
  const stack       = d3.stack().keys(KEYS).offset(d3.stackOffsetExpand);
  const stackedData = stack(data);
  const palette2    = THEMES[theme];
  const color2      = d3.scaleOrdinal().domain(KEYS).range(palette2);
  const maxBarW     = 10;
  const spacing     = 1.1;

  const jsxLabels = [];
  data.forEach((row, ri) => {
    const yPos = (ri - (data.length - 1) / 2) * spacing;
    stackedData.forEach((layer, li) => {
      const seg  = layer[ri];
      const segW = Math.max(0.05, (seg[1] - seg[0]) * maxBarW);
      if (segW > 1.2) {
        jsxLabels.push({ col: color2(KEYS[li]), text: `${KEYS[li]} ${((seg[1]-seg[0])*100).toFixed(0)}%`, isDate: false });
      }
    });
    jsxLabels.push({ col: "#334155", text: row.date.slice(5), isDate: true });
  });

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <div style={{ position:"relative", flex:1, minWidth:0 }}>
        <div ref={mountRef} style={{ width:"100%", height:380, cursor:"grab" }} />

        {/* Projected labels */}
        <div ref={overlayRef} style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
          {jsxLabels.map((a, i) => (
            <div key={i} className="lbl3d" style={{
              position:"absolute",
              transform: a.isDate ? "translate(-100%,-50%)" : "translate(-50%,-50%)",
              background: a.isDate ? "rgba(255,255,255,0.90)" : "rgba(255,255,255,0.93)",
              color: a.col,
              fontSize: a.isDate ? 10 : 9,
              fontWeight:"bold",
              padding:"2px 5px", borderRadius:3,
              border: a.isDate ? "1px solid #e2e8f0" : `1px solid ${a.col}55`,
              whiteSpace:"nowrap",
              transition:"opacity 0.1s", pointerEvents:"none",
              boxShadow:"0 1px 3px rgba(0,0,0,0.08)",
            }}>
              {a.text}
            </div>
          ))}
        </div>

        <div style={{ padding:"7px 14px", background:"#f8fafc", borderTop:"1px solid #e2e8f0", fontSize:11, color:"#94a3b8" }}>
          💡 Drag to rotate · auto-spins until you interact
        </div>
      </div>

      <div style={{ padding:"12px 12px 12px 0" }}>
        <LegendHTML data={data} palette={THEMES[theme]} />
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const StackedNormalizedHorizontalChart = () => {
  const [viewMode, setViewMode] = useState("2d");
  const [theme,    setTheme]    = useState("Modern");
  const [data,     setData]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [dataInfo, setDataInfo] = useState("");

  useEffect(() => {
    fetch("https://api.frankfurter.app/latest?from=USD")
      .then(r => r.json())
      .then(json => {
        const today = new Date();
        const rows  = Array.from({ length: 5 }, (_, i) => {
          const d = new Date(today);
          d.setDate(today.getDate() - (4 - i));
          return {
            date: d.toISOString().split("T")[0],
            EUR:  +(json.rates.EUR || 0.92).toFixed(4),
            INR:  +(json.rates.INR || 83).toFixed(2),
            JPY:  +(json.rates.JPY || 148).toFixed(2),
          };
        });
        setData(rows);
        setDataInfo(`Live rates · ${json.date}`);
        setLoading(false);
      })
      .catch(() => {
        setData(FALLBACK);
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
      {/* Title */}
      <div style={{ marginBottom:4 }}>
        <div style={{ fontSize:16, fontWeight:"bold", color:"#1e293b" }}>
          Stacked Normalized Horizontal Chart
        </div>
        <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>
          EUR · INR · JPY normalized share vs USD · {dataInfo}
        </div>
      </div>

      {/* Dropdowns */}
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

      {/* Chart */}
      <div style={{ minHeight:380 }}>
        {loading ? (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:380, color:"#94a3b8", fontSize:15 }}>
            Loading data…
          </div>
        ) : viewMode === "2d" ? (
          <Chart2D key="2d" data={data} theme={theme} />
        ) : (
          <Chart3D key="3d" data={data} theme={theme} />
        )}
      </div>
    </div>
  );
};

export default StackedNormalizedHorizontalChart;