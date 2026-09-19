import Papa from "papaparse";
import * as XLSX from 'xlsx';
export function getInitialsFromEmail(email) {
  if (!email) return '';

  const localPart = email.split('@')[0]; // 'rushi166'

  // If it contains separator characters, get initials
  if (/[\.\-_]/.test(localPart)) {
    const parts = localPart.split(/[\.\-_]+/).filter(Boolean);
    return parts.map(word => word[0].toUpperCase()).join('');
  }

  // Otherwise, just return the first letter
  return localPart[0].toUpperCase();
}


export const statusMap = {
  "Pending Requests": "pending",
  "Completed Requests": "completed",
  "Approved Requests": "approved",
   "Total Requests": "total",
  // Add more mappings as needed
};


export const handlePublicCSVParse = (project_id) => {
  const projectEndpoints = {
    "limkar-ecommerce":  "https://prod-29.centralindia.logic.azure.com:443/workflows/415d831140bf41b480bb61d9f135fa69/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ThKFINbJtfM6906IRGoT5R52qZobGjb23iD_JUcoDY8",
    "thalasa-service-desk": "https://your-second-api-endpoint.com", // Add real URL
    // add more as needed
  };

  const url = projectEndpoints[project_id];
  if (!url) {
    return Promise.resolve(null); // 👈 return null instead of rejecting
  }

  return fetch(url, { method: "POST" })
    .then(res => res.json())
    .then(data => data.data || data)
    .catch(() => null); // 👈 return null on fetch error too
};

export const handleWBS = (project_id) => {
  const projectEndpoints = {
    "limkar-ecommerce":  "https://prod-03.centralindia.logic.azure.com:443/workflows/9da6fdae9e7c41cc916228b4012f66bb/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=9FRaVPNUj98ij6zXm9Rjf1Zs7P24avhCjYkshnVoYTY",
    "thalasa-service-desk": "https://your-second-api-endpoint.com", // Add real URL
    // add more as needed
  };

  const url = projectEndpoints[project_id];
  if (!url) {
    return Promise.resolve(null); // 👈 return null instead of rejecting
  }

  return fetch(url, { method: "POST" })
    .then(res => res.json())
    .then(data => data.data || data)
    .catch(() => null); // 👈 return null on fetch error too
};


// src/utils/fetchCsvToJson.js

 

 
 

export const fetchExcel = async ({ path, range, columns }) => {
  try {
    const response = await fetch(path);
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    const rawData = XLSX.utils.sheet_to_json(worksheet, {
      range,     // can still provide a range like "A7:Z100" to limit rows
      defval: '', // treat empty cells as empty strings
    });

    if (!rawData.length) {
      console.warn('No data found in the given range.');
      return [];
    }

    const filteredData = rawData.map(row => {
      const filteredRow = {};
      columns.forEach(col => {
        filteredRow[col] = row[col];
      });
      return filteredRow;
    });

    return filteredData;

  } catch (error) {
    console.error('Error reading Excel file:', error);
    return [];
  }
};
