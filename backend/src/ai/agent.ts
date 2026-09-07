// src/ai/agent.ts — AI Agent orchestration layer
// Takes a user message, uses Gemini to determine intent, calls tools, returns response.

import { generateStructured, generateText, isGeminiAvailable } from "./gemini";
import type { GeminiMessage } from "./gemini";
import {
  AGENT_SYSTEM_PROMPT,
  COMPARISON_SYSTEM_PROMPT,
  LISTING_GENERATION_PROMPT,
} from "./prompts";
import type { AgentDecision } from "./prompts";
import {
  searchProducts,
  getProductDetails,
  compareProducts,
  findProductsByBudget,
  getSimilarProducts,
} from "./tools";
import type { ProductResult } from "./tools";

// ─── Types ─────────────────────────────────────────────────────

export interface AgentResponse {
  message: string;
  products?: ProductResult[];
  comparison?: {
    product1: ProductResult;
    product2: ProductResult;
    analysis: string;
  };
}

export interface ListingGenerationResult {
  title: string;
  description: string;
  category: string;
  tags: string[];
}

// ─── In-memory chat history (per-user, last 10 messages) ──────

const chatHistories = new Map<string, GeminiMessage[]>();

const MAX_HISTORY = 10;

function getUserHistory(userId: string): GeminiMessage[] {
  return chatHistories.get(userId) ?? [];
}

function appendHistory(userId: string, role: "user" | "model", text: string): void {
  const history = getUserHistory(userId);
  history.push({ role, parts: [{ text }] });

  // Keep only last N messages
  if (history.length > MAX_HISTORY) {
    history.splice(0, history.length - MAX_HISTORY);
  }

  chatHistories.set(userId, history);
}

// ─── Rate limiting (simple per-user counter) ──────────────────

const rateLimits = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 15; // 15 requests per minute

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  let entry = rateLimits.get(userId);

  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
    rateLimits.set(userId, entry);
  }

  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

// ─── Main agent function ───────────────────────────────────────

export async function handleChatMessage(
  userId: string,
  message: string,
): Promise<AgentResponse> {
  // Guard: Gemini available?
  if (!isGeminiAvailable()) {
    return {
      message: "AI features are currently unavailable. Please try again later.",
    };
  }

  // Guard: Rate limit
  if (!checkRateLimit(userId)) {
    return {
      message: "You're sending messages too fast! Please wait a moment and try again. 🙏",
    };
  }

  // Guard: Empty message
  const sanitized = message.trim().slice(0, 1000); // limit input length
  if (!sanitized) {
    return { message: "Please send a message so I can help you!" };
  }

  try {
    // Get chat history for context
    const history = getUserHistory(userId);

    // Ask Gemini to decide intent + tool call
    const decision = await generateStructured<AgentDecision>(
      sanitized,
      AGENT_SYSTEM_PROMPT,
      history,
    );

    // Validate the decision
    if (!decision || !decision.intent || !decision.response_text) {
      return { message: "I didn't quite understand that. Could you rephrase? 🤔" };
    }

    // Save user message to history
    appendHistory(userId, "user", sanitized);

    // Handle general chat (no tool call needed)
    if (decision.intent === "general_chat" || !decision.tool_call) {
      appendHistory(userId, "model", decision.response_text);
      return { message: decision.response_text };
    }

    // Execute the requested tool
    const { tool, params } = decision.tool_call;
    let products: ProductResult[] | undefined;
    let comparison: AgentResponse["comparison"] | undefined;

    switch (tool) {
      case "searchProducts": {
        products = await searchProducts({
          q: params["q"] as string | undefined,
          category: params["category"] as string | undefined,
          type: params["type"] as "ONLINE" | "OFFLINE" | undefined,
          maxPrice: params["maxPrice"] as number | undefined,
          minPrice: params["minPrice"] as number | undefined,
          isFree: params["isFree"] as boolean | undefined,
        });
        break;
      }

      case "getProductDetails": {
        const product = await getProductDetails(params["productId"] as string);
        products = product ? [product] : [];
        break;
      }

      case "compareProducts": {
        const result = await compareProducts(
          params["productId1"] as string,
          params["productId2"] as string,
        );
        if (result) {
          // Generate comparison analysis with Gemini
          const comparisonPrompt = `Compare these two products:\n\nProduct 1:\n${JSON.stringify(result.product1, null, 2)}\n\nProduct 2:\n${JSON.stringify(result.product2, null, 2)}`;
          const analysis = await generateText(
            comparisonPrompt,
            COMPARISON_SYSTEM_PROMPT,
          );
          comparison = {
            product1: result.product1,
            product2: result.product2,
            analysis,
          };
        } else {
          return {
            message: "I couldn't find one or both of those products. Please check the product IDs and try again.",
          };
        }
        break;
      }

      case "findProductsByBudget": {
        products = await findProductsByBudget(
          params["maxPrice"] as number,
          params["category"] as string | undefined,
          params["type"] as "ONLINE" | "OFFLINE" | undefined,
        );
        break;
      }

      case "getSimilarProducts": {
        products = await getSimilarProducts(params["productId"] as string);
        break;
      }

      default:
        return { message: decision.response_text };
    }

    // Build response message
    let responseMessage = decision.response_text;

    if (products !== undefined && products.length === 0) {
      responseMessage += "\n\nI couldn't find any matching products right now. Try different filters or check back later!";
    } else if (products && products.length > 0) {
      responseMessage += `\n\nFound ${products.length} product${products.length === 1 ? "" : "s"} for you:`;
    }

    // Save AI response to history
    appendHistory(userId, "model", responseMessage);

    return {
      message: responseMessage,
      products,
      comparison,
    };
  } catch (error) {
    console.error("[AI Agent Error]", error);

    // Handle specific Gemini errors
    const errMsg = error instanceof Error ? error.message : String(error);

    if (errMsg.includes("429") || errMsg.includes("RATE_LIMIT")) {
      return {
        message: "Our AI is experiencing high demand. Please try again in a moment! ⏳",
      };
    }

    if (errMsg.includes("invalid JSON") || errMsg.includes("Gemini returned")) {
      return {
        message: "I had trouble processing that. Could you rephrase your question? 🤔",
      };
    }

    return {
      message: "Something went wrong on my end. Please try again! 🔧",
    };
  }
}

// ─── Listing generation function ───────────────────────────────

export async function generateListingContent(
  productName: string,
  condition: string,
  details: string,
): Promise<ListingGenerationResult> {
  if (!isGeminiAvailable()) {
    throw new Error("AI features are currently unavailable.");
  }

  const prompt = `Product name: ${productName}\nCondition: ${condition}\nDetails: ${details}`;

  const result = await generateStructured<ListingGenerationResult>(
    prompt,
    LISTING_GENERATION_PROMPT,
  );

  // Validate required fields
  if (!result.title || !result.description || !result.category) {
    throw new Error("AI generated incomplete listing data.");
  }

  // Sanitize: trim strings, limit lengths
  return {
    title: result.title.slice(0, 80).trim(),
    description: result.description.slice(0, 2000).trim(),
    category: result.category.trim(),
    tags: Array.isArray(result.tags)
      ? result.tags.slice(0, 5).map((t) => String(t).trim())
      : [],
  };
}
