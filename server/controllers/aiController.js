import sql from "../configs/db.js";
import fs from "fs";
import pdf from "pdf-parse/lib/pdf-parse.js";
import { v2 as cloudinary } from "cloudinary";
import { InferenceClient } from "@huggingface/inference";
import OpenAI from "openai";
import { clerkClient } from "@clerk/express";

// 🔴 CRITICAL FIX — satisfy OpenAI SDK validation
process.env.OPENAI_API_KEY =
  process.env.OPENAI_API_KEY || "dummy_key_for_gemini";

const FREE_USAGE_LIMIT = Number(process.env.FREE_USAGE_LIMIT || 3);
const UNLIMITED_USAGE = process.env.UNLIMITED_USAGE === "true";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_VERSION = process.env.GEMINI_API_VERSION || "v1beta";
const GEMINI_MODEL_ENV = process.env.GEMINI_MODEL;
const GEMINI_IMAGE_MODEL =
  process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const GEMINI_IMAGE_LOCATION = process.env.GEMINI_IMAGE_LOCATION || "global";
const GEMINI_IMAGE_PROJECT = process.env.GEMINI_IMAGE_PROJECT || "";
const GEMINI_IMAGE_ENDPOINT = process.env.GEMINI_IMAGE_ENDPOINT || "";
const GEMINI_IMAGE_ACCESS_TOKEN = process.env.GEMINI_IMAGE_ACCESS_TOKEN || "";
const ALLOW_DB_FAILURES = process.env.ALLOW_DB_FAILURES === "true";
const HF_IMAGE_MODEL =
  process.env.HF_IMAGE_MODEL || "stabilityai/stable-diffusion-xl-base-1.0";
const HF_IMAGE_PROVIDER = process.env.HF_IMAGE_PROVIDER;
const IMAGE_PROVIDER = (process.env.IMAGE_PROVIDER || "").toLowerCase();
const POLLINATIONS_BASE =
  process.env.POLLINATIONS_BASE ||
  "https://gen.pollinations.ai/image/";
const POLLINATIONS_QUERY = process.env.POLLINATIONS_QUERY || "";
const POLLINATIONS_KEY = process.env.POLLINATIONS_KEY || "";
const POLLINATIONS_MODEL = process.env.POLLINATIONS_MODEL || "flux";
const POLLINATIONS_WIDTH = Number(process.env.POLLINATIONS_WIDTH || 0);
const POLLINATIONS_HEIGHT = Number(process.env.POLLINATIONS_HEIGHT || 0);
const POLLINATIONS_PROXY = process.env.POLLINATIONS_PROXY === "true";
const POLLINATIONS_PROXY_FALLBACK =
  process.env.POLLINATIONS_PROXY_FALLBACK !== "false";
const POLLINATIONS_REALISM_SUFFIX =
  process.env.POLLINATIONS_REALISM_SUFFIX ||
  "ultra realistic, high detail, sharp focus, natural lighting, 4k";
const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1.5";
const OPENAI_IMAGE_SIZE = process.env.OPENAI_IMAGE_SIZE || "1024x1024";
const OPENAI_IMAGE_QUALITY = process.env.OPENAI_IMAGE_QUALITY || "high";
const LOCAL_SD_ENABLED = process.env.LOCAL_SD_ENABLED === "true";
const LOCAL_SD_URL = process.env.LOCAL_SD_URL || "";
const LOCAL_SD_STEPS = Number(process.env.LOCAL_SD_STEPS || 28);
const LOCAL_SD_CFG = Number(process.env.LOCAL_SD_CFG || 7);
const LOCAL_SD_SAMPLER =
  process.env.LOCAL_SD_SAMPLER || "DPM++ 2M Karras";
const LOCAL_SD_WIDTH = Number(process.env.LOCAL_SD_WIDTH || 768);
const LOCAL_SD_HEIGHT = Number(process.env.LOCAL_SD_HEIGHT || 768);
const LOCAL_SD_NEGATIVE =
  process.env.LOCAL_SD_NEGATIVE ||
  "lowres, blurry, bad anatomy, bad hands, cropped, watermark, text";
let cachedGeminiModel = null;

const enforceFreeUsage = (req, res) => {
  if (UNLIMITED_USAGE) return true;
  if (req.plan === "free" && req.free_usage >= FREE_USAGE_LIMIT) {
    res.status(403).json({
      success: false,
      message: "Free usage limit reached. Upgrade to continue.",
    });
    return false;
  }
  return true;
};

const incrementFreeUsage = async (req) => {
  if (UNLIMITED_USAGE) return;
  if (req.plan !== "free") return;
  try {
    const nextUsage = Number(req.free_usage || 0) + 1;
    await clerkClient.users.updateUserMetadata(req.userId, {
      privateMetadata: { free_usage: nextUsage },
    });
  } catch (error) {
    console.error("FREE USAGE UPDATE ERROR:", error);
  }
};

const saveCreation = async ({
  userId,
  prompt,
  content,
  type,
  publish = false,
}) => {
  await sql`INSERT INTO creations (user_id, prompt, content, type, publish)
            VALUES (${userId}, ${prompt}, ${content}, ${type}, ${publish})`;
};

const isHeicFile = (file) => {
  const name = (file?.originalname || "").toLowerCase();
  const mime = (file?.mimetype || "").toLowerCase();
  return (
    mime.includes("heic") ||
    mime.includes("heif") ||
    name.endsWith(".heic") ||
    name.endsWith(".heif")
  );
};

const assertEnv = (key, res, label) => {
  if (!process.env[key]) {
    res.status(400).json({
      success: false,
      message: `${label || key} is missing in server/.env`,
    });
    return false;
  }
  return true;
};

const callLocalStableDiffusion = async (prompt) => {
  if (!LOCAL_SD_URL) {
    throw new Error("LOCAL_SD_URL is not set");
  }

  const url = LOCAL_SD_URL.replace(/\/$/, "") + "/sdapi/v1/txt2img";
  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        negative_prompt: LOCAL_SD_NEGATIVE,
        steps: LOCAL_SD_STEPS,
        cfg_scale: LOCAL_SD_CFG,
        sampler_name: LOCAL_SD_SAMPLER,
        width: LOCAL_SD_WIDTH,
        height: LOCAL_SD_HEIGHT,
      }),
    });
  } catch (error) {
    throw new Error(
      `Local SD not reachable at ${url}. Start it with ./webui.sh --api`
    );
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      data?.error || data?.detail || "Local SD request failed";
    throw new Error(message);
  }

  const image = Array.isArray(data?.images) ? data.images[0] : null;
  if (!image) {
    throw new Error("Local SD returned no image");
  }

  return `data:image/png;base64,${image}`;
};

const callOpenAIImage = async (prompt) => {
  if (!openai) {
    throw new Error("OPENAI_API_KEY is missing or invalid");
  }

  const result = await openai.images.generate({
    model: OPENAI_IMAGE_MODEL,
    prompt,
    size: OPENAI_IMAGE_SIZE,
    quality: OPENAI_IMAGE_QUALITY,
  });

  const imageBase64 = result?.data?.[0]?.b64_json;
  if (!imageBase64) {
    throw new Error("OpenAI returned no image");
  }

  return `data:image/png;base64,${imageBase64}`;
};

const callPollinationsImage = async (prompt) => {
  const bases = [
    POLLINATIONS_BASE,
    "https://gen.pollinations.ai/image/",
    "https://image.pollinations.ai/prompt/",
    "https://pollinations.ai/p/",
  ].filter(Boolean);

  const enhanced = POLLINATIONS_REALISM_SUFFIX
    ? `${prompt}, ${POLLINATIONS_REALISM_SUFFIX}`
    : prompt;
  const encoded = encodeURIComponent(enhanced);
  let lastError = null;
  const isSecretKey = POLLINATIONS_KEY?.startsWith("sk_");
  const shouldProxy = POLLINATIONS_PROXY || isSecretKey;

  for (const base of bases) {
    let url = base.replace(/\/?$/, "/") + encoded;
    const baseQuery = POLLINATIONS_QUERY.replace(/^\?/, "");
    const params = new URLSearchParams(baseQuery);
    if (POLLINATIONS_MODEL && !params.has("model")) {
      params.set("model", POLLINATIONS_MODEL);
    }
    if (POLLINATIONS_KEY && !params.has("key") && (shouldProxy || !isSecretKey)) {
      params.set("key", POLLINATIONS_KEY);
    }
    if (POLLINATIONS_WIDTH && !params.has("width")) {
      params.set("width", String(POLLINATIONS_WIDTH));
    }
    if (POLLINATIONS_HEIGHT && !params.has("height")) {
      params.set("height", String(POLLINATIONS_HEIGHT));
    }
    const queryString = params.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }

    if (!shouldProxy) return url;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        lastError = new Error(
          `Pollinations request failed (${response.status})`
        );
        if (POLLINATIONS_PROXY_FALLBACK) {
          return url;
        }
        continue;
      }
      const contentType =
        response.headers.get("content-type") || "image/jpeg";
      const buffer = Buffer.from(await response.arrayBuffer());
      return `data:${contentType};base64,${buffer.toString("base64")}`;
    } catch (error) {
      lastError = error;
      if (POLLINATIONS_PROXY_FALLBACK) {
        return url;
      }
    }
  }

  throw lastError || new Error("Pollinations request failed");
};

const callGeminiImage = async (prompt) => {
  if (!GEMINI_IMAGE_ACCESS_TOKEN) {
    throw new Error("GEMINI_IMAGE_ACCESS_TOKEN is missing");
  }

  const endpoint =
    GEMINI_IMAGE_ENDPOINT ||
    (GEMINI_IMAGE_PROJECT
      ? `https://${GEMINI_IMAGE_LOCATION}-aiplatform.googleapis.com/v1/projects/${GEMINI_IMAGE_PROJECT}/locations/${GEMINI_IMAGE_LOCATION}/publishers/google/models/${GEMINI_IMAGE_MODEL}:generateContent`
      : "");

  if (!endpoint) {
    throw new Error("GEMINI image endpoint is not configured");
  }

  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GEMINI_IMAGE_ACCESS_TOKEN}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      data?.error?.message ||
      data?.error ||
      "Gemini image request failed";
    throw new Error(message);
  }

  const parts = data?.candidates?.[0]?.content?.parts || [];
  const imagePart =
    parts.find((p) => p?.inlineData?.data) ||
    parts.find((p) => p?.inline_data?.data) ||
    null;

  if (!imagePart) {
    throw new Error("Gemini returned no image");
  }

  const base64 =
    imagePart?.inlineData?.data || imagePart?.inline_data?.data;
  const mime =
    imagePart?.inlineData?.mimeType ||
    imagePart?.inline_data?.mime_type ||
    "image/png";

  return `data:${mime};base64,${base64}`;
};

const safeSaveCreation = async (payload) => {
  try {
    await saveCreation(payload);
  } catch (error) {
    if (ALLOW_DB_FAILURES) {
      console.error("SAVE CREATION ERROR:", error);
      return;
    }
    throw error;
  }
};

const getErrorMessage = (error) => {
  const responseData = error?.response?.data;
  if (responseData?.error?.message) return responseData.error.message;
  if (responseData?.message) return responseData.message;
  if (typeof responseData === "string") return responseData;
  return error?.message || "Request failed";
};

const resolveGeminiModel = async () => {
  if (GEMINI_MODEL_ENV) return GEMINI_MODEL_ENV;
  if (cachedGeminiModel) return cachedGeminiModel;

  const listUrl = `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models?key=${GEMINI_API_KEY}`;
  const listRes = await fetch(listUrl);
  const listData = await listRes.json().catch(() => ({}));

  const models = Array.isArray(listData?.models) ? listData.models : [];
  const available = models
    .filter((m) =>
      Array.isArray(m?.supportedGenerationMethods)
        ? m.supportedGenerationMethods.includes("generateContent")
        : false
    )
    .map((m) => (m?.name || "").replace(/^models\//, ""))
    .filter(Boolean);

  const flashModel = available.find((m) => m.includes("flash"));
  cachedGeminiModel = flashModel || available[0] || "gemini-2.0-flash";
  return cachedGeminiModel;
};

const callGemini = async (
  prompt,
  { maxOutputTokens, temperature = 0.7, topP = 0.9 } = {}
) => {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing");
  }

  const model = await resolveGeminiModel();
  const url = `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      maxOutputTokens,
      temperature,
      topP,
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message || "Gemini request failed";
    throw new Error(message);
  }

  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ||
    "";

  if (!text) {
    throw new Error("Gemini returned empty response");
  }

  return text;
};

/* ============================
   HUGGING FACE
============================ */
const hfClient = new InferenceClient(
  process.env.HUGGING_FACE_API_KEY || ""
);
const openai =
  process.env.OPENAI_API_KEY &&
  process.env.OPENAI_API_KEY !== "dummy_key_for_gemini"
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "for",
  "to",
  "of",
  "in",
  "on",
  "with",
  "about",
  "how",
  "is",
  "are",
  "was",
  "were",
  "be",
  "this",
  "that",
  "these",
  "those",
  "from",
  "by",
  "as",
]);

const extractKeywords = (topic) => {
  if (!topic) return [];
  const tokens =
    topic.toLowerCase().match(/[a-z0-9]+/g) || [];
  const filtered = tokens.filter(
    (t) => t.length > 3 && !STOP_WORDS.has(t)
  );
  return Array.from(new Set(filtered));
};

const uniqueTitles = (titles) => {
  const seen = new Set();
  const result = [];
  for (const t of titles) {
    const clean = String(t || "")
      .replace(/\s+/g, " ")
      .trim();
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(clean);
  }
  return result;
};

const buildFallbackTitles = (topic, category, count = 10) => {
  const base = topic || "AI";
  const cat = category || "General";
  const candidates = [
    `${base} Explained`,
    `Future of ${base}`,
    `${base} Trends`,
    `${base} Use Cases`,
    `${base} Myths`,
    `${base} for Beginners`,
    `${base} and ${cat}`,
    `Why ${base} Matters`,
    `Top ${base} Ideas`,
    `${base} Quick Guide`,
  ];
  return uniqueTitles(candidates).slice(0, count);
};

const parseTitles = (raw) => {
  if (!raw) return [];
  let text = String(raw).trim();

  if (text.startsWith("```")) {
    text = text.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
  }

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed
        .map((t) => String(t).trim())
        .filter(Boolean);
    }
  } catch {
    // fallback to line parsing
  }

  return text
    .split("\n")
    .map((line) =>
      line
        .replace(/^[-*•\d.)\s]+/, "")
        .replace(/^\[\s*\]\s*/, "")
        .trim()
    )
    .filter(Boolean);
};

/* ============================
   GENERATE ARTICLE
============================ */
export const generateArticle = async (req, res) => {
  try {
    console.log("REQ AUTH USER:", req.auth?.userId);
    console.log("PROMPT:", req.body.prompt);
    console.log("LENGTH:", req.body.length);
    console.log(
      "GEMINI KEY EXISTS:",
      !!process.env.GEMINI_API_KEY
    );

    const { prompt, length } = req.body;

    if (!req.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!prompt || !length) {
      return res
        .status(400)
        .json({ success: false, message: "Prompt or length missing" });
    }

    if (!enforceFreeUsage(req, res)) return;

    const maxOutputTokens = Math.round(length * 1.5);
    const content = await callGemini(prompt, { maxOutputTokens });

    await safeSaveCreation({
      userId: req.userId,
      prompt,
      content,
      type: "article",
      publish: false,
    });

    await incrementFreeUsage(req);

    res.json({
      success: true,
      content,
    });
  } catch (error) {
    console.error("ARTICLE ERROR:", error?.response?.data || error);
    res.status(500).json({
      success: false,
      message: getErrorMessage(error),
    });
  }
};

/* ============================
   GENERATE BLOG TITLE
============================ */
export const generateBlogTitle = async (req, res) => {
  try {
    const { prompt, keyword, category } = req.body;

    if (!req.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const topic = (keyword || "").trim() || (prompt || "").trim();
    if (!topic) {
      return res
        .status(400)
        .json({ success: false, message: "Prompt missing" });
    }

    if (!enforceFreeUsage(req, res)) return;

    const desiredCount = 10;
    const keywords = extractKeywords(topic);
    const requiredWords = keywords.slice(0, 3);
    const requirement =
      requiredWords.length > 0
        ? `Each title must include at least one of these words: ${requiredWords.join(
            ", "
          )}.`
        : "Each title must clearly reference the topic.";

    const basePrompt = [
      `You are a blog title generator.`,
      `Topic: "${topic}".`,
      `Category: "${category || "General"}".`,
      `Generate exactly ${desiredCount} original blog titles.`,
      `Keep each title under 6 words.`,
      `Do not use existing book/movie titles.`,
      requirement,
      `Return ONLY a JSON array of strings. No extra text.`,
    ].join(" ");

    let content = await callGemini(basePrompt, { maxOutputTokens: 300 });
    let titles = uniqueTitles(parseTitles(content));

    if (requiredWords.length > 0) {
      titles = titles.filter((t) =>
        requiredWords.some((w) => t.toLowerCase().includes(w))
      );
    }

    if (titles.length < desiredCount) {
      const retryPrompt = [
        `Your last response did not follow the rules.`,
        `Return ONLY a JSON array of exactly ${desiredCount} unique titles.`,
        requirement,
        `No extra text.`,
      ].join(" ");
      const retry = await callGemini(retryPrompt, { maxOutputTokens: 300 });
      titles = uniqueTitles(parseTitles(retry));
      if (requiredWords.length > 0) {
        titles = titles.filter((t) =>
          requiredWords.some((w) => t.toLowerCase().includes(w))
        );
      }
      content = retry;
    }

    if (titles.length < desiredCount) {
      titles = uniqueTitles([
        ...titles,
        ...buildFallbackTitles(topic, category, desiredCount),
      ]);
    }

    if (titles.length > 0) {
      content = titles
        .slice(0, desiredCount)
        .map((t) => `- ${t}`)
        .join("\n");
    }

    await safeSaveCreation({
      userId: req.userId,
      prompt: topic,
      content,
      type: "blog-title",
      publish: false,
    });

    await incrementFreeUsage(req);

    res.json({
      success: true,
      content,
    });
  } catch (error) {
    console.error("BLOG TITLE ERROR:", error?.response?.data || error);
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};

/* ============================
   GENERATE IMAGE
============================ */
export const generateImage = async (req, res) => {
  try {
    const { prompt, publish } = req.body;

    if (!req.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!prompt) {
      return res
        .status(400)
        .json({ success: false, message: "Prompt missing" });
    }

    if (!enforceFreeUsage(req, res)) return;

    const publishAllowed = req.plan === "premium" && !!publish;

    if (IMAGE_PROVIDER === "pollinations") {
      const content = await callPollinationsImage(prompt);
      await safeSaveCreation({
        userId: req.userId,
        prompt,
        content,
        type: "image",
        publish: publishAllowed,
      });
      await incrementFreeUsage(req);
      return res.json({ success: true, content });
    }

    if (LOCAL_SD_ENABLED || IMAGE_PROVIDER === "local") {
      const content = await callLocalStableDiffusion(prompt);
      await safeSaveCreation({
        userId: req.userId,
        prompt,
        content,
        type: "image",
        publish: publishAllowed,
      });
      await incrementFreeUsage(req);
      return res.json({ success: true, content });
    }

    if (IMAGE_PROVIDER === "gemini") {
      const content = await callGeminiImage(prompt);
      await safeSaveCreation({
        userId: req.userId,
        prompt,
        content,
        type: "image",
        publish: publishAllowed,
      });
      await incrementFreeUsage(req);
      return res.json({ success: true, content });
    }

    if (IMAGE_PROVIDER === "openai") {
      const content = await callOpenAIImage(prompt);
      await safeSaveCreation({
        userId: req.userId,
        prompt,
        content,
        type: "image",
        publish: publishAllowed,
      });
      await incrementFreeUsage(req);
      return res.json({ success: true, content });
    }

    if (!assertEnv("HUGGING_FACE_API_KEY", res, "HUGGING_FACE_API_KEY")) {
      return;
    }

    const imageRequest = {
      model: HF_IMAGE_MODEL,
      inputs: prompt,
    };
    if (HF_IMAGE_PROVIDER) imageRequest.provider = HF_IMAGE_PROVIDER;

    const imageResponse = await hfClient.textToImage(imageRequest);

    const buffer = Buffer.from(await imageResponse.arrayBuffer());

    const upload = cloudinary.uploader.upload_stream(
      { resource_type: "image" },
      async (error, result) => {
        if (error) {
          console.error("IMAGE UPLOAD ERROR:", error);
          return res.status(500).json({
            success: false,
            message: error.message || "Image upload failed",
          });
        }
        try {
          const content = result.secure_url;
          await safeSaveCreation({
            userId: req.userId,
            prompt,
            content,
            type: "image",
            publish: publishAllowed,
          });
          await incrementFreeUsage(req);
          res.json({ success: true, content });
        } catch (err) {
          console.error("IMAGE SAVE ERROR:", err);
          res.status(500).json({
            success: false,
            message: err.message || "Image save failed",
          });
        }
      }
    );

    upload.end(buffer);
  } catch (error) {
    console.error("IMAGE ERROR:", error?.response?.data || error);
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};

/* ============================
   REMOVE IMAGE BACKGROUND
============================ */
export const removeImageBackground = async (req, res) => {
  try {
    const image = req.file;

    if (!req.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!image) {
      return res
        .status(400)
        .json({ success: false, message: "Image missing" });
    }

    if (isHeicFile(image)) {
      return res.status(400).json({
        success: false,
        message: "HEIC files are not supported. Please upload JPG or PNG.",
      });
    }

    if (
      !assertEnv("CLOUDINARY_CLOUD_NAME", res, "CLOUDINARY_CLOUD_NAME") ||
      !assertEnv("CLOUDINARY_API_KEY", res, "CLOUDINARY_API_KEY") ||
      !assertEnv("CLOUDINARY_API_SECRET", res, "CLOUDINARY_API_SECRET")
    ) {
      return;
    }

    if (!enforceFreeUsage(req, res)) return;

    const result = await cloudinary.uploader.upload(image.path, {
      transformation: [{ effect: "background_removal" }],
    });

    const content = result.secure_url;

    await safeSaveCreation({
      userId: req.userId,
      prompt: `Remove background: ${image.originalname || "image"}`,
      content,
      type: "background-removal",
      publish: false,
    });

    await incrementFreeUsage(req);

    res.json({ success: true, content: result.secure_url });
  } catch (error) {
    console.error("BG REMOVE ERROR:", error?.response?.data || error);
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};

/* ============================
   REMOVE IMAGE OBJECT
============================ */
export const removeImageObject = async (req, res) => {
  try {
    const { object } = req.body;
    const image = req.file;

    if (!req.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!image || !object) {
      return res.status(400).json({
        success: false,
        message: "Image or object missing",
      });
    }

    if (isHeicFile(image)) {
      return res.status(400).json({
        success: false,
        message: "HEIC files are not supported. Please upload JPG or PNG.",
      });
    }

    if (
      !assertEnv("CLOUDINARY_CLOUD_NAME", res, "CLOUDINARY_CLOUD_NAME") ||
      !assertEnv("CLOUDINARY_API_KEY", res, "CLOUDINARY_API_KEY") ||
      !assertEnv("CLOUDINARY_API_SECRET", res, "CLOUDINARY_API_SECRET")
    ) {
      return;
    }

    if (!enforceFreeUsage(req, res)) return;

    const upload = await cloudinary.uploader.upload(image.path);

    const imageUrl = cloudinary.url(upload.public_id, {
      transformation: [{ effect: `gen_remove:${object}` }],
    });

    await safeSaveCreation({
      userId: req.userId,
      prompt: `Remove ${object} from ${image.originalname || "image"}`,
      content: imageUrl,
      type: "object-removal",
      publish: false,
    });

    await incrementFreeUsage(req);

    res.json({ success: true, content: imageUrl });
  } catch (error) {
    console.error("OBJECT REMOVE ERROR:", error?.response?.data || error);
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};

/* ============================
   REVIEW RESUME
============================ */
export const reviewResume = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Resume missing" });
    }

    if (!enforceFreeUsage(req, res)) return;

    const buffer = fs.readFileSync(req.file.path);
    const pdfData = await pdf(buffer);

    const content = await callGemini(
      `Review this resume and give feedback:\n${pdfData.text}`,
      { maxOutputTokens: 900 }
    );

    await safeSaveCreation({
      userId: req.userId,
      prompt: `Review resume: ${req.file?.originalname || "resume"}`,
      content,
      type: "resume-review",
      publish: false,
    });

    await incrementFreeUsage(req);

    res.json({
      success: true,
      content,
    });
  } catch (error) {
    console.error("RESUME ERROR:", error?.response?.data || error);
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};
