/**
 * noxAnalyticsService.js
 * 
 * Nox Analytics Telemetry Event Tracking Service.
 * Persists user interactions (filters, legends, navigation)
 * in localStorage with a FIFO rotation cap of 30 records.
 */

const STORAGE_KEY = "nox_telemetry_events";
const MAX_EVENTS = 30;

export const noxAnalyticsService = {
  trackEvent(category, action, label = "") {
    const timestamp = new Date().toLocaleTimeString();
    const newEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp,
      category,
      action,
      label
    };

    let events = this.getEvents();
    
    // Add to list and rotate if exceeding cap
    events.push(newEvent);
    if (events.length > MAX_EVENTS) {
      events = events.slice(events.length - MAX_EVENTS);
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch (e) {
      console.warn("[Nox Analytics Telemetry] LocalStorage write failed:", e.message);
    }

    // Pretty console printing
    console.log(
      `%c[Nox Telemetry Log]%c ${timestamp} | Category: ${category} | Action: ${action} | Label: ${label}`,
      "color: #6366f1; font-weight: bold; background: #e0e7ff; padding: 2px 6px; border-radius: 4px;",
      "color: #1e293b; font-weight: 500;"
    );

    // Dispatch custom event to notify UI listeners
    const event = new CustomEvent("noxTelemetryUpdated", { detail: events });
    window.dispatchEvent(event);

    return newEvent;
  },

  getEvents() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  clearEvents() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new CustomEvent("noxTelemetryUpdated", { detail: [] }));
    } catch (e) {
      console.warn("[Nox Analytics Telemetry] LocalStorage clear failed:", e.message);
    }
  }
};
