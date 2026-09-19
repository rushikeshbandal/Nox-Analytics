import { MoveRight } from "lucide-react";
import React from "react";
import AboutUS from "../../assets/About_us.svg";
import bg from "../../assets/bg/3rd Section BG.png";

const About = () => {
  return (
    <div
      className="w-full bg-[#1A1A1A] flex flex-col justify-center items-center py-10 md:py-24"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Heading */}
      <div className="flex flex-col items-center text-center px-4">
        <p className="text-2xl md:text-3xl text-white font-Aldrich">
          About Nox Analytics
        </p>
        <p className="mt-3 md:mt-5 text-[#757575] font-Aldrich text-sm max-w-md">
          Discover our story, values, and the team behind our mission. Accept
        </p>
      </div>

      {/* Content */}
      <div className="mt-10 md:mt-[65px] flex flex-col md:flex-row items-center justify-between gap-10 px-4 md:px-[105px] w-full max-w-6xl text-white font-Aldrich">
        {/* Left - Image */}
        <div className="w-full md:w-1/2 flex justify-center">
          <img
            src={AboutUS}
            alt="About Us"
            className="w-[250px] h-[250px] md:w-[530px] md:h-[530px]"
          />
        </div>

        {/* Right - Text */}
        <div className="w-full md:w-1/2 flex flex-col justify-center">
          <p className="tracking-wide leading-loose text-sm md:text-base text-[#E0E0E0]">
            Founded in 2023, Nox Analytics was built on the <br className="hidden md:inline" />
            principle that data should empower decisions, not <br className="hidden md:inline" />
            complicate them. We are a passionate team of <br className="hidden md:inline" />
            data scientists, engineers, and business strategists <br className="hidden md:inline" />
            dedicated to helping companies unlock the true <br className="hidden md:inline" />
            potential of their information assets. Our journey <br className="hidden md:inline" />
            began with a vision to simplify complex analytics.
          </p>

          <button className="text-black py-3 px-6 bg-white w-fit mt-6 md:mt-11 flex items-center gap-2">
            <span className="text-sm">Learn more</span>
            <MoveRight className="text-sm" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default About;