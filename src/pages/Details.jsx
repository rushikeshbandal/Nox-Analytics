import React, { use, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs } from 'antd';
import { handlePublicCSVParse } from '../Utils/utils';
import Loader from '../component/Loading';
import CustomTable from '../component/CustomTable';

const { TabPane } = Tabs;

const importantFields = [
  "Change Request ID",
  "Change Title",
  "Approval Status",
  "Final Status",
  "Requested By",
  "Priority"
];

 const normalizeKey = (key) =>
  key
    .replace(/[\n\r↵]/g, ' ')      // replace newline-like characters with space
    .replace(/\s+/g, ' ')          // collapse multiple spaces
    .trim();                       // trim surrounding spaces


const Details = () => {
  const { project_id, status } = useParams();
  const [filteredData, setFilteredData] = useState([]);
  const [expandedCardIndex, setExpandedCardIndex] = useState(null);
  const [loading, setLoading] = useState(true);

  const normalizedFields = importantFields.map(normalizeKey);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
       const data = await handlePublicCSVParse(project_id);
       
             // Clean keys: remove line breaks or special characters like ↵ from all keys
            const cleanedData = data.map((row) => {
           const cleanedRow = {};
           for (const key in row) {
             const cleanKey = normalizeKey(key);
             cleanedRow[cleanKey] = row[key];
           }
           return cleanedRow;
         });
       
        let filtered = [];
        const lowerStatus = status;
        
        
        if (lowerStatus === "approved") {
          filtered = cleanedData.filter(item => item["Approval Status"]?.toLowerCase() === "approved");
        } else if (lowerStatus === "completed") {
          filtered = cleanedData.filter(item => item["Final Status"]?.toLowerCase() === "completed");
        } else if (lowerStatus === "pending") {
          filtered = cleanedData.filter(
            item =>
              item["Final status"]?.toLowerCase() === "pending" ||
              item["Approval status"]?.toLowerCase() === "pending"
          );
        } else {
          filtered = cleanedData;
        }
       

        setFilteredData(filtered);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [project_id, status]);

  
  
  const toggleReadMore = (index) => {
    setExpandedCardIndex(prev => (prev === index ? null : index));
  };

  const renderListView = () => {
    const columns = importantFields.map((field, index) => ({
      title: field,
      dataIndex: normalizedFields[index],
      key: normalizedFields[index],
      render: (text) => <span>{text || "N/A"}</span>,
    }));

    return (
      <CustomTable
        columns={columns}
        data={filteredData}
        pagination={{ pageSize: 10 }}
      />
    );
  };

  const renderCardView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {filteredData.map((item, index) => {
        const filteredEntries = Object.entries(item).filter(
          ([_, value]) => value && value.toString().trim() !== ""
        );
        const importantData = filteredEntries.filter(([key]) =>
          normalizedFields.includes(key)
        );
        const extraData = filteredEntries.filter(
          ([key]) => !normalizedFields.includes(key)
        );
        const isExpanded = expandedCardIndex === index;

        return (
          <div
            key={index}
            className="p-4 bg-white rounded-xl shadow hover:shadow-md transition duration-300"
          >
            {importantData.map(([key, value]) => (
              <div key={key} className="text-sm text-gray-700 mb-1">
                <strong>{importantFields[normalizedFields.indexOf(key)]}: </strong>{value}
              </div>
            ))}

            {isExpanded && (
              <div className="mt-3 border-t pt-3">
                {extraData.map(([key, value]) => (
                  <div key={key} className="text-sm text-gray-600 mb-1">
                    <strong>{key}: </strong>{value}
                  </div>
                ))}
              </div>
            )}

            <button
              className="mt-3 text-blue-600 hover:underline text-sm"
              onClick={() => toggleReadMore(index)}
            >
              {isExpanded ? 'Read Less' : 'Read More'}
            </button>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 capitalize dark:text-white">{status} CRs</h2>

      <Loader loading={loading}>
        {filteredData.length === 0 ? (
          <p className="text-gray-500">No records found with status "{status}"</p>
        ) : (
          <Tabs defaultActiveKey="1">
            <TabPane tab="List View" key="1">
              {renderListView()}
            </TabPane>
            <TabPane tab="Card View" key="2">
              {renderCardView()}
            </TabPane>
          </Tabs>
        )}
      </Loader>
    </div>
  );
};

export default Details;
