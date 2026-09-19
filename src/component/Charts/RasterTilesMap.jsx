import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as THREE from "three";

// ─── Themes ───────────────────────────────────────────────────────────────────
const THEMES = {
  Modern:  { major:"#6366f1", minor:"#06b6d4",  pillar:"#6366f1", bg:0xf0f4f8 },
  Neon:    { major:"#ff0080", minor:"#00f5ff",  pillar:"#ff0080", bg:0x0a0a1a },
  Pastel:  { major:"#f9a8d4", minor:"#a5b4fc",  pillar:"#f9a8d4", bg:0xfdf4ff },
  Sunset:  { major:"#ef4444", minor:"#f97316",  pillar:"#ef4444", bg:0xfff7ed },
  Ocean:   { major:"#0077b6", minor:"#48cae4",  pillar:"#0077b6", bg:0xe8f4f8 },
  Galaxy:  { major:"#c77dff", minor:"#9d4edd",  pillar:"#c77dff", bg:0x0d0d1a },
  Forest:  { major:"#2d6a4f", minor:"#74c69d",  pillar:"#2d6a4f", bg:0xf0fdf4 },
  Autumn:  { major:"#e63946", minor:"#f59e0b",  pillar:"#e63946", bg:0xfef9c3 },
  Candy:   { major:"#ff006e", minor:"#8338ec",  pillar:"#ff006e", bg:0xfdf0ff },
  Earth:   { major:"#92400e", minor:"#78350f",  pillar:"#92400e", bg:0xfef3c7 },
};

// ─── Dataset: Major World Cities ───────────────────────────────────────────────
const CITIES = [
  { name:"Tokyo",       lat:35.689, lon:139.692, pop:13960, major:true  },
  { name:"Delhi",       lat:28.613, lon:77.209,  pop:32226, major:true  },
  { name:"Shanghai",    lat:31.228, lon:121.474, pop:24281, major:true  },
  { name:"São Paulo",   lat:-23.55, lon:-46.633, pop:12325, major:true  },
  { name:"Mexico City", lat:19.433, lon:-99.133, pop:9209,  major:true  },
  { name:"Cairo",       lat:30.033, lon:31.233,  pop:10078, major:true  },
  { name:"Mumbai",      lat:19.076, lon:72.878,  pop:20667, major:true  },
  { name:"Beijing",     lat:39.905, lon:116.391, pop:21893, major:true  },
  { name:"Dhaka",       lat:23.811, lon:90.412,  pop:22478, major:true  },
  { name:"Osaka",       lat:34.694, lon:135.502, pop:2691,  major:false },
  { name:"New York",    lat:40.713, lon:-74.006, pop:8336,  major:true  },
  { name:"Karachi",     lat:24.861, lon:67.011,  pop:16093, major:false },
  { name:"Chongqing",   lat:29.563, lon:106.551, pop:9000,  major:false },
  { name:"Istanbul",    lat:41.015, lon:28.978,  pop:15462, major:true  },
  { name:"Kinshasa",    lat:-4.322, lon:15.322,  pop:17071, major:false },
  { name:"Lagos",       lat:6.524,  lon:3.379,   pop:14862, major:true  },
  { name:"Buenos Aires",lat:-34.61, lon:-58.388, pop:3054,  major:false },
  { name:"Kolkata",     lat:22.563, lon:88.363,  pop:14850, major:false },
  { name:"Manila",      lat:14.600, lon:120.984, pop:13923, major:false },
  { name:"Tianjin",     lat:39.125, lon:117.19,  pop:9000,  major:false },
  { name:"Guangzhou",   lat:23.128, lon:113.259, pop:13964, major:false },
  { name:"Rio de Jan.", lat:-22.91, lon:-43.173, pop:6748,  major:false },
  { name:"Lahore",      lat:31.558, lon:74.352,  pop:13001, major:false },
  { name:"Bangalore",   lat:12.972, lon:77.594,  pop:12765, major:false },
  { name:"Shenzhen",    lat:22.543, lon:114.058, pop:12831, major:false },
  { name:"Moscow",      lat:55.751, lon:37.617,  pop:12506, major:true  },
  { name:"Chennai",     lat:13.083, lon:80.270,  pop:11324, major:false },
  { name:"Bogotá",      lat:4.711,  lon:-74.073, pop:7413,  major:false },
  { name:"Paris",       lat:48.857, lon:2.352,   pop:2161,  major:true  },
  { name:"Jakarta",     lat:-6.208, lon:106.846, pop:10770, major:true  },
];

// ─── Map bounds (world) ───────────────────────────────────────────────────────
const LAT_MIN = -60, LAT_MAX = 75;
const LON_MIN = -180, LON_MAX = 180;
const PLANE_W = 20, PLANE_H = 11;

const toPlaneX = (lon) => ((lon - LON_MIN) / (LON_MAX - LON_MIN) - 0.5) * PLANE_W;
const toPlaneZ = (lat) => -((lat - LAT_MIN) / (LAT_MAX - LAT_MIN) - 0.5) * PLANE_H;

// Population → pillar height
const popToHeight = (pop) => 0.4 + (pop / 33000) * 3.5;

// ─── OSM Canvas Texture (for 3D) ─────────────────────────────────────────────
function buildMapCanvas(theme) {
  const t = THEMES[theme];
  const W = 2048, H = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Sky/ocean background
  ctx.fillStyle = "#a8d5e8";
  ctx.fillRect(0, 0, W, H);

  // Land — simple world fill (green)
  ctx.fillStyle = "#c8deb5";
  ctx.fillRect(0, 0, W, H);

  // Subtle longitude/latitude grid
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 0.6;
  for (let i = 0; i <= 24; i++) {
    const x = (i / 24) * W;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let i = 0; i <= 12; i++) {
    const y = (i / 12) * H;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Equator
  ctx.strokeStyle = "rgba(100,140,80,0.5)";
  ctx.lineWidth = 1.5;
  const eqY = (1 - (-LAT_MIN) / (LAT_MAX - LAT_MIN)) * H;
  ctx.beginPath(); ctx.moveTo(0, eqY); ctx.lineTo(W, eqY); ctx.stroke();

  // Watermark label
  ctx.font = "bold 52px sans-serif";
  ctx.fillStyle = "rgba(60,100,40,0.12)";
  ctx.textAlign = "center";
  ctx.fillText("WORLD CITIES", W / 2, H / 2 + 18);

  const toCanvasX = (lon) => ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * W;
  const toCanvasY = (lat) => (1 - (lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * H;

  // Draw city dots on texture
  CITIES.forEach(city => {
    const cx = toCanvasX(city.lon);
    const cy = toCanvasY(city.lat);
    const col = city.major ? t.major : t.minor;
    const r   = city.major ? 11 : 7;

    ctx.beginPath(); ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
    ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.globalAlpha = 0.28; ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = col; ctx.fill();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 2.5; ctx.stroke();

    ctx.font = city.major ? "bold 14px sans-serif" : "11px sans-serif";
    ctx.textAlign = "left";
    ctx.strokeStyle = "rgba(255,255,255,0.92)";
    ctx.lineWidth = 3.5;
    ctx.strokeText(city.name, cx + r + 4, cy + 5);
    ctx.fillStyle = "#1e293b";
    ctx.fillText(city.name, cx + r + 4, cy + 5);
  });

  return canvas;
}

// ─── Legend ───────────────────────────────────────────────────────────────────
function LegendHTML({ theme }) {
  const t     = THEMES[theme];
  const major = CITIES.filter(c => c.major);
  const minor = CITIES.filter(c => !c.major);

  return (
    <div style={{
      background:"#fff", border:"1px solid #e2e8f0", borderRadius:8,
      padding:"12px 14px", width:155, flexShrink:0,
      boxShadow:"0 1px 4px rgba(0,0,0,0.07)", alignSelf:"flex-start",
      maxHeight:480, overflowY:"auto",
    }}>
      <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:8 }}>
        MAJOR CITIES
      </div>
      {major.map(c => (
        <div key={c.name} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:5 }}>
          <div style={{ width:9, height:9, borderRadius:"50%", flexShrink:0,
            background:t.major, boxShadow:`0 0 4px ${t.major}` }} />
          <span style={{ color:"#334155", fontSize:10, fontWeight:"700", flex:1 }}>{c.name}</span>
          <span style={{ color:"#94a3b8", fontSize:9 }}>{(c.pop/1000).toFixed(1)}M</span>
        </div>
      ))}
      <div style={{ borderTop:"1px solid #e2e8f0", margin:"8px 0" }} />
      <div style={{ fontSize:10, fontWeight:"bold", color:"#94a3b8", letterSpacing:"0.08em", marginBottom:8 }}>
        OTHER CITIES
      </div>
      {minor.map(c => (
        <div key={c.name} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:4 }}>
          <div style={{ width:7, height:7, borderRadius:"50%", flexShrink:0, background:t.minor }} />
          <span style={{ color:"#64748b", fontSize:9, flex:1 }}>{c.name}</span>
          <span style={{ color:"#94a3b8", fontSize:9 }}>{(c.pop/1000).toFixed(1)}M</span>
        </div>
      ))}
      <div style={{ borderTop:"1px solid #e2e8f0", marginTop:8, paddingTop:8 }}>
        <div style={{ fontSize:9, color:"#94a3b8", lineHeight:1.5 }}>
          World Cities<br/>{CITIES.length} cities · Pop in thousands<br/>
          <span style={{ color:t.major }}>● Major</span>
          {" · "}
          <span style={{ color:t.minor }}>● Other</span>
        </div>
      </div>
    </div>
  );
}

// ─── 2D Map ───────────────────────────────────────────────────────────────────
function Map2D({ theme }) {
  const svgRef = useRef(null);
  const t = THEMES[theme];

  useEffect(() => {
    if (!svgRef.current) return;
    const W = 600, H = 400;

    // Mercator center on world
    const zoom = 2;
    const lat0 = 20, lon0 = 15;
    const n = Math.pow(2, zoom);
    const tileSize = 256;

    // Center tile coordinates
    const xTCenter = ((lon0 + 180) / 360) * n;
    const yTCenter = (1 - Math.log(Math.tan(lat0 * Math.PI / 180) + 1 / Math.cos(lat0 * Math.PI / 180)) / Math.PI) / 2 * n;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${W} ${H}`).attr("preserveAspectRatio", "xMidYMid meet");
    svg.append("rect").attr("width", W).attr("height", H).attr("fill", "#e8f4f8").attr("rx", 8);

    // Clip group
    const defs = svg.append("defs");
    defs.append("clipPath").attr("id", "map2d-clip")
      .append("rect").attr("width", W).attr("height", H).attr("rx", 8);
    const g = svg.append("g").attr("clip-path", "url(#map2d-clip)");

    // Load OSM tiles
    for (let dx = -3; dx <= 3; dx++) {
      for (let dy = -3; dy <= 3; dy++) {
        const tx  = Math.floor(xTCenter) + dx;
        const ty  = Math.floor(yTCenter) + dy;
        // Clamp valid tile range
        if (tx < 0 || tx >= n || ty < 0 || ty >= n) continue;
        const sub = ["a", "b", "c"][Math.abs(tx + ty) % 3];
        const px  = W / 2 + (tx - xTCenter) * tileSize;
        const py  = H / 2 + (ty - yTCenter) * tileSize;
        const img = g.append("image")
          .attr("href", `https://${sub}.tile.openstreetmap.org/${zoom}/${tx}/${ty}.png`)
          .attr("x", px).attr("y", py)
          .attr("width", tileSize).attr("height", tileSize)
          .attr("opacity", 0);
        img.on("load",  function () { d3.select(this).attr("opacity", 1); });
        img.on("error", function () {
          // Fallback: try without subdomain
          d3.select(this).attr("href", `https://tile.openstreetmap.org/${zoom}/${tx}/${ty}.png`);
        });
      }
    }

    // Projection function: lat/lon → SVG pixel
    const project = (lat, lon) => {
      const sinLat = Math.sin(lat * Math.PI / 180);
      const xT = ((lon + 180) / 360) * n;
      const yT = (1 - Math.log((1 + sinLat) / (1 - sinLat)) / (2 * Math.PI)) / 2 * n;
      return {
        x: W / 2 + (xT - xTCenter) * tileSize,
        y: H / 2 + (yT - yTCenter) * tileSize,
      };
    };

    // Tooltip
    const tooltip = d3.select("body").append("div")
      .style("position", "absolute")
      .style("background", "rgba(15,23,42,0.95)")
      .style("color", "#fff")
      .style("padding", "8px 12px")
      .style("border-radius", "7px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("border", "1px solid #334155")
      .style("z-index", "9999")
      .style("box-shadow", "0 4px 16px rgba(0,0,0,0.4)")
      .style("min-width", "160px");

    // Draw cities
    CITIES.forEach(city => {
      const p   = project(city.lat, city.lon);
      if (p.x < -30 || p.x > W + 30 || p.y < -30 || p.y > H + 30) return;

      const r   = city.major ? 7 : 4.5;
      const col = city.major ? t.major : t.minor;

      // Pulse ring for major
      if (city.major) {
        g.append("circle")
          .attr("cx", p.x).attr("cy", p.y).attr("r", r + 6)
          .attr("fill", "none").attr("stroke", col)
          .attr("stroke-width", 1.5).attr("opacity", 0.3);
      }

      // City dot
      g.append("circle")
        .attr("cx", p.x).attr("cy", p.y).attr("r", r)
        .attr("fill", col).attr("stroke", "#fff").attr("stroke-width", 1.5)
        .attr("opacity", 0.92).style("cursor", "pointer")
        .on("mouseover", function (event) {
          d3.select(this).attr("r", r * 1.5).attr("opacity", 1);
          tooltip.style("opacity", 1)
            .html(
              `<b style="color:${col};font-size:13px">${city.name}</b><br/>` +
              `<span style="color:#94a3b8">Population:</span> <b>${(city.pop).toLocaleString()}k</b><br/>` +
              `<span style="color:#94a3b8">Lat/Lon:</span> ${city.lat.toFixed(2)}°, ${city.lon.toFixed(2)}°`
            )
            .style("left", (event.pageX + 14) + "px")
            .style("top",  (event.pageY - 12) + "px");
        })
        .on("mousemove", function (event) {
          tooltip.style("left", (event.pageX + 14) + "px").style("top", (event.pageY - 12) + "px");
        })
        .on("mouseout", function () {
          d3.select(this).attr("r", r).attr("opacity", 0.92);
          tooltip.style("opacity", 0);
        });

      // Always-visible city label with text stroke for readability
      const lbl = g.append("text")
        .attr("x", p.x + r + 3)
        .attr("y", p.y + 4)
        .style("font-size",   city.major ? "10px" : "8px")
        .style("font-weight", city.major ? "700"  : "500")
        .style("fill",        "#1e293b")
        .style("stroke",      "rgba(255,255,255,0.92)")
        .style("stroke-width","2.8px")
        .style("paint-order", "stroke")
        .style("pointer-events", "none")
        .text(city.name);
    });

    return () => tooltip.remove();
  }, [theme]);

  return (
    <div style={{
      display:"flex", gap:12, alignItems:"flex-start", width:"100%",
      border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden",
    }}>
      <svg ref={svgRef} style={{ display:"block", flex:1, minWidth:0, height:400 }} />
      <div style={{ padding:"12px 12px 12px 0" }}>
        <LegendHTML theme={theme} />
      </div>
    </div>
  );
}

// ─── 3D Map ───────────────────────────────────────────────────────────────────
function Map3D({ theme }) {
  const mountRef   = useRef(null);
  const overlayRef = useRef(null);
  const t = THEMES[theme];

  useEffect(() => {
    if (!mountRef.current) return;
    const el = mountRef.current;
    const W  = el.offsetWidth || 680;
    const H  = 460;

    // ── Scene setup ────────────────────────────────────────────────
    const scene    = new THREE.Scene();
    scene.background = new THREE.Color(t.bg);

    const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 200);
    camera.position.set(0, 9, 15);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);
    renderer.domElement.style.cursor = "grab";

    // ── Lights ────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(8, 14, 10);
    sun.castShadow = true;
    sun.shadow.camera.near = 0.1;
    sun.shadow.camera.far  = 100;
    sun.shadow.camera.left = sun.shadow.camera.bottom = -20;
    sun.shadow.camera.right = sun.shadow.camera.top   =  20;
    sun.shadow.mapSize.set(2048, 2048);
    scene.add(sun);
    scene.add(new THREE.HemisphereLight(0xddeeff, 0xc8deb5, 0.5));

    // ── Master group (map plane + pillars rotate together) ─────────
    const master = new THREE.Group();
    scene.add(master);

    // ── Map plane with OSM canvas texture ─────────────────────────
    const mapCanvas  = buildMapCanvas(theme);
    const mapTexture = new THREE.CanvasTexture(mapCanvas);
    mapTexture.needsUpdate = true;

    const planeMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(PLANE_W, PLANE_H, 1, 1),
      new THREE.MeshStandardMaterial({
        map:       mapTexture,
        roughness: 0.65,
        metalness: 0.04,
      })
    );
    planeMesh.rotation.x  = -Math.PI / 2;
    planeMesh.position.y  = 0;
    planeMesh.receiveShadow = true;
    master.add(planeMesh);

    // Map border
    const frame = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(PLANE_W, 0.02, PLANE_H)),
      new THREE.LineBasicMaterial({ color: 0x94a3b8, linewidth: 1 })
    );
    frame.position.y = 0.01;
    master.add(frame);

    // ── City pillars ───────────────────────────────────────────────
    // Store world-space label positions BEFORE rotation
    const labelLocalPositions = [];

    CITIES.forEach(city => {
      const lx  = toPlaneX(city.lon);
      const lz  = toPlaneZ(city.lat);
      const bh  = popToHeight(city.pop);
      const col = new THREE.Color(city.major ? t.major : t.minor);

      // Pillar
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.10, 0.14, bh, 8),
        new THREE.MeshStandardMaterial({
          color:           col,
          roughness:       0.25,
          metalness:       0.5,
          emissive:        col,
          emissiveIntensity: 0.18,
        })
      );
      pillar.position.set(lx, bh / 2, lz);
      pillar.castShadow = true;
      master.add(pillar);

      // Tip sphere
      const tipCol = col.clone().lerp(new THREE.Color(0xffffff), 0.3);
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(city.major ? 0.22 : 0.13, 10, 10),
        new THREE.MeshStandardMaterial({
          color:             tipCol,
          emissive:          tipCol,
          emissiveIntensity: 0.9,
          roughness:         0.08,
        })
      );
      const tipR = city.major ? 0.22 : 0.13;
      sphere.position.set(lx, bh + tipR, lz);
      master.add(sphere);

      // Label local position (above tip)
      labelLocalPositions.push({
        local: new THREE.Vector3(lx, bh + tipR + 0.5, lz),
        name:  city.name,
        pop:   city.pop,
        major: city.major,
        col:   city.major ? t.major : t.minor,
      });
    });

    // ── Initial tilt ───────────────────────────────────────────────
    let rotX = 0.5, rotY = 0.2;
    master.rotation.set(rotX, rotY, 0);

    // ── Frame loop ─────────────────────────────────────────────────
    let animId;
    let isDragging = false, prevX = 0, prevY = 0, autoSpin = true;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (autoSpin) rotY += 0.003;
      master.rotation.set(rotX, rotY, 0);
      camera.updateMatrixWorld(true);

      // Project label anchors to screen
      if (overlayRef.current) {
        const labels = overlayRef.current.querySelectorAll(".rtlbl");
        labels.forEach((div, i) => {
          const info = labelLocalPositions[i];
          // Convert local → world
          const worldPos = info.local.clone().applyMatrix4(master.matrixWorld);
          // Project world → NDC
          const ndc = worldPos.clone().project(camera);
          const sx  = ( ndc.x * 0.5 + 0.5) * W;
          const sy  = (-ndc.y * 0.5 + 0.5) * H;
          // Behind camera if ndc.z > 1
          const behind = ndc.z > 1;
          div.style.left    = `${sx}px`;
          div.style.top     = `${sy}px`;
          div.style.opacity = behind ? "0" : "1";
        });
      }

      renderer.render(scene, camera);
    };
    animate();

    // ── Drag controls ──────────────────────────────────────────────
    const onDown = e => {
      isDragging = true;
      prevX = e.clientX; prevY = e.clientY;
      autoSpin = false;
      renderer.domElement.style.cursor = "grabbing";
    };
    const onUp = () => {
      isDragging = false;
      renderer.domElement.style.cursor = "grab";
    };
    const onMove = e => {
      if (!isDragging) return;
      rotY += (e.clientX - prevX) * 0.005;
      rotX  = Math.max(-0.05, Math.min(1.3, rotX + (e.clientY - prevY) * 0.004));
      prevX = e.clientX; prevY = e.clientY;
    };

    renderer.domElement.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup",   onUp);
    window.addEventListener("mousemove", onMove);

    // ── Cleanup ────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animId);
      renderer.domElement.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup",   onUp);
      window.removeEventListener("mousemove", onMove);
      mapTexture.dispose();
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [theme]);

  return (
    <div style={{
      display:"flex", gap:12, alignItems:"flex-start", width:"100%",
      border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden",
    }}>
      <div style={{ position:"relative", flex:1, minWidth:0 }}>
        {/* Three.js canvas mounts here */}
        <div ref={mountRef} style={{ width:"100%", height:460 }} />

        {/* HTML label overlay — positioned absolutely over canvas */}
        <div ref={overlayRef} style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
          {CITIES.map((city, i) => {
            const col = city.major ? t.major : t.minor;
            return (
              <div
                key={i}
                className="rtlbl"
                style={{
                  position:      "absolute",
                  transform:     "translate(-50%, -130%)",
                  background:    city.major ? col : "rgba(255,255,255,0.93)",
                  color:         city.major ? "#fff" : "#334155",
                  fontSize:      city.major ? 10 : 8,
                  fontWeight:    "bold",
                  padding:       city.major ? "2px 7px" : "1px 5px",
                  borderRadius:  3,
                  border:        city.major
                                   ? `1.5px solid rgba(255,255,255,0.45)`
                                   : "1px solid #e2e8f0",
                  whiteSpace:    "nowrap",
                  pointerEvents: "none",
                  boxShadow:     "0 1px 5px rgba(0,0,0,0.18)",
                  transition:    "opacity 0.08s",
                  lineHeight:    "1.4",
                }}
              >
                {city.name}
                {city.major && (
                  <span style={{ opacity:0.75, marginLeft:4, fontWeight:"normal" }}>
                    {(city.pop / 1000).toFixed(1)}M
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div style={{
          padding:"7px 14px", background:"#f8fafc",
          borderTop:"1px solid #e2e8f0", fontSize:11, color:"#94a3b8",
        }}>
          💡 Drag to rotate · auto-spins · Taller pillars = larger population
        </div>
      </div>

      <div style={{ padding:"12px 12px 12px 0" }}>
        <LegendHTML theme={theme} />
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const RasterTilesMap = () => {
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
      {/* Title */}
      <div style={{ marginBottom:4 }}>
        <div style={{ fontSize:16, fontWeight:"bold", color:"#1e293b" }}>World Cities Raster Map</div>
        <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>
          {CITIES.length} cities · OpenStreetMap tiles · Population data
        </div>
      </div>

      {/* Controls */}
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

      {/* Map */}
      {viewMode === "2d"
        ? <Map2D key={`2d-${theme}`} theme={theme} />
        : <Map3D key={`3d-${theme}`} theme={theme} />
      }
    </div>
  );
};

export default RasterTilesMap;