import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as THREE from "three";

const THEMES = {
  Modern:  { circle:"#6366f1", enclosing:"#06b6d4", bg:"#f0f4ff" },
  Neon:    { circle:"#ff0080", enclosing:"#00f5ff", bg:"#f0fffe" },
  Pastel:  { circle:"#a5b4fc", enclosing:"#67e8f9", bg:"#fafbff" },
  Sunset:  { circle:"#ff6b6b", enclosing:"#feca57", bg:"#fff8f0" },
  Ocean:   { circle:"#0077b6", enclosing:"#00b4d8", bg:"#f0f8ff" },
  Galaxy:  { circle:"#7b2cbf", enclosing:"#c77dff", bg:"#faf5ff" },
  Forest:  { circle:"#40916c", enclosing:"#74c69d", bg:"#f0fff4" },
  Autumn:  { circle:"#e63946", enclosing:"#f59e0b", bg:"#fff8f0" },
  Candy:   { circle:"#ff006e", enclosing:"#8338ec", bg:"#fff0fb" },
  Earth:   { circle:"#6b4f3c", enclosing:"#3a7d44", bg:"#f5f0eb" },
};

function buildCircles(users) {
  const n = users.length;
  return users.map((d, i) => {
    const a    = (i / n) * 2 * Math.PI;
    const dist = 80 + ((i * 37) % 70);
    const jx   = ((i * 13) % 30) - 15;
    const jy   = ((i * 17) % 30) - 15;
    return {
      id:      d.id,
      name:    d.name,
      company: d.company.name,
      email:   d.email,
      x:  dist * Math.cos(a) + jx,
      y:  dist * Math.sin(a) + jy,
      r:  10 + (d.id * 2.5) % 26,
    };
  });
}

// ─── Shared Tooltip (position:fixed, never clips) ─────────────────────────────
function Tooltip({ info, theme }) {
  if (!info) return null;
  const t = THEMES[theme];
  return (
    <div style={{
      position:     "fixed",
      left:         Math.min(info.x + 14, window.innerWidth  - 240),
      top:          Math.min(info.y - 12, window.innerHeight - 120),
      background:   "rgba(15,23,42,0.97)",
      color:        "#f1f5f9",
      padding:      "10px 14px",
      borderRadius: 8,
      fontSize:     12,
      lineHeight:   "1.7",
      pointerEvents:"none",
      border:       "1px solid #334155",
      zIndex:       99999,
      boxShadow:    "0 8px 24px rgba(0,0,0,0.5)",
      minWidth:     200,
    }}>
      <div style={{ fontWeight:700, fontSize:14, color:t.circle, marginBottom:3 }}>{info.name}</div>
      <div style={{ color:"#94a3b8", marginBottom:2 }}>ID: {info.id} · r = {info.rDisplay}</div>
      <div style={{ color:"#e2e8f0" }}>{info.company}</div>
      <div style={{ color:"#64748b", fontSize:11 }}>{info.email}</div>
    </div>
  );
}

// ─── Shared Legend ─────────────────────────────────────────────────────────────
function LegendHTML({ theme, enclosing, count }) {
  const t = THEMES[theme];
  return (
    <div style={{
      background:"#fff", border:"1px solid #e2e8f0", borderRadius:8,
      padding:"12px 14px", width:170, flexShrink:0,
      boxShadow:"0 1px 4px rgba(0,0,0,0.07)", alignSelf:"flex-start",
    }}>
      <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:10 }}>
        LEGEND
      </div>
      {[
        { col:t.circle,    label:"Individual circles", dash:false },
        { col:t.enclosing, label:"Enclosing circle",   dash:true  },
      ].map(({ col, label, dash }) => (
        <div key={label} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
          <div style={{
            width:12, height:12, borderRadius:"50%", flexShrink:0,
            background: dash ? "none" : col,
            border:     dash ? `2px dashed ${col}` : "none",
          }} />
          <span style={{ color:"#334155", fontSize:11 }}>{label}</span>
        </div>
      ))}
      {enclosing && (
        <>
          <div style={{ borderTop:"1px solid #e2e8f0", margin:"10px 0" }} />
          <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:8 }}>
            STATISTICS
          </div>
          {[
            ["Circles",     count],
            ["Enc. radius", enclosing.r.toFixed(1)],
            ["Area (px²)",  (Math.PI*enclosing.r*enclosing.r).toFixed(0)],
            ["Centre X",    enclosing.x.toFixed(1)],
            ["Centre Y",    enclosing.y.toFixed(1)],
          ].map(([k,v]) => (
            <div key={k} style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
              <span style={{ fontSize:10, color:"#94a3b8" }}>{k}</span>
              <span style={{ fontSize:10, fontWeight:"bold", color:"#334155" }}>{v}</span>
            </div>
          ))}
        </>
      )}
      <div style={{ borderTop:"1px solid #e2e8f0", marginTop:8, paddingTop:8 }}>
        <div style={{ fontSize:9, color:"#94a3b8" }}>JSONPlaceholder API<br/>d3.packEnclose algorithm</div>
      </div>
    </div>
  );
}

// ─── 2D Chart ──────────────────────────────────────────────────────────────────
function Chart2D({ circles, theme }) {
  const svgRef    = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const t = THEMES[theme];

  useEffect(() => {
    if (!svgRef.current || !circles.length) return;

    const W = 580, H = 480;
    const enc = d3.packEnclose(circles);
    const pad = 48;
    const available = Math.min(W, H) / 2 - pad;
    const scale = available / enc.r;
    const cx = W / 2, cy = H / 2;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox",`0 0 ${W} ${H}`).attr("preserveAspectRatio","xMidYMid meet");
    svg.append("rect").attr("width",W).attr("height",H).attr("fill",t.bg).attr("rx",8);

    // Grid
    d3.range(0,W,50).forEach(x => {
      svg.append("line").attr("x1",x).attr("x2",x).attr("y1",0).attr("y2",H)
        .attr("stroke","#e2e8f0").attr("stroke-width",0.5);
    });
    d3.range(0,H,50).forEach(y => {
      svg.append("line").attr("x1",0).attr("x2",W).attr("y1",y).attr("y2",y)
        .attr("stroke","#e2e8f0").attr("stroke-width",0.5);
    });

    // Gradient defs
    const defs = svg.append("defs");
    const rg   = defs.append("radialGradient").attr("id",`cg-${theme}`);
    rg.append("stop").attr("offset","0%")
      .attr("stop-color", d3.color(t.circle).brighter(0.5).formatHex());
    rg.append("stop").attr("offset","100%")
      .attr("stop-color", d3.color(t.circle).darker(0.3).formatHex());

    const tx = d => cx + (d.x - enc.x) * scale;
    const ty = d => cy + (d.y - enc.y) * scale;
    const tr = d => d.r * scale;

    // Enclosing circle
    svg.append("circle")
      .attr("cx",cx).attr("cy",cy).attr("r",0)
      .attr("fill",t.enclosing).attr("fill-opacity",0.07)
      .attr("stroke",t.enclosing).attr("stroke-width",2.5)
      .attr("stroke-dasharray","8,5")
      .transition().duration(900).ease(d3.easeElasticOut.period(0.5))
      .attr("r", enc.r * scale);

    // Enclosing label
    svg.append("text")
      .attr("x",cx).attr("y",cy - enc.r*scale - 10)
      .attr("text-anchor","middle")
      .style("font-size","10px").style("font-weight","700")
      .style("fill",t.enclosing)
      .text(`Enclosing  r = ${(enc.r*scale).toFixed(1)} px`);

    // Individual circles
    const g = svg.append("g");
    circles.forEach((d, i) => {
      const circ = g.append("circle")
        .attr("cx",tx(d)).attr("cy",ty(d)).attr("r",0)
        .attr("fill",`url(#cg-${theme})`).attr("opacity",0.88)
        .attr("stroke","#fff").attr("stroke-width",1.5)
        .style("cursor","pointer")
        .on("mouseover", function(event) {
          d3.select(this).attr("opacity",1).attr("stroke-width",2.5).attr("r",tr(d)*1.12);
          setTooltip({
            name:    d.name,
            id:      d.id,
            company: d.company,
            email:   d.email,
            rDisplay:tr(d).toFixed(1),
            x:       event.clientX,
            y:       event.clientY,
          });
        })
        .on("mousemove", function(event) {
          setTooltip(s => s ? { ...s, x:event.clientX, y:event.clientY } : s);
        })
        .on("mouseout", function() {
          d3.select(this).attr("opacity",0.88).attr("stroke-width",1.5).attr("r",tr(d));
          setTooltip(null);
        });

      circ.transition().delay(i*40).duration(450).attr("r",tr(d));

      if (tr(d) >= 10) {
        g.append("text")
          .attr("x",tx(d)).attr("y",ty(d))
          .attr("text-anchor","middle").attr("dominant-baseline","middle")
          .style("font-size", Math.max(8, tr(d)/2.8)+"px")
          .style("font-weight","bold").style("fill","#fff")
          .style("pointer-events","none")
          .text(d.id);
      }
    });
  }, [circles, theme]);

  const enc = circles.length ? d3.packEnclose(circles) : null;

  return (
    <>
      <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%",
        border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
        <svg ref={svgRef} style={{ display:"block", flex:1, minWidth:0, height:480 }} />
        <div style={{ padding:"12px 12px 12px 0" }}>
          <LegendHTML theme={theme} enclosing={enc} count={circles.length} />
        </div>
      </div>
      <Tooltip info={tooltip} theme={theme} />
    </>
  );
}

// ─── 3D Chart ──────────────────────────────────────────────────────────────────
function Chart3D({ circles, theme }) {
  const mountRef   = useRef(null);
  const overlayRef = useRef(null);
  const stateRef   = useRef({
    rotX:0.18, rotY:0, isDragging:false,
    prevX:0,   prevY:0, autoSpin:true, animId:null,
    screenPts:[], meshMap:[],
  });
  const [tooltip, setTooltip] = useState(null);
  const t = THEMES[theme];

  useEffect(() => {
    if (!mountRef.current || !circles.length) return;
    const el  = mountRef.current;
    const s   = stateRef.current;
    const W   = el.offsetWidth || 580;
    const H   = 480;

    const enc     = d3.packEnclose(circles);
    const scale3D = 4.8 / enc.r;
    const toX = d => (d.x - enc.x) * scale3D;
    const toY = d => -(d.y - enc.y) * scale3D;
    const toR = d =>  d.r * scale3D;

    const scene  = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);

    const camera = new THREE.PerspectiveCamera(42, W/H, 0.1, 200);
    camera.position.set(0, 0, 14);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    el.appendChild(renderer.domElement);
    renderer.domElement.style.cursor = "grab";

    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const sun = new THREE.DirectionalLight(0xffffff, 0.9);
    sun.position.set(5,8,6); sun.castShadow=true; scene.add(sun);
    const rimL = new THREE.PointLight(new THREE.Color(t.circle), 0.45, 60);
    rimL.position.set(-8,5,-6); scene.add(rimL);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xe0e7ff, 0.4));

    const pivot = new THREE.Group();

    // ── Enclosing torus ──────────────────────────────────────────
    const enR = enc.r * scale3D;
    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(enR, 0.08, 10, 80),
      new THREE.MeshStandardMaterial({
        color:     new THREE.Color(t.enclosing),
        roughness: 0.3, metalness:0.5,
        emissive:  new THREE.Color(t.enclosing), emissiveIntensity:0.4,
      })
    );
    pivot.add(torus);

    // ── Label anchors (local coords) — one per circle + torus label ──
    const labelLocalPos = [];
    labelLocalPos.push({ x:0, y:enR+0.42, z:0, text:`enc r=${enR.toFixed(1)}`, isId:false });

    // ── Sphere meshes with per-circle metadata ────────────────────
    const meshMeta = []; // { mesh, circle, radius }

    circles.forEach((d, i) => {
      const sx = toX(d), sy = toY(d), sr = toR(d);
      const col = new THREE.Color(t.circle);

      const geo  = new THREE.SphereGeometry(sr, 20, 16);
      const mat  = new THREE.MeshStandardMaterial({
        color:col, roughness:0.22, metalness:0.38,
        emissive:col, emissiveIntensity:0.14,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(sx, sy, 0);
      mesh.castShadow = true;
      mesh.userData   = { circle:d, radius:sr };
      pivot.add(mesh);
      meshMeta.push({ mesh, circle:d, radius:sr });

      // Edge outline
      const eg  = new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(sr, 1));
      const edgeLines = new THREE.LineSegments(eg, new THREE.LineBasicMaterial({
        color:0xffffff, transparent:true, opacity:0.25,
      }));
      edgeLines.position.set(sx, sy, 0);
      pivot.add(edgeLines);

      // Specular cap
      const capC = col.clone().lerp(new THREE.Color(0xffffff), 0.35);
      const cap  = new THREE.Mesh(
        new THREE.SphereGeometry(sr*0.38, 8, 6),
        new THREE.MeshStandardMaterial({ color:capC, emissive:capC, emissiveIntensity:1.1, roughness:0.04, metalness:1 })
      );
      cap.position.set(sx+sr*0.35, sy+sr*0.5, sr*0.35);
      pivot.add(cap);

      // Label anchor above sphere
      labelLocalPos.push({ x:sx, y:sy+sr+0.25, z:0, text:`${d.id}`, isId:true });
    });

    s.meshMap = meshMeta;
    scene.add(pivot);
    pivot.rotation.x = s.rotX;

    // ── Raycaster ────────────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    // Store original materials for highlight/restore
    const origEmissive = meshMeta.map(m => m.mesh.material.emissiveIntensity);

    // ── Animate ──────────────────────────────────────────────────
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (s.autoSpin) s.rotY += 0.005;
      pivot.rotation.set(s.rotX, s.rotY, 0);
      pivot.updateMatrixWorld(true);
      camera.updateMatrixWorld(true);

      // Project label anchors using matrixWorld (correct)
      if (overlayRef.current) {
        const divs = overlayRef.current.querySelectorAll(".pelbl");
        divs.forEach((div, i) => {
          if (i >= labelLocalPos.length) return;
          const lp      = labelLocalPos[i];
          const world   = new THREE.Vector3(lp.x, lp.y, lp.z).applyMatrix4(pivot.matrixWorld);
          const ndc     = world.clone().project(camera);
          const sx      = ( ndc.x * 0.5 + 0.5) * W;
          const sy      = (-ndc.y * 0.5 + 0.5) * H;
          const behind  = ndc.z > 1;
          div.style.left    = `${sx}px`;
          div.style.top     = `${sy}px`;
          div.style.opacity = behind ? "0" : "1";
        });
      }

      renderer.render(scene, camera);
    };
    animate();

    // ── Hover: raycaster against sphere meshes ───────────────────
    const allSphereMeshes = meshMeta.map(m => m.mesh);

    const onHover = (e) => {
      if (s.isDragging) { setTooltip(null); return; }
      const rect = renderer.domElement.getBoundingClientRect();
      const ndcX =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      const ndcY = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
      raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);

      const hits = raycaster.intersectObjects(allSphereMeshes, false);

      if (hits.length > 0) {
        renderer.domElement.style.cursor = "pointer";
        const hitMesh = hits[0].object;
        const d       = hitMesh.userData.circle;
        const sr      = hitMesh.userData.radius;

        // Highlight hit mesh
        meshMeta.forEach((m, i) => {
          m.mesh.material.emissiveIntensity = m.mesh === hitMesh ? 0.55 : origEmissive[i];
        });

        setTooltip({
          name:     d.name,
          id:       d.id,
          company:  d.company,
          email:    d.email,
          rDisplay: sr.toFixed(2),
          x:        e.clientX,
          y:        e.clientY,
        });
      } else {
        renderer.domElement.style.cursor = "grab";
        // Restore all
        meshMeta.forEach((m, i) => {
          m.mesh.material.emissiveIntensity = origEmissive[i];
        });
        setTooltip(null);
      }
    };
    const onLeave = () => {
      meshMeta.forEach((m, i) => { m.mesh.material.emissiveIntensity = origEmissive[i]; });
      setTooltip(null);
    };

    // ── Drag ─────────────────────────────────────────────────────
    const onDown = e => {
      s.isDragging = true; s.prevX = e.clientX; s.prevY = e.clientY;
      s.autoSpin   = false;
      renderer.domElement.style.cursor = "grabbing";
      setTooltip(null);
    };
    const onUp   = () => { s.isDragging = false; renderer.domElement.style.cursor = "grab"; };
    const onDrag = e => {
      if (!s.isDragging) return;
      s.rotY += (e.clientX - s.prevX) * 0.005;
      s.rotX  = Math.max(-1.2, Math.min(1.2, s.rotX + (e.clientY - s.prevY) * 0.004));
      s.prevX = e.clientX; s.prevY = e.clientY;
    };

    renderer.domElement.addEventListener("mousemove",  onHover);
    renderer.domElement.addEventListener("mouseleave", onLeave);
    renderer.domElement.addEventListener("mousedown",  onDown);
    window.addEventListener("mouseup",   onUp);
    window.addEventListener("mousemove", onDrag);

    return () => {
      cancelAnimationFrame(animId);
      renderer.domElement.removeEventListener("mousemove",  onHover);
      renderer.domElement.removeEventListener("mouseleave", onLeave);
      renderer.domElement.removeEventListener("mousedown",  onDown);
      window.removeEventListener("mouseup",   onUp);
      window.removeEventListener("mousemove", onDrag);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [circles, theme]);

  const enc = circles.length ? d3.packEnclose(circles) : null;

  // Mirror labelLocalPos for JSX (must match order built in useEffect)
  const jsxLabels = [];
  if (enc) jsxLabels.push({ text:`enc r=${enc.r.toFixed(1)}`, isId:false });
  circles.forEach(d => jsxLabels.push({ text:`${d.id}`, isId:true }));

  return (
    <>
      <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%",
        border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
        <div style={{ position:"relative", flex:1, minWidth:0 }}>
          <div ref={mountRef} style={{ width:"100%", height:480, cursor:"grab" }} />

          {/* HTML label overlay — correct matrixWorld projection */}
          <div ref={overlayRef} style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
            {jsxLabels.map((a, i) => (
              <div key={i} className="pelbl" style={{
                position:      "absolute",
                transform:     "translate(-50%,-100%)",
                background:    "rgba(255,255,255,0.95)",
                color:         a.isId ? THEMES[theme].circle : THEMES[theme].enclosing,
                fontSize:      a.isId ? 9 : 10,
                fontWeight:    "bold",
                padding:       "2px 6px",
                borderRadius:  3,
                border:        `1.5px solid ${a.isId ? THEMES[theme].circle : THEMES[theme].enclosing}`,
                whiteSpace:    "nowrap",
                transition:    "opacity 0.08s",
                pointerEvents: "none",
                boxShadow:     "0 1px 4px rgba(0,0,0,0.13)",
              }}>
                {a.text}
              </div>
            ))}
          </div>

          <div style={{ padding:"7px 14px", background:"#f8fafc",
            borderTop:"1px solid #e2e8f0", fontSize:11, color:"#94a3b8" }}>
            💡 Drag to rotate · hover spheres to see data · auto-spins until you interact
          </div>
        </div>

        <div style={{ padding:"12px 12px 12px 0" }}>
          <LegendHTML theme={theme} enclosing={enc} count={circles.length} />
        </div>
      </div>
      <Tooltip info={tooltip} theme={theme} />
    </>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
const PackEncloseChart = () => {
  const [viewMode, setViewMode] = useState("2d");
  const [theme,    setTheme]    = useState("Modern");
  const [circles,  setCircles]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [dataInfo, setDataInfo] = useState("");

  useEffect(() => {
    fetch("https://jsonplaceholder.typicode.com/users")
      .then(r => r.json())
      .then(users => {
        setCircles(buildCircles(users));
        setDataInfo(`${users.length} users · JSONPlaceholder API`);
        setLoading(false);
      })
      .catch(() => {
        const fallback = Array.from({ length:10 }, (_,i) => ({
          id: i+1, name:`User ${i+1}`,
          company:{ name:`Company ${i+1}` },
          email:`user${i+1}@demo.com`,
        }));
        setCircles(buildCircles(fallback));
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
      <div style={{ marginBottom:4 }}>
        <div style={{ fontSize:16, fontWeight:"bold", color:"#1e293b" }}>Pack Enclose Chart</div>
        <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>
          d3.packEnclose — smallest enclosing circle · {dataInfo}
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
        {loading ? (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
            height:480, color:"#94a3b8", fontSize:15,
            border:"1px solid #e2e8f0", borderRadius:8 }}>
            ⏳ Loading data…
          </div>
        ) : viewMode === "2d" ? (
          <Chart2D key={`2d-${theme}`} circles={circles} theme={theme} />
        ) : (
          <Chart3D key={`3d-${theme}`} circles={circles} theme={theme} />
        )}
      </div>
    </div>
  );
};

export default PackEncloseChart;