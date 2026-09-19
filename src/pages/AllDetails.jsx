import React, { useEffect, useState, useMemo } from "react";
import Papa from "papaparse";
import { Bar, Pie, Line } from "react-chartjs-2";
import Chart from "chart.js/auto";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Table } from "antd";
import { MdDashboard } from "react-icons/md";
import { FaChartArea, FaChartLine, FaChartPie, FaFilter, FaTable } from "react-icons/fa";
import { CgChart } from "react-icons/cg";

// Register plugin
Chart.register(ChartDataLabels);

const AllDetails = () => {
  const [data, setData] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState("");

  const tableColumns = [
    {
      title: "Date",
      dataIndex: "Date",
      key: "date",
    },
    {
      title: "Project",
      dataIndex: "Project",
      key: "project",
    },
    {
      title: "Team",
      dataIndex: "Team",
      key: "team",
    },
    {
      title: "Owner",
      dataIndex: "Owner",
      key: "owner",
    },
    {
      title: "Task Description (task title in Clickup)",
      dataIndex: "Task Description (task title in Clickup)",
      key: "Task Description (task title in Clickup)",
    },
  ];

  useEffect(() => {
    const excelDateToJS = (serial) => {
      const num = Number(serial);
      if (isNaN(num) || num < 1) return ""; // avoid bad dates
      const excelEpoch = new Date(1899, 11, 30);
      return new Date(excelEpoch.getTime() + num * 86400000)
        .toISOString()
        .split("T")[0]; // YYYY-MM-DD
    };
  
    const fetchData = async () => {
      try {
        const response = await fetch(
          "https://prod-22.centralindia.logic.azure.com:443/workflows/37bdde7385d44d468bb7c5f1cbea2620/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=HXoRUSDTn2iTmgcS-MhOxFl5qb_uB7b2LtWehJi64Q4",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({}),
          }
        );
  
        const rawData = await response.json();
        console.log("Received JSON:", rawData);
  
        const formattedData = rawData.map((item) => ({
          ...item,
          Date: item.Date ? excelDateToJS(item.Date) : "", // safely handle date
          Project: item.Project?.trim() || "",
          TaskDescription: item["Task Description"]?.trim() || "",
          Owner: item.Owner?.trim() || "",
          Status: item.Status?.trim() || "",
        }));
  
        setData(formattedData);
  
        const projectSet = new Set(
          formattedData.map((item) => item.Project).filter(Boolean)
        );
        setProjects(Array.from(projectSet));
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
  
    fetchData();
  }, []);
  
  
  

  const filteredData = useMemo(() => {
    return data.filter(
      (item) =>
        (selectedProject ? item.Project === selectedProject : true) &&
        (selectedTeam ? item.Team === selectedTeam : true) &&
        (selectedCandidate ? item.Owner === selectedCandidate : true)
    );
  }, [data, selectedProject, selectedTeam, selectedCandidate]);

  const teams = useMemo(() => {
    return Array.from(
      new Set(
        data
          .filter((item) => (selectedProject ? item.Project === selectedProject : true))
          .map((item) => item.Team)
          .filter(Boolean)
      )
    );
  }, [data, selectedProject]);

  const candidates = useMemo(() => {
    return Array.from(
      new Set(
        data
          .filter(
            (item) =>
              (selectedProject ? item.Project === selectedProject : true) &&
              (selectedTeam ? item.Team === selectedTeam : true)
          )
          .map((item) => item.Owner)
          .filter(Boolean)
      )
    );
  }, [data, selectedProject, selectedTeam]);


  const generateColors = (count) => {
    const colors = [];
    for (let i = 0; i < count; i++) {
      const hue = Math.floor((360 / count) * i);
      colors.push(`hsl(${hue}, 70%, 65%)`);
    }
    return colors;
  };

  const pieDataValues = candidates.map(
    (name) => filteredData.filter((entry) => entry.Owner === name).length
  );

  const pieColors = generateColors(candidates.length);


  const pieChartData = {
    labels: candidates,
    datasets: [
      {
        label: "Task Count by Candidate",
        data: pieDataValues,
        backgroundColor: pieColors,
        borderWidth: 1,
      },
    ],
  };

  const pieOptions = {
    plugins: {
      datalabels: {
        color: "#fff",
        font: {
          weight: "bold",
        },
        formatter: (value, context) => {
          const total = pieDataValues.reduce((a, b) => a + b, 0);
          const percentage = ((value / total) * 100).toFixed(1);
          return `${percentage}%`;
        },
      },
      legend: {
        position: "none",
      },
    },
  };

  const totalPie = pieDataValues.reduce((a, b) => a + b, 0);

  const barChartData = {
    labels: teams,
    datasets: [
      {
        label: "Tasks by Team",
        data: teams.map((team) => filteredData.filter((entry) => entry.Team === team).length),
        backgroundColor: pieColors,
        borderRadius: 5,
      },
    ],
  };

  const lineChartData = useMemo(() => {
    const dateMap = {};
    filteredData.forEach((entry) => {
      const date = entry.Date?.trim();
      if (date) {
        dateMap[date] = (dateMap[date] || 0) + 1;
      }
    });

    const sortedDates = Object.keys(dateMap).sort((a, b) => new Date(a) - new Date(b));

    return {
      labels: sortedDates,
      datasets: [
        {
          label: "Tasks Over Time",
          data: sortedDates.map((date) => dateMap[date]),
          borderColor: "#4BC0C0",
          backgroundColor: "rgba(75,192,192,0.2)",
          tension: 0.4,
          fill: true,
          pointRadius: 5,
          pointBackgroundColor: "#4BC0C0",
        },
      ],
    };
  }, [filteredData]);

  

  return (
    <div className="min-h-screen text-gray-800 font-inter bg-white">
      {/* Header with icon */}
      <header className="mb-8 text-center">
        <h3 className="text-4xl font-bold text-[#4a4f54] flex justify-center items-center gap-2">
          <MdDashboard className="text-back" />
          Worklog Analytics Dashboard
        </h3>
        <p className="text-sm text-gray-500 mt-4">Visual overview of team and project task distribution</p>
      </header>
  
      {/* Filters with icon */}
      <div className="flex flex-wrap justify-center gap-4 mb-12 items-center">
        <FaFilter className="text-xl text-gray-600 mr-2" />
        {[
          { value: selectedProject, setValue: setSelectedProject, label: "All Projects", options: projects },
          { value: selectedTeam, setValue: setSelectedTeam, label: "All Teams", options: teams },
          { value: selectedCandidate, setValue: setSelectedCandidate, label: "All Candidates", options: candidates },
        ].map(({ value, setValue, label, options }, idx) => (
          <select
            key={idx}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="px-4 py-3 min-w-[220px] rounded-lg border border-gray-300 shadow-sm text-base focus:outline-none focus:ring focus:ring-blue-200 transition"
          >
            <option value="">{label}</option>
            {options.map((opt, i) => (
              <option key={i} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ))}
      </div>
  
      {/* Line Chart */}
      <section className="mb-8">
        <ChartCard title={<span className="flex items-center gap-2"><FaChartLine />Tasks Over Time</span>}>
          <Line data={lineChartData} options={{
            responsive: true,
            plugins: {
              tooltip: { enabled: true },
              legend: { display: true, position: "top" },
            },
            scales: {
              x: {
                title: { display: true, text: "Date" },
                ticks: { maxRotation: 45, minRotation: 30 },
              },
              y: {
                beginAtZero: true,
                title: { display: true, text: "Number of Tasks" },
              },
            },
          }} />
        </ChartCard>
      </section>
  
      {/* Pie Chart */}
      <section className="w-full mb-8">
        <ChartCard title={<span className="flex items-center gap-2"><FaChartPie/>Tasks by Candidate</span>}>
          <div className="flex flex-col lg:flex-row lg:items-start w-full">
            <div className="w-full lg:w-1/2 flex justify-center">
              <div className="max-w-[350px] w-full">
                <Pie data={pieChartData} options={pieOptions} />
              </div>
            </div>
            <div className="w-full lg:w-1/2 mt-6 lg:mt-0 lg:pl-10 space-y-4">
              {candidates.map((candidate, index) => {
                const value = pieDataValues[index];
                const percent = ((value / totalPie) * 100).toFixed(1);
                return (
                  <div
                    key={index}
                    className="flex items-center text-sm text-gray-700 bg-gray-100 rounded-md px-3 py-2"
                  >
                    <span
                      className="w-4 h-4 rounded-full mr-3"
                      style={{ backgroundColor: pieColors[index] }}
                    />
                    <span className="flex-1 font-medium">{candidate}</span>
                    <span className="text-gray-600">{value} tasks ({percent}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        </ChartCard>
      </section>
  
      {/* Bar Chart */}
      <ChartCard title={<span className="flex items-center gap-2"><FaChartArea/>Tasks by Team</span>}>
        <Bar data={barChartData} />
      </ChartCard>
  
      {/* Table */}
      <section className="w-full mt-10">
        <ChartCard title={<span className="flex items-center gap-2"><FaTable />Worklog Details</span>}>
          <Table
            columns={tableColumns}
            dataSource={filteredData.map((row, idx) => ({ ...row, key: idx }))}
            pagination={{ pageSize: 10 }}
            bordered
            scroll={{ x: "max-content" }}
          />
        </ChartCard>
      </section>
    </div>
  );
  

};

// Reusable Chart Card
const ChartCard = ({ title, children }) => (
  <div
    style={{
      background: "#fff",
      padding: "1.75rem",
      borderRadius: "12px",
      boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
      transition: "transform 0.2s ease-in-out",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
  >
    <h3
      style={{
        marginBottom: "1rem",
        fontSize: "1.25rem",
        fontWeight: "600",
        color: "#34495e",
      }}
    >
      {title}
    </h3>
    {children}
  </div>
);

export default AllDetails;
