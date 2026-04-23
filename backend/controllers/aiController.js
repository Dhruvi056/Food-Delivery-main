import insforge from "../config/insforge.js";
import { logger } from "../utils/logger.js";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

const getBudgetFromText = (text) => {
  const m = String(text || "").match(/(?:₹|rs\.?|inr)\s*([0-9]{2,6})|under\s*([0-9]{2,6})/i);
  const n = m ? Number(m[1] || m[2]) : null;
  return Number.isFinite(n) ? n : null;
};

const safeFoodContext = async (budget) => {
  // Food table naming in this project is `food` via InsForge.
  let q = insforge.database.from("food").select("name, price, category, description, calorie, is_available").limit(25);
  if (budget) q = q.lte("price", budget);
  const { data, error } = await q;
  if (error) return [];
  return (data || []).filter((f) => f?.is_available !== false);
};

export const chat = async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey.trim() === "") {
      return res.json({
        success: false,
        message: "OPENAI_API_KEY is missing in backend .env",
      });
    }

    const userMessage = String(req.body.message || "");
    const budget = getBudgetFromText(userMessage);
    const foods = await safeFoodContext(budget);

    const system = [
      "You are BiteBlitz AI assistant.",
      "Help users pick food items from the menu.",
      "When user asks for a budget (e.g., under ₹200), suggest items that fit.",
      "Return concise answers, with a short list and prices in INR.",
    ].join(" ");

    const menuContext = foods.length
      ? `Menu items available right now (JSON): ${JSON.stringify(foods)}`
      : "Menu context not available. Provide generic suggestions and ask to check menu.";

    const payload = {
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        { role: "system", content: system },
        { role: "system", content: menuContext },
        { role: "user", content: userMessage },
      ],
    };

    const r = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const text = await r.text();
      logger.error("[aiController] OpenAI error", text);
      return res.json({ success: false, message: "AI request failed" });
    }

    const json = await r.json();
    const reply = json?.choices?.[0]?.message?.content || "";
    res.json({ success: true, reply });
  } catch (err) {
    logger.error("[aiController] chat failed", err);
    res.status(500).json({ success: false, message: "AI error" });
  }
};

