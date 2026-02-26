import React, { useEffect, useMemo, useState } from "react";
import { Check, Crown } from "lucide-react";
import { useAuth, useClerk, useUser } from "@clerk/clerk-react";
import axios from "axios";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
axios.defaults.baseURL = API_URL;

const Plan = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { openSignIn, openUserProfile } = useClerk();

  const [usage, setUsage] = useState({
    free_usage: 0,
    limit: 3,
    plan: "free",
    unlimited: false,
  });
  const [loading, setLoading] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  const planValue = useMemo(
    () =>
      String(usage.plan || user?.publicMetadata?.plan || "free").toLowerCase(),
    [usage.plan, user]
  );
  const isPremium = planValue === "premium";

  const fetchUsage = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data } = await axios.get("/api/user/get-usage", {
        headers: {
          Authorization: `Bearer ${await getToken()}`,
        },
      });
      if (data.success) {
        setUsage(data);
      }
    } catch (error) {
      console.error("USAGE FETCH ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, [user]);

  const handleUpgrade = async () => {
    if (!user) return openSignIn();

    try {
      setUpgrading(true);
      const { data } = await axios.post(
        "/api/user/upgrade",
        {},
        {
          headers: {
            Authorization: `Bearer ${await getToken()}`,
          },
        }
      );

      if (data?.success) {
        await user.reload();
        await fetchUsage();
        toast.success("You're now on Premium.");
      } else {
        toast.error(data?.message || "Upgrade failed.");
        openUserProfile();
      }
    } catch (error) {
      const message =
        error?.response?.data?.message || error?.message || "Upgrade failed.";
      toast.error(message);
      if (error?.response?.status === 403) {
        openUserProfile();
      }
    } finally {
      setUpgrading(false);
    }
  };

  const freeUsagePercent =
    !usage.unlimited && usage.limit > 0
      ? Math.min(100, Math.round((usage.free_usage / usage.limit) * 100))
      : 0;

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "month",
      description: "Perfect to explore core AI tools.",
      features: [
        `${usage.unlimited ? "Unlimited" : usage.limit} AI generations`,
        "Article writer",
        "Blog title generator",
        "Resume review",
        "Image generation (basic)",
        "Background & object removal",
      ],
      highlight: false,
    },
    {
      name: "Premium",
      price: "$9",
      period: "month",
      description: "Unlimited creativity for power users.",
      features: [
        "Unlimited AI generations",
        "Priority processing",
        "Publish to Community",
        "All AI tools unlocked",
        "Premium support",
      ],
      highlight: true,
    },
  ];

  return (
    <section className="relative py-20 bg-gradient-to-b from-white to-slate-50">
      <div className="px-4 sm:px-20 xl:px-32 max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
            <Crown className="w-4 h-4" />
            Plans
          </p>
          <h2 className="text-4xl lg:text-5xl font-bold text-slate-800 mt-4">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mt-4">
            Start free and upgrade whenever you're ready. Premium users get
            unlimited generations and community publishing.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {plans.map((plan) => {
            const isCurrent =
              (plan.name === "Premium" && isPremium) ||
              (plan.name === "Free" && !isPremium);
            const ctaLabel = !user
              ? "Get Started"
              : plan.name === "Premium"
              ? isPremium
                ? "Current Plan"
                : upgrading
                ? "Upgrading..."
                : "Upgrade to Premium"
              : isPremium
              ? "Free Plan"
              : "Current Plan";

            return (
              <div
                key={plan.name}
                className={`relative rounded-2xl border ${
                  plan.highlight
                    ? "border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-purple-50 shadow-xl"
                    : "border-gray-200 bg-white shadow-sm"
                } p-8`}
              >
                {plan.highlight && (
                  <span className="absolute top-4 right-4 text-xs font-semibold bg-gradient-to-r from-[#3C81F6] to-[#9234EA] text-white px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}

                <h3 className="text-xl font-semibold text-slate-800">
                  {plan.name}
                </h3>
                <p className="text-slate-600 mt-2">{plan.description}</p>

                <div className="mt-6 flex items-end gap-2">
                  <span className="text-4xl font-bold text-slate-900">
                    {plan.price}
                  </span>
                  <span className="text-slate-500">/ {plan.period}</span>
                </div>

                <ul className="mt-6 space-y-3 text-sm text-slate-600">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.name === "Free" && user && !usage.unlimited && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                      <span>
                        Free usage: {usage.free_usage}/{usage.limit}
                      </span>
                      <span>{loading ? "..." : `${freeUsagePercent}%`}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-[#3C81F6] to-[#9234EA]"
                        style={{ width: `${freeUsagePercent}%` }}
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    if (!user) return openSignIn();
                    if (plan.name === "Premium" && !isPremium) {
                      return handleUpgrade();
                    }
                  }}
                  disabled={isCurrent || upgrading}
                  className={`mt-8 w-full py-3 rounded-lg text-sm font-semibold transition-all ${
                    plan.highlight
                      ? "text-white bg-gradient-to-r from-[#3C81F6] to-[#9234EA] hover:opacity-90"
                      : "text-indigo-700 border border-indigo-200 hover:bg-indigo-50"
                  } ${isCurrent ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  {ctaLabel}
                </button>
              </div>
            );
          })}
        </div>

        {!user && (
          <p className="text-center text-sm text-slate-500 mt-8">
            Sign in to track usage and upgrade your plan.
          </p>
        )}
      </div>
    </section>
  );
};

export default Plan;
