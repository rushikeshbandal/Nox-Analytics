import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as THREE from "three";

const THEMES = {
  Modern:  { vinyl: "#6366f1", cd: "#06b6d4", cassette: "#10b981", digital: "#f59e0b", streaming: "#ef4444" },
  Neon:    { vinyl: "#ff0080", cd: "#00f5ff", cassette: "#39ff14", digital: "#ffae00", streaming: "#ff3131" },
  Pastel:  { vinyl: "#a5b4fc", cd: "#67e8f9", cassette: "#6ee7b7", digital: "#fde68a", streaming: "#fca5a5" },
  Sunset:  { vinyl: "#ff6b6b", cd: "#feca57", cassette: "#ff9ff3", digital: "#48dbfb", streaming: "#1dd1a1" },
  Ocean:   { vinyl: "#03045e", cd: "#0077b6", cassette: "#00b4d8", digital: "#90e0ef", streaming: "#caf0f8" },
  Galaxy:  { vinyl: "#4a306d", cd: "#7b2cbf", cassette: "#9d4edd", digital: "#c77dff", streaming: "#e0aaff" },
  Forest:  { vinyl: "#1b4332", cd: "#2d6a4f", cassette: "#40916c", digital: "#52b788", streaming: "#74c69d" },
  Autumn:  { vinyl: "#7f4f24", cd: "#936639", cassette: "#a68a64", digital: "#e63946", streaming: "#c1121f" },
  Candy:   { vinyl: "#ff006e", cd: "#fb5607", cassette: "#ffbe0b", digital: "#8338ec", streaming: "#3a86ff" },
  Earth:   { vinyl: "#6b4f3c", cd: "#8b6914", cassette: "#a07850", digital: "#3a7d44", streaming: "#2d6a4f" },
};

const DATA = [
  { year: 2000, vinyl: 2.1,  cd: 21.5, cassette: 0.9, digital: 0,   streaming: 0    },
  { year: 2005, vinyl: 0.5,  cd: 18.2, cassette: 0.1, digital: 2.8, streaming: 0    },
  { year: 2010, vinyl: 0.9,  cd: 9.3,  cassette: 0,   digital: 7.4, streaming: 1.2  },
  { year: 2015, vinyl: 3.4,  cd: 5.1,  cassette: 0,   digital: 6.8, streaming: 4.9  },
  { year: 2020, vinyl: 6.2,  cd: 2.1,  cassette: 0.1, digital: 5.3, streaming: 18.5 },
  { year: 2023, vinyl: 7.2,  cd: 1.8,  cassette: 0.2, digital: 4.1, streaming: 24.3 },
];

const FORMAT_LABELS = { vinyl: "Vinyl", cd: "CD", cassette: "Cassette", digital: "Digital", streaming: "Streaming" };
const FORMATS = ["vinyl", "cd", "cassette", "digital", "streaming"];

// ─── constants mirrored in both useEffect and render ──────────────────────────
const X_SPREAD = 14;
const Z_SPREAD = 3;
const MAX_VAL  = 25;
const MAX_H    = 10;

// ─── Shared Legend ────────────────────────────────────────────────────────────
function LegendHTML({ theme }) {
  const colors    = THEMES[theme];
  const totalLine = { color: "#ef4444", label: "Total Revenue" };
  return (
    <div style={{
      background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8,
      padding: "12px 14px", width: 150, flexShrink: 0,
      boxShadow: "0 1px 4px rgba(0,0,0,0.07)", alignSelf: "flex-start",
    }}>
      <div style={{ fontSize: 10, fontWeight: "bold", color: "#94a3b8", letterSpacing: "0.08em", marginBottom: 8 }}>
        FORMATS
      </div>
      {FORMATS.map(f => (
        <div key={f} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
          <div style={{ width: 11, height: 11, borderRadius: 3, flexShrink: 0, background: colors[f] }} />
          <span style={{ color: "#334155", fontSize: 12 }}>{FORMAT_LABELS[f]}</span>
        </div>
      ))}
      <div style={{ borderTop: "1px solid #e2e8f0", marginTop: 8, paddingTop: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{ width: 18, height: 3, borderRadius: 2, background: totalLine.color, flexShrink: 0 }} />
          <span style={{ color: "#334155", fontSize: 12 }}>{totalLine.label}</span>
        </div>
      </div>
    </div>
  );
}

// ─── 2D Chart ─────────────────────────────────────────────────────────────────
function Chart2D({ theme }) {
  const svgRef = useRef(null);
  const colors = THEMES[theme];

  useEffect(() => {
    if (!svgRef.current) return;

    const W = 700, H = 420;
    const margin = { top: 20, right: 20, bottom: 44, left: 52 };
    const cW = W - margin.left - margin.right;
    const cH = H - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${W} ${H}`).attr("preserveAspectRatio", "xMidYMid meet");
    svg.append("rect").attr("width", W).attr("height", H).attr("fill", "#f8fafc").attr("rx", 8);

    const stack       = d3.stack().keys(FORMATS).order(d3.stackOrderNone).offset(d3.stackOffsetNone);
    const stackedData = stack(DATA);

    const xScale = d3.scaleLinear().domain(d3.extent(DATA, d => d.year)).range([0, cW]);
    const yScale = d3.scaleLinear().domain([0, 40]).range([cH, 0]);

    const area = d3.area()
      .x(d => xScale(d.data.year))
      .y0(d => yScale(d[0]))
      .y1(d => yScale(d[1]))
      .curve(d3.curveCatmullRom);

    const chart = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    yScale.ticks(5).forEach(t => {
      chart.append("line")
        .attr("x1", 0).attr("x2", cW).attr("y1", yScale(t)).attr("y2", yScale(t))
        .attr("stroke", "#e2e8f0").attr("stroke-dasharray", "4,3").attr("stroke-width", 1);
    });

    const tooltip = d3.select("body").append("div")
      .style("position", "absolute").style("background", "rgba(15,23,42,0.92)")
      .style("color", "#fff").style("padding", "8px 12px").style("border-radius", "6px")
      .style("font-size", "12px").style("pointer-events", "none").style("opacity", 0)
      .style("border", "1px solid #334155").style("z-index", "9999");

    chart.selectAll(".area").data(stackedData).enter().append("path")
      .attr("d", area)
      .attr("fill", d => colors[d.key])
      .attr("stroke", d => d3.color(colors[d.key]).brighter(0.4).formatHex())
      .attr("stroke-width", 1)
      .attr("opacity", 0.88)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        d3.select(this).attr("opacity", 1);
        tooltip.style("opacity", 1)
          .html(`<b style="color:${colors[d.key]}">${FORMAT_LABELS[d.key]}</b>`)
          .style("left", (event.pageX + 12) + "px").style("top", (event.pageY - 10) + "px");
      })
      .on("mouseout", function (_, d) {
        d3.select(this).attr("opacity", 0.88);
        tooltip.style("opacity", 0);
      });

    const totalRevenue = DATA.map(d => ({ year: d.year, total: FORMATS.reduce((s, f) => s + d[f], 0) }));
    const totalLine    = d3.line().x(d => xScale(d.year)).y(d => yScale(d.total)).curve(d3.curveCatmullRom);

    chart.append("path").datum(totalRevenue)
      .attr("fill", "none").attr("stroke", "#ef4444")
      .attr("stroke-width", 2.5).attr("stroke-linecap", "round").attr("d", totalLine);

    chart.selectAll(".tp").data(totalRevenue).enter().append("circle")
      .attr("cx", d => xScale(d.year)).attr("cy", d => yScale(d.total))
      .attr("r", 5).attr("fill", "#fff").attr("stroke", "#ef4444").attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        tooltip.style("opacity", 1)
          .html(`<b style="color:#ef4444">${d.year}</b><br/>Total: $${d.total.toFixed(1)}B`)
          .style("left", (event.pageX + 12) + "px").style("top", (event.pageY - 10) + "px");
      })
      .on("mouseout", () => tooltip.style("opacity", 0));

    const hoverLine = chart.append("line")
      .attr("stroke", "#64748b").attr("stroke-width", 1).attr("stroke-dasharray", "4,3").attr("opacity", 0)
      .attr("y1", 0).attr("y2", cH);

    const hoverArea = chart.append("rect")
      .attr("width", cW).attr("height", cH).attr("fill", "transparent").style("cursor", "crosshair");

    hoverArea.on("mousemove", function (event) {
      const [mx]  = d3.pointer(event);
      const year  = Math.round(xScale.invert(mx));
      const snap  = DATA.reduce((a, b) => Math.abs(b.year - year) < Math.abs(a.year - year) ? b : a);
      const sx    = xScale(snap.year);
      const total = FORMATS.reduce((s, f) => s + snap[f], 0);
      hoverLine.attr("x1", sx).attr("x2", sx).attr("opacity", 0.6);
      tooltip.style("opacity", 1)
        .html(
          `<b style="color:#94a3b8">${snap.year}</b><br/>` +
          FORMATS.map(f => `<span style="color:${colors[f]}">■</span> ${FORMAT_LABELS[f]}: $${snap[f].toFixed(1)}B`).join("<br/>") +
          `<br/><b>Total: $${total.toFixed(1)}B</b>`
        )
        .style("left", (event.pageX + 14) + "px").style("top", (event.pageY - 10) + "px");
    }).on("mouseleave", () => { hoverLine.attr("opacity", 0); tooltip.style("opacity", 0); });

    chart.append("g").attr("transform", `translate(0,${cH})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.format("d")).ticks(6))
      .call(g => { g.select(".domain").style("stroke", "#e2e8f0"); g.selectAll("text").style("fill", "#64748b").style("font-size", "10px"); });

    chart.append("g")
      .call(d3.axisLeft(yScale).ticks(5).tickFormat(d => `₹${d}K`))
      .call(g => { g.select(".domain").remove(); g.selectAll("line").remove(); g.selectAll("text").style("fill", "#94a3b8").style("font-size", "10px"); });

    svg.append("text")
      .attr("transform", `translate(${margin.left + cW / 2},${H - 4})`)
      .attr("text-anchor", "middle").style("font-size", "11px").style("fill", "#94a3b8").text("Year");
    svg.append("text")
      .attr("transform", "rotate(-90)").attr("x", -(margin.top + cH / 2)).attr("y", 14)
      .attr("text-anchor", "middle").style("font-size", "11px").style("fill", "#94a3b8").text("Pharmacy Revenue (INR in Thousands)");

    return () => tooltip.remove();
  }, [theme]);

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
      <svg ref={svgRef} style={{ display: "block", flex: 1, minWidth: 0, height: 420 }} />
      <div style={{ padding: "12px 12px 12px 0" }}>
        <LegendHTML theme={theme} />
      </div>
    </div>
  );
}

// ─── 3D Chart ─────────────────────────────────────────────────────────────────
function Chart3D({ theme }) {
  const mountRef   = useRef(null);
  const overlayRef = useRef(null);
  const colors     = THEMES[theme];

  useEffect(() => {
    if (!mountRef.current) return;
    const el = mountRef.current;
    const W  = el.offsetWidth || 700;
    // ── FIXED: taller canvas so the streaming bar peak is never clipped ──
    const H  = 580;

    const scene  = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);

    // ── FIXED: camera higher + further back, looking at a centered point ──
    const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 200);
    camera.position.set(0, 12, 24);
    camera.lookAt(0, 2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    el.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(6, 12, 8); dir.castShadow = true;
    scene.add(dir);
    // ── FIXED: fill light from opposite side so tall bars aren't dark on back face ──
    const fill = new THREE.DirectionalLight(0xffffff, 0.5);
    fill.position.set(-6, 10, -8);
    scene.add(fill);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xdddddd, 0.4));

    // Floor + grid — enlarged to match wider camera view
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 26),
      new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.9 })
    );
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
    scene.add(floor);
    scene.add(new THREE.GridHelper(40, 34, 0xcccccc, 0xe2e8f0));

    const pivot        = new THREE.Group();
    const labelAnchors = [];

    DATA.forEach((d, xi) => {
      const xPos = -X_SPREAD / 2 + (xi / (DATA.length - 1)) * X_SPREAD;

      FORMATS.forEach((f, fi) => {
        const val = d[f];
        if (val === 0) return;
        const bh   = Math.max(0.08, (val / MAX_VAL) * MAX_H);
        const zPos = -Z_SPREAD / 2 + (fi / (FORMATS.length - 1)) * Z_SPREAD;
        const col  = new THREE.Color(colors[f]);

        // Bar
        const geo  = new THREE.BoxGeometry(1.8 * 0.7, bh, 0.45);
        const mat  = new THREE.MeshStandardMaterial({
          color: col, roughness: 0.3, metalness: 0.2,
          emissive: col, emissiveIntensity: 0.07,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(xPos, bh / 2, zPos);
        mesh.castShadow = true;
        pivot.add(mesh);

        // Edge outline
        const edgesLine = new THREE.LineSegments(
          new THREE.EdgesGeometry(geo),
          new THREE.LineBasicMaterial({ color: 0xffffff })
        );
        edgesLine.position.set(xPos, bh / 2, zPos);
        pivot.add(edgesLine);

        // Glow cap
        const cap = new THREE.Mesh(
          new THREE.BoxGeometry(1.8 * 0.7, 0.06, 0.45),
          new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 1.0, roughness: 0.05, metalness: 1 })
        );
        cap.position.set(xPos, bh + 0.03, zPos);
        pivot.add(cap);

        if (val >= 1.5) {
          labelAnchors.push({ x: xPos, y: bh + 0.55, z: zPos, text: `$${val}B`, col: colors[f], isYear: false });
        }
      });

      // Year label below floor
      labelAnchors.push({ x: xPos, y: -0.6, z: Z_SPREAD / 2 + 0.5, text: String(d.year), col: "#64748b", isYear: true });
    });

    scene.add(pivot);

    const toScreen = (x3, y3, z3) => {
      const v = new THREE.Vector3(x3, y3, z3).project(camera);
      return { sx: (v.x * 0.5 + 0.5) * W, sy: (-v.y * 0.5 + 0.5) * H, behind: v.z > 1 };
    };

    // ── FIXED: shallower initial tilt so tall bars don't vanish above frame ──
    let isDragging = false, prevX = 0, prevY = 0;
    let rotX = 0.12, rotY = 0, autoSpin = true;

    const onDown = e => { isDragging = true; prevX = e.clientX; prevY = e.clientY; autoSpin = false; renderer.domElement.style.cursor = "grabbing"; };
    const onUp   = () => { isDragging = false; renderer.domElement.style.cursor = "grab"; };
    const onMove = e => {
      if (!isDragging) return;
      rotY += (e.clientX - prevX) * 0.006;
      // ── FIXED: clamped tighter so user can't tilt bars out of view ──
      rotX  = Math.max(-0.5, Math.min(0.5, rotX + (e.clientY - prevY) * 0.004));
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
  }, [theme]);

  // Build label list for JSX — mirrors useEffect logic exactly
  const labelAnchorsJSX = [];
  DATA.forEach((d, xi) => {
    const xPos = -X_SPREAD / 2 + (xi / (DATA.length - 1)) * X_SPREAD;
    FORMATS.forEach((f, fi) => {
      const val = d[f];
      if (val < 1.5) return;
      const bh   = Math.max(0.08, (val / MAX_VAL) * MAX_H);
      const zPos = -Z_SPREAD / 2 + (fi / (FORMATS.length - 1)) * Z_SPREAD;
      labelAnchorsJSX.push({ x: xPos, y: bh + 0.55, z: zPos, text: `$${val}B`, col: THEMES[theme][f], isYear: false });
    });
    labelAnchorsJSX.push({ x: xPos, y: -0.6, z: Z_SPREAD / 2 + 0.5, text: String(d.year), col: "#64748b", isYear: true });
  });

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
      <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
        {/* ── FIXED: height matches renderer ── */}
        <div ref={mountRef} style={{ width: "100%", height: 580, cursor: "grab" }} />

        {/* Projected labels */}
        <div ref={overlayRef} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {labelAnchorsJSX.map((a, i) => (
            <div key={i} className="lbl3d" style={{
              position:       "absolute",
              transform:      "translate(-50%, -50%)",
              background:     a.isYear ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.93)",
              color:          a.col,
              fontSize:       a.isYear ? 11 : 9,
              fontWeight:     "bold",
              padding:        a.isYear ? "2px 7px" : "1px 5px",
              borderRadius:   3,
              border:         `1px solid ${a.col}44`,
              whiteSpace:     "nowrap",
              transition:     "opacity 0.1s",
              pointerEvents:  "none",
              boxShadow:      "0 1px 3px rgba(0,0,0,0.10)",
            }}>
              {a.text}
            </div>
          ))}
        </div>

        <div style={{ padding: "7px 14px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", fontSize: 11, color: "#94a3b8" }}>
          💡 Drag to rotate · auto-spins until you interact
        </div>
      </div>

      <div style={{ padding: "12px 12px 12px 0" }}>
        <LegendHTML theme={theme} />
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const MusicRevenueChart = () => {
  const [viewMode, setViewMode] = useState("2d");
  const [theme,    setTheme]    = useState("Modern");

  const ddStyle = {
    padding: "5px 10px", borderRadius: 6, border: "1px solid #e2e8f0",
    background: "#fff", color: "#334155", fontWeight: "500",
    cursor: "pointer", fontSize: 12, outline: "none",
  };

  return (
    <div style={{
      background: "#ffffff", borderRadius: 12,
      padding: "20px 24px 32px 24px", width: "100%",
      boxShadow: "0 1px 3px rgba(0,0,0,0.08)", boxSizing: "border-box",
    }}>
      <div style={{ marginBottom: 4 }}>
        <div style={{ fontSize: 16, fontWeight: "bold", color: "#1e293b" }}>Music Industry Revenue</div>
        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
          2000–2023 · Physical to digital transition (Billions USD)
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "flex-end", marginTop: 12, marginBottom: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <label style={{ fontSize: 11, color: "#94a3b8", fontWeight: "600" }}>View</label>
          <select value={viewMode} onChange={e => setViewMode(e.target.value)} style={ddStyle}>
            <option value="2d">2D</option>
            <option value="3d">3D</option>
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <label style={{ fontSize: 11, color: "#94a3b8", fontWeight: "600" }}>Color Theme</label>
          <select value={theme} onChange={e => setTheme(e.target.value)} style={ddStyle}>
            {Object.keys(THEMES).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </div>

      {viewMode === "2d"
        ? <Chart2D key="2d" theme={theme} />
        : <Chart3D key="3d" theme={theme} />
      }
    </div>
  );
};

export default MusicRevenueChart;