import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Layout from "./component/Layout";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import About from "./pages/About";
import ProtectedRoute from "./component/ProtectedRoute";
import Unauthorized from "./pages/Unauthorized";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import Home from "./pages/Home";
import HomePageLayout from "./component/HomePageLayout";
import Project from "./pages/Project";
import Details from "./pages/Details";
import AllDetails from "./pages/AllDetails";

const App = () => {
  return (
    <Routes>
      <Route element={<HomePageLayout />}>
        <Route path="/" element={<Home />} />
      </Route>

      <Route path="/Login" element={<Login />} />
      <Route path="/SignUp" element={<SignUp />} />

      <Route element={<Layout />}>
        <Route path="/Admin/Dashboard" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/SuperAdmin/Dashboard" element={<ProtectedRoute allowedRoles={["superAdmin"]}><SuperAdminDashboard /></ProtectedRoute>} />
        <Route path="/SuperAdmin/Dashboard/:project_id" element={<ProtectedRoute allowedRoles={["superAdmin"]}><Project /></ProtectedRoute>} />
        <Route path="/SuperAdmin/Dashboard/:project_id/details/:status" element={<ProtectedRoute allowedRoles={["superAdmin"]}><Details /></ProtectedRoute>} />
        <Route path="/SuperAdmin/Dashboard/All" element={<ProtectedRoute allowedRoles={["superAdmin"]}><AllDetails /></ProtectedRoute>} />
        <Route path="/User/Dashboard" element={<ProtectedRoute allowedRoles={["user"]}><UserDashboard /></ProtectedRoute>} />
        <Route path="/About" element={<About />} />
        <Route path="/Unauthorized" element={<Unauthorized />} />
      </Route>
    </Routes>
  );
};

export default App;