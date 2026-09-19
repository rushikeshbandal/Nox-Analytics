import React from 'react';
import HeroSection from '../component/Sections/HeroSection';
import Features from '../component/Sections/Features';
import About from '../component/Sections/About';
import HowItWorks from '../component/Sections/HowItWorks';
import LiveInsights from '../component/Sections/LiveInsights';
import FoundersMessage from '../component/Sections/FoundersMessage';
import ClientDashboard from '../component/Sections/ClientDashboard';

const Home = () => {
  return (
    <div className=''>
      <div id="hero"><HeroSection /></div>
      <Features />
      <div id="about"><About /></div>
      <LiveInsights />
      <FoundersMessage />
      <div id="howitworks"><HowItWorks /></div>
      {/* <StartNow /> */}
      <div ><ClientDashboard /></div>
    </div>
  );
};

export default Home;