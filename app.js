// Alongside: app logic. Everything is stored on this device (localStorage).
(function(){
"use strict";

// ---------- helpers ----------
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const localDate = (d = new Date()) => new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,10);
const fmtDate = (iso, opts) => { try { return new Date(iso + "T12:00:00").toLocaleDateString("en-GB", opts || {weekday:"short", day:"numeric", month:"short"}); } catch(e){ return iso; } };
const num = v => { const n = parseFloat(v); return isFinite(n) ? n : null; };
const TODAY = localDate();

// ---------- storage ----------
const KEY = "alongside:v1";
function load(){
  try { const v = JSON.parse(localStorage.getItem(KEY)); if (v && typeof v === "object") return v; } catch(e){}
  return { profile: null, days: {}, vitals: [], news: [], newsFetched: null };
}
let S = load();
S.days = S.days || {}; S.vitals = S.vitals || []; S.news = S.news || [];
function save(){
  try { localStorage.setItem(KEY, JSON.stringify(S)); return true; }
  catch(e){ alert("Your phone's storage is full, so this couldn't be saved. Save a backup from the profile page."); return false; }
}
function day(date){ if (!S.days[date]) S.days[date] = { date, checks: {}, logs: [], menu: null }; const d = S.days[date]; d.checks = d.checks || {}; d.logs = d.logs || []; return d; }
// ask the browser to keep our data (helps on some phones)
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

// ---------- navigation ----------
function go(id, openId){
  if (!document.getElementById(id)) return;
  document.querySelectorAll("main section").forEach(s => s.classList.toggle("active", s.id === id));
  document.querySelectorAll("nav button").forEach(b => b.classList.toggle("active", b.dataset.go === id));
  if (openId){ const d = document.getElementById(openId); if (d) { d.open = true; setTimeout(() => d.scrollIntoView({block:"start"}), 0); } }
  else window.scrollTo(0, 0);
  if (location.hash !== "#" + id) { try { history.replaceState(null, "", "#" + id); } catch(e){} }
}
document.addEventListener("click", e => {
  const t = e.target.closest("[data-go]");
  if (t){ e.preventDefault(); go(t.dataset.go, t.dataset.open); }
});
window.addEventListener("hashchange", () => go(location.hash.slice(1)));

// ---------- plan helpers ----------
function slots(){
  const n = (S.profile && +S.profile.snacks) || 3;
  const s = ["Breakfast", "Morning snack", "Lunch", "Afternoon snack", "Dinner"];
  if (n >= 3) s.push("Evening snack");
  return s;
}
const PORTION_TEXT = { "1": "", "1.25": "Your team's level: serve about a quarter more than the portions shown.", "1.5": "Your team's level: serve about half as much again as the portions shown.", "2": "Your team's level: serve about double the portions shown." };

// ---------- tips ----------
const TIPS = [
  "Separate your child from the illness. When they argue or refuse, it's often the anorexia talking. You're on their side, against it.",
  "Food is medicine right now. You decide what, when and how much. Your child's job is to eat it.",
  "Eat together whenever you can. Seeing you eat normally is quietly powerful.",
  "Keep mealtime conversation light and about anything except food, weight or bodies.",
  "Don't negotiate portions at the table. One kind, firm sentence is enough: \"This is the right amount.\"",
  "Keep diet, weight and body talk out of the house, including comments about yourself.",
  "Plan something calm for the 30–60 minutes after each meal: a show, a game, homework at the table.",
  "Praise effort, not appearance. \"You worked really hard at lunch\" beats \"You look well.\"",
  "Name the feeling before the expectation: \"I can see this is really hard. And you need to finish it.\"",
  "Make sure every adult who feeds your child uses the same rules. The illness looks for gaps.",
  "Keep the snack cupboard visibly full of normal, full-fat foods.",
  "Bring back one feared food at a time, in small steps, at a calm time of day, alongside a safe food.",
  "Distress often rises as eating goes up. That's usually a sign you're doing the right thing.",
  "Do one small thing for yourself today: a walk, a coffee with a friend, ten minutes of quiet.",
  "Write down your questions as they come up and take them to the next appointment.",
  "Recovery isn't a straight line. A hard day doesn't undo a good week.",
  "Brothers and sisters need time and attention too. Plan something just for them this week.",
  "Notice movement, bathroom trips and hidden food calmly. Note it down and tell the team. Don't accuse.",
  "Short, repeated phrases work better than explanations at the table: \"Next bite.\"",
  "Early in treatment, fewer choices means less anxiety. Serve the plate already made up.",
  "Insight usually comes after nourishment. Don't wait for your child to \"want\" to get better.",
  "Agree a plan for school lunches with the school, such as who supervises and where they eat.",
  "Talk gently about what they see online. Some accounts promote eating-disorder behaviours.",
  "Mention small wins later, away from the table, not during the meal.",
  "Tag-team with another adult on hard days. Nobody can do every meal alone.",
  "Protect sleep, yours and theirs. Everything is harder when you're exhausted.",
  "Hurtful words are a symptom. Try to let them pass: \"I love you too much to let the illness win.\"",
  "Keep some fun, food-free time in each day to remind you both who your child is.",
  "If you lose your temper, repair it: \"I got cross earlier and I'm sorry. I'm still on your side.\"",
  "Before eating out or a holiday, plan the meals ahead with your team.",
  "Full-fat milk, butter and oil are part of the treatment, not extras.",
  "If weight stalls, it's usually the plan that needs adjusting, not your effort. Ask the team what to change."
];
const tipOfDay = () => TIPS[Math.floor(Date.now() / 86400000) % TIPS.length];

// ---------- TODAY ----------
function renderToday(){
  $("#hello").textContent = (S.profile && S.profile.name) ? "Today with " + S.profile.name : "Today";
  $("#todayDate").textContent = fmtDate(TODAY, {weekday:"long", day:"numeric", month:"long"});
  $("#setupCard").hidden = !!S.profile;
  $("#tipText").textContent = tipOfDay();
  const d = S.days[TODAY] || { checks: {} };
  const menu = d.menu && Array.isArray(d.menu.meals) ? d.menu.meals : [];
  const list = $("#checklist"); list.innerHTML = "";
  slots().forEach((name, i) => {
    const m = menu.find(x => x && x.slot === name);
    const row = document.createElement("div"); row.className = "check";
    row.innerHTML = '<input type="checkbox" id="ck' + i + '"><label for="ck' + i + '">' + esc(name) + (m ? '<br><small class="muted">' + esc(m.title) + '</small>' : '') + '</label>';
    const cb = row.querySelector("input"); cb.checked = !!(d.checks && d.checks[name]);
    cb.addEventListener("change", () => { day(TODAY).checks[name] = cb.checked; save(); renderBar(); });
    list.appendChild(row);
  });
  renderBar();
  const ins = analyse();
  if (ins && ins.headline){ $("#insightCard").hidden = false; $("#insightShort").innerHTML = '<p style="margin:0">' + esc(ins.headline) + '</p>'; }
  else $("#insightCard").hidden = true;
  if (S.news.length){ const n = S.news[0]; $("#latestNews").hidden = false; $("#latestNews").innerHTML = '<span class="tag">Latest research update</span><h3>' + esc(n.title) + '</h3><p class="small" style="margin:4px 0 8px">' + esc(n.forParents || n.summary) + '</p><button class="btn ghost small" data-go="news">All updates</button>'; }
  else $("#latestNews").hidden = true;
  renderVitalAlert();
}
function renderBar(){
  const d = S.days[TODAY] || { checks: {} }; const ss = slots();
  const n = ss.filter(s => d.checks && d.checks[s]).length;
  $("#bar").style.width = (n / ss.length * 100) + "%";
}
function renderVitalAlert(){
  const box = $("#vitalAlert"); const lim = S.profile && num(S.profile.pulseLow);
  const last = [...S.vitals].sort((a,b) => (a.date + a.at).localeCompare(b.date + b.at)).reverse().find(v => v.pulse != null);
  if (lim && last && last.pulse < lim){
    box.hidden = false;
    box.innerHTML = '<span class="tag danger">Pulse below your team\'s alert level</span><p>The last pulse you recorded (' + esc(last.pulse) + ' on ' + esc(fmtDate(last.date)) + ') is below ' + esc(lim) + '. Contact your team today. If your child feels faint, dizzy, has chest pain or is unwell, go to A&amp;E or call 999.</p><button class="btn small danger-btn" data-go="urgent">Urgent help</button>';
  } else box.hidden = true;
}

// ---------- PROFILE ----------
const PF = { pName:"name", pAge:"age", pLikes:"likes", pFear:"fear", pAllergy:"allergy", pDiet:"diet", pSnacks:"snacks", pPortion:"portion", pPlan:"plan", pTeam:"team", pPhone:"phone", pPulse:"pulseLow" };
function renderProfile(){
  const p = S.profile || {};
  Object.entries(PF).forEach(([id, k]) => { const el = document.getElementById(id); if (p[k] != null && p[k] !== "") el.value = p[k]; });
  $("#teamContact").hidden = !p.phone;
  if (p.phone){ $("#teamName").textContent = p.team || "Your treatment team"; const a = $("#teamPhone"); a.textContent = p.phone; a.href = "tel:" + String(p.phone).replace(/[^\d+]/g, ""); }
}
$("#saveProfile").addEventListener("click", () => {
  const p = {};
  Object.entries(PF).forEach(([id, k]) => { p[k] = document.getElementById(id).value.trim(); });
  p.updated = new Date().toISOString();
  S.profile = p;
  if (save()) $("#pStatus").textContent = "Saved on this phone.";
  renderAll();
});

// backup and restore
$("#exportBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(S, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = "alongside-backup-" + TODAY + ".json";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  $("#dataStatus").textContent = "Backup created. On iPhone, choose \"Save to Files\" to keep it.";
});
$("#importFile").addEventListener("change", async e => {
  const f = e.target.files && e.target.files[0]; if (!f) return;
  try {
    const v = JSON.parse(await f.text());
    if (!v || typeof v !== "object" || !("days" in v)) throw new Error("not a backup");
    S = Object.assign({ profile: null, days: {}, vitals: [], news: [] }, v); save(); renderAll();
    $("#dataStatus").textContent = "Backup restored.";
  } catch(err){ $("#dataStatus").textContent = "That file isn't an Alongside backup."; }
  e.target.value = "";
});

// ---------- MEALS ----------
// Menus come from the built-in planner (meals.js). It learns from this family:
// meals eaten well in the diary, and meals marked 👍, come up more; 👎 and struggles come up less.
$("#menuDate").value = TODAY;
$("#menuDate").addEventListener("change", () => { renderMenu(); $("#shopOut").hidden = true; });
let swapSalt = Math.floor(Math.random() * 1000);
S.ratings = S.ratings || {};
const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
const mainName = title => String(title || "").split(" + ")[0];
function recentTitles(date){
  const since = localDate(new Date(Date.now() - 4*86400000));
  return Object.values(S.days).filter(d => d.menu && d.date !== date && d.date >= since).flatMap(d => (d.menu.meals || []).map(m => m.title));
}
function mealHistory(){
  const acc = {};
  const add = (name, v, w) => { const a = acc[name] = acc[name] || { t: 0, w: 0 }; a.t += v * w; a.w += w; };
  const since = localDate(new Date(Date.now() - 60*86400000));
  Object.values(S.days).forEach(d => {
    if (!d.menu || d.date < since) return;
    (d.logs || []).forEach(l => {
      if (!(l.eaten in EATEN_SCORE)) return;
      const m = (d.menu.meals || []).find(x => x.slot === l.slot); if (!m) return;
      const v = EATEN_SCORE[l.eaten] * 2 - 1 - (l.distress >= 4 ? 0.3 : 0);
      m.title.split(" + ").forEach((part, i) => add(i ? cap(part) : part, v, i ? 0.5 : 1));
    });
  });
  Object.entries(S.ratings).forEach(([name, v]) => add(name, v, 2));
  const out = {}; Object.entries(acc).forEach(([k, a]) => out[k] = Math.max(-1, Math.min(1, a.t / a.w)));
  return out;
}
function needProfile(){
  if (S.profile) return true;
  $("#menuStatus").innerHTML = 'First <a href="#profile" data-go="profile">set up your child\'s profile</a> so menus fit them.';
  return false;
}
$("#genMenu").addEventListener("click", () => {
  if (!needProfile()) return;
  const date = $("#menuDate").value || TODAY;
  swapSalt++;
  const m = AlongsidePlanner.plan(date, slots(), S.profile, recentTitles(date), swapSalt, mealHistory());
  if (!m.meals.length){ $("#menuStatus").textContent = "No meals fit the profile's allergies and diet. Try loosening them."; return; }
  day(date).menu = m; save();
  $("#menuStatus").textContent = "Menu ready. Check it against your team's plan.";
  renderMenu(); renderToday();
});
$("#genWeek").addEventListener("click", () => {
  if (!needProfile()) return;
  const start = $("#menuDate").value || TODAY;
  swapSalt++;
  const week = AlongsidePlanner.planWeek(start, 7, slots(), S.profile, recentTitles(start), swapSalt, mealHistory());
  week.forEach(w => { if (w.menu.meals.length) day(w.date).menu = w.menu; });
  save();
  $("#menuStatus").textContent = "Menus made for 7 days from " + fmtDate(start, {weekday:"long", day:"numeric", month:"short"}) + ". Change the Day above to see each one.";
  renderMenu(); renderToday(); renderShopping(start);
});
$("#genShop").addEventListener("click", () => renderShopping($("#menuDate").value || TODAY));
function weekMenus(start){
  const d0 = new Date(start + "T12:00:00"); const out = [];
  for (let i = 0; i < 7; i++){ const iso = localDate(new Date(d0.getTime() + i*86400000)); const d = S.days[iso]; if (d && d.menu) out.push(d.menu); }
  return out;
}
let shopText = "";
function renderShopping(start){
  const menus = weekMenus(start); const box = $("#shopOut");
  box.hidden = false;
  if (!menus.length){ box.innerHTML = '<h3>Shopping list</h3><p class="muted small" style="margin:0">No menus yet for the 7 days from this date. Tap "Plan the whole week" first.</p>'; return; }
  const list = AlongsidePlanner.shoppingList(menus);
  shopText = "Alongside shopping list (" + menus.length + " days from " + fmtDate(start, {day:"numeric", month:"short"}) + ")\n" + list.map(i => "- " + i.food + (i.times > 1 ? " (x" + i.times + ")" : "")).join("\n") + "\n\nBuy full-fat versions: whole milk, full-fat yoghurt, real butter.";
  box.innerHTML = '<h3>Shopping list</h3><p class="small muted" style="margin-top:0">For ' + menus.length + ' day' + (menus.length > 1 ? 's' : '') + ' from ' + esc(fmtDate(start, {weekday:"long", day:"numeric", month:"short"})) + '. Buy full-fat versions.</p>' +
    '<div class="shop">' + list.map((i, n) => '<label class="check"><input type="checkbox" id="sh' + n + '"><span>' + esc(i.food) + (i.times > 1 ? ' <span class="muted small">×' + i.times + '</span>' : '') + '</span></label>').join("") + '</div>' +
    '<div class="btns"><button class="btn small" id="shareShop">Share list</button></div><div class="status" id="shopStatus"></div>';
  $("#shareShop").addEventListener("click", async () => {
    if (navigator.share){ try { await navigator.share({ title: "Shopping list", text: shopText }); return; } catch(e){ if (e && e.name === "AbortError") return; } }
    $("#shopStatus").textContent = (await copyText(shopText)) ? "List copied. Paste it into Notes or a message." : "Couldn't share the list.";
  });
}
function swapMeal(date, slot){
  const d = S.days[date]; if (!d || !d.menu) return;
  swapSalt++;
  const m = AlongsidePlanner.swapOne(date, slot, S.profile || {}, d.menu, swapSalt, mealHistory());
  if (m){ d.menu.meals = d.menu.meals.map(x => x.slot === slot ? m : x); save(); renderMenu(); renderToday(); }
}
function rateMeal(title, v){
  const name = mainName(title);
  if (S.ratings[name] === v) delete S.ratings[name]; else S.ratings[name] = v;
  save(); renderMenu();
}
function renderMenu(){
  const date = $("#menuDate").value || TODAY; const d = S.days[date];
  const out = $("#menuOut");
  if (!d || !d.menu || !d.menu.meals || !d.menu.meals.length){
    out.innerHTML = '<div class="card"><p class="muted" style="margin:0">No menu for ' + esc(fmtDate(date, {weekday:"long", day:"numeric", month:"long"})) + ' yet. ' + (S.profile ? 'Tap "Make a menu for this day" or "Plan the whole week".' : 'Set up the child profile first, then make a menu.') + '</p></div>';
    $("#genMenu").textContent = "Make a menu for this day"; return;
  }
  $("#genMenu").textContent = "Make a different menu";
  const level = PORTION_TEXT[(S.profile && S.profile.portion) || "1"] || "";
  out.innerHTML = (level ? '<div class="banner">' + esc(level) + '</div>' : '') + d.menu.meals.map((m, i) => {
    const r = S.ratings[mainName(m.title)];
    return '<div class="card meal"><h3><span>' + esc(m.slot) + '</span><span class="pill">' + esc(m.title) + '</span></h3>' +
      (m.reasons && m.reasons.length ? '<div class="reasons">' + m.reasons.map(x => '<span class="reason">' + esc(x) + '</span>').join("") + '</div>' : '') +
      '<ul class="items">' + (m.items || []).map(it => '<li><span>' + esc(it.food) + '</span><span>' + esc(it.portion) + '</span></li>').join("") + '</ul>' +
      (m.recipe && m.recipe.length ? '<details style="margin:8px 0 0"><summary>Recipe</summary><div class="body"><ol>' + m.recipe.map(s => '<li>' + esc(s) + '</li>').join("") + '</ol></div></details>' : '') +
      (m.tip ? '<p class="small muted" style="margin:8px 0 0">' + esc(m.tip) + '</p>' : '') +
      '<div class="btns"><button class="btn ghost small" data-swap="' + i + '">Swap this</button>' +
      (aiOn() ? '<button class="btn ghost small" data-aiswap="' + i + '">✨ New idea from Claude</button>' : '') +
      '<button class="chip" data-rate="1" data-i="' + i + '" aria-pressed="' + (r === 1) + '">👍 Went well</button>' +
      '<button class="chip" data-rate="-1" data-i="' + i + '" aria-pressed="' + (r === -1) + '">👎 Struggled</button></div></div>';
  }).join("");
  out.querySelectorAll("[data-swap]").forEach(b => b.addEventListener("click", () => swapMeal(date, d.menu.meals[+b.dataset.swap].slot)));
  out.querySelectorAll("[data-aiswap]").forEach(b => b.addEventListener("click", () => aiSwapMeal(date, d.menu.meals[+b.dataset.aiswap].slot, b)));
  out.querySelectorAll("[data-rate]").forEach(b => b.addEventListener("click", () => rateMeal(d.menu.meals[+b.dataset.i].title, +b.dataset.rate)));
}

async function copyText(t){
  try { await navigator.clipboard.writeText(t); return true; }
  catch(e){
    const ta = document.createElement("textarea"); ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand("copy"); } catch(_){}
    ta.remove(); return ok;
  }
}
// ---------- CLAUDE (optional, with the parent's own API key; see ai.js) ----------
const AI = () => window.AlongsideAI;
const aiOn = () => !!(AI() && AI().hasKey());
function refreshAIUI(){
  const on = aiOn();
  $("#aiMenuRow").hidden = !on; $("#aiHintMeals").hidden = on; $("#aiReview").hidden = !on;
  const sel = $("#aiModel");
  if (AI()){
    if (!sel.options.length) sel.innerHTML = Object.entries(AI().MODELS).map(([id, label]) => '<option value="' + esc(id) + '">' + esc(label) + '</option>').join("");
    sel.value = AI().getModel();
    $("#aiKey").placeholder = on ? "Key saved (ending " + AI().getKey().slice(-4) + "). Paste a new one to replace it." : "sk-ant-…";
  }
  renderMenu();
}
window.addEventListener("alongside-ai-ready", refreshAIUI);
$("#aiSave").addEventListener("click", async () => {
  if (!AI()){ $("#aiStatus").textContent = "The Claude features couldn't load. Check your internet connection, then close and reopen Alongside."; return; }
  const k = $("#aiKey").value.trim();
  if (k && !/^sk-ant-/.test(k)){ $("#aiStatus").textContent = "That doesn't look like a Claude API key. It should start with sk-ant-."; return; }
  if (k) AI().setKey(k);
  AI().setModel($("#aiModel").value);
  $("#aiKey").value = "";
  if (!AI().hasKey()){ $("#aiStatus").textContent = "Paste your API key first."; return; }
  $("#aiStatus").textContent = "Checking your key with Claude…";
  try { await AI().testKey(); $("#aiStatus").textContent = "Connected. Claude's menus and diary reviews are now switched on."; }
  catch(e){ $("#aiStatus").textContent = e.message; }
  refreshAIUI();
});
$("#aiRemove").addEventListener("click", () => {
  if (AI()) AI().setKey("");
  $("#aiKey").value = ""; $("#aiStatus").textContent = "Key removed from this phone. Claude features are off.";
  refreshAIUI();
});

// What has gone well or been hard recently, in plain words, for Claude to adapt to.
function wentText(){
  const h = mealHistory();
  const good = Object.entries(h).filter(([, v]) => v >= 0.4).map(([k]) => k).slice(0, 8);
  const hard = Object.entries(h).filter(([, v]) => v <= -0.2).map(([k]) => k).slice(0, 8);
  const logs = allLogs(14);
  const tagCount = {}; logs.forEach(l => (l.tags || []).forEach(t => tagCount[t] = (tagCount[t] || 0) + 1));
  const tags = Object.entries(tagCount).sort((a,b) => b[1] - a[1]).slice(0, 4).map(([t, c]) => t + " (" + c + "x)");
  const notes = logs.filter(l => l.notes).slice(0, 6).map(l => l.slot + ": " + l.notes.replace(/\s+/g, " ").slice(0, 160));
  return [
    good.length ? "Went well: " + good.join("; ") + "." : "",
    hard.length ? "Was hard: " + hard.join("; ") + "." : "",
    tags.length ? "Often noticed at meals: " + tags.join(", ") + "." : "",
    notes.length ? "Recent parent notes:\n- " + notes.join("\n- ") : ""
  ].filter(Boolean).join("\n");
}
// Put Claude's meals in this family's slot order, using the slot names the app uses.
function alignSlots(meals){
  const ss = slots(); const used = new Set();
  return ss.map((slot, i) => {
    let m = meals.find((x, j) => !used.has(j) && x.slot.toLowerCase() === slot.toLowerCase());
    if (!m) m = meals.find((x, j) => !used.has(j) && j === i);
    if (!m) return null;
    used.add(meals.indexOf(m));
    return Object.assign({}, m, { slot });
  }).filter(Boolean);
}
let aiCtl = null;
function aiBusy(on){ $("#aiMenu").disabled = on; $("#aiStop").hidden = !on; $("#genMenu").disabled = on; $("#genWeek").disabled = on; }
$("#aiMenu").addEventListener("click", async () => {
  if (!needProfile() || !aiOn()) return;
  const date = $("#menuDate").value || TODAY;
  aiCtl = new AbortController(); aiBusy(true);
  $("#menuStatus").textContent = "Claude is writing a menu for your child. This usually takes 20–60 seconds…";
  try {
    const meals = await AI().makeMenu({ profile: S.profile, slots: slots(), dateLabel: fmtDate(date, {weekday:"long", day:"numeric", month:"long"}), went: wentText(), recent: recentTitles(date), signal: aiCtl.signal });
    const aligned = alignSlots(meals);
    if (!aligned.length) throw new Error("Claude's answer didn't include the day's meals. Please try again.");
    day(date).menu = { meals: aligned, made: new Date().toISOString(), source: "claude" }; save();
    $("#menuStatus").textContent = "Claude's menu is ready. Check it against your team's plan.";
    renderMenu(); renderToday();
  } catch(e){ $("#menuStatus").textContent = e.message; }
  finally { aiBusy(false); aiCtl = null; }
});
$("#aiStop").addEventListener("click", () => aiCtl && aiCtl.abort());
async function aiSwapMeal(date, slot, btn){
  const d = S.days[date]; if (!d || !d.menu || !aiOn()) return;
  const cur = d.menu.meals.find(m => m.slot === slot);
  btn.disabled = true; btn.textContent = "Claude is thinking…";
  try {
    const meals = await AI().makeMenu({ profile: S.profile, slots: slots(), dateLabel: fmtDate(date, {weekday:"long", day:"numeric", month:"long"}), went: wentText(), recent: recentTitles(date).concat(d.menu.meals.map(m => m.title)), onlySlot: slot, avoidTitle: cur ? cur.title : "" });
    const m = meals[0];
    if (m){ m.slot = slot; d.menu.meals = d.menu.meals.map(x => x.slot === slot ? m : x); save(); renderMenu(); renderToday(); }
  } catch(e){ btn.disabled = false; btn.textContent = "✨ New idea from Claude"; $("#menuStatus").textContent = e.message; }
}

// ---------- DIARY ----------
const EATEN = ["All of it", "Most", "About half", "A little", "None"];
const EATEN_SCORE = { "All of it": 1, "Most": 0.75, "About half": 0.5, "A little": 0.25, "None": 0 };
const TAGS = ["Very slow", "Cut food small", "Hid or dropped food", "Bargaining", "Angry or tearful", "Bathroom after", "Moving a lot", "Asked for reassurance", "Tried a feared food", "Went well"];
let logEaten = null, logTags = new Set();
$("#logDate").value = TODAY;
function renderLogForm(){
  const sel = $("#logSlot"); const cur = sel.value; sel.innerHTML = slots().map(s => '<option>' + esc(s) + '</option>').join(""); if (cur) sel.value = cur;
  $("#logEaten").innerHTML = EATEN.map(e => '<button type="button" class="chip" aria-pressed="' + (logEaten === e) + '" data-e="' + esc(e) + '">' + esc(e) + '</button>').join("");
  $("#logTags").innerHTML = TAGS.map(t => '<button type="button" class="chip" aria-pressed="' + logTags.has(t) + '" data-t="' + esc(t) + '">' + esc(t) + '</button>').join("");
}
$("#logEaten").addEventListener("click", e => { const b = e.target.closest("[data-e]"); if (!b) return; logEaten = b.dataset.e; renderLogForm(); });
$("#logTags").addEventListener("click", e => { const b = e.target.closest("[data-t]"); if (!b) return; const t = b.dataset.t; logTags.has(t) ? logTags.delete(t) : logTags.add(t); renderLogForm(); });
$("#logDistress").addEventListener("input", e => { $("#distressVal").textContent = "(" + e.target.value + " of 5)"; });
$("#saveLog").addEventListener("click", async () => {
  stopVoice();
  if (mr) { $("#logStatus").textContent = "Finishing the recording… tap Save note again in a moment."; return; }
  const date = $("#logDate").value || TODAY;
  const entry = { at: new Date().toISOString(), slot: $("#logSlot").value, eaten: logEaten || "", minutes: num($("#logMins").value), distress: +$("#logDistress").value, tags: [...logTags], notes: $("#logNotes").value.trim().slice(0, 4000) };
  if (!entry.eaten && !entry.notes && !entry.tags.length && !pendingClip){ $("#logStatus").textContent = "Add how much was eaten, a short note or a voice message first."; return; }
  if (pendingClip){
    const id = "clip-" + Date.now().toString(36);
    try { await AudioStore.put(id, pendingClip.blob); entry.audio = id; entry.audioSecs = pendingClip.secs; }
    catch(e){ $("#logStatus").textContent = "The voice message couldn't be saved on this phone. Please type a short note instead."; return; }
  }
  const d = day(date); d.logs.push(entry);
  if (entry.eaten === "All of it" || entry.eaten === "Most") d.checks[entry.slot] = true;
  if (!save()) return;
  $("#logStatus").textContent = "Saved. Thank you, that was a lot to get through.";
  logEaten = null; logTags = new Set(); pendingClip = null; renderClip();
  $("#logMins").value = ""; $("#logDistress").value = 0; $("#distressVal").textContent = "(0 = calm, 5 = very upset)"; $("#logNotes").value = "";
  renderLogForm(); renderLogList(); renderInsight(); renderToday();
});
function allLogs(days){
  const since = localDate(new Date(Date.now() - (days || 3650) * 86400000));
  return Object.values(S.days).filter(d => d.date >= since).sort((a,b) => b.date.localeCompare(a.date))
    .flatMap(d => (d.logs || []).map(l => Object.assign({ date: d.date }, l)).reverse());
}
function renderLogList(){
  const logs = allLogs().slice(0, 30);
  $("#logList").innerHTML = logs.length ? logs.map(l =>
    '<div class="entry"><b>' + esc(fmtDate(l.date)) + ' · ' + esc(l.slot) + '</b> ' +
    (l.eaten ? '<span class="pill ' + (EATEN_SCORE[l.eaten] >= 0.75 ? "" : "warm") + '">' + esc(l.eaten) + '</span> ' : '') +
    (l.distress >= 4 ? '<span class="pill danger">Distress ' + esc(l.distress) + '/5</span>' : '') +
    (l.minutes ? ' <span class="small muted">' + esc(l.minutes) + ' min</span>' : '') +
    (l.tags && l.tags.length ? '<div class="small muted">' + esc(l.tags.join(" · ")) + '</div>' : '') +
    (l.notes ? '<div class="small">' + esc(l.notes) + '</div>' : '') +
    (l.audio ? '<div class="btns" style="margin-top:6px"><button class="btn ghost small" data-play="' + esc(l.audio) + '">▶ Play voice message' + (l.audioSecs ? " (" + fmtSecs(l.audioSecs) + ")" : "") + '</button></div>' : '') + '</div>'
  ).join("") : '<p class="muted small" style="margin:0">No notes yet.</p>';
}
$("#logList").addEventListener("click", async e => {
  const b = e.target.closest("[data-play]"); if (!b) return;
  try { const blob = await AudioStore.get(b.dataset.play); if (!blob) throw 0; playBlob(blob); }
  catch(err){ b.textContent = "Voice message not found on this phone"; b.disabled = true; }
});

// ---------- VOICE ----------
// Two ways to use your voice:
//  "dictate": live speech-to-text into the notes box (works in Safari on many phones,
//             but iPhone often blocks it inside home-screen apps)
//  "record":  saves a real voice message on this phone, which you can play back
// The keyboard's own microphone button always works for speech-to-text too.
const fmtSecs = s => Math.floor(s / 60) + ":" + String(Math.round(s % 60)).padStart(2, "0");
function playBlob(blob){ const url = URL.createObjectURL(blob); const a = new Audio(url); a.onended = () => URL.revokeObjectURL(url); a.play().catch(() => {}); }
const AudioStore = {
  _db: null,
  open(){ return this._db || (this._db = new Promise((res, rej) => { const r = indexedDB.open("alongside-audio", 1); r.onupgradeneeded = () => r.result.createObjectStore("clips"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); })); },
  async put(id, blob){ const db = await this.open(); return new Promise((res, rej) => { const tx = db.transaction("clips", "readwrite"); tx.objectStore("clips").put(blob, id); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); }); },
  async get(id){ const db = await this.open(); return new Promise((res, rej) => { const q = db.transaction("clips", "readonly").objectStore("clips").get(id); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); }
};

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const CAN_RECORD = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
let voiceMode = SR ? "dictate" : "record";
try { const m = localStorage.getItem("alongside:voiceMode"); if (m === "record" || (m === "dictate" && SR)) voiceMode = m; } catch(e){}
function setVoiceMode(m){ voiceMode = m; try { localStorage.setItem("alongside:voiceMode", m); } catch(e){} setMicUI(); }

let rec = null, listening = false, recBase = "", finalTxt = "";
let mr = null, chunks = [], pendingClip = null, recStart = 0, recTimer = null;
const status = t => { $("#logStatus").textContent = t; };

function setMicUI(){
  const active = listening || !!mr;
  $("#micBtn").classList.toggle("recording", active);
  $("#micBtn").setAttribute("aria-pressed", String(active));
  $("#micLabel").textContent = active ? "Stop" : (voiceMode === "dictate" ? "Speak (types for you)" : "Record voice message");
  $("#voiceHint").textContent = "Tip: you can also tap the notes box, then the microphone on your keyboard, to turn speech into text.";
  const sw = $("#voiceSwitch");
  sw.hidden = active || !SR || !CAN_RECORD;
  sw.textContent = voiceMode === "dictate" ? "Record a voice message instead" : "Try live typing instead";
}
$("#voiceSwitch").addEventListener("click", () => setVoiceMode(voiceMode === "dictate" ? "record" : "dictate"));

function stopVoice(){
  listening = false;
  if (rec) { try { rec.stop(); } catch(e){} }
  if (mr && mr.state !== "inactive") { try { mr.stop(); } catch(e){} }
}
$("#micBtn").addEventListener("click", () => {
  if (listening || mr) { stopVoice(); return; }
  if (voiceMode === "dictate" && SR) startDictation();
  else if (CAN_RECORD) startRecording();
  else { status("Tap in the notes box, then tap the microphone on your keyboard to speak."); $("#logNotes").focus(); }
});

function startDictation(){
  listening = true; finalTxt = "";
  recBase = $("#logNotes").value ? $("#logNotes").value.replace(/\s*$/, " ") : "";
  let firstRun = true, gotSpeech = false;
  const run = () => {
    rec = new SR(); rec.lang = "en-GB"; rec.interimResults = true; rec.continuous = false; // short sessions work best on iPhone
    rec.onresult = ev => {
      gotSpeech = true; let interim = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++){
        const t = ev.results[i][0].transcript;
        if (ev.results[i].isFinal) finalTxt += t.trim() + " "; else interim += t;
      }
      $("#logNotes").value = recBase + finalTxt + interim;
    };
    rec.onerror = ev => {
      const e = ev.error;
      if (e === "no-speech" || e === "aborted") return;
      listening = false;
      if (firstRun && !gotSpeech && CAN_RECORD){
        setVoiceMode("record");
        status(e === "not-allowed" ? "Live typing was blocked on this phone. Tap Record voice message to save your voice instead, or use your keyboard's microphone." : "Live typing isn't available here. Tap Record voice message to save your voice instead, or use your keyboard's microphone.");
      } else status("Stopped listening. Tap the button to carry on.");
    };
    rec.onend = () => {
      rec = null;
      if (listening) { firstRun = false; try { run(); } catch(e){ listening = false; setMicUI(); } }
      else setMicUI();
    };
    rec.start();
  };
  try { run(); setMicUI(); status("Listening… speak your note. Tap Stop when you've finished."); }
  catch(e){ listening = false; if (CAN_RECORD) setVoiceMode("record"); setMicUI(); status("Live typing isn't available here. Tap Record voice message instead."); }
}

async function startRecording(){
  if (!CAN_RECORD){ status("This phone can't record here. Tap the notes box and use your keyboard's microphone."); return; }
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
  catch(e){
    status(e && e.name === "NotAllowedError" ? "Microphone access is off. On iPhone: open Settings → Apps → Safari → Microphone → Allow, then try again." : "The microphone couldn't start. Please try again, or use your keyboard's microphone.");
    return;
  }
  const type = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm"].find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || "";
  try { mr = new MediaRecorder(stream, type ? { mimeType: type } : undefined); }
  catch(e){ stream.getTracks().forEach(t => t.stop()); status("Recording isn't available on this phone. Please use your keyboard's microphone."); return; }
  chunks = [];
  mr.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
  mr.onstop = () => {
    stream.getTracks().forEach(t => t.stop());
    clearInterval(recTimer);
    const secs = Math.max(1, Math.round((Date.now() - recStart) / 1000));
    const blob = new Blob(chunks, { type: (mr && mr.mimeType) || type || "audio/mp4" });
    mr = null;
    if (blob.size){ pendingClip = { blob, secs }; status("Voice message ready. Tap Save note to keep it."); }
    else status("Nothing was recorded. Please try again.");
    setMicUI(); renderClip();
  };
  mr.start(1000); recStart = Date.now();
  setMicUI();
  const tick = () => status("Recording… " + fmtSecs((Date.now() - recStart) / 1000) + ". Tap Stop when you've finished.");
  tick(); recTimer = setInterval(tick, 500);
}
function renderClip(){
  const box = $("#clipBox");
  if (!pendingClip){ box.hidden = true; box.innerHTML = ""; return; }
  box.hidden = false;
  box.innerHTML = '<div class="clip"><span>🎙️ Voice message (' + fmtSecs(pendingClip.secs) + ')</span><button type="button" class="btn ghost small" id="clipPlay">▶ Play</button><button type="button" class="btn ghost small" id="clipDel">Delete</button></div>';
  $("#clipPlay").addEventListener("click", () => playBlob(pendingClip.blob));
  $("#clipDel").addEventListener("click", () => { pendingClip = null; renderClip(); status(""); });
}
setMicUI();

// ---------- PATTERNS (worked out on the phone, no AI) ----------
const RISK_WORDS = ["faint","fainted","collapse","collapsed","chest pain","palpitation","dizzy","self-harm","self harm","cut herself","cut himself","cutting","hurt herself","hurt himself","suicid","vomit","sick after","threw up","blood"];
function analyse(){
  const logs = allLogs(14);
  if (logs.length < 3) return null;
  const bySlot = {};
  logs.forEach(l => {
    const s = bySlot[l.slot] = bySlot[l.slot] || { n:0, eat:0, eatN:0, dis:0, min:0, minN:0 };
    s.n++; s.dis += (l.distress || 0);
    if (l.eaten in EATEN_SCORE){ s.eat += EATEN_SCORE[l.eaten]; s.eatN++; }
    if (l.minutes){ s.min += l.minutes; s.minN++; }
  });
  const slotsArr = Object.entries(bySlot).map(([slot, s]) => ({ slot, n: s.n, eat: s.eatN ? s.eat / s.eatN : null, dis: s.dis / s.n, min: s.minN ? s.min / s.minN : null }));
  const tagCount = {}; logs.forEach(l => (l.tags || []).forEach(t => tagCount[t] = (tagCount[t] || 0) + 1));
  const topTags = Object.entries(tagCount).sort((a,b) => b[1] - a[1]);
  const scored = logs.filter(l => l.eaten in EATEN_SCORE);
  const avg = a => a.length ? a.reduce((x,y) => x + y, 0) / a.length : null;
  const weekAgo = localDate(new Date(Date.now() - 7*86400000));
  const recentEat = avg(scored.filter(l => l.date > weekAgo).map(l => EATEN_SCORE[l.eaten]));
  const olderEat = avg(scored.filter(l => l.date <= weekAgo).map(l => EATEN_SCORE[l.eaten]));
  // meals from the menu linked to how they went
  const mealScores = {};
  logs.forEach(l => {
    const d = S.days[l.date]; const m = d && d.menu && (d.menu.meals || []).find(x => x.slot === l.slot);
    if (m && l.eaten in EATEN_SCORE){ const k = m.title.split(" + ")[0]; (mealScores[k] = mealScores[k] || []).push(EATEN_SCORE[l.eaten]); }
  });
  const mealAvg = Object.entries(mealScores).filter(([,v]) => v.length >= 2).map(([k,v]) => ({ k, v: avg(v), n: v.length })).sort((a,b) => b.v - a.v);

  const patterns = [], ideas = [], ask = [];
  const withEat = slotsArr.filter(s => s.eat != null && s.n >= 2);
  if (withEat.length >= 2){
    const hard = withEat.slice().sort((a,b) => a.eat - b.eat)[0], easy = withEat.slice().sort((a,b) => b.eat - a.eat)[0];
    if (easy.eat - hard.eat >= 0.2) {
      patterns.push(hard.slot + " is the hardest meal right now. About " + Math.round(hard.eat * 100) + "% of it is usually eaten, against " + Math.round(easy.eat * 100) + "% at " + easy.slot.toLowerCase() + ".");
      ideas.push("Plan " + hard.slot.toLowerCase() + " carefully: use liked foods, serve it at the same time each day, and have a calm activity ready for afterwards.");
    }
  }
  const tense = slotsArr.filter(s => s.n >= 2).sort((a,b) => b.dis - a.dis)[0];
  if (tense && tense.dis >= 2.5){ patterns.push("Distress is highest at " + tense.slot.toLowerCase() + " (average " + tense.dis.toFixed(1) + " out of 5)."); ideas.push("Before " + tense.slot.toLowerCase() + ", try a short wind-down and a heads-up 10 minutes ahead. Keep the conversation off food."); }
  const slow = slotsArr.filter(s => s.min != null && s.n >= 2).sort((a,b) => b.min - a.min)[0];
  if (slow && slow.min > 40){ patterns.push(slow.slot + " takes about " + Math.round(slow.min) + " minutes on average."); ideas.push("Ask your team about a time limit for " + slow.slot.toLowerCase() + ", and what to do if it runs over."); }
  if (recentEat != null && olderEat != null){
    if (recentEat - olderEat >= 0.1) patterns.push("Meals are going better this week than last week. That's real progress worth noticing.");
    else if (olderEat - recentEat >= 0.1){ patterns.push("Meals have been harder this week than last week."); ask.push("Meals have been harder this week. Should we change anything in the plan?"); }
  }
  if (mealAvg.length){
    const best = mealAvg[0], worst = mealAvg[mealAvg.length - 1];
    if (best.v >= 0.75) ideas.push('"' + best.k + '" has gone well ' + best.n + " times. Keep it in the rotation.");
    if (mealAvg.length > 1 && worst.v < 0.6) ideas.push('"' + worst.k + '" has been hard. Try a smaller step, or pair it with a liked food.');
  }
  const TAG_ADVICE = {
    "Very slow": "Slow eating comes up often. Gentle, repeated prompts (\"Next bite\") and an agreed time limit can help.",
    "Cut food small": "Cutting food into tiny pieces comes up often. Serve foods that are harder to pick apart, like sauces mixed in and butter already spread.",
    "Hid or dropped food": "Hidden or dropped food has been noted. Supervise all meals and snacks closely and tell your team.",
    "Bargaining": "Bargaining comes up often. Give one kind, firm answer and don't negotiate portions at the table.",
    "Angry or tearful": "Meals often end in anger or tears. Plan comfort and a calm activity for afterwards, and look after yourself too.",
    "Bathroom after": "Bathroom visits after meals have been noted. Stay together for 30–60 minutes after eating and tell your team.",
    "Moving a lot": "A lot of movement has been noted. Remind them kindly of the team's activity rules, and tell the team.",
    "Asked for reassurance": "Requests for reassurance come up often. Give one short answer, then change the subject.",
    "Tried a feared food": "Feared foods are being tried. That's brave work. Keep the steps small and steady."
  };
  topTags.filter(([t, c]) => c >= 2 && TAG_ADVICE[t]).slice(0, 3).forEach(([t, c]) => { patterns.push('"' + t + '" noted ' + c + " times."); ideas.push(TAG_ADVICE[t]); });
  if (tagCount["Hid or dropped food"] || tagCount["Bathroom after"] || tagCount["Moving a lot"]) ask.push("We've noticed some compensatory behaviours. How should we respond at home?");
  if (slow && slow.min > 40) ask.push("What time limit should we use for meals, and what should we do when it runs over?");

  // safety: repeated refusal or worrying words in notes
  const recent3 = logs.filter(l => l.date >= localDate(new Date(Date.now() - 3*86400000)));
  const nones = recent3.filter(l => l.eaten === "None").length;
  const riskNote = logs.slice(0, 20).find(l => RISK_WORDS.some(w => (l.notes || "").toLowerCase().includes(w)));
  let urgent = "";
  if (nones >= 2) urgent = "Several meals were refused completely in the last few days. Please contact your team today.";
  if (riskNote) urgent = "A recent note mentions something that may need medical attention. Please contact your team today, or call 999 in an emergency.";

  const headline = urgent || patterns[0] || (scored.length ? "About " + Math.round(avg(scored.map(l => EATEN_SCORE[l.eaten])) * 100) + "% of food served was eaten over the last 2 weeks." : "");
  return { headline, patterns, ideas: ideas.slice(0, 5), ask: ask.slice(0, 3), urgent, count: logs.length };
}
function renderInsight(){
  const i = analyse(); const out = $("#insightOut");
  if (!i){ out.innerHTML = '<p class="muted small" style="margin:0">Save at least 3 meal notes and patterns will appear here.</p>'; return; }
  const sec = (t, a) => a && a.length ? '<h4 style="margin:12px 0 4px">' + esc(t) + '</h4><ul>' + a.map(x => '<li>' + esc(x) + '</li>').join("") + '</ul>' : '';
  out.innerHTML = (i.urgent ? '<div class="card danger" style="margin:0 0 8px"><span class="tag danger">Please act on this</span><p>' + esc(i.urgent) + '</p><button class="btn small danger-btn" data-go="urgent">Urgent help</button></div>' : '') +
    sec("What we noticed", i.patterns.length ? i.patterns : ["No strong patterns yet. Keep adding notes."]) + sec("Ideas to try", i.ideas) + sec("Questions for your team", i.ask) +
    '<p class="small muted">Based on ' + i.count + ' notes from the last 2 weeks, worked out on this phone.</p>';
}
let revCtl = null;
$("#aiReview").addEventListener("click", async () => {
  if (!aiOn()) return;
  const logs = allLogs(14);
  if (logs.length < 3){ $("#reviewStatus").textContent = "Save at least 3 meal notes first."; return; }
  const lines = logs.slice(0, 60).map(l => l.date + " " + l.slot + ": eaten " + (l.eaten || "?") + ", distress " + l.distress + "/5" + (l.minutes ? ", " + l.minutes + " min" : "") + (l.tags && l.tags.length ? ", noticed: " + l.tags.join("; ") : "") + (l.notes ? ". Note: " + l.notes.replace(/\s+/g, " ").slice(0, 300) : ""));
  const checks = S.vitals.slice().sort((a,b) => (a.date + a.at).localeCompare(b.date + b.at)).slice(-6).map(v => v.date + ": pulse " + (v.pulse ?? "-") + ", BP " + (v.sys ?? "-") + "/" + (v.dia ?? "-")).join("; ");
  revCtl = new AbortController();
  $("#aiReview").disabled = true; $("#aiReviewStop").hidden = false;
  $("#reviewStatus").textContent = "Claude is reading your notes. This usually takes 20–60 seconds…";
  try {
    S.aiReview = await AI().reviewNotes({ profile: S.profile || {}, slots: slots(), lines, checks, signal: revCtl.signal });
    save(); $("#reviewStatus").textContent = ""; renderAIReview();
  } catch(e){ $("#reviewStatus").textContent = e.message; }
  finally { $("#aiReview").disabled = false; $("#aiReviewStop").hidden = true; revCtl = null; }
});
$("#aiReviewStop").addEventListener("click", () => revCtl && revCtl.abort());
function renderAIReview(){
  const i = S.aiReview; const out = $("#aiReviewOut");
  if (!i){ out.innerHTML = ""; return; }
  const sec = (t, a) => a && a.length ? '<h4 style="margin:12px 0 4px">' + esc(t) + '</h4><ul>' + a.map(x => '<li>' + esc(x) + '</li>').join("") + '</ul>' : '';
  out.innerHTML = '<div class="card accent" style="margin:12px 0 0"><span class="tag">Claude\'s review · ' + esc(fmtDate(String(i.at).slice(0,10))) + '</span>' +
    (i.urgent ? '<div class="card danger" style="margin:8px 0"><span class="tag danger">Please act on this</span><p>' + esc(i.urgentReason || "Something in your notes may need medical attention.") + ' Contact your team today, or call 999 in an emergency.</p></div>' : '') +
    '<p>' + esc(i.summary) + '</p>' + sec("Patterns", i.patterns) + sec("Meal ideas", i.mealIdeas) + sec("Mealtime ideas", i.mealtimeIdeas) + sec("Questions for your team", i.askTeam) +
    '<p class="small muted" style="margin-bottom:0">Written by Claude. Check suggestions with your treatment team.</p></div>';
}

// ---------- CHECKS ----------
$("#vDate").value = TODAY;
$("#saveVital").addEventListener("click", () => {
  const v = { id: "v" + Date.now().toString(36), date: $("#vDate").value || TODAY, at: new Date().toISOString(),
    pulse: num($("#vPulse").value), sys: num($("#vSys").value), dia: num($("#vDia").value), weight: num($("#vWeight").value), height: num($("#vHeight").value), temp: num($("#vTemp").value) };
  if ([v.pulse, v.sys, v.dia, v.weight, v.height, v.temp].every(x => x == null)){ $("#vStatus").textContent = "Enter at least one value."; return; }
  S.vitals.push(v);
  if (!save()) return;
  ["#vPulse","#vSys","#vDia","#vWeight","#vHeight","#vTemp"].forEach(s => $(s).value = "");
  $("#vStatus").textContent = "Saved.";
  renderVitals(); renderToday();
});
function chart(title, series, unit){
  const pts = series.flatMap(s => s.data);
  if (pts.length < 2) return "";
  const W = 600, H = 170, L = 40, R = 12, T = 12, B = 26;
  const dates = [...new Set(pts.map(p => p.date))].sort();
  const vals = pts.map(p => p.v); let lo = Math.min(...vals), hi = Math.max(...vals);
  if (hi - lo < 4){ lo -= 2; hi += 2; } const pad = (hi - lo) * 0.1; lo -= pad; hi += pad;
  const x = d => dates.length === 1 ? L : L + (dates.indexOf(d) / (dates.length - 1)) * (W - L - R);
  const y = v => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const ticks = [lo + pad, (lo + hi) / 2, hi - pad];
  let g = ticks.map(t => '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(t).toFixed(1) + '" y2="' + y(t).toFixed(1) + '" stroke="var(--line)"/><text x="' + (L - 6) + '" y="' + (y(t) + 4).toFixed(1) + '" text-anchor="end">' + Math.round(t) + '</text>').join("");
  g += '<text x="' + L + '" y="' + (H - 6) + '">' + esc(fmtDate(dates[0], {day:"numeric", month:"short"})) + '</text><text x="' + (W - R) + '" y="' + (H - 6) + '" text-anchor="end">' + esc(fmtDate(dates[dates.length-1], {day:"numeric", month:"short"})) + '</text>';
  series.forEach(s => {
    if (!s.data.length) return;
    g += '<path d="' + s.data.map((p, i) => (i ? "L" : "M") + x(p.date).toFixed(1) + " " + y(p.v).toFixed(1)).join(" ") + '" fill="none" stroke="' + s.color + '" stroke-width="2.5" stroke-linejoin="round"/>';
    const lp = s.data[s.data.length - 1];
    g += '<circle cx="' + x(lp.date).toFixed(1) + '" cy="' + y(lp.v).toFixed(1) + '" r="4.5" fill="' + s.color + '"/>';
  });
  const last = series.map(s => s.data.length ? s.data[s.data.length - 1].v : "").filter(v => v !== "").join(" / ");
  return '<div style="margin-bottom:14px"><div style="display:flex;justify-content:space-between;gap:8px"><b>' + esc(title) + '</b><span class="small muted" style="font-variant-numeric:tabular-nums">Latest: ' + esc(last) + ' ' + esc(unit) + '</span></div><svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(title) + ' chart">' + g + '</svg></div>';
}
function renderVitals(){
  const vs = S.vitals.slice().sort((a,b) => (a.date + a.at).localeCompare(b.date + b.at));
  const ser = k => vs.filter(v => v[k] != null).map(v => ({ date: v.date, v: v[k] }));
  const html = chart("Pulse", [{ data: ser("pulse"), color: "var(--accent)" }], "beats/min") +
    chart("Blood pressure", [{ data: ser("sys"), color: "var(--accent)" }, { data: ser("dia"), color: "var(--warm)" }], "mmHg") +
    chart("Weight", [{ data: ser("weight"), color: "var(--accent)" }], "kg") +
    chart("Temperature", [{ data: ser("temp"), color: "var(--warm)" }], "°C");
  $("#charts").innerHTML = html || '<p class="muted small" style="margin:0">Charts appear here once you\'ve saved two or more checks.</p>';
  const f = v => v == null ? "–" : esc(v);
  $("#vTable").innerHTML = vs.length ? '<table><thead><tr><th>Day</th><th>Pulse</th><th>BP</th><th>Weight</th><th>Height</th><th>Temp</th><th></th></tr></thead><tbody>' +
    vs.slice().reverse().map(v => '<tr><td>' + esc(fmtDate(v.date)) + '</td><td>' + f(v.pulse) + '</td><td>' + (v.sys != null || v.dia != null ? f(v.sys) + "/" + f(v.dia) : "–") + '</td><td>' + f(v.weight) + '</td><td>' + f(v.height) + '</td><td>' + f(v.temp) + '</td><td><button class="btn ghost small" data-delv="' + esc(v.id) + '">Delete</button></td></tr>').join("") + '</tbody></table>'
    : '<p class="muted small" style="margin:0">No checks yet.</p>';
  $("#vTable").querySelectorAll("[data-delv]").forEach(b => b.addEventListener("click", () => {
    if (b.dataset.confirm){ S.vitals = S.vitals.filter(v => v.id !== b.dataset.delv); save(); renderVitals(); renderToday(); }
    else { b.dataset.confirm = "1"; b.textContent = "Tap again to delete"; }
  }));
}

// ---------- UPDATES ----------
function renderNews(){
  if (!S.news.length) return;
  $("#newsList").innerHTML = S.news.map(n => {
    const url = /^https:\/\//i.test(n.url || "") ? n.url : "";
    return '<div class="card news"><div class="src">' + esc(n.source || "") + (n.date ? " · " + esc(fmtDate(n.date, {day:"numeric", month:"short", year:"numeric"})) : "") + '</div>' +
      '<h3>' + esc(n.title) + '</h3><p class="small" style="margin:4px 0">' + esc(n.summary) + '</p>' +
      (n.forParents ? '<p class="small" style="margin:6px 0"><b>What it means for parents:</b> ' + esc(n.forParents) + '</p>' : '') +
      (url ? '<a class="small" href="' + esc(url) + '" target="_blank" rel="noopener">Read the source</a>' : '') + '</div>';
  }).join("");
}
async function fetchNews(){
  try {
    const r = await fetch("updates.json?t=" + Date.now(), { cache: "no-store" });
    if (!r.ok) return;
    const data = await r.json();
    const items = (Array.isArray(data) ? data : data.items || []).filter(n => n && n.title).sort((a,b) => String(b.date).localeCompare(String(a.date))).slice(0, 60);
    S.news = items; S.newsFetched = new Date().toISOString(); save();
    renderNews(); renderToday();
  } catch(e){ /* offline: keep what we have */ }
}

// ---------- install hint (iPhone) ----------
(function(){
  const standalone = window.navigator.standalone || window.matchMedia("(display-mode: standalone)").matches;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  let dismissed = false; try { dismissed = localStorage.getItem("alongside:installHint") === "1"; } catch(e){}
  if (ios && !standalone && !dismissed){
    const b = $("#installBanner"); b.hidden = false;
    b.innerHTML = '<b>Install Alongside:</b> tap the Share button <span aria-hidden="true">⬆︎</span> in Safari, then <b>Add to Home Screen</b>. <button class="btn ghost small" id="hideHint" style="margin-left:6px">OK</button>';
    $("#hideHint").addEventListener("click", () => { b.hidden = true; try { localStorage.setItem("alongside:installHint", "1"); } catch(e){} });
  }
})();

// ---------- boot ----------
function renderAll(){ renderToday(); renderProfile(); renderLogForm(); renderLogList(); renderInsight(); renderMenu(); renderVitals(); renderNews(); renderAIReview(); }
renderAll();
if (window.AlongsideAI) refreshAIUI();
const h = location.hash.slice(1); if (h) go(h);
fetchNews();
if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
})();
