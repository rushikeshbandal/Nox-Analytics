import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FaSignOutAlt } from "react-icons/fa";
import { MdDashboard } from "react-icons/md";
import { getUserRole } from "../Utils/authUtils";
import PopConfirm from "./PopConfirm";
import { message } from "antd";
import {
  LayoutDashboard,
  ShieldCheck,
  Bot,
  Building2,
  Settings,
  Activity,
  History,
  ListTree,
  UserCog,
  UserCheck,
  User,
} from "lucide-react";
import DropDown from "./DropDown";

const Sidebar = ({ isSidebarOpen, role: propRole }) => {
  const [role, setRole] = useState(propRole || "");
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserRole = getUserRole();
    setRole(checkUserRole);
  }, [propRole]);

  const confirm = () => {
    message.success("Logging out...");
    setTimeout(() => {
      handleLogout();
    }, 1000);
  };

  const cancel = () => {
    message.error("Logout canceled");
  };

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("user");
    navigate("/Login");
  };

  const sidebarItems = {
    superAdmin: [
      {
        label: "Super Admin Dashboard",
        icon: <ListTree size={20} />,
        to: "/SuperAdmin/Dashboard",
      },
      {
        label: "Status Dashboard",
        icon: <LayoutDashboard size={20} />,
        subItems: [
          {
            label: "Limkar Ecomerce",
            icon: <MdDashboard size={20} />,
            to: `/SuperAdmin/Dashboard/limkar-ecommerce`,
          },
          {
            label: "Thalasa Service Desk",
            icon: <MdDashboard size={20} />,
            to: `/SuperAdmin/Dashboard/thalasa-service-desk`,
          },
          {
            label: "ANM Quadrant",
            icon: <MdDashboard size={20} />,
            to: `/SuperAdmin/Dashboard/anm-quadrant`,
          },
          {
            label: "All",
            icon: <MdDashboard size={20} />,
            to: `/SuperAdmin/Dashboard/All`,
          },
        ],
      },
      {
        label: "Access Control",
        icon: <ShieldCheck size={20} />,
        to: "/superadmin/access-control",
      },
      {
        label: "AI Service Console",
        icon: <Bot size={20} />,
        to: "/superadmin/ai-service-console",
      },
      {
        label: "Tenant Manager",
        icon: <Building2 size={20} />,
        to: "/superadmin/tenant-manager",
      },
      {
        label: "API & Webhook Settings",
        icon: <Settings size={20} />,
        to: "/superadmin/api-webhook-settings",
      },
      {
        label: "System Health",
        icon: <Activity size={20} />,
        to: "/superadmin/system-health",
      },
      {
        label: "Audit Trail",
        icon: <History size={20} />,
        to: "/superadmin/audit-trail",
      },
      {
        label: "Activity Timeline",
        icon: <ListTree size={20} />,
        to: "/superadmin/activity-timeline",
      },
      {
        label: "Admin Settings",
        icon: <UserCog size={20} />,
        to: "/superadmin/admin-settings",
      },
    ],
    admin: [
      {
        label: "Admin Dashboard",
        icon: <UserCheck size={20} />,
        to: "/admin/dashboard",
      },
    ],
    user: [
      {
        label: "User Dashboard",
        icon: <User size={20} />,
        to: "/user/dashboard",
      },
    ],
  };

  return (
    <aside
      className={` sticky dark:bg-custom-bg dark:border-none top-0 h-full overflow-y-auto border-r border-gray-300 bg-white text-black flex flex-col justify-between p-4 shadow-2xl transition-all duration-300 ${
        isSidebarOpen ? "w-90" : "w-20"
      }`}
    >
      {/* Logo */}
      <div>
        <h2 className="text-2xl dark:text-white   font-bold text-black mb-6 pl-3 flex items-center gap-3">
          <MdDashboard className="text-3xl dark:text-white" />
          {isSidebarOpen && <span>Dashboard</span>}
        </h2>

        {/* Navigation Items */}
        <nav className="flex flex-col space-y-2 dark:text-white text-black">
          {sidebarItems[role]?.map((item, index) => {
            if (item.subItems) {
              return (
                <div key={index} className="pl-1">
                  {isSidebarOpen && (
                    <DropDown
                      items={item.subItems.map((subItem) => ({
                        label: subItem.label,
                        key: subItem.to,
                        onClick: () => navigate(subItem.to),
                      }))}
                      label={isSidebarOpen && <span>{item.label}</span>}
                      icon={item.icon}
                      className={"flex dark:text-white items-center space-x-3 p-3 rounded-lg hover:bg-black hover:text-white hover:font-semibold text-black"}
                    />
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={index}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center space-x-3 dark:text-white p-3 rounded-lg transition ${
                    isActive
                      ? "dark:bg-black dark:text-white bg-black text-white font-semibold"
                      : "hover:bg-black hover:text-white hover:font-semibold hover:bg-dark text-black"
                  }`
                }
              >
                <div className="w-8 dark:text-white flex justify-center">{ item.icon}</div>
                {isSidebarOpen && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Logout Button */}
      <div className="pt-6 mt-6 border-t border-gray-300">
        <PopConfirm
          title="Logout"
          description="Are you sure you want to logout?"
          onConfirm={confirm}
          onCancel={cancel}
          okText="Yes"
          cancelText="No"
        >
          <div className="w-full flex dark:text-white items-center space-x-3 p-3 rounded-lg hover:bg-[#e74c3c] transition cursor-pointer">
            <div className="w-8 flex justify-center">
              <FaSignOutAlt className="text-xl dark:text-white text-black" />
            </div>
            {isSidebarOpen && <span>Logout</span>}
          </div>
        </PopConfirm>
      </div>
    </aside>
  );
};

export default Sidebar;
