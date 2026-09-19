import React from "react";
import { NavLink } from "react-router-dom";
import { MoveRight } from "lucide-react";
import Forecast from "../../assets/GIF/New GIF/573257_Business_Stock_3840x2160.mp4";
import Medical from "../../assets/GIF/New GIF/5432814_Coll_wavebreak_Animation_3840x2160.mp4";
import Demand from "../../assets/GIF/New GIF/1114949_Man_Woman_3840x2160.mp4";
import NLP from "../../assets/NLP.png";
import bg from "../../assets/bg/2nd Section BG.png";

const Features = () => {
  return (
    <div
      className="px-4 py-10 md:py-[107px] bg-[#1A1A1A] flex flex-col items-center"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <p className="text-2xl md:text-3xl font-Aldrich text-white text-center">
        What do we do
      </p>
      <p className="opacity-60 text-white font-Aldrich mt-4 md:mt-6 text-center text-sm">
        Track user behavior, revenue, and performance metrics in real-time with <br className="hidden md:inline" />
        dynamic customizable dashboards.
      </p>

      {/* Cards */}
      <div className="mt-10 flex flex-col md:flex-row md:gap-6 w-full max-w-6xl">

        {/* Left Column */}
        <div className="flex flex-col gap-6 w-full md:w-2/3">

          {/* Forecast Accuracy Card */}
          <div className="flex flex-col md:flex-row items-center border border-[#5144FF] bg-[#2D2B38] rounded-tl-[50px] md:rounded-tl-[100px] p-4 hover:scale-105 transition-all duration-300 opacity-40 hover:opacity-100">
            {/* Video */}
            <div className="w-full md:w-[220px] h-[180px] overflow-hidden rounded-tl-[40px] md:rounded-tl-[80px] mb-4 md:mb-0 md:mr-6">
              <video
                className="w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
              >
                <source src={Forecast} type="video/mp4" />
              </video>
            </div>

            {/* Text */}
            <div className="text-white">
              <p className="font-Aldrich text-xl md:text-2xl mb-2">Forecast Accuracy</p>
              <p className="text-sm opacity-60 leading-snug">
                Predict trends with precision using real-time <br className="hidden md:inline" />
                and historical data. Nox Analytics helps <br className="hidden md:inline" />
                you plan smarter with accurate, AI-powered forecasts.
              </p>
              <NavLink className="flex items-center gap-2 mt-3 text-white hover:underline">
                <span className="text-sm font-bold">Learn More</span>
                <MoveRight size={16} />
              </NavLink>
            </div>
          </div>

          {/* Demand Planning Card */}
          <div className="flex flex-col md:flex-row items-center border border-[#5144FF] bg-[#2D2B38] rounded-bl-[50px] md:rounded-bl-[100px] p-4 hover:scale-105 transition-all duration-300 opacity-40 hover:opacity-100">
            {/* Video */}
            <div className="w-full md:w-[210px] h-[210px] overflow-hidden rounded-bl-[40px] md:rounded-bl-[80px] mb-4 md:mb-0 md:mr-6">
              <video
                className="w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
              >
                <source src={Demand} type="video/mp4" />
              </video>
            </div>

            {/* Text */}
            <div className="text-white">
              <p className="font-Aldrich text-xl md:text-2xl mb-2">Demand Planning</p>
              <p className="text-sm opacity-60 leading-snug">
                Anticipate demand with smart analytics. <br className="hidden md:inline" />
                Nox ensures you stock the right products, <br className="hidden md:inline" />
                reducing waste and missed sales.
              </p>
              <NavLink className="flex items-center gap-2 mt-3 text-white hover:underline">
                <span className="text-sm font-bold">Learn More</span>
                <MoveRight size={16} />
              </NavLink>
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="w-full md:w-1/3 mt-6 md:mt-0 px-2 md:px-8 border border-[#5144FF] bg-[#2D2B38] rounded-br-[50px] md:rounded-br-[100px] rounded-tr-[50px] md:rounded-tr-[100px] hover:scale-105 transition-all duration-300 opacity-40 hover:opacity-100">
          {/* Video */}
          <div className="w-full h-[180px] overflow-hidden rounded-tr-[40px] md:rounded-tr-[80px] mt-6 mb-4">
            <video
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            >
              <source src={Medical} type="video/mp4" />
            </video>
          </div>

          {/* Text */}
          <p className="font-Aldrich text-xl md:text-2xl text-white mb-3">Churn Prediction</p>
          <p className="text-sm text-white opacity-60 leading-relaxed">
            Spot users likely to leave with AI-driven churn detection. <br />
            Take proactive steps to retain customers and reduce drop-offs.
          </p>
          <NavLink className="flex items-center gap-2 mt-4 mb-6 text-white hover:underline">
            <span className="text-sm font-bold">Learn More</span>
            <MoveRight size={16} />
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default Features;