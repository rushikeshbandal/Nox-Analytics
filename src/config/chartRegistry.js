// src/config/chartRegistry.js
// Centralized registry of all charts across the dashboard with titles, categories, and fast search indexing.

export const CHART_CONTEXTS = {
  // Category A: Clinical Consultations
  "AnimatedTreeMap": "CONSULTATIONS",
  "ConnectScatteredplot": "CONSULTATIONS",
  "ScatterplotTour": "CONSULTATIONS",
  "TemporalGraph": "CONSULTATIONS",
  "SmoothZoom": "CONSULTATIONS",
  "BarChartRace": "CONSULTATIONS",
  "BarChartTransitions": "CONSULTATIONS",
  "StreamGraph": "CONSULTATIONS",
  "ProjectionBlendCanvas": "CONSULTATIONS",
  "LineChart1": "CONSULTATIONS",
  "DonutChart1": "CONSULTATIONS",
  "HorizontalBarChart1": "CONSULTATIONS",
  "Calendar": "CONSULTATIONS",
  "ProjectionComparisonChart": "CONSULTATIONS",
  "ProjectionTransitionChart": "CONSULTATIONS",
  "NewzlandTourismChart": "CONSULTATIONS",
  "AreaChart": "CONSULTATIONS",
  "BarChartWithMissingData": "CONSULTATIONS",
  "BandChart": "CONSULTATIONS",

  // Category B: Clinical Inventory
  "IndexChart": "INVENTORY",
  "HorizontalBarchartCsv": "INVENTORY",
  "SortedBarChartCsv": "INVENTORY",
  "DonutChartCsv": "INVENTORY",

  // Category C: Patient Geography
  "RotatingGlobe": "GEOGRAPHY",
  "WorldMap1": "GEOGRAPHY",
  "ChoroplethWorldMap": "GEOGRAPHY",
  "TissotWorldMap": "GEOGRAPHY",
  "WorldMapwithDifferentprojectin": "GEOGRAPHY",
  "VectorWorldMap": "GEOGRAPHY",
  "RasterTilesMap": "GEOGRAPHY",
  "VectorTilesMap": "GEOGRAPHY",
  "RasterVectorChart": "GEOGRAPHY",

  // Category D: Ward Metrics
  "RadialAreaChart": "WARDS",
  "RadialStackedBarSorted": "WARDS",
  "ChordDiagram": "WARDS",
  "MarimekkoChart": "WARDS",
  "WorldTimelineChart": "WARDS",
  "VaccineImpactChart": "WARDS",
  "PackEncloseChart": "WARDS",
  "DifferenceChart": "WARDS",

  // Category E: Financial Billing
  "WealthHealthChart": "BILLING",
  "RadialstackedBchart": "BILLING",
  "HorizontalBarChart": "BILLING",
  "SimplePieChart": "BILLING",
  "DivergingBarChart": "BILLING",
  "StackedBarChart": "BILLING",
  "StackedNormalizedHorizontalChart": "BILLING",
  "StackedHorizontalBarChart": "BILLING",
  "MusicRevenueChart": "BILLING",
  "StackedAreaChart": "BILLING",
  "NormalizedStackedAreaChart": "BILLING",
  "USPopulationChart": "BILLING",

  // Additional Analytics & Research Charts
  "AreaWithMissingData": "CONSULTATIONS",
  "BeeswarmChart": "BILLING",
  "BubbleChart": "INVENTORY",
  "BubbleMap": "GEOGRAPHY",
  "CalendarHeatmap": "CONSULTATIONS",
  "CancerSurvivalSlopeChart": "WARDS",
  "ChordChart": "WARDS",
  "DJICalendarHeatmap": "CONSULTATIONS",
  "DirectedChordDiagram": "WARDS",
  "DirectedChordDiagram1": "WARDS",
  "Divergingstackedbarchart": "CONSULTATIONS",
  "DotPlot": "CONSULTATIONS",
  "ElectricityCalendarHeatmap": "INVENTORY",
  "GlobalTemperatureTrends": "CONSULTATIONS",
  "GradientEncodingLineChart": "CONSULTATIONS",
  "HorizonChart": "CONSULTATIONS",
  "InequalityChart": "BILLING",
  "LineChartMissingData": "CONSULTATIONS",
  "MareysTrains": "CONSULTATIONS",
  "MultiLineUnemploymentChart": "CONSULTATIONS",
  "MusicRevenueStackedBar": "BILLING",
  "NZTouristsChart": "GEOGRAPHY",
  "Occlusion": "BILLING",
  "ParallelCoordinates": "CONSULTATIONS",
  "PercentChangeLineChart": "BILLING",
  "ProjectCompletionBarChart": "WARDS",
  "RealtimeHorizonChart": "CONSULTATIONS",
  "RidgelinePlot": "CONSULTATIONS",
  "Scatterplot": "BILLING",
  "ScatterplotMatrix": "CONSULTATIONS",
  "ScatterplotShapes": "CONSULTATIONS",
  "SeaIceExtent": "CONSULTATIONS",
  "SeaIceExtentChart": "CONSULTATIONS",
  "SimpleBarChart": "CONSULTATIONS",
  "SlopeChart": "WARDS",
  "SpikeMap": "GEOGRAPHY",
  "StackedNormalizedBarChart": "BILLING",
  "ThresholdEncodingLineChart": "CONSULTATIONS",
  "USPopulationNormalized": "GEOGRAPHY",
  "VaccineHeatmap": "WARDS",
  "VariableColorLineChart": "CONSULTATIONS",
  "StackedtoGroupedBarCharts": "CONSULTATIONS",
  "ZoomToBoundingBox": "GEOGRAPHY",
  "OrthographicToEquirectangular": "GEOGRAPHY",
  "WorldTour": "GEOGRAPHY",
  "WalmartsGrowth": "GEOGRAPHY",
  "HierarchicalBarChart": "INVENTORY",
  "ZoomableTreemap": "CONSULTATIONS",
  "ZoomableCirclePacking": "WARDS",
  "CollapsibleTree": "WARDS",
  "ZoomableIcicle": "WARDS",
  "ZoomableSunburst": "BILLING",
  "SortableBarChart": "CONSULTATIONS",
  "IcelandicPopulation": "GEOGRAPHY",
  "PieChartUpdate": "BILLING",
  "Arctween": "WARDS",
  "VersorDragging": "GEOGRAPHY",
  "SequencesSunburst": "CONSULTATIONS",
  "BrushableScatterplot": "BILLING",
  "BrushableScatterplotMatrix": "CONSULTATIONS",
  "Pannablechart": "INVENTORY",
  "CandlestickChart": "BILLING"
};

export const CLINICAL_TITLES = {
  "AnimatedTreeMap": "Patient Categorization Tree Map",
  "ConnectScatteredplot": "Patient Age vs Consultation Count",
  "ScatterplotTour": "Outpatient Age Group Analysis",
  "TemporalGraph": "Disease Transmission Network",
  "SmoothZoom": "Consultation Severity Breakdown",
  "BarChartRace": "Top Diagnosed Diseases Race",
  "BarChartTransitions": "Weekly vs Monthly OPD Footfall",
  "IndexChart": "Medical Inventory Cost Index",
  "StreamGraph": "Seasonal Disease Outbreaks",
  "ProjectionBlendCanvas": "Outreach Camp Patient Inflow Projection",
  "WealthHealthChart": "Billing Amount vs Patient Age Profile",
  "RotatingGlobe": "Global Patient Origin Map",
  "ZoomableTreemap": "Clinic Operational Cost Breakdown",
  "ZoomableCirclePacking": "Departmental Hierarchy Explorer",
  "RadialAreaChart": "Outreach Camp Density",
  "RadialstackedBchart": "Vaccination Case Status",
  "LineChart1": "Monthly Patient Registrations",
  "SimpleBarChart": "Top Common Diagnoses Cases",
  "DonutChart1": "Patient Consultation Statuses",
  "RadialStackedBarSorted": "Emergency Ward Admittance Rate",
  "HorizontalBarChart": "Top 10 Most Expensive Consultations",
  "ChordDiagram": "Referrals Transfer Flow between Wards",
  "SimplePieChart": "Gender Distribution of Patients",
  "WorldMap1": "Patient Geographic Locations",
  "ChoroplethWorldMap": "Outpatient Case Density by District",
  "HorizontalBarChart1": "Doctor Consultation Counts",
  "DivergingBarChart": "Doctor Satisfaction Rating Deviation",
  "StackedBarChart": "Billing Payments Status",
  "StackedNormalizedHorizontalChart": "Insurance Claims Clearance Rate",
  "StackedHorizontalBarChart": "Inpatient vs Outpatient Invoices",
  "MarimekkoChart": "Ward Occupancy vs Hospital Cost Share",
  "WorldTimelineChart": "Health Outpost Deployment Timeline",
  "Calendar": "Daily Consultation Calendar Log",
  "VaccineImpactChart": "Polio Immunization Impact Study",
  "MusicRevenueChart": "Clinical Pharmacy Revenues",
  "HorizontalBarchartCsv": "Medical Equipment Stock Level",
  "SortedBarChartCsv": "Top Common Medicines Prescribed",
  "ProjectionComparisonChart": "Projected vs Actual Patient Footfall",
  "TissotWorldMap": "Clinical Outreach Map Grid",
  "WorldMapwithDifferentprojectin": "Alternative Geographic View",
  "ProjectionTransitionChart": "Patient Inflow Transitions",
  "VectorWorldMap": "Patient Country-wise Distribution",
  "DonutChartCsv": "Pharmacy Supplies Distribution",
  "NewzlandTourismChart": "Patient Visit Frequency Analysis",
  "SeaIceExtentChart": "Opd Registrations Multi-Year Trend",
  "AreaChart": "Cumulative Patients Registered",
  "BarChartWithMissingData": "Weekly Checkup Gaps Handling",
  "StackedAreaChart": "OPD vs Emergency Care Revenue Trend",
  "NormalizedStackedAreaChart": "Diagnostic Lab Share of Revenue",
  "USPopulationChart": "Region-wise Outpatient Population Density",
  "DifferenceChart": "Comparing Monthly Expenses vs Patient Revenue",
  "BandChart": "Daily Consultation Wait-Time Thresholds",
  "RasterTilesMap": "Outreach Map Imagery Grid",
  "VectorTilesMap": "Outreach Location Geo-vector Grid",
  "RasterVectorChart": "Interactive Outreach Vector Overlay",
  "Occlusion": "Dense Patient Billing Scatter Analysis",
  "PackEncloseChart": "Ward Bed Availability",
  "AreaWithMissingData": "Missing Patient Logs Interpolation",
  "BeeswarmChart": "Patient Consultations Billing Scatter",
  "BubbleChart": "Medicine Inventory Volume vs Price",
  "BubbleMap": "Outreach Center Cases Mapping",
  "CalendarHeatmap": "Daily Consultation Density Grid",
  "CancerSurvivalSlopeChart": "Post-treatment Recovery Slope",
  "CandlestickChart": "Live Stock Exchange & Crypto Candlesticks",
  "ChordChart": "Inter-Ward Patient Referrals Flow",
  "DJICalendarHeatmap": "Emergency Room Admission Density",
  "DirectedChordDiagram": "Primary vs Secondary Care Flow",
  "DirectedChordDiagram1": "Patient Outflow to Referral Centers",
  "Divergingstackedbarchart": "Patient Feedback Distribution",
  "DotPlot": "Average Patient Consultation Duration",
  "ElectricityCalendarHeatmap": "Daily Lab Test Volume Heatmap",
  "GlobalTemperatureTrends": "Patient Satisfaction Level Trends",
  "GradientEncodingLineChart": "Peak Admission Time Gradient",
  "HorizonChart": "Chronic Disease Trend Horizons",
  "InequalityChart": "Departmental Cost Inequality Analysis",
  "LineChartMissingData": "Weekly Lab Reports Incompleteness",
  "MareysTrains": "Outpatient Doctor Schedules Timeline",
  "MultiLineUnemploymentChart": "Outpatient Volume Comparison across Branches",
  "MusicRevenueStackedBar": "Hospital Revenue Streams Breakup",
  "NZTouristsChart": "Patient Repeat Visit Intervals",
  "ParallelCoordinates": "Patient Metrics Parallel Analysis",
  "PercentChangeLineChart": "Percentage Patient Inflow Growth Rate",
  "ProjectCompletionBarChart": "Treatment Course Completion Rates",
  "RealtimeHorizonChart": "Realtime Patient Inflow Monitors",
  "RidgelinePlot": "Daily Admission Hour Density",
  "Scatterplot": "Billing Cost vs Patient Age Correlation",
  "ScatterplotMatrix": "Age vs Waiting Time vs Billing Matrix",
  "ScatterplotShapes": "Diagnostic Category Correlations",
  "SeaIceExtent": "Yearly Patients Volume Footprint",
  "SlopeChart": "Average Recovery Rate Before and After Treatment",
  "SpikeMap": "High-Density Disease Case Spikes Map",
  "StackedNormalizedBarChart": "Financial Billing Audit Clearance Status",
  "ThresholdEncodingLineChart": "Patient Inflow Above Threshold Limit",
  "USPopulationNormalized": "State-wise Outpatient Distribution",
  "VaccineHeatmap": "Immunization Coverage Density Grid",
  "VariableColorLineChart": "Seasonal Patient Fever Count Fluctuation",
  "StackedtoGroupedBarCharts": "Demographic Stacked-to-Grouped Cohorts",
  "ZoomToBoundingBox": "Geographic Region Bounding Box Fitting",
  "OrthographicToEquirectangular": "Planetary Projection Morphing Analysis",
  "WorldTour": "Global Health Outposts World Flight",
  "WalmartsGrowth": "Clinical Network Regional Expansion Wave",
  "HierarchicalBarChart": "Hierarchical Department Capital Allocation",
  "CollapsibleTree": "Interactive Medical Hierarchy Tree",
  "ZoomableIcicle": "Hierarchical Partition Capacity Icicle",
  "ZoomableSunburst": "Concentric Department Capital Sunburst",
  "SortableBarChart": "Multi-Criteria Sortable Department Performance",
  "IcelandicPopulation": "Historical Demographic Age Pyramid 1841–2019",
  "PieChartUpdate": "Dynamic Morphing Specialty Distribution",
  "Arctween": "Concentric Operational Load Arc Gauges",
  "VersorDragging": "3D Orthographic Versor Healthcare Globe",
  "SequencesSunburst": "Clinical Patient Pathway Sequences",
  "BrushableScatterplot": "Interactive 2D Brushable Clinical Scatterplot",
  "BrushableScatterplotMatrix": "Pairwise Scatter Plot Matrix Cross-Brushing",
};

// Converts PascalCase to words with spaces
export const humanize = (name = "") =>
  name
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();

// Assign an icon based on chart name characteristics
const getChartIcon = (name) => {
  const n = name.toLowerCase();
  if (n.includes("temporal") || n.includes("network") || n.includes("directed")) return "🕸️";
  if (n.includes("map") || n.includes("globe") || n.includes("tiles") || n.includes("spike")) return "🗺️";
  if (n.includes("bar")) return "📊";
  if (n.includes("pie") || n.includes("donut")) return "🥧";
  if (n.includes("line") || n.includes("horizon") || n.includes("slope") || n.includes("trend")) return "📈";
  if (n.includes("calendar") || n.includes("heatmap")) return "📅";
  if (n.includes("treemap") || n.includes("packing") || n.includes("enclose")) return "🔲";
  if (n.includes("scatter") || n.includes("bubble") || n.includes("beeswarm")) return "🫧";
  if (n.includes("chord")) return "🔄";
  if (n.includes("candlestick")) return "🕯️";
  return "📉";
};

const CHART_CUSTOM_KEYWORDS = {
  "CandlestickChart": "stock exchange market live realtime btc crypto trading ticks share ohlc coinbase aapl graph"
};

// All available charts list
export const ALL_CHARTS = Object.keys(CHART_CONTEXTS).map(name => {
  const clinicalTitle = CLINICAL_TITLES[name] || humanize(name);
  const humanTitle = humanize(name);
  const category = CHART_CONTEXTS[name] || "CONSULTATIONS";
  const icon = getChartIcon(name);
  const custom = CHART_CUSTOM_KEYWORDS[name] || "";

  return {
    name,
    title: clinicalTitle,
    humanName: humanTitle,
    category,
    icon,
    // Search tokens for fast matching
    searchKeywords: `${name} ${clinicalTitle} ${humanTitle} ${category} ${custom}`.toLowerCase()
  };
});

/**
 * Searches all charts by any keyword (e.g. "temporal", "donut", "bar", "disease", "billing")
 * Returns ranked results.
 */
export const searchCharts = (query, limit = 12) => {
  if (!query || typeof query !== "string") return [];
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const tokens = q.split(/\s+/);

  const matched = ALL_CHARTS.filter(chart => {
    // Every search token must match somewhere in the keywords
    return tokens.every(token => chart.searchKeywords.includes(token));
  });

  // Rank exact prefix matches higher
  matched.sort((a, b) => {
    const aStartsWith = a.name.toLowerCase().startsWith(q) || a.title.toLowerCase().startsWith(q);
    const bStartsWith = b.name.toLowerCase().startsWith(q) || b.title.toLowerCase().startsWith(q);
    if (aStartsWith && !bStartsWith) return -1;
    if (!aStartsWith && bStartsWith) return 1;
    return a.title.localeCompare(b.title);
  });

  return matched.slice(0, limit);
};
