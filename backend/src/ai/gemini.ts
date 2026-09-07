// src/ai/gemini.ts — Reusable Gemini service (LLM-agnostic interface)
// Wraps the @google/generative-ai SDK. Swap this file to switch LLMs.

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { GenerativeModel, GenerateContentResult } from "@google/generative-ai";

// ─── Env validation ────────────────────────────────────────────
const GEMINI_API_KEY = process.env["GEMINI_API_KEY"];
if (!GEMINI_API_KEY) {
  console.warn(
    "⚠️  GEMINI_API_KEY is not set — AI features will be disabled.\n" +
    "   Get a key at https://aistudio.google.com/apikey and add it to backend/.env"
  );
}

// ─── Client singleton ──────────────────────────────────────────
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

const MODEL_NAME = "gemini-2.0-flash";

function getModel(systemInstruction?: string): GenerativeModel {
  if (!genAI) {
    throw new Error("Gemini AI is not configured. Set GEMINI_API_KEY in .env");
  }
  return genAI.getGenerativeModel({
    model: MODEL_NAME,
    ...(systemInstruction ? { systemInstruction } : {}),
  });
}

// ─── Public API ────────────────────────────────────────────────

export interface GeminiMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

/**
 * Generate a text response from Gemini.
 */
export async function generateText(
  prompt: string,
  systemInstruction?: string,
  history?: GeminiMessage[],
): Promise<string> {
  const model = getModel(systemInstruction);

  if (history && history.length > 0) {
    const chat = model.startChat({ history });
    const result: GenerateContentResult = await chat.sendMessage(prompt);
    return result.response.text();
  }

  const result: GenerateContentResult = await model.generateContent(prompt);
  return result.response.text();
}

/**
 * Generate a structured JSON response from Gemini.
 * Parses the response as JSON — throws if Gemini returns invalid JSON.
 */
export async function generateStructured<T = unknown>(
  prompt: string,
  systemInstruction: string,
  history?: GeminiMessage[],
): Promise<T> {
  const raw = await generateText(prompt, systemInstruction, history);

  // Gemini sometimes wraps JSON in markdown code fences — strip them
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(
      `Gemini returned invalid JSON.\nRaw response:\n${raw.slice(0, 500)}`
    );
  }
}

/**
 * Check if Gemini is available (API key configured).
 */
export function isGeminiAvailable(): boolean {
  return !!genAI;
}
