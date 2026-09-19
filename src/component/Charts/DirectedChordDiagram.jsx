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

// ─── Legend ───────────────────────────────────────────────────────────────────
function LegendHTML({ nodes, palette }) {
  const color = d3.scaleOrdinal().domain(d3.range(nodes.length)).range(palette);
  return (
    <div style={{
      background:"#fff", border:"1px solid #e2e8f0", borderRadius:8,
      padding:"12px 14px", width:156, flexShrink:0,
      boxShadow:"0 1px 4px rgba(0,0,0,0.07)", alignSelf:"flex-start",
      maxHeight: 540, overflowY:"auto",
    }}>
      <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:8 }}>
        COUNTRIES
      </div>
      {nodes.map((n, i) => (
        <div key={n} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:5 }}>
          <div style={{ width:10, height:10, borderRadius:2, flexShrink:0, background:color(i) }} />
          <span style={{ color:"#334155", fontSize:11 }}>{n}</span>
        </div>
      ))}
    </div>
  );
}

// ─── 2D Chart ─────────────────────────────────────────────────────────────────
function Chart2D({ theme }) {
  const svgRef   = useRef(null);
  const wrapRef  = useRef(null);
  const [nodes, setNodes] = useState([]);
  const palette  = THEMES[theme];

  useEffect(() => {
    if (!svgRef.current) return;

    d3.csv("/debt.csv").then(data => {
      data.forEach(d => (d.value = +d.value));

      const nodeList = Array.from(
        new Set(data.flatMap(d => [d.source, d.target]))
      ).sort();
      setNodes(nodeList);

      const index  = new Map(nodeList.map((d, i) => [d, i]));
      const matrix = Array.from({ length: nodeList.length }, () =>
        Array(nodeList.length).fill(0)
      );
      data.forEach(d => {
        matrix[index.get(d.source)][index.get(d.target)] = d.value;
      });

      const color = d3.scaleOrdinal()
        .domain(d3.range(nodeList.length))
        .range(palette);

      // ── Sizing: enough room for all labels ──
      const size        = 660;
      const outerRadius = size * 0.30;
      const innerRadius = outerRadius - 28;
      const labelR      = outerRadius + 52;

      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();
      svg
        .attr("width",  size)
        .attr("height", size)
        .attr("viewBox", [-size/2, -size/2, size, size]);

      // Background
      svg.append("rect")
        .attr("x",-size/2).attr("y",-size/2)
        .attr("width",size).attr("height",size)
        .attr("fill","#f8fafc").attr("rx",8);

      const chord = d3.chordDirected()
        .padAngle(0.06)
        .sortSubgroups(d3.descending);

      const arc    = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);
      const ribbon = d3.ribbonArrow()
        .radius(innerRadius - 1)
        .padAngle(1 / innerRadius);

      const chords = chord(matrix);

      // Tooltip
      const tooltip = d3.select("body").append("div")
        .style("position","absolute").style("background","rgba(15,23,42,0.92)")
        .style("color","#fff").style("padding","8px 12px").style("border-radius","6px")
        .style("font-size","12px").style("pointer-events","none").style("opacity",0)
        .style("border","1px solid #334155").style("z-index","9999");

      // ── Arcs ──
      const group = svg.append("g")
        .selectAll("g")
        .data(chords.groups)
        .enter().append("g");

      group.append("path")
        .attr("d", arc)
        .attr("fill", d => color(d.index))
        .attr("stroke","#fff").attr("stroke-width",1.5)
        .attr("opacity", 0.90)
        .style("cursor","pointer")
        .on("mouseover", function(event, d) {
          d3.select(this).attr("opacity",1);
          tooltip.style("opacity",1)
            .html(`<b style="color:${color(d.index)}">${nodeList[d.index]}</b><br/>Total: <b>${d3.format(",.1f")(d.value)}</b>B`)
            .style("left",(event.pageX+12)+"px").style("top",(event.pageY-10)+"px");
        })
        .on("mouseout", function() { d3.select(this).attr("opacity",0.90); tooltip.style("opacity",0); });

      // ── Ribbons ──
      svg.append("g")
        .selectAll("path")
        .data(chords)
        .enter().append("path")
        .attr("d", ribbon)
        .attr("fill", d => color(d.source.index))
        .attr("stroke","none")
        .attr("opacity", 0.65)
        .style("cursor","pointer")
        .on("mouseover", function(event, d) {
          d3.select(this).attr("opacity",1);
          tooltip.style("opacity",1)
            .html(
              `<b style="color:${color(d.source.index)}">${nodeList[d.source.index]}</b>` +
              ` → <b style="color:${color(d.target.index)}">${nodeList[d.target.index]}</b>` +
              `<br/>Value: <b>${d3.format(",.2f")(d.source.value)}B</b>`
            )
            .style("left",(event.pageX+12)+"px").style("top",(event.pageY-10)+"px");
        })
        .on("mouseout", function() { d3.select(this).attr("opacity",0.65); tooltip.style("opacity",0); });

      // ── Labels — properly spaced, no cut-off ──
      svg.append("g")
        .selectAll("text")
        .data(chords.groups)
        .enter().append("text")
        .each(d => (d.angle = (d.startAngle + d.endAngle) / 2))
        .attr("dy","0.35em")
        .attr("transform", d => `
          rotate(${(d.angle * 180 / Math.PI) - 90})
          translate(${labelR})
          ${d.angle > Math.PI ? "rotate(180)" : ""}
        `)
        .style("text-anchor", d => d.angle > Math.PI ? "end" : "start")
        .style("font-size","11px")
        .style("font-weight","600")
        .style("fill","#334155")
        .style("pointer-events","none")
        .text(d => nodeList[d.index]);

      return () => tooltip.remove();
    });
  }, [theme]);

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <div ref={wrapRef} style={{ flex:1, minWidth:0, display:"flex", justifyContent:"center", background:"#f8fafc", padding:"8px" }}>
        <svg ref={svgRef} style={{ display:"block" }} />
      </div>
      <div style={{ padding:"12px 12px 12px 0" }}>
        <LegendHTML nodes={nodes} palette={THEMES[theme]} />
      </div>
    </div>
  );
}

// ─── 3D Chart ─────────────────────────────────────────────────────────────────
function Chart3D({ theme }) {
  const mountRef   = useRef(null);
  const overlayRef = useRef(null);
  const palette    = THEMES[theme];

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);

    const W = el.clientWidth || 680;
    const H = 480;

    const scene  = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);

    const camera = new THREE.PerspectiveCamera(42, W/H, 0.1, 200);
    camera.position.set(0, 9, 16);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.domElement.style.display    = "block";
    renderer.domElement.style.outline    = "none";
    renderer.domElement.style.userSelect = "none";
    el.appendChild(renderer.domElement);

    // ── Lights — NO AxesHelper ────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.78));
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(6,14,10); sun.castShadow=true; scene.add(sun);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xe0e7ff, 0.45));

    // ── Floor + clean grid ────────────────────────────────────────────────
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(36, 36),
      new THREE.MeshStandardMaterial({ color:0xf1f5f9, roughness:0.9 })
    );
    floor.rotation.x = -Math.PI/2; floor.position.y = -0.5;
    floor.receiveShadow = true; scene.add(floor);
    const grid = new THREE.GridHelper(36, 30, 0xcccccc, 0xe2e8f0);
    grid.position.y = -0.48; scene.add(grid);

    const labelAnchors = [];
    let   animId;

    d3.csv("/debt.csv").then(data => {
      data.forEach(d => (d.value = +d.value));

      const nodeList = Array.from(
        new Set(data.flatMap(d => [d.source, d.target]))
      ).sort();

      const N      = nodeList.length;
      const radius = 5.5;

      // Node 3D positions on circle
      const pos = {};
      nodeList.forEach((n, i) => {
        const a = (i / N) * Math.PI * 2 - Math.PI / 2;
        pos[n]  = new THREE.Vector3(
          Math.cos(a) * radius,
          0,
          Math.sin(a) * radius
        );
      });

      // ── Node spheres ──────────────────────────────────────────────────
      nodeList.forEach((n, i) => {
        const col = new THREE.Color(palette[i % palette.length]);

        const sphere = new THREE.Mesh(
          new THREE.SphereGeometry(0.22, 32, 32),
          new THREE.MeshStandardMaterial({
            color:col, roughness:0.28, metalness:0.55,
            emissive:col, emissiveIntensity:0.25,
          })
        );
        sphere.position.copy(pos[n]);
        sphere.castShadow = true;
        scene.add(sphere);

        // Glow ring around each node
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.28, 0.03, 8, 32),
          new THREE.MeshStandardMaterial({
            color:col, emissive:col, emissiveIntensity:1.2,
            roughness:0.04, metalness:1,
          })
        );
        ring.position.copy(pos[n]);
        ring.rotation.x = Math.PI/2;
        scene.add(ring);

        // Label anchor above each node
        labelAnchors.push({
          pos:  pos[n].clone().add(new THREE.Vector3(0, 0.55, 0)),
          text: n,
          col:  `#${col.getHexString()}`,
          type: "node",
        });
      });

      // ── Tubes (connections) ────────────────────────────────────────────
      const maxVal = d3.max(data, d => d.value);

      data.forEach((d, i) => {
        const s   = pos[d.source];
        const t   = pos[d.target];
        if (!s || !t) return;

        const col  = new THREE.Color(palette[
          nodeList.indexOf(d.source) % palette.length
        ]);

        // Arc height proportional to value
        const midH = (d.value / maxVal) * 3.5 + 0.4;
        const mid  = new THREE.Vector3(
          (s.x + t.x) / 2,
          midH,
          (s.z + t.z) / 2
        );

        const curve = new THREE.QuadraticBezierCurve3(s, mid, t);

        // Tube thickness proportional to value
        const tubeR = 0.018 + (d.value / maxVal) * 0.045;
        const tube  = new THREE.Mesh(
          new THREE.TubeGeometry(curve, 28, tubeR, 7, false),
          new THREE.MeshStandardMaterial({
            color:col, roughness:0.25, metalness:0.45,
            transparent:true, opacity:0.75,
            emissive:col, emissiveIntensity:0.12,
          })
        );
        tube.castShadow = true;
        scene.add(tube);

        // Arrow at target end
        const tangent = curve.getTangent(0.92).normalize();
        const arrowP  = curve.getPoint(0.94);
        const cone    = new THREE.Mesh(
          new THREE.ConeGeometry(0.10, 0.26, 8),
          new THREE.MeshStandardMaterial({
            color:col, roughness:0.2, metalness:0.5,
            emissive:col, emissiveIntensity:0.3,
          })
        );
        cone.position.copy(arrowP);
        const axis = new THREE.Vector3(0,1,0);
        cone.quaternion.setFromUnitVectors(axis, tangent);
        scene.add(cone);

        // Value label at arc peak
        labelAnchors.push({
          pos:  mid.clone().add(new THREE.Vector3(0, 0.2, 0)),
          text: d3.format(",.1f")(d.value) + "B",
          col:  `#${col.getHexString()}`,
          type: "value",
        });
      });

      // ── Set text on overlay divs ───────────────────────────────────────
      if (overlayRef.current) {
        const divs = overlayRef.current.querySelectorAll(".shlbl");
        labelAnchors.forEach((a, i) => {
          if (divs[i]) divs[i].textContent = a.text;
        });
      }
    });

    // Project 3D → 2D
    const toScreen = (v3) => {
      const v = v3.clone().project(camera);
      return { sx:(v.x*0.5+0.5)*W, sy:(-v.y*0.5+0.5)*H, behind:v.z>1 };
    };

    // ── Drag rotation + auto-spin ─────────────────────────────────────────
    let isDragging=false, prevX=0, prevY=0,
        rotY=0, rotX=0.18, autoSpin=true;

    const pivot = new THREE.Group();
    scene.add(pivot);

    const onDown = e => {
      e.preventDefault();
      isDragging=true; prevX=e.clientX; prevY=e.clientY;
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

      // Orbit camera around origin
      const camR = 16;
      camera.position.x = Math.sin(rotY) * camR * Math.cos(rotX);
      camera.position.z = Math.cos(rotY) * camR * Math.cos(rotX);
      camera.position.y = Math.sin(rotX) * camR * 0.6 + 2;
      camera.lookAt(0, 1, 0);
      camera.updateMatrixWorld();

      if (overlayRef.current) {
        overlayRef.current.querySelectorAll(".shlbl").forEach((div, i) => {
          const a = labelAnchors[i];
          if (!a) return;
          const { sx, sy, behind } = toScreen(a.pos);
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
      window.removeEventListener("mouseup",   onUp);
      window.removeEventListener("mousemove", onMove);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [theme]);

  // Enough placeholder divs for nodes + connections
  // Max: 10 nodes + ~43 connections = 53 labels
  const jsxLabels = Array.from({ length: 80 }, (_, i) => ({
    col: palette[i % palette.length],
    type: i < 20 ? "node" : "value",
  }));

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <div style={{ position:"relative", flex:1, minWidth:0, userSelect:"none" }}>
        <div ref={mountRef} style={{ width:"100%", height:480, cursor:"grab", overflow:"hidden" }} />

        {/* HTML label overlay */}
        <div ref={overlayRef} style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
          {jsxLabels.map((a, i) => (
            <div key={i} className="shlbl" style={{
              position:      "absolute",
              transform:     "translate(-50%,-100%)",
              background:    a.type==="node"
                ? "rgba(255,255,255,0.95)"
                : "rgba(255,255,255,0.88)",
              color:         a.col,
              fontSize:      a.type==="node" ? 10 : 8,
              fontWeight:    "bold",
              padding:       a.type==="node" ? "3px 7px" : "2px 4px",
              borderRadius:  3,
              border:        `1px solid ${a.col}55`,
              whiteSpace:    "nowrap",
              pointerEvents: "none",
              boxShadow:     "0 1px 3px rgba(0,0,0,0.10)",
              opacity:       0,
            }} />
          ))}
        </div>

        <div style={{ padding:"7px 14px", background:"#f8fafc", borderTop:"1px solid #e2e8f0", fontSize:11, color:"#94a3b8" }}>
          💡 Drag to rotate · auto-spins · Arc height = debt value · Arrow = direction of debt
        </div>
      </div>

      <div style={{ padding:"12px 12px 12px 0" }}>
        <LegendHTML nodes={Object.keys(THEMES)} palette={palette} />
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const DirectedChordDiagram = () => {
  const [theme,    setTheme]    = useState("Modern");
  const [viewMode, setViewMode] = useState("2d");

  const ddStyle = {
    padding:"5px 10px", borderRadius:6, border:"1px solid #e2e8f0",
    background:"#fff", color:"#334155", fontWeight:"500",
    cursor:"pointer", fontSize:12, outline:"none",
  };

  return (
    <div style={{
      background:"#ffffff", borderRadius:12, padding:"20px 24px 32px 24px",
      width:"100%", boxShadow:"0 1px 3px rgba(0,0,0,0.08)", boxSizing:"border-box",
    }}>
      <div style={{ marginBottom:4 }}>
        <div style={{ fontSize:16, fontWeight:"bold", color:"#1e293b" }}>
          Directed Chord Diagram
        </div>
        <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>
          Cross-country debt flows · Values in $B
        </div>
      </div>

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

      <div style={{ minHeight:480 }}>
        {viewMode === "2d"
          ? <Chart2D key={`2d-${theme}`} theme={theme} />
          : <Chart3D key={`3d-${theme}`} theme={theme} />
        }
      </div>
    </div>
  );
};

export default DirectedChordDiagram;