import React, { useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import { HashLink } from "react-router-hash-link";
import { Link } from "react-router-dom";
import logo from "../assets/logos/LogoBlackBG.png";

const HomePageHeader = () => {
  const [navOpen, setNavOpen] = useState(false);

  const links = [
    { id: 1, link: "/#hero", name: "Home" },
    { id: 2, link: "/#about", name: "About" },
    { id: 3, link: "/#howitworks", name: "How it Works" },
    { id: 4, link: "/#contacthub", name: "Contact" },
  ];

  return (
    <header className="sticky top-0 z-40 text-white bg-[#1A1A1A] flex items-center justify-between px-6 py-4 md:px-16">
      
         <div className="flex-1 items-center  md:justify-start">
        <img
          src={logo}
          alt="Nox Analytics Logo"
          className="w-28 sm:w-32 md:w-36 lg:w-44 xl:w-52 object-contain"
        />
      </div>

      {/* Desktop Links */}
      <nav className="hidden md:flex items-center gap-6">
        {links.map((link) => (
          <HashLink
            smooth
            className="text-white text-lg font-Aldrich"
            to={link.link}
            key={link.id}
          >
            {link.name}
          </HashLink>
        ))}
        <Link
          to="/Login"
          className="rounded-sm text-xl font-bold focus:outline-none bg-white text-black py-2 px-6 focus:ring-2 focus:ring-blue-500"
        >
          Login
        </Link>
      </nav>

      {/* Mobile Hamburger */}
      <div className="md:hidden">
        <button
          onClick={() => setNavOpen(!navOpen)}
          className="text-white text-2xl focus:outline-none"
        >
          {navOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Mobile Menu */}
      {navOpen && (
        <div className="absolute top-16 left-0 w-full bg-[#1A1A1A] text-white flex flex-col items-center gap-6 py-6 md:hidden z-50">
          {links.map((link) => (
            <HashLink
              smooth
              to={link.link}
              key={link.id}
              className="text-lg font-Aldrich"
              onClick={() => setNavOpen(false)}
            >
              {link.name}
            </HashLink>
          ))}
          <Link
            to="/Login"
            onClick={() => setNavOpen(false)}
            className="rounded-sm text-xl font-bold focus:outline-none bg-white text-black py-2 px-6 focus:ring-2 focus:ring-blue-500"
          >
            Login
          </Link>
        </div>
      )}
    </header>
  );
};

export default HomePageHeader;