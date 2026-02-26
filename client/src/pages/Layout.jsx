import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { Menu, X } from "lucide-react";
import Sidebar from "../components/Sidebar";
import { useUser, SignIn } from "@clerk/clerk-react";

const Layout = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [sidebar, setSidebar] = useState(false);

  return user ? (
    <div className="flex flex-col h-screen bg-gray-50">
      <nav className="fixed z-50 w-full bg-white/90 backdrop-blur-sm border-b border-gray-200 flex items-center justify-between py-4 px-4 sm:px-13 xl:px-17 shadow-sm">
        <div
          className="flex gap-2 items-center font-bold text-gray-800 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <img
            src={assets.logo}
            alt="logo"
            className="h-8 w-auto transition-transform hover:scale-105"
          />
          ACK's AI
        </div>
        <div className="sm:hidden">
          {sidebar ? (
            <X
              onClick={() => setSidebar(false)}
              className="w-6 h-6 text-gray-600 hover:text-gray-800 cursor-pointer transition-colors"
            />
          ) : (
            <Menu
              onClick={() => setSidebar(true)}
              className="w-6 h-6 text-gray-600 hover:text-gray-800 cursor-pointer transition-colors"
            />
          )}
        </div>
      </nav>

      <div className="flex flex-1 pt-16">
        {/* Mobile overlay */}
        {sidebar && (
          <div
            className="fixed inset-0 bg-black/50 z-30 sm:hidden"
            onClick={() => setSidebar(false)}
          />
        )}
        <Sidebar sidebar={sidebar} setSidebar={setSidebar} />
        <div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 min-h-full">
          <Outlet />
        </div>
      </div>
    </div>
  ) : (
    <div className="flex items-center justify-center h-screen">
      <SignIn />
    </div>
  );
};

export default Layout;
