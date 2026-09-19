// Industry to Palette Mapping
export const industryPalettes = {
  healthcare: {
    name: 'Healthcare Blue',
    primaryColors: ['#1E88E5', '#0D47A1', '#42A5F5'],
    secondaryColors: ['#E3F2FD', '#BBDEFB'],
    accentColors: ['#00ACC1'],
    textColors: ['#0D47A1', '#FFFFFF'],
    description: 'Trustworthy, calm, professional'
  },
  finance: {
    name: 'Finance Green',
    primaryColors: ['#2E7D32', '#1B5E20', '#4CAF50'],
    secondaryColors: ['#E8F5E9', '#C8E6C9'],
    accentColors: ['#FFC107'],
    textColors: ['#1B5E20', '#FFFFFF'],
    description: 'Growth, stability, prosperity'
  },
  technology: {
    name: 'Tech Purple',
    primaryColors: ['#6A1B9A', '#4A148C', '#9C27B0'],
    secondaryColors: ['#F3E5F5', '#E1BEE7'],
    accentColors: ['#00BCD4'],
    textColors: ['#4A148C', '#FFFFFF'],
    description: 'Innovation, creativity, modern'
  },
  retail: {
    name: 'Retail Orange',
    primaryColors: ['#E65100', '#BF360C', '#FF9800'],
    secondaryColors: ['#FFF3E0', '#FFE0B2'],
    accentColors: ['#F44336'],
    textColors: ['#BF360C', '#FFFFFF'],
    description: 'Energy, excitement, urgency'
  },
  education: {
    name: 'Education Navy',
    primaryColors: ['#1565C0', '#0D47A1', '#1976D2'],
    secondaryColors: ['#E3F2FD', '#BBDEFB'],
    accentColors: ['#FFA000'],
    textColors: ['#0D47A1', '#FFFFFF'],
    description: 'Knowledge, trust, wisdom'
  },
  manufacturing: {
    name: 'Industrial Gray',
    primaryColors: ['#455A64', '#263238', '#607D8B'],
    secondaryColors: ['#ECEFF1', '#CFD8DC'],
    accentColors: ['#FF5722'],
    textColors: ['#263238', '#FFFFFF'],
    description: 'Strong, reliable, efficient'
  }
};

// Department to Palette Mapping
export const departmentPalettes = {
  marketing: {
    name: 'Marketing Vibrant',
    primaryColors: ['#D81B60', '#AD1457', '#F06292'],
    secondaryColors: ['#FCE4EC', '#F8BBD0'],
    accentColors: ['#FFD54F'],
    textColors: ['#AD1457', '#FFFFFF'],
    description: 'Bold, attention-grabbing, energetic'
  },
  sales: {
    name: 'Sales Success',
    primaryColors: ['#F4511E', '#BF360C', '#FF7043'],
    secondaryColors: ['#FBE9E7', '#FFCCBC'],
    accentColors: ['#66BB6A'],
    textColors: ['#BF360C', '#FFFFFF'],
    description: 'Competitive, winning, action-oriented'
  },
  hr: {
    name: 'HR Trust',
    primaryColors: ['#8E24AA', '#4A148C', '#AB47BC'],
    secondaryColors: ['#F3E5F5', '#E1BEE7'],
    accentColors: ['#26C6DA'],
    textColors: ['#4A148C', '#FFFFFF'],
    description: 'Warm, approachable, trustworthy'
  },
  it: {
    name: 'IT Technical',
    primaryColors: ['#00ACC1', '#006064', '#26C6DA'],
    secondaryColors: ['#E0F7FA', '#B2EBF2'],
    accentColors: ['#FFCA28'],
    textColors: ['#006064', '#FFFFFF'],
    description: 'Clean, technical, efficient'
  },
  operations: {
    name: 'Operations Efficient',
    primaryColors: ['#546E7A', '#263238', '#78909C'],
    secondaryColors: ['#ECEFF1', '#CFD8DC'],
    accentColors: ['#FF7043'],
    textColors: ['#263238', '#FFFFFF'],
    description: 'Organized, systematic, reliable'
  },
  finance_dept: {
    name: 'Finance Accurate',
    primaryColors: ['#43A047', '#2E7D32', '#66BB6A'],
    secondaryColors: ['#E8F5E9', '#C8E6C9'],
    accentColors: ['#FFA000'],
    textColors: ['#2E7D32', '#FFFFFF'],
    description: 'Accurate, trustworthy, stable'
  }
};

// Get combined palette from industry + department
export function getCombinedPalette(industry, department) {
  const industryPal = industryPalettes[industry];
  const deptPal = departmentPalettes[department];
  
  if (!industryPal && !deptPal) return null;
  
  if (!industryPal) return deptPal;
  if (!deptPal) return industryPal;
  
  // Combine both
  return {
    name: `${industryPal.name} + ${deptPal.name}`,
    primaryColors: [industryPal.primaryColors[0], deptPal.primaryColors[0], industryPal.primaryColors[1]],
    secondaryColors: [industryPal.secondaryColors[0], deptPal.secondaryColors[0]],
    accentColors: [deptPal.accentColors[0]],
    textColors: industryPal.textColors,
    description: `Combined ${industry} industry + ${department} department theme`
  };
}

// Preset library
export const presetLibrary = [
  {
    id: 'preset_1',
    name: 'Ocean Breeze',
    primaryColors: ['#0284C7', '#0369A1', '#38BDF8'],
    secondaryColors: ['#E0F2FE', '#BAE6FD'],
    accentColors: ['#F59E0B'],
    textColors: ['#0F172A', '#FFFFFF'],
    category: 'Nature'
  },
  {
    id: 'preset_2',
    name: 'Forest Earth',
    primaryColors: ['#059669', '#047857', '#10B981'],
    secondaryColors: ['#D1FAE5', '#A7F3D0'],
    accentColors: ['#D97706'],
    textColors: ['#064E3B', '#FFFFFF'],
    category: 'Nature'
  },
  {
    id: 'preset_3',
    name: 'Sunset Warm',
    primaryColors: ['#EA580C', '#C2410C', '#F97316'],
    secondaryColors: ['#FFEDD5', '#FED7AA'],
    accentColors: ['#8B5CF6'],
    textColors: ['#7C2D12', '#FFFFFF'],
    category: 'Warm'
  },
  {
    id: 'preset_4',
    name: 'Midnight Dark',
    primaryColors: ['#1E293B', '#0F172A', '#334155'],
    secondaryColors: ['#E2E8F0', '#CBD5E1'],
    accentColors: ['#EC4899'],
    textColors: ['#F8FAFC', '#94A3B8'],
    category: 'Dark'
  },
  {
    id: 'preset_5',
    name: 'Corporate Blue',
    primaryColors: ['#2563EB', '#1D4ED8', '#3B82F6'],
    secondaryColors: ['#DBEAFE', '#BFDBFE'],
    accentColors: ['#10B981'],
    textColors: ['#1E3A8A', '#FFFFFF'],
    category: 'Corporate'
  }
];

// Enterprise locked palettes (admin only)
export const enterpriseLockedPalettes = [
  {
    id: 'enterprise_1',
    name: 'Corporate Brand (LOCKED)',
    primaryColors: ['#1E40AF', '#1E3A8A', '#3B82F6'],
    secondaryColors: ['#EFF6FF', '#DBEAFE'],
    accentColors: ['#F59E0B'],
    textColors: ['#1E3A8A', '#FFFFFF'],
    isLocked: true,
    lockedBy: 'admin',
    requiresApproval: true
  },
  {
    id: 'enterprise_2',
    name: 'Company Standard (LOCKED)',
    primaryColors: ['#7C3AED', '#6D28D9', '#8B5CF6'],
    secondaryColors: ['#EDE9FE', '#DDD6FE'],
    accentColors: ['#EC4899'],
    textColors: ['#4C1D95', '#FFFFFF'],
    isLocked: true,
    lockedBy: 'admin',
    requiresApproval: true
  }
];

