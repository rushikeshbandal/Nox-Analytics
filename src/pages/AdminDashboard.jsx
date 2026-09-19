import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import CsvToJsonConverter from '../component/CsvToJsonConverter';

const AdminDashboard = () => {
  const [csvData, setCsvData] = useState([]);
  const [loading, setLoading] = useState(true);

 
  

  return (
    <div className="flex flex-col items-center justify-center shadow-lg border p-10 rounded-lg text-center w-full">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">
        Welcome to the Admin Dashboard
      </h1>
      <p className="mb-6 text-lg text-black dark:text-gray-300">
        This is the main landing page of the application.
      </p>
    
 
    </div>
  );
};

export default AdminDashboard;
