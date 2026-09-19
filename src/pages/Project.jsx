import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { fetchExcel, handlePublicCSVParse, handleWBS } from "../Utils/utils";

import Card from "../component/Card";
import DoughnutChart from "../component/Doughnut.Chart";
import DropDown from "../component/DropDown";
import BarChart from "../component/BarChart";
import { statusMap } from "../Utils/utils";
import GanttChart from "../component/GanttChart";
import * as XLSX from "xlsx";
import GanttTimeline from "../component/GanttTimeline";
import GanttSchedule from "../component/GanttSchedule";
 
const AnimatedTreeMap = React.lazy(() => import("../component/Charts/AnimatedTreeMap"));
const ConnectScatteredplot = React.lazy(() => import("../component/Charts/ConnectScatteredPlot"));
const ScatterplotTour = React.lazy(() => import("../component/Charts/ScatterplotTour"));
const TemporalGraph = React.lazy(() => import("../component/Charts/TemporalGraph"));
const SmoothZoom = React.lazy(() => import("../component/Charts/SmoothZoom"));
const BarChartRace = React.lazy(() => import("../component/Charts/BarChartRace"));
const BarChartTransitions = React.lazy(() => import("../component/Charts/BarChartTransitions"));
 
 
 
const IndexChart = React.lazy(() => import("../component/Charts/IndexChart"));
const StreamGraph = React.lazy(() => import("../component/Charts/StreamGraph.jsx"));
const ProjectionBlendCanvas = React.lazy(() => import("../component/Charts/ProjectionBlendCanvas"));
const WealthHealthChart = React.lazy(() => import("../component/Charts/WealthHealthChart"));
const RotatingGlobe = React.lazy(() => import("../component/Charts/RotatingGlobe"));
const ZoomableTreemap = React.lazy(() => import("../component/Charts/ZoomableTreemap"));
const ZoomableCirclePacking = React.lazy(() => import("../component/Charts/ZoomableCirclePacking"));
const RadialAreaChart = React.lazy(() => import("../component/Charts/RadialAreaChart.jsx"));
const RadialstackedBchart = React.lazy(() => import("../component/Charts/RadialstackedBchart.jsx"));
const LineChart1 = React.lazy(() => import("../component/Charts/LineChart1.jsx"));
const SimpleBarChart = React.lazy(() => import("../component/Charts/SimpleBarChart.jsx"));
const DonutChart1 = React.lazy(() => import("../component/Charts/DonutChart1.jsx"));
const RadialStackedBarSorted = React.lazy(() => import("../component/Charts/RadialStackedBarSorted.jsx"));
const HorizontalBarChart = React.lazy(() => import("../component/Charts/HorizontalBarChart.jsx"));
const ChordDiagram = React.lazy(() => import("../component/Charts/ChordDiagram.jsx"));
const SimplePieChart = React.lazy(() => import("../component/Charts/SimplePieChart.jsx"));
const WorldMap1 = React.lazy(() => import("../component/Charts/WorldMap1.jsx"));
const ChoroplethWorldMap = React.lazy(() => import("../component/Charts/ChoroplethWorldMap.jsx"));
const HorizontalBarChart1 = React.lazy(() => import("../component/Charts/HorizontalBarChart1.jsx"));
const DivergingBarChart = React.lazy(() => import("../component/Charts/DivergingBarChart.jsx"));
const StackedBarChart = React.lazy(() => import("../component/Charts/StackedBarChart.jsx"));
const StackedNormalizedHorizontalChart = React.lazy(() => import("../component/Charts/StackedNormalizedHorizontalChart.jsx"));
const StackedHorizontalBarChart = React.lazy(() => import("../component/Charts/StackedHorizontalBarChart.jsx"));
const MarimekkoChart = React.lazy(() => import("../component/Charts/MarimekkoChart.jsx"));
const WorldTimelineChart = React.lazy(() => import("../component/Charts/WorldHistoryTimeline.jsx"));
const Calendar = React.lazy(() => import("../component/Charts/Calendar.jsx"));
const VaccineImpactChart = React.lazy(() => import("../component/Charts/VaccineImpactChart.jsx"));
const MusicRevenueChart = React.lazy(() => import("../component/Charts/MusicRevenueChart.jsx"));
const HorizontalBarchartCsv = React.lazy(() => import("../component/Charts/HorizontalBarChartCsv.jsx"));
const SortedBarChart = React.lazy(() => import("../component/Charts/SortedBarChartCsv.jsx"));
const SortedBarChartCsv = React.lazy(() => import("../component/Charts/SortedBarChartCsv.jsx"));
const ProjectionComparisonChart = React.lazy(() => import("../component/Charts/ProjectionComparisonChart .jsx"));
const TissotWorldMap = React.lazy(() => import("../component/Charts/TissotWorldMap.jsx"));
const WorldMapwithDifferentprojectin = React.lazy(() => import("../component/Charts/WorldMapwithDifferentprojectin.jsx"));
const ProjectionTransitionChart = React.lazy(() => import("../component/Charts/ProjectionTransitionChart.jsx"));
const VectorWorldMap = React.lazy(() => import("../component/Charts/VectorWorldMap.jsx"));
const DonutChartCsv = React.lazy(() => import("../component/Charts/DonutChartCsv.jsx"));
const NewzlandTourismChart = React.lazy(() => import("../component/Charts/NewzlandTourismChart.jsx"));
const SeaIceExtentChart = React.lazy(() => import("../component/Charts/SeaIceExtentChart .jsx"));
const AreaChart = React.lazy(() => import("../component/Charts/AreaChart.jsx"));
const StackedAreaChart = React.lazy(() => import("../component/Charts/StackedAreaChart.jsx"));
const NormalizedStackedAreaChart = React.lazy(() => import("../component/Charts/NormalizedStackedAreaChart.jsx"));
const USPopulationChart = React.lazy(() => import("../component/USPopulationChart.jsx"));
const DifferenceChart = React.lazy(() => import("../component/Charts/DifferenceChart.jsx"));
const BandChart = React.lazy(() => import("../component/Charts/BandChart.jsx"));
const RasterTilesMap = React.lazy(() => import("../component/Charts/RasterTilesMap.jsx"));
const VectorTilesMap = React.lazy(() => import("../component/Charts/VectorTilesMap.jsx"));
const RasterVectorChart = React.lazy(() => import("../component/Charts/RasterVectorChart.jsx"));
const Occlusion = React.lazy(() => import("../component/Charts/Occlusion.jsx"));
const PackEncloseChart = React.lazy(() => import("../component/Charts/PackEncloseChart .jsx"));
const BarChartWithMissingData = React.lazy(() => import("../component/Charts/BarChartWithMissingData.jsx"));
import PaletteManager from "../component/PaletteManager";
import ColorWheel from "../component/colorwheel.jsx";
import ChartCard from "../component/ChartCard.jsx";
import { anmChartService } from "../services/anmChartService";
import { CHART_SELECTIONS } from "../config/chartSelections";
import { noxAnalyticsService } from "../services/noxAnalyticsService";

// ==== Merged from Priya's (nox-debug-master) project — charts not present in base ====
const AreaWithMissingData = React.lazy(() => import("../component/Charts/AreaWithMissingData.jsx"));
const BeeswarmChart = React.lazy(() => import("../component/Charts/BeeswarmChart.jsx"));
const BubbleChart = React.lazy(() => import("../component/Charts/BubbleChart.jsx"));
const BubbleMap = React.lazy(() => import("../component/Charts/BubbleMap.jsx"));
const CalendarHeatmap = React.lazy(() => import("../component/Charts/CalendarHeatmap.jsx"));
const CancerSurvivalSlopeChart = React.lazy(() => import("../component/Charts/CancerSurvivalSlopeChart.jsx"));
const CandlestickChart = React.lazy(() => import("../component/Charts/CandlestickChart.jsx"));
const ChordChart = React.lazy(() => import("../component/Charts/ChordChart.jsx"));
const DJICalendarHeatmap = React.lazy(() => import("../component/Charts/DJICalendarHeatmap.jsx"));
const DirectedChordDiagram = React.lazy(() => import("../component/Charts/DirectedChordDiagram.jsx"));
const DirectedChordDiagram1 = React.lazy(() => import("../component/Charts/DirectedChordDiagram1.jsx"));
const Divergingstackedbarchart = React.lazy(() => import("../component/Charts/Divergingstackedbarchart.jsx"));
const DotPlot = React.lazy(() => import("../component/Charts/DotPlot.jsx"));
const ElectricityCalendarHeatmap = React.lazy(() => import("../component/Charts/ElectricityCalendarHeatmap.jsx"));
const GlobalTemperatureTrends = React.lazy(() => import("../component/Charts/GlobalTemperatureTrends.jsx"));
const GradientEncodingLineChart = React.lazy(() => import("../component/Charts/GradientEncodingLineChart.jsx"));
const HorizonChart = React.lazy(() => import("../component/Charts/HorizonChart.jsx"));
const InequalityChart = React.lazy(() => import("../component/Charts/InequalityChart.jsx"));
const LineChartMissingData = React.lazy(() => import("../component/Charts/LineChartMissingData.jsx"));
const MareysTrains = React.lazy(() => import("../component/Charts/MareysTrains.jsx"));
const MultiLineUnemploymentChart = React.lazy(() => import("../component/Charts/MultiLineUnemploymentChart.jsx"));
const MusicRevenueStackedBar = React.lazy(() => import("../component/Charts/MusicRevenueStackedBar.jsx"));
const NZTouristsChart = React.lazy(() => import("../component/Charts/NZTouristsChart.jsx"));
const ParallelCoordinates = React.lazy(() => import("../component/Charts/ParallelCoordinates.jsx"));
const PercentChangeLineChart = React.lazy(() => import("../component/Charts/PercentChangeLineChart.jsx"));
const ProjectCompletionBarChart = React.lazy(() => import("../component/Charts/ProjectCompletionBarChart.jsx"));
const RealtimeHorizonChart = React.lazy(() => import("../component/Charts/RealtimeHorizonChart.jsx"));
const RidgelinePlot = React.lazy(() => import("../component/Charts/RidgelinePlot.jsx"));
const Scatterplot = React.lazy(() => import("../component/Charts/Scatterplot.jsx"));
const ScatterplotMatrix = React.lazy(() => import("../component/Charts/ScatterplotMatrix.jsx"));
const ScatterplotShapes = React.lazy(() => import("../component/Charts/ScatterplotShapes.jsx"));
const SeaIceExtent = React.lazy(() => import("../component/Charts/SeaIceExtent.jsx"));
const SlopeChart = React.lazy(() => import("../component/Charts/SlopeChart.jsx"));
const SpikeMap = React.lazy(() => import("../component/Charts/SpikeMap.jsx"));
const StackedNormalizedBarChart = React.lazy(() => import("../component/Charts/StackedNormalizedBarChart.jsx"));
const ThresholdEncodingLineChart = React.lazy(() => import("../component/Charts/ThresholdEncodingLineChart.jsx"));
const USPopulationNormalized = React.lazy(() => import("../component/Charts/USPopulationNormalized.jsx"));
const VaccineHeatmap = React.lazy(() => import("../component/Charts/VaccineHeatmap.jsx"));
const VariableColorLineChart = React.lazy(() => import("../component/Charts/VariableColorLineChart.jsx"));
const StackedtoGroupedBarCharts = React.lazy(() => import("../component/Charts/StackedtoGroupedBarCharts.jsx"));
const ZoomToBoundingBox = React.lazy(() => import("../component/Charts/ZoomToBoundingBox.jsx"));
const OrthographicToEquirectangular = React.lazy(() => import("../component/Charts/OrthographicToEquirectangular.jsx"));
const WorldTour = React.lazy(() => import("../component/Charts/WorldTour.jsx"));
const WalmartsGrowth = React.lazy(() => import("../component/Charts/WalmartsGrowth.jsx"));
const HierarchicalBarChart = React.lazy(() => import("../component/Charts/HierarchicalBarChart.jsx"));


const CHART_CONTEXTS = {
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
  "StackedtoGroupedBarCharts": "CONSULTATIONS",
  "ZoomToBoundingBox": "GEOGRAPHY",
  "OrthographicToEquirectangular": "GEOGRAPHY",
  "WorldTour": "GEOGRAPHY",
  "WalmartsGrowth": "GEOGRAPHY",
  "HierarchicalBarChart": "INVENTORY"
};

const LazyChartCard = ({ name, getChartName, Component, accentColor, onDrillDown, isAnm, isDataEmpty, fetchNew, isHighlighted = false }) => {
  const [inView, setInView] = useState(false);
  const ref = useRef();

  useEffect(() => {
    if (isHighlighted) {
      setInView(true);
    }
  }, [isHighlighted]);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        observer.disconnect(); // Render once and stay mounted
      }
    }, { rootMargin: "150px" });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const context = CHART_CONTEXTS[name] || "CONSULTATIONS";
  const isStatic = context === "INVENTORY";
  const elementKey = isStatic ? `${name}-${accentColor}` : `${name}-${fetchNew}-${accentColor}`;

  return (
    <div 
      ref={ref} 
      id={`chart-${name}`}
      className={`w-full transition-all duration-500 ${
        isHighlighted ? "ring-4 ring-indigo-500 shadow-2xl rounded-xl scale-[1.01]" : ""
      }`}
    >
      <ChartCard 
        name={getChartName(name)} 
        accentColor={accentColor}
        onDrillDown={onDrillDown}
      >
        {!inView ? (
          <div className="h-[220px] flex items-center justify-center text-xs text-gray-400 font-Aldrich">
            Loading chart...
          </div>
        ) : isDataEmpty ? (
          <div className="flex flex-col items-center justify-center p-8 text-center min-h-[220px]">
            <div className="text-gray-400 text-4xl mb-2">📊</div>
            <p className="text-sm font-semibold text-gray-500 font-Aldrich">
              No clinical records match the selected filters.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Try adjusting search keywords or clearing date range.
            </p>
          </div>
        ) : (
          <React.Suspense fallback={
            <div className="h-[220px] flex items-center justify-center text-xs text-gray-400 font-Aldrich animate-pulse">
              Initializing component...
            </div>
          }>
            <Component key={elementKey} />
          </React.Suspense>
        )}
      </ChartCard>
    </div>
  );
};

const Project = () => {
  const { project_id } = useParams();
  const [approved, setApproved] = useState([]);
  const navigate = useNavigate();
  const [completed, setCompleted] = useState([]);
  const [pending, setPending] = useState([]);
  const [newTotal, setTotal] = useState([]);
  const [chartType, setChartType] = useState("Final Status");
  const [chartData, setChartData] = useState({ high: 0, medium: 0, low: 0 });
  const [changeType, setChangeType] = useState({
    enhancement: "",
    newFeature: "",
  });
  const [inProgressItems, setInProgressItems] = useState([]);
  const [data, setData] = useState([]);
  const [taskData, setTaskData] = useState([]);
  const [scheduleSheetData, setScheduleSheetData] = useState([]);
  const [fetchNew, setFetchNew] = useState(false)
  const [accentColor, setAccentColor] = useState(() => {
    try { return localStorage.getItem("nox_accent_color") || "#6366f1"; }
    catch { return "#6366f1"; }
  });
  const [showColorWheel, setShowColorWheel] = useState(false);

  // Chart Search and Highlight States
  const [chartSearchKeyword, setChartSearchKeyword] = useState("");
  const [highlightedChart, setHighlightedChart] = useState(null);
  const location = useLocation();

  // ANM Quadrant Filter and Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedDiagnosis, setSelectedDiagnosis] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // ANM Drill-down Overlay States
  const [drillDownChart, setDrillDownChart] = useState(null);
  const [drillDownContext, setDrillDownContext] = useState(null);

  // ANM Auto-Refresh and Legend Toggle States
  const [isAutoRefreshActive, setIsAutoRefreshActive] = useState(false);
  const [toggledOffDiagnoses, setToggledOffDiagnoses] = useState([]);
  const [isTabVisible, setIsTabVisible] = useState(true);

  // ANM Telemetry Events State
  const [telemetryEvents, setTelemetryEvents] = useState(() => noxAnalyticsService.getEvents());

  // ANM Performance Profiling Refs
  const renderStartTime = useRef(performance.now());

  let commentChartData;

  const chartOptions = [
    {
      key: "Priority",
      label: "Priority",
      onClick: () => handleChartTypeChange("Priority"),
    },
    {
      key: "Impact",
      label: "Impact",
      onClick: () => handleChartTypeChange("Impact"),
    },
    {
      key: "Final Status",
      label: "Final Status",
      onClick: () => handleChartTypeChange("Final Status"),
    },
  ];

  const chnageType = (data) => {
    let filtedByEnhancement = data.filter(
      (item) => item["Change Type"]?.toLowerCase() === "enhancement"
    );

    let filtedByNewFeature = data.filter(
      (item) => item["Change Type"]?.toLowerCase() === "new feature"
    );

    setChangeType({
      enhancement: filtedByEnhancement.length,
      newFeature: filtedByNewFeature.length,
    });
  };
  const getCommentChartData = (changeRequests) => {
    // Filter the change requests based on the presence of comments
    const withComments = changeRequests.filter((item) => {
      const comment = item["Comments/Notes"];
      return typeof comment === "string" && comment.trim() !== ""; // Non-empty comments
    });

    const withoutComments = changeRequests.filter((item) => {
      const comment = item["Comments/Notes"];
      return typeof comment === "string" && comment.trim() === ""; // Empty comments
    });
    
    // Now you can return the objects as well as the count data
    return {
      withCommentsData: withComments,
      withoutCommentsData: withoutComments,
      chartData: [
        {
          label: "With Comments",
          value: withComments.length,
          color: "#10b981",
        },
        {
          label: "Without Comments",
          value: withoutComments.length,
          color: "#ef4444",
        },
      ],
    };
  };

  const handleNavigateOfCard = (project_id, label) => {
    // Clean the label (convert to lowercase, remove spaces)

    // Map the cleaned key using statusMap
    const status = statusMap[label] || key; // fallback to the key itself if no mapping exists

    // Navigate with the mapped status
    navigate(`/SuperAdmin/Dashboard/${project_id}/details/${status}`);
  };  // Intercept fetch requests for ANM Quadrant project to load live API or fallback clinical dummy data
  useEffect(() => {
    if (project_id === "anm-quadrant" || project_id === "anm_quadrant") {
      const originalFetch = window.fetch;
      window.fetch = async (input, init) => {
        const url = typeof input === "string" ? input : input.url;

        const mockTargets = [
          "dummyjson.com",
          "fakestoreapi.com",
          "diamonds.json",
          "unemployment.json",
          "dates.json",
          "worldbank.org",
          "api.open-meteo.com",
          "api.frankfurter.app",
          "nominatim.openstreetmap.org",
          "counties-albers-10m.json",
          "population.json",
          "vaccines (1).json",
          "alphabet.csv",
          "limkar-chord-data.csv",
          "cancer.csv",
          "aapl.csv",
          "debt.csv",
          "flare-imports.csv",
          "politifact.csv",
          "^DJI.csv",
          "DonutChartcsv.csv",
          "us-population-state-age.csv",
          "pge-electric-data.csv",
          "temperatures.csv",
          "temperature.csv",
          "traffic.csv",
          "metros.csv",
          "bls-metro-unemployment.csv",
          "music.csv",
          "unemployment.csv",
          "nz-tourists@1.csv",
          "cars.csv",
          "mtcars.csv",
          "penguins.csv",
          "iris.csv",
          "sea-ice-extent.csv",
          "government-receipts-of-gdp.csv",
          "SortedBarChartCsv.csv",
          "fcm.csv",
          "flare.csv"
        ];

        const isMockTarget = mockTargets.some(target => url.includes(target));

        if (isMockTarget) {
          try {
            const mockRes = await anmChartService.handleFetch(url, {
              search: debouncedSearchQuery,
              diagnosis: selectedDiagnosis,
              status: selectedStatus,
              startDate: startDate,
              endDate: endDate,
              toggledOffDiagnoses: toggledOffDiagnoses
            });
            const contentType = typeof mockRes === "string" ? "text/plain" : "application/json";
            const bodyContent = typeof mockRes === "string" ? mockRes : JSON.stringify(mockRes);
            return new Response(bodyContent, {
              status: 200,
              headers: { "Content-Type": contentType }
            });
          } catch (e) {
            console.error("[ANM Fetch Interceptor] Interception failed:", e);
          }
        }
        return originalFetch(input, init);
      };

      return () => {
        window.fetch = originalFetch;
      };
    }
  }, [project_id, debouncedSearchQuery, selectedDiagnosis, selectedStatus, startDate, endDate, toggledOffDiagnoses]);

  useEffect(() => {
    const normalizeKey = (key) =>
      key
        .replace(/[\n\r↵]/g, ' ') // Replace newline-like characters with space
        .replace(/\s+/g, ' ')     // Collapse multiple spaces
        .trim();                  // Trim surrounding spaces

    const loadData = async () => {
      let rawData = await handlePublicCSVParse(project_id);

      if (!rawData) {
        // Fallback dummy data for Status Dashboard cards and metrics
        rawData = [
          { "Approval Status": "Approved", "Final Status": "Completed", "Priority": "High", "Impact": "High", "Change Type": "New Feature", "Comments/Notes": "Integrated patient records system" },
          { "Approval Status": "Approved", "Final Status": "In Progress", "Priority": "Medium", "Impact": "Medium", "Change Type": "Enhancement", "Comments/Notes": "Optimize search index" },
          { "Approval Status": "Pending", "Final Status": "Pending", "Priority": "Low", "Impact": "Low", "Change Type": "New Feature", "Comments/Notes": "" },
          { "Approval Status": "Approved", "Final Status": "Completed", "Priority": "High", "Impact": "Low", "Change Type": "Enhancement", "Comments/Notes": "Updated UI styles" },
          { "Approval Status": "Pending", "Final Status": "Pending", "Priority": "High", "Impact": "High", "Change Type": "New Feature", "Comments/Notes": "" },
          { "Approval Status": "Approved", "Final Status": "In Progress", "Priority": "Low", "Impact": "Medium", "Change Type": "Enhancement", "Comments/Notes": "Fix mobile view spacing" },
          { "Approval Status": "Approved", "Final Status": "Completed", "Priority": "Medium", "Impact": "High", "Change Type": "New Feature", "Comments/Notes": "Add medical report export" }
        ];
      }

      // Clean keys
      const cleanedData = rawData.map((row) => {
        const cleanedRow = {};
        for (const key in row) {
          const cleanKey = normalizeKey(key);
          cleanedRow[cleanKey] = row[key];
        }
        return cleanedRow;
      });

      setTotal(cleanedData);

      // Filter logic
      const approvedItems = cleanedData.filter(
        (item) => item["Approval Status"]?.trim().toLowerCase() === "approved"
      );

      const completedItems = cleanedData.filter(
        (item) => item["Final Status"]?.trim().toLowerCase() === "completed"
      );

      const pendingItems = cleanedData.filter(
        (item) => item["Approval Status"]?.trim().toLowerCase() === "pending"
      );

      const inProgressItems = cleanedData.filter(
        (item) => item["Final Status"]?.trim().toLowerCase() === "in progress"
      );

      setApproved(approvedItems);
      setCompleted(completedItems);
      setPending(pendingItems);
      setInProgressItems(inProgressItems);

      // ✅ Updated count logic based on the selected field
      const countLevels = (key) => {
        const result = {};

        if (key === "Priority" || key === "Impact") {
          result.high = cleanedData.filter((item) => item[key]?.toLowerCase() === "high").length;
          result.medium = cleanedData.filter((item) => item[key]?.toLowerCase() === "medium").length;
          result.low = cleanedData.filter((item) => item[key]?.toLowerCase() === "low").length;
        } else if (key === "Final Status") {
          result.completed = cleanedData.filter((item) => item[key]?.toLowerCase() === "completed").length;
          result.inProgress = cleanedData.filter((item) => item[key]?.toLowerCase() === "in progress").length;
        }

        return result;
      };

      const priorityCounts = countLevels("Priority");
      const impactCounts = countLevels("Impact");
      const finalStatusCounts = countLevels("Final Status");

      // Set chart data based on selected chart type
      setChartData(
        chartType === "Priority"
          ? priorityCounts
          : chartType === "Impact"
          ? impactCounts
          : chartType === "Final Status"
          ? finalStatusCounts
          : {}
      );

      // Update any other state if needed
      chnageType(rawData);
      commentChartData = getCommentChartData(rawData);
    };

 // Other sheets
  const fetchData = async () => {
    const data = await fetchExcel({
      path: "/WBS-With-Gantt-Chart-25092024.xlsx",
      range: 6,
      columns: ["TASK TITLE", "TASK OWNER", "START DATE", "DUE DATE", "DURATION"],
    });
    setTaskData(data);
  };

  // const fetchData = async () => {
  //   const data = await handleWBS(project_id);
    
    
  //    const cleanedData = data.map((row) => {
  //     const cleanedRow = {};
  //     for (const key in row) {
  //       const cleanKey = normalizeKey(key);
  //       cleanedRow[cleanKey] = row[key];
  //     }
  //     return cleanedRow;
  //   });

  //   setTaskData(cleanedData);
  // };

  const FetchProjectTimeLineSheet = async () => {
    const data = await fetchExcel({
      path: "/BIZCRED_Time Line_20072026.xlsx",
      range: 30,
      columns: ["CATEGORY", "TASK", "START", "END", "COLOR"],
    });
    setData(data);
  };

  const FetchProjectScheduleSheet = async () => {
    const data = await fetchExcel({
      path: "/Project Schedule_GanttChart_LimkarEcomphase2(GanttChart).csv",
      range: 6,
      columns: ["WBS", "TASK", "LEAD", "START", "END", "DAYS", "% DONE", "WORK DAYS"],
    });
    setScheduleSheetData(data);
  };

  // Load all at once
  fetchData();
  FetchProjectTimeLineSheet();
  FetchProjectScheduleSheet();
  loadData();
}, [project_id, chartType, fetchNew]);

  // Listen to palette changes to dynamically reload charts with new palette colors
  useEffect(() => {
    const handlePaletteChange = () => {
      setFetchNew(prev => !prev);
    };
    window.addEventListener('paletteChanged', handlePaletteChange);
    return () => {
      window.removeEventListener('paletteChanged', handlePaletteChange);
    };
  }, []);

  // Modal key listener for ESC key to close drill-down overlay
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && drillDownChart) {
        noxAnalyticsService.trackEvent("Navigation", "Close Drill-down Modal (ESC)", drillDownChart);
        setDrillDownChart(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [drillDownChart]);

  // Synchronize telemetry events state
  useEffect(() => {
    const handleTelemetryUpdate = (e) => {
      setTelemetryEvents(e.detail);
    };
    window.addEventListener("noxTelemetryUpdated", handleTelemetryUpdate);
    return () => {
      window.removeEventListener("noxTelemetryUpdated", handleTelemetryUpdate);
    };
  }, []);

  const handleDrillDown = (componentName) => {
    setDrillDownChart(componentName);
    setDrillDownContext(CHART_CONTEXTS[componentName] || "CONSULTATIONS");
    noxAnalyticsService.trackEvent("Navigation", "Open Drill-down Modal", componentName);
  };

  const closeDrillDown = () => {
    if (drillDownChart) {
      noxAnalyticsService.trackEvent("Navigation", "Close Drill-down Modal", drillDownChart);
    }
    setDrillDownChart(null);
  };

  // Search query debounce effect (300ms) to throttle chart re-fetching
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      if (searchQuery.trim() !== "") {
        noxAnalyticsService.trackEvent("Filters", "Search Query Applied", searchQuery);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Force chart data remount when any filter changes
  useEffect(() => {
    setFetchNew(prev => !prev);
  }, [debouncedSearchQuery, selectedDiagnosis, selectedStatus, startDate, endDate, toggledOffDiagnoses]);

  // Listen for URL query parameter or hash anchor to highlight and scroll to chart
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const targetChart = params.get("chart") || (location.hash ? location.hash.replace("#chart-", "") : "");
    if (targetChart) {
      setHighlightedChart(targetChart);
      setTimeout(() => {
        const el = document.getElementById(`chart-${targetChart}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 350);

      const timer = setTimeout(() => {
        setHighlightedChart(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [location.search, location.hash]);

  // Listen for global chart search and selection events from Header
  useEffect(() => {
    const handleChartSelected = (e) => {
      const { name } = e.detail || {};
      if (name) {
        setHighlightedChart(name);
        setTimeout(() => {
          const el = document.getElementById(`chart-${name}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 150);

        setTimeout(() => {
          setHighlightedChart(null);
        }, 4000);
      }
    };

    const handleChartQuery = (e) => {
      setChartSearchKeyword(e.detail || "");
    };

    window.addEventListener("chartSelected", handleChartSelected);
    window.addEventListener("chartSearchQuery", handleChartQuery);
    return () => {
      window.removeEventListener("chartSelected", handleChartSelected);
      window.removeEventListener("chartSearchQuery", handleChartQuery);
    };
  }, []);

  // Listen to tab visibility changes to pause auto-refresh in background
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden);
      console.log(`[ANM Visibility] Tab state changed. Is focused/active: ${!document.hidden}`);
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Performance optimized dynamic auto-refresh loop (every 20 seconds)
  // Automatically paused when tab is inactive, or when drill-down modal is open
  useEffect(() => {
    if (!isAutoRefreshActive || !isTabVisible || drillDownChart) {
      console.log(`[ANM Auto-Refresh] Polling paused. Active: ${isAutoRefreshActive}, TabVisible: ${isTabVisible}, ModalOpen: ${!!drillDownChart}`);
      return;
    }

    console.log(`[ANM Auto-Refresh] Polling started. Interval: 20 seconds.`);
    const interval = setInterval(() => {
      anmChartService.simulateRealTimeUpdate();
      setFetchNew(prev => !prev);
    }, 20000);

    return () => {
      clearInterval(interval);
      console.log(`[ANM Auto-Refresh] Polling cleared.`);
    };
  }, [isAutoRefreshActive, isTabVisible, drillDownChart]);

  // Capture render start time on fetchNew changes
  useEffect(() => {
    renderStartTime.current = performance.now();
  }, [fetchNew]);

  // Log render duration after layout paint
  useEffect(() => {
    const duration = performance.now() - renderStartTime.current;
    console.log(`[ANM Perf Profiler] Render Tick Duration: ${duration.toFixed(2)} ms`);
  }, [fetchNew]);

  // Log initial page load FCP approximation
  useEffect(() => {
    const handleLoad = () => {
      setTimeout(() => {
        const [navigation] = performance.getEntriesByType("navigation");
        const loadTime = navigation ? navigation.duration / 1000 : 0;
        console.log(`[ANM Perf Profiler] Initial FCP / Load Time: ${loadTime.toFixed(2)}s`);
      }, 500);
    };
    if (document.readyState === "complete") {
      handleLoad();
    } else {
      window.addEventListener("load", handleLoad);
      return () => window.removeEventListener("load", handleLoad);
    }
  }, []);

  // Global tooltip cleaning to prevent memory leaks from unmounted D3 absolute divss
  useEffect(() => {
    const cleanupTooltips = () => {
      const tooltips = document.querySelectorAll(".tooltip, .d3-tooltip, [id*='tooltip']");
      tooltips.forEach((el) => {
        if (el && el.parentNode === document.body) {
          el.remove();
        }
      });
    };
    cleanupTooltips();
    return () => cleanupTooltips();
  }, [fetchNew]);


  useEffect(() => {
    // if (taskData.length > 0) {
    //   console.log("Updated taskData:", taskData);
    // }
    // if (data.length > 0) {
    //   console.log("new Updated taskData:", data);
    // }
    // if (scheduleSheetData.length > 0) {
    //   console.log("Schedule Sheet data:", scheduleSheetData);
    // }
    // if (newTotal.length > 0) {
    //   console.log("Total data:", newTotal);
    // }
    if (taskData.length > 0) {
      console.log("Total data:", taskData);
    }
  }, [taskData]);

  const handleChartTypeChange = (selected) => {
    setChartType(selected);
    const combinedData = approved.concat(completed, pending);

    const counts = (key) => ({
      high: combinedData.filter((item) => item[key]?.toLowerCase() === "high")
        .length,
      medium: combinedData.filter(
        (item) => item[key]?.toLowerCase() === "medium"
      ).length,
      low: combinedData.filter((item) => item[key]?.toLowerCase() === "low")
        .length,
      completed: combinedData.filter(
        (item) => item[key]?.toLowerCase() === "completed"
      ).length,
      inProgress: combinedData.filter(
        (item) => item[key]?.toLowerCase() === "in progress"
      ).length,
    });

    setChartData(counts(selected));
  };

  const idMap = {
    "limkar-ecommerce": "LIMKAR",
    "thalasa-service-desk": "Thalasa Service Desk",
    "anm-quadrant": "ANM Quadrant",
    "anm_quadrant": "ANM Quadrant"
  };

  const chartComponents = [
    { name: "AnimatedTreeMap", Component: AnimatedTreeMap },
    { name: "ConnectScatteredplot", Component: ConnectScatteredplot },
    { name: "ScatterplotTour", Component: ScatterplotTour },
    { name: "TemporalGraph", Component: TemporalGraph },
    { name: "SmoothZoom", Component: SmoothZoom },
    { name: "BarChartRace", Component: BarChartRace },
    { name: "BarChartTransitions", Component: BarChartTransitions },
    { name: "IndexChart", Component: IndexChart },
    { name: "StreamGraph", Component: StreamGraph },
    { name: "ProjectionBlendCanvas", Component: ProjectionBlendCanvas },
    { name: "WealthHealthChart", Component: WealthHealthChart },
    { name: "RotatingGlobe", Component: RotatingGlobe },
    { name: "ZoomableTreemap", Component: ZoomableTreemap },
    { name: "ZoomableCirclePacking", Component: ZoomableCirclePacking },
    { name: "RadialAreaChart", Component: RadialAreaChart },
    { name: "RadialstackedBchart", Component: RadialstackedBchart },
    { name: "LineChart1", Component: LineChart1 },
    { name: "SimpleBarChart", Component: SimpleBarChart },
    { name: "DonutChart1", Component: DonutChart1 },
    { name: "RadialStackedBarSorted", Component: RadialStackedBarSorted },
    { name: "HorizontalBarChart", Component: HorizontalBarChart },
    { name: "ChordDiagram", Component: ChordDiagram },
    { name: "SimplePieChart", Component: SimplePieChart },
    { name: "WorldMap1", Component: WorldMap1 },
    { name: "ChoroplethWorldMap", Component: ChoroplethWorldMap },
    { name: "HorizontalBarChart1", Component: HorizontalBarChart1 },
    { name: "DivergingBarChart", Component: DivergingBarChart },
    { name: "StackedBarChart", Component: StackedBarChart },
    { name: "StackedNormalizedHorizontalChart", Component: StackedNormalizedHorizontalChart },
    { name: "StackedHorizontalBarChart", Component: StackedHorizontalBarChart },
    { name: "MarimekkoChart", Component: MarimekkoChart },
    { name: "WorldTimelineChart", Component: WorldTimelineChart },
    { name: "Calendar", Component: Calendar },
    { name: "VaccineImpactChart", Component: VaccineImpactChart },
    { name: "MusicRevenueChart", Component: MusicRevenueChart },
    { name: "HorizontalBarchartCsv", Component: HorizontalBarchartCsv },
    { name: "SortedBarChartCsv", Component: SortedBarChartCsv },
    { name: "ProjectionComparisonChart", Component: ProjectionComparisonChart },
    { name: "TissotWorldMap", Component: TissotWorldMap },
    { name: "WorldMapwithDifferentprojectin", Component: WorldMapwithDifferentprojectin },
    { name: "ProjectionTransitionChart", Component: ProjectionTransitionChart },
    { name: "VectorWorldMap", Component: VectorWorldMap },
    { name: "DonutChartCsv", Component: DonutChartCsv },
    { name: "NewzlandTourismChart", Component: NewzlandTourismChart },
    { name: "SeaIceExtentChart", Component: SeaIceExtentChart },
    { name: "AreaChart", Component: AreaChart },
    { name: "BarChartWithMissingData", Component: BarChartWithMissingData },
    { name: "StackedAreaChart", Component: StackedAreaChart },
    { name: "NormalizedStackedAreaChart", Component: NormalizedStackedAreaChart },
    { name: "USPopulationChart", Component: USPopulationChart },
    { name: "DifferenceChart", Component: DifferenceChart },
    { name: "BandChart", Component: BandChart },
    { name: "RasterTilesMap", Component: RasterTilesMap },
    { name: "VectorTilesMap", Component: VectorTilesMap },
    { name: "RasterVectorChart", Component: RasterVectorChart },
    { name: "Occlusion", Component: Occlusion },
    { name: "PackEncloseChart", Component: PackEncloseChart },
    { name: "AreaWithMissingData", Component: AreaWithMissingData },
    { name: "BeeswarmChart", Component: BeeswarmChart },
    { name: "BubbleChart", Component: BubbleChart },
    { name: "BubbleMap", Component: BubbleMap },
    { name: "CalendarHeatmap", Component: CalendarHeatmap },
    { name: "CancerSurvivalSlopeChart", Component: CancerSurvivalSlopeChart },
    { name: "CandlestickChart", Component: CandlestickChart },
    { name: "ChordChart", Component: ChordChart },
    { name: "DJICalendarHeatmap", Component: DJICalendarHeatmap },
    { name: "DirectedChordDiagram", Component: DirectedChordDiagram },
    { name: "DirectedChordDiagram1", Component: DirectedChordDiagram1 },
    { name: "Divergingstackedbarchart", Component: Divergingstackedbarchart },
    { name: "DotPlot", Component: DotPlot },
    { name: "ElectricityCalendarHeatmap", Component: ElectricityCalendarHeatmap },
    { name: "GlobalTemperatureTrends", Component: GlobalTemperatureTrends },
    { name: "GradientEncodingLineChart", Component: GradientEncodingLineChart },
    { name: "HorizonChart", Component: HorizonChart },
    { name: "InequalityChart", Component: InequalityChart },
    { name: "LineChartMissingData", Component: LineChartMissingData },
    { name: "MareysTrains", Component: MareysTrains },
    { name: "MultiLineUnemploymentChart", Component: MultiLineUnemploymentChart },
    { name: "MusicRevenueStackedBar", Component: MusicRevenueStackedBar },
    { name: "NZTouristsChart", Component: NZTouristsChart },
    { name: "ParallelCoordinates", Component: ParallelCoordinates },
    { name: "PercentChangeLineChart", Component: PercentChangeLineChart },
    { name: "ProjectCompletionBarChart", Component: ProjectCompletionBarChart },
    { name: "RealtimeHorizonChart", Component: RealtimeHorizonChart },
    { name: "RidgelinePlot", Component: RidgelinePlot },
    { name: "Scatterplot", Component: Scatterplot },
    { name: "ScatterplotMatrix", Component: ScatterplotMatrix },
    { name: "ScatterplotShapes", Component: ScatterplotShapes },
    { name: "SeaIceExtent", Component: SeaIceExtent },
    { name: "SlopeChart", Component: SlopeChart },
    { name: "SpikeMap", Component: SpikeMap },
    { name: "StackedNormalizedBarChart", Component: StackedNormalizedBarChart },
    { name: "ThresholdEncodingLineChart", Component: ThresholdEncodingLineChart },
    { name: "USPopulationNormalized", Component: USPopulationNormalized },
    { name: "VaccineHeatmap", Component: VaccineHeatmap },
    { name: "VariableColorLineChart", Component: VariableColorLineChart },
    { name: "StackedtoGroupedBarCharts", Component: StackedtoGroupedBarCharts },
    { name: "ZoomToBoundingBox", Component: ZoomToBoundingBox },
    { name: "OrthographicToEquirectangular", Component: OrthographicToEquirectangular },
    { name: "WorldTour", Component: WorldTour },
    { name: "WalmartsGrowth", Component: WalmartsGrowth },
    { name: "HierarchicalBarChart", Component: HierarchicalBarChart }
  ];

  const getChartName = (originalName) => {
    if (project_id === "anm-quadrant" || project_id === "anm_quadrant") {
      const anmNames = {
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
        "CandlestickChart": "Daily Pharmacy Revenue Candlesticks",
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
        "HierarchicalBarChart": "Hierarchical Department Capital Allocation"
      };
      return anmNames[originalName] || originalName;
    }
    return originalName;
  };

  return (
    <div className="rounded-lg min-h-screen bg-white transition-colors duration-200 px-2 md:px-4 py-4">
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowColorWheel(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 shadow-sm font-Aldrich text-sm bg-white text-black hover:bg-gray-100 transition-colors"
        >
          <span
            className="inline-block w-4 h-4 rounded-full border border-gray-300"
            style={{ background: accentColor }}
          />
          🎨 Customize Colors
        </button>
      </div>
      {showColorWheel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <ColorWheel
            initialColor={accentColor}
            categoryName="Chart Gallery Accent"
            onApply={(colors, meta) => {
              const hex = meta?.color || colors?.[0] || accentColor;
              setAccentColor(hex);
              try { 
                localStorage.setItem("nox_accent_color", hex);
                // Dispatch event so that chart components reload with new accent color shades
                window.dispatchEvent(new CustomEvent('paletteChanged', { detail: { color: hex } }));
              } catch {}
              setShowColorWheel(false);
            }}
            onClose={() => setShowColorWheel(false)}
          />
        </div>
      )}
      <h1 className="text-2xl font-bold text-center mb-8 text-black">
        {idMap[project_id] || "Project Dashboard"}
      </h1>
      <PaletteManager/>
    <div className="mb-10">
    </div>
      <div className="flex justify-between mb-8">{/* Summary Stats */}
      <h1 className="text-xl text-gray-500 font-bold mb-4">
        Overview of Change Requests
      </h1>
      <button
        onClick={() => setFetchNew(prev => !prev)}
        className="px-4 border dark:bg-black shadow-2xl dark:text-white font-semibold rounded hover:bg-gray-700 hover:text-white transition"
      >
     Pull
      </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        <Card
          className="border border-gray-300"
          label="Total Requests"
          count={newTotal.length}
          total={newTotal}
          project_id={project_id}
          handleNavigateOfCard={handleNavigateOfCard}
          color="red"
        />
        <Card
          className="border border-gray-300"
          label="Approved Requests"
          count={approved.length}
          approved={approved}
          project_id={project_id}
          handleNavigateOfCard={handleNavigateOfCard}
          color="green"
        />
        <Card
          className="border border-gray-300"
          label="Completed Requests"
          count={completed.length}
          completed={completed}
          project_id={project_id}
          handleNavigateOfCard={handleNavigateOfCard}
          color="blue"
        />
        <Card
          className="border border-gray-300"
          label="Pending Requests"
          count={pending.length}
          pending={pending}
          project_id={project_id}
          handleNavigateOfCard={handleNavigateOfCard}
          color="yellow"
        />
      </div>
      <div></div>
      <div className="flex gap-6">
        {/* Chart */}
        <div className="bg-white shadow-xl flex flex-col justify-between items-center w-[40%] rounded-lg p-6 border border-gray-200 mb-10">
          <div className="flex justify-center gap-2 items-center w-full mb-4">
       

            <h1 className="text-2xl font-bold">Breakdown by</h1>
            <DropDown
              items={chartOptions}
              label={chartType}
              className="border rounded px-3 py-1 flex gap-2 items-center cursor-pointer"
              icon={null}
            />
          </div>
          <div className="w-full h-full flex justify-center items-center">
            <DoughnutChart
              high={chartData.high}
              medium={chartData.medium}
              low={chartData.low}
              completed={chartData.completed}
              inProgress={chartData.inProgress}
            />
          </div>
        </div>

        <div className="bg-white shadow-xl flex flex-col justify-between items-center w-full rounded-lg p-6 border border-gray-200 mb-10">
          <div className="flex  flex-col  justify-center gap-2 items-center w-full mb-4">
            <h1 className="text-2xl font-bold">Breakdown by Change Type</h1>
            <BarChart changeType={changeType} />
          </div>
        </div>
      </div>
      <h1 className="text-xl text-gray-500 font-bold mb-4">
        Overview of Work Breackdown Structure
      </h1>
      <div className="bg-white shadow-xl flex flex-col justify-between items-center w-full rounded-lg p-6 border border-gray-200 mb-10">
        <GanttChart data={taskData} />
      </div>

      <h1 className="text-xl text-gray-500 font-bold mb-4">
        Overview of Project Timeline
      </h1>
      <div className="bg-white shadow-xl flex flex-col justify-between items-center w-full rounded-lg p-6 border border-gray-200 mb-10">
        <GanttTimeline data={data} />
      </div>

      <h1 className="text-xl text-gray-500 font-bold mb-4">
        Overview of Project Schedule
      </h1>
      <div className="bg-white shadow-xl flex flex-col justify-between items-center w-full rounded-lg p-6 border border-gray-200 mb-10">
        <GanttSchedule data={scheduleSheetData} />
      </div>

      {/* FILTER AND SEARCH CONTROLS (Only visible for ANM Quadrant) */}
      {(project_id === "anm-quadrant" || project_id === "anm_quadrant") && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-lg mb-8 w-full flex flex-wrap gap-5 items-center justify-between">
          <div className="flex flex-wrap gap-4 items-center flex-1">
            
            {/* Search Input */}
            <div className="flex flex-col min-w-[200px] flex-1">
              <label className="text-xs font-semibold text-gray-500 mb-1 font-Aldrich">Search Patient / Doctor / Disease</label>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-Aldrich w-full text-black"
              />
            </div>

            {/* Diagnosis Dropdown */}
            <div className="flex flex-col min-w-[150px]">
              <label className="text-xs font-semibold text-gray-500 mb-1 font-Aldrich">Diagnosis Category</label>
              <select
                value={selectedDiagnosis}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedDiagnosis(val);
                  noxAnalyticsService.trackEvent("Filters", "Diagnosis Category Changed", val);
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-Aldrich text-black"
              >
                <option value="All">All Categories</option>
                <option value="Analgesics">Analgesics</option>
                <option value="Antivirals">Antivirals</option>
                <option value="Immunizations">Immunizations</option>
                <option value="Antibiotics">Antibiotics</option>
              </select>
            </div>

            {/* Status Dropdown */}
            <div className="flex flex-col min-w-[150px]">
              <label className="text-xs font-semibold text-gray-500 mb-1 font-Aldrich">Consultation Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedStatus(val);
                  noxAnalyticsService.trackEvent("Filters", "Consultation Status Changed", val);
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-Aldrich text-black"
              >
                <option value="All">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {/* Start Date */}
            <div className="flex flex-col min-w-[140px]">
              <label className="text-xs font-semibold text-gray-500 mb-1 font-Aldrich">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  const val = e.target.value;
                  setStartDate(val);
                  noxAnalyticsService.trackEvent("Filters", "Start Date Changed", val);
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-Aldrich text-black"
              />
            </div>

            {/* End Date */}
            <div className="flex flex-col min-w-[140px]">
              <label className="text-xs font-semibold text-gray-500 mb-1 font-Aldrich">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  const val = e.target.value;
                  setEndDate(val);
                  noxAnalyticsService.trackEvent("Filters", "End Date Changed", val);
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-Aldrich text-black"
              />
            </div>

            {/* Auto-Refresh Toggle */}
            <div className="flex flex-col min-w-[150px]">
              <label className="text-xs font-semibold text-gray-500 mb-1 font-Aldrich flex items-center gap-1">
                🔄 Auto-Refresh {isAutoRefreshActive && <span className="animate-spin text-[10px]">⌛</span>}
              </label>
              <button
                onClick={() => {
                  const nextVal = !isAutoRefreshActive;
                  setIsAutoRefreshActive(nextVal);
                  noxAnalyticsService.trackEvent("Simulation", "Auto-Refresh Toggled", nextVal ? "ON" : "OFF");
                }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all font-Aldrich ${isAutoRefreshActive ? 'bg-emerald-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'}`}
              >
                {isAutoRefreshActive ? 'ON (20s Poll)' : 'OFF (Paused)'}
              </button>
            </div>

          </div>

          {/* Reset Filters Button */}
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedDiagnosis("All");
              setSelectedStatus("All");
              setStartDate("");
              setEndDate("");
              setToggledOffDiagnoses([]);
              noxAnalyticsService.trackEvent("Filters", "Reset Filters Clicked", "All fields cleared");
            }}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg text-sm transition-colors border border-gray-300 font-Aldrich"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* GLOBAL SERIES LEGEND TOGGLE (Only visible for ANM Quadrant) */}
      {(project_id === "anm-quadrant" || project_id === "anm_quadrant") && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 mb-6 w-full flex flex-wrap gap-4 items-center">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-Aldrich">Global Series Legends:</span>
          {['Analgesics', 'Antivirals', 'Immunizations', 'Antibiotics'].map((diag) => {
            const isHidden = toggledOffDiagnoses.includes(diag);
            const colors = {
              'Analgesics': 'bg-indigo-500',
              'Antivirals': 'bg-emerald-500',
              'Immunizations': 'bg-amber-500',
              'Antibiotics': 'bg-rose-500'
            };
            return (
              <button
                key={diag}
                onClick={() => {
                  if (isHidden) {
                    setToggledOffDiagnoses(prev => prev.filter(x => x !== diag));
                    noxAnalyticsService.trackEvent("Legend", "Series Enabled", diag);
                  } else {
                    setToggledOffDiagnoses(prev => [...prev, diag]);
                    noxAnalyticsService.trackEvent("Legend", "Series Disabled", diag);
                  }
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all font-Aldrich hover:scale-105 cursor-pointer ${isHidden ? 'bg-gray-100 text-gray-400 border-gray-200 line-through opacity-60' : 'bg-white text-gray-800 border-gray-300 shadow-sm'}`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${colors[diag]} ${isHidden ? 'bg-gray-300' : ''}`} />
                {diag}
              </button>
            );
          })}
          <span className="text-[10px] text-gray-400 font-Aldrich ml-auto italic">Click to toggle series visibility on all 52 charts</span>
        </div>
      )}

      {/* CHART SEARCH & FILTER BAR */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[260px] max-w-lg relative">
          <span className="text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Filter charts by name or category (e.g. Temporal, Donut, Bar)..."
            value={chartSearchKeyword}
            onChange={(e) => setChartSearchKeyword(e.target.value)}
            className="w-full pl-2 pr-8 py-2 text-xs md:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-Aldrich text-black"
          />
          {chartSearchKeyword && (
            <button
              onClick={() => setChartSearchKeyword("")}
              className="absolute right-2.5 text-gray-400 hover:text-gray-700 text-xs p-1"
              title="Clear Filter"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs font-Aldrich">
          {chartSearchKeyword ? (
            <div className="flex items-center gap-2">
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full font-semibold">
                Filtering: "{chartSearchKeyword}"
              </span>
              <button
                onClick={() => setChartSearchKeyword("")}
                className="text-xs text-rose-600 hover:underline cursor-pointer font-bold"
              >
                Clear Filter
              </button>
            </div>
          ) : (
            <span className="text-gray-400 text-[11px] hidden sm:inline-block">
              Type above or use the top search bar to find any chart
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 mx-auto">
        {(() => {
          const selectedList = CHART_SELECTIONS[project_id];
          let filteredCharts = selectedList 
            ? chartComponents.filter(({ name }) => selectedList.includes(name))
            : chartComponents;
          
          if (chartSearchKeyword.trim()) {
            const q = chartSearchKeyword.toLowerCase().trim();
            filteredCharts = filteredCharts.filter(({ name }) => {
              const clinical = getChartName(name).toLowerCase();
              const technical = name.toLowerCase();
              const category = (CHART_CONTEXTS[name] || "").toLowerCase();
              return technical.includes(q) || clinical.includes(q) || category.includes(q);
            });
          }

          if (filteredCharts.length === 0) {
            return (
              <div className="bg-white border border-gray-200 rounded-xl p-12 text-center flex flex-col items-center justify-center gap-3">
                <span className="text-4xl">🔍</span>
                <h3 className="text-base font-bold text-gray-800 font-Aldrich">
                  No charts found matching "{chartSearchKeyword}"
                </h3>
                <p className="text-xs text-gray-500 font-Aldrich">
                  Try searching for keywords like "Temporal", "Donut", "Bar", "Map", or reset your search.
                </p>
                <button
                  onClick={() => setChartSearchKeyword("")}
                  className="mt-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold font-Aldrich transition-colors shadow-sm cursor-pointer"
                >
                  Reset Chart Search
                </button>
              </div>
            );
          }

          // Check if data is empty for ANM
          const isAnm = project_id === "anm-quadrant" || project_id === "anm_quadrant";
          const isDataEmpty = isAnm && anmChartService.getFilteredCount({
            search: debouncedSearchQuery,
            diagnosis: selectedDiagnosis,
            status: selectedStatus,
            startDate,
            endDate
          }) === 0;

          return filteredCharts.map(({ name, Component }) => (
            <LazyChartCard
              key={name}
              name={name}
              getChartName={getChartName}
              Component={Component}
              accentColor={accentColor}
              onDrillDown={isAnm ? () => handleDrillDown(name) : null}
              isAnm={isAnm}
              isDataEmpty={isDataEmpty}
              fetchNew={fetchNew}
              isHighlighted={highlightedChart === name}
            />
          ));
        })()}
      </div>

      {/* NOX TELEMETRY MONITOR PANEL (Only visible for ANM Quadrant) */}
      {(project_id === "anm-quadrant" || project_id === "anm_quadrant") && (
        <div className="mt-8 border border-slate-200 rounded-xl shadow-lg bg-white overflow-hidden">
          <div 
            style={{ borderLeft: `4px solid ${accentColor}` }}
            className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">📡</span>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 font-Aldrich">
                Nox Real-time Telemetry Monitor
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[10px] text-gray-500 font-Aldrich uppercase bg-gray-100 px-2 py-0.5 rounded">
                Buffer cap: 30 events
              </span>
              <button
                onClick={() => noxAnalyticsService.clearEvents()}
                className="text-xs font-semibold text-rose-600 hover:text-rose-800 font-Aldrich transition-colors cursor-pointer"
              >
                🗑️ Clear Logs
              </button>
            </div>
          </div>

          <div className="p-5 max-h-[300px] overflow-y-auto bg-slate-950 font-mono text-xs text-slate-300 space-y-2 select-text selection:bg-indigo-500 selection:text-white">
            {telemetryEvents.length === 0 ? (
              <div className="text-center text-slate-500 py-8 font-Aldrich">
                [No events recorded yet. Interact with filters or charts to track activity.]
              </div>
            ) : (
              [...telemetryEvents].reverse().map((evt) => (
                <div 
                  key={evt.id} 
                  className="flex flex-col md:flex-row md:items-center gap-2 border-b border-slate-800 pb-2 last:border-0 hover:bg-slate-900 px-2 py-1 rounded transition-colors"
                >
                  <span className="text-slate-500 font-semibold flex-shrink-0">[{evt.timestamp}]</span>
                  <span 
                    style={{ color: accentColor }}
                    className="font-bold flex-shrink-0 uppercase text-[10px] tracking-wide"
                  >
                    {evt.category}
                  </span>
                  <span className="text-indigo-400 flex-shrink-0 font-semibold">{evt.action}</span>
                  {evt.label && (
                    <span className="text-emerald-400 break-all">
                      ➔ <span className="text-slate-400">"{evt.label}"</span>
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* DRILL DOWN MODAL OVERLAY */}
      {drillDownChart && (
        <div 
          onClick={closeDrillDown}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-gray-200 rounded-xl p-6 shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-gray-200 mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800 font-Aldrich">
                  Drill Down: {getChartName(drillDownChart)}
                </h2>
                <p className="text-xs text-gray-500 font-Aldrich mt-0.5">
                  Context Category: <span className="font-semibold text-indigo-600">{drillDownContext}</span>
                </p>
              </div>
              <button 
                onClick={closeDrillDown}
                className="text-gray-500 hover:text-gray-800 font-bold text-lg font-Aldrich hover:bg-gray-100 px-3 py-1 rounded transition-colors"
              >
                ✕ Close
              </button>
            </div>

            {/* Content Table */}
            <div className="flex-1 overflow-auto min-h-[300px]">
              {(() => {
                const currentFilters = {
                  search: debouncedSearchQuery,
                  diagnosis: selectedDiagnosis,
                  status: selectedStatus,
                  startDate,
                  endDate
                };

                let records = [];
                if (drillDownContext === "CONSULTATIONS") {
                  records = anmChartService.getFilteredConsultations(currentFilters);
                } else if (drillDownContext === "INVENTORY") {
                  records = anmChartService.getFilteredMedicines(currentFilters);
                } else if (drillDownContext === "GEOGRAPHY") {
                  records = anmChartService.getFilteredPatients(currentFilters);
                } else if (drillDownContext === "WARDS") {
                  records = anmChartService.getFilteredWards(currentFilters);
                } else if (drillDownContext === "BILLING") {
                  records = anmChartService.getFilteredInvoices(currentFilters);
                }

                if (records.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                      <div className="text-gray-400 text-5xl mb-2">📊</div>
                      <p className="text-base font-semibold text-gray-500 font-Aldrich">
                        No clinical records match the selected filters.
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Try adjusting search keywords or clearing date range.
                      </p>
                    </div>
                  );
                }

                return (
                  <table className="w-full text-left border-collapse font-Aldrich text-slate-800">
                    <thead>
                      <tr className="border-b border-gray-300 text-slate-500 text-xs uppercase bg-slate-50">
                        {drillDownContext === "CONSULTATIONS" && (
                          <>
                            <th className="p-3">ID</th>
                            <th className="p-3">Patient</th>
                            <th className="p-3">Doctor</th>
                            <th className="p-3">Diagnosis</th>
                            <th className="p-3">Duration</th>
                            <th className="p-3">Cost</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Date</th>
                          </>
                        )}
                        {drillDownContext === "INVENTORY" && (
                          <>
                            <th className="p-3">Medicine Name</th>
                            <th className="p-3">Category</th>
                            <th className="p-3">Available Stock</th>
                            <th className="p-3">Unit Cost</th>
                            <th className="p-3">Sell Price</th>
                          </>
                        )}
                        {drillDownContext === "GEOGRAPHY" && (
                          <>
                            <th className="p-3">Name</th>
                            <th className="p-3">City</th>
                            <th className="p-3">Country</th>
                            <th className="p-3">Age</th>
                            <th className="p-3">Gender</th>
                            <th className="p-3">Joined Date</th>
                            <th className="p-3">Status</th>
                          </>
                        )}
                        {drillDownContext === "WARDS" && (
                          <>
                            <th className="p-3">Ward Name</th>
                            <th className="p-3">Total Beds</th>
                            <th className="p-3">Occupied</th>
                            <th className="p-3">Admissions</th>
                            <th className="p-3">Severity</th>
                          </>
                        )}
                        {drillDownContext === "BILLING" && (
                          <>
                            <th className="p-3">Invoice ID</th>
                            <th className="p-3">Patient</th>
                            <th className="p-3">Diagnosis</th>
                            <th className="p-3">Amount</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Remaining Balance</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((r, idx) => (
                        <tr key={r.id || idx} className="border-b border-gray-100 hover:bg-slate-50 transition-colors">
                          {drillDownContext === "CONSULTATIONS" && (
                            <>
                              <td className="p-3 text-sm font-semibold">{r.id}</td>
                              <td className="p-3 text-sm font-semibold">{r.patient}</td>
                              <td className="p-3 text-sm">{r.doctor}</td>
                              <td className="p-3 text-sm">{r.diagnosis}</td>
                              <td className="p-3 text-sm">{r.duration} min</td>
                              <td className="p-3 text-sm">₹{r.cost}</td>
                              <td className="p-3 text-sm">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${r.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                  {r.status}
                                </span>
                              </td>
                              <td className="p-3 text-sm">{r.date}</td>
                            </>
                          )}
                          {drillDownContext === "INVENTORY" && (
                            <>
                              <td className="p-3 text-sm font-semibold">{r.name}</td>
                              <td className="p-3 text-sm">{r.category}</td>
                              <td className="p-3 text-sm font-semibold">{r.stock} units</td>
                              <td className="p-3 text-sm">₹{r.unit_cost}</td>
                              <td className="p-3 text-sm font-semibold">₹{r.sell_price}</td>
                            </>
                          )}
                          {drillDownContext === "GEOGRAPHY" && (
                            <>
                              <td className="p-3 text-sm font-semibold">{r.name}</td>
                              <td className="p-3 text-sm">{r.city}</td>
                              <td className="p-3 text-sm">{r.country}</td>
                              <td className="p-3 text-sm">{r.age} yrs</td>
                              <td className="p-3 text-sm">{r.gender}</td>
                              <td className="p-3 text-sm">{r.joined}</td>
                              <td className="p-3 text-sm">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${r.status === 'completed' || r.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                  {r.status}
                                </span>
                              </td>
                            </>
                          )}
                          {drillDownContext === "WARDS" && (
                            <>
                              <td className="p-3 text-sm font-semibold">{r.name}</td>
                              <td className="p-3 text-sm">{r.totalBeds} beds</td>
                              <td className="p-3 text-sm">{r.occupiedBeds} beds</td>
                              <td className="p-3 text-sm font-semibold">{r.admissions} cases</td>
                              <td className="p-3 text-sm">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${r.severity === 'Critical' || r.severity === 'High' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'}`}>
                                  {r.severity}
                                </span>
                              </td>
                            </>
                          )}
                          {drillDownContext === "BILLING" && (
                            <>
                              <td className="p-3 text-sm font-semibold">{r.id}</td>
                              <td className="p-3 text-sm font-semibold">{r.patient}</td>
                              <td className="p-3 text-sm">{r.diagnosis}</td>
                              <td className="p-3 text-sm font-semibold">₹{r.amount}</td>
                              <td className="p-3 text-sm">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${r.balance === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                  {r.balance === 0 ? 'Paid' : 'Unpaid'}
                                </span>
                              </td>
                              <td className="p-3 text-sm font-semibold text-rose-600">₹{r.balance}</td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Project;