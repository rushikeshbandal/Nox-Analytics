import React, { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════════
// COLOR MATH — all conversions are pure functions, no side effects
// ═══════════════════════════════════════════════════════════
export const hexToRgb = (hex) => {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h[0]+h[0]+h[1]+h[1]+h[2]+h[2] : h;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};

export const rgbToHex = (r, g, b) =>
  "#" + [r, g, b].map(v =>
    Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")
  ).join("");

export const rgbToHsv = (r, g, b) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d > 0) {
    if      (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else                h = ((r - g) / d + 4) / 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(max === 0 ? 0 : (d / max) * 100),
    v: Math.round(max * 100)
  };
};

export const hsvToRgb = (h, s, v) => {
  // h: 0-360, s: 0-100, v: 0-100
  s /= 100; v /= 100;
  const c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c;
  let r = 0, g = 0, b = 0;
  if      (h < 60)  { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else              { r = c; b = x; }
  return { r: Math.round((r+m)*255), g: Math.round((g+m)*255), b: Math.round((b+m)*255) };
};

const isValidHex = (hex) => /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex);

const getLuminance = (hex) => {
  const { r, g, b } = hexToRgb(hex);
  return [r / 255, g / 255, b / 255]
    .map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
    .reduce((acc, c, i) => acc + c * [0.2126, 0.7152, 0.0722][i], 0);
};

const wcagContrast = (c1, c2) => {
  const l1 = getLuminance(c1), l2 = getLuminance(c2);
  return ((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)).toFixed(2);
};

// ═══════════════════════════════════════════════════════════
// WEBGL WHEEL — renders the full hue ring on GPU
// The wheel uses CSS angles: 0° = top, going clockwise.
// Internally: hue 0° = red, 120° = green, 240° = blue.
// Math.atan2 gives: right=0, up=-π/2.
// We rotate by -90° so that hue 0 (red) is at the top.
// ═══════════════════════════════════════════════════════════
const INNER_RATIO = 0.60; // inner disc radius / outer radius

function WebGLWheel({ size, hue, saturation, brightness, onHueChange }) {
  const canvasRef = useRef(null);
  const glRef    = useRef(null);
  const progRef  = useRef(null);
  const isDragging = useRef(false);

  // Init WebGL once
  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return;
    glRef.current = gl;

    const vert = `
      attribute vec2 aPos;
      varying   vec2 vUV;
      void main() { vUV = aPos; gl_Position = vec4(aPos, 0.0, 1.0); }
    `;
    // Fragment: for each pixel compute polar coords.
    // Hue ring between innerR and 1.0.
    // Center disc filled with the currently selected HSV color.
    const frag = `
      precision highp float;
      varying vec2  vUV;
      uniform float uInner;
      uniform float uHue;
      uniform float uSat;
      uniform float uVal;

      vec3 hsv2rgb(float h, float s, float v) {
        float c = v * s;
        float x = c * (1.0 - abs(mod(h / 60.0, 2.0) - 1.0));
        float m = v - c;
        vec3  p;
        if      (h < 60.0)  p = vec3(c, x, 0.0);
        else if (h < 120.0) p = vec3(x, c, 0.0);
        else if (h < 180.0) p = vec3(0.0, c, x);
        else if (h < 240.0) p = vec3(0.0, x, c);
        else if (h < 300.0) p = vec3(x, 0.0, c);
        else                p = vec3(c, 0.0, x);
        return p + m;
      }

      void main() {
        float dist  = length(vUV);
        float aa    = 0.012;

        // Outer clip
        if (dist > 1.0) { discard; return; }

        if (dist > uInner) {
          // HUE RING
          // atan2(y,x) → right=0, CCW positive.
          // We want hue=0 at TOP: shift by +π/2 so top=0.
          float angle = degrees(atan(vUV.y, vUV.x)) + 90.0;
          float h = mod(angle + 360.0, 360.0);
          vec3 col = hsv2rgb(h, 1.0, 1.0);
          float outerAA = smoothstep(1.0, 1.0 - aa, dist);
          float innerAA = smoothstep(uInner, uInner + aa, dist);
          gl_FragColor  = vec4(col, outerAA * innerAA);
        } else {
          // CENTER DISC — filled with current HSV color
          vec3 col     = hsv2rgb(uHue, uSat, uVal);
          float edgeAA = smoothstep(uInner, uInner - aa, dist);
          gl_FragColor = vec4(col, edgeAA);
        }
      }
    `;

    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
        console.error(gl.getShaderInfoLog(s));
      return s;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER,   vert));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    progRef.current = prog;

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER,
      new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }, []);

  // Redraw whenever HSV changes
  useEffect(() => {
    const gl = glRef.current, prog = progRef.current;
    if (!gl || !prog) return;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const set1f = (name, val) =>
      gl.uniform1f(gl.getUniformLocation(prog, name), val);
    set1f("uInner", INNER_RATIO);
    set1f("uHue",   hue);
    set1f("uSat",   saturation / 100);
    set1f("uVal",   brightness / 100);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }, [hue, saturation, brightness]);

  // Convert pointer event → hue angle (same formula as the shader).
  // atan2(y, x) + 90° → hue 0 = top of wheel.
  const pointerToHue = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect   = canvas.getBoundingClientRect();
    const px     = e.touches ? e.touches[0].clientX : e.clientX;
    const py     = e.touches ? e.touches[0].clientY : e.clientY;
    // Normalize to [-1, 1] space (same as WebGL clip space)
    const nx = ((px - rect.left) / rect.width)  * 2 - 1;
    const ny = ((py - rect.top)  / rect.height) * 2 - 1; // NOT flipped — canvas y=0 is top
    // But in WebGL clip space y is flipped (y=1 is top).
    // canvas CSS y increases downward → clip space y decreases → ny_gl = -ny
    const ny_gl = -ny;
    const dist  = Math.sqrt(nx*nx + ny_gl*ny_gl);
    if (dist < INNER_RATIO) return null; // clicked inside disc
    const angle = Math.atan2(ny_gl, nx) * 180 / Math.PI; // right=0, CCW+
    const h     = ((angle + 90) % 360 + 360) % 360;
    return Math.round(h);
  }, []);

  const handleDown = useCallback((e) => {
    isDragging.current = true;
    const h = pointerToHue(e);
    if (h !== null) onHueChange(h);
  }, [pointerToHue, onHueChange]);

  const handleMove = useCallback((e) => {
    if (!isDragging.current) return;
    const h = pointerToHue(e);
    if (h !== null) onHueChange(h);
  }, [pointerToHue, onHueChange]);

  const handleUp = useCallback(() => { isDragging.current = false; }, []);

  useEffect(() => {
    window.addEventListener("mousemove",  handleMove);
    window.addEventListener("mouseup",    handleUp);
    window.addEventListener("touchmove",  handleMove, { passive: true });
    window.addEventListener("touchend",   handleUp);
    return () => {
      window.removeEventListener("mousemove",  handleMove);
      window.removeEventListener("mouseup",    handleUp);
      window.removeEventListener("touchmove",  handleMove);
      window.removeEventListener("touchend",   handleUp);
    };
  }, [handleMove, handleUp]);

  // SVG overlay: hue indicator ring on the wheel.
  // The indicator angle must match the shader formula:
  // shader: atan2(ny_gl, nx) + 90° = hue
  // So for a given hue: angle = hue - 90°
  // In SVG coords (y down): we need to flip ny_gl back.
  // x = cos(θ_rad), y_gl = sin(θ_rad), y_svg = -y_gl
  const R       = size / 2;
  const ringR   = R * (INNER_RATIO + (1 - INNER_RATIO) / 2); // midpoint of ring
  const radHue  = ((hue - 90) * Math.PI) / 180;
  const ix      = R + ringR * Math.cos(radHue);
  const iy      = R - ringR * Math.sin(radHue); // flip y for SVG
  const { r: cr, g: cg, b: cb } = hsvToRgb(hue, 100, 100);
  const hueHex  = rgbToHex(cr, cg, cb);

  return (
    <div style={{ position: "relative", width: size, height: size, cursor: "crosshair", flexShrink: 0 }}>
      <canvas
        ref={canvasRef}
        width={size} height={size}
        style={{ borderRadius: "50%", display: "block", width: size, height: size }}
        onMouseDown={handleDown}
        onTouchStart={handleDown}
      />
      {/* Indicator dot — pure SVG overlay, no JS canvas needed */}
      <svg
        width={size} height={size}
        style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
      >
        <circle cx={ix} cy={iy} r={12} fill="white"      stroke="rgba(0,0,0,0.5)" strokeWidth="2" />
        <circle cx={ix} cy={iy} r={8}  fill={hueHex} />
      </svg>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// CANVAS 2D FALLBACK WHEEL (no WebGL)
// ═══════════════════════════════════════════════════════════
function Canvas2DWheel({ size, hue, saturation, brightness, onHueChange }) {
  const canvasRef  = useRef(null);
  const isDragging = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const cx = size / 2, cy = size / 2, R = size / 2 - 4;
    ctx.clearRect(0, 0, size, size);

    // Draw hue ring slice by slice
    for (let deg = 0; deg < 360; deg++) {
      // CSS convention: hue 0 = top, CW.
      // Convert to canvas angle: canvas 0 = right, CCW.
      // top of canvas = -π/2.  hue 0 → -π/2, hue 90 → 0, etc.
      const startA = ((deg - 90 - 0.7) * Math.PI) / 180;
      const endA   = ((deg - 90 + 0.7) * Math.PI) / 180;
      const { r, g, b } = hsvToRgb(deg, 100, 100);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, R, startA, endA);
      ctx.closePath();
      ctx.fillStyle = rgbToHex(r, g, b);
      ctx.fill();
    }

    // Inner disc
    const { r, g, b } = hsvToRgb(hue, saturation, brightness);
    ctx.beginPath();
    ctx.arc(cx, cy, R * INNER_RATIO, 0, Math.PI * 2);
    ctx.fillStyle = rgbToHex(r, g, b);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Hue indicator
    const radA = ((hue - 90) * Math.PI) / 180;
    const ringR = R * (INNER_RATIO + (1 - INNER_RATIO) / 2);
    const ix = cx + ringR * Math.cos(radA);
    const iy = cy + ringR * Math.sin(radA);
    ctx.beginPath();
    ctx.arc(ix, iy, 11, 0, Math.PI * 2);
    ctx.fillStyle = "white"; ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = 2; ctx.stroke();
    const { r: hr, g: hg, b: hb } = hsvToRgb(hue, 100, 100);
    ctx.beginPath();
    ctx.arc(ix, iy, 7, 0, Math.PI * 2);
    ctx.fillStyle = rgbToHex(hr, hg, hb); ctx.fill();
  }, [size, hue, saturation, brightness]);

  const pointerToHue = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const px = e.touches ? e.touches[0].clientX : e.clientX;
    const py = e.touches ? e.touches[0].clientY : e.clientY;
    const x = px - rect.left - size / 2;
    const y = py - rect.top  - size / 2;
    const dist = Math.sqrt(x*x + y*y);
    if (dist < (size / 2 - 4) * INNER_RATIO) return null;
    // atan2(y,x) gives canvas angle. hue=0 at top → add 90°
    const h = ((Math.atan2(y, x) * 180 / Math.PI) + 90 + 360) % 360;
    return Math.round(h);
  }, [size]);

  const down  = useCallback((e) => { isDragging.current = true;  const h = pointerToHue(e); if (h!==null) onHueChange(h); }, [pointerToHue, onHueChange]);
  const move  = useCallback((e) => { if (!isDragging.current) return; const h = pointerToHue(e); if (h!==null) onHueChange(h); }, [pointerToHue, onHueChange]);
  const up    = useCallback(() => { isDragging.current = false; }, []);

  useEffect(() => {
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup",   up);
    window.addEventListener("touchmove", move, { passive: true });
    window.addEventListener("touchend",  up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup",   up);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend",  up);
    };
  }, [move, up]);

  return (
    <canvas ref={canvasRef} width={size} height={size}
      style={{ borderRadius: "50%", cursor: "crosshair", display: "block", width: size, height: size }}
      onMouseDown={down} onTouchStart={down} />
  );
}

// Auto-detect WebGL support
const hasWebGL = () => {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl") || c.getContext("experimental-webgl"));
  } catch { return false; }
};

// ═══════════════════════════════════════════════════════════
// SAT/BRI 2D PICKER
// Uses imagData for speed — no per-pixel fillRect loop.
// Pointer coords are in canvas pixel space.
// ═══════════════════════════════════════════════════════════
function SatBriPicker({ hue, saturation, brightness, onChange }) {
  const canvasRef  = useRef(null);
  const isDragging = useRef(false);
  const W = 280, H = 160;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const img = ctx.createImageData(W, H);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const s = (x / (W - 1)) * 100;
        const v = 100 - (y / (H - 1)) * 100;
        const { r, g, b } = hsvToRgb(hue, s, v);
        const i = (y * W + x) * 4;
        img.data[i] = r; img.data[i+1] = g; img.data[i+2] = b; img.data[i+3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);

    // Cursor
    const cx = (saturation / 100) * (W - 1);
    const cy = (1 - brightness / 100) * (H - 1);
    ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI*2);
    ctx.strokeStyle = "white"; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI*2);
    ctx.strokeStyle = "rgba(0,0,0,0.6)"; ctx.lineWidth = 1.5; ctx.stroke();
  }, [hue, saturation, brightness]);

  const pick = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const px = e.touches ? e.touches[0].clientX : e.clientX;
    const py = e.touches ? e.touches[0].clientY : e.clientY;
    // Scale CSS px → canvas px
    const x = ((px - rect.left) / rect.width)  * (W - 1);
    const y = ((py - rect.top)  / rect.height) * (H - 1);
    const s = Math.round(Math.max(0, Math.min(100, (x / (W-1)) * 100)));
    const v = Math.round(Math.max(0, Math.min(100, 100 - (y / (H-1)) * 100)));
    onChange(s, v);
  }, [onChange]);

  const down  = useCallback((e) => { isDragging.current = true;  pick(e); }, [pick]);
  const move  = useCallback((e) => { if (isDragging.current) pick(e); },   [pick]);
  const up    = useCallback(() => { isDragging.current = false; }, []);

  useEffect(() => {
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup",   up);
    window.addEventListener("touchmove", move, { passive: true });
    window.addEventListener("touchend",  up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup",   up);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend",  up);
    };
  }, [move, up]);

  return (
    <canvas ref={canvasRef} width={W} height={H}
      style={{ borderRadius: 8, cursor: "crosshair", width: "100%", height: "auto", border: "1px solid #1e293b", display: "block" }}
      onMouseDown={down} onTouchStart={down} />
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN COLOR WHEEL COMPONENT
// ═══════════════════════════════════════════════════════════
const ColorWheel = ({ onApply, onClose, initialColor = "#ff0000", categoryName = null }) => {
  const initRgb = hexToRgb(initialColor);
  const initHsv = rgbToHsv(initRgb.r, initRgb.g, initRgb.b);

  const [hue, setHue] = useState(initHsv.h);
  const [sat, setSat] = useState(Math.max(initHsv.s, 1)); // avoid 0 sat (grays lose hue)
  const [bri, setBri] = useState(Math.max(initHsv.v, 1));
  const [opacity, setOpacity] = useState(100);

  const [hexInput, setHexInput]   = useState(initialColor.toUpperCase());
  const [hexError, setHexError]   = useState(false);
  const [rgbInput, setRgbInput]   = useState(initRgb);
  const [rgbErr,   setRgbErr]     = useState({ r: false, g: false, b: false });
  const [copied,   setCopied]     = useState("");

  const [history,   setHistory]   = useState(() => { try { return JSON.parse(localStorage.getItem("cw_hist") || "[]"); } catch { return []; } });
  const [recents,   setRecents]   = useState([]);
  const [favorites, setFavorites] = useState(() => { try { return JSON.parse(localStorage.getItem("cw_favs") || "[]"); } catch { return []; } });

  const [useGL] = useState(hasWebGL);

  // Derived hex from current HSV — this is always the ground truth
  const liveRgb = hsvToRgb(hue, sat, bri);
  const liveHex = rgbToHex(liveRgb.r, liveRgb.g, liveRgb.b).toUpperCase();

  // When HSV changes (from wheel/picker), sync text inputs
  useEffect(() => {
    setHexInput(liveHex);
    setHexError(false);
    setRgbInput(liveRgb);
    setRgbErr({ r: false, g: false, b: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hue, sat, bri]);

  // ── HEX INPUT ──────────────────────────────────────────
  const onHexInput = (val) => {
    setHexInput(val);
    if (isValidHex(val)) {
      setHexError(false);
      const rgb = hexToRgb(val);
      const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
      setHue(hsv.h);
      setSat(hsv.s === 0 ? 1 : hsv.s); // preserve hue slider position for near-white/black
      setBri(hsv.v === 0 ? 1 : hsv.v);
    } else {
      setHexError(true);
    }
  };

  // ── RGB INPUTS ─────────────────────────────────────────
  const onRgbInput = (ch, raw) => {
    const num = parseInt(raw, 10);
    setRgbInput(prev => ({ ...prev, [ch]: raw }));
    const valid = !isNaN(num) && num >= 0 && num <= 255;
    setRgbErr(prev => ({ ...prev, [ch]: !valid }));
    if (valid) {
      const updated = { ...liveRgb, [ch]: num };
      const hsv = rgbToHsv(updated.r, updated.g, updated.b);
      setHue(hsv.h);
      setSat(hsv.s === 0 ? sat : hsv.s); // keep existing sat for achromatic
      setBri(hsv.v === 0 ? 1  : hsv.v);
    }
  };

  // ── HISTORY / FAVORITES ────────────────────────────────
  const pushHistory = (hex) => {
    const next = [hex, ...history.filter(c => c !== hex)].slice(0, 24);
    setHistory(next);
    setRecents(prev => [hex, ...prev.filter(c => c !== hex)].slice(0, 12));
    localStorage.setItem("cw_hist", JSON.stringify(next));
  };

  const toggleFav = (hex) => {
    const next = favorites.includes(hex)
      ? favorites.filter(c => c !== hex)
      : [...favorites, hex];
    setFavorites(next);
    localStorage.setItem("cw_favs", JSON.stringify(next));
  };

  const pickColor = (hex) => {
    const rgb = hexToRgb(hex);
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    setHue(hsv.h);
    setSat(hsv.s === 0 ? 1 : hsv.s);
    setBri(hsv.v === 0 ? 1 : hsv.v);
  };

  // ── COPY ───────────────────────────────────────────────
  const copy = (text, label) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(label);
    setTimeout(() => setCopied(""), 2000);
  };

  // ── APPLY ──────────────────────────────────────────────
  const handleApply = () => {
    pushHistory(liveHex);
    // Build a 6-stop tint palette
    const tints = Array.from({ length: 6 }, (_, i) => {
      const t = i / 5;
      const { r, g, b } = liveRgb;
      return rgbToHex(
        Math.round(r + (255 - r) * t),
        Math.round(g + (255 - g) * t),
        Math.round(b + (255 - b) * t)
      );
    });
    onApply?.([liveHex, ...tints], { category: categoryName, color: liveHex, opacity });
    onClose();
  };

  // ── SHADES row ─────────────────────────────────────────
  const shades = Array.from({ length: 11 }, (_, i) => {
    const t = i / 10;
    const { r, g, b } = liveRgb;
    return rgbToHex(
      Math.round(r + (255 - r) * t),
      Math.round(g + (255 - g) * t),
      Math.round(b + (255 - b) * t)
    );
  });

  const cr     = wcagContrast(liveHex, "#ffffff");
  const wcagOK = parseFloat(cr) >= 4.5;

  const WheelComp = useGL ? WebGLWheel : Canvas2DWheel;

  return (
    <div style={S.overlay}>
      <div style={S.modal}>

        {/* ── HEADER ── */}
        <div style={S.header}>
          <div>
            <div style={S.title}>
              {useGL ? "WebGL" : "Canvas"} Color Wheel
            </div>
            <div style={S.sub}>
              16.7M colors · HSV / RGB / HEX
              {categoryName && <span style={{ color: "#38bdf8" }}> · {categoryName}</span>}
            </div>
          </div>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* ── BODY ── */}
        <div style={S.body}>

          {/* COL 1 — WHEEL + SAT/BRI + OPACITY */}
          <div style={S.col}>
            <WheelComp
              size={290}
              hue={hue}
              saturation={sat}
              brightness={bri}
              onHueChange={setHue}
            />

            <div style={{ width: "100%", marginTop: 4 }}>
              <div style={S.rowLabel}>
                <span style={S.label}>Saturation / Brightness</span>
                <span style={S.pill}>{sat}% / {bri}%</span>
              </div>
              <SatBriPicker
                hue={hue} saturation={sat} brightness={bri}
                onChange={(s, v) => { setSat(s); setBri(v); }}
              />
            </div>

            <div style={{ width: "100%" }}>
              <div style={S.rowLabel}>
                <span style={S.label}>Opacity / Alpha</span>
                <span style={S.pill}>{opacity}%</span>
              </div>
              <input
                type="range" min="0" max="100" step="1" value={opacity}
                onChange={e => setOpacity(+e.target.value)}
                style={{ width: "100%", accentColor: "#38bdf8", cursor: "pointer" }}
              />
            </div>
          </div>

          {/* COL 2 — INPUTS + PREVIEW */}
          <div style={S.col}>

            {/* Preview swatch */}
            <div style={S.previewCard}>
              <div style={{
                ...S.swatch,
                background: liveHex,
                opacity: opacity / 100
              }} />
              <div>
                <div style={S.hexDisplay}>{liveHex}</div>
                <div style={S.rgbDisplay}>
                  rgb({liveRgb.r}, {liveRgb.g}, {liveRgb.b})
                </div>
                <div style={S.hsvDisplay}>
                  hsv({hue}°, {sat}%, {bri}%)
                </div>
                <div style={{ ...S.wcag, color: wcagOK ? "#4ade80" : "#f87171" }}>
                  {wcagOK ? "✓ WCAG AA" : "✗ Below AA"} · {cr}:1
                </div>
              </div>
            </div>

            {/* HEX input */}
            <div style={S.field}>
              <span style={S.label}>HEX</span>
              <div style={S.row}>
                <input
                  value={hexInput}
                  onChange={e => onHexInput(e.target.value)}
                  spellCheck={false}
                  placeholder="#RRGGBB"
                  style={{ ...S.input, borderColor: hexError ? "#f87171" : "#2d3f55" }}
                />
                <button style={S.iconBtn} onClick={() => copy(liveHex, "HEX")}>
                  {copied === "HEX" ? "✓" : "⎘"}
                </button>
              </div>
              {hexError && <div style={S.err}>Use #RGB or #RRGGBB format</div>}
            </div>

            {/* RGB inputs */}
            <div style={S.field}>
              <span style={S.label}>RGB</span>
              <div style={S.row}>
                {["r","g","b"].map(ch => (
                  <div key={ch} style={{ flex: 1 }}>
                    <input
                      type="number" min="0" max="255"
                      value={rgbInput[ch]}
                      onChange={e => onRgbInput(ch, e.target.value)}
                      placeholder={ch.toUpperCase()}
                      style={{ ...S.input, textAlign: "center", borderColor: rgbErr[ch] ? "#f87171" : "#2d3f55" }}
                    />
                    {rgbErr[ch] && <div style={S.err}>0–255</div>}
                  </div>
                ))}
                <button style={S.iconBtn} onClick={() => copy(`rgb(${liveRgb.r},${liveRgb.g},${liveRgb.b})`, "RGB")}>
                  {copied === "RGB" ? "✓" : "⎘"}
                </button>
              </div>
            </div>

            {/* Shades */}
            <div style={S.shadesCard}>
              <span style={S.label}>Tints</span>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", margin: "6px 0" }}>
                {shades.map((s, i) => (
                  <div key={i} title={s}
                    style={{ width: 22, height: 22, borderRadius: 5, background: s, cursor: "pointer", border: "1px solid #2d3f55" }}
                    onClick={() => pickColor(s)}
                  />
                ))}
              </div>
              <div style={{ height: 18, borderRadius: 5, background: `linear-gradient(90deg, ${shades.join(",")})` }} />
            </div>

            <button
              style={{ ...S.favBtn, background: favorites.includes(liveHex) ? "#f59e0b" : "#1e2d3f" }}
              onClick={() => toggleFav(liveHex)}
            >
              {favorites.includes(liveHex) ? "★ Saved to Favorites" : "☆ Add to Favorites"}
            </button>
          </div>

          {/* COL 3 — HISTORY */}
          <div style={S.col}>
            {[
              { label: "Recent",    list: recents   },
              { label: "Favorites", list: favorites, removable: true },
              { label: "History",   list: history.slice(0,24) }
            ].map(({ label, list, removable }) => (
              <div key={label} style={S.panel}>
                <div style={S.panelTitle}>{label}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {list.length === 0
                    ? <div style={S.empty}>
                        {label === "Favorites" ? "Press ☆ to save" : `No ${label.toLowerCase()} yet`}
                      </div>
                    : list.map((c, i) => (
                        <div key={i} style={{ position: "relative" }}>
                          <div
                            title={c}
                            style={{ width: 28, height: 28, borderRadius: 7, background: c, cursor: "pointer", border: "1.5px solid #2d3f55" }}
                            onClick={() => pickColor(c)}
                          />
                          {removable && (
                            <button style={S.removeBtn} onClick={() => toggleFav(c)}>×</button>
                          )}
                        </div>
                      ))
                  }
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div style={S.footer}>
          <div style={{ fontSize: 12, color: "#4ade80", minHeight: 16 }}>
            {copied ? `${copied} copied!` : ""}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={S.cancelBtn} onClick={onClose}>Cancel</button>
            <button style={S.applyBtn}  onClick={handleApply}>Apply Color</button>
          </div>
        </div>

      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════
const S = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
    backdropFilter: "blur(6px)", zIndex: 9999,
    display: "flex", alignItems: "center", justifyContent: "center", padding: 16
  },
  modal: {
    background: "#0a1628", borderRadius: 16, width: "100%", maxWidth: 1080,
    maxHeight: "95vh", overflowY: "auto",
    border: "1px solid #1e2d3f", boxShadow: "0 40px 80px rgba(0,0,0,0.7)"
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    padding: "14px 20px", borderBottom: "1px solid #1e2d3f",
    background: "#060f1e", borderRadius: "16px 16px 0 0"
  },
  title: { fontSize: 16, fontWeight: 700, color: "#f0f6ff" },
  sub:   { fontSize: 11, color: "#4a6080", marginTop: 3 },
  closeBtn: {
    background: "none", border: "none", color: "#4a6080", fontSize: 18,
    cursor: "pointer", padding: "2px 8px", borderRadius: 6
  },
  body: {
    display: "grid", gridTemplateColumns: "auto 1fr 200px", gap: 18,
    padding: "18px 20px", alignItems: "start"
  },
  col: {
    display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start"
  },
  rowLabel: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 },
  label: { fontSize: 11, fontWeight: 600, color: "#6b8aaa" },
  pill:  { fontSize: 11, color: "#cbd5e1", background: "#1a2a3a", padding: "2px 8px", borderRadius: 20 },
  previewCard: {
    display: "flex", gap: 12, alignItems: "center",
    background: "#111f2e", padding: "12px", borderRadius: 10, width: "100%"
  },
  swatch: { width: 64, height: 64, borderRadius: 10, border: "2px solid #1e2d3f", flexShrink: 0 },
  hexDisplay: { fontSize: 16, fontWeight: 700, fontFamily: "monospace", color: "#f0f6ff" },
  rgbDisplay: { fontSize: 11, color: "#6b8aaa", fontFamily: "monospace", marginTop: 3 },
  hsvDisplay: { fontSize: 11, color: "#4a6080", fontFamily: "monospace", marginTop: 2 },
  wcag:       { fontSize: 11, fontWeight: 600, marginTop: 5 },
  field:      { width: "100%" },
  row:        { display: "flex", gap: 6, alignItems: "flex-start" },
  input: {
    flex: 1, padding: "7px 9px", background: "#111f2e", border: "1px solid #2d3f55",
    borderRadius: 7, color: "#f0f6ff", fontSize: 13, fontFamily: "monospace",
    outline: "none", width: "100%", boxSizing: "border-box"
  },
  iconBtn: {
    padding: "7px 11px", background: "#111f2e", border: "1px solid #2d3f55",
    borderRadius: 7, cursor: "pointer", color: "#cbd5e1", fontSize: 14, flexShrink: 0
  },
  err:  { fontSize: 10, color: "#f87171", marginTop: 2 },
  shadesCard: { background: "#111f2e", borderRadius: 8, padding: "8px 10px", width: "100%" },
  favBtn: {
    width: "100%", padding: "9px 0", border: "none", borderRadius: 8,
    color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 13, transition: "background 0.2s"
  },
  panel: { background: "#111f2e", borderRadius: 8, padding: "8px 10px", width: "100%" },
  panelTitle: { fontSize: 11, fontWeight: 600, color: "#6b8aaa", marginBottom: 7 },
  empty:  { fontSize: 11, color: "#3a5070" },
  removeBtn: {
    position: "absolute", top: -5, right: -5, width: 14, height: 14,
    background: "#ef4444", border: "none", borderRadius: "50%",
    color: "#fff", fontSize: 9, cursor: "pointer", lineHeight: 1,
    display: "flex", alignItems: "center", justifyContent: "center", padding: 0
  },
  footer: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "12px 20px", borderTop: "1px solid #1e2d3f",
    background: "#060f1e", borderRadius: "0 0 16px 16px"
  },
  cancelBtn: {
    padding: "8px 20px", background: "#111f2e", border: "1px solid #2d3f55",
    borderRadius: 7, color: "#cbd5e1", cursor: "pointer", fontSize: 13, fontWeight: 500
  },
  applyBtn: {
    padding: "8px 20px", background: "#2563eb", border: "none",
    borderRadius: 7, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600
  }
};

export default ColorWheel;