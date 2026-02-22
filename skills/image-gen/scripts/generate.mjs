#!/usr/bin/env node

/**
 * Image generation script using the Gemini REST API.
 * Zero external dependencies — uses Node.js built-in fetch (18+).
 *
 * Usage:
 *   node generate.mjs --prompt "a red fox" --model "gemini-2.0-flash-exp-image-generation" \
 *     --size "2K" --aspect-ratio "16:9" --output "./fox.png"
 *
 * For image editing:
 *   node generate.mjs --prompt "make the sky dramatic" --model "gemini-2.0-flash-exp-image-generation" \
 *     --size "2K" --aspect-ratio "16:9" --input-image "./photo.png" --output "./photo-edited.png"
 */

import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";

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
// Load .env file (zero-dep parser)
// ---------------------------------------------------------------------------
function loadEnv() {
  const paths = [
    join(process.cwd(), ".env"),
    join(process.env.HOME || "", ".env"),
  ];

  for (const envPath of paths) {
    if (existsSync(envPath)) {
      const content = readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIndex = trimmed.indexOf("=");
        if (eqIndex === -1) continue;
        const key = trimmed.slice(0, eqIndex).trim();
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
      return;
    }
  }
}

loadEnv();

const args = parseArgs(process.argv);

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

if (!args.prompt) {
  console.error("Error: --prompt is required.");
  process.exit(1);
}

const model = args.model || "gemini-2.0-flash-exp-image-generation";
const size = args.size || "2K";
const aspectRatio = args["aspect-ratio"] || "16:9";
const outputPath = resolve(args.output || "./generated-image.png");
const inputImagePath = args["input-image"] ? resolve(args["input-image"]) : null;

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

    // Detect MIME type from extension
    const ext = inputImagePath.split(".").pop().toLowerCase();
    const mimeMap = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      webp: "image/webp",
      gif: "image/gif",
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

  return {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: {
        aspectRatio,
        imageSize: sizeToLabel(size),
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Call the Gemini API
// ---------------------------------------------------------------------------
async function generate() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

  const payload = buildPayload(args.prompt, inputImagePath, size, aspectRatio);

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
