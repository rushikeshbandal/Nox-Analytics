import React from 'react';
import Churn from "../../assets/GIF/New GIF/1114951_Man_Woman_1920x1080.mp4";
import Sales from "../../assets/GIF/New GIF/573257_Business_Stock_3840x2160.mp4";
import Support from "../../assets/GIF/New GIF/0_Technology_Data_Visualization_3840x2160.mov";
import bg from "../../assets/bg/4thSectionBG.png";
import PopOver from '../PopOver';

const LiveInsights = () => {
  const cards = [
    {
      id: 1,
      title: "Churn Risk Spike",
      profile: Churn,
      description: "Identifies sudden drop in user engagement and predicts likelihood of churn."
    },
    {
      id: 2,
      title: "Sales Surge Zones",
      profile: Sales,
      description: "Highlights geographic regions with above average demand and growth acceleration."
    },
    {
      id: 3,
      title: "Support Load Monitor",
      profile: Support,
      description: "Surfaces real-time spike in unresolved tickets and customer complaints."
    }
  ];

  return (
    <div
      className="bg-[#1A1A1A] w-full flex flex-col items-center py-10 md:pt-20 md:pb-[100px] font-Aldrich"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Title */}
      <h2 className="text-white text-2xl md:text-3xl font-bold text-center mb-4 px-4">
        Live Insights at Glance
      </h2>

      {/* Subtitle */}
      <p className="text-white opacity-50 text-sm text-center px-4 max-w-md mb-10">
        From silence to signal — NOX delivers live insights that speak before trends shout.
      </p>

      {/* Cards */}
      <div className="flex flex-wrap justify-center gap-6 md:gap-[58px] px-4">
        {cards.map((card) => (
          <PopOver
            key={card.id}
            content={card.description}
            trigger="hover"
            token={{
              colorPrimary: 'black',
              borderRadius: 2,
              colorBgContainer: '#000000',
              color: "#000000"
            }}
          >
            <div className="flex flex-col items-center cursor-pointer w-full max-w-[320px]">
              {/* Video */}
              <div className="w-full h-[200px] md:h-[300px] bg-black overflow-hidden rounded-md shadow-md">
                <video
                  className="w-full h-full object-cover"
                  src={card.profile}
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              </div>

              {/* Title */}
              <span className="text-white text-lg md:text-2xl mt-3 text-center">
                {card.title}
              </span>
            </div>
          </PopOver>
        ))}
      </div>
    </div>
  );
};

export default LiveInsights;