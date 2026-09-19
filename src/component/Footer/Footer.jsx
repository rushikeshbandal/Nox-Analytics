import React, { useState } from "react";
import logo from "../../assets/logos/LogoBlackBG.png";
import linkedin from "../../assets/social_media/Group.svg";
import instagram from "../../assets/instagram.svg";
import X from "../../assets/social_media/Vector.svg";
import { NavLink } from "react-router-dom";
import bg from "../../assets/bg/Footer BG.png";

const Footer = () => {
  const Company = [
    { id: 1, name: "About", link: "" },
    { id: 2, name: "Mobile", link: "" },
    { id: 3, name: "Blog", link: "" },
    { id: 4, name: "How it Works", link: "" },
  ];

  const Careers = [
    { id: 1, name: "Why work with us", link: "" },
    { id: 2, name: "Our Culture", link: "" },
    { id: 3, name: "Current Openings", link: "" },
    { id: 4, name: "Join Nox Analytics", link: "" },
    {
      id: 5,
      name: "Careers@noxanalytics.com",
      link: "mailto:careers@noxanalytics.com",
    },
  ];

  const ContactHub = [
    {
      id: 1,
      title: "Help / FAQ",
      links: [
        { name: "Help and Support", to: "#" },
        { name: "Support Center", to: "#" },
        { name: "Help and FAQ", to: "#" },
      ],
    },
    {
      id: 2,
      title: "Press",
      links: [
        { name: "Press Center", to: "#" },
        { name: "Newsroom", to: "#" },
        { name: "Media and Press", to: "#" },
      ],
    },
    {
      id: 3,
      title: "Affiliates",
      links: [
        { name: "Affiliate Program", to: "#" },
        { name: "Partner With Us", to: "#" },
        { name: "Affiliate Network", to: "#" },
      ],
    },
    {
      id: 4,
      title: "Partners",
      links: [
        { name: "Partnerships", to: "#" },
        { name: "Partner Network", to: "#" },
        { name: "Our Partners", to: "#" },
      ],
    },
  ];

  const [openDropdown, setOpenDropdown] = useState(null);

  const toggleDropdown = (id) => {
    setOpenDropdown(openDropdown === id ? null : id);
  };

  return (
    <div
      id="contacthub"
      className="w-full pt-[64px] pb-6 flex flex-col items-center"
      style={{
        backgroundImage: "url(" + bg + ")",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="w-full max-w-[1400px] px-6 flex flex-wrap justify-between text-white">

        <div className="flex flex-col w-[300px] mb-10">
          <img src={logo} alt="Logo" className="w-[240px] mb-6" />
          <p className="text-[16px] leading-6 opacity-60">
            Nox simplifies complex analytics and makes powerful insights
            accessible. Explore powerful analysis and gain control of your data.
          </p>
          <div className="flex gap-4 mt-6">
            <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer">
              <img src={X} alt="X" />
            </a>
            <a href="https://www.linkedin.com/company/noxanalytics/" target="_blank" rel="noopener noreferrer">
              <img src={linkedin} alt="LinkedIn" />
            </a>
            <a href="https://www.instagram.com/noxanalytics/?hl=en" target="_blank" rel="noopener noreferrer">
              <img src={instagram} alt="Instagram" />
            </a>
          </div>
        </div>

        <div id="company" className="flex flex-col gap-3 mb-10 min-w-[160px]">
          <h2 className="text-2xl font-bold font-Aldrich">Company</h2>
          {Company.map((item) => (
            <NavLink key={item.id} to={item.link} className="font-Aldrich text-white">
              {item.name}
            </NavLink>
          ))}
        </div>

        <div className="flex flex-col gap-3 mb-10 min-w-[200px]">
          <h2 className="text-2xl font-bold font-Aldrich mb-2">Contact Hub</h2>
          {ContactHub.map((section) => (
            <div key={section.id} className="mb-2">
              <button
                onClick={() => toggleDropdown(section.id)}
                className="w-full flex justify-between items-center font-Aldrich text-white hover:text-gray-300"
              >
                {section.title}
              </button>
              {openDropdown === section.id && (
                <ul className="ml-4 mt-2 space-y-1 text-sm text-gray-300">
                  {section.links.map((link, idx) => (
                    <li key={idx}>
                      <NavLink to={link.to} className="hover:text-white">
                        {link.name}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 mb-10 min-w-[160px]">
          <h2 className="text-2xl font-bold font-Aldrich">Careers</h2>
          {Careers.map((item) => (
            <NavLink key={item.id} to={item.link} className="font-Aldrich text-white hover:text-gray-300">
              {item.name}
            </NavLink>
          ))}
        </div>

        <div className="flex flex-col gap-2 text-[16px] font-Inter mb-10 max-w-[280px]">
          <h2 className="text-2xl font-bold font-Aldrich">Global Headquarters</h2>
          <p className="font-bold text-base">Biz Credence Global Consulting and Systems LLP</p>
          <p className="text-sm opacity-70">LLPIN: ACU-6506</p>
          <p className="mt-3 font-semibold text-sm">Registered Office:</p>
          <p className="text-sm opacity-70">
            SLN Terminus, Survey No. 13, 3rd Floor, Unit 8, Beside Botanical Garden,
            Gachibowli, Serilingampally Mandal, Ranga Reddy District,
            Hyderabad - 500032, Telangana, India
          </p>
          <p className="mt-3 font-semibold text-sm">Centre of Excellence (CoE) / Principal Place of Business:</p>
          <p className="text-sm opacity-70">
            AVK Sri Harsha Icon, 4th Floor, Nanakramguda, Financial District,
            Hyderabad - 500032, Telangana, India
          </p>
          <p className="mt-3 font-Aldrich text-sm font-bold">
            Or contact us:{" "}
            <a href="mailto:contact@bizcredence.com" className="hover:text-gray-300">
              contact@bizcredence.com
            </a>
          </p>
        </div>

      </div>

      <p className="text-white text-sm opacity-45 text-center font-Aldrich px-4 mt-6">
        2024-2025 Copyright jointly owned by{" "}
        <a href="https://noxanalytics.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">
          NOX Analytics
        </a>
        ,{" "}
        <a href="https://bizcredence.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">
          Biz Credence Global Consulting and Systems LLP
        </a>
        , and{" "}
        <a href="https://hatundia.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">
          Hatundia Securities Private Limited
        </a>
        . All rights reserved.
      </p>
    </div>
  );
};

export default Footer;