import React, { useEffect, useState } from "react";
import { fetchExcel } from '../Utils/utils';
import GanttChartEverything from '../component/GanttChartEverything';
import CsvToJsonConverter from '../component/CsvToJsonConverter';

const SuperAdminDashboard = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const FetchProjectScheduleSheet = async () => {
      try {
        const rawData = await fetchExcel({
          path: "/Every_task.csv",
          range: 0,
          columns: [
            "Task ID", " Task Name", "Task Content", "Status", "Date Created",
            "Date Created Text", "Due Date", "Due Date Text", "Start Date", "Start Date Text",
            "Parent ID", "Attachments", "Assignees", "Tags", "Priority", "List Name",
            "Folder Name", "Space Name", "Time Estimated", "Time Estimated Text", "Checklists",
            "Comments", "Assigned Comments", "Time Spent", "Time Spent Text", "Rolled Up Time",
            "Rolled Up", "Time Text"
          ]
        });

        // Helper to trim all keys in the object and also trim string values
        const cleanKeysAndValues = (obj) => {
          const cleaned = {};
          Object.entries(obj).forEach(([key, val]) => {
            const cleanKey = key.trim();
            if (typeof val === 'string') {
              cleaned[cleanKey] = val.trim();
            } else {
              cleaned[cleanKey] = val;
            }
          });
          return cleaned;
        };

        const parseSafeJson = (str) => {
          try {
            const parsed = JSON.parse(str);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        };

        const parseDate = (value, fallback = null) => {
          const num = Number(value);
          if (!isNaN(num) && num > 0) {
            return new Date(num);
          } else if (fallback) {
            return fallback;
          }
          return null;
        };

        const cleanData = rawData
          .map((item, index) => {
            const cleanedItem = cleanKeysAndValues(item);

            const startDateFallback = parseDate(cleanedItem["Date Created"]);
            const start = parseDate(cleanedItem["Start Date"], startDateFallback);
            const end = parseDate(cleanedItem["Due Date"]);

            const assignees = parseSafeJson(cleanedItem["Assignees"]);

            if (!start || !end || !cleanedItem["Task Name"]) {
              console.warn(`Row ${index} is invalid or missing required fields`, cleanedItem);
              return null;
            }

            return {
              id: cleanedItem["Task ID"],
              name: cleanedItem["Task Name"],
              assignees: assignees,
              start: start,
              end: end,
              status: cleanedItem["Status"]?.toLowerCase() || "to do"
            };
          })
          .filter(Boolean); // Remove invalid rows

        setData(cleanData);
      } catch (error) {
        console.error("Error fetching or processing data:", error);
      }
    };

    FetchProjectScheduleSheet();
  }, []);

  return (
    <>
    <div className="flex border dark:bg-dark-mode dark:text-white border-gray-300 flex-col items-center justify-center shadow-xl p-10 rounded-lg text-center w-full bg-white text-black">
      <CsvToJsonConverter setJsonData={setData} />
    </div>
    {/* <div className="flex border mt-6 dark:bg-dark-mode dark:text-white border-gray-300 flex-col items-center justify-center shadow-xl p-10 rounded-lg text-center w-full bg-white text-black">
      <GanttChartEverything tasks={data} />
      </div> */}
      </>
  );
};

export default SuperAdminDashboard;
