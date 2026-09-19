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

const MATRIX = [
  [0,  5, 10, 8,  3],
  [5,  0, 15, 6,  7],
  [10,15,  0, 4, 12],
  [8,  6,  4, 0,  9],
  [3,  7, 12, 9,  0],
];
const LABELS = ["Sales","Marketing","Engineering","Support","Design"];
const TOTALS = MATRIX.map(row => row.reduce((s,v) => s+v, 0));
const GRAND  = TOTALS.reduce((s,v) => s+v, 0);

// ─── Shared Legend ────────────────────────────────────────────────────────────
function LegendHTML({ theme }) {
  const palette = THEMES[theme];
  const color   = d3.scaleOrdinal().domain(d3.range(LABELS.length)).range(palette);
  return (
    <div style={{
      background:"#fff", border:"1px solid #e2e8f0", borderRadius:8,
      padding:"12px 14px", width:150, flexShrink:0,
      boxShadow:"0 1px 4px rgba(0,0,0,0.07)", alignSelf:"flex-start",
    }}>
      <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:8 }}>
        GROUPS
      </div>
      {LABELS.map((lbl, i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:6 }}>
          <div style={{ width:10, height:10, borderRadius:2, flexShrink:0, background:color(i) }} />
          <span style={{ color:"#334155", fontSize:11, flex:1 }}>{lbl}</span>
          <span style={{ color:color(i), fontSize:10, fontWeight:"bold" }}>{TOTALS[i]}</span>
        </div>
      ))}
      <div style={{ borderTop:"1px solid #e2e8f0", marginTop:8, paddingTop:8 }}>
        <div style={{ display:"flex", justifyContent:"space-between" }}>
          <span style={{ fontSize:10, color:"#94a3b8" }}>Grand total</span>
          <span style={{ fontSize:11, fontWeight:"bold", color:"#334155" }}>{GRAND}</span>
        </div>
      </div>
    </div>
  );
}

// ─── 2D Chord ─────────────────────────────────────────────────────────────────
function Chord2D({ theme }) {
  const svgRef = useRef(null);

  useEffect(() => {
    const W = 620, H = 500;
    const cx = W/2 - 30, cy = H/2;
    const innerR = 150, outerR = 172;
    const palette = THEMES[theme];
    const color   = d3.scaleOrdinal().domain(d3.range(LABELS.length)).range(palette);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${W} ${H}`).attr("preserveAspectRatio","xMidYMid meet");
    svg.append("rect").attr("width",W).attr("height",H).attr("fill","#f8fafc").attr("rx",8);

    const chords = d3.chord().padAngle(0.06).sortSubgroups(d3.descending)(MATRIX);
    const arc    = d3.arc().innerRadius(innerR).outerRadius(outerR);
    const ribbon = d3.ribbon().radius(innerR);

    const g = svg.append("g").attr("transform", `translate(${cx},${cy})`);

    const tooltip = d3.select("body").append("div")
      .style("position","absolute").style("background","rgba(15,23,42,0.92)")
      .style("color","#fff").style("padding","8px 12px").style("border-radius","6px")
      .style("font-size","12px").style("pointer-events","none").style("opacity",0)
      .style("border","1px solid #334155").style("z-index","9999");

    // Ribbons
    g.append("g").attr("fill-opacity",0.65)
      .selectAll("path").data(chords).enter().append("path")
      .attr("d", ribbon)
      .attr("fill",   d => color(d.source.index))
      .attr("stroke", d => d3.color(color(d.source.index)).darker())
      .style("cursor","pointer")
      .on("mouseover", function(event, d) {
        d3.select(this).attr("fill-opacity",0.9);
        tooltip.style("opacity",1)
          .html(
            `<b style="color:${color(d.source.index)}">${LABELS[d.source.index]}</b>` +
            ` → <b style="color:${color(d.target.index)}">${LABELS[d.target.index]}</b>` +
            `<br/>Value: <b>${d.source.value}</b>`
          )
          .style("left",(event.pageX+12)+"px").style("top",(event.pageY-10)+"px");
      })
      .on("mousemove", event => tooltip.style("left",(event.pageX+12)+"px").style("top",(event.pageY-10)+"px"))
      .on("mouseout", function() {
        d3.select(this).attr("fill-opacity",0.65);
        tooltip.style("opacity",0);
      });

    // Outer arcs
    const group = g.append("g").selectAll("g").data(chords.groups).enter().append("g");
    group.append("path")
      .attr("fill",   d => color(d.index))
      .attr("stroke", d => d3.color(color(d.index)).darker())
      .attr("d", arc)
      .style("cursor","pointer")
      .on("mouseover", function(event, d) {
        tooltip.style("opacity",1)
          .html(`<b style="color:${color(d.index)}">${LABELS[d.index]}</b><br/>Total: <b>${d.value}</b>`)
          .style("left",(event.pageX+12)+"px").style("top",(event.pageY-10)+"px");
      })
      .on("mousemove", event => tooltip.style("left",(event.pageX+12)+"px").style("top",(event.pageY-10)+"px"))
      .on("mouseout", () => tooltip.style("opacity",0));

    // Arc labels
    group.append("text")
      .each(function(d) { d.angle = (d.startAngle + d.endAngle) / 2; })
      .attr("dy","0.35em")
      .attr("transform", d => {
        const r = outerR + 20;
        return `translate(${r*Math.sin(d.angle)},${-r*Math.cos(d.angle)}) rotate(${d.angle*180/Math.PI-90}) rotate(${d.angle>Math.PI?180:0})`;
      })
      .attr("text-anchor", d => d.angle > Math.PI ? "end" : "start")
      .style("font-size","11px").style("font-weight","700").style("pointer-events","none")
      .attr("fill", d => color(d.index))
      .text(d => LABELS[d.index]);

    return () => tooltip.remove();
  }, [theme]);

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <svg ref={svgRef} style={{ display:"block", flex:1, minWidth:0, height:500 }} />
      <div style={{ padding:"12px 12px 12px 0" }}>
        <LegendHTML theme={theme} />
      </div>
    </div>
  );
}

// ─── 3D Chord ─────────────────────────────────────────────────────────────────
function Chord3D({ theme }) {
  const mountRef   = useRef(null);
  const overlayRef = useRef(null);
  const palette    = THEMES[theme];
  const [hoverInfo, setHoverInfo] = useState(null);   // { html, x, y }

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const W = el.offsetWidth || 620, H = 500;

    const scene  = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);

    const camera = new THREE.PerspectiveCamera(42, W/H, 0.1, 100);
    camera.position.set(0, 0, 5.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);
    renderer.domElement.style.cursor = "grab";

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(4, 6, 5); scene.add(dir);
    const back = new THREE.DirectionalLight(0xffffff, 0.4);
    back.position.set(-4,-2,-4); scene.add(back);

    const n       = LABELS.length;
    const ringR   = 1.8;
    const tubeR   = 0.14;
    const pad     = 0.1;
    const pivot   = new THREE.Group();
    scene.add(pivot);

    // ── Build arc segments, track start angles ──────────────────
    const arcMids   = [];
    const arcStarts = [];
    const arcEnds   = [];

    // All hittable meshes with metadata for raycasting
    const hittable = [];

    let startAngle = -Math.PI / 2;
    TOTALS.forEach((total, i) => {
      const span = (total / GRAND) * (Math.PI * 2 - n * pad);
      const mid  = startAngle + span / 2;
      arcMids.push(mid);
      arcStarts.push(startAngle);
      arcEnds.push(startAngle + span);

      const col = new THREE.Color(palette[i % palette.length]);
      const geo = new THREE.TorusGeometry(ringR, tubeR, 20, 100, span);
      const mat = new THREE.MeshPhongMaterial({ color:col, shininess:80 });
      const mesh= new THREE.Mesh(geo, mat);
      mesh.rotation.z = startAngle;
      mesh.userData   = { type:"arc", index:i };
      pivot.add(mesh);
      hittable.push(mesh);

      // Cap dots
      [[startAngle],[startAngle+span]].forEach(([a]) => {
        const dot = new THREE.Mesh(
          new THREE.SphereGeometry(tubeR*1.2, 8, 8),
          new THREE.MeshPhongMaterial({ color:col, shininess:80 })
        );
        dot.position.set(Math.cos(a)*ringR, Math.sin(a)*ringR, 0);
        dot.userData = { type:"arc", index:i };
        pivot.add(dot);
        hittable.push(dot);
      });

      startAngle += span + pad;
    });

    // ── Build ribbon tubes with metadata ───────────────────────
    for (let i = 0; i < n; i++) {
      for (let j = i+1; j < n; j++) {
        const val = MATRIX[i][j];
        if (val === 0) continue;
        const ai = arcMids[i], aj = arcMids[j];
        const p1 = new THREE.Vector3(Math.cos(ai)*ringR, Math.sin(ai)*ringR, 0);
        const p2 = new THREE.Vector3(Math.cos(aj)*ringR, Math.sin(aj)*ringR, 0);
        const ctrl = new THREE.Vector3(0, 0, 0);
        const curve  = new THREE.QuadraticBezierCurve3(p1, ctrl, p2);
        const width  = Math.max(0.025, val / GRAND * 0.55);
        const geo    = new THREE.TubeGeometry(curve, 48, width, 10, false);
        const col    = new THREE.Color(palette[i % palette.length]);
        const mat    = new THREE.MeshPhongMaterial({
          color:col, transparent:true, opacity:0.52, shininess:30,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.userData = { type:"ribbon", src:i, tgt:j, val };
        pivot.add(mesh);
        hittable.push(mesh);
      }
    }

    // ── Label anchors (local coords, projected each frame) ──────
    const labelLocalPos = arcMids.map(mid => ({
      x: Math.cos(mid) * (ringR + 0.42),
      y: Math.sin(mid) * (ringR + 0.42),
      z: 0,
    }));

    // ── Raycaster ───────────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    raycaster.params.Line = { threshold:0.1 };

    const getMouseNDC = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      return new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width)  *  2 - 1,
        ((e.clientY - rect.top)  / rect.height) * -2 + 1
      );
    };

    // ── Drag state ──────────────────────────────────────────────
    let isDragging=false, prevX=0, prevY=0, rotX=0, rotY=0, autoSpin=true;
    let didDrag = false;

    const onDown = e => {
      isDragging = true; prevX = e.clientX; prevY = e.clientY;
      didDrag = false; autoSpin = false;
      renderer.domElement.style.cursor = "grabbing";
    };
    const onUp = e => {
      isDragging = false;
      renderer.domElement.style.cursor = "grab";
    };
    const onWindowMove = e => {
      if (!isDragging) return;
      const dx = e.clientX - prevX, dy = e.clientY - prevY;
      if (Math.abs(dx)+Math.abs(dy) > 2) didDrag = true;
      rotY += dx * 0.006;
      rotX  = Math.max(-0.8, Math.min(0.8, rotX + dy * 0.004));
      prevX = e.clientX; prevY = e.clientY;
    };

    // Hover handler on canvas
    const onCanvasMove = e => {
      if (isDragging) { setHoverInfo(null); return; }
      const ndc = getMouseNDC(e);
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(hittable, false);

      if (hits.length > 0) {
        const ud   = hits[0].object.userData;
        const rect = renderer.domElement.getBoundingClientRect();
        renderer.domElement.style.cursor = "pointer";

        if (ud.type === "arc") {
          const col = palette[ud.index % palette.length];
          setHoverInfo({
            html:
              `<span style="color:${col};font-weight:700;font-size:13px">${LABELS[ud.index]}</span>` +
              `<div style="color:#94a3b8;margin-top:4px">Total connections: <b style="color:#e2e8f0">${TOTALS[ud.index]}</b></div>`,
            x: e.clientX, y: e.clientY,
          });
        } else if (ud.type === "ribbon") {
          const colS = palette[ud.src % palette.length];
          const colT = palette[ud.tgt % palette.length];
          setHoverInfo({
            html:
              `<b style="color:${colS}">${LABELS[ud.src]}</b>` +
              ` <span style="color:#64748b">↔</span> ` +
              `<b style="color:${colT}">${LABELS[ud.tgt]}</b>` +
              `<div style="color:#94a3b8;margin-top:4px">Flow value: <b style="color:#e2e8f0">${ud.val}</b></div>`,
            x: e.clientX, y: e.clientY,
          });
        }
      } else {
        renderer.domElement.style.cursor = "grab";
        setHoverInfo(null);
      }
    };
    const onCanvasLeave = () => setHoverInfo(null);

    renderer.domElement.addEventListener("mousedown",  onDown);
    renderer.domElement.addEventListener("mousemove",  onCanvasMove);
    renderer.domElement.addEventListener("mouseleave", onCanvasLeave);
    window.addEventListener("mouseup",   onUp);
    window.addEventListener("mousemove", onWindowMove);

    // ── Animate ─────────────────────────────────────────────────
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (autoSpin) rotY += 0.004;
      pivot.rotation.set(rotX, rotY, 0);
      pivot.updateMatrixWorld(true);
      camera.updateMatrixWorld(true);

      // Project label anchors using matrixWorld (correct)
      if (overlayRef.current) {
        const divs = overlayRef.current.querySelectorAll(".cdlbl");
        divs.forEach((div, i) => {
          const lp      = labelLocalPos[i];
          const local   = new THREE.Vector3(lp.x, lp.y, lp.z);
          const world   = local.applyMatrix4(pivot.matrixWorld);
          const ndc     = world.clone().project(camera);
          const sx      = ( ndc.x * 0.5 + 0.5) * W;
          const sy      = (-ndc.y * 0.5 + 0.5) * H;
          // Visibility: if the label position z in local is 0,
          // check the rotated normal — when arc faces away, hide
          const rotated = new THREE.Vector3(lp.x, lp.y, 0).applyEuler(pivot.rotation).normalize();
          const visible = rotated.z > -0.1 && ndc.z <= 1;
          div.style.left      = `${sx}px`;
          div.style.top       = `${sy}px`;
          div.style.opacity   = visible ? "1" : "0";
          div.style.transform = "translate(-50%,-50%)";
        });
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      renderer.domElement.removeEventListener("mousedown",  onDown);
      renderer.domElement.removeEventListener("mousemove",  onCanvasMove);
      renderer.domElement.removeEventListener("mouseleave", onCanvasLeave);
      window.removeEventListener("mouseup",   onUp);
      window.removeEventListener("mousemove", onWindowMove);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [theme]);

  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
      <div style={{ position:"relative", flex:1, minWidth:0 }}>
        {/* Three.js canvas */}
        <div ref={mountRef} style={{ width:"100%", height:500, cursor:"grab" }} />

        {/* Projected HTML labels */}
        <div ref={overlayRef} style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
          {LABELS.map((lbl, i) => (
            <div key={i} className="cdlbl" style={{
              position:   "absolute",
              transform:  "translate(-50%,-50%)",
              background: "rgba(255,255,255,0.95)",
              color:      palette[i % palette.length],
              fontSize:   10, fontWeight:"bold",
              padding:    "3px 8px", borderRadius:4,
              border:     `1.5px solid ${palette[i%palette.length]}`,
              whiteSpace: "nowrap", transition:"opacity 0.08s",
              pointerEvents: "none",
              boxShadow:  "0 1px 6px rgba(0,0,0,0.13)",
            }}>
              {lbl}
              <span style={{ marginLeft:5, color:"#94a3b8", fontWeight:"normal", fontSize:9 }}>
                {TOTALS[i]}
              </span>
            </div>
          ))}
        </div>

        {/* Hover tooltip — positioned fixed so it never clips */}
        {hoverInfo && (
          <div style={{
            position:     "fixed",
            left:         Math.min(hoverInfo.x + 14, window.innerWidth - 230),
            top:          Math.min(hoverInfo.y - 10, window.innerHeight - 90),
            background:   "rgba(15,23,42,0.96)",
            color:        "#f1f5f9",
            padding:      "9px 13px",
            borderRadius: 8,
            fontSize:     12,
            pointerEvents:"none",
            border:       "1px solid #334155",
            zIndex:       9999,
            boxShadow:    "0 8px 24px rgba(0,0,0,0.45)",
            minWidth:     180,
          }}
            dangerouslySetInnerHTML={{ __html: hoverInfo.html }}
          />
        )}

        <div style={{ padding:"7px 14px", background:"#f8fafc", borderTop:"1px solid #e2e8f0", fontSize:11, color:"#94a3b8" }}>
          💡 Drag to rotate · hover arcs and ribbons to see flow data · auto-spins until you interact
        </div>
      </div>

      <div style={{ padding:"12px 12px 12px 0" }}>
        <LegendHTML theme={theme} />
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const ChordDiagram = () => {
  const [viewMode, setViewMode] = useState("2d");
  const [theme,    setTheme]    = useState("Modern");

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
      <div style={{ marginBottom:4 }}>
        <div style={{ fontSize:16, fontWeight:"bold", color:"#1e293b" }}>Chord Diagram</div>
        <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>
          Group relationship flows · Sales · Marketing · Engineering · Support · Design
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

      {viewMode === "2d"
        ? <Chord2D key={`2d-${theme}`} theme={theme} />
        : <Chord3D key={`3d-${theme}`} theme={theme} />
      }
    </div>
  );
};

export default ChordDiagram;