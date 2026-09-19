import React, { useState } from "react";
import Papa from "papaparse";

const CsvToJsonConverter = ({setJsonData}) => {
  

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        setJsonData(results.data);
        
      },
      error: function (err) {
        console.error("Parsing error:", err);
      },
    });
  };

  return (
    <div style={{ padding: "20px" }}>
      <input type="file" accept=".csv" onChange={handleFileUpload} />
    </div>
  );
};

export default CsvToJsonConverter;
