// roadmap-ai.js

// 🔧 তোমার Cloudflare Worker base URL এখানে দাও
const WORKER_BASE = "https://interviewmate-api.interviewmate.workers.dev";
// const WORKER_EVALUATE_URL = "https://interviewmate-api.interviewmate.workers.dev/evaluate"; // change this
const ENDPOINT = `${WORKER_BASE}/roadmap`;

const PLAN_KEY = "im_roadmap_plan_v1";       // stores AI plan
const PROGRESS_KEY = "im_roadmap_progress_v1"; // stores done/note

const els = {
  title: document.getElementById("rmTitle"),
  summary: document.getElementById("rmSummary"),
  root: document.getElementById("roadmapRoot"),
  progressFill: document.getElementById("progressFill"),
  progressBadge: document.getElementById("progressBadge"),
  doneCount: document.getElementById("doneCount"),
  statusText: document.getElementById("statusText"),

  role: document.getElementById("roleSelect"),
  level: document.getElementById("levelSelect"),
  weeks: document.getElementById("weeksSelect"),
  goal: document.getElementById("goalInput"),

  generateBtn: document.getElementById("generateBtn"),
  resetProgressBtn: document.getElementById("resetProgressBtn"),
};

function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || "") ?? fallback; }
  catch { return fallback; }
}
function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function setStatus(t) { els.statusText.textContent = t; }

function allItems(plan) {
  return (plan?.plan || []).flatMap(w => w.items || []);
}

function updateProgress(plan) {
  const progress = loadJSON(PROGRESS_KEY, {});
  const items = allItems(plan);
  const total = items.length;
  const done = items.filter(it => progress[it.id]?.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  els.progressFill.style.width = pct + "%";
  els.progressBadge.textContent = pct + "%";
  els.doneCount.textContent = `${done}/${total} done`;
}

function escapeHtml(str) {
  return (str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function render(plan) {
  els.root.innerHTML = "";

  els.title.textContent = plan?.title || "Interview Roadmap";
  els.summary.textContent = plan?.summary || "Generated roadmap.";

  const progress = loadJSON(PROGRESS_KEY, {});

  (plan?.plan || []).forEach((weekBlock) => {
    const weekCard = document.createElement("div");
    weekCard.className = "panel rm-week";

    weekCard.innerHTML = `
      <h3 class="h2" style="margin:0;">${escapeHtml(weekBlock.week || "")}</h3>
      <div class="p" style="margin-top:6px;">Focus: ${escapeHtml(weekBlock.focus || "")}</div>
      <div class="rm-list" style="display:grid;gap:10px;margin-top:10px;"></div>
    `;

    const list = weekCard.querySelector(".rm-list");

    (weekBlock.items || []).forEach((it) => {
      const done = !!progress[it.id]?.done;
      const note = progress[it.id]?.note || "";

      const row = document.createElement("div");
      row.className = "rm-item";
      row.innerHTML = `
        <input type="checkbox" data-id="${escapeHtml(it.id)}" ${done ? "checked" : ""}/>
        <div style="flex:1;">
          <div class="rm-title">
            ${escapeHtml(it.title || "")}
            <span class="badge" style="margin-left:8px;">${escapeHtml(it.tag || "other")}</span>
          </div>
          <div class="rm-desc">${escapeHtml(it.desc || "")}</div>
          <textarea class="rm-note" rows="2" data-note="${escapeHtml(it.id)}" placeholder="Add your note...">${escapeHtml(note)}</textarea>
        </div>
      `;
      list.appendChild(row);
    });

    els.root.appendChild(weekCard);
  });

  bindProgressEvents(plan);
  updateProgress(plan);
}

function bindProgressEvents(plan) {
  const progress = loadJSON(PROGRESS_KEY, {});

  document.querySelectorAll('.rm-item input[type="checkbox"]').forEach((cb) => {
    cb.addEventListener("change", (e) => {
      const id = e.target.dataset.id;
      progress[id] = progress[id] || {};
      progress[id].done = e.target.checked;
      saveJSON(PROGRESS_KEY, progress);
      updateProgress(plan);
    });
  });

  document.querySelectorAll(".rm-note").forEach((ta) => {
    ta.addEventListener("input", (e) => {
      const id = e.target.dataset.note;
      progress[id] = progress[id] || {};
      progress[id].note = e.target.value;
      saveJSON(PROGRESS_KEY, progress);
    });
  });
}

async function generate() {
  setStatus("Generating...");
  els.generateBtn.disabled = true;

  const payload = {
    role: els.role.value,
    level: els.level.value,
    weeks: Number(els.weeks.value),
    goal: (els.goal.value || "").trim() || "Crack interviews and get a job",
  };

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus("Error");
      els.root.innerHTML = `<div class="panel pad">Error: ${escapeHtml(data?.error || "Failed")}</div>`;
      return;
    }

    // worker returns { raw: "JSON_STRING" }
    let plan;
    try { plan = JSON.parse(data.raw); }
    catch { plan = { title: "Interview Roadmap", summary: "AI returned invalid JSON", weeks: payload.weeks, plan: [] }; }

    // Save plan (so refresh এ reload হবে)
    saveJSON(PLAN_KEY, plan);

    // optional: progress reset when new plan generated
    // localStorage.removeItem(PROGRESS_KEY);

    render(plan);
    setStatus("Ready");
  } catch (err) {
    setStatus("Error");
    els.root.innerHTML = `<div class="panel pad">Error: ${escapeHtml(String(err))}</div>`;
  } finally {
    els.generateBtn.disabled = false;
  }
}

function init() {
  // Load last plan if exists
  const existing = loadJSON(PLAN_KEY, null);
  if (existing?.plan) {
    render(existing);
    setStatus("Ready");
  } else {
    setStatus("Idle");
  }

  els.generateBtn.addEventListener("click", generate);

  els.resetProgressBtn.addEventListener("click", () => {
    localStorage.removeItem(PROGRESS_KEY);
    const plan = loadJSON(PLAN_KEY, { plan: [] });
    render(plan);
  });
}

init();
