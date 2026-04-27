import { config } from "../config.js";
import { enrichSuggestion } from "./enrich.js";

const MOCK = {
  reply:
    "Here are a few destinations that often fit moderate summer budgets (estimates only—confirm with live fares).",
  suggestions: [
    {
      name: "Lisbon",
      country: "Portugal",
      countryCode: "PT",
      estCostMin: 900,
      estCostMax: 1400,
      currency: "USD",
      rationale: "Coastal city, good value dining, many budget flight options from Western Europe/North America hubs.",
    },
    {
      name: "Mexico City",
      country: "Mexico",
      countryCode: "MX",
      estCostMin: 700,
      estCostMax: 1200,
      currency: "USD",
      rationale: "Strong food scene and museums; flight deals common from the US.",
    },
    {
      name: "Porto",
      country: "Portugal",
      countryCode: "PT",
      estCostMin: 850,
      estCostMax: 1300,
      currency: "USD",
      rationale: "Walkable, river views, slightly quieter than Lisbon.",
    },
  ],
};

function buildSystemPrompt(user, trip) {
  const c = trip.constraints || {};
  return [
    "You are a travel planning assistant for an MVP app.",
    "Return ONLY valid JSON (no markdown fences) with keys: reply (string), suggestions (array).",
    "Each suggestion object: name, country, countryCode (ISO 3166-1 alpha-2), estCostMin, estCostMax, currency (ISO 4217 for the estimate), rationale (short string).",
    "Cost estimates are TOTAL trip ballparks for one traveler including typical economy flights from the user's origin idea and modest lodging—clearly rough.",
    "Prefer 3–5 suggestions within or near the user's maxTotalBudget when possible.",
    "Address the user in a friendly, neutral way (no personal identifiers).",
    `User default budget reference: ${user.settings?.defaultTripBudget} ${user.settings?.homeCurrency}.`,
    `Trip constraints: origin hint "${c.origin || "unspecified"}", dates ${c.startDate || "?"} to ${c.endDate || "?"}, max budget ${c.maxTotalBudget} ${c.currency}, party ${c.partySize}.`,
    "If origin is vague, still propose destinations and mention flight variability in rationale.",
  ].join("\n");
}

async function callOpenAi(messages) {
  if (!config.openaiApiKey) return null;
  const url = `${config.openaiBaseUrl}/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.openaiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.openaiModel,
      messages,
      response_format: { type: "json_object" },
      temperature: 0.7,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${t.slice(0, 500)}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty model response");
  return JSON.parse(content);
}

export async function generateAssistantReply({ user, trip, userText, priorMessages }) {
  const system = buildSystemPrompt(user, trip);
  const history = (priorMessages || []).slice(-12).map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.content,
  }));
  const messages = [{ role: "system", content: system }, ...history, { role: "user", content: userText }];

  let parsed;
  try {
    parsed = await callOpenAi(messages);
  } catch (e) {
    console.warn("[ai] falling back to mock:", e.message);
    parsed = MOCK;
  }
  if (!parsed) parsed = MOCK;

  if (typeof parsed.reply !== "string" || !Array.isArray(parsed.suggestions)) {
    parsed = MOCK;
  }

  const ctx = {
    homeCurrency: user.settings?.homeCurrency || "USD",
    tripCurrency: trip.constraints?.currency || user.settings?.homeCurrency || "USD",
    startDate: trip.constraints?.startDate || "",
    endDate: trip.constraints?.endDate || "",
  };

  const suggestions = [];
  for (const s of parsed.suggestions.slice(0, 7)) {
    try {
      suggestions.push(await enrichSuggestion(s, ctx));
    } catch (err) {
      console.warn("[enrich] skip one suggestion", err.message);
    }
  }

  return { reply: parsed.reply, suggestions };
}
