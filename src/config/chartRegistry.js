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
  "CandlestickChart": "BILLING",
  "ZoomableAreaChart": "CONSULTATIONS",
  "ZoomableBarChart": "CONSULTATIONS",
  "SeamlessZoomableMapTiles": "GEOGRAPHY",
  "BollingerBands": "BILLING",
  "KernelDensityEstimation": "CONSULTATIONS",
  "DensityContours": "CONSULTATIONS",
  "VolcanoContours": "CONSULTATIONS",
  "Contours": "GEOGRAPHY",
  "Hexbin": "CONSULTATIONS",
  "HexbinArea": "CONSULTATIONS",
  "HexbinMap": "GEOGRAPHY",
  "QQPlot": "BILLING",
  "NormalQuantilePlot": "BILLING",
  "ParallelSets": "CONSULTATIONS",
  "Treemap": "CONSULTATIONS",
  "CascadedTreemap": "CONSULTATIONS",
  "NestedTreemap": "WARDS",
  "Movingaverage": "CONSULTATIONS",
  "Boxplot": "CONSULTATIONS",
  "Histogram": "CONSULTATIONS",
  "HierarchicalEdgeBounding": "CONSULTATIONS",
  "ConnectScatteredPlot": "CONSULTATIONS"
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
  "ZoomableAreaChart": "Zoomable Multi-Horizon Area Dynamics",
  "ZoomableBarChart": "Zoomable Granular Outpatient Bar Chart",
  "SeamlessZoomableMapTiles": "Seamless Zoomable Multi-Resolution Map Tiles",
  "BollingerBands": "Statistical Volatility Bollinger Bands",
  "KernelDensityEstimation": "Bivariate Gaussian Kernel Density Estimation",
  "DensityContours": "Patient Distribution Density Contours",
  "VolcanoContours": "Genomic Significance Volcano Contours",
  "Contours": "Multi-Threshold Isoline Contours",
  "Hexbin": "Hexagonal Aggregation Hexbin Heatmap",
  "HexbinArea": "Dynamic Area Sized Hexbin Distribution",
  "HexbinMap": "Geospatial Epidemiological Hexbin Map",
  "QQPlot": "Quantile-Quantile Normality Diagnostic Plot",
  "NormalQuantilePlot": "Normal Quantile Standard Deviation Plot",
  "ParallelSets": "Categorical Demographic Parallel Sets",
  "Treemap": "Hierarchical Hospital Department Treemap",
  "CascadedTreemap": "Cascaded Shaded Hierarchy Treemap",
  "NestedTreemap": "Nested Container Structural Treemap",
  "Pannablechart": "Pannable Inpatient Admissions with Context Brush",
  "Movingaverage": "Moving Average Trend Oscillator",
  "Boxplot": "Patient Vital Signs Box Plot",
  "Histogram": "Patient Age Distribution Histogram",
  "HierarchicalEdgeBounding": "Hierarchical Edge Bundling Network",
  "ConnectScatteredPlot": "Patient Age vs Consultation Count"
};

// Strips punctuation, curly quotes, en/em dashes, and normalizes spacing for search
export const normalizeText = (text = "") =>
  String(text)
    .toLowerCase()
    .replace(/[’'"`]/g, "")
    .replace(/[–—\-_/\\:]/g, " ")
    .replace(/[&(),.+*?[\]#]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

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
  if (n.includes("tree") || n.includes("dendrogram") || n.includes("icicle") || n.includes("sunburst")) return "🌳";
  if (n.includes("sankey") || n.includes("parallel") || n.includes("arc")) return "🔀";
  if (n.includes("hexbin") || n.includes("contour") || n.includes("density")) return "⬡";
  if (n.includes("temporal") || n.includes("network") || n.includes("directed") || n.includes("suits")) return "🕸️";
  if (n.includes("map") || n.includes("globe") || n.includes("tiles") || n.includes("spike")) return "🗺️";
  if (n.includes("bar")) return "📊";
  if (n.includes("pie") || n.includes("donut")) return "🥧";
  if (n.includes("line") || n.includes("horizon") || n.includes("slope") || n.includes("trend") || n.includes("average")) return "📈";
  if (n.includes("calendar") || n.includes("heatmap")) return "📅";
  if (n.includes("treemap") || n.includes("packing") || n.includes("enclose")) return "🔲";
  if (n.includes("scatter") || n.includes("bubble") || n.includes("beeswarm") || n.includes("plot")) return "🫧";
  if (n.includes("chord")) return "🔄";
  if (n.includes("candlestick")) return "🕯️";
  return "📉";
};

export const CHART_CUSTOM_KEYWORDS = {
  "CandlestickChart": "stock exchange market live realtime btc crypto trading ticks share ohlc coinbase aapl graph",
  "WalmartsGrowth": "walmart’s growth walmart's growth walmarts growth walmart retail expansion store store count wave timeline geographic",
  "WealthHealthChart": "the wealth & health of nations wealth and health nation nations gapminder hans rosling life expectancy gdp income billing age profile",
  "IcelandicPopulation": "icelandic population by age, 1841–2019 icelandic population by age 1841-2019 1841 2019 iceland population pyramid demographic age distribution",
  "MobilePatentSuits": "mobile patent suits smartphone tech litigation patent lawsuits licensing directed graph curved arrows apple google samsung",
  "StackedtoGroupedBarCharts": "stacked to grouped bars stacked-to-grouped bar chart transition toggle animation cohorts demographic",
  "QQPlot": "q–q plot q-q plot qq plot quantile quantile normality diagnostic test distribution residuals probability",
  "NormalQuantilePlot": "normal quantile plot normal probability plot q-q gaussian standard normal deviation z-score standard deviation",
  "HexbinArea": "hexbin (area) hexbin area dynamic radius size area hexbin hexagon binning",
  "Hexbin": "hexbin hexagonal binning heatmap hex density 2d 2-d aggregation",
  "HexbinMap": "hexbin map geospatial hexbin hexagon cartogram geographical spatial map epidemiological",
  "Contours": "contours contour plot isolines elevation marching squares topography multi-threshold",
  "DensityContours": "density contours 2d density kde contour isolines patient distribution bivariate",
  "VolcanoContours": "volcano contours volcano plot genomic significance log2 fold change pvalue p-value bioinformatics",
  "KernelDensityEstimation": "kernel density estimation kde density plot gaussian probability distribution bandwidth smooth bivariate",
  "ParallelSets": "parallel sets alluvial categorical flow sankey parallel categories multi-dimensional demographic",
  "Treemap": "treemap static treemap squarify partition hierarchical hospital tiles department",
  "CascadedTreemap": "cascaded treemap 2.5d shaded treemap cascaded tiles elevation hierarchy",
  "NestedTreemap": "nested treemap nested containers hierarchical padding margins wards",
  "CirclePacking": "circle packing static circular pack bubble hierarchy containment circles",
  "IndentedTree": "indented tree file tree collapsible list outline directory folder hierarchy tree explorer",
  "TidyTree": "tidy tree reingold tilford horizontal tree hierarchical graph disease pathways",
  "RadialTidyTree": "radial tidy tree 360 circular tidy tree circular hierarchy organ systems",
  "ClusterDendrogram": "cluster dendrogram equal depth dendrogram phylogenetic taxonomy clustering pathogen bacterial taxa",
  "RadialDendrogram": "radial dendrogram circular dendrogram circular perimeter cluster equidistant pharma classes",
  "Sunburst": "sunburst static sunburst multi ring partition radial partition concentric arcs service",
  "Icicle": "icicle static icicle horizontal partition flame graph capacity bed partition",
  "TangledTree": "tangled tree visualization tangled tree multi parent dag network causal cardiometabolic",
  "PhylogeneticTree": "phylogenetic tree phylogram evolutionary lineage viral mutation tree substitutions sars cov 2",
  "ForceDirectedTree": "force directed tree force-directed tree spring physics simulation hierarchy tree layout",
  "ForceDirectedGraph": "force directed graph force-directed graph network physics layout nodes links consultations",
  "DisjointForceDirectedGraph": "disjoint force directed graph disjoint force-directed graph disconnected components islands clusters campus regional",
  "ArcDiagram": "arc diagram 1d linear graph semi circular arcs arc link network tumor board oncology",
  "SankeyDiagram": "sankey diagram alluvial diagram volumetric flow multi stage ribbons patient workflow",
  "HierarchicalEdgeBounding": "hierarchical edge bundling hierarchical edge bounding radial curved bundles circular network bilink",
  "TemporalGraph": "temporal force-directed graph temporal force directed graph disease transmission network time timeline",
  "ConnectScatteredplot": "connected scatterplot connect scattered plot patient age consultation count path trajectory",
  "ConnectScatteredPlot": "connected scatterplot connect scattered plot patient age consultation count path trajectory",
  "Movingaverage": "moving average rolling mean rolling average sma ema smoothing trend time series dates",
  "Boxplot": "box plot boxplot box and whisker quartile median iqr diamonds vital signs",
  "Histogram": "histogram frequency distribution bins binning unemployment age distribution",
  "BollingerBands": "bollinger bands volatility standard deviation upper lower moving average envelope technical analysis",
  "Pannablechart": "pannable chart pannable inpatient admissions context brush pan zoom focus overview",
  "ZoomableAreaChart": "zoomable area chart area chart zoom pan time series multi horizon",
  "ZoomableBarChart": "zoomable bar chart bar chart zoom pan granular outpatient",
  "SeamlessZoomableMapTiles": "seamless zoomable map tiles slippy map raster vector tiles openstreetmap geography",
  "AnimatedTreeMap": "animated treemap animated tree map patient categorization",
  "BarChartRace": "bar chart race top diagnosed diseases race rank animation",
  "StreamGraph": "streamgraph transitions streamgraph stream graph seasonal disease outbreaks flow",
  "SmoothZoom": "smooth zooming smooth zoom pan consultation severity",
  "ZoomToBoundingBox": "zoom to bounding box geographic bounding box fitting map region",
  "OrthographicToEquirectangular": "orthographic to equirectangular map projection morphing planetary globe flat",
  "WorldTour": "world tour global health outposts world flight rotating globe flight path",
  "HierarchicalBarChart": "hierarchical bar chart drill down bar department capital allocation",
  "ZoomableTreemap": "zoomable treemap clinic operational cost breakdown zoom treemap",
  "ZoomableCirclePacking": "zoomable circle packing departmental hierarchy explorer zoom packing",
  "CollapsibleTree": "collapsible tree interactive medical hierarchy tree expand collapse",
  "ZoomableIcicle": "zoomable icicle hierarchical partition capacity icicle zoom icicle",
  "ZoomableSunburst": "zoomable sunburst concentric department capital sunburst zoom sunburst",
  "SortableBarChart": "sortable bar chart multi criteria sortable department performance sort",
  "PieChartUpdate": "pie chart update dynamic morphing specialty distribution slice transition",
  "Arctween": "arc tween concentric operational load arc gauges donut tween",
  "VersorDragging": "versor dragging 3d orthographic versor healthcare globe mouse drag quaternion",
  "IndexChart": "index chart medical inventory cost index stock baseline normalize percent change",
  "SequencesSunburst": "sequences sunburst clinical patient pathway sequences breadcrumb funnel",
  "BrushableScatterplot": "brushable scatterplot interactive 2d brushable clinical scatterplot rectangular brush select",
  "BrushableScatterplotMatrix": "brushable scatterplot matrix pairwise scatter plot matrix cross brushing splom pairs"
};

// All available charts list with rich normalized keywords and word-prefix sets
export const ALL_CHARTS = Object.keys(CHART_CONTEXTS).map(name => {
  const clinicalTitle = CLINICAL_TITLES[name] || humanize(name);
  const humanTitle = humanize(name);
  const category = CHART_CONTEXTS[name] || "CONSULTATIONS";
  const icon = getChartIcon(name);
  const custom = CHART_CUSTOM_KEYWORDS[name] || "";

  // Combine raw and normalized keywords into searchable string
  const rawKeywords = `${name} ${clinicalTitle} ${humanTitle} ${category} ${custom}`;
  const cleanKeywords = normalizeText(rawKeywords);
  const searchKeywords = `${rawKeywords.toLowerCase()} ${cleanKeywords}`;
  
  // Extract distinct clean words
  const words = Array.from(new Set(cleanKeywords.split(/\s+/).filter(Boolean)));

  return {
    name,
    title: clinicalTitle,
    humanName: humanTitle,
    category,
    icon,
    searchKeywords,
    words
  };
});

/**
 * Checks if a chart matches a user query string.
 * Supports token matching, word-prefixes, normalized punctuation.
 */
export const matchesChart = (chartOrName, query) => {
  if (!query || typeof query !== "string") return true;
  const qClean = normalizeText(query);
  if (!qClean) return true;

  const targetName = typeof chartOrName === "string" ? chartOrName : chartOrName?.name;
  if (!targetName) return false;

  const chart = ALL_CHARTS.find(c => c.name.toLowerCase() === targetName.toLowerCase());
  if (!chart) return false;

  const queryTokens = qClean.split(/\s+/).filter(Boolean);

  // Every word in user search query must match
  return queryTokens.every(token => {
    if (token.length <= 2) {
      return chart.words.some(w => w.startsWith(token));
    }
    return chart.words.some(w => w.startsWith(token)) || chart.searchKeywords.includes(token);
  });
};

/**
 * Searches all charts by any keyword (e.g. "temporal", "donut", "bar", "disease", "billing")
 * Returns ranked results.
 */
export const searchCharts = (query, limit = 12) => {
  if (!query || typeof query !== "string") return [];
  const qClean = normalizeText(query);
  if (!qClean) return [];

  const tokens = qClean.split(/\s+/).filter(Boolean);

  const matched = ALL_CHARTS.filter(chart => {
    return tokens.every(token => {
      if (token.length <= 2) {
        return chart.words.some(w => w.startsWith(token));
      }
      return chart.words.some(w => w.startsWith(token)) || chart.searchKeywords.includes(token);
    });
  });

  // Rank matches: exact match > custom keywords direct match > prefix match > alphabetical
  matched.sort((a, b) => {
    const aCleanName = normalizeText(a.name);
    const bCleanName = normalizeText(b.name);
    const aCleanTitle = normalizeText(a.title);
    const bCleanTitle = normalizeText(b.title);
    const aCleanHuman = normalizeText(a.humanName);
    const bCleanHuman = normalizeText(b.humanName);

    const aExact = aCleanName === qClean || aCleanHuman === qClean || aCleanTitle === qClean;
    const bExact = bCleanName === qClean || bCleanHuman === qClean || bCleanTitle === qClean;
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;

    // Direct match in custom keywords (e.g. "q–q plot" or "walmart's growth")
    const aCustom = normalizeText(CHART_CUSTOM_KEYWORDS[a.name] || "");
    const bCustom = normalizeText(CHART_CUSTOM_KEYWORDS[b.name] || "");
    const aCustomMatch = aCustom.includes(qClean);
    const bCustomMatch = bCustom.includes(qClean);
    if (aCustomMatch && !bCustomMatch) return -1;
    if (!aCustomMatch && bCustomMatch) return 1;

    const aPrefix = aCleanName.startsWith(qClean) || aCleanHuman.startsWith(qClean) || aCleanTitle.startsWith(qClean);
    const bPrefix = bCleanName.startsWith(qClean) || bCleanHuman.startsWith(qClean) || bCleanTitle.startsWith(qClean);
    if (aPrefix && !bPrefix) return -1;
    if (!aPrefix && bPrefix) return 1;

    return a.title.localeCompare(b.title);
  });

  // De-duplicate multiple alias entries
  const seen = new Set();
  const deduped = [];
  for (const c of matched) {
    const key = c.name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(c);
    }
  }

  return deduped.slice(0, limit);
};
