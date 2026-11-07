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
$("#menuDate").value = TODAY;
$("#menuDate").addEventListener("change", renderMenu);
let swapSalt = 0;
function recentTitles(date){
  return Object.values(S.days).filter(d => d.menu && d.date !== date && d.date >= localDate(new Date(Date.now() - 3*86400000)))
    .flatMap(d => (d.menu.meals || []).map(m => m.title));
}
$("#genMenu").addEventListener("click", () => {
  if (!S.profile){ $("#menuStatus").innerHTML = 'First <a href="#profile" data-go="profile">set up your child\'s profile</a> so menus fit them.'; return; }
  const date = $("#menuDate").value || TODAY;
  swapSalt++;
  const m = AlongsidePlanner.plan(date, slots(), S.profile, recentTitles(date), swapSalt);
  if (!m.meals.length){ $("#menuStatus").textContent = "No meals fit the profile's allergies and diet. Try loosening them."; return; }
  day(date).menu = m; save();
  $("#menuStatus").textContent = "Menu ready. Check it against your team's plan.";
  renderMenu(); renderToday();
});
function swapMeal(date, slot){
  const d = S.days[date]; if (!d || !d.menu) return;
  swapSalt++;
  const m = AlongsidePlanner.swapOne(date, slot, S.profile || {}, d.menu, swapSalt);
  if (m){ d.menu.meals = d.menu.meals.map(x => x.slot === slot ? m : x); save(); renderMenu(); renderToday(); }
}
function renderMenu(){
  const date = $("#menuDate").value || TODAY; const d = S.days[date];
  const out = $("#menuOut");
  if (!d || !d.menu || !d.menu.meals || !d.menu.meals.length){
    out.innerHTML = '<div class="card"><p class="muted" style="margin:0">No menu for ' + esc(fmtDate(date, {weekday:"long", day:"numeric", month:"long"})) + ' yet. ' + (S.profile ? 'Tap "Make a menu for this day".' : 'Set up the child profile first, then make a menu.') + '</p></div>';
    $("#genMenu").textContent = "Make a menu for this day"; return;
  }
  $("#genMenu").textContent = "Make a different menu";
  const level = PORTION_TEXT[(S.profile && S.profile.portion) || "1"] || "";
  out.innerHTML = (level ? '<div class="banner">' + esc(level) + '</div>' : '') + d.menu.meals.map((m, i) =>
    '<div class="card meal"><h3><span>' + esc(m.slot) + '</span><span class="pill">' + esc(m.title) + '</span></h3>' +
    '<ul class="items">' + (m.items || []).map(it => '<li><span>' + esc(it.food) + '</span><span>' + esc(it.portion) + '</span></li>').join("") + '</ul>' +
    (m.recipe && m.recipe.length ? '<details style="margin:8px 0 0"><summary>Recipe</summary><div class="body"><ol>' + m.recipe.map(s => '<li>' + esc(s) + '</li>').join("") + '</ol></div></details>' : '') +
    (m.tip ? '<p class="small muted" style="margin:8px 0 0">' + esc(m.tip) + '</p>' : '') +
    '<div class="btns"><button class="btn ghost small" data-swap="' + i + '">Swap this</button></div></div>'
  ).join("") + (d.menu.source === "claude" ? '<p class="small muted">This menu was written by Claude. Check it against your team\'s plan.</p>' : '');
  out.querySelectorAll("[data-swap]").forEach(b => b.addEventListener("click", () => swapMeal(date, d.menu.meals[+b.dataset.swap].slot)));
}

// "Ask Claude": copy a ready-made request, open Claude, paste the answer back.
async function copyText(t){
  try { await navigator.clipboard.writeText(t); return true; }
  catch(e){
    const ta = document.createElement("textarea"); ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand("copy"); } catch(_){}
    ta.remove(); return ok;
  }
}
function claudeMenuRequest(date){
  const p = S.profile || {};
  const level = { "1": "standard starting portions", "1.25": "about a quarter more than standard", "1.5": "about half as much again as standard", "2": "about double standard" }[p.portion || "1"];
  return [
    "I'm a parent feeding my child at home during family-based treatment (FBT) for anorexia nervosa. Please write a one-day menu for " + fmtDate(date, {weekday:"long"}) + " with these slots in order: " + slots().join(", ") + ".",
    "Child's age: " + (p.age || "not given") + ". Foods they like: " + (p.likes || "not given") + ".",
    "Foods the illness avoids (include at most ONE, small, alongside a liked food): " + (p.fear || "none") + ".",
    "Never use: " + (p.allergy || "nothing") + ". Family diet: " + (p.diet || "no restriction") + ".",
    "Portions: " + level + ". Treatment team instructions (follow exactly): " + (p.plan || "none") + ".",
    "Rules: full-fat versions only (no light, diet, low-fat or sugar-free); carbohydrate about half of each main meal; dessert after lunch and dinner; each snack has two items; portions in household measures; never mention calories, weight or 'healthy'; simple recipes (max 6 steps).",
    'Reply with ONLY this JSON and nothing else: {"meals":[{"slot":"Breakfast","title":"dish name","items":[{"food":"...","portion":"..."}],"recipe":["step"],"tip":"one short tip for the parent"}]}'
  ].join("\n");
}
$("#askClaudeMenu").addEventListener("click", async () => {
  if (!S.profile){ $("#menuStatus").innerHTML = 'First <a href="#profile" data-go="profile">set up your child\'s profile</a>.'; return; }
  const ok = await copyText(claudeMenuRequest($("#menuDate").value || TODAY));
  $("#pasteBox").hidden = false; $("#pasteText").value = ""; $("#pasteStatus").textContent = "";
  $("#menuStatus").textContent = ok ? "Request copied. Now open Claude and paste it." : "Couldn't copy automatically. Please try again.";
  $("#pasteBox").scrollIntoView({ block: "start" });
});
$("#cancelPaste").addEventListener("click", () => { $("#pasteBox").hidden = true; });
function parseLooseJSON(t){
  t = String(t || "").trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i); if (fence) t = fence[1];
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a < 0 || b <= a) throw new Error("no json");
  return JSON.parse(t.slice(a, b + 1));
}
$("#usePaste").addEventListener("click", () => {
  try {
    const r = parseLooseJSON($("#pasteText").value);
    const meals = (Array.isArray(r.meals) ? r.meals : []).filter(m => m && typeof m === "object").slice(0, 8).map(m => ({
      slot: String(m.slot || ""), title: String(m.title || ""),
      items: (Array.isArray(m.items) ? m.items : []).slice(0, 12).map(i => ({ food: String(i && i.food || ""), portion: String(i && i.portion || "") })),
      recipe: (Array.isArray(m.recipe) ? m.recipe : []).slice(0, 10).map(String), tip: String(m.tip || ""), source: "claude"
    }));
    if (!meals.length) throw new Error("empty");
    const date = $("#menuDate").value || TODAY;
    day(date).menu = { meals, made: new Date().toISOString(), source: "claude" }; save();
    $("#pasteBox").hidden = true; $("#menuStatus").textContent = "Claude's menu saved.";
    renderMenu(); renderToday();
  } catch(e){ $("#pasteStatus").textContent = "That doesn't look like Claude's menu answer. Copy the whole reply and try again."; }
});

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
$("#saveLog").addEventListener("click", () => {
  stopMic();
  const date = $("#logDate").value || TODAY;
  const entry = { at: new Date().toISOString(), slot: $("#logSlot").value, eaten: logEaten || "", minutes: num($("#logMins").value), distress: +$("#logDistress").value, tags: [...logTags], notes: $("#logNotes").value.trim().slice(0, 4000) };
  if (!entry.eaten && !entry.notes && !entry.tags.length){ $("#logStatus").textContent = "Add how much was eaten or a short note first."; return; }
  const d = day(date); d.logs.push(entry);
  if (entry.eaten === "All of it" || entry.eaten === "Most") d.checks[entry.slot] = true;
  if (!save()) return;
  $("#logStatus").textContent = "Saved. Thank you, that was a lot to get through.";
  logEaten = null; logTags = new Set(); $("#logMins").value = ""; $("#logDistress").value = 0; $("#distressVal").textContent = "(0 = calm, 5 = very upset)"; $("#logNotes").value = "";
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
    (l.notes ? '<div class="small">' + esc(l.notes) + '</div>' : '') + '</div>'
  ).join("") : '<p class="muted small" style="margin:0">No notes yet.</p>';
}

// voice input (Safari speech recognition when available; keyboard microphone otherwise)
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec = null, recBase = "";
function stopMic(){ if (rec) { try { rec.stop(); } catch(e){} } }
$("#micBtn").addEventListener("click", () => {
  if (!SR){ $("#logStatus").textContent = "Tap in the notes box, then tap the microphone on your keyboard to speak."; $("#logNotes").focus(); return; }
  if (rec){ stopMic(); return; }
  rec = new SR(); rec.lang = "en-GB"; rec.interimResults = true; rec.continuous = true;
  recBase = $("#logNotes").value ? $("#logNotes").value.replace(/\s*$/, " ") : "";
  rec.onresult = ev => {
    let txt = "";
    for (let i = 0; i < ev.results.length; i++) txt += ev.results[i][0].transcript;
    $("#logNotes").value = recBase + txt;
  };
  rec.onerror = ev => { $("#logStatus").textContent = ev.error === "not-allowed" ? "Microphone access was blocked. You can allow it in your phone's settings, or use the keyboard microphone." : "Voice input stopped. You can tap Speak again."; };
  rec.onend = () => { rec = null; $("#micBtn").classList.remove("recording"); $("#micBtn").setAttribute("aria-pressed", "false"); $("#micLabel").textContent = "Speak"; };
  try {
    rec.start();
    $("#micBtn").classList.add("recording"); $("#micBtn").setAttribute("aria-pressed", "true"); $("#micLabel").textContent = "Stop";
    $("#logStatus").textContent = "Listening… speak your note, then tap Stop.";
  } catch(e){ rec = null; $("#logStatus").textContent = "Voice input isn't available here. Use the microphone on your keyboard instead."; }
});

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
$("#askClaudeReview").addEventListener("click", async () => {
  const logs = allLogs(14);
  if (logs.length < 3){ $("#reviewStatus").textContent = "Save at least 3 meal notes first."; return; }
  const p = S.profile || {};
  const lines = logs.slice(0, 60).map(l => l.date + " " + l.slot + ": eaten " + (l.eaten || "?") + ", distress " + l.distress + "/5" + (l.minutes ? ", " + l.minutes + " min" : "") + (l.tags && l.tags.length ? ", noticed: " + l.tags.join("; ") : "") + (l.notes ? ". Note: " + l.notes.replace(/\s+/g, " ").slice(0, 300) : ""));
  const req = [
    "I'm a parent doing family-based treatment (FBT) at home for my child with anorexia nervosa. Please review my meal diary from the last 2 weeks and give kind, practical, evidence-based suggestions.",
    "Child's age: " + (p.age || "not given") + ". Likes: " + (p.likes || "-") + ". Team instructions: " + (p.plan || "-") + ".",
    "Rules: never suggest less food, skipping meals, lighter foods or more exercise; never set weight targets; don't contradict the treatment team; if anything sounds medically risky, tell me to contact the team or emergency services.",
    "Please give: a 2-sentence summary, patterns you notice, meal ideas, mealtime ideas, and questions to take to our next appointment.",
    "Diary:", ...lines
  ].join("\n");
  const ok = await copyText(req);
  $("#reviewStatus").innerHTML = ok ? 'Your notes have been copied. <a href="https://claude.ai/new" target="_blank" rel="noopener">Open Claude</a>, paste them into a new chat and send.' : "Couldn't copy automatically. Please try again.";
});

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
function renderAll(){ renderToday(); renderProfile(); renderLogForm(); renderLogList(); renderInsight(); renderMenu(); renderVitals(); renderNews(); }
renderAll();
const h = location.hash.slice(1); if (h) go(h);
fetchNews();
if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
})();
