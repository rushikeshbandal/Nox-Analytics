import React from 'react';

const FoundersMessage = () => {
  return (
    <div className='w-full bg-gradient-to-l from-[#D72638] to-[#1A1A1A] flex flex-col items-start md:items-center justify-center px-4 py-10 md:py-20 gap-6'>
      {/* Heading */}
      <h3 className='text-xl md:text-2xl font-bold text-white font-Aldrich text-left md:text-center'>
        Founder's Message:
      </h3>

      {/* Paragraph */}
      <p className='text-white opacity-70 font-Aldrich text-sm md:text-base leading-relaxed max-w-4xl text-left md:text-center'>
        “In building NOX Analytics, my goal was clear — to shift enterprises from being data-aware to being decision-intelligent. Too many businesses rely on static dashboards, delayed insights, and fragmented tools that can’t keep pace with today’s velocity of change. I envisioned NOX not just as a platform, but as a force multiplier — a real-time, AI-native decision engine where data becomes dialogue and strategy becomes systematized. Powered by Machine Learning, Generative AI, and Natural Language Processing, NOX listens, learns, and acts — helping leaders command intelligence at speed and scale. We're not just solving for insights — we’re engineering the next operating system for strategic clarity, designed for those who refuse to wait for answers.”
      </p>

      {/* Founder Name */}
      <h4 className='text-white text-base md:text-lg font-bold font-Aldrich text-left md:text-center'>
        Aneel Mitra <br className="hidden md:block" />
        Founder and CEO, NOX Analytics
      </h4>
    </div>
  );
};

export default FoundersMessage;