import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as THREE from "three";
import { feature } from "topojson-client";

// ─── Themes ───────────────────────────────────────────────────────────────────
const THEMES = {
  Modern:  { ocean:"#dbeafe", land:"#ede9fe", stroke:"#a5b4fc", bg:0xf0f4ff },
  Neon:    { ocean:"#050d1a", land:"#0a1628", stroke:"#1e3a5f", bg:0x030810 },
  Pastel:  { ocean:"#fce7f3", land:"#fef9c3", stroke:"#fbbf24", bg:0xfdf4ff },
  Sunset:  { ocean:"#fff7ed", land:"#fef3c7", stroke:"#fb923c", bg:0xfff7ed },
  Ocean:   { ocean:"#bfdbfe", land:"#cffafe", stroke:"#67e8f9", bg:0xe0f7fa },
  Galaxy:  { ocean:"#1e1b4b", land:"#312e81", stroke:"#6d28d9", bg:0x0f0a23 },
  Forest:  { ocean:"#d1fae5", land:"#ecfdf5", stroke:"#6ee7b7", bg:0xf0fdf4 },
  Autumn:  { ocean:"#fef3c7", land:"#fff7ed", stroke:"#f59e0b", bg:0xfffbeb },
  Candy:   { ocean:"#fce7f3", land:"#f5f3ff", stroke:"#f0abfc", bg:0xfdf4ff },
  Earth:   { ocean:"#dbeafe", land:"#fef9c3", stroke:"#ca8a04", bg:0xfefce8 },
};

// ─── 12 events — globally spread, each with unique color ─────────────────────
const EVENTS = [
  { id:0,  title:"Göbekli Tepe",   detail:"World's oldest temple complex",         date:"~9600 BCE", region:"Şanlıurfa, Turkey",     lat:37.22,  lon:38.92,  color:"#6366f1" },
  { id:1,  title:"Stonehenge",     detail:"Ceremonial megalithic monument",         date:"~3000 BCE", region:"Wiltshire, England",     lat:51.18,  lon:-1.83,  color:"#10b981" },
  { id:2,  title:"Great Pyramid",  detail:"Tomb of Pharaoh Khufu",                  date:"~2560 BCE", region:"Giza, Egypt",            lat:29.98,  lon:31.13,  color:"#f59e0b" },
  { id:3,  title:"Mesopotamia",    detail:"First cities & writing system",          date:"~3100 BCE", region:"Uruk, Iraq",             lat:31.32,  lon:45.63,  color:"#ef4444" },
  { id:4,  title:"Indus Valley",   detail:"Planned cities with drainage",           date:"~2600 BCE", region:"Mohenjo-daro, Pakistan", lat:27.33,  lon:68.14,  color:"#8b5cf6" },
  { id:5,  title:"Yellow River",   detail:"Cradle of Chinese civilization",         date:"~2700 BCE", region:"Henan, China",           lat:34.77,  lon:113.65, color:"#06b6d4" },
  { id:6,  title:"Norte Chico",    detail:"Oldest civilization in the Americas",    date:"~3000 BCE", region:"Caral, Peru",            lat:-10.89, lon:-77.52, color:"#f97316" },
  { id:7,  title:"Ancient Nubia",  detail:"Ta-Seti — Egypt's rival kingdom",        date:"~3100 BCE", region:"Kerma, Sudan",           lat:19.61,  lon:30.41,  color:"#ec4899" },
  { id:8,  title:"Minoan Crete",   detail:"Earliest European palace culture",       date:"~2700 BCE", region:"Knossos, Crete",         lat:35.30,  lon:25.16,  color:"#14b8a6" },
  { id:9,  title:"Yamnaya",        detail:"Proto-Indo-European spread",             date:"~3300 BCE", region:"Pontic Steppe, Ukraine", lat:48.50,  lon:35.00,  color:"#84cc16" },
  { id:10, title:"Mesoamerica",    detail:"Olmec precursor cultures emerge",        date:"~2500 BCE", region:"Veracruz, Mexico",       lat:18.46,  lon:-95.10, color:"#a855f7" },
  { id:11, title:"Jiahu Culture",  detail:"Earliest musical instruments & symbols", date:"~6600 BCE", region:"Jiahu, China",           lat:33.62,  lon:113.67, color:"#fb923c" },
];

// ─── Legend ───────────────────────────────────────────────────────────────────
function Legend({ hoverId, onHover }) {
  return (
    <div style={{
      background:"#fff", border:"1px solid #e2e8f0", borderRadius:8,
      padding:"12px 14px", width:178, flexShrink:0,
      boxShadow:"0 1px 4px rgba(0,0,0,0.07)", alignSelf:"flex-start",
      maxHeight:500, overflowY:"auto",
    }}>
      <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:10 }}>
        CIVILIZATIONS
      </div>
      {EVENTS.map(e => (
        <div
          key={e.id}
          onMouseEnter={() => onHover(e.id)}
          onMouseLeave={() => onHover(null)}
          style={{
            display:"flex", alignItems:"flex-start", gap:7, marginBottom:8,
            cursor:"default", opacity: hoverId === null || hoverId === e.id ? 1 : 0.35,
            transition:"opacity 0.15s",
          }}
        >
          <div style={{
            width:9, height:9, borderRadius:"50%", flexShrink:0,
            background:e.color, marginTop:3,
            boxShadow: hoverId === e.id ? `0 0 7px ${e.color}` : "none",
          }} />
          <div>
            <div style={{ color:"#1e293b", fontSize:11, fontWeight:"600", lineHeight:1.3 }}>{e.title}</div>
            <div style={{ color:"#94a3b8", fontSize:9, marginTop:1 }}>{e.date} · {e.region}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Tooltip component ────────────────────────────────────────────────────────
function Tooltip({ evt, pos }) {
  if (!evt || !pos) return null;
  return (
    <div style={{
      position:"fixed",
      left: Math.min(pos.x + 14, window.innerWidth - 230),
      top:  Math.min(pos.y - 10, window.innerHeight - 120),
      background:"rgba(15,23,42,0.97)", color:"#f1f5f9",
      padding:"10px 13px", borderRadius:8, fontSize:12,
      pointerEvents:"none", border:"1px solid #334155",
      zIndex:9999, boxShadow:"0 8px 24px rgba(0,0,0,0.5)",
      minWidth:200,
    }}>
      <div style={{ fontWeight:700, fontSize:13, color:evt.color, marginBottom:4 }}>{evt.title}</div>
      <div style={{ color:"#94a3b8", fontSize:10, marginBottom:6 }}>{evt.date} · {evt.region}</div>
      <div style={{ color:"#e2e8f0", fontSize:11 }}>{evt.detail}</div>
    </div>
  );
}

// ─── 2D Map — SVG-based with perfect label placement ─────────────────────────
function Map2D({ theme, hoverId, onHover }) {
  const svgRef  = useRef(null);
  const t = THEMES[theme];
  const [tooltip, setTooltip] = useState({ evt:null, pos:null });

  useEffect(() => {
    if (!svgRef.current) return;
    const W = 640, H = 400;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${W} ${H}`).attr("preserveAspectRatio","xMidYMid meet");
    svg.append("rect").attr("width",W).attr("height",H).attr("fill",t.ocean).attr("rx",8);

    const proj = d3.geoNaturalEarth1().scale(98).translate([W/2, H/2+10]);
    const path = d3.geoPath().projection(proj);

    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then(worldData => {
      const countries = feature(worldData, worldData.objects.countries);

      // Graticule
      svg.append("path").datum(d3.geoGraticule()())
        .attr("d",path).attr("fill","none")
        .attr("stroke","rgba(150,170,200,0.18)").attr("stroke-width",0.4);

      // Land
      svg.append("g").selectAll("path").data(countries.features).enter().append("path")
        .attr("d",path).attr("fill",t.land).attr("stroke",t.stroke).attr("stroke-width",0.5);

      // ── Compute all dot screen positions first ──────────────────
      const dotPositions = EVENTS.map(e => {
        const p = proj([e.lon, e.lat]);
        return p ? { x:p[0], y:p[1] } : null;
      });

      // ── Draw pulse rings ────────────────────────────────────────
      EVENTS.forEach((e, i) => {
        const dp = dotPositions[i];
        if (!dp) return;
        svg.append("circle")
          .attr("cx",dp.x).attr("cy",dp.y).attr("r",13)
          .attr("fill","none").attr("stroke",e.color)
          .attr("stroke-width",1.2).attr("opacity",0.25);
      });

      // ── Draw labels with smart offset ──────────────────────────
      // Strategy: for each event, try 4 positions (above/below/left/right)
      // pick one that keeps label inside SVG bounds and far from other labels
      const placedBoxes = []; // track placed label rects for collision avoidance
      const LABEL_PAD   = 6;
      const LABEL_H     = 15;
      const FONT_SIZE   = 9;

      // Pre-measure label widths
      const tmpSvg  = d3.select("body").append("svg").style("visibility","hidden");
      const labelWidths = EVENTS.map(e => {
        const tmp = tmpSvg.append("text").style("font-size",`${FONT_SIZE}px`).style("font-weight","700").text(e.title);
        const w   = tmp.node().getBBox().width;
        tmp.remove();
        return w + LABEL_PAD * 2;
      });
      tmpSvg.remove();

      // Candidate offsets to try, in priority order
      const CANDIDATES = [
        { dx:0,   dy:-22, anchor:"middle" }, // above-center
        { dx:18,  dy:0,   anchor:"start"  }, // right
        { dx:-18, dy:0,   anchor:"end"    }, // left
        { dx:0,   dy:22,  anchor:"middle" }, // below-center
        { dx:16,  dy:-18, anchor:"start"  }, // upper-right
        { dx:-16, dy:-18, anchor:"end"    }, // upper-left
        { dx:16,  dy:18,  anchor:"start"  }, // lower-right
        { dx:-16, dy:18,  anchor:"end"    }, // lower-left
      ];

      const labelG = svg.append("g");

      EVENTS.forEach((e, i) => {
        const dp = dotPositions[i];
        if (!dp) return;
        const lw = labelWidths[i];

        // Find best placement
        let chosen = null;
        for (const cand of CANDIDATES) {
          // Label center x depends on anchor
          let lx = dp.x + cand.dx;
          let ly = dp.y + cand.dy;
          // Box bounds
          let bx = cand.anchor === "middle" ? lx - lw/2 :
                   cand.anchor === "start"  ? lx         : lx - lw;
          let by = ly - LABEL_H/2;
          let bx2 = bx + lw, by2 = by + LABEL_H;
          // Keep inside SVG
          if (bx < 2 || bx2 > W-2 || by < 2 || by2 > H-2) continue;
          // Check collision with already placed labels
          let collides = false;
          for (const pb of placedBoxes) {
            if (bx < pb.x2+2 && bx2 > pb.x-2 && by < pb.y2+2 && by2 > pb.y-2) {
              collides = true; break;
            }
          }
          if (!collides) { chosen = { lx, ly, bx, by, bx2, by2, anchor:cand.anchor, dx:cand.dx, dy:cand.dy }; break; }
        }
        // Fallback: use first candidate regardless
        if (!chosen) {
          const cand = CANDIDATES[0];
          const lx   = dp.x + cand.dx;
          const ly   = dp.y + cand.dy;
          const bx   = cand.anchor === "middle" ? lx - lw/2 : lx;
          const by   = ly - LABEL_H/2;
          chosen = { lx, ly, bx, by, bx2:bx+lw, by2:by+LABEL_H, anchor:cand.anchor, dx:cand.dx, dy:cand.dy };
        }
        placedBoxes.push({ x:chosen.bx, y:chosen.by, x2:chosen.bx2, y2:chosen.by2 });

        // Connector line from dot edge to label
        const dotEdgeX = dp.x + Math.sign(chosen.dx || 0) * 6;
        const dotEdgeY = dp.y + Math.sign(chosen.dy || 0) * 6;
        const lblEdgeX = chosen.lx;
        const lblEdgeY = chosen.dy < 0 ? chosen.by2 : chosen.by;

        labelG.append("line")
          .attr("x1", dotEdgeX).attr("y1", dotEdgeY)
          .attr("x2", lblEdgeX).attr("y2", lblEdgeY)
          .attr("stroke", e.color).attr("stroke-width", 0.9)
          .attr("stroke-dasharray","3,2").attr("opacity",0.55);

        // Label pill
        labelG.append("rect")
          .attr("x", chosen.bx).attr("y", chosen.by)
          .attr("width", lw).attr("height", LABEL_H)
          .attr("rx", 3).attr("fill", e.color).attr("opacity", 0.88);

        labelG.append("text")
          .attr("x", chosen.lx)
          .attr("y", chosen.by + LABEL_H - 4)
          .attr("text-anchor", chosen.anchor)
          .style("font-size", `${FONT_SIZE}px`).style("font-weight","700").style("fill","#fff")
          .style("pointer-events","none")
          .text(e.title);
      });

      // ── Draw dots on top (last so they're always clickable) ────
      EVENTS.forEach((e, i) => {
        const dp = dotPositions[i];
        if (!dp) return;

        svg.append("circle")
          .attr("cx",dp.x).attr("cy",dp.y).attr("r",6)
          .attr("fill",e.color).attr("stroke","#fff").attr("stroke-width",1.8)
          .attr("opacity",0.93).style("cursor","pointer")
          .on("mouseover", function(event) {
            d3.select(this).attr("r",9).attr("opacity",1);
            setTooltip({ evt:e, pos:{ x:event.clientX, y:event.clientY } });
          })
          .on("mousemove", event => {
            setTooltip(s => ({ ...s, pos:{ x:event.clientX, y:event.clientY } }));
          })
          .on("mouseout", function() {
            d3.select(this).attr("r",6).attr("opacity",0.93);
            setTooltip({ evt:null, pos:null });
          });

        // White center dot for clarity
        svg.append("circle")
          .attr("cx",dp.x).attr("cy",dp.y).attr("r",2)
          .attr("fill","#fff").attr("pointer-events","none");
      });

    }).catch(() => {
      svg.append("text").attr("x",W/2).attr("y",H/2)
        .attr("text-anchor","middle").attr("fill","#ef4444").text("Failed to load map.");
    });
  }, [theme]);

  return (
    <>
      <div style={{
        display:"flex", gap:12, alignItems:"flex-start", width:"100%",
        border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden",
      }}>
        <svg ref={svgRef} style={{ display:"block", flex:1, minWidth:0 }} />
        <div style={{ padding:"12px 12px 12px 0" }}>
          <Legend hoverId={hoverId} onHover={onHover} />
        </div>
      </div>
      <Tooltip evt={tooltip.evt} pos={tooltip.pos} />
    </>
  );
}

// ─── 3D Globe — canvas dots, HTML overlay labels, raycaster hover ─────────────
function Map3D({ theme, hoverId, onHover }) {
  const mountRef   = useRef(null);
  const overlayRef = useRef(null);
  const stateRef   = useRef({
    rotX:0, rotY:0, isDragging:false,
    prevX:0, prevY:0, autoSpin:true,
    animId:null, hovered:null, screenPts:[],
  });
  const [tooltip, setTooltip] = useState({ evt:null, pos:null });
  const t = THEMES[theme];

  // lat/lon → unit sphere vector
  function latLonToVec(lat, lon) {
    const phi   = (90 - lat) * Math.PI / 180;
    const theta = (lon + 180) * Math.PI / 180;
    return new THREE.Vector3(
      -Math.sin(phi) * Math.cos(theta),
       Math.cos(phi),
       Math.sin(phi) * Math.sin(theta)
    );
  }

  useEffect(() => {
    if (!mountRef.current) return;
    const el  = mountRef.current;
    const s   = stateRef.current;
    const W   = el.offsetWidth || 640;
    const H   = 420;

    // ── Scene ──────────────────────────────────────────────────────
    const scene  = new THREE.Scene();
    scene.background = new THREE.Color(t.bg);

    const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 100);
    camera.position.set(0, 0, 2.85);

    const renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);
    renderer.domElement.style.cursor = "grab";

    // ── Lights ─────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const sun = new THREE.DirectionalLight(0xffffff, 0.8);
    sun.position.set(4, 3, 5);
    scene.add(sun);

    // ── Globe mesh ─────────────────────────────────────────────────
    const globeGeo = new THREE.SphereGeometry(1, 64, 64);
    const globeMat = new THREE.MeshPhongMaterial({
      color: parseInt(t.land.replace("#",""), 16),
      shininess: 10,
    });
    const globe = new THREE.Mesh(globeGeo, globeMat);
    scene.add(globe);

    // ── Canvas texture: land + dots only ──────────────────────────
    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then(worldData => {
      const countries = feature(worldData, worldData.objects.countries);
      const texW = 2048, texH = 1024;
      const can  = document.createElement("canvas");
      can.width = texW; can.height = texH;
      const ctx  = can.getContext("2d");

      // Ocean bg
      ctx.fillStyle = t.ocean;
      ctx.fillRect(0, 0, texW, texH);

      const tproj   = d3.geoEquirectangular().scale(texW/(2*Math.PI)).translate([texW/2, texH/2]);
      const pathGen = d3.geoPath().projection(tproj).context(ctx);

      // Land
      countries.features.forEach(f => {
        ctx.beginPath(); pathGen(f);
        ctx.fillStyle   = t.land;   ctx.fill();
        ctx.strokeStyle = t.stroke; ctx.lineWidth = 0.7; ctx.stroke();
      });

      // Graticule
      ctx.beginPath(); pathGen(d3.geoGraticule()());
      ctx.strokeStyle = "rgba(150,170,200,0.15)"; ctx.lineWidth = 0.4; ctx.stroke();

      // Event dots — no text labels on texture
      EVENTS.forEach(e => {
        const [px, py] = tproj([e.lon, e.lat]);
        // Outer glow
        ctx.beginPath(); ctx.arc(px, py, 18, 0, Math.PI*2);
        ctx.strokeStyle = e.color; ctx.lineWidth = 2.5; ctx.globalAlpha = 0.25; ctx.stroke();
        ctx.globalAlpha = 1;
        // Mid ring
        ctx.beginPath(); ctx.arc(px, py, 11, 0, Math.PI*2);
        ctx.strokeStyle = e.color; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.5; ctx.stroke();
        ctx.globalAlpha = 1;
        // Filled dot
        ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI*2);
        ctx.fillStyle = e.color; ctx.fill();
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 2.5; ctx.stroke();
        // White center
        ctx.beginPath(); ctx.arc(px, py, 2.5, 0, Math.PI*2);
        ctx.fillStyle = "#fff"; ctx.fill();
      });

      globe.material = new THREE.MeshPhongMaterial({
        map: new THREE.CanvasTexture(can),
        shininess: 10,
      });
      globe.material.map.needsUpdate = true;
    });

    // ── Unit sphere positions for each event ──────────────────────
    const unitVecs = EVENTS.map(e => latLonToVec(e.lat, e.lon));

    // ── Frame loop ─────────────────────────────────────────────────
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (s.autoSpin) s.rotY += 0.003;

      globe.rotation.x = s.rotX;
      globe.rotation.y = s.rotY;
      globe.updateMatrixWorld(true);
      camera.updateMatrixWorld(true);

      // Project each event's world position to screen
      const newPts = [];
      if (overlayRef.current) {
        const divs = overlayRef.current.querySelectorAll(".evtlbl");
        divs.forEach((div, i) => {
          // World position = apply globe rotation to unit sphere point
          const worldPos = unitVecs[i].clone().applyMatrix4(globe.matrixWorld);
          // NDC
          const ndc = worldPos.clone().project(camera);
          const sx  = ( ndc.x * 0.5 + 0.5) * W;
          const sy  = (-ndc.y * 0.5 + 0.5) * H;
          // Visibility: check if the point is on the front hemisphere
          // The rotated vector in camera space — if z > 0 after rotation it faces camera
          const rotated  = unitVecs[i].clone().applyEuler(globe.rotation);
          const visible  = rotated.z > 0.05;

          div.style.left    = `${sx}px`;
          div.style.top     = `${sy}px`;
          div.style.opacity = visible ? "1" : "0";
          div.style.pointerEvents = visible ? "auto" : "none";

          newPts.push({ evt:EVENTS[i], sx, sy, visible });
        });
      }
      s.screenPts = newPts;
      renderer.render(scene, camera);
    };
    animate();
    s.animId = animId;

    // ── Mouse: drag ────────────────────────────────────────────────
    const onDown = e => {
      s.isDragging = true; s.prevX = e.clientX; s.prevY = e.clientY;
      s.autoSpin = false; renderer.domElement.style.cursor = "grabbing";
    };
    const onUp = () => { s.isDragging = false; renderer.domElement.style.cursor = "grab"; };
    const onDrag = e => {
      if (!s.isDragging) return;
      s.rotY += (e.clientX - s.prevX) * 0.005;
      s.rotX  = Math.max(-1.2, Math.min(1.2, s.rotX + (e.clientY - s.prevY) * 0.003));
      s.prevX = e.clientX; s.prevY = e.clientY;
    };

    // ── Mouse: hover over projected dots ──────────────────────────
    const onHoverCanvas = e => {
      if (s.isDragging) { setTooltip({ evt:null, pos:null }); return; }
      const rect = renderer.domElement.getBoundingClientRect();
      const mx   = e.clientX - rect.left;
      const my   = e.clientY - rect.top;
      let   found = null;
      // Check each visible screen point
      for (const pt of s.screenPts) {
        if (!pt.visible) continue;
        const dx = mx - pt.sx * (rect.width / W);
        const dy = my - pt.sy * (rect.height / H);
        if (Math.sqrt(dx*dx + dy*dy) < 14) { found = pt.evt; break; }
      }
      if (found) {
        renderer.domElement.style.cursor = "pointer";
        setTooltip({ evt:found, pos:{ x:e.clientX, y:e.clientY } });
      } else {
        renderer.domElement.style.cursor = s.isDragging ? "grabbing" : "grab";
        setTooltip({ evt:null, pos:null });
      }
    };
    const onLeaveCanvas = () => setTooltip({ evt:null, pos:null });

    renderer.domElement.addEventListener("mousedown",  onDown);
    renderer.domElement.addEventListener("mousemove",  onHoverCanvas);
    renderer.domElement.addEventListener("mouseleave", onLeaveCanvas);
    window.addEventListener("mouseup",   onUp);
    window.addEventListener("mousemove", onDrag);

    return () => {
      cancelAnimationFrame(animId);
      renderer.domElement.removeEventListener("mousedown",  onDown);
      renderer.domElement.removeEventListener("mousemove",  onHoverCanvas);
      renderer.domElement.removeEventListener("mouseleave", onLeaveCanvas);
      window.removeEventListener("mouseup",   onUp);
      window.removeEventListener("mousemove", onDrag);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [theme]);

  return (
    <>
      <div style={{
        display:"flex", gap:12, alignItems:"flex-start", width:"100%",
        border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden",
      }}>
        <div style={{ position:"relative", flex:1, minWidth:0 }}>
          {/* Three.js canvas */}
          <div ref={mountRef} style={{ width:"100%", height:420 }} />

          {/* HTML label overlay — each label sits directly above its projected dot */}
          <div
            ref={overlayRef}
            style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}
          >
            {EVENTS.map(e => (
              <div
                key={e.id}
                className="evtlbl"
                onMouseEnter={() => {}}
                style={{
                  position:      "absolute",
                  // Center the label horizontally, place it above the dot
                  transform:     "translate(-50%, calc(-100% - 10px))",
                  background:    e.color,
                  color:         "#fff",
                  fontSize:      9,
                  fontWeight:    "700",
                  padding:       "3px 7px",
                  borderRadius:  3,
                  whiteSpace:    "nowrap",
                  pointerEvents: "none",
                  boxShadow:     "0 1px 5px rgba(0,0,0,0.28)",
                  border:        "1.5px solid rgba(255,255,255,0.4)",
                  transition:    "opacity 0.08s",
                  lineHeight:    "1.5",
                }}
              >
                {e.title}
              </div>
            ))}
          </div>

          <div style={{
            padding:"7px 14px", background:"#f8fafc",
            borderTop:"1px solid #e2e8f0", fontSize:11, color:"#94a3b8",
          }}>
            💡 Drag to rotate · hover dots to see details · labels hide when behind globe
          </div>
        </div>

        <div style={{ padding:"12px 12px 12px 0" }}>
          <Legend hoverId={hoverId} onHover={onHover} />
        </div>
      </div>
      <Tooltip evt={tooltip.evt} pos={tooltip.pos} />
    </>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const WorldHistoryTimelineMap = () => {
  const [viewMode, setViewMode] = useState("2d");
  const [theme,    setTheme]    = useState("Modern");
  const [hoverId,  setHoverId]  = useState(null);

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
        <div style={{ fontSize:16, fontWeight:"bold", color:"#1e293b" }}>World History Timeline Map</div>
        <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>
          12 ancient civilizations · 9600–2500 BCE · hover dots for details
        </div>
      </div>

      <div style={{ display:"flex", gap:10, alignItems:"flex-end", marginTop:12, marginBottom:20, flexWrap:"wrap" }}>
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
        ? <Map2D key={`2d-${theme}`} theme={theme} hoverId={hoverId} onHover={setHoverId} />
        : <Map3D key={`3d-${theme}`} theme={theme} hoverId={hoverId} onHover={setHoverId} />
      }
    </div>
  );
};

export default WorldHistoryTimelineMap;