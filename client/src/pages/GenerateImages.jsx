import { Image, Sparkles, Download } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import axios from "axios";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
axios.defaults.baseURL = API_URL;

const GenerateImages = () => {
  const imageStyle = [
    "Realistic",
    "Ghibli style",
    "Anime style",
    "Cartoon style",
    "Fantasy style",
    "Urban style",
    "3D style",
    "Portrait style",
  ];

  const [selectedStyle, setSelectedStyle] = useState("Realistic");
  const [input, setInput] = useState("");
  const [publish, setPublish] = useState(false);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");

  const { getToken } = useAuth();
  const { user } = useUser();
  const [planValue, setPlanValue] = useState(null);

  const isPremium =
    String(planValue || user?.publicMetadata?.plan || "free").toLowerCase() ===
    "premium";

  useEffect(() => {
    const loadPlan = async () => {
      if (!user) return;
      try {
        const { data } = await axios.get("/api/user/get-usage", {
          headers: {
            Authorization: `Bearer ${await getToken()}`,
          },
        });
        if (data?.success) setPlanValue(data.plan);
      } catch {
        // ignore and fall back to Clerk metadata
      }
    };
    loadPlan();
  }, [user]);

  useEffect(() => {
    if (!isPremium && publish) {
      setPublish(false);
    }
  }, [isPremium, publish]);

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const prompt = `generate image of ${input} in the style ${selectedStyle}`;

      const { data } = await axios.post(
        "/api/ai/generate-image",
        { prompt, publish },
        {
          headers: {
            Authorization: `Bearer ${await getToken()}`,
          },
        }
      );

      if (data.success) {
        setContent(data.content);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || error.message || "Request failed"
      );
    }
    setLoading(false);
  };

  const isDataUrl = content?.startsWith("data:image");

  const downloadImage = async () => {
    if (!content) return;

    try {
      if (isDataUrl) {
        const link = document.createElement("a");
        link.href = content;
        link.download = `generated-image-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        try {
          const response = await fetch(content);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `generated-image-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } catch (err) {
          window.open(content, "_blank");
        }
      }

      toast.success("Image downloaded successfully!");
    } catch (error) {
      toast.error("Failed to download image");
      console.error("Download error:", error);
    }
  };

  return (
    <div className="h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700">
      {/* left col */}
      <form
        onSubmit={onSubmitHandler}
        className="w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 text-[#00AD25]" />
          <h1 className="text-xl font-semibold">AI Image Generator</h1>
        </div>

        <p className="mt-6 text-sm font-medium">Describe your image</p>

        <textarea
          onChange={(e) => setInput(e.target.value)}
          value={input}
          rows={4}
          className="w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300"
          placeholder="Describe what you want to see image..."
          required
        />

        <p className="mt-4 text-sm font-medium">Style</p>

        <div className="mt-3 flex gap-3 flex-wrap sm:max-w-9/11">
          {imageStyle.map((item) => (
            <span
              onClick={() => setSelectedStyle(item)}
              className={`text-xs px-4 py-1 border rounded-full cursor-pointer ${
                selectedStyle === item
                  ? "bg-green-50 text-green-500"
                  : "text-gray-500 border-gray-300"
              }`}
              key={item}
            >
              {item}
            </span>
          ))}
        </div>

        <div className="my-6 flex items-center gap-2">
          <label
            className={`relative ${isPremium ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
          >
            <input
              type="checkbox"
              onChange={(e) => setPublish(e.target.checked)}
              checked={publish}
              disabled={!isPremium}
              className="sr-only peer"
            />
            <div className="w-9 h-5 rounded-full bg-slate-300 peer-checked:bg-green-500 transition"></div>
            <span className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition peer-checked:translate-x-4"></span>
          </label>
          <p className="text-sm">
            Make this image public
            {!isPremium && (
              <span className="text-xs text-slate-400 ml-2">
                Premium only
              </span>
            )}
          </p>
        </div>

        <button
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#00AD25] to-[#02d241] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer"
        >
          {loading ? (
            <span className="w-4 h-4 my-1 rounded-full border-2 border-t-transparent animate-spin"></span>
          ) : (
            <Image className="w-5" />
          )}
          Generate Image
        </button>
      </form>
      {/* right col */}
      <div className="w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200 flex flex-col min-h-96">
        <div className="flex items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <Image className="w-5 h-5 text-[#00AD25]" />
            <h1 className="text-xl font-semibold">Generated image</h1>
          </div>
          {content && (
            <button
              onClick={downloadImage}
              className="flex items-center gap-2 bg-gradient-to-r from-[#00AD25] to-[#02d241] text-white px-3 py-2 text-xs rounded-lg hover:from-[#00a023] hover:to-[#02c23b] transition-all duration-200"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          )}
        </div>
        {!content ? (
          <div className="flex-1 flex justify-center items-center">
            <div className="text-sm flex flex-col items-center gap-5 text-gray-300">
              <Image className="w-9 h-9 " />
              <p>Enter a topic and click 'Generate image' to get started</p>
            </div>
          </div>
        ) : (
          <div className="mt-3 h-full">
            <img
              src={content}
              alt="image"
              className="w-full h-full"
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
              onError={(e) => {
                console.error("Image load error:", e);
                toast.error("Failed to load image. Try again.");
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateImages;
