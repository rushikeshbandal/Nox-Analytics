import React from 'react';
import DashboardBuilder from '../dashboard/DashboardBuilder';

const DashboardPage = () => {
  // You can get these from auth/context
  const tenantId = "default";
  const userRole = "user"; // or "admin" from auth
  const dashboardId = "D12345";
  
  return (
    <DashboardBuilder 
      dashboardId={dashboardId}
      tenantId={tenantId}
      userRole={userRole}
    />
  );
};

export default DashboardPage;