import React, { useState } from "react";
import Button from "../Button";
import Input from "../Input";
import RatingStar from "./UI/RatingStar";
import { CgProfile } from "react-icons/cg";
import { FiLock } from "react-icons/fi";
import bg from "../../assets/bg/Clients dashboard BG.png";
import sirili from "../../assets/logos/Mascot.png";
import bizcredence from "../../assets/logos/bizcredence.svg";
import hatindia from "../../assets/logos/hatindia_resized.png";
import Limkar from "../../assets/logos/Limkar Favicon.png";
import limkarDashboard from "../../assets/logos/Limkar.png";
import bizcredenceDashboard from "../../assets/logos/Bizcredence.png";
import hatindiaDashboard from "../../assets/logos/Hatundia.png";
import siriliDashboard from "../../assets/logos/Sirili.png";

const ClientDashboard = () => {
  const dashboardData = [
    {
      id: 1,
      clientName: "LIMKAR",
      client_profile: Limkar,
      rating: 5,
      dashboard_img: limkarDashboard,
    },
    {
      id: 2,
      clientName: "Biz Credence",
      client_profile: bizcredence,
      rating: 5,
      dashboard_img: bizcredenceDashboard,
    },
    {
      id: 3,
      clientName: "Hatundia Securities",
      client_profile: hatindia,
      rating: 5,
      dashboard_img: hatindiaDashboard,
    },
    {
      id: 4,
      clientName: "SiriLi",
      client_profile: sirili,
      rating: 5,
      dashboard_img: siriliDashboard,
    },
  ];

  const [formData, setFormData] = useState({ name: "", email: "" });
  const [accessGranted, setAccessGranted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDashboard, setSelectedDashboard] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      alert("Please enter your name and business email.");
      return;
    }
    setFormData({ name: "", email: "" });
    setAccessGranted(true);
  };

  const handleDashboardSelection = (dashboard) => {
    if (!accessGranted) {
      alert("Please request access to unlock dashboards.");
      return;
    }
    setSelectedDashboard(dashboard);
    setIsModalOpen(true);
  };

  return (
    <div
      className="w-full flex flex-col items-center py-10 px-4 md:py-[95px]"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Header */}
      <p className="mb-4 font-Aldrich text-2xl md:text-[30px] font-semibold text-white text-center">
        Client Dashboard
      </p>
      <p className="opacity-60 leading-snug text-sm text-white text-center max-w-[600px]">
        Track your business performance with live client dashboards — monitor
        progress, identify trends, and stay ahead of the competition.
      </p>

      {/* Cards */}
      <div className="flex flex-wrap gap-[22px] justify-center p-[20px] sm:p-[40px] mt-10">
        {dashboardData.map((dashboard) => {
          const hasProfileImg = dashboard.client_profile?.length > 0;
          return (
            <div
              key={dashboard.id}
              className="relative h-[279px] w-full sm:w-[299px] max-w-[90vw] overflow-hidden rounded-sm cursor-pointer"
              onClick={() => handleDashboardSelection(dashboard)}
            >
              {/* Image */}
              <div className="relative h-[199px] w-full">
                <img
                  className={`h-full w-full object-cover rounded-t-sm border border-white ${
                    !accessGranted ? "opacity-40" : ""
                  }`}
                  src={dashboard.dashboard_img}
                  alt="Dashboard"
                />
                {!accessGranted && (
                  <div className="absolute inset-0 bg-opacity-40 flex items-center justify-center text-white text-4xl">
                    <FiLock />
                  </div>
                )}
              </div>

              {/* Profile */}
            <div className="flex items-center p-3 gap-3 bg-[#1a1a1a]">
                {hasProfileImg ? (
                  <img
                    src={dashboard.client_profile}
                    alt={dashboard.clientName}
                    className={`h-12 w-12 rounded-full object-cover ${
                      dashboard.clientName === "SiriLi" ? "scale-[1.81]" : ""
                    }`}
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center text-xl">
                    <CgProfile />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-white">{dashboard.clientName}</p>
                  <RatingStar rating={dashboard.rating} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Form */}
      <div className="mt-20 flex flex-col items-center px-4 w-full">
        <p className="font-Aldrich text-2xl md:text-[30px] font-bold text-white text-center">
          Access Dashboards by Submitting your Business Email
        </p>
        <p className="font-Aldrich text-sm font-bold text-white">
          or contact us at{" "}
          <a
            href="mailto:contact@bizcredence.com"
            className="hover:text-white px-1"
          >
            contact@bizcredence.com
          </a>
        </p>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-[20px] mt-8 w-full max-w-[900px] items-center justify-center"
        >
          <Input
            onChange={handleChange}
            name="name"
            value={formData.name}
            placeholder="Name"
            type="text"
            className="text-white bg-[#2F2F2F] py-[18px] px-[20px] rounded-[5px] w-full sm:w-auto"
          />
          <Input
            onChange={handleChange}
            name="email"
            value={formData.email}
            placeholder="Business Email Address"
            type="email"
            className="text-white bg-[#2F2F2F] py-[18px] px-[20px] rounded-[5px] w-full sm:w-[478px]"
          />
          <Button
            title="Request Access"
            type="submit"
            className="text-white bg-[#D72638] py-[18px] w-full sm:w-[243px] px-[32px] rounded-[5px]"
          />
        </form>
      </div>

      {/* Modal */}
      {isModalOpen && selectedDashboard && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-md shadow-lg p-8 max-w-[600px] w-[90%] relative">
            <button
              className="absolute top-2 right-3 text-gray-600 text-xl hover:text-red-600"
              onClick={() => setIsModalOpen(false)}
            >
              ×
            </button>
            <h2 className="text-xl font-semibold mb-4 text-black">
              {selectedDashboard.clientName} Dashboard
            </h2>
            <img
              src={selectedDashboard.dashboard_img}
              alt="Dashboard Preview"
              className="w-full rounded-md"
            />
            <p className="mt-4 text-sm text-gray-700">
              Here you can embed detailed dashboard info, graphs, or iframe.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;
