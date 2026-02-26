import React, { useEffect } from "react";
import { Gem, Sparkles } from "lucide-react";
import { useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import CreationItem from "../components/CreationItem";
import axios from "axios";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
axios.defaults.baseURL = API_URL;

const Dashboard = () => {
  const [creations, setCreations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [planValue, setPlanValue] = useState(null);

  const { getToken } = useAuth();
  const { user } = useUser();

  const planLabel =
    String(planValue || user?.publicMetadata?.plan || "free").toLowerCase() ===
    "premium"
      ? "Premium"
      : "Free";

  const getDashboardData = async () => {
    try {
      const token = await getToken();

      const [creationsRes, usageRes] = await Promise.all([
        axios.get("/api/user/get-user-creations", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("/api/user/get-usage", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (creationsRes.data?.success) {
        setCreations(creationsRes.data.creations);
      } else {
        toast.error(creationsRes.data?.message);
      }

      if (usageRes.data?.success) {
        setPlanValue(usageRes.data.plan);
      }
    } catch (error) {
      toast.error(error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    getDashboardData();
  }, []);

  return (
    <div className="h-full overflow-y-scroll p-6">
      <div className="flex justify-start gap-4 flex-wrap">
        {/* total creations card */}
        <div className="flex justify-between items-center w-72 p-4 px-5 bg-white rounded-xl border border-gray-200">
          <div className="text-slate-600">
            <p className="text-sm">Total Creations</p>
            <h2 className="text-xl font-semibold">{creations.length}</h2>
          </div>
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#3588F2] to-[#0BB0D7] text-white flex justify-center items-center">
            <Sparkles className="w-5 text-white" />
          </div>
        </div>
        {/* active plan card */}
        <div className="flex justify-between items-center w-72 p-4 px-5 bg-white rounded-xl border border-gray-200">
          <div className="text-slate-600">
            <p className="text-sm">Active Plan</p>
            <h2 className="text-xl font-semibold">{planLabel}</h2>
          </div>
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FF61C5] to-[#9E53EE] text-white flex justify-center items-center">
            <Gem className="w-5 text-white" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-3/4">
          <span className="w-10 h-10 my-1 rounded-full border-3 border-primary border-t-transparent animate-spin"></span>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="mt-6 mb-4">Recent Creations</p>
          {creations.map((item) => (
            <CreationItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
