import React from "react";
import Box1 from "../../assets/cards/Box 1.svg";
import Box2 from "../../assets/cards/Box 2.svg";
import Box3 from "../../assets/cards/Box 3.svg";

const HowItWorks = () => {
  return (
    <div className="w-full bg-[#1A1A1A] flex flex-col items-center px-4 py-10 md:py-[57px] md:h-[721px]">
      {/* Heading */}
      <p className="text-white font-Aldrich text-2xl md:text-[30px] font-semibold mb-3 text-center">
        How it Works
      </p>

      {/* Subtext */}
      <p className="font-Aldrich text-white text-sm opacity-50 text-center mb-10 md:mb-[70px] max-w-3xl">
        Nox by all default simplifies complex analytics and makes powerful insights accessible. <br className="hidden md:block" />
        Powerful analysis about your data and power controls.
      </p>

      {/* Cards Section */}
      <div className="flex flex-col md:flex-row gap-6 md:gap-[30px] items-center justify-center">
        <img src={Box1} alt="Step 1" className="w-full max-w-[395px]" />
        <img src={Box2} alt="Step 2" className="w-full max-w-[395px]" />
        <img src={Box3} alt="Step 3" className="w-full max-w-[395px]" />
      </div>
    </div>
  );
};

export default HowItWorks;