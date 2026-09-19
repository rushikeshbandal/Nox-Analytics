import React from 'react';

const ChartDropdown = ({ headers, selectedX, selectedY, setSelectedX, setSelectedY }) => {
  return (
    <div style={{ margin: '20px 0' }}>
      <label style={{ marginRight: '10px' }}>
        X-Axis:
        <select value={selectedX} onChange={(e) => setSelectedX(e.target.value)}>
          <option value="">Select</option>
          {headers.map((header) => (
            <option key={header} value={header}>
              {header}
            </option>
          ))}
        </select>
      </label>

      <label style={{ marginLeft: '20px' }}>
        Y-Axis:
        <select value={selectedY} onChange={(e) => setSelectedY(e.target.value)}>
          <option value="">Select</option>
          {headers.map((header) => (
            <option key={header} value={header}>
              {header}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
};

export default ChartDropdown;
