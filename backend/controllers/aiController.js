import Groq from "groq-sdk";
import insforge from "../config/insforge.js";
import { logger } from "../utils/logger.js";

// ── Groq client initialisation ──────────────────────────────────────────────
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Safely generate content via Groq.
 * Returns { ok: true, text } or { ok: false, error }.
 */
const generate = async (systemPrompt, userPrompt) => {
  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY.startsWith("your_")) {
    return { ok: false, error: "GROQ_API_KEY is not configured." };
  }
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    });
    const reply = completion.choices[0].message.content;
    return { ok: true, text: reply };
  } catch (err) {
    logger.error("[AI] Groq API error:", err?.message || err);
    return { ok: false, error: err?.message || "Groq request failed." };
  }
};

import { listFoodItems } from "../services/foodService.js";

const fetchRealFoodItems = async () => {
  let foodItems;
  let error = null;
  try {
    const allFoods = await listFoodItems();
    foodItems = allFoods.filter(f => f.isAvailable !== false);
  } catch (err) {
    error = err;
    foodItems = null;
  }

  logger.info('AI food fetch result:', { count: foodItems?.length, error });

  if (error || !foodItems || foodItems.length === 0) {
    logger.error('Food fetch failed for AI:', error);
    return null;
  }

  return foodItems;
};

const getFoodContextString = async () => {
  const foodItems = await fetchRealFoodItems();
  if (!foodItems) return null;

  const foodContext = foodItems.map(f => 
    `ID:${f.id} | ${f.name} | ₹${f.price} | ${f.calorie || 'N/A'} cal | ${f.category} | ${f.description}`
  ).join('\n');
  
  return `You are BiteBlitz AI assistant. ONLY suggest food items from this list — never invent items:\n${foodContext}\n\nIf no items match the user's request, say "Sorry, we don't have that currently" instead of making up dishes.\nAlways use ₹ (Indian Rupee) symbol for all prices, never use £ or $ or any other currency.`;
};

const fetchOrderById = async (orderId) => {
  const { data } = await insforge.database
    .from("orders")
    .select("id, items, amount, status, address, date, user_id")
    .eq("id", orderId)
    .maybeSingle();
  return data;
};

const fetchUserOrders = async (userId, limit = 10) => {
  const { data } = await insforge.database
    .from("orders")
    .select("id, items, amount, status, date")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(limit);
  return data || [];
};

const fetchFeedback = async () => {
  const { data } = await insforge.database
    .from("orders")
    .select("feedback_rating, feedback_comment")
    .not("feedback_rating", "is", null)
    .limit(200);
  return data || [];
};

// ── FEATURE 1 — Food Chatbot (/api/ai/chat) ───────────────────────────────────

export const chat = async (req, res) => {
  try {
    const message = String(req.body.message || "").trim();
    if (!message) return res.json({ success: false, message: "Message is required." });

    const foodInjection = await getFoodContextString();
    if (!foodInjection) {
      return res.json({ success: false, message: "Menu temporarily unavailable. Please try again." });
    }

    const systemPrompt = `
${foodInjection}

You are a friendly food ordering assistant for the BiteBlitz food delivery platform.
Help users pick food items from the menu. Be concise, warm, and helpful.
When a user asks for budget-based suggestions, suggest fitting items with prices in ₹.

Reply in 2-4 sentences max. List item names and prices if recommending.`.trim();

    const userPrompt = `User says: "${message}"`;

    const { ok, text, error } = await generate(systemPrompt, userPrompt);
    if (!ok) return res.json({ success: false, message: error });

    logger.info(`[AI] chat — user message: "${message.slice(0, 60)}"`);
    return res.json({ success: true, reply: text });
  } catch (err) {
    logger.error("[AI] chat error:", err);
    return res.json({ success: false, message: "AI food assistant is unavailable right now." });
  }
};

// ── FEATURE 2 — Smart Food Search (/api/ai/search) ───────────────────────────

export const search = async (req, res) => {
  try {
    const query = String(req.body.query || "").trim();
    if (!query) return res.json({ success: false, message: "Query is required." });

    const foodInjection = await getFoodContextString();
    if (!foodInjection) {
      return res.json({ success: false, message: "Menu temporarily unavailable. Please try again." });
    }
    const foods = await fetchRealFoodItems();

    const systemPrompt = `
${foodInjection}

You are a food search assistant for BiteBlitz.
Given the user's natural language search query, return a JSON array of matching food item IDs from the menu.
Only return IDs of items that match. If nothing matches, return an empty array.
IMPORTANT: Return ONLY a raw JSON array like ["id1","id2"] with no markdown, no explanation.`.trim();

    const userPrompt = `User query: "${query}"`;

    const { ok, text, error } = await generate(systemPrompt, userPrompt);
    if (!ok) return res.json({ success: false, message: error });

    let ids = [];
    try {
      const cleaned = text.replace(/```json?/gi, "").replace(/```/g, "").trim();
      ids = JSON.parse(cleaned);
      if (!Array.isArray(ids)) ids = [];
    } catch {
      ids = [];
    }

    const matched = foods.filter((f) => ids.includes(f.id));
    logger.info(`[AI] search — query: "${query}" → ${matched.length} results`);
    return res.json({ success: true, data: matched, ids });
  } catch (err) {
    logger.error("[AI] search error:", err);
    return res.json({ success: false, message: "AI search is unavailable right now." });
  }
};

// ── FEATURE 3 — Order Summary (/api/ai/order-summary/:orderId) ────────────────

export const orderSummary = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await fetchOrderById(orderId);
    if (!order) return res.json({ success: false, message: "Order not found." });

    const items = (order.items || [])
      .map((i) => `${i.quantity}× ${i.name}`)
      .join(", ");

    const time = new Date(order.date).toLocaleTimeString("en-IN", {
      hour: "2-digit", minute: "2-digit",
    });
    const address = order.address?.street || order.address?.city || "your address";

    const foodInjection = await getFoodContextString();
    if (!foodInjection) {
      return res.json({ success: false, message: "Menu temporarily unavailable. Please try again." });
    }

    const systemPrompt = `
${foodInjection}

You are a helpful assistant.
Generate a single warm, friendly sentence (max 2 sentences) summarising this food delivery order for the customer.
Include the items ordered, total cost, delivery address, and time. Be casual and fun like a food app notification.`.trim();

    const userPrompt = `
Order details:
- Items: ${items}
- Total: ₹${order.amount}
- Status: ${order.status}
- Address: ${address}
- Time: ${time}`.trim();

    const { ok, text, error } = await generate(systemPrompt, userPrompt);
    if (!ok) return res.json({ success: false, message: error });

    logger.info(`[AI] orderSummary — orderId: ${orderId}`);
    return res.json({ success: true, data: { summary: text.trim() } });
  } catch (err) {
    logger.error("[AI] orderSummary error:", err);
    return res.json({ success: false, message: "Could not generate order summary." });
  }
};

// ── FEATURE 4 — Sentiment Report (/api/ai/sentiment-report) ──────────────────

export const sentimentReport = async (req, res) => {
  try {
    const feedbacks = await fetchFeedback();
    if (!feedbacks.length) {
      return res.json({
        success: true,
        data: {
          overall: "No Data",
          praisePoints: [],
          complaints: [],
          summary: "No customer feedback has been submitted yet.",
        },
      });
    }

    const feedbackText = feedbacks
      .map((f) => `Rating: ${f.feedback_rating}/5 | Comment: "${f.feedback_comment || "(no comment)"}"`)
      .join("\n");

    const foodInjection = await getFoodContextString();
    if (!foodInjection) {
      return res.json({ success: false, message: "Menu temporarily unavailable. Please try again." });
    }

    const systemPrompt = `
${foodInjection}

You are a business intelligence analyst for BiteBlitz, a food delivery platform.
Analyse the following customer feedback and return a JSON object with this EXACT structure (no markdown, raw JSON):
{
  "overall": "Positive" | "Neutral" | "Negative",
  "praisePoints": ["point1", "point2", "point3"],
  "complaints": ["complaint1", "complaint2"],
  "summary": "A 2-line summary of the overall customer sentiment and key takeaway."
}`.trim();

    const userPrompt = `
Customer feedback data:
${feedbackText}`.trim();

    const { ok, text, error } = await generate(systemPrompt, userPrompt);
    if (!ok) return res.json({ success: false, message: error });

    let data;
    try {
      const cleaned = text.replace(/```json?/gi, "").replace(/```/g, "").trim();
      data = JSON.parse(cleaned);
    } catch {
      data = {
        overall: "Neutral",
        praisePoints: [],
        complaints: [],
        summary: text.trim(),
      };
    }

    logger.info(`[AI] sentimentReport — analysed ${feedbacks.length} feedbacks`);
    return res.json({ success: true, data });
  } catch (err) {
    logger.error("[AI] sentimentReport error:", err);
    return res.json({ success: false, message: "Could not generate sentiment report." });
  }
};

// ── FEATURE 5 — Meal Recommender (/api/ai/recommend/:userId) ─────────────────

export const recommend = async (req, res) => {
  try {
    const { userId } = req.params;
    const pastOrders = await fetchUserOrders(userId, 10);
    const allFood = await fetchRealFoodItems();

    if (!allFood.length) return res.json({ success: true, data: [] });

    // Flatten past item names for context
    const pastItems = pastOrders
      .flatMap((o) => (o.items || []).map((i) => i.name))
      .slice(0, 40);

    const foodInjection = await getFoodContextString();
    if (!foodInjection) {
      return res.json({ success: false, message: "Menu temporarily unavailable. Please try again." });
    }

    const systemPrompt = `
${foodInjection}

You are a personalised meal recommendation engine for BiteBlitz food delivery.
Based on the customer's order history, recommend exactly 3 food items from the available menu.
Return ONLY a raw JSON array (no markdown) with this structure:
[
  { "foodId": "<id>", "name": "<name>", "reason": "<1 sentence reason>" },
  { "foodId": "<id>", "name": "<name>", "reason": "<1 sentence reason>" },
  { "foodId": "<id>", "name": "<name>", "reason": "<1 sentence reason>" }
]`.trim();

    const userPrompt = `Customer's past ordered items: ${JSON.stringify(pastItems)}`;

    const { ok, text, error } = await generate(systemPrompt, userPrompt);
    if (!ok) return res.json({ success: false, message: error });

    let recs = [];
    try {
      const cleaned = text.replace(/```json?/gi, "").replace(/```/g, "").trim();
      recs = JSON.parse(cleaned);
      if (!Array.isArray(recs)) recs = [];
    } catch {
      recs = [];
    }

    // Enrich with full food data
    const enriched = recs.slice(0, 3).map((r) => {
      const food = allFood.find((f) => f.id === r.foodId);
      return {
        foodId: r.foodId,
        name: food?.name || r.name,
        price: food?.price,
        image: food?.image,
        category: food?.category,
        reason: r.reason,
      };
    });

    logger.info(`[AI] recommend — userId: ${userId}, recs: ${enriched.length}`);
    return res.json({ success: true, data: enriched });
  } catch (err) {
    logger.error("[AI] recommend error:", err);
    return res.json({ success: false, message: "Could not generate recommendations." });
  }
};

// ── FEATURE 6 — Customer Support Bot (/api/ai/support) ───────────────────────

export const support = async (req, res) => {
  try {
    const message = String(req.body.message || "").trim();
    const userId = req.body.userId;
    if (!message) return res.json({ success: false, message: "Message is required." });

    // Fetch recent orders for context
    let ordersContext = "No recent orders found.";
    if (userId) {
      const orders = await fetchUserOrders(userId, 5);
      if (orders.length) {
        ordersContext = orders
          .map((o) => `Order #${o.id.slice(-8).toUpperCase()}: ${o.status} | ₹${o.amount} | ${new Date(o.date).toLocaleDateString("en-IN")}`)
          .join("\n");
      }
    }

    const foodInjection = await getFoodContextString();
    if (!foodInjection) {
      return res.json({ success: false, message: "Menu temporarily unavailable. Please try again." });
    }

    const systemPrompt = `
${foodInjection}

You are BiteBlitz Support Agent, a helpful customer support assistant for the BiteBlitz food delivery app.
Answer customer questions about their orders, delivery status, refunds, and cancellations.

BiteBlitz policies:
- Cancellations: Only allowed when order is in "Food Processing" status
- Refunds: Automatic via Stripe for cancelled online-paid orders; COD orders are not refunded
- Estimated delivery time: ~45 minutes from order placement
- Contact: support@biteblitz.com

Customer's recent orders:
${ordersContext}

Reply helpfully and concisely in 2-3 sentences. Be friendly and empathetic.`.trim();

    const userPrompt = `Customer asks: "${message}"`;

    const { ok, text, error } = await generate(systemPrompt, userPrompt);
    if (!ok) return res.json({ success: false, message: error });

    logger.info(`[AI] support — userId: ${userId}, message: "${message.slice(0, 60)}"`);
    return res.json({ success: true, reply: text });
  } catch (err) {
    logger.error("[AI] support error:", err);
    return res.json({ success: false, message: "Support assistant is unavailable right now. Please contact support@biteblitz.com" });
  }
};
