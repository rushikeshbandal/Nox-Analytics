import { Modal } from "antd";
import React, { useState } from "react";
import big from "../../assets/big.svg";
import medium from "../../assets/medium.svg";
import small from "../../assets/small.svg";
import bgVideo from "../../assets/GIF/Business_Stock.mp4";

// ✅ Modal Component
const DashboardModal = ({ open, handleCancel }) => {
  return (
    <Modal
      title={null}
      open={open}
      onCancel={handleCancel}
      footer={null}
      centered
      width={800}
      bodyStyle={{
        backgroundColor: "black",
        padding: 0,
        borderRadius: "8px",
      }}
    >
      <img
        src="https://miro.medium.com/v2/resize:fit:1400/1*rQ3d_dKG7V2JhX8SrUjs6g.png"
        alt="Dashboard Preview"
        className="w-full h-auto rounded"
      />
    </Modal>
  );
};

const HeroSection = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => setIsModalOpen(true);
  const handleCancel = () => setIsModalOpen(false);

  return (
    <div className="relative w-full h-auto min-h-[800px] overflow-hidden">
      {/* Background Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute opacity-80 top-0 left-0 w-full h-full object-cover z-0"
      >
        <source src={bgVideo} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Gradient & Overlay */}
      <div className="absolute top-0 left-0 w-full h-full z-10 pointer-events-none">
        <div className="absolute w-full h-full bg-gradient-to-br from-black via-[#6B2EC1] to-[#FF0000] opacity-70" />
        <div className="absolute w-full h-full bg-black opacity-25" />
      </div>

      {/* Content */}
      <div className="relative z-20 flex flex-col items-center justify-center text-white text-center px-4 py-24 md:mt-[156px]">
        <p className="text-2xl md:text-3xl font-Orbitron flex flex-wrap gap-2 justify-center">
          Where{" "}
          <span className="text-[#D72638] font-bold">Intelligence</span> Becomes Action
        </p>
        <p className="text-sm mt-4 font-Aldrich opacity-50 max-w-[800px]">
          From chaos to clarity — NOX Analytics transforms raw data into intuitive strategy, helping your teams see the <br className="hidden md:inline" /> unseen and act before it happens.
        </p>

        <button
          className="bg-white mt-6 text-black font-Orbitron text-sm px-6 md:px-9 py-3 md:py-4 rounded"
          onClick={showModal}
        >
          Watch How it Works
        </button>

        {/* Images */}
        <div className="relative mt-14 w-full flex justify-center items-center">
          {/* Mobile: Stacked images */}
          <div className="md:hidden flex flex-col items-center gap-[-40px] scale-[0.75]">
            <img src={small} alt="small" className="w-[280px] z-10" />
            <img src={medium} alt="medium" className="w-[300px] z-20 -mt-8" />
            <img src={big} alt="big" className="w-[350px] z-30 -mt-12" />
          </div>

          {/* Desktop: Overlapping positioned images */}
          <div className="hidden md:block relative w-[717px] h-[512px] ml-[140px]">
            <img
              src={small}
              alt="small"
              className="absolute left-[-60%] top-[30%] w-[524px] h-auto z-10"
            />
            <img
              src={medium}
              alt="medium"
              className="absolute left-[-30%] top-[17%] w-[454px] z-20"
            />
            <img
              src={big}
              alt="big"
              className="relative w-[717px] h-[512px] z-30"
            />
          </div>
        </div>
      </div>

      {/* Modal */}
      <DashboardModal open={isModalOpen} handleCancel={handleCancel} />
    </div>
  );
};

export default HeroSection;