// API endpoint for backend connection
const API_URL = 'http://localhost:3001/api/palettes';

// Version history storage (in localStorage for demo)
let versionHistory = {};

// Helper to generate unique IDs for audit logs
const generateId = () => Date.now() + '-' + Math.random().toString(36).substr(2, 6);

// Helper to extract name from palette data (handles different shapes)
const getPaletteName = (palette) => {
  if (!palette) return 'unknown';
  if (typeof palette === 'string') return palette;
  return palette.name || palette.palette?.name || 'unknown';
};

// Helper to extract colors from palette data
const getPaletteColors = (palette) => {
  if (!palette) return [];
  if (palette.colors) return palette.colors;
  if (palette.primaryColors) return palette.primaryColors;
  if (palette.palette?.primaryColors) return palette.palette.primaryColors;
  return [];
};

// ═══════════════════════════════════════════════════════════════════════════════
// AI RECOMMENDATION ENGINE WITH COLOR THEORY
// ═══════════════════════════════════════════════════════════════════════════════
const aiRecommendationService = {
  // Color conversion utilities
  hexToRgb(hex) {
    const c = hex.replace("#", "");
    return { r: parseInt(c.slice(0,2),16), g: parseInt(c.slice(2,4),16), b: parseInt(c.slice(4,6),16) };
  },
  
  rgbToHex(r, g, b) {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  },
  
  hslToRgb(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  },
  
  rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
        default: h = 0;
      }
      h *= 60;
    }
    return { h, s: s * 100, l: l * 100 };
  },
  
  adjustColor(color, amount) {
    const { r, g, b } = this.hexToRgb(color);
    return this.rgbToHex(
      Math.max(0, Math.min(255, r + amount)),
      Math.max(0, Math.min(255, g + amount)),
      Math.max(0, Math.min(255, b + amount))
    );
  },
  
  getComplementary(color) {
    const { r, g, b } = this.hexToRgb(color);
    return this.rgbToHex(255 - r, 255 - g, 255 - b);
  },
  
  getAnalogous(color) {
    const { r, g, b } = this.hexToRgb(color);
    const { h, s, l } = this.rgbToHsl(r, g, b);
    const left = this.hslToRgb((h + 30) % 360, s, l);
    const right = this.hslToRgb((h - 30 + 360) % 360, s, l);
    return [this.rgbToHex(left.r, left.g, left.b), this.rgbToHex(right.r, right.g, right.b)];
  },
  
  getTriadic(color) {
    const { r, g, b } = this.hexToRgb(color);
    const { h, s, l } = this.rgbToHsl(r, g, b);
    const color1 = this.hslToRgb((h + 120) % 360, s, l);
    const color2 = this.hslToRgb((h - 120 + 360) % 360, s, l);
    return [this.rgbToHex(color1.r, color1.g, color1.b), this.rgbToHex(color2.r, color2.g, color2.b)];
  },
  
  getMonochromatic(baseColor, count = 7) {
    const { r, g, b } = this.hexToRgb(baseColor);
    const { h, s, l } = this.rgbToHsl(r, g, b);
    const shades = [];
    for (let i = 0; i < count; i++) {
      const newL = Math.max(10, Math.min(90, l - 20 + (i * 15)));
      const shade = this.hslToRgb(h, s, newL);
      shades.push(this.rgbToHex(shade.r, shade.g, shade.b));
    }
    return shades;
  },
  
  getSplitComplementary(baseColor) {
    const { r, g, b } = this.hexToRgb(baseColor);
    const { h, s, l } = this.rgbToHsl(r, g, b);
    const left = this.hslToRgb((h + 150) % 360, s, l);
    const right = this.hslToRgb((h - 150 + 360) % 360, s, l);
    return [this.rgbToHex(left.r, left.g, left.b), this.rgbToHex(right.r, right.g, right.b)];
  },
  
  getIndustryColors(industry) {
    const industryMap = {
      "Finance & Banking": { primary: "#1E40AF", secondary: "#3B82F6", accent: "#F59E0B", reason: "Navy and gold convey trust, stability, and authority in financial contexts", psychology: "Professional, trustworthy, authoritative" },
      "Healthcare & Pharma": { primary: "#0891B2", secondary: "#22D3EE", accent: "#10B981", reason: "Teals and mint greens signal hygiene, care, and medical precision", psychology: "Clean, calming, trustworthy" },
      "Technology & SaaS": { primary: "#6C63FF", secondary: "#F72585", accent: "#00BCD4", reason: "Electric purples and cyans represent innovation and digital-first thinking", psychology: "Innovative, modern, energetic" },
      "Retail & E-Commerce": { primary: "#FF6B35", secondary: "#F7C59F", accent: "#EF4444", reason: "Vibrant oranges drive engagement, urgency, and call-to-action", psychology: "Energetic, urgent, exciting" },
      "Manufacturing": { primary: "#2C2C54", secondary: "#474787", accent: "#F97F51", reason: "Industrial blues and oranges reflect precision, durability, and scale", psychology: "Strong, reliable, efficient" },
      "Energy & Utilities": { primary: "#2ECC71", secondary: "#1ABC9C", accent: "#F39C12", reason: "Greens for sustainability; ambers for energy and power", psychology: "Sustainable, powerful, reliable" },
      "Education": { primary: "#2C3E50", secondary: "#3498DB", accent: "#F1C40F", reason: "Classic academic palette balancing authority with approachability", psychology: "Knowledgeable, trustworthy, approachable" },
      "Government & Public Sector": { primary: "#1C3A5E", secondary: "#4A7AB5", accent: "#C9A84C", reason: "Formal blue ramp communicating reliability and civic trust", psychology: "Formal, reliable, trustworthy" },
      "Hospitality & Travel": { primary: "#C19A6B", secondary: "#DEB887", accent: "#F4A460", reason: "Warm earth tones evoking comfort and world experiences", psychology: "Warm, inviting, adventurous" },
      "Media & Entertainment": { primary: "#FF0054", secondary: "#FFBD00", accent: "#00B4D8", reason: "High-contrast vibrant palette for maximum visual impact", psychology: "Exciting, bold, energetic" },
      "Legal & Compliance": { primary: "#0A0A0A", secondary: "#2D2D2D", accent: "#C9A84C", reason: "Authoritative black and gold tones signaling gravitas and prestige", psychology: "Authoritative, prestigious, serious" },
      "Non-Profit": { primary: "#EF476F", secondary: "#06D6A0", accent: "#118AB2", reason: "Hopeful colors that inspire community action", psychology: "Hopeful, inspiring, compassionate" }
    };
    return industryMap[industry] || industryMap["Technology & SaaS"];
  },
  
  getDepartmentColors(department) {
    const departmentMap = {
      "Sales": { primary: "#FF4500", secondary: "#FF6347", accent: "#FFD700", reason: "Energetic reds and oranges drive urgency, conversion, and competitive spirit", psychology: "Urgent, competitive, energetic" },
      "Marketing": { primary: "#E91E8C", secondary: "#9C27B0", accent: "#FFC107", reason: "Bold creative palette for campaigns - vibrant pinks and purples grab attention", psychology: "Creative, bold, attention-grabbing" },
      "Finance": { primary: "#0D47A1", secondary: "#1E88E5", accent: "#90CAF9", reason: "Conservative blues for accuracy, trust, and financial stability", psychology: "Conservative, trustworthy, accurate" },
      "Engineering": { primary: "#212121", secondary: "#616161", accent: "#9E9E9E", reason: "Neutral monochrome minimising distraction for technical work", psychology: "Neutral, focused, technical" },
      "HR & People": { primary: "#E91E63", secondary: "#F06292", accent: "#A5D6A7", reason: "Warm approachable tones that put people at ease", psychology: "Warm, approachable, caring" },
      "Operations": { primary: "#37474F", secondary: "#546E7A", accent: "#78909C", reason: "Structured blue-greys for process clarity and efficiency", psychology: "Structured, efficient, clear" },
      "Data & Analytics": { primary: "#08306B", secondary: "#2171B5", accent: "#6BAED6", reason: "Sequential blue ramp ideal for data-dense visualisations", psychology: "Analytical, precise, data-driven" },
      "Executive": { primary: "#0A0A0A", secondary: "#1C1C1C", accent: "#C9A84C", reason: "Premium black and gold for executive presentations and boardrooms", psychology: "Premium, authoritative, strategic" },
      "Design": { primary: "#FF1744", secondary: "#FFEA00", accent: "#00E676", reason: "Full-spectrum palette for creative exploration and visual impact", psychology: "Creative, vibrant, expressive" },
      "Risk & Compliance": { primary: "#D32F2F", secondary: "#FF7043", accent: "#FFCA28", reason: "Traffic-light palette for risk scoring and compliance monitoring", psychology: "Alert, cautious, compliant" }
    };
    return departmentMap[department] || departmentMap["Operations"];
  },
  
  getMoodAdjustments(mood) {
    const moodMap = {
      "professional": { saturation: -20, lightness: -10, description: "Subdued, trustworthy tones for professional settings" },
      "energetic": { saturation: 30, lightness: 10, description: "Vibrant, high-energy colors that demand attention" },
      "calm": { saturation: -30, lightness: 15, description: "Soothing, peaceful colors for calm environments" },
      "innovative": { saturation: 20, lightness: 5, description: "Futuristic, cutting-edge color combinations" },
      "luxurious": { saturation: 10, lightness: -5, description: "Rich, premium colors for luxury branding" },
      "natural": { saturation: -15, lightness: 0, description: "Earth-inspired, organic color palettes" },
      "playful": { saturation: 40, lightness: 15, description: "Fun, whimsical colors for creative projects" },
      "dark": { saturation: 0, lightness: -40, description: "Dark mode optimized color scheme" },
      "pastel": { saturation: -50, lightness: 20, description: "Soft, gentle pastel tones" }
    };
    return moodMap[mood] || { saturation: 0, lightness: 0, description: "Balanced, neutral palette" };
  },
  
  generatePalette(primaryColor, secondaryColor, accentColor, mood = null) {
    let primary = primaryColor;
    let secondary = secondaryColor;
    let accent = accentColor;
    
    const palette = [
      primary,
      this.adjustColor(primary, 30),
      this.adjustColor(primary, 60),
      secondary,
      this.adjustColor(secondary, 40),
      accent,
      this.getComplementary(accent)
    ];
    
    return palette;
  },
  
  async getRecommendations(industry, department, mood = null) {
    await new Promise(resolve => setTimeout(resolve, 600));
    const recommendations = [];
    
    if (industry) {
      const industryColors = this.getIndustryColors(industry);
      const palette = this.generatePalette(industryColors.primary, industryColors.secondary, industryColors.accent, mood);
      recommendations.push({
        id: `ai-ind-${Date.now()}`,
        name: `${industry} AI Palette`,
        colors: palette.map(hex => ({ hex, rgb: this.hexToRgb(hex) })),
        primaryColors: palette,
        confidence: 92,
        source: "Industry",
        reason: industryColors.reason,
        psychology: industryColors.psychology
      });
    }
    
    if (department) {
      const deptColors = this.getDepartmentColors(department);
      const palette = this.generatePalette(deptColors.primary, deptColors.secondary, deptColors.accent, mood);
      recommendations.push({
        id: `ai-dept-${Date.now()}`,
        name: `${department} Department AI Palette`,
        colors: palette.map(hex => ({ hex, rgb: this.hexToRgb(hex) })),
        primaryColors: palette,
        confidence: 88,
        source: "Department",
        reason: deptColors.reason,
        psychology: deptColors.psychology
      });
    }
    
    if (industry && department) {
      const industryColors = this.getIndustryColors(industry);
      const deptColors = this.getDepartmentColors(department);
      const blendedPrimary = this.adjustColor(industryColors.primary, -10);
      const palette = this.generatePalette(blendedPrimary, deptColors.secondary, industryColors.accent, mood);
      recommendations.push({
        id: `ai-blend-${Date.now()}`,
        name: `${industry} × ${department} Blended Palette`,
        colors: palette.map(hex => ({ hex, rgb: this.hexToRgb(hex) })),
        primaryColors: palette,
        confidence: 95,
        source: "Blended",
        reason: `Combines ${industry} industry trust signals with ${department} department functionality`,
        psychology: "Balanced, optimized for both industry standards and departmental needs"
      });
    }
    
    if (recommendations.length > 0) {
      const baseRec = recommendations[0];
      const baseColor = baseRec.primaryColors[0];
      const complementary = this.getComplementary(baseColor);
      const analogous = this.getAnalogous(baseColor);
      const triadic = this.getTriadic(baseColor);
      
      const complementaryPalette = [
        baseColor, complementary, this.adjustColor(complementary, 40),
        analogous[0], analogous[1], triadic[0], triadic[1]
      ];
      
      recommendations.push({
        id: `ai-theory-${Date.now()}`,
        name: "Color Theory Complementary",
        colors: complementaryPalette.map(hex => ({ hex, rgb: this.hexToRgb(hex) })),
        primaryColors: complementaryPalette,
        confidence: 85,
        source: "Color Theory",
        reason: "Based on complementary and analogous color harmony principles",
        psychology: "Visually balanced, harmonious color relationships"
      });
      
      const monochromatic = this.getMonochromatic(baseColor, 7);
      recommendations.push({
        id: `ai-mono-${Date.now()}`,
        name: "Monochromatic Scheme",
        colors: monochromatic.map(hex => ({ hex, rgb: this.hexToRgb(hex) })),
        primaryColors: monochromatic,
        confidence: 82,
        source: "Monochromatic",
        reason: "Single-hue palette with varying lightness for cohesive design",
        psychology: "Cohesive, elegant, focused"
      });
    }
    
    return recommendations.slice(0, 5);
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// PALETTE SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

export const paletteService = {
  // GET - Fetch all palettes from database
  async getAll() {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching palettes:', error);
      return [];
    }
  },

  // GET - Fetch single palette by ID
  async getById(id) {
    try {
      const response = await fetch(`${API_URL}/${id}`);
      if (!response.ok) throw new Error('Failed to fetch');
      return await response.json();
    } catch (error) {
      console.error('Error fetching palette:', error);
      return null;
    }
  },

  // POST - Create new palette in database
  async create(paletteData) {
    try {
      // Parse colors from comma-separated string if needed
      let primaryColors = paletteData.primaryColors || [];
      if (typeof primaryColors === 'string') {
        primaryColors = primaryColors.split(',').map(s => s.trim()).filter(c => c && c.startsWith('#'));
      }
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: paletteData.name,
          description: paletteData.description || '',
          industry: paletteData.industry || '',
          department: paletteData.department || '',
          status: paletteData.status || 'draft',
          scope: paletteData.scope || 'global',
          primaryColors: primaryColors.length ? primaryColors : ['#6366ff', '#4f46e5', '#818cf8', '#e0e7ff', '#c7d2fe', '#22c55e', '#1e293b'],
          secondaryColors: paletteData.secondaryColors || ['#e0e7ff', '#c7d2fe'],
          accentColors: paletteData.accentColors || ['#22c55e'],
          textColors: paletteData.textColors || ['#1e293b', '#ffffff'],
          isLocked: paletteData.isLocked || false,
          version: 1
        })
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const newPalette = await response.json();
      
      // Add audit log for creation
      this.addAuditLog('created', newPalette.id, null, newPalette, `Palette "${newPalette.name}" created`);
      
      return newPalette;
    } catch (error) {
      console.error('Error creating palette:', error);
      throw error;
    }
  },

  // PUT - Update palette in database
  async update(id, paletteData) {
    try {
      // Get existing palette first for audit
      const existing = await this.getById(id);
      
      // Parse colors from comma-separated string if needed
      let primaryColors = paletteData.primaryColors || paletteData.colors || [];
      if (typeof primaryColors === 'string') {
        primaryColors = primaryColors.split(',').map(s => s.trim()).filter(c => c && c.startsWith('#'));
      }
      
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: paletteData.name,
          description: paletteData.description,
          industry: paletteData.industry,
          department: paletteData.department,
          status: paletteData.status,
          scope: paletteData.scope,
          primaryColors: primaryColors,
          secondaryColors: paletteData.secondaryColors || ['#e0e7ff', '#c7d2fe'],
          accentColors: paletteData.accentColors || ['#22c55e'],
          textColors: paletteData.textColors || ['#1e293b', '#ffffff']
        })
      });
      
      if (!response.ok) throw new Error('Failed to update');
      const updated = await response.json();
      
      // Save version history
      this.saveVersion(id, existing, `Updated to version ${(updated.version || 1)}`);
      
      // Add audit log for update
      this.addAuditLog('updated', id, existing, updated, `Palette "${updated.name}" updated`);
      
      return updated;
    } catch (error) {
      console.error('Error updating palette:', error);
      throw error;
    }
  },

  // DELETE - Remove palette from database
  async delete(id, paletteName) {
    try {
      const existing = await this.getById(id);
      const name = paletteName || existing?.name || 'unknown';
      
      const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');
      const result = await response.json();
      
      // Add audit log for deletion
      this.addAuditLog('deleted', id, existing, null, `Palette "${name}" deleted`);
      
      return result;
    } catch (error) {
      console.error('Error deleting palette:', error);
      throw error;
    }
  },

  // DUPLICATE - Create copy of existing palette
  async duplicate(palette) {
    try {
      const original = palette.id ? await this.getById(palette.id) : palette;
      if (!original) throw new Error('Original palette not found');
      
      const duplicatedData = {
        name: `${original.name} (Copy)`,
        description: original.description ? `Copy of: ${original.description}` : `Duplicate of ${original.name}`,
        industry: original.industry || '',
        department: original.department || '',
        status: 'draft',
        scope: original.scope || 'global',
        primaryColors: [...(original.primaryColors || [])],
        secondaryColors: [...(original.secondaryColors || ['#e0e7ff', '#c7d2fe'])],
        accentColors: [...(original.accentColors || ['#22c55e'])],
        textColors: [...(original.textColors || ['#1e293b', '#ffffff'])],
        isLocked: false
      };
      
      const created = await this.create(duplicatedData);
      
      // Add audit log for duplication
      this.addAuditLog('duplicated', created.id, original, created, `Duplicated from "${original.name}"`);
      
      return created;
    } catch (error) {
      console.error('Error duplicating palette:', error);
      throw error;
    }
  },

  // LOCK - Enterprise lock a palette
  async lock(id, palette, note) {
    try {
      const existing = await this.getById(id);
      if (!existing) throw new Error('Palette not found');
      
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...existing,
          isLocked: true,
          lockedBy: 'pratik.ghuge',
          lockedAt: new Date().toISOString(),
          lockNote: note || ''
        })
      });
      
      if (!response.ok) throw new Error('Failed to lock palette');
      const locked = await response.json();
      
      // Add audit log for lock
      this.addAuditLog('locked', id, existing, locked, note || `Palette "${locked.name}" locked for enterprise use`);
      
      return locked;
    } catch (error) {
      console.error('Error locking palette:', error);
      throw error;
    }
  },

  // UNLOCK - Remove enterprise lock
  async unlock(id, palette) {
    try {
      const existing = await this.getById(id);
      if (!existing) throw new Error('Palette not found');
      
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...existing,
          isLocked: false,
          lockedBy: null,
          lockedAt: null,
          lockNote: null
        })
      });
      
      if (!response.ok) throw new Error('Failed to unlock palette');
      const unlocked = await response.json();
      
      // Add audit log for unlock
      this.addAuditLog('unlocked', id, existing, unlocked, `Palette "${unlocked.name}" unlocked`);
      
      return unlocked;
    } catch (error) {
      console.error('Error unlocking palette:', error);
      throw error;
    }
  },

  // AI Recommendation Engine
  async getAIRecommendations(industry, department, mood = null, INDUSTRY_MAP, DEPT_MAP, PRESETS) {
    try {
      return await aiRecommendationService.getRecommendations(industry, department, mood);
    } catch (error) {
      console.error('AI error:', error);
      return [];
    }
  },

  // Apply to dashboard
  applyToDashboard(palette, scope = 'single', dashboardId = null) {
    if (!palette) return;
    
    const root = document.documentElement;
    const colors = palette.primaryColors || (palette.colors || []).map(c => c.hex || c);
    
    if (colors && colors[0]) {
      root.style.setProperty('--primary-color', colors[0]);
      root.style.setProperty('--primary-dark', colors[1] || colors[0]);
      root.style.setProperty('--primary-light', colors[2] || colors[0]);
    }
    
    const storageKey = scope === 'global' ? 'global_activePalette' : `dashboard_${dashboardId || 'current'}_palette`;
    localStorage.setItem(storageKey, JSON.stringify(palette));
    localStorage.setItem('last_apply_scope', scope);
    
    // Add audit log for apply
    this.addAuditLog('applied', palette.id, null, palette, `Applied to ${scope === 'global' ? 'all dashboards' : dashboardId || 'dashboard'}`);
    
    window.dispatchEvent(new CustomEvent('paletteChanged', { detail: { palette, scope, dashboardId } }));
    return { success: true };
  },

  // Version History
  saveVersion(paletteId, palette, reason) {
    try {
      const versions = this.getVersionHistory(paletteId);
      const version = {
        version: versions.length + 1,
        palette: { ...palette },
        timestamp: new Date().toISOString(),
        at: new Date().toISOString(),
        reason: reason,
        note: reason,
        changedBy: 'pratik.ghuge',
        by: 'pratik.ghuge'
      };
      versions.push(version);
      localStorage.setItem(`palette_versions_${paletteId}`, JSON.stringify(versions));
    } catch (error) {
      console.error('Error saving version:', error);
    }
  },

  getVersionHistory(paletteId) {
    try {
      const stored = localStorage.getItem(`palette_versions_${paletteId}`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  },

  async rollback(palette, version) {
    try {
      const paletteId = palette.id;
      const targetVersion = version;
      if (!targetVersion) throw new Error('Version not found');
      
      const restoredData = {
        name: palette.name,
        description: palette.description,
        industry: palette.industry,
        department: palette.department,
        status: palette.status,
        scope: palette.scope,
        primaryColors: targetVersion.palette?.primaryColors || targetVersion.colors || [],
        secondaryColors: targetVersion.palette?.secondaryColors || ['#e0e7ff', '#c7d2fe'],
        accentColors: targetVersion.palette?.accentColors || ['#22c55e'],
        textColors: targetVersion.palette?.textColors || ['#1e293b', '#ffffff']
      };
      
      const response = await fetch(`${API_URL}/${paletteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(restoredData)
      });
      
      if (!response.ok) throw new Error('Failed to rollback');
      const restored = await response.json();
      
      // Add audit log for rollback
      this.addAuditLog('rolled_back', paletteId, palette, restored, `Rolled back to version ${targetVersion.version}`);
      
      return restored;
    } catch (error) {
      console.error('Error rolling back:', error);
      throw error;
    }
  },

  // Audit Logs
  addAuditLog(action, paletteId, oldData, newData, reason = '') {
    try {
      const auditLogs = this.getAuditLogs();
      const log = {
        id: generateId(),
        action: action.toLowerCase(),
        paletteId: paletteId,
        timestamp: new Date().toISOString(),
        at: new Date().toISOString(),
        userName: 'pratik.ghuge',
        by: 'pratik.ghuge',
        name: newData?.name || oldData?.name || 'unknown',
        oldData: oldData ? { name: oldData.name, primaryColors: oldData.primaryColors } : null,
        newData: newData ? { name: newData.name, primaryColors: newData.primaryColors } : null,
        detail: reason,
        reason: reason
      };
      auditLogs.unshift(log);
      localStorage.setItem('palette_audit_logs', JSON.stringify(auditLogs.slice(0, 500))); // Keep last 500 logs
    } catch (error) {
      console.error('Error adding audit log:', error);
    }
  },

  getAuditLogs() {
    try {
      const stored = localStorage.getItem('palette_audit_logs');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  }
};