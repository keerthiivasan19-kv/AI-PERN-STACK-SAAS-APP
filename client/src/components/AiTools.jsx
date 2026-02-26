import { useUser } from "@clerk/clerk-react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { AiToolsData } from "../assets/assets";

const AiTools = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  return (
    <div className="px-4 sm:px-20 xl:px-32 my-24">
      <div className="text-center mb-16">
        <h2 className="text-gray-800 text-4xl lg:text-5xl font-bold mb-4">
          AI Tools
        </h2>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Explore our suite of AI tools designed to enhance your productivity
          and creativity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {AiToolsData.map((tool, index) => (
          <div
            key={index}
            className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer group border border-gray-100"
            onClick={() => user && navigate(tool.path)}
          >
            <div className="mb-6">
              <tool.Icon
                className="w-12 h-12 p-3 text-white rounded-xl"
                style={{
                  background: `linear-gradient(to bottom, ${tool.bg.from}, ${tool.bg.to})`,
                }}
              />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-[#9234EA] transition-colors duration-300">
              {tool.title}
            </h3>
            <p className="text-gray-600 leading-relaxed">{tool.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AiTools;
