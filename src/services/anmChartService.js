// ANM Chart Integration Service
// Manages data fetching from ANM Live APIs or redirects to database-seeded dummy data

const getEnv = (key) => {
  try {
    if (import.meta && import.meta.env) {
      if (import.meta.env[key] !== undefined) return import.meta.env[key];
      if (import.meta.env[`VITE_${key}`] !== undefined) return import.meta.env[`VITE_${key}`];
    }
  } catch (e) {}
  try {
    if (process && process.env) {
      if (process.env[key] !== undefined) return process.env[key];
      if (process.env[`REACT_APP_${key}`] !== undefined) return process.env[`REACT_APP_${key}`];
    }
  } catch (e) {}
  return null;
};

const USE_LIVE_API = getEnv('USE_ANM_API') === 'true' || getEnv('REACT_APP_USE_ANM_API') === 'true' || getEnv('VITE_USE_ANM_API') === 'true';
const BASE_URL = getEnv('ANM_API_URL') || getEnv('REACT_APP_ANM_API_URL') || getEnv('VITE_ANM_API_URL') || 'https://api.anmquadrant.com';
const API_KEY = getEnv('ANM_API_KEY') || getEnv('REACT_APP_ANM_API_KEY') || getEnv('VITE_ANM_API_KEY') || 'test_api_key_12345';
const BEARER_TOKEN = getEnv('ANM_BEARER_TOKEN') || getEnv('REACT_APP_ANM_BEARER_TOKEN') || getEnv('VITE_ANM_BEARER_TOKEN') || 'dummy_jwt_token_12345';

// Generates a beautiful 7-stop palette based on a single base accent color
const generatePaletteFromAccent = (accentHex) => {
  const hexToRgb = (hex) => {
    const h = hex.replace("#", "");
    const full = h.length === 3 ? h[0]+h[0]+h[1]+h[1]+h[2]+h[2] : h;
    const n = parseInt(full, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  };
  const rgbToHex = (r, g, b) =>
    "#" + [r, g, b].map(v =>
      Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")
    ).join("");

  const rgb = hexToRgb(accentHex);
  return [
    accentHex,
    rgbToHex(Math.min(255, rgb.r + 30), Math.min(255, rgb.g + 30), Math.min(255, rgb.b + 30)),
    rgbToHex(Math.max(0, rgb.r - 35), Math.max(0, rgb.g - 35), Math.max(0, rgb.b - 35)),
    rgbToHex(Math.min(255, rgb.r + 55), Math.min(255, rgb.g + 55), Math.min(255, rgb.b + 55)),
    rgbToHex(Math.max(0, rgb.r - 60), Math.min(255, rgb.g + 20), Math.min(255, rgb.b + 45)),
    rgbToHex(Math.min(255, rgb.r + 40), Math.max(0, rgb.g - 30), Math.min(255, rgb.b + 30)),
    rgbToHex(Math.max(0, rgb.r - 20), Math.max(0, rgb.g - 50), Math.min(255, rgb.b + 50))
  ];
};

// Helper to get active palette colors from localStorage (AVIE Engine / Color Wheel)
const getActivePaletteColors = () => {
  try {
    const saved = localStorage.getItem("global_activePalette");
    if (saved) {
      const parsed = JSON.parse(saved);
      const colors = parsed.colors || parsed.primaryColors || [];
      if (colors.length > 0) {
        return colors.map(c => typeof c === 'string' ? c : c.hex || c.color || '#6366f1');
      }
    }
  } catch (e) {}

  try {
    const accent = localStorage.getItem("nox_accent_color");
    if (accent && /^#[0-9A-Fa-f]{6}$/.test(accent)) {
      return generatePaletteFromAccent(accent);
    }
  } catch (e) {}

  return ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#3b82f6"];
};

// =========================================================
// DATA SEEDED FROM erp_system2.sql (MAPPED TO CLINICAL ANM)
// =========================================================

const mockPatients = [
  { id: 1, name: 'Adil Mohd', age: 38, gender: 'Male', city: 'Hyderabad', country: 'India', status: 'approved', joined: '2025-09-18' },
  { id: 3, name: 'Della Parker', age: 29, gender: 'Female', city: 'Cairo', country: 'Egypt', status: 'completed', joined: '2025-09-18' },
  { id: 5, name: 'Rosario Thiel', age: 52, gender: 'Female', city: 'Alexandria', country: 'Egypt', status: 'pending', joined: '2025-09-18' },
  { id: 6, name: 'Daisy Nader', age: 41, gender: 'Female', city: 'Giza', country: 'Egypt', status: 'approved', joined: '2025-09-18' }
];

const mockMedicines = [
  { id: 1, name: 'Paracetamol (P1)', category: 'Analgesics', stock: 120, unit_cost: 100, sell_price: 250 },
  { id: 2, name: 'Nobis Antivirals', category: 'Antivirals', stock: 85, unit_cost: 150, sell_price: 350 },
  { id: 3, name: 'Ea Sint Vaccine', category: 'Immunizations', stock: 200, unit_cost: 120, sell_price: 300 },
  { id: 4, name: 'Aliquam Antibiotic', category: 'Antibiotics', stock: 95, unit_cost: 180, sell_price: 250 },
  { id: 5, name: 'Sunt Ullam Supplements', category: 'Nutritional', stock: 150, unit_cost: 80, sell_price: 150 }
];

const mockClinics = [
  { id: 1, name: 'Main Healthcare Branch', location: 'Cairo', cases: 290 },
  { id: 2, name: 'Outreach Test Camp', location: 'Giza', cases: 112 }
];

const mockStaff = [
  { id: 1, name: 'Dr. User User', role: 'Clinical Doctor' },
  { id: 2, name: 'Dr. Super Admin', role: 'Chief Medical Officer' },
  { id: 3, name: 'Dr. Admin Admin', role: 'Staff Physician' }
];

const mockConsultations = [
  { id: 101, patient: 'Adil Mohd', doctor: 'Dr. User User', diagnosis: 'Analgesics', duration: 15, cost: 250, status: 'completed', date: '2025-09-18' },
  { id: 102, patient: 'Della Parker', doctor: 'Dr. User User', diagnosis: 'Antivirals', duration: 25, cost: 350, status: 'completed', date: '2025-09-18' },
  { id: 103, patient: 'Rosario Thiel', doctor: 'Dr. Super Admin', diagnosis: 'Immunizations', duration: 20, cost: 300, status: 'completed', date: '2025-09-19' },
  { id: 104, patient: 'Daisy Nader', doctor: 'Dr. Admin Admin', diagnosis: 'Antibiotics', duration: 18, cost: 250, status: 'completed', date: '2025-09-19' }
];

const mockWards = [
  { id: 1, name: 'Emergency Ward A', totalBeds: 20, occupiedBeds: 15, admissions: 120, severity: 'High', diagnosis: 'Antivirals' },
  { id: 2, name: 'Outpatient Ward B', totalBeds: 35, occupiedBeds: 28, admissions: 290, severity: 'Medium', diagnosis: 'Analgesics' },
  { id: 3, name: 'ICU Ward C', totalBeds: 10, occupiedBeds: 8, admissions: 45, severity: 'Critical', diagnosis: 'Immunizations' },
  { id: 4, name: 'General Outpatient Ward D', totalBeds: 50, occupiedBeds: 30, admissions: 150, severity: 'Low', diagnosis: 'Antibiotics' }
];

const mockInvoices = [
  { id: 'INV-2025-001', patient: 'Adil Mohd', diagnosis: 'Analgesics', amount: 250, status: 'completed', balance: 0 },
  { id: 'INV-2025-002', patient: 'Della Parker', diagnosis: 'Antivirals', amount: 350, status: 'completed', balance: 0 },
  { id: 'INV-2025-003', patient: 'Rosario Thiel', diagnosis: 'Immunizations', amount: 300, status: 'completed', balance: 300 },
  { id: 'INV-2025-004', patient: 'Daisy Nader', diagnosis: 'Antibiotics', amount: 250, status: 'completed', balance: 0 }
];

// ==========================================
// ADAPTER MAPPING FUNCTIONS (CHART FORMATS)
// ==========================================

export const anmChartService = {
  isLive() {
    return USE_LIVE_API;
  },

  async handleFetch(url, filters = null) {
    console.log(`[ANM Service] Intercepting fetch request to: ${url} with filters:`, filters);
    const palette = getActivePaletteColors();

    if (USE_LIVE_API) {
      try {
        const liveHeaders = {
          'X-API-Key': API_KEY,
          'Authorization': `Bearer ${BEARER_TOKEN}`,
          'Accept': 'application/json'
        };
        
        // Build query string dynamically from filter values
        const queryParams = [];
        if (filters) {
          if (filters.search) queryParams.push(`search=${encodeURIComponent(filters.search)}`);
          if (filters.diagnosis && filters.diagnosis !== 'All') queryParams.push(`category=${encodeURIComponent(filters.diagnosis)}`);
          if (filters.status && filters.status !== 'All') queryParams.push(`status=${encodeURIComponent(filters.status)}`);
          if (filters.startDate) queryParams.push(`startDate=${encodeURIComponent(filters.startDate)}`);
          if (filters.endDate) queryParams.push(`endDate=${encodeURIComponent(filters.endDate)}`);
        }
        const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

        let liveUrl = BASE_URL;
        if (url.includes('dummyjson.com/products') || url.includes('fakestoreapi.com/products')) {
          liveUrl += `/api/v1/patients/search${queryString}`;
        } else if (url.includes('unemployment.json') || url.includes('dates.json')) {
          liveUrl += `/api/v1/consultations/history${queryString}`;
        } else if (url.includes('nominatim.openstreetmap.org')) {
          liveUrl += `/api/v1/geotags/history${queryString}`;
        }

        const res = await fetch(liveUrl, { headers: liveHeaders });
        if (res.ok) {
          const json = await res.json();
          return this.adaptLiveResponse(json, url);
        }
      } catch (err) {
        console.warn('[ANM Service] Live API fetch failed, falling back to dummy data:', err.message);
      }
    }

    // Apply filters to Mock datasets dynamically
    let filteredConsultations = [...mockConsultations];
    let filteredPatients = [...mockPatients];
    let filteredClinics = [...mockClinics];
    let filteredMedicines = [...mockMedicines];

    if (filters) {
      if (filters.toggledOffDiagnoses && filters.toggledOffDiagnoses.length > 0) {
        const toggledOff = new Set(filters.toggledOffDiagnoses);
        filteredConsultations = filteredConsultations.filter(c => !toggledOff.has(c.diagnosis));
        filteredMedicines = filteredMedicines.filter(m => !toggledOff.has(m.category));
        filteredPatients = filteredPatients.filter(p => {
          return filteredConsultations.some(c => c.patient === p.name);
        });
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        filteredConsultations = filteredConsultations.filter(c => 
          (c.patient && c.patient.toLowerCase().includes(q)) ||
          (c.doctor && c.doctor.toLowerCase().includes(q)) ||
          (c.diagnosis && c.diagnosis.toLowerCase().includes(q))
        );
        filteredPatients = filteredPatients.filter(p => 
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.city && p.city.toLowerCase().includes(q))
        );
      }
      if (filters.diagnosis && filters.diagnosis !== 'All') {
        filteredConsultations = filteredConsultations.filter(c => c.diagnosis === filters.diagnosis);
        filteredMedicines = filteredMedicines.filter(m => m.category === filters.diagnosis);
      }
      if (filters.status && filters.status !== 'All') {
        filteredConsultations = filteredConsultations.filter(c => c.status === filters.status);
        filteredPatients = filteredPatients.filter(p => p.status === filters.status);
      }
      if (filters.startDate) {
        filteredConsultations = filteredConsultations.filter(c => c.date >= filters.startDate);
      }
      if (filters.endDate) {
        filteredConsultations = filteredConsultations.filter(c => c.date <= filters.endDate);
      }
    }

    // Default Fallback Mock Data mappings styled with the active palette
    if (url.includes('dummyjson.com/products')) {
      return {
        products: filteredConsultations.map((c, i) => ({
          id: c.id,
          title: `${c.patient} - ${c.diagnosis}`,
          price: c.cost,
          rating: c.duration / 5,
          color: palette[i % palette.length]
        }))
      };
    }

    if (url.includes('fakestoreapi.com/products')) {
      return filteredConsultations.map((c, i) => ({
        id: c.id,
        title: c.patient,
        price: c.cost,
        category: c.diagnosis,
        rating: { rate: c.duration / 5 },
        color: palette[i % palette.length]
      }));
    }

    if (url.includes('diamonds.json')) {
      return filteredConsultations.map((c, i) => ({
        carat: c.duration / 10,
        price: c.cost,
        cut: c.diagnosis,
        color: palette[i % palette.length],
        clarity: c.status
      }));
    }

    if (url.includes('unemployment.json') || url.includes('dates.json')) {
      return filteredConsultations.map((c, i) => ({
        date: c.date,
        rate: c.cost / 100,
        value: c.cost,
        color: palette[i % palette.length]
      }));
    }

    if (url.includes('worldbank.org')) {
      return [
        { page: 1, pages: 1 },
        filteredConsultations.map((c, i) => ({
          date: c.date.substring(0, 4),
          value: c.cost / 10,
          color: palette[i % palette.length]
        }))
      ];
    }

    if (url.includes('api.open-meteo.com')) {
      return {
        daily: {
          time: filteredConsultations.map(c => c.date),
          temperature_2m_max: filteredConsultations.map(c => c.duration)
        }
      };
    }

    if (url.includes('api.frankfurter.app')) {
      return {
        base: 'USD',
        date: '2025-09-18',
        rates: {
          EGP: 30.9,
          INR: 83.5,
          EUR: 0.91,
          GBP: 0.78
        }
      };
    }

    if (url.includes('nominatim.openstreetmap.org')) {
      const activeCities = new Set(filteredPatients.map(p => p.city));
      const activeClinics = filteredClinics.filter(c => activeCities.has(c.location) || activeCities.size === 0);
      return activeClinics.map(g => ({
        lat: g.location === 'Cairo' ? '30.0444' : '30.0131',
        lon: g.location === 'Cairo' ? '31.2357' : '31.2089',
        display_name: g.name
      }));
    }

    if (url.includes('counties-albers-10m.json') || url.includes('population.json')) {
      return {
        type: "Topology",
        objects: { counties: { type: "GeometryCollection", geometries: [] } },
        arcs: []
      };
    }

    if (url.includes('vaccines (1).json')) {
      return filteredMedicines.map((m, i) => ({
        vaccine: m.name,
        efficacy: 90 + i,
        stock: m.stock,
        color: palette[i % palette.length]
      }));
    }

    // Fallbacks for CSV files
    if (url.endsWith('.csv')) {
      if (url.includes('alphabet.csv')) {
        let csv = "letter,frequency\n";
        filteredMedicines.forEach((m, i) => {
          csv += `${m.category},${(0.4 - i * 0.07).toFixed(2)}\n`;
        });
        return csv;
      }
      if (url.includes('limkar-chord-data.csv')) {
        return `OPD,Lab,Radiology,Pharmacy\n12,4,2,8\n3,8,1,5\n1,2,6,2\n2,1,0,10`;
      }
      return `WBS,TASK,LEAD,START,END,DAYS,% DONE,WORK DAYS\n1,Patient Registration,OPD Staff,2025-09-18,2025-09-19,1,100,1\n2,Doctor Consultation,Dr. User User,2025-09-19,2025-09-20,1,100,1\n3,Pharmacy Dispensation,Dr. Admin Admin,2025-09-20,2025-09-22,2,50,2`;
    }

    return {
      status: true,
      message: "ANM Quadrant Database Seeded Data",
      patients: filteredPatients,
      medicines: filteredMedicines,
      clinics: filteredClinics,
      staff: mockStaff,
      consultations: filteredConsultations
    };
  },

  adaptLiveResponse(liveData, originalUrl) {
    if (originalUrl.includes('dummyjson.com/products')) {
      const items = liveData.patients || liveData.data || liveData;
      return {
        products: items.map(p => ({
          title: p.name || p.patient_name || 'Patient',
          price: p.age || 30
        }))
      };
    }
    return liveData;
  },

  getFilteredConsultations(filters) {
    let list = [...mockConsultations];
    if (filters) {
      if (filters.toggledOffDiagnoses && filters.toggledOffDiagnoses.length > 0) {
        const toggledOff = new Set(filters.toggledOffDiagnoses);
        list = list.filter(c => !toggledOff.has(c.diagnosis));
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(c => 
          (c.patient && c.patient.toLowerCase().includes(q)) ||
          (c.doctor && c.doctor.toLowerCase().includes(q)) ||
          (c.diagnosis && c.diagnosis.toLowerCase().includes(q))
        );
      }
      if (filters.diagnosis && filters.diagnosis !== 'All') {
        list = list.filter(c => c.diagnosis === filters.diagnosis);
      }
      if (filters.status && filters.status !== 'All') {
        list = list.filter(c => c.status === filters.status);
      }
      if (filters.startDate) {
        list = list.filter(c => c.date >= filters.startDate);
      }
      if (filters.endDate) {
        list = list.filter(c => c.date <= filters.endDate);
      }
    }
    return list;
  },

  getFilteredCount(filters) {
    return this.getFilteredConsultations(filters).length;
  },

  getFilteredPatients(filters) {
    let list = [...mockPatients];
    if (filters) {
      if (filters.toggledOffDiagnoses && filters.toggledOffDiagnoses.length > 0) {
        const activeCons = this.getFilteredConsultations(filters);
        const activePatientNames = new Set(activeCons.map(c => c.patient));
        list = list.filter(p => activePatientNames.has(p.name));
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(p => p.name.toLowerCase().includes(q) || p.city.toLowerCase().includes(q));
      }
      if (filters.status && filters.status !== 'All') {
        list = list.filter(p => p.status === filters.status);
      }
    }
    return list;
  },

  getFilteredMedicines(filters) {
    let list = [...mockMedicines];
    if (filters) {
      if (filters.toggledOffDiagnoses && filters.toggledOffDiagnoses.length > 0) {
        const toggledOff = new Set(filters.toggledOffDiagnoses);
        list = list.filter(m => !toggledOff.has(m.category));
      }
      if (filters.diagnosis && filters.diagnosis !== 'All') {
        list = list.filter(m => m.category === filters.diagnosis);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(m => m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q));
      }
    }
    return list;
  },

  getFilteredWards(filters) {
    let list = [...mockWards];
    if (filters) {
      const activeCons = this.getFilteredConsultations(filters);
      const activeDiagnoses = new Set(activeCons.map(c => c.diagnosis));
      if (activeDiagnoses.size > 0 && (filters.diagnosis !== 'All' || filters.search || filters.status || filters.startDate || filters.endDate || (filters.toggledOffDiagnoses && filters.toggledOffDiagnoses.length > 0))) {
        list = list.filter(w => activeDiagnoses.has(w.diagnosis));
      }
    }
    return list;
  },

  getFilteredInvoices(filters) {
    let list = [...mockInvoices];
    if (filters) {
      if (filters.toggledOffDiagnoses && filters.toggledOffDiagnoses.length > 0) {
        const toggledOff = new Set(filters.toggledOffDiagnoses);
        list = list.filter(inv => !toggledOff.has(inv.diagnosis));
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(inv => inv.patient.toLowerCase().includes(q) || inv.diagnosis.toLowerCase().includes(q));
      }
      if (filters.diagnosis && filters.diagnosis !== 'All') {
        list = list.filter(inv => inv.diagnosis === filters.diagnosis);
      }
      if (filters.status && filters.status !== 'All') {
        list = list.filter(inv => inv.status === filters.status);
      }
    }
    return list;
  },

  simulateRealTimeUpdate() {
    const patientPool = [
      { name: 'John Doe', age: 34, gender: 'Male', city: 'Cairo', country: 'Egypt' },
      { name: 'Alice Smith', age: 28, gender: 'Female', city: 'Giza', country: 'Egypt' },
      { name: 'Bob Miller', age: 45, gender: 'Male', city: 'Alexandria', country: 'Egypt' },
      { name: 'Clara Jones', age: 50, gender: 'Female', city: 'Cairo', country: 'Egypt' }
    ];
    const diagnosesPool = ['Analgesics', 'Antivirals', 'Immunizations', 'Antibiotics'];
    const doctorPool = ['Dr. User User', 'Dr. Super Admin', 'Dr. Admin Admin'];
    const statusPool = ['completed', 'pending'];

    // Select random components
    const randPatient = patientPool[Math.floor(Math.random() * patientPool.length)];
    const randDiagnosis = diagnosesPool[Math.floor(Math.random() * diagnosesPool.length)];
    const randDoctor = doctorPool[Math.floor(Math.random() * doctorPool.length)];
    const randStatus = statusPool[Math.floor(Math.random() * statusPool.length)];
    const randDuration = 10 + Math.floor(Math.random() * 20); // 10 to 30 min
    const randCost = 100 + Math.floor(Math.random() * 400); // 100 to 500
    const randDate = `2025-09-${20 + Math.floor(Math.random() * 5)}`; // 2025-09-20 to 2025-09-24

    const newId = 200 + mockConsultations.length;

    // Create records
    const newConsultation = {
      id: newId,
      patient: randPatient.name,
      doctor: randDoctor,
      diagnosis: randDiagnosis,
      duration: randDuration,
      cost: randCost,
      status: randStatus,
      date: randDate
    };

    const newPatient = {
      id: newId,
      name: randPatient.name,
      age: randPatient.age,
      gender: randPatient.gender,
      city: randPatient.city,
      country: randPatient.country,
      status: randStatus === 'completed' ? 'completed' : 'pending',
      joined: randDate
    };

    const newInvoice = {
      id: `INV-2025-${newId}`,
      patient: randPatient.name,
      diagnosis: randDiagnosis,
      amount: randCost,
      status: randStatus,
      balance: randStatus === 'completed' ? 0 : randCost
    };

    // Push with rotation cap at index 4 (indices 0 to 3 are seed records, permanently preserved!)
    if (mockConsultations.length < 10) {
      mockConsultations.push(newConsultation);
      mockPatients.push(newPatient);
      mockInvoices.push(newInvoice);
    } else {
      // Rotate out oldest dynamic record (index 4)
      mockConsultations.splice(4, 1);
      mockPatients.splice(4, 1);
      mockInvoices.splice(4, 1);

      // Add new record at the end
      mockConsultations.push(newConsultation);
      mockPatients.push(newPatient);
      mockInvoices.push(newInvoice);
    }

    console.log(`[ANM Auto-Refresh] Added new dynamic record for patient: ${randPatient.name}, diagnosis: ${randDiagnosis}, status: ${randStatus}. Active consultations: ${mockConsultations.length}`);
  },

  getDashboardStats() {
    return {
      total: mockPatients.length,
      approved: mockPatients.filter(p => p.status === 'approved').length,
      completed: mockPatients.filter(p => p.status === 'completed').length,
      pending: mockPatients.filter(p => p.status === 'pending').length
    };
  }
};
