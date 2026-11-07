// Alongside: optional Claude AI features, using the parent's own Claude API key.
// The key is stored only on this phone and sent only to Anthropic's API.
// This file is loaded as a module; the Anthropic SDK itself is only downloaded
// the first time an AI feature is used, so the rest of the app works offline.

const SDK_URL = "https://esm.sh/@anthropic-ai/sdk@1.3.0";
const KEY_STORE = "alongside:apikey";
const MODEL_STORE = "alongside:model";
export const MODELS = {
  "claude-opus-5-5": "Claude Opus 5.5 (best quality)",
  "claude-sonnet-5-5": "Claude Sonnet 5.5 (good, about half the cost)",
  "claude-haiku-5-5": "Claude Haiku 5.5 (fastest, cheapest)"
};
// Models that accept Anthropic's server-side "fallbacks" option.
const FALLBACK_MODELS = new Set(["claude-opus-5-5", "claude-sonnet-5-5"]);

const SYSTEM = [
  "You help parents who are feeding a child or teenager at home during family-based treatment (FBT, the Maudsley approach) for anorexia nervosa, following UK eating-disorder service practice.",
  "Food is medicine here. Your suggestions must always support weight restoration and must follow the treatment team's instructions exactly; those override everything else.",
  "Hard rules:",
  "- Never suggest less food, skipping a meal or snack, smaller portions, 'light', 'diet', low-fat, low-sugar or sugar-free products, or more exercise.",
  "- Never mention calories, weight, BMI, body shape, or describe food as 'healthy' / 'unhealthy' / 'clean'.",
  "- Use full-fat dairy, butter and oil; carbohydrate about half of each main meal; dessert after lunch and dinner; every snack has two parts.",
  "- Bring back feared foods gently: at most one per day, small, alongside liked foods, never as a whole meal.",
  "- Never use foods listed as allergies or excluded by the family diet.",
  "- Give portions in household measures (spoons, slices, mugs, 'a fist-sized'), at least as large as typical UK eating-disorder service starting portions, scaled by the team's portion level.",
  "- Keep recipes simple for a tired parent: at most 6 short steps.",
  "- Write in warm, plain British English.",
  "- If anything in the parent's notes suggests medical risk (fainting, chest pain, very slow pulse, refusing all food or drink, vomiting, self-harm, thoughts of suicide), say so clearly and tell them to contact their team today or call 999 in an emergency."
].join("\n");

const STARTING_PORTIONS = "Typical UK eating-disorder service starting portions: protein = 1 chicken breast / 1 fish fillet / 2 eggs / 3 slices meat; carbohydrate = 4 heaped serving spoons rice or pasta / 2 medium potatoes / 2 slices bread; vegetables = 2 serving spoons; cereal = 1 mug (200 ml) or 2 Weetabix with whole milk; dessert = 2 scoops ice cream / 1/4 pie / 5 tbsp custard; one snack = 1 cereal bar / 4 biscuits / 1 normal chocolate bar / scone with butter / 4 crackers with 2 cheese triangles.";

const MEAL_SCHEMA = {
  type: "object",
  properties: {
    meals: {
      type: "array",
      items: {
        type: "object",
        properties: {
          slot: { type: "string" },
          title: { type: "string" },
          why: { type: "string" },
          items: { type: "array", items: { type: "object", properties: { food: { type: "string" }, portion: { type: "string" } }, required: ["food", "portion"], additionalProperties: false } },
          recipe: { type: "array", items: { type: "string" } },
          tip: { type: "string" }
        },
        required: ["slot", "title", "why", "items", "recipe", "tip"],
        additionalProperties: false
      }
    }
  },
  required: ["meals"],
  additionalProperties: false
};

const REVIEW_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    patterns: { type: "array", items: { type: "string" } },
    mealIdeas: { type: "array", items: { type: "string" } },
    mealtimeIdeas: { type: "array", items: { type: "string" } },
    askTeam: { type: "array", items: { type: "string" } },
    urgent: { type: "boolean" },
    urgentReason: { type: "string" }
  },
  required: ["summary", "patterns", "mealIdeas", "mealtimeIdeas", "askTeam", "urgent", "urgentReason"],
  additionalProperties: false
};

// ---------- settings ----------
function lsGet(k){ try { return localStorage.getItem(k) || ""; } catch(e){ return ""; } }
function lsSet(k, v){ try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch(e){} }
export function getKey(){ return lsGet(KEY_STORE); }
export function setKey(k){ lsSet(KEY_STORE, (k || "").trim()); }
export function getModel(){ const m = lsGet(MODEL_STORE); return MODELS[m] ? m : "claude-opus-5-5"; }
export function setModel(m){ lsSet(MODEL_STORE, MODELS[m] ? m : ""); }
export function hasKey(){ return /^sk-ant-/.test(getKey()); }

// ---------- client ----------
let sdkPromise = null;
async function client(){
  if (!hasKey()) throw friendly("no_key");
  if (!sdkPromise) sdkPromise = import(SDK_URL).catch(e => { sdkPromise = null; throw friendly("offline"); });
  const mod = await sdkPromise;
  const Anthropic = mod.default || mod.Anthropic;
  return new Anthropic({ apiKey: getKey(), dangerouslyAllowBrowser: true, maxRetries: 1 });
}

function friendly(code, detail){
  const msg = {
    no_key: "Add your Claude API key in the profile page first.",
    offline: "Claude couldn't be reached. Check your internet connection and try again.",
    auth: "Your API key wasn't accepted. Check it in the profile page.",
    credit: "Your Claude API account needs credit. Add some at console.anthropic.com → Billing.",
    rate: "Claude is busy or you've hit your usage limit. Please wait a minute and try again.",
    refusal: "Claude couldn't help with that request. Try changing the wording in the profile.",
    cut: "Claude's answer was cut short. Please try again.",
    shape: "Claude's answer came back in an unexpected shape. Please try again.",
    cancelled: "Stopped.",
    other: "Something went wrong talking to Claude. Please try again."
  }[code] || "Something went wrong.";
  const e = new Error(msg); e.code = code; e.detail = detail; return e;
}
function mapError(e){
  if (e && e.code && typeof e.code === "string" && e.message && !e.status) return e; // already friendly
  if (e && (e.name === "AbortError" || /abort/i.test(e.message || ""))) return friendly("cancelled");
  const s = e && e.status;
  const text = String((e && e.message) || "");
  if (s === 401 || s === 403) return friendly("auth", text);
  if (s === 400 && /credit|billing|balance/i.test(text)) return friendly("credit", text);
  if (s === 429 || s === 529) return friendly("rate", text);
  if (!s) return friendly("offline", text);
  return friendly("other", text);
}

// One structured request. Uses server-side fallbacks on models that support them,
// and retries once without them if the account doesn't accept that option.
async function ask(userText, schema, signal, maxTokens){
  const c = await client();
  const model = getModel();
  const base = {
    model,
    max_tokens: maxTokens || 16000,
    system: SYSTEM,
    messages: [{ role: "user", content: userText }],
    output_config: { effort: "medium", format: { type: "json_schema", schema } }
  };
  let res;
  try {
    if (FALLBACK_MODELS.has(model)){
      try {
        res = await c.beta.messages.create({ ...base, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" }, { signal });
      } catch(e){
        if (e && e.status === 400 && /fallback|beta/i.test(String(e.message || ""))) res = await c.messages.create(base, { signal });
        else throw e;
      }
    } else {
      res = await c.messages.create(base, { signal });
    }
  } catch(e){ throw mapError(e); }
  if (res.stop_reason === "refusal") throw friendly("refusal");
  if (res.stop_reason === "max_tokens") throw friendly("cut");
  const text = (res.content || []).filter(b => b.type === "text").map(b => b.text).join("");
  try { return JSON.parse(text); } catch(e){ throw friendly("shape"); }
}

// ---------- prompts ----------
function profileText(p, slots){
  const level = { "1": "standard starting portions", "1.25": "about a quarter more than standard", "1.5": "about half as much again as standard", "2": "about double standard" }[p.portion || "1"];
  return [
    "Child's age: " + (p.age || "not given") + ".",
    "Foods they like: " + (p.likes || "not given") + ".",
    "Foods the illness avoids: " + (p.fear || "none listed") + ".",
    "Never use (allergy or family rule): " + (p.allergy || "nothing") + ". Family diet: " + (p.diet || "no restriction") + ".",
    "Portion level set by the team: " + level + ".",
    "Treatment team instructions (follow exactly): " + (p.plan || "none given") + ".",
    "Eating times each day: " + slots.join(", ") + "."
  ].join("\n");
}

export async function makeMenu({ profile, slots, dateLabel, went, recent, onlySlot, avoidTitle, signal }){
  const want = onlySlot ? [onlySlot] : slots;
  const text = [
    profileText(profile || {}, slots),
    STARTING_PORTIONS,
    went ? "What has gone well or been hard recently (use this to adapt):\n" + went : "",
    recent && recent.length ? "Recently served, so vary from these: " + recent.slice(-20).join("; ") + "." : "",
    onlySlot
      ? "Suggest ONE different option for " + onlySlot + " on " + dateLabel + (avoidTitle ? ", not \"" + avoidTitle + "\"" : "") + "."
      : "Write a menu for " + dateLabel + " with exactly these slots, in this order: " + want.join(", ") + ".",
    "For each slot give: slot (exactly as written above), title, why (one short sentence on why this suits this child today), items with portions, recipe steps (empty list for simple snacks), and one practical tip for the parent at this meal."
  ].filter(Boolean).join("\n\n");
  const r = await ask(text, MEAL_SCHEMA, signal, 16000);
  const meals = (Array.isArray(r.meals) ? r.meals : []).map(m => ({
    slot: String(m.slot || ""), title: String(m.title || ""),
    items: (m.items || []).slice(0, 14).map(i => ({ food: String(i.food || ""), portion: String(i.portion || "") })),
    recipe: (m.recipe || []).slice(0, 10).map(String), tip: String(m.tip || ""),
    reasons: m.why ? [String(m.why)] : [], source: "claude"
  })).filter(m => m.title);
  if (!meals.length) throw friendly("shape");
  return meals;
}

export async function reviewNotes({ profile, slots, lines, checks, signal }){
  const text = [
    "Please review this parent's meal diary from the last 2 weeks and give kind, practical, evidence-based suggestions.",
    profileText(profile || {}, slots),
    checks ? "Recent home health checks: " + checks + "." : "",
    "Diary (newest first):\n" + lines.join("\n"),
    "Give: a 2-sentence summary; 2-4 patterns you notice; 2-4 meal ideas that keep or increase energy; 2-4 mealtime ideas; 2-3 questions to take to the next appointment; and set urgent to true (with a one-sentence reason) only if something sounds medically risky."
  ].filter(Boolean).join("\n\n");
  const r = await ask(text, REVIEW_SCHEMA, signal, 8000);
  const L = a => (Array.isArray(a) ? a : []).slice(0, 5).map(String);
  return { summary: String(r.summary || ""), patterns: L(r.patterns), mealIdeas: L(r.mealIdeas), mealtimeIdeas: L(r.mealtimeIdeas), askTeam: L(r.askTeam), urgent: !!r.urgent, urgentReason: String(r.urgentReason || ""), at: new Date().toISOString() };
}

// A tiny request to check the key works.
export async function testKey(){
  const c = await client();
  try {
    await c.messages.create({ model: getModel(), max_tokens: 16, messages: [{ role: "user", content: "Reply with the word OK." }] });
    return true;
  } catch(e){ throw mapError(e); }
}

window.AlongsideAI = { MODELS, getKey, setKey, getModel, setModel, hasKey, makeMenu, reviewNotes, testKey };
window.dispatchEvent(new Event("alongside-ai-ready"));
