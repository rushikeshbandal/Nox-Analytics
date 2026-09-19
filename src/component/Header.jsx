import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaBars, FaBell, FaUser, FaSearch, FaTimes } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { getInitialsFromEmail } from "../Utils/utils";
import PopOver from "./PopOver";
import SwitchButton from "./SwitchButton";
import { searchCharts, ALL_CHARTS } from "../config/chartRegistry";

// Category badge colors for search suggestions
const CATEGORY_BADGE_STYLES = {
  CONSULTATIONS: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
  INVENTORY: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  GEOGRAPHY: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
  WARDS: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  BILLING: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800"
};

const Header = ({ isSidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [initials, setInitials] = useState("");
  const [isUser, setIsUser] = useState({
    email: "",
    role: "",
  });

  // Chart Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return;

      const parsedUser = JSON.parse(userStr);
      const email = parsedUser?.email || parsedUser?.role?.email || "";
      const role = parsedUser?.role?.name || parsedUser?.role || "";

      setIsUser({
        email,
        role,
      });

      if (email) {
        const userInitials = getInitialsFromEmail(email);
        setInitials(userInitials);
      }
    } catch (error) {
      console.error("Error reading user from localStorage:", error);
    }
  }, []);

  // Update search results whenever searchQuery changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearchOpen(false);
      setSelectedIndex(-1);
      return;
    }

    const matches = searchCharts(searchQuery, 10);
    setSearchResults(matches);
    setIsSearchOpen(true);
    setSelectedIndex(matches.length > 0 ? 0 : -1);

    // Broadcast search query so open dashboards can filter in-place if desired
    window.dispatchEvent(
      new CustomEvent("chartSearchQuery", { detail: searchQuery.trim() })
    );
  }, [searchQuery]);

  // Click outside to dismiss search results
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Global keyboard shortcut: '/' or 'Ctrl+K' / 'Cmd+K' to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        (e.key === "/" || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k")) &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
        if (searchQuery.trim()) setIsSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchQuery]);

  // Select and navigate to a chart
  const handleSelectChart = (chart) => {
    if (!chart) return;

    setIsSearchOpen(false);
    setSelectedIndex(-1);

    // Dispatch custom event with chart details for dashboards
    window.dispatchEvent(
      new CustomEvent("chartSelected", {
        detail: {
          name: chart.name,
          title: chart.title,
          category: chart.category,
        },
      })
    );

    // Check if chart element already exists in the current DOM
    const chartCardElement = document.getElementById(`chart-${chart.name}`);

    if (chartCardElement) {
      // Scroll smoothly to chart and apply pulsing highlight
      chartCardElement.scrollIntoView({ behavior: "smooth", block: "center" });
      chartCardElement.classList.add("ring-4", "ring-indigo-500", "scale-[1.01]", "shadow-2xl");
      setTimeout(() => {
        chartCardElement.classList.remove("ring-4", "ring-indigo-500", "scale-[1.01]", "shadow-2xl");
      }, 3500);
    } else {
      // Navigate to the main charts dashboard with query param and hash anchor
      navigate(`/SuperAdmin/Dashboard/anm-quadrant?chart=${chart.name}#chart-${chart.name}`);
    }
  };

  // Handle Keyboard Navigation inside the search input
  const handleInputKeyDown = (e) => {
    if (!isSearchOpen || searchResults.length === 0) {
      if (e.key === "Enter" && searchQuery.trim()) {
        // Direct search event for page filters
        window.dispatchEvent(
          new CustomEvent("chartSearchQuery", { detail: searchQuery.trim() })
        );
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
        handleSelectChart(searchResults[selectedIndex]);
      } else if (searchResults.length > 0) {
        handleSelectChart(searchResults[0]);
      }
    } else if (e.key === "Escape") {
      setIsSearchOpen(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setIsSearchOpen(false);
    searchInputRef.current?.focus();
    window.dispatchEvent(new CustomEvent("chartSearchQuery", { detail: "" }));
  };

  const content = (
    <div className="text-sm space-y-3 p-3 primary rounded-lg">
      {/* Email Row */}
      <div className="flex items-center space-x-2">
        <MdEmail className="text-lg" />
        <span className="font-medium text-gray-600">Email:</span>
        <span className="truncate">{isUser.email || "N/A"}</span>
      </div>

      {/* Role Row */}
      <div className="flex items-center space-x-2">
        <FaUser className="text-lg" />
        <span className="font-medium text-gray-600">Role:</span>
        <span className="capitalize">{isUser.role || "N/A"}</span>
      </div>
    </div>
  );

  return (
    <header className="bg-white dark:bg-custom-bg dark:border-none sticky top-0 z-40 my-2 mx-6 border border-gray-300 rounded-lg text-white p-4 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-4">
        <FaBars
          className="text-2xl dark:text-white text-black cursor-pointer"
          onClick={() => setSidebarOpen(!isSidebarOpen)}
        />
      </div>

      <div className="flex items-center gap-4 flex-1 justify-end max-w-3xl">
        {/* ── WORKABLE CHART SEARCH BAR ── */}
        <div ref={searchContainerRef} className="relative w-full max-w-md">
          <div className="relative flex items-center">
            <FaSearch className="absolute left-3 text-gray-400 dark:text-gray-400 text-sm pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchQuery.trim() && searchResults.length > 0) {
                  setIsSearchOpen(true);
                }
              }}
              onKeyDown={handleInputKeyDown}
              placeholder="Search any chart (e.g. Temporal, Donut, Bar)..."
              className="w-full pl-9 pr-16 py-2 bg-slate-50 dark:bg-slate-900/90 text-slate-800 dark:text-white border border-gray-300 dark:border-slate-700 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-inner"
            />
            {searchQuery ? (
              <button
                onClick={handleClearSearch}
                title="Clear Search"
                className="absolute right-2.5 p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
              >
                <FaTimes className="text-xs" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-block absolute right-2.5 px-1.5 py-0.5 text-[10px] font-mono text-gray-400 bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded shadow-xs">
                /
              </kbd>
            )}
          </div>

          {/* ── LIVE SEARCH DROPDOWN ── */}
          {isSearchOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden text-slate-800 dark:text-slate-100 flex flex-col max-h-[380px] animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Header with summary */}
              <div className="px-3 py-2 bg-slate-50 dark:bg-slate-950/80 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-gray-500 dark:text-slate-400 font-medium">
                <span>
                  Found <strong className="text-indigo-600 dark:text-indigo-400">{searchResults.length}</strong> matching chart{searchResults.length === 1 ? "" : "s"}
                </span>
                <span className="text-[10px] text-gray-400">Press ↵ to jump</span>
              </div>

              {/* Results List */}
              <div className="overflow-y-auto max-h-[300px] divide-y divide-gray-100 dark:divide-slate-800/60">
                {searchResults.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-400 dark:text-slate-500 flex flex-col items-center gap-1.5">
                    <span className="text-xl">🔍</span>
                    <p className="font-semibold text-gray-600 dark:text-slate-400">No charts found matching "{searchQuery}"</p>
                    <p className="text-[11px]">Try searching by chart type, category, or clinical diagnosis.</p>
                  </div>
                ) : (
                  searchResults.map((chart, idx) => {
                    const isSelected = idx === selectedIndex;
                    const badgeStyle = CATEGORY_BADGE_STYLES[chart.category] || "bg-gray-100 text-gray-800 border-gray-200";

                    return (
                      <div
                        key={chart.name}
                        onClick={() => handleSelectChart(chart)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`px-3.5 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-indigo-50 dark:bg-indigo-950/60 border-l-4 border-indigo-600 text-indigo-900 dark:text-white"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-lg flex-shrink-0">{chart.icon}</span>
                          <div className="min-w-0">
                            <h4 className="text-xs md:text-sm font-semibold truncate text-slate-800 dark:text-slate-100">
                              {chart.title}
                            </h4>
                            <p className="text-[10px] text-gray-400 dark:text-slate-400 font-mono truncate">
                              &lt;{chart.name} /&gt;
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${badgeStyle}`}
                          >
                            {chart.category}
                          </span>
                          <span className="text-xs text-gray-300 dark:text-slate-600">➔</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              {searchResults.length > 0 && (
                <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950/90 border-t border-gray-200 dark:border-slate-800 text-[10px] text-gray-400 dark:text-slate-500 flex justify-between items-center">
                  <span>Use ↑ / ↓ to navigate</span>
                  <span>Total catalog: {ALL_CHARTS.length} charts</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dark Mode Switch */}
        <SwitchButton />

        {/* Notification Icon */}
        <div className="relative cursor-pointer flex-shrink-0">
          <FaBell className="text-2xl text-black dark:text-white" />
          <span className="absolute top-0 right-0 h-2 w-2 bg-red-600 rounded-full animate-ping"></span>
        </div>

        {/* User Initials */}
        <PopOver content={content} trigger="click">
          <div className="w-10 h-10 rounded-full cursor-pointer dark:bg-dark-mode dark:text-white bg-black flex items-center justify-center text-white font-bold flex-shrink-0">
            {initials || "U"}
          </div>
        </PopOver>
      </div>
    </header>
  );
};

export default Header;