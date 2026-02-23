#!/usr/bin/env node

/**
 * Image generation script using the Gemini REST API.
 * Zero external dependencies — uses Node.js built-in fetch (18+).
 *
 * Usage:
 *   node generate.mjs --prompt-file ./prompt.txt --model "gemini-2.0-flash-exp-image-generation" \
 *     --size "2K" --aspect-ratio "16:9" --output "./fox.png"
 *
 * For image editing:
 *   node generate.mjs --prompt-file ./prompt.txt --model "gemini-2.0-flash-exp-image-generation" \
 *     --size "2K" --aspect-ratio "16:9" --input-image "./photo.png" --output "./photo-edited.png"
 */

import { writeFileSync, readFileSync, existsSync, unlinkSync, openSync, readSync, closeSync } from "node:fs";
import { resolve, join, extname } from "node:path";

// ---------------------------------------------------------------------------
// Argument parsing (no deps)
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      const next = argv[i + 1];
      args[key] = next && !next.startsWith("--") ? next : true;
      if (args[key] !== true) i++;
    }
  }
  return args;
}

// ---------------------------------------------------------------------------
// Load .env file from project root only (zero-dep parser)
// ---------------------------------------------------------------------------
function loadEnv() {
  const envPath = join(process.cwd(), ".env");
  if (!existsSync(envPath)) return;

  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    // Only load GEMINI_API_KEY — don't read other variables
    if (key !== "GEMINI_API_KEY") continue;
    let value = trimmed.slice(eqIndex + 1).trim();
    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

// ---------------------------------------------------------------------------
// Validate input image is an actual image file
// ---------------------------------------------------------------------------
const ALLOWED_IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);
const IMAGE_MAGIC_BYTES = [
  { ext: ".png",  bytes: [0x89, 0x50, 0x4e, 0x47] },
  { ext: ".jpg",  bytes: [0xff, 0xd8, 0xff] },
  { ext: ".jpeg", bytes: [0xff, 0xd8, 0xff] },
  { ext: ".webp", bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF
  { ext: ".gif",  bytes: [0x47, 0x49, 0x46] },        // GIF
];

function validateImageFile(filePath) {
  const ext = extname(filePath).toLowerCase();
  if (!ALLOWED_IMAGE_EXTENSIONS.has(ext)) {
    console.error(
      `Error: --input-image must be an image file (${[...ALLOWED_IMAGE_EXTENSIONS].join(", ")}). Got: ${ext || "no extension"}`
    );
    process.exit(1);
  }

  if (!existsSync(filePath)) {
    console.error(`Error: Input image not found: ${filePath}`);
    process.exit(1);
  }

  // Check magic bytes to confirm it's actually an image
  const buffer = Buffer.alloc(8);
  const fd = openSync(filePath, "r");
  readSync(fd, buffer, 0, 8, 0);
  closeSync(fd);

  const matchesAny = IMAGE_MAGIC_BYTES.some((sig) =>
    sig.bytes.every((b, i) => buffer[i] === b)
  );

  if (!matchesAny) {
    console.error("Error: --input-image does not appear to be a valid image file (magic bytes mismatch).");
    process.exit(1);
  }
}

loadEnv();

const args = parseArgs(process.argv);

// ---------------------------------------------------------------------------
// Read prompt from file (avoids shell injection)
// ---------------------------------------------------------------------------
const promptFile = args["prompt-file"];
if (!promptFile) {
  console.error("Error: --prompt-file is required (path to a text file containing the prompt).");
  process.exit(1);
}

const promptFilePath = resolve(promptFile);
if (!existsSync(promptFilePath)) {
  console.error(`Error: Prompt file not found: ${promptFilePath}`);
  process.exit(1);
}

const prompt = readFileSync(promptFilePath, "utf-8").trim();
if (!prompt) {
  console.error("Error: Prompt file is empty.");
  process.exit(1);
}

// Clean up the temp prompt file after reading
try { unlinkSync(promptFilePath); } catch {}

// ---------------------------------------------------------------------------
// Validate required inputs
// ---------------------------------------------------------------------------
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error(
    "Error: GEMINI_API_KEY not found.\n" +
      "Add it to a .env file in your project root:\n\n" +
      "  GEMINI_API_KEY=your-key-here\n\n" +
      "Get a free key at https://aistudio.google.com/apikey"
  );
  process.exit(1);
}

const model = args.model || "gemini-2.0-flash-exp-image-generation";
const size = args.size || "2K";
const aspectRatio = args["aspect-ratio"] || "16:9";
const outputPath = resolve(args.output || "./generated-image.png");
const inputImagePath = args["input-image"] ? resolve(args["input-image"]) : null;

// Validate input image if provided
if (inputImagePath) {
  validateImageFile(inputImagePath);
}

// ---------------------------------------------------------------------------
// Map size labels to API values
// ---------------------------------------------------------------------------
function sizeToLabel(size) {
  const s = String(size).toUpperCase();
  if (s === "1K" || s === "1024") return "1K";
  if (s === "2K" || s === "2048") return "2K";
  if (s === "4K" || s === "4096") return "4K";
  return "2K";
}

// ---------------------------------------------------------------------------
// Build the request payload
// ---------------------------------------------------------------------------
function buildPayload(prompt, inputImagePath, size, aspectRatio) {
  const parts = [];

  // If editing an existing image, include it as the first part
  if (inputImagePath) {
    const imageBuffer = readFileSync(inputImagePath);
    const base64Data = imageBuffer.toString("base64");

    const ext = extname(inputImagePath).toLowerCase();
    const mimeMap = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".webp": "image/webp",
      ".gif": "image/gif",
    };
    const mimeType = mimeMap[ext] || "image/png";

    parts.push({
      inlineData: {
        mimeType,
        data: base64Data,
      },
    });
  }

  // Add the text prompt
  parts.push({ text: prompt });

  const config = {
    responseModalities: ["TEXT", "IMAGE"],
  };

  // imageConfig is only supported on newer models, not gemini-2.0-flash-exp
  const supportsImageConfig = !model.includes("gemini-2.0-flash-exp");
  if (supportsImageConfig) {
    config.imageConfig = {
      aspectRatio,
      imageSize: sizeToLabel(size),
    };
  }

  return {
    contents: [{ parts }],
    generationConfig: config,
  };
}

// ---------------------------------------------------------------------------
// Call the Gemini API
// ---------------------------------------------------------------------------
async function generate() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

  const payload = buildPayload(prompt, inputImagePath, size, aspectRatio);

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error(`Error: Network request failed — ${err.message}`);
    process.exit(1);
  }

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`Error: API returned ${response.status}`);
    console.error(errorBody);
    process.exit(1);
  }

  const data = await response.json();

  // Extract the image from the response
  const candidates = data.candidates;
  if (!candidates || candidates.length === 0) {
    console.error("Error: No candidates returned from API.");
    if (data.promptFeedback) {
      console.error("Prompt feedback:", JSON.stringify(data.promptFeedback, null, 2));
    }
    process.exit(1);
  }

  const parts = candidates[0].content?.parts;
  if (!parts || parts.length === 0) {
    console.error("Error: Response contained no parts.");
    process.exit(1);
  }

  // Find the image part (inlineData with image MIME type)
  const imagePart = parts.find(
    (p) => p.inlineData && p.inlineData.mimeType?.startsWith("image/")
  );

  if (!imagePart) {
    // Sometimes the model returns only text (e.g., refusal)
    const textPart = parts.find((p) => p.text);
    if (textPart) {
      console.error(`Error: Model returned text instead of an image:\n${textPart.text}`);
    } else {
      console.error("Error: No image data found in the response.");
    }
    process.exit(1);
  }

  // Decode and save
  const imageBuffer = Buffer.from(imagePart.inlineData.data, "base64");
  writeFileSync(outputPath, imageBuffer);
  console.log(outputPath);
}

generate();
