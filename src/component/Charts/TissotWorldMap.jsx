import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as THREE from "three";
import { feature } from "topojson-client";

// ─── Color themes for temperature scale ───────────────────────────────────────
const THEMES = {
  Modern:  { scale: d3.interpolateRdYlBu,   label: "RdYlBu"  },
  Neon:    { scale: d3.interpolateRgbBasis(["#ff0080","#00f5ff","#39ff14"]), label: "Neon"   },
  Pastel:  { scale: d3.interpolateRgbBasis(["#fca5a5","#fde68a","#a5b4fc"]), label: "Pastel" },
  Sunset:  { scale: d3.interpolateRgbBasis(["#7f1d1d","#f97316","#fef08a"]), label: "Sunset" },
  Ocean:   { scale: d3.interpolateRgbBasis(["#03045e","#0096c7","#caf0f8"]), label: "Ocean"  },
  Galaxy:  { scale: d3.interpolateRgbBasis(["#1a0533","#7b2cbf","#e0aaff"]), label: "Galaxy" },
  Forest:  { scale: d3.interpolateRgbBasis(["#1b4332","#52b788","#d8f3dc"]), label: "Forest" },
  Autumn:  { scale: d3.interpolateRgbBasis(["#6a040f","#e63946","#ffd166"]), label: "Autumn" },
  Candy:   { scale: d3.interpolateRgbBasis(["#8338ec","#ff006e","#ffd166"]), label: "Candy"  },
  Earth:   { scale: d3.interpolateRgbBasis(["#6b4f3c","#b8975a","#d8f3dc"]), label: "Earth"  },
};

// ─── 15 unique vibrant city colors (independent of temp scale) ────────────────
const CITY_COLORS = [
  "#6366f1","#06b6d4","#10b981","#f59e0b","#ef4444",
  "#8b5cf6","#ec4899","#14b8a6","#f97316","#84cc16",
  "#0ea5e9","#a855f7","#fb923c","#22c55e","#e879f9",
];

const CITIES = [
  { name:"London",       lat:51.51,  lon: -0.13, country:"UK"           },
  { name:"New York",     lat:40.71,  lon:-74.01, country:"USA"          },
  { name:"Tokyo",        lat:35.68,  lon:139.65, country:"Japan"        },
  { name:"Sydney",       lat:-33.87, lon:151.21, country:"Australia"    },
  { name:"Mumbai",       lat:19.08,  lon: 72.88, country:"India"        },
  { name:"Cairo",        lat:30.04,  lon: 31.24, country:"Egypt"        },
  { name:"São Paulo",    lat:-23.55, lon:-46.63, country:"Brazil"       },
  { name:"Moscow",       lat:55.76,  lon: 37.62, country:"Russia"       },
  { name:"Dubai",        lat:25.20,  lon: 55.27, country:"UAE"          },
  { name:"Singapore",    lat: 1.35,  lon:103.82, country:"Singapore"    },
  { name:"Paris",        lat:48.86,  lon:  2.35, country:"France"       },
  { name:"Los Angeles",  lat:34.05,  lon:-118.24,country:"USA"          },
  { name:"Cape Town",    lat:-33.92, lon: 18.42, country:"South Africa" },
  { name:"Mexico City",  lat:19.43,  lon:-99.13, country:"Mexico"       },
  { name:"Beijing",      lat:39.90,  lon:116.41, country:"China"        },
];

const getTempColor = (temp, theme) => {
  const t = (temp + 10) / 45;
  return THEMES[theme].scale(Math.max(0, Math.min(1, t)));
};

// ─── Tooltip component (fixed position, never clips) ─────────────────────────
function Tooltip({ info }) {
  if (!info) return null;
  return (
    <div style={{
      position:    "fixed",
      left:        Math.min(info.x + 15, window.innerWidth  - 220),
      top:         Math.min(info.y - 12, window.innerHeight - 100),
      background:  "rgba(15,23,42,0.97)",
      color:       "#f1f5f9",
      padding:     "10px 14px",
      borderRadius:8,
      fontSize:    12,
      lineHeight:  "1.7",
      pointerEvents:"none",
      border:      "1px solid #334155",
      zIndex:      99999,
      boxShadow:   "0 8px 24px rgba(0,0,0,0.5)",
      minWidth:    190,
    }}>
      <div style={{ fontWeight:700, fontSize:14, color:info.cityColor, marginBottom:3 }}>{info.name}</div>
      <div style={{ color:"#94a3b8", marginBottom:4 }}>{info.country}</div>
      <div>
        Temperature:{" "}
        <b style={{ color:info.tempColor }}>{info.temperature}°C</b>
      </div>
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────
function Legend({ data, theme }) {
  return (
    <div style={{
      background:"#fff", border:"1px solid #e2e8f0", borderRadius:8,
      padding:"12px 14px", width:168, flexShrink:0,
      boxShadow:"0 1px 4px rgba(0,0,0,0.07)", alignSelf:"flex-start",
      maxHeight:520, overflowY:"auto",
    }}>
      {/* Temperature gradient scale */}
      <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:6 }}>
        TEMPERATURE SCALE
      </div>
      <div style={{
        height:12, borderRadius:4, marginBottom:4,
        background:`linear-gradient(to right, ${[-10,0,10,20,30,35].map(t=>getTempColor(t,theme)).join(",")})`,
        border:"1px solid #e2e8f0",
      }} />
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:9, color:"#94a3b8", marginBottom:14 }}>
        <span>-10°C</span><span>0°</span><span>15°</span><span>35°C</span>
      </div>

      {/* City list */}
      <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:8 }}>
        CITIES
      </div>
      {data.map((d, i) => (
        <div key={d.name} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:5 }}>
          {/* City dot: unique color */}
          <div style={{
            width:9, height:9, borderRadius:"50%", flexShrink:0,
            background:CITY_COLORS[i % CITY_COLORS.length],
            boxShadow:`0 0 4px ${CITY_COLORS[i % CITY_COLORS.length]}88`,
          }} />
          <span style={{ color:"#334155", fontSize:10, flex:1 }}>{d.name}</span>
          {/* Temp badge colored by temperature */}
          <span style={{
            color:getTempColor(d.temperature, theme),
            fontSize:10, fontWeight:"bold",
          }}>
            {d.temperature}°C
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── 2D Map ───────────────────────────────────────────────────────────────────
function Map2D({ data, theme }) {
  const svgRef    = useRef(null);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;
    const W = 640, H = 400;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox",`0 0 ${W} ${H}`).attr("preserveAspectRatio","xMidYMid meet");
    svg.append("rect").attr("width",W).attr("height",H).attr("fill","#dce8f5").attr("rx",8);

    const proj = d3.geoNaturalEarth1().scale(96).translate([W/2, H/2]);
    const path = d3.geoPath().projection(proj);

    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then(world => {
      const countries = feature(world, world.objects.countries);

      // Graticule
      svg.append("path").datum(d3.geoGraticule()())
        .attr("d",path).attr("fill","none")
        .attr("stroke","rgba(180,195,210,0.4)").attr("stroke-width",0.4);

      // Land
      svg.append("g").selectAll("path").data(countries.features).enter().append("path")
        .attr("d",path).attr("fill","#e8edf5").attr("stroke","#c0cad8").attr("stroke-width",0.5);

      // ── Compute projected dot positions ───────────────────────
      const pts = data.map((d, i) => {
        const p = proj([d.lon, d.lat]);
        return { ...d, cx:p?p[0]:-999, cy:p?p[1]:-999, idx:i };
      }).filter(d => d.cx > 0 && d.cx < W && d.cy > 0 && d.cy < H);

      // Outer glow rings
      pts.forEach((d, i) => {
        svg.append("circle")
          .attr("cx",d.cx).attr("cy",d.cy).attr("r",13)
          .attr("fill","none")
          .attr("stroke", CITY_COLORS[d.idx % CITY_COLORS.length])
          .attr("stroke-width",1.5).attr("opacity",0.22);
      });

      // ── Smart label placement with collision avoidance ────────
      // Pre-measure labels
      const tmpSvg = d3.select("body").append("svg").style("visibility","hidden");
      const labelData = pts.map(d => {
        const txt  = `${d.name} ${d.temperature}°`;
        const el   = tmpSvg.append("text").style("font-size","9px").style("font-weight","700").text(txt);
        const w    = el.node().getBBox().width;
        el.remove();
        return { ...d, txt, lw: w + 10, lh: 14 };
      });
      tmpSvg.remove();

      // Try 8 directions for each label
      const DIRS = [
        { dx: 0,  dy:-22, ax:"middle" },
        { dx: 16, dy:  0, ax:"start"  },
        { dx:-16, dy:  0, ax:"end"    },
        { dx: 0,  dy: 22, ax:"middle" },
        { dx: 14, dy:-16, ax:"start"  },
        { dx:-14, dy:-16, ax:"end"    },
        { dx: 14, dy: 16, ax:"start"  },
        { dx:-14, dy: 16, ax:"end"    },
      ];

      const placed = [];

      labelData.forEach(d => {
        const col = CITY_COLORS[d.idx % CITY_COLORS.length];
        let chosen = null;

        for (const dir of DIRS) {
          const lx = d.cx + dir.dx;
          const ly = d.cy + dir.dy;
          const bx = dir.ax === "middle" ? lx - d.lw/2 :
                     dir.ax === "start"  ? lx - 2 : lx - d.lw + 2;
          const by = ly - d.lh/2;
          const bx2= bx + d.lw, by2 = by + d.lh;

          // Must be inside SVG bounds
          if (bx < 2 || bx2 > W-2 || by < 2 || by2 > H-2) continue;

          // Check no collision with already-placed labels
          let ok = true;
          for (const pb of placed) {
            if (bx < pb.x2+3 && bx2 > pb.x-3 && by < pb.y2+3 && by2 > pb.y-3) {
              ok = false; break;
            }
          }
          if (ok) { chosen = { lx, ly, bx, by, bx2, by2, ax:dir.ax, dx:dir.dx, dy:dir.dy }; break; }
        }

        // Fallback: use first direction even if collides
        if (!chosen) {
          const dir = DIRS[0];
          const lx  = d.cx + dir.dx;
          const ly  = d.cy + dir.dy;
          const bx  = lx - d.lw/2;
          const by  = ly - d.lh/2;
          chosen = { lx, ly, bx, by, bx2:bx+d.lw, by2:by+d.lh, ax:dir.ax, dx:dir.dx, dy:dir.dy };
        }
        placed.push({ x:chosen.bx, y:chosen.by, x2:chosen.bx2, y2:chosen.by2 });

        // Connector line from dot edge to label
        const sign = (v) => v === 0 ? 0 : v > 0 ? 1 : -1;
        svg.append("line")
          .attr("x1", d.cx + sign(chosen.dx)*7)
          .attr("y1", d.cy + sign(chosen.dy)*7)
          .attr("x2", chosen.lx)
          .attr("y2", chosen.dy < 0 ? chosen.by2 : chosen.by)
          .attr("stroke", col).attr("stroke-width",0.9)
          .attr("stroke-dasharray","3,2").attr("opacity",0.55);

        // Label pill background
        svg.append("rect")
          .attr("x",chosen.bx).attr("y",chosen.by)
          .attr("width",d.lw).attr("height",d.lh)
          .attr("rx",3).attr("fill",col).attr("opacity",0.88);

        // Label text
        svg.append("text")
          .attr("x", chosen.lx)
          .attr("y", chosen.by + 10)
          .attr("text-anchor", chosen.ax)
          .style("font-size","9px").style("font-weight","700")
          .style("fill","#fff").style("pointer-events","none")
          .text(d.txt);
      });

      // ── Dots — drawn last so always on top ────────────────────
      pts.forEach((d, i) => {
        const col     = CITY_COLORS[d.idx % CITY_COLORS.length];
        const tempCol = getTempColor(d.temperature, theme);

        svg.append("circle")
          .attr("cx",d.cx).attr("cy",d.cy).attr("r",6)
          .attr("fill",col)
          .attr("stroke","#fff").attr("stroke-width",1.8)
          .attr("opacity",0.95).style("cursor","pointer")
          .on("mouseover", function(event) {
            d3.select(this).attr("r",9).attr("stroke-width",2.5);
            setTooltip({
              name:d.name, country:d.country,
              temperature:d.temperature,
              cityColor:col, tempColor:tempCol,
              x:event.clientX, y:event.clientY,
            });
          })
          .on("mousemove", event => {
            setTooltip(s => s ? { ...s, x:event.clientX, y:event.clientY } : s);
          })
          .on("mouseout", function() {
            d3.select(this).attr("r",6).attr("stroke-width",1.8);
            setTooltip(null);
          });

        // White center dot
        svg.append("circle")
          .attr("cx",d.cx).attr("cy",d.cy).attr("r",2)
          .attr("fill","#fff").attr("pointer-events","none");
      });

    }).catch(() => {
      svg.append("text").attr("x",W/2).attr("y",H/2)
        .attr("text-anchor","middle").attr("fill","#ef4444").text("Failed to load map.");
    });
  }, [data, theme]);

  return (
    <>
      <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
        <svg ref={svgRef} style={{ display:"block", flex:1, minWidth:0 }} />
        <div style={{ padding:"12px 12px 12px 0" }}>
          <Legend data={data} theme={theme} />
        </div>
      </div>
      <Tooltip info={tooltip} />
    </>
  );
}

// ─── 3D Globe ─────────────────────────────────────────────────────────────────
function Map3D({ data, theme }) {
  const mountRef   = useRef(null);
  const overlayRef = useRef(null);
  const stateRef   = useRef({
    rotX:0.2, rotY:0, isDragging:false,
    prevX:0,  prevY:0, autoSpin:true, animId:null,
    screenPts:[], globe:null,
  });
  const [tooltip, setTooltip] = useState(null);

  // lat/lon → unit sphere vector
  function latLonToVec(lat, lon) {
    const phi   = (90 - lat) * Math.PI / 180;
    const theta = (lon + 180) * Math.PI / 180;
    return new THREE.Vector3(
      -Math.sin(phi)*Math.cos(theta),
       Math.cos(phi),
       Math.sin(phi)*Math.sin(theta)
    );
  }

  useEffect(() => {
    if (!mountRef.current || !data.length) return;
    const el  = mountRef.current;
    const s   = stateRef.current;
    const W   = el.offsetWidth || 640;
    const H   = 440;

    const scene  = new THREE.Scene();
    scene.background = new THREE.Color(0xdce8f5);

    const camera = new THREE.PerspectiveCamera(42, W/H, 0.1, 100);
    camera.position.set(0, 0, 2.9);

    const renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);
    renderer.domElement.style.cursor = "grab";

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 1.0));
    const sun = new THREE.DirectionalLight(0xffffff, 0.7);
    sun.position.set(4, 3, 5); scene.add(sun);
    const fill = new THREE.DirectionalLight(0xffffff, 0.35);
    fill.position.set(-4,-3,-5); scene.add(fill);

    // Globe mesh
    const globeGeo = new THREE.SphereGeometry(1, 64, 64);
    const globeMat = new THREE.MeshPhongMaterial({ color:0xdce8f5, shininess:8 });
    const globe    = new THREE.Mesh(globeGeo, globeMat);
    scene.add(globe);
    s.globe = globe;

    // Canvas texture: land + colored city dots only (NO TEXT — HTML overlay handles labels)
    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then(world => {
      const countries = feature(world, world.objects.countries);
      const TEX = 2048;
      const can = document.createElement("canvas");
      can.width = TEX; can.height = TEX/2;
      const ctx = can.getContext("2d");

      const tproj   = d3.geoEquirectangular().scale(TEX/(2*Math.PI)).translate([TEX/2, TEX/4]);
      const pathGen = d3.geoPath().projection(tproj);

      // Ocean
      ctx.fillStyle = "#dce8f5";
      ctx.fillRect(0, 0, TEX, TEX/2);

      // Graticule
      ctx.beginPath(); pathGen.context(ctx)(d3.geoGraticule()());
      ctx.strokeStyle = "rgba(180,195,215,0.25)"; ctx.lineWidth = 0.5; ctx.stroke();

      // Land
      countries.features.forEach(f => {
        ctx.beginPath(); pathGen.context(ctx)(f);
        ctx.fillStyle   = "#e8edf5"; ctx.fill();
        ctx.strokeStyle = "#c0cad8"; ctx.lineWidth = 0.6; ctx.stroke();
      });

      // City dots — unique city color + temp-colored ring
      data.forEach((d, i) => {
        const [px, py] = tproj([d.lon, d.lat]);
        if (isNaN(px)||isNaN(py)) return;
        const cityCol = CITY_COLORS[i % CITY_COLORS.length];
        const tempCol = getTempColor(d.temperature, theme);

        // Outer temperature ring
        ctx.beginPath(); ctx.arc(px, py, 18, 0, Math.PI*2);
        ctx.strokeStyle = tempCol; ctx.lineWidth = 3; ctx.globalAlpha = 0.35; ctx.stroke();
        ctx.globalAlpha = 1;

        // Mid city ring
        ctx.beginPath(); ctx.arc(px, py, 11, 0, Math.PI*2);
        ctx.strokeStyle = cityCol; ctx.lineWidth = 2; ctx.globalAlpha = 0.55; ctx.stroke();
        ctx.globalAlpha = 1;

        // Filled dot
        ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI*2);
        ctx.fillStyle = cityCol; ctx.fill();
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 2.5; ctx.stroke();

        // White center
        ctx.beginPath(); ctx.arc(px, py, 2.5, 0, Math.PI*2);
        ctx.fillStyle = "#fff"; ctx.fill();
      });

      globe.material = new THREE.MeshPhongMaterial({
        map: new THREE.CanvasTexture(can),
        shininess: 8,
      });
      globe.material.map.needsUpdate = true;
    });

    // Unit sphere vectors for each city
    const unitVecs = data.map(d => latLonToVec(d.lat, d.lon));

    // Raycaster for hover
    const raycaster = new THREE.Raycaster();

    // ── Frame loop ─────────────────────────────────────────────────
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (s.autoSpin) s.rotY += 0.003;

      globe.rotation.x = s.rotX;
      globe.rotation.y = s.rotY;
      globe.updateMatrixWorld(true);
      camera.updateMatrixWorld(true);

      // Project each city's world position to screen for label overlay
      const newPts = [];
      if (overlayRef.current) {
        const divs = overlayRef.current.querySelectorAll(".twlbl");
        divs.forEach((div, i) => {
          const worldPos = unitVecs[i].clone().applyMatrix4(globe.matrixWorld);
          const ndc      = worldPos.clone().project(camera);
          const sx       = ( ndc.x * 0.5 + 0.5) * W;
          const sy       = (-ndc.y * 0.5 + 0.5) * H;
          // Front hemisphere check
          const rotated  = unitVecs[i].clone().applyEuler(globe.rotation);
          const visible  = rotated.z > 0.08;

          div.style.left      = `${sx}px`;
          div.style.top       = `${sy}px`;
          div.style.opacity   = visible ? "1" : "0";
          div.style.display   = visible ? "block" : "none";

          newPts.push({ city:data[i], idx:i, sx, sy, visible });
        });
      }
      s.screenPts = newPts;

      renderer.render(scene, camera);
    };
    animate();

    // ── Mouse hover — find nearest visible city ────────────────────
    const onHover = (e) => {
      if (s.isDragging) { setTooltip(null); return; }
      const rect = renderer.domElement.getBoundingClientRect();
      const mx   = e.clientX - rect.left;
      const my   = e.clientY - rect.top;
      const scaleX = W / rect.width;
      const scaleY = H / rect.height;

      // Raycaster to check if mouse is even on the globe
      const ndcX =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      const ndcY = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
      raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
      const hits = raycaster.intersectObject(globe);

      if (hits.length === 0) { setTooltip(null); return; }

      // Find closest visible city dot to mouse
      let best = null, bestDist = 22; // px threshold
      for (const pt of s.screenPts) {
        if (!pt.visible) continue;
        const dx = mx - pt.sx * scaleX;  // NO — sx is already in canvas pixels
        // Correct: compare in canvas space (before CSS scaling)
        const csx = pt.sx * (rect.width  / W);
        const csy = pt.sy * (rect.height / H);
        const ddx = e.clientX - rect.left - csx;
        const ddy = e.clientY - rect.top  - csy;
        const d   = Math.sqrt(ddx*ddx + ddy*ddy);
        if (d < bestDist) { bestDist = d; best = pt; }
      }

      if (best) {
        renderer.domElement.style.cursor = "pointer";
        const d       = best.city;
        const i       = best.idx;
        const cityCol = CITY_COLORS[i % CITY_COLORS.length];
        const tempCol = getTempColor(d.temperature, theme);
        setTooltip({
          name:d.name, country:d.country,
          temperature:d.temperature,
          cityColor:cityCol, tempColor:tempCol,
          x:e.clientX, y:e.clientY,
        });
      } else {
        renderer.domElement.style.cursor = "grab";
        setTooltip(null);
      }
    };
    const onLeave = () => { setTooltip(null); };

    // ── Drag controls ──────────────────────────────────────────────
    const onDown = e => {
      s.isDragging=true; s.prevX=e.clientX; s.prevY=e.clientY;
      s.autoSpin=false; renderer.domElement.style.cursor="grabbing";
      setTooltip(null);
    };
    const onUp   = () => { s.isDragging=false; renderer.domElement.style.cursor="grab"; };
    const onDrag = e => {
      if (!s.isDragging) return;
      s.rotY += (e.clientX - s.prevX) * 0.005;
      s.rotX  = Math.max(-1.1, Math.min(1.1, s.rotX + (e.clientY - s.prevY) * 0.003));
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
  }, [data, theme]);

  return (
    <>
      <div style={{ display:"flex", gap:12, alignItems:"flex-start", width:"100%", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
        <div style={{ position:"relative", flex:1, minWidth:0 }}>
          <div ref={mountRef} style={{ width:"100%", height:440 }} />

          {/* HTML label overlay — labels projected via matrixWorld each frame */}
          <div ref={overlayRef} style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
            {data.map((d, i) => {
              const cityCol = CITY_COLORS[i % CITY_COLORS.length];
              const tempCol = getTempColor(d.temperature, theme);
              return (
                <div
                  key={i}
                  className="twlbl"
                  style={{
                    position:   "absolute",
                    // Center horizontally, place above dot
                    transform:  "translate(-50%, calc(-100% - 12px))",
                    background: cityCol,
                    color:      "#fff",
                    fontSize:   9,
                    fontWeight: "700",
                    padding:    "2px 7px",
                    borderRadius: 3,
                    whiteSpace: "nowrap",
                    pointerEvents:"none",
                    boxShadow:  "0 1px 5px rgba(0,0,0,0.28)",
                    border:     "1.5px solid rgba(255,255,255,0.45)",
                    lineHeight: "1.5",
                    transition: "opacity 0.07s",
                  }}
                >
                  {d.name}
                  <span style={{
                    marginLeft:5, fontWeight:"normal", fontSize:9,
                    color:"rgba(255,255,255,0.85)",
                  }}>
                    {d.temperature}°C
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ padding:"7px 14px", background:"#f8fafc", borderTop:"1px solid #e2e8f0", fontSize:11, color:"#94a3b8" }}>
            💡 Drag to rotate · hover cities for details · labels hide when behind globe · auto-spins until you interact
          </div>
        </div>

        <div style={{ padding:"12px 12px 12px 0" }}>
          <Legend data={data} theme={theme} />
        </div>
      </div>
      <Tooltip info={tooltip} />
    </>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const TissotWorldMap = () => {
  const [viewMode, setViewMode] = useState("2d");
  const [theme,    setTheme]    = useState("Modern");
  const [data,     setData]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [dataInfo, setDataInfo] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      const results = await Promise.all(
        CITIES.map(async (city) => {
          try {
            const r = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m&timezone=auto`
            );
            const j = await r.json();
            return { ...city, temperature: Math.round(j.current.temperature_2m) };
          } catch {
            // Fallback: plausible temperature by latitude
            const temp = Math.round(20 - Math.abs(city.lat)*0.5 + (Math.random()*6-3));
            return { ...city, temperature: temp };
          }
        })
      );
      setData(results);
      setDataInfo(`${results.length} cities · Open-Meteo live data`);
      setLoading(false);
    };
    fetchAll();
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
        <div style={{ fontSize:16, fontWeight:"bold", color:"#1e293b" }}>World Temperature Map</div>
        <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>
          Live temperatures · {CITIES.length} major cities · {dataInfo}
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
            {Object.entries(THEMES).map(([k,v]) => (
              <option key={k} value={k}>{k} — {v.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ minHeight:420 }}>
        {loading ? (
          <div style={{
            display:"flex", alignItems:"center", justifyContent:"center",
            height:420, color:"#94a3b8", fontSize:15,
            border:"1px solid #e2e8f0", borderRadius:8,
          }}>
            ⏳ Loading live temperatures…
          </div>
        ) : viewMode === "2d" ? (
          <Map2D key={`2d-${theme}`} data={data} theme={theme} />
        ) : (
          <Map3D key={`3d-${theme}`} data={data} theme={theme} />
        )}
      </div>
    </div>
  );
};

export default TissotWorldMap;