// ─── AI Stylist Service ───────────────────────────────────────────────────────
// Calls Groq's OpenAI-compatible chat completions endpoint (plain fetch, no
// SDK — same pattern as services/modalVtonService.js) to turn a natural
// language request + a candidate product list into a structured outfit.
//
// The model NEVER sees the full catalog and is never allowed to invent
// products: the caller (aiStylistController) passes only pre-filtered
// candidates, and validates every productId the model returns against that
// same candidate set before it reaches the frontend.
// ─────────────────────────────────────────────────────────────────────────────

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `You are a fashion stylist for an online clothing store called FitSy.
You will be given a shopper's request and a list of CANDIDATE products that actually exist in the store's catalog (with their real ids, names, prices, categories, and descriptions).

Your job:
- Select 2-4 candidate products that form a coherent outfit (aim for a top + bottom + shoes when the catalog offers them; add outerwear/accessories only when they clearly fit).
- ONLY use productId values that appear in the candidate list. Never invent an id, name, or price.
- Respect the shopper's stated budget when one is given — prefer the closest outfit at or under budget. If no combination fits, pick the closest-priced outfit anyway and say so honestly in "reason".
- Write a short, warm, non-fluffy "outfitName" and an overall "reason" (1-2 sentences) explaining the styling choice.
- For each item, give a one-sentence "reason" for why it was picked.

Respond with ONLY valid JSON, no markdown fences, no commentary, matching exactly this shape:
{
  "outfitName": "string",
  "reason": "string",
  "items": [ { "productId": "string", "reason": "string" } ],
  "insufficientCatalog": false
}

If the candidate list has too few compatible items to build any reasonable outfit, set "insufficientCatalog": true, still return whatever partial "items" you can justify (may be empty), and explain why in "reason".`;

/**
 * @param {string} userPrompt - natural language request from the shopper
 * @param {Array<{id:string,name:string,category:string,price:number,description:string,colors?:string[]}>} candidates
 * @param {{occasion?:string, style?:string, budget?:number, color?:string}} preferences
 * @returns {Promise<{outfitName:string, reason:string, items:Array<{productId:string, reason:string}>, insufficientCatalog:boolean}>}
 */
async function getOutfitRecommendation(userPrompt, candidates, preferences = {}) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    const err = new Error('AI stylist is not configured (missing GROQ_API_KEY).');
    err.code = 'AI_UNAVAILABLE';
    throw err;
  }

  const preferenceLines = Object.entries(preferences)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');

  const userMessage = [
    `Shopper request: "${userPrompt}"`,
    preferenceLines ? `Additional stated preferences:\n${preferenceLines}` : null,
    `Candidate products (JSON):\n${JSON.stringify(candidates)}`,
  ]
    .filter(Boolean)
    .join('\n\n');

  let response;
  try {
    response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.4,
        max_tokens: 900,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
      }),
    });
  } catch (networkErr) {
    const err = new Error(`AI stylist request failed: ${networkErr.message}`);
    err.code = 'AI_UNAVAILABLE';
    throw err;
  }

  if (!response.ok) {
    const bodyText = await response.text().catch(() => '');
    const err = new Error(`AI stylist provider error (${response.status}): ${bodyText.slice(0, 200)}`);
    err.code = response.status === 429 ? 'AI_RATE_LIMITED' : 'AI_UNAVAILABLE';
    throw err;
  }

  const data = await response.json();
  const rawContent = data?.choices?.[0]?.message?.content;

  if (!rawContent) {
    const err = new Error('AI stylist returned an empty response.');
    err.code = 'AI_MALFORMED';
    throw err;
  }

  let parsed;
  try {
    parsed = JSON.parse(rawContent);
  } catch {
    const err = new Error('AI stylist returned malformed JSON.');
    err.code = 'AI_MALFORMED';
    throw err;
  }

  if (!Array.isArray(parsed.items)) {
    const err = new Error('AI stylist response missing "items" array.');
    err.code = 'AI_MALFORMED';
    throw err;
  }

  return {
    outfitName: typeof parsed.outfitName === 'string' ? parsed.outfitName : 'Your Outfit',
    reason: typeof parsed.reason === 'string' ? parsed.reason : '',
    items: parsed.items
      .filter((item) => item && typeof item.productId === 'string')
      .map((item) => ({
        productId: item.productId,
        reason: typeof item.reason === 'string' ? item.reason : '',
      })),
    insufficientCatalog: Boolean(parsed.insufficientCatalog),
  };
}

module.exports = { getOutfitRecommendation };

// ─── Size Fit Explanation (optional enhancement) ──────────────────────────────
// Used by the Size Recommendation feature to turn an ALREADY-COMPUTED
// deterministic match result into a warmer natural-language sentence.
// This function cannot change the recommended size — it only rephrases
// numbers that were already decided by sizeRecommendationService.js. If this
// call fails, the caller falls back to buildDeterministicReason() instead;
// the size recommendation itself never depends on this succeeding.

const SIZE_EXPLANATION_SYSTEM_PROMPT = `You explain clothing size recommendations for an online store called FitSy.
You will be given a size that was ALREADY determined by a measurement-matching algorithm, plus, for each body measurement, only whether it falls "within", "below" or "above" that size's range and what the size's range is. You never see the shopper's exact measurements.
Write a short (1-2 sentence), warm, honest explanation of why this size was recommended.
Never say "guaranteed fit" or "perfect fit" - use language like "recommended", "best match", or "likely fit". Make clear it is an estimate based on the measurements provided.
Do not suggest a different size than the one given. Do not invent measurements or numbers. If "incomplete" is true, suggest adding the remaining measurements.
Respond with ONLY a JSON object: { "reason": "string" }`;

/**
 * @param {{recommendedSize:string, confidence:string, measurementBreakdown:object, alternative?:string}} matchResult
 * @returns {Promise<string>} explanation text
 */
async function explainSizeFit(matchResult) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    const err = new Error('AI stylist is not configured (missing GROQ_API_KEY).');
    err.code = 'AI_UNAVAILABLE';
    throw err;
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.3,
      max_tokens: 200,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SIZE_EXPLANATION_SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify(matchResult) },
      ],
    }),
  });

  if (!response.ok) {
    const err = new Error(`AI explanation provider error (${response.status})`);
    err.code = response.status === 429 ? 'AI_RATE_LIMITED' : 'AI_UNAVAILABLE';
    throw err;
  }

  const data = await response.json();
  const rawContent = data?.choices?.[0]?.message?.content;
  if (!rawContent) {
    const err = new Error('AI explanation returned empty response.');
    err.code = 'AI_MALFORMED';
    throw err;
  }

  let parsed;
  try {
    parsed = JSON.parse(rawContent);
  } catch {
    const err = new Error('AI explanation returned malformed JSON.');
    err.code = 'AI_MALFORMED';
    throw err;
  }

  if (typeof parsed.reason !== 'string' || !parsed.reason.trim()) {
    const err = new Error('AI explanation missing "reason".');
    err.code = 'AI_MALFORMED';
    throw err;
  }

  return parsed.reason.trim();
}

module.exports.explainSizeFit = explainSizeFit;
