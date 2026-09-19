import { Outlet } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

function Layout() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f5f5f5" }}>
      
      {/* Sidebar */}
      <Sidebar isSidebarOpen={isSidebarOpen} />

      {/* Main Content */}
      <div style={{ flex: 1 }}>
        
        {/* Header */}
        <Header 
          isSidebarOpen={isSidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
        />

        {/* Main Section */}
        <main style={{ padding: "20px" }}>
          <Outlet />
        </main>

      </div>
    </div>
  );
}

export default Layout;