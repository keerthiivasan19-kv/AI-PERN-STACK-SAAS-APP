import React from "react";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="px-4 sm:px-20 xl:px-32 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Company Info */}
          <div className="col-span-1 md:col-span-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 sm:gap-8">
              <div
                className="flex gap-2 items-center cursor-pointer"
                onClick={() => navigate("/")}
              >
                <img
                  src={assets.logo}
                  className="h-8 w-auto transition-transform hover:scale-105"
                  alt="ACK's AI logo"
                />
                <h2 className="text-2xl font-bold">ACK's AI</h2>
              </div>

              <p className="text-gray-300 max-w-md text-left sm:text-right">
                Leverage the power of AI to generate high-quality content
                effortlessly. Create amazing content with our suite of AI tools.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-700 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2025 ACK's AI. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a
                href="#"
                className="text-gray-400 hover:text-white text-sm transition-colors duration-200"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white text-sm transition-colors duration-200"
              >
                Terms of Service
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white text-sm transition-colors duration-200"
              >
                Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
