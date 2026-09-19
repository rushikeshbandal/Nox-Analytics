/**
 * PaletteManager.jsx — Nox Analytics · AVIE · Palette Engine
 * Owner: Pratik Ghuge | All palette ops persist to PostgreSQL via paletteService → Prisma
 *
 * WBS: 1-Industry map · 2-Dept map · 3-Presets · 4-Enterprise lock · 5-Preview panel
 *      6-Apply scope  · 7-CRUD     · 8-Versions · 9-Rollback       · 10-AI · 11-Audit
 *
 * Import:  import PaletteManager from './PaletteManager';
 *          import { PaletteManager } from './PaletteManager';
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import { paletteService } from "../services/paletteService";

// ─── Colour utilities ─────────────────────────────────────────────────────────
const hexToRgb = (hex = "#000") => { const c = hex.replace("#","").padEnd(6,"0"); return { r:parseInt(c.slice(0,2),16), g:parseInt(c.slice(2,4),16), b:parseInt(c.slice(4,6),16) }; };
const isValidHex  = (h) => /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test((h||"").trim());
const relLum      = ({r,g,b}) => { const f=(v)=>{const n=v/255;return n<=0.03928?n/12.92:((n+0.055)/1.055)**2.4}; return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b); };
const textOn      = (hex) => relLum(hexToRgb(hex))>0.35?"#111827":"#ffffff";
const cr          = (a,b) => { const [l,d]=[relLum(hexToRgb(a)),relLum(hexToRgb(b))].sort((x,y)=>y-x); return ((l+0.05)/(d+0.05)).toFixed(1); };
let _n=1; const uid = ()=>`pe-${Date.now()}-${_n++}`;

// ─── WBS 1: Industry → palette mapping matrix ─────────────────────────────────
const INDUSTRY_MAP = {
  "Finance & Banking":      { colors:["#003366","#0066CC","#004C99","#336699","#99BBDD","#CCE4FF","#F5F7FA"], rationale:"Deep navy — trust, stability, authority." },
  "Healthcare & Pharma":    { colors:["#00A896","#02C39A","#028090","#05668D","#00B4D8","#B2EBF2","#F0F3F4"], rationale:"Clean teals — hygiene, care, precision." },
  "Technology & SaaS":      { colors:["#6C63FF","#3ECFCF","#F72585","#4361EE","#3A0CA3","#7209B7","#E0AAFF"], rationale:"Electric hues — innovation, digital-first." },
  "Retail & E-Commerce":    { colors:["#FF6B35","#F7C59F","#004E89","#1A936F","#C3423F","#F4D35E","#EFEFD0"], rationale:"Vibrant — engagement, call-to-action." },
  "Manufacturing":          { colors:["#2C2C54","#474787","#F97F51","#B33771","#1B1464","#ED4C67","#C4E538"], rationale:"Industrial — precision, durability." },
  "Energy & Utilities":     { colors:["#2ECC71","#27AE60","#F39C12","#E67E22","#1ABC9C","#16A085","#F1C40F"], rationale:"Greens for sustainability; ambers for power." },
  "Education":              { colors:["#2C3E50","#3498DB","#E74C3C","#F1C40F","#8E44AD","#1ABC9C","#ECF0F1"], rationale:"Classic academic — authority + approachability." },
  "Government & Public":    { colors:["#1C3A5E","#2E5986","#4A7AB5","#6B9BCE","#8DB4D9","#C5D9EC","#EBF2F9"], rationale:"Formal blue — reliability, civic trust." },
  "Hospitality & Travel":   { colors:["#C19A6B","#A0522D","#DEB887","#F4A460","#8B4513","#D2691E","#FFF8DC"], rationale:"Warm earth — comfort, world experiences." },
  "Media & Entertainment":  { colors:["#FF0054","#FF5400","#FFBD00","#00B4D8","#48CAE4","#ADE8F4","#CAF0F8"], rationale:"High-contrast — maximum visual impact." },
  "Legal & Compliance":     { colors:["#0A0A0A","#1C1C1C","#2D2D2D","#C9A84C","#B8960C","#8B6914","#F5F5F0"], rationale:"Black & gold — gravitas, prestige." },
  "Non-Profit":             { colors:["#EF476F","#FFD166","#06D6A0","#118AB2","#073B4C","#FFDDD2","#E9C46A"], rationale:"Hopeful — inspire community action." },
};

// ─── WBS 2: Department → palette mapping matrix ───────────────────────────────
const DEPT_MAP = {
  "Sales":             { colors:["#FF4500","#FF6347","#FF7F50","#FF8C00","#FFA500","#FFD700","#FFF3CD"], rationale:"Energetic reds — urgency, conversion." },
  "Marketing":         { colors:["#E91E8C","#9C27B0","#673AB7","#3F51B5","#00BCD4","#FF5722","#FFC107"], rationale:"Bold creative — campaign impact." },
  "Finance":           { colors:["#0D47A1","#1565C0","#1976D2","#1E88E5","#42A5F5","#90CAF9","#E3F2FD"], rationale:"Conservative blues — accuracy, trust." },
  "Engineering":       { colors:["#212121","#424242","#616161","#757575","#9E9E9E","#BDBDBD","#F5F5F5"], rationale:"Neutral monochrome — minimise distraction." },
  "HR & People":       { colors:["#E91E63","#F06292","#F48FB1","#FCE4EC","#A5D6A7","#B3E5FC","#FFF9C4"], rationale:"Warm approachable — put people at ease." },
  "Operations":        { colors:["#37474F","#546E7A","#78909C","#90A4AE","#B0BEC5","#CFD8DC","#ECEFF1"], rationale:"Structured blue-greys — process clarity." },
  "Data & Analytics":  { colors:["#08306B","#08519C","#2171B5","#4292C6","#6BAED6","#9ECAE1","#DEEBF7"], rationale:"Sequential blue — data-dense visuals." },
  "Executive":         { colors:["#0A0A0A","#1C1C1C","#2D2D2D","#C9A84C","#B8960C","#8B6914","#FAFAFA"], rationale:"Premium black & gold — executive presence." },
  "Design":            { colors:["#FF1744","#FF9100","#FFEA00","#00E676","#00B0FF","#D500F9","#AA00FF"], rationale:"Full-spectrum — creative exploration." },
  "Risk & Compliance": { colors:["#D32F2F","#F44336","#FF7043","#FFA726","#FFCA28","#66BB6A","#26A69A"], rationale:"Traffic-light — risk scoring." },
};

// ─── WBS 3: Palette preset library — 28 built-in presets across 12 categories ──
const PRESETS = [
  { id:"p01", name:"Finance Navy",      cat:"Finance",      colors:["#003366","#0055A4","#0077CC","#4499DD","#88BBEE","#CCE4FF","#F5F7FA"] },
  { id:"p02", name:"Legal Gold",        cat:"Finance",      colors:["#0A0A0A","#1C1C1C","#2D2D2D","#C9A84C","#B8960C","#8B6914","#F5F5F0"] },
  { id:"p03", name:"Healthcare Teal",   cat:"Healthcare",   colors:["#00A896","#02C39A","#028090","#05668D","#00B4D8","#B2EBF2","#F0F3F4"] },
  { id:"p04", name:"Pharma Blue",       cat:"Healthcare",   colors:["#0D4C92","#1565C0","#1E88E5","#42A5F5","#90CAF9","#BBDEFB","#FFFFFF"] },
  { id:"p05", name:"Tech Electric",     cat:"Technology",   colors:["#6C63FF","#3ECFCF","#F72585","#4361EE","#3A0CA3","#7209B7","#E0AAFF"] },
  { id:"p06", name:"Dark Mode Tech",    cat:"Technology",   colors:["#0F0E17","#FF8906","#F25F4C","#E53170","#FFFFFE","#A7A9BE","#2E2F3E"] },
  { id:"p07", name:"SaaS Clean",        cat:"Technology",   colors:["#1A1D23","#2563EB","#7C3AED","#06B6D4","#10B981","#F59E0B","#EF4444"] },
  { id:"p08", name:"Retail Vivid",      cat:"Retail",       colors:["#FF6B35","#F7C59F","#004E89","#1A936F","#C3423F","#F4D35E","#EFEFD0"] },
  { id:"p09", name:"Luxury Dark",       cat:"Retail",       colors:["#1A0A2E","#2D1B69","#4A3728","#C8A951","#E8D5A3","#F5F0E8","#FFFFFF"] },
  { id:"p10", name:"Energy Green",      cat:"Energy",       colors:["#1B4332","#2D6A4F","#40916C","#52B788","#74C69D","#95D5B2","#D8F3DC"] },
  { id:"p11", name:"Sequential Blue",   cat:"Data Viz",     colors:["#08306B","#08519C","#2171B5","#4292C6","#6BAED6","#9ECAE1","#DEEBF7"] },
  { id:"p12", name:"Sequential Green",  cat:"Data Viz",     colors:["#00441B","#006D2C","#238B45","#41AB5D","#74C476","#A1D99B","#E5F5E0"] },
  { id:"p13", name:"Diverging RdBu",    cat:"Data Viz",     colors:["#D73027","#FC8D59","#FEE090","#E0F3F8","#91BFDB","#4575B4","#313695"] },
  { id:"p14", name:"Traffic Light",     cat:"Data Viz",     colors:["#D32F2F","#F44336","#FF7043","#FFA726","#FFCA28","#66BB6A","#388E3C"] },
  { id:"p15", name:"Categorical 7",     cat:"Data Viz",     colors:["#1F77B4","#FF7F0E","#2CA02C","#D62728","#9467BD","#8C564B","#E377C2"] },
  { id:"p16", name:"Academic Classic",  cat:"Education",    colors:["#2C3E50","#3498DB","#E74C3C","#F1C40F","#8E44AD","#1ABC9C","#ECF0F1"] },
  { id:"p17", name:"Govt Formal",       cat:"Government",   colors:["#1C3A5E","#2E5986","#4A7AB5","#6B9BCE","#8DB4D9","#C5D9EC","#EBF2F9"] },
  { id:"p18", name:"Dark Ocean",        cat:"Dark",         colors:["#03045E","#023E8A","#0077B6","#0096C7","#00B4D8","#48CAE4","#90E0EF"] },
  { id:"p19", name:"Dark Cosmos",       cat:"Dark",         colors:["#03071E","#370617","#6A040F","#9D0208","#D00000","#DC2F02","#E85D04"] },
  { id:"p20", name:"Midnight Purple",   cat:"Dark",         colors:["#10002B","#240046","#3C096C","#5A189A","#7B2FBE","#9D4EDD","#C77DFF"] },
  { id:"p21", name:"Colorblind Safe",   cat:"Accessible",   colors:["#000000","#E69F00","#56B4E9","#009E73","#F0E442","#0072B2","#D55E00"] },
  { id:"p22", name:"High Contrast AAA", cat:"Accessible",   colors:["#000000","#FFFFFF","#005A9C","#B22222","#006400","#8B4513","#4B0082"] },
  { id:"p23", name:"Pastel Spring",     cat:"Pastel",       colors:["#FFB3BA","#FFDFBA","#FFFFBA","#BAFFC9","#BAE1FF","#D4BAFF","#FFBAF4"] },
  { id:"p24", name:"Nordic Pastel",     cat:"Pastel",       colors:["#A8DADC","#457B9D","#1D3557","#E63946","#F1FAEE","#E9C46A","#F4A261"] },
  { id:"p25", name:"Mono Charcoal",     cat:"Monochrome",   colors:["#1A1A1A","#2D2D2D","#404040","#595959","#737373","#8C8C8C","#F5F5F5"] },
  { id:"p26", name:"Warm Gray",         cat:"Monochrome",   colors:["#1C1917","#292524","#44403C","#57534E","#78716C","#A8A29E","#F5F5F4"] },
  { id:"p27", name:"Brand Default",     cat:"Special",      colors:["#0F172A","#1E40AF","#3B82F6","#93C5FD","#10B981","#F59E0B","#EF4444"] },
  { id:"p28", name:"Rainbow 7",         cat:"Special",      colors:["#FF0000","#FF7700","#FFFF00","#00CC00","#0000FF","#8B00FF","#FF00AA"] },
];
const PRESET_CATS = ["All",...Array.from(new Set(PRESETS.map(p=>p.cat)))];

// ─── Design tokens — single source of truth for colours, radii, shadows ───────
const K = {
  bg:"#F0F2F5", surface:"#FFFFFF", s2:"#F8FAFC",
  border:"#E2E8F0", text:"#0F172A", sub:"#475569", muted:"#94A3B8",
  brand:"#1E40AF", brandL:"#EFF6FF",
  green:"#16A34A", greenBg:"#F0FDF4",
  amber:"#B45309", amberBg:"#FFFBEB",
  red:"#B91C1C",   redBg:"#FEF2F2",
  r:"8px", rL:"12px",
  sh:"0 1px 3px rgba(0,0,0,0.07)",
  shM:"0 4px 16px rgba(0,0,0,0.10)",
  shL:"0 20px 50px rgba(0,0,0,0.18)",
};

// Colour maps for status badges and audit action badges
const S_COL = { active:[K.green,K.greenBg], draft:["#92400E",K.amberBg], locked:[K.amber,K.amberBg], archived:[K.muted,"#F1F5F9"] };
const A_COL = { created:[K.green,K.greenBg], updated:[K.brand,K.brandL], deleted:[K.red,K.redBg], applied:["#6D28D9","#F5F3FF"], duplicated:[K.sub,"#F1F5F9"], locked:[K.amber,K.amberBg], unlocked:["#0E7490","#ECFEFF"], rolled_back:["#92400E",K.amberBg] };

// ─── Primitive components ─────────────────────────────────────────────────────

// Pill badge — status, scope, action labels
const Badge = ({label,color,bg,style={}}) => (
  <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,letterSpacing:"0.04em",whiteSpace:"nowrap",background:bg,color,...style}}>{label}</span>
);

// Button — primary / secondary / danger / ghost with loading-aware disabled state
const Btn = ({children,onClick,variant="secondary",sm=false,disabled=false,full=false,style={}}) => {
  const V={primary:{background:K.brand,color:"#fff",border:`1px solid ${K.brand}`},secondary:{background:K.surface,color:K.sub,border:`1px solid ${K.border}`},danger:{background:K.redBg,color:K.red,border:"1px solid #FECACA"},ghost:{background:"transparent",color:K.muted,border:"1px solid transparent"}};
  return <button onClick={disabled?undefined:onClick} disabled={disabled} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:5,padding:sm?"5px 11px":"8px 15px",borderRadius:K.r,fontSize:sm?12:13,fontWeight:500,cursor:disabled?"not-allowed":"pointer",opacity:disabled?0.45:1,fontFamily:"inherit",transition:"all 0.12s",width:full?"100%":"auto",...V[variant],...style}}>{children}</button>;
};

// Controlled text input with optional monospace for HEX strings
const Inp = ({value,onChange,placeholder="",mono=false,style={}}) => (
  <input type="text" value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
    style={{width:"100%",padding:"8px 11px",border:`1px solid ${K.border}`,borderRadius:K.r,fontSize:13,fontFamily:mono?"'Courier New',monospace":"inherit",outline:"none",background:K.surface,color:K.text,boxSizing:"border-box",...style}}/>
);

// Controlled select dropdown
const Sel = ({value,onChange,children,style={}}) => (
  <select value={value||""} onChange={e=>onChange(e.target.value)}
    style={{width:"100%",padding:"8px 11px",border:`1px solid ${K.border}`,borderRadius:K.r,fontSize:13,fontFamily:"inherit",outline:"none",background:K.surface,color:K.text,cursor:"pointer",...style}}>
    {children}
  </select>
);

// WBS 5: Swatch row — equal-width colour blocks, supports both {hex} objects and raw strings
const Swatches = ({colors=[],height=40}) => (
  <div style={{display:"flex",borderRadius:K.r,overflow:"hidden",height,border:"1px solid rgba(0,0,0,0.07)"}}>
    {colors.map((c,i)=>{const hex=c?.hex||c; return <div key={i} title={hex} style={{flex:1,background:hex,borderRight:i<colors.length-1?"1px solid rgba(255,255,255,0.1)":undefined}}/>;})}
  </div>
);

// WBS 5: Expanded preview grid — HEX, RGB values, WCAG contrast ratio, click to copy
const PreviewGrid = ({colors=[]}) => (
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(86px,1fr))",gap:6,marginTop:12}}>
    {colors.map((c,i)=>{
      const hex=c?.hex||c; const rgb=c?.rgb||hexToRgb(hex); const tc=textOn(hex);
      return(
        <div key={i} style={{borderRadius:K.r,overflow:"hidden",border:`1px solid ${K.border}`}}>
          <div style={{height:40,background:hex,cursor:"pointer",position:"relative"}} title="Click to copy hex" onClick={()=>navigator.clipboard?.writeText(hex)}>
            <span style={{position:"absolute",bottom:3,right:5,fontSize:8,fontFamily:"monospace",color:tc,fontWeight:700}}>{hex}</span>
          </div>
          <div style={{padding:"4px 6px",background:K.surface}}>
            <div style={{fontSize:10,fontFamily:"monospace",fontWeight:600,color:K.text}}>{hex}</div>
            <div style={{fontSize:9,color:K.muted}}>rgb({rgb.r},{rgb.g},{rgb.b})</div>
            <div style={{fontSize:9,color:K.muted}}>CR {cr(hex,"#fff")}:1</div>
          </div>
        </div>
      );
    })}
  </div>
);

// Centred modal — backdrop click closes; wide prop doubles max-width
const Modal = ({title,onClose,children,footer,wide=false}) => (
  <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
    onClick={e=>e.target===e.currentTarget&&onClose()}>
    <div style={{background:K.surface,borderRadius:K.rL,padding:24,width:"100%",maxWidth:wide?740:500,maxHeight:"88vh",overflowY:"auto",boxShadow:K.shL}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <span style={{fontSize:16,fontWeight:700,color:K.text}}>{title}</span>
        <button onClick={onClose} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:K.muted,lineHeight:1}}>×</button>
      </div>
      {children}
      {footer&&<div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:20,paddingTop:16,borderTop:`1px solid ${K.border}`}}>{footer}</div>}
    </div>
  </div>
);

// Slide-in toast — auto-dismisses after 3.5 s
const Toasts = ({toasts}) => (
  <div style={{position:"fixed",bottom:20,right:20,display:"flex",flexDirection:"column",gap:8,zIndex:9999,pointerEvents:"none"}}>
    {toasts.map(t=><div key={t.id} style={{padding:"11px 16px",borderRadius:K.r,fontSize:13,fontWeight:500,color:"#fff",background:t.type==="error"?"#DC2626":t.type==="warn"?"#D97706":"#16A34A",boxShadow:K.shM,animation:"_tin .18s ease"}}>{t.msg}</div>)}
  </div>
);

const FL = {fontSize:12,fontWeight:600,color:K.sub,marginBottom:5,display:"block"};

// ─── WBS 5: Palette card with expandable colour preview ───────────────────────
const PaletteCard = ({palette,expanded,onToggle,onEdit,onDuplicate,onDelete,onApply,onHistory}) => {
  const [sc,sbg] = S_COL[palette.status]||[K.muted,"#F1F5F9"];
  // Normalise: prefer colors[] (UI shape) then fall back to primaryColors[] (DB shape)
  const cols = palette.colors?.length ? palette.colors : (palette.primaryColors||[]).map((h,i)=>({id:`c-${i}`,hex:h,rgb:hexToRgb(h)}));
  return(
    <div onClick={onToggle} style={{background:K.surface,border:`1.5px solid ${expanded?K.brand:K.border}`,borderRadius:K.rL,padding:16,cursor:"pointer",transition:"all 0.12s",boxShadow:expanded?`0 0 0 3px ${K.brandL}`:K.sh}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:12}}>
        <div style={{minWidth:0}}>
          <div style={{fontSize:13,fontWeight:600,color:K.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{palette.isLocked?"🔒 ":""}{palette.name}</div>
          <div style={{fontSize:11,color:K.muted,marginTop:3}}>{palette.industry||"No industry"}{palette.department?` · ${palette.department}`:""} · <span style={{fontFamily:"monospace"}}>v{palette.version||1}</span></div>
        </div>
        <div style={{display:"flex",gap:4,flexShrink:0,flexWrap:"wrap",justifyContent:"flex-end"}}>
          <Badge label={(palette.status||"draft").toUpperCase()} color={sc} bg={sbg}/>
          <Badge label={palette.scope==="global"?"GLOBAL":"SINGLE"} color={K.brand} bg={K.brandL}/>
        </div>
      </div>
      <Swatches colors={cols} height={44}/>
      {/* Expanded section: full preview grid + CRUD action buttons */}
      {expanded&&(
        <div onClick={e=>e.stopPropagation()}>
          <PreviewGrid colors={cols}/>
          <div style={{height:1,background:K.border,margin:"14px 0"}}/>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {!palette.isLocked&&<Btn sm variant="primary" onClick={()=>onApply(palette)}>▶ Apply</Btn>}
            {!palette.isLocked&&<Btn sm onClick={()=>onEdit(palette)}>Edit</Btn>}
            <Btn sm onClick={()=>onDuplicate(palette)}>Duplicate</Btn>
            <Btn sm onClick={()=>onHistory(palette)}>History</Btn>
            {!palette.isLocked&&<Btn sm variant="danger" onClick={()=>onDelete(palette.id,palette.name)}>Delete</Btn>}
            {palette.isLocked&&<span style={{fontSize:11,color:K.amber,padding:"5px 2px"}}>Enterprise locked — contact admin to modify</span>}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── WBS 7: Create / Edit modal ───────────────────────────────────────────────
const EditModal = ({form,onChange,onSave,onClose,saving}) => {
  const hexes   = (form.colors||"").split(",").map(s=>s.trim()).filter(isValidHex);
  const indData = form.industry && INDUSTRY_MAP[form.industry];
  return(
    <Modal title={form.id?"Edit Palette":"New Palette"} onClose={onClose} footer={<>
      <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
      <Btn variant="primary" onClick={onSave} disabled={saving}>{saving?"Saving…":form.id?"Save Changes":"Create Palette"}</Btn>
    </>}>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div><label style={FL}>Name *</label><Inp value={form.name} onChange={v=>onChange("name",v)} placeholder="e.g. Q4 Finance Dashboard"/></div>
        <div><label style={FL}>Description</label><Inp value={form.description} onChange={v=>onChange("description",v)} placeholder="Brief description…"/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div><label style={FL}>Industry</label>
            <Sel value={form.industry} onChange={v=>onChange("industry",v)}>
              <option value="">None</option>{Object.keys(INDUSTRY_MAP).map(k=><option key={k}>{k}</option>)}
            </Sel>
          </div>
          <div><label style={FL}>Department</label>
            <Sel value={form.department} onChange={v=>onChange("department",v)}>
              <option value="">None</option>{Object.keys(DEPT_MAP).map(k=><option key={k}>{k}</option>)}
            </Sel>
          </div>
        </div>
        {/* Industry colour suggestion — shown only when an industry is selected */}
        {indData&&(
          <div style={{background:K.greenBg,border:"1px solid #BBF7D0",borderRadius:K.r,padding:"10px 14px"}}>
            <div style={{fontSize:12,fontWeight:600,color:K.green,marginBottom:4}}>Suggested colours for {form.industry}</div>
            <div style={{fontSize:11,color:"#166534",marginBottom:8}}>{indData.rationale}</div>
            <Swatches colors={indData.colors.map(h=>({hex:h}))} height={24}/>
            <Btn sm style={{marginTop:8}} onClick={()=>onChange("colors",indData.colors.join(", "))}>Use these colours</Btn>
          </div>
        )}
        <div>
          <label style={FL}>Colours * (comma-separated HEX, min 2)</label>
          <Inp value={form.colors} onChange={v=>onChange("colors",v)} placeholder="#003366, #0055A4, #0077CC, #88BBEE, #CCE4FF, #F5F7FA" mono/>
          {hexes.length>0&&<div style={{marginTop:8}}><Swatches colors={hexes.map(h=>({hex:h}))} height={24}/><div style={{fontSize:11,color:K.muted,marginTop:4}}>{hexes.length} valid colour{hexes.length!==1?"s":""} detected</div></div>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div><label style={FL}>Status</label>
            <Sel value={form.status} onChange={v=>onChange("status",v)}>
              <option value="draft">Draft</option><option value="active">Active</option><option value="archived">Archived</option>
            </Sel>
          </div>
          <div><label style={FL}>Default Scope</label>
            <Sel value={form.scope} onChange={v=>onChange("scope",v)}>
              <option value="global">Global</option><option value="single">Single Dashboard</option>
            </Sel>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// ─── WBS 6: Apply-to-dashboard modal — single dashboard vs global ─────────────
const DASHBOARDS = ["Executive Board","Sales Overview","Finance KPI","Operations Monitor","Marketing Analytics","HR Dashboard"];
const ApplyModal = ({palette,onApply,onClose}) => {
  const [scope,setScope] = useState("global");
  const [dash,setDash]   = useState(DASHBOARDS[0]);
  const cols = palette.colors?.length ? palette.colors : (palette.primaryColors||[]).map(h=>({hex:h}));
  return(
    <Modal title="Apply Palette to Dashboard" onClose={onClose} footer={<>
      <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
      <Btn variant="primary" onClick={()=>onApply(palette,scope,scope==="global"?"all dashboards":dash)}>Apply Palette</Btn>
    </>}>
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <div style={{background:K.s2,borderRadius:K.r,padding:14,border:`1px solid ${K.border}`}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:10}}>{palette.name}</div>
          <Swatches colors={cols} height={48}/>
          <div style={{display:"flex",gap:5,marginTop:10,flexWrap:"wrap"}}>
            {cols.slice(0,6).map((c,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:5,padding:"3px 8px",background:K.surface,border:`1px solid ${K.border}`,borderRadius:6}}><div style={{width:10,height:10,borderRadius:3,background:c.hex}}/><span style={{fontSize:10,fontFamily:"monospace",color:K.sub}}>{c.hex}</span></div>)}
          </div>
        </div>
        {/* Scope toggle — the key WBS 6 requirement */}
        <div>
          <label style={FL}>Apply scope</label>
          <div style={{display:"flex",border:`1px solid ${K.border}`,borderRadius:K.r,overflow:"hidden"}}>
            {[["global","🌍  All Dashboards"],["single","📊  Single Dashboard"]].map(([v,l])=>(
              <button key={v} onClick={()=>setScope(v)} style={{flex:1,padding:"9px 14px",border:"none",fontFamily:"inherit",fontSize:13,fontWeight:500,cursor:"pointer",transition:"all 0.12s",background:scope===v?K.brand:K.surface,color:scope===v?"#fff":K.sub}}>{l}</button>
            ))}
          </div>
        </div>
        {scope==="single"&&<div><label style={FL}>Dashboard</label><Sel value={dash} onChange={setDash}>{DASHBOARDS.map(d=><option key={d}>{d}</option>)}</Sel></div>}
        {/* Mini bar chart preview of palette applied to chart series */}
        <div style={{background:K.s2,borderRadius:K.r,padding:12,border:`1px solid ${K.border}`}}>
          <div style={{fontSize:11,color:K.muted,marginBottom:8}}>Chart series preview</div>
          <div style={{display:"flex",alignItems:"flex-end",gap:3,height:52}}>
            {cols.slice(0,7).map((c,i)=><div key={i} style={{flex:1,background:c.hex,height:`${28+i*4}px`,borderRadius:"3px 3px 0 0"}}/>)}
          </div>
        </div>
      </div>
    </Modal>
  );
};

// ─── WBS 4: Enterprise lock confirmation modal ────────────────────────────────
const LockModal = ({palette,onLock,onClose,saving}) => {
  const [note,setNote] = useState("");
  const cols = palette.colors?.length ? palette.colors : (palette.primaryColors||[]).map(h=>({hex:h}));
  return(
    <Modal title="Lock as Enterprise Palette" onClose={onClose} footer={<>
      <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
      <Btn variant="primary" onClick={()=>onLock(palette,note)} disabled={saving}>{saving?"Locking…":"🔒 Lock Palette"}</Btn>
    </>}>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{padding:12,background:K.amberBg,border:"1px solid #FDE68A",borderRadius:K.r,fontSize:12,color:"#92400E"}}>
          🔒 Enterprise palettes are enforced globally. Only ENTERPRISE_ADMIN can unlock them once dashboards are using them.
        </div>
        <div style={{background:K.s2,borderRadius:K.r,padding:12,border:`1px solid ${K.border}`}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:8}}>{palette.name}</div>
          <Swatches colors={cols} height={32}/>
        </div>
        <div><label style={FL}>Approval note</label><Inp value={note} onChange={setNote} placeholder="Reason for locking this palette…"/></div>
      </div>
    </Modal>
  );
};

// ─── WBS 8 + 9: Version history modal with side-by-side preview and rollback ──
const VersionModal = ({palette,history,onRollback,onClose,saving}) => {
  const [sel,setSel] = useState(null);
  // Normalise version colours from both storage shapes (UI colors[] or raw array)
  const vCols = (v) => (v.colors||v.palette?.primaryColors||[]).map(c=>({hex:c?.hex||c,rgb:hexToRgb(c?.hex||c)}));
  return(
    <Modal title={`Version History — ${palette.name}`} onClose={onClose} wide footer={
      sel&&sel.version!==palette.version
        ?<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn variant="primary" disabled={saving} onClick={()=>onRollback(palette,sel)}>{saving?"Restoring…":`↩ Restore v${sel.version}`}</Btn></>
        :<Btn variant="secondary" onClick={onClose}>Close</Btn>
    }>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        {/* Left: version timeline */}
        <div>
          <div style={{fontSize:12,fontWeight:700,color:K.sub,marginBottom:10}}>All Versions</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {!history.length&&<div style={{textAlign:"center",padding:24,color:K.muted,fontSize:12}}>No history yet — edits appear here automatically.</div>}
            {history.map(v=>(
              <div key={v.vid||v.version} onClick={()=>setSel(v)} style={{padding:"10px 12px",borderRadius:K.r,cursor:"pointer",transition:"all 0.12s",border:`1.5px solid ${sel?.vid===v.vid||sel?.version===v.version?K.brand:K.border}`,background:sel?.vid===v.vid||sel?.version===v.version?K.brandL:K.s2}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <span style={{fontSize:11,fontFamily:"monospace",fontWeight:700,padding:"2px 7px",borderRadius:5,background:v.version===palette.version?K.brand:"#F1F5F9",color:v.version===palette.version?"#fff":K.sub}}>v{v.version}</span>
                    {v.version===palette.version&&<Badge label="CURRENT" color={K.green} bg={K.greenBg}/>}
                  </div>
                  <span style={{fontSize:10,color:K.muted}}>{new Date(v.at||v.timestamp).toLocaleDateString()}</span>
                </div>
                <div style={{fontSize:11,color:K.sub,marginTop:4}}>{v.by||v.changedBy||"system"} · {v.note||v.reason||"—"}</div>
                <div style={{marginTop:6}}><Swatches colors={vCols(v)} height={18}/></div>
              </div>
            ))}
          </div>
        </div>
        {/* Right: selected version preview + restore warning */}
        <div>
          <div style={{fontSize:12,fontWeight:700,color:K.sub,marginBottom:10}}>Preview</div>
          {sel?(
            <div style={{padding:14,background:K.s2,borderRadius:K.r,border:`1px solid ${K.border}`}}>
              <div style={{fontSize:13,fontWeight:600,marginBottom:10}}>v{sel.version} — {sel.note||sel.reason||"—"}</div>
              <Swatches colors={vCols(sel)} height={44}/>
              <PreviewGrid colors={vCols(sel)}/>
              {sel.version!==palette.version&&<div style={{marginTop:12,padding:"8px 10px",background:K.amberBg,border:"1px solid #FDE68A",borderRadius:K.r,fontSize:11,color:"#92400E"}}>Restoring will create v{palette.version+1} with these colours in the database.</div>}
            </div>
          ):(
            <div style={{textAlign:"center",padding:40,color:K.muted,fontSize:12}}>Select a version on the left to preview it</div>
          )}
        </div>
      </div>
    </Modal>
  );
};

// ─── WBS 3: Preset library panel — filterable by category, searchable by name ──
// FIX: each preset card manages its own independent boolean loading state via a
//      Map keyed by preset id. No other button is affected when one is saving.
const PresetCard = ({preset, onUse}) => {
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(async () => {
    if (loading) return;           // ignore accidental double-click on same button
    setLoading(true);
    try {
      await onUse(preset);
    } finally {
      setLoading(false);
    }
  }, [loading, onUse, preset]);

  return (
    <div style={{background:K.surface,border:`1px solid ${K.border}`,borderRadius:K.rL,padding:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <span style={{fontSize:13,fontWeight:600,color:K.text}}>{preset.name}</span>
        <Badge label={preset.cat} color={K.brand} bg={K.brandL}/>
      </div>
      <Swatches colors={preset.colors.map(h=>({hex:h}))} height={36}/>
      {/* Only THIS button reacts — disabled & label change only for the clicked card */}
      <Btn sm variant="primary" full style={{marginTop:10}} disabled={loading} onClick={handleClick}>
        {loading ? "Adding…" : "Use this Preset"}
      </Btn>
    </div>
  );
};

const PresetsPanel = ({onUse}) => {
  const [cat, setCat] = useState("All");
  const [q,   setQ]   = useState("");

  const list = useMemo(()=>PRESETS.filter(p=>(cat==="All"||p.cat===cat)&&(!q||p.name.toLowerCase().includes(q.toLowerCase()))),[cat,q]);

  return(
    <div>
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        <Inp value={q} onChange={setQ} placeholder="Search presets…" style={{maxWidth:220}}/>
        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          {PRESET_CATS.map(c=>(
            <button key={c} onClick={()=>setCat(c)} style={{padding:"5px 11px",borderRadius:20,border:`1px solid ${cat===c?K.brand:K.border}`,background:cat===c?K.brand:K.surface,color:cat===c?"#fff":K.sub,fontSize:11,fontWeight:500,cursor:"pointer",transition:"all 0.12s"}}>{c}</button>
          ))}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(265px,1fr))",gap:10}}>
        {list.map(p=>(
          <PresetCard key={p.id} preset={p} onUse={onUse}/>
        ))}
        {!list.length&&<div style={{gridColumn:"1/-1",textAlign:"center",padding:40,color:K.muted}}>No presets match.</div>}
      </div>
    </div>
  );
};

// ─── WBS 4: Enterprise palettes panel — lock / unlock with usage guard ─────────
const EnterprisePanel = ({palettes,onLock,onUnlock,busy}) => {
  const locked   = palettes.filter(p=>p.isLocked);
  const lockable = palettes.filter(p=>!p.isLocked&&p.status==="active");
  const colsOf   = p => p.colors?.length ? p.colors : (p.primaryColors||[]).map(h=>({hex:h}));
  return(
    <div>
      <div style={{padding:"11px 14px",background:K.amberBg,border:"1px solid #FDE68A",borderRadius:K.r,marginBottom:20,fontSize:12,color:"#92400E"}}>
        🔒 Enterprise palettes are enforced globally. Palettes in use cannot be unlocked until all dashboards migrate.
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,alignItems:"start"}}>
        <div style={{background:K.surface,border:`1px solid ${K.border}`,borderRadius:K.rL,padding:18}}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>Locked Palettes ({locked.length})</div>
          {!locked.length&&<div style={{textAlign:"center",padding:24,color:K.muted,fontSize:12}}>No enterprise palettes yet.</div>}
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {locked.map(p=>(
              <div key={p.id} style={{padding:12,background:K.amberBg,border:"1px solid #FDE68A",borderRadius:K.r}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:600}}>🔒 {p.name}</div>
                    <div style={{fontSize:11,color:"#92400E",marginTop:2}}>Locked by {p.lockedBy||"admin"} · {p.lockedAt?new Date(p.lockedAt).toLocaleDateString():"—"}</div>
                    {p.usedIn?.length>0&&<div style={{fontSize:11,color:K.amber,marginTop:2}}>In use: {p.usedIn.join(", ")}</div>}
                  </div>
                  <Btn sm variant="danger" disabled={p.usedIn?.length>0||busy} onClick={()=>onUnlock(p)}>Unlock</Btn>
                </div>
                <Swatches colors={colsOf(p)} height={28}/>
                {p.usedIn?.length>0&&<div style={{fontSize:10,color:"#92400E",marginTop:5}}>Remove from all dashboards to enable unlock.</div>}
              </div>
            ))}
          </div>
        </div>
        <div style={{background:K.surface,border:`1px solid ${K.border}`,borderRadius:K.rL,padding:18}}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>Lock an Active Palette</div>
          {!lockable.length&&<div style={{textAlign:"center",padding:24,color:K.muted,fontSize:12}}>No active unlocked palettes available.</div>}
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {lockable.map(p=>(
              <div key={p.id} style={{padding:10,border:`1px solid ${K.border}`,borderRadius:K.r}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <span style={{fontSize:13,fontWeight:500}}>{p.name}</span>
                  <Btn sm disabled={busy} onClick={()=>onLock(p)}>Lock</Btn>
                </div>
                <Swatches colors={colsOf(p)} height={24}/>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── WBS 10: AI recommendation panel — heuristic engine with mood/industry/dept ─
const MOODS = ["professional","energetic","calm","innovative","luxurious","natural","playful","dark","pastel"];

// Each AI result card owns its own loading state — clicking one never affects others
const AIResultCard = ({rec, ind, dept, onAdd}) => {
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      await onAdd(rec, ind, dept);
    } finally {
      setLoading(false);
    }
  }, [loading, onAdd, rec, ind, dept]);

  return (
    <div style={{background:K.surface,border:`1px solid ${K.border}`,borderRadius:K.rL,padding:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
        <div><div style={{fontSize:13,fontWeight:600}}>{rec.name}</div><div style={{fontSize:11,color:K.sub,marginTop:2}}>{rec.rationale}</div></div>
        <Badge label={(rec.source||"AI").toUpperCase()} color={K.brand} bg={K.brandL}/>
      </div>
      <Swatches colors={rec.colors} height={40}/>
      <div style={{display:"flex",gap:5,marginTop:8,flexWrap:"wrap"}}>
        {rec.colors.map((c,i)=><span key={i} style={{fontSize:9,fontFamily:"monospace",padding:"2px 6px",background:K.s2,border:`1px solid ${K.border}`,borderRadius:4,color:K.sub}}>{c.hex}</span>)}
      </div>
      {/* Only THIS card's button reacts — all other cards are completely unaffected */}
      <div style={{marginTop:12}}>
        <Btn sm variant="primary" disabled={loading} onClick={handleClick}>
          {loading ? "Saving…" : "+ Add to My Palettes"}
        </Btn>
      </div>
    </div>
  );
};

const AIPanel = ({onAdd}) => {
  const [ind,setInd]   = useState("");
  const [dept,setDept] = useState("");
  const [mood,setMood] = useState("");
  const [res,setRes]   = useState([]);
  const [load,setLoad] = useState(false);

  const run = useCallback(async()=>{
    if(!ind&&!dept&&!mood) return;
    setLoad(true); setRes([]);
    const recs = await paletteService.getAIRecommendations(ind,dept,mood,INDUSTRY_MAP,DEPT_MAP,PRESETS);
    setRes(recs); setLoad(false);
  },[ind,dept,mood]);

  return(
    <div style={{display:"grid",gridTemplateColumns:"300px 1fr",gap:20,alignItems:"start"}}>
      <div style={{background:K.surface,border:`1px solid ${K.border}`,borderRadius:K.rL,padding:20}}>
        <div style={{fontSize:13,fontWeight:700,color:K.text,marginBottom:16}}>Parameters</div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div><label style={FL}>Industry</label><Sel value={ind} onChange={setInd}><option value="">Select industry…</option>{Object.keys(INDUSTRY_MAP).map(k=><option key={k}>{k}</option>)}</Sel></div>
          <div><label style={FL}>Department</label><Sel value={dept} onChange={setDept}><option value="">Select department…</option>{Object.keys(DEPT_MAP).map(k=><option key={k}>{k}</option>)}</Sel></div>
          <div>
            <label style={FL}>Mood / Tone</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
              {MOODS.map(m=><button key={m} onClick={()=>setMood(mood===m?"":m)} style={{padding:"4px 10px",borderRadius:20,fontSize:11,fontWeight:500,cursor:"pointer",border:`1px solid ${mood===m?K.brand:K.border}`,background:mood===m?K.brand:K.surface,color:mood===m?"#fff":K.sub,transition:"all 0.12s",textTransform:"capitalize"}}>{m}</button>)}
            </div>
          </div>
          <Btn variant="primary" full onClick={run} disabled={load||(!ind&&!dept&&!mood)} style={{marginTop:4}}>
            {load?"✦ Generating…":"✦ Generate Recommendations"}
          </Btn>
        </div>
      </div>
      <div>
        {load&&<div style={{textAlign:"center",padding:48,color:K.muted}}><div style={{fontSize:22,marginBottom:8}}>⟳</div><div style={{fontSize:13}}>Analysing parameters…</div></div>}
        {!load&&!res.length&&<div style={{background:K.surface,border:`1px solid ${K.border}`,borderRadius:K.rL,padding:48,textAlign:"center",color:K.muted}}><div style={{fontSize:28,marginBottom:10}}>✦</div><div style={{fontSize:14,fontWeight:500,color:K.sub}}>No recommendations yet</div><div style={{fontSize:12,marginTop:4}}>Set parameters and click Generate</div></div>}
        {!load&&res.length>0&&(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{display:"flex",gap:8,alignItems:"center"}}><Badge label="⚡ HEURISTIC ENGINE" color="#6D28D9" bg="#F5F3FF"/><span style={{fontSize:11,color:K.muted}}>Confidence based on parameters provided</span></div>
            {res.map(r=>(
              <AIResultCard key={r.id} rec={r} ind={ind} dept={dept} onAdd={onAdd}/>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── WBS 8 + 9: Versions overview — shows last change per palette ──────────────
const VersionsPanel = ({palettes,onView}) => (
  <div>
    <div style={{fontSize:13,color:K.sub,marginBottom:16}}>Every palette edit is versioned and stored. Click to view history and roll back.</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:12}}>
      {palettes.map(p=>{
        const hist = paletteService.getVersionHistory(p.id);
        const last = hist[hist.length-1];
        const cols = p.colors?.length ? p.colors : (p.primaryColors||[]).map(h=>({hex:h}));
        return(
          <div key={p.id} style={{background:K.surface,border:`1px solid ${K.border}`,borderRadius:K.rL,padding:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:K.text}}>{p.name}</div>
                <div style={{fontSize:11,color:K.muted,marginTop:2}}><span style={{fontFamily:"monospace"}}>v{p.version||1}</span> · {hist.length} version{hist.length!==1?"s":""}</div>
              </div>
              <Btn sm onClick={()=>onView(p)}>View History</Btn>
            </div>
            <Swatches colors={cols} height={28}/>
            {last&&<div style={{marginTop:8,fontSize:11,color:K.muted,paddingTop:6,borderTop:`1px solid ${K.border}`}}>Last: {last.note||last.reason} · {last.by||last.changedBy} · {new Date(last.at||last.timestamp).toLocaleDateString()}</div>}
          </div>
        );
      })}
    </div>
  </div>
);

// ─── WBS 11: Audit log — filterable, searchable, CSV + JSON export ─────────────
const AUDIT_ACTIONS = ["all","created","updated","deleted","applied","duplicated","locked","unlocked","rolled_back","CREATE","EDIT","DELETE","APPLY","DUPLICATE","ROLLBACK"];
const AuditPanel = ({audit,onExport}) => {
  const [action,setAct] = useState("all");
  const [search,setSrch] = useState("");
  const filtered = useMemo(()=>audit.filter(e=>{
    if(action!=="all"&&e.action?.toLowerCase()!==action.toLowerCase()) return false;
    const name=e.name||e.newData?.name||e.oldData?.name||"";
    const by=e.by||e.userName||"";
    if(search&&!name.toLowerCase().includes(search.toLowerCase())&&!by.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).slice(0,100),[audit,action,search]);

  return(
    <div>
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        <Inp value={search} onChange={setSrch} placeholder="Search by name or user…" style={{maxWidth:240}}/>
        <Sel value={action} onChange={setAct} style={{width:"auto",minWidth:160}}>
          <option value="all">All Actions</option>
          {["created","updated","deleted","applied","duplicated","locked","unlocked","rolled_back"].map(a=><option key={a} value={a}>{a.replace("_"," ")}</option>)}
        </Sel>
        <span style={{fontSize:12,color:K.muted,marginLeft:"auto"}}>{filtered.length} entries</span>
        <div style={{display:"flex",gap:6}}><Btn sm variant="secondary" onClick={()=>onExport("csv")}>↓ CSV</Btn><Btn sm variant="secondary" onClick={()=>onExport("json")}>↓ JSON</Btn></div>
      </div>
      <div style={{background:K.surface,border:`1px solid ${K.border}`,borderRadius:K.rL,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead>
            <tr style={{background:"#F8FAFC",borderBottom:`1px solid ${K.border}`}}>
              {["Time","Palette","Action","User","Details"].map(h=><th key={h} style={{textAlign:"left",padding:"10px 14px",fontSize:10,fontWeight:700,color:K.muted,textTransform:"uppercase",letterSpacing:"0.07em"}}>{h}</th>)}
             </tr>
          </thead>
          <tbody>
            {!filtered.length&&<tr><td colSpan={5} style={{textAlign:"center",padding:32,color:K.muted}}>No entries found</td></tr>}
            {filtered.map(e=>{
              const act=e.action||"";
              const [ec,ebg]=A_COL[act.toLowerCase()]||[K.sub,"#F1F5F9"];
              return(
                <tr key={e.id} style={{borderBottom:`1px solid #F1F5F9`}}>
                  <td style={{padding:"10px 14px",color:K.muted,whiteSpace:"nowrap"}}>{e.at||e.timestamp?new Date(e.at||e.timestamp).toLocaleString():"—"}</td>
                  <td style={{padding:"10px 14px",fontWeight:500,maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.name||e.newData?.name||e.oldData?.name||"—"}</td>
                  <td style={{padding:"10px 14px"}}><Badge label={act.replace("_"," ").toUpperCase()} color={ec} bg={ebg}/></td>
                  <td style={{padding:"10px 14px",fontFamily:"monospace",color:K.sub}}>{e.by||e.userName||"system"}</td>
                  <td style={{padding:"10px 14px",color:K.muted,maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.detail||e.reason||""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT — orchestrates all WBS items, all DB operations via paletteService
// ═══════════════════════════════════════════════════════════════════════════════
function PaletteManager() {
  const [palettes,   setPalettes]   = useState([]);
  const [audit,      setAudit]      = useState([]);
  const [tab,        setTab]        = useState("palettes");
  const [expandedId, setExpandedId] = useState(null);
  const [statusFilter,setSF]        = useState("all");
  const [searchQ,    setQ]          = useState("");
  const [toasts,     setToasts]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);

  const [editModal,    setEditModal]    = useState(null);
  const [applyModal,   setApplyModal]   = useState(null);
  const [lockModal,    setLockModal]    = useState(null);
  const [versionModal, setVersionModal] = useState(null);

  // Show slide-in toast and auto-dismiss after 3.5 s
  const toast = useCallback((msg,type="success")=>{ const id=uid(); setToasts(t=>[...t,{id,msg,type}]); setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),3500); },[]);

  // Fetch all palettes from DB and refresh audit log from localStorage
  const reload = useCallback(async()=>{
    setLoading(true);
    const data = await paletteService.getAll();
    setPalettes(data);
    setAudit(paletteService.getAuditLogs());
    setLoading(false);
  },[]);
  useEffect(()=>{ reload(); },[reload]);

  // Filtered palette list — applies both status filter and search query
  const filtered = useMemo(()=>palettes.filter(p=>(statusFilter==="all"||p.status===statusFilter)&&(!searchQ||p.name.toLowerCase().includes(searchQ.toLowerCase())||(p.industry||"").toLowerCase().includes(searchQ.toLowerCase()))),[palettes,statusFilter,searchQ]);

  // Stats bar values
  const stats = useMemo(()=>({ total:palettes.length, active:palettes.filter(p=>p.status==="active").length, draft:palettes.filter(p=>p.status==="draft").length, locked:palettes.filter(p=>p.isLocked).length }),[palettes]);

  // WBS 7: Create or edit — validates hex input then persists to DB
  const savePalette = useCallback(async()=>{
    const form=editModal;
    const hexes=(form.colors||"").split(",").map(s=>s.trim()).filter(isValidHex);
    if(!form.name?.trim()){ toast("Name is required","error"); return; }
    if(hexes.length<2){ toast("Enter at least 2 valid hex colours","error"); return; }
    setSaving(true);
    try{
      if(form.id){ 
        await paletteService.update(form.id, {...form, colors: hexes}); 
        toast(`"${form.name}" updated`);
      } else { 
        await paletteService.create({...form, colors: hexes.join(", ")}); 
        toast(`"${form.name}" created`);
      }
      setAudit(paletteService.getAuditLogs()); 
      await reload(); 
      setEditModal(null);
    }catch(err){ toast(`Save failed: ${err.message}`,"error"); }
    finally{ setSaving(false); }
  },[editModal,reload,toast]);

  // WBS 7: Delete — blocks if palette is enterprise-locked
  const deletePalette = useCallback(async(id,name)=>{
    const p=palettes.find(x=>x.id===id);
    if(!p||p.isLocked){ toast("Cannot delete a locked palette","error"); return; }
    if(!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setSaving(true);
    try{ 
      await paletteService.delete(id, name); 
      setExpandedId(null); 
      setAudit(paletteService.getAuditLogs()); 
      await reload(); 
      toast(`"${name}" deleted`); 
    }
    catch(err){ toast(`Delete failed: ${err.message}`,"error"); }
    finally{ setSaving(false); }
  },[palettes,reload,toast]);

  // WBS 7: Duplicate — creates a draft copy with "(Copy)" suffix
  const duplicatePalette = useCallback(async(palette)=>{
    setSaving(true);
    try{ 
      await paletteService.duplicate(palette); 
      setAudit(paletteService.getAuditLogs()); 
      await reload(); 
      toast(`Duplicated "${palette.name}"`); 
    }
    catch(err){ toast(`Duplicate failed: ${err.message}`,"error"); }
    finally{ setSaving(false); }
  },[reload,toast]);

  // WBS 6: Apply — injects CSS vars and logs to audit
  const applyPalette = useCallback((palette,scope,target)=>{
    paletteService.applyToDashboard(palette,scope,target);
    setAudit(paletteService.getAuditLogs());
    toast(`"${palette.name}" applied to ${scope==="global"?"all dashboards":target}`);
    setApplyModal(null);
  },[toast]);

  // WBS 4: Lock — persists enterprise lock to DB
  const lockPalette = useCallback(async(palette,note)=>{
    setSaving(true);
    try{ 
      const locked=await paletteService.lock(palette.id,palette,note); 
      setPalettes(ps=>ps.map(p=>p.id===palette.id?locked:p)); 
      setAudit(paletteService.getAuditLogs()); 
      toast(`"${palette.name}" locked`); 
      setLockModal(null); 
    }
    catch(err){ toast(`Lock failed: ${err.message}`,"error"); }
    finally{ setSaving(false); }
  },[toast]);

  // WBS 4: Unlock — blocked if palette is still in use by dashboards
  const unlockPalette = useCallback(async(palette)=>{
    if(palette.usedIn?.length){ toast(`Cannot unlock — used in ${palette.usedIn.length} dashboard(s)`,"error"); return; }
    setSaving(true);
    try{ 
      const unlocked=await paletteService.unlock(palette.id,palette); 
      setPalettes(ps=>ps.map(p=>p.id===palette.id?unlocked:p)); 
      setAudit(paletteService.getAuditLogs()); 
      toast(`"${palette.name}" unlocked`); 
    }
    catch(err){ toast(`Unlock failed: ${err.message}`,"error"); }
    finally{ setSaving(false); }
  },[toast]);

  // WBS 9: Rollback — restores colour snapshot to DB as new version
  const rollback = useCallback(async(palette,ver)=>{
    setSaving(true);
    try{ 
      const restored=await paletteService.rollback(palette,ver); 
      setPalettes(ps=>ps.map(p=>p.id===palette.id?restored:p)); 
      setAudit(paletteService.getAuditLogs()); 
      toast(`Rolled back "${palette.name}" to v${ver.version}`); 
      setVersionModal(null); 
    }
    catch(err){ toast(`Rollback failed: ${err.message}`,"error"); }
    finally{ setSaving(false); }
  },[toast]);

  // WBS 3: Use preset — creates a DB draft from preset colour list and logs audit
  const usePreset = useCallback(async(preset)=>{
    // Note: setSaving is intentionally NOT called here.
    // PresetsPanel manages its own per-button savingId state for granular loading.
    try{ 
      const created = await paletteService.create({
        name: preset.name,
        description: `From preset: ${preset.cat}`,
        industry: "",
        department: "",
        status: "draft",
        scope: "global",
        colors: preset.colors.join(", "),
        primaryColors: preset.colors
      }); 
      // Add audit log for preset usage
      paletteService.addAuditLog('created', created.id, null, created, `Created from preset: ${preset.name}`);
      setAudit(paletteService.getAuditLogs()); 
      await reload(); 
      toast(`"${preset.name}" added`); 
    }
    catch(err){ toast(`Failed: ${err.message}`,"error"); }
  },[reload,toast]);

  // WBS 10: Add AI recommendation — creates DB draft from AI-suggested colours and logs audit
  const addAIResult = useCallback(async(rec,ind,dept)=>{
    try{ 
      const created = await paletteService.create({
        name: rec.name,
        description: rec.reason || rec.rationale || `AI recommended palette`,
        industry: ind,
        department: dept,
        status: "draft",
        scope: "global",
        colors: rec.colors.map(c => c.hex || c).join(", "),
        primaryColors: rec.colors.map(c => c.hex || c)
      }); 
      // Add audit log for AI recommendation usage
      paletteService.addAuditLog('created', created.id, null, created, `Created from AI recommendation: ${rec.source || 'AI'} - ${rec.reason || ''}`);
      setAudit(paletteService.getAuditLogs()); 
      await reload(); 
      toast(`"${rec.name}" added`); 
    }
    catch(err){ toast(`Failed: ${err.message}`,"error"); }
  },[reload,toast]);

  // WBS 11: Export audit log as CSV or JSON file download
  const exportAudit = useCallback((fmt)=>{
    const rows=[...audit]; const a=document.createElement("a");
    if(fmt==="csv"){ 
      const headers = ["id","palette","action","user","timestamp","detail"];
      const csvRows = [headers.join(",")];
      for (const r of rows) {
        const row = [
          `"${r.id || ''}"`,
          `"${(r.name || r.newData?.name || r.oldData?.name || '').replace(/"/g, '""')}"`,
          `"${r.action || ''}"`,
          `"${r.by || r.userName || 'system'}"`,
          `"${r.at || r.timestamp || ''}"`,
          `"${(r.detail || r.reason || '').replace(/"/g, '""')}"`
        ];
        csvRows.push(row.join(","));
      }
      a.href=URL.createObjectURL(new Blob([csvRows.join("\n")],{type:"text/csv"})); 
      a.download="palette-audit.csv"; 
    }
    else{ 
      a.href=URL.createObjectURL(new Blob([JSON.stringify(rows,null,2)],{type:"application/json"})); 
      a.download="palette-audit.json"; 
    }
    a.click();
  },[audit]);

  // Import JSON file — parses and bulk-creates palettes in DB with audit logs
  const importJSON = useCallback(()=>{
    const inp=document.createElement("input"); inp.type="file"; inp.accept=".json";
    inp.onchange=async(e)=>{
      const f=e.target.files[0]; if(!f) return;
      const r=new FileReader();
      r.onload=async(ev)=>{
        try{
          const arr=JSON.parse(ev.target.result); const list=Array.isArray(arr)?arr:[arr]; let ct=0;
          for(const raw of list){ 
            if(!raw.name) continue; 
            const hexes=(raw.colors||raw.primaryColors||[]).map(c=>c?.hex||c).filter(isValidHex); 
            if(!hexes.length) continue; 
            setSaving(true); 
            try{ 
              const created = await paletteService.create({...raw, colors: hexes.join(", "), primaryColors: hexes});
              paletteService.addAuditLog('created', created.id, null, created, `Imported from JSON file`);
              ct++; 
            }catch(err){ console.error('Import error:', err); } 
            finally{ setSaving(false); } 
          }
          setAudit(paletteService.getAuditLogs()); 
          await reload(); 
          toast(`Imported ${ct} palette${ct!==1?"s":""}`);
        }catch(err){ toast("Invalid JSON file","error"); }
      };
      r.readAsText(f);
    };
    inp.click();
  },[reload,toast]);

  const TABS = [{id:"palettes",label:"My Palettes",count:palettes.length},{id:"presets",label:"Preset Library",count:PRESETS.length},{id:"enterprise",label:"Enterprise",count:stats.locked},{id:"ai",label:"AI Recommender"},{id:"versions",label:"Versions"},{id:"audit",label:"Audit Log",count:audit.length}];
  const NEW_FORM = {id:null,name:"",description:"",industry:"",department:"",status:"draft",scope:"global",colors:"#003366, #0055A4, #0077CC, #4499DD, #88BBEE, #CCE4FF, #F5F7FA"};

  return(
    <div style={{fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,sans-serif",background:K.bg,minHeight:"100vh",color:K.text}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box}
        input:focus,select:focus{outline:2px solid #bfdbfe!important;outline-offset:1px}
        @keyframes _tin{from{transform:translateX(16px);opacity:0}to{transform:translateX(0);opacity:1}}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#f1f5f9}::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:10px}
        button:hover:not(:disabled){filter:brightness(0.94)}
      `}</style>

      {/* Top navigation bar with saving indicator */}
      <div style={{background:"#0F172A",borderBottom:"1px solid #1E293B",position:"sticky",top:0,zIndex:200}}>
        <div style={{padding:"0 28px",display:"flex",alignItems:"center",gap:14,height:52}}>
          <span style={{fontWeight:700,fontSize:15,color:"#F1F5F9",letterSpacing:"-0.02em"}}>Nox Analytics</span>
          <span style={{width:1,height:18,background:"#334155"}}/>
          <span style={{fontSize:12,color:"#64748B",fontWeight:500}}>AVIE · Palette Engine</span>
          {saving&&<span style={{fontSize:11,color:"#60A5FA",marginLeft:4}}>● Saving to DB…</span>}
          <div style={{marginLeft:"auto"}}><span style={{fontSize:11,color:"#64748B",padding:"3px 10px",background:"#1E293B",borderRadius:6}}>pratik.ghuge · PALETTE_ADMIN</span></div>
        </div>
        <div style={{display:"flex",padding:"0 28px",gap:0}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"10px 16px",background:"none",border:"none",cursor:"pointer",borderBottom:`2px solid ${tab===t.id?"#3B82F6":"transparent"}`,fontSize:12,fontWeight:tab===t.id?600:400,color:tab===t.id?"#60A5FA":"#64748B",display:"flex",alignItems:"center",gap:5,whiteSpace:"nowrap",transition:"color 0.12s"}}>
              {t.label}
              {t.count!=null&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:8,background:tab===t.id?"#1D4ED8":"#334155",color:tab===t.id?"#BFDBFE":"#94A3B8"}}>{t.count}</span>}
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:"24px 28px",maxWidth:1200,margin:"0 auto"}}>

        {/* My Palettes tab */}
        {tab==="palettes"&&(
          <div>
            {/* Stats row */}
            <div style={{display:"flex",gap:10,marginBottom:20}}>
              {[["Total",stats.total,K.brand],["Active",stats.active,K.green],["Draft",stats.draft,"#92400E"],["Locked",stats.locked,K.amber]].map(([l,v,c])=>(
                <div key={l} style={{background:K.surface,border:`1px solid ${K.border}`,borderRadius:K.r,padding:"14px 20px",minWidth:80}}>
                  <div style={{fontSize:22,fontWeight:700,color:c}}>{v}</div>
                  <div style={{fontSize:11,color:K.muted,fontWeight:500,marginTop:2}}>{l}</div>
                </div>
              ))}
            </div>
            {/* Search, status filter, action buttons */}
            <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
              <Inp value={searchQ} onChange={setQ} placeholder="Search palettes…" style={{maxWidth:240}}/>
              <Sel value={statusFilter} onChange={setSF} style={{width:"auto",minWidth:140}}>
                <option value="all">All Status</option><option value="active">Active</option><option value="draft">Draft</option><option value="locked">Locked</option><option value="archived">Archived</option>
              </Sel>
              <div style={{marginLeft:"auto",display:"flex",gap:6}}>
                <Btn sm variant="secondary" onClick={importJSON}>↑ Import JSON</Btn>
                <Btn sm variant="primary" onClick={()=>setEditModal({...NEW_FORM})}>+ New Palette</Btn>
              </div>
            </div>
            {/* Palette card grid */}
            {loading?(
              <div style={{textAlign:"center",padding:56,color:K.muted}}><div style={{fontSize:22,marginBottom:8}}>⟳</div><div style={{fontSize:13}}>Loading from database…</div></div>
            ):!filtered.length?(
              <div style={{textAlign:"center",padding:56,color:K.muted}}>
                <div style={{fontSize:32,marginBottom:10}}>🎨</div>
                <div style={{fontSize:14,fontWeight:500,color:K.sub}}>No palettes found</div>
                <div style={{fontSize:12,marginTop:4}}>Adjust filters or create a new palette</div>
              </div>
            ):(
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:12}}>
                {filtered.map(p=>(
                  <PaletteCard key={p.id} palette={p} expanded={expandedId===p.id}
                    onToggle={()=>setExpandedId(expandedId===p.id?null:p.id)}
                    onEdit={pal=>setEditModal({...pal,colors:(pal.colors||[]).map(c=>c.hex).join(", ")||(pal.primaryColors||[]).join(", ")||""})}
                    onDuplicate={duplicatePalette} onDelete={deletePalette}
                    onApply={pal=>setApplyModal(pal)}
                    onHistory={pal=>setVersionModal({palette:pal,history:[...paletteService.getVersionHistory(pal.id)].reverse()})}/>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PresetsPanel no longer receives `saving` — it manages its own per-button state */}
        {tab==="presets"   &&<PresetsPanel onUse={usePreset}/>}
        {tab==="enterprise"&&<EnterprisePanel palettes={palettes} onLock={p=>setLockModal(p)} onUnlock={unlockPalette} busy={saving}/>}
        {tab==="ai"        &&<AIPanel onAdd={addAIResult}/>}
        {tab==="versions"  &&<VersionsPanel palettes={palettes} onView={p=>setVersionModal({palette:p,history:[...paletteService.getVersionHistory(p.id)].reverse()})}/>}
        {tab==="audit"     &&<AuditPanel audit={audit} onExport={exportAudit}/>}
      </div>

      {/* Modals — only mounted when non-null */}
      {editModal   &&<EditModal    form={editModal}   onChange={(k,v)=>setEditModal(f=>({...f,[k]:v}))} onSave={savePalette}   onClose={()=>setEditModal(null)}    saving={saving}/>}
      {applyModal  &&<ApplyModal   palette={applyModal}                                                  onApply={applyPalette} onClose={()=>setApplyModal(null)}/>}
      {lockModal   &&<LockModal    palette={lockModal}                                                   onLock={lockPalette}   onClose={()=>setLockModal(null)}    saving={saving}/>}
      {versionModal&&<VersionModal palette={versionModal.palette} history={versionModal.history}         onRollback={rollback}  onClose={()=>setVersionModal(null)} saving={saving}/>}

      <Toasts toasts={toasts}/>
    </div>
  );
}

// ─── Exports — both default and named for maximum import flexibility ───────────
export default PaletteManager;
export { PaletteManager };