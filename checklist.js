// checklist.js
const STORAGE_KEY = "im_checklist_v1";

const DATA = [
  {
    title: "Resume & Profile",
    tag: "resume",
    items: [
      { id: "r-1", title: "1-page resume (or 2-page if experienced)", desc: "Clear sections: Summary, Skills, Experience/Projects, Education." },
      { id: "r-2", title: "Add measurable impact", desc: "Numbers like %, time saved, users, revenue, performance." },
      { id: "r-3", title: "Fix formatting", desc: "Consistent font, spacing, headings, bullet style." },
      { id: "r-4", title: "Update links", desc: "GitHub, portfolio, live demos, LinkedIn — all working." },
    ],
  },
  {
    title: "HR Essentials",
    tag: "hr",
    items: [
      { id: "h-1", title: "Tell me about yourself (60–90s)", desc: "Past → present → why this role." },
      { id: "h-2", title: "Why this company?", desc: "Mission/product + your fit + impact." },
      { id: "h-3", title: "Strength & weakness", desc: "Real example + what you improved." },
      { id: "h-4", title: "Salary expectation script", desc: "Range + value + flexibility." },
    ],
  },
  {
    title: "Behavioral (STAR)",
    tag: "behavioral",
    items: [
      { id: "b-1", title: "6 STAR stories prepared", desc: "Conflict, failure, teamwork, leadership, deadline, learning." },
      { id: "b-2", title: "Practice storytelling", desc: "Record yourself 10–15 min/day." },
      { id: "b-3", title: "Communication checklist", desc: "Short sentences, structured points, confident closing." },
      { id: "b-4", title: "Questions to ask interviewer", desc: "Team, success metrics, challenges, growth." },
    ],
  },
  {
    title: "Technical Prep",
    tag: "technical",
    items: [
      { id: "t-1", title: "Core concepts revised", desc: "FE: JS/DOM/HTTP/async. BE: API/DB/auth/caching." },
      { id: "t-2", title: "Top 20 interview Q&A ready", desc: "Short answers + 1 example each." },
      { id: "t-3", title: "Debug practice", desc: "Explain root cause + fix + prevention." },
      { id: "t-4", title: "Mini design thinking", desc: "Explain architecture + tradeoffs + improvements." },
    ],
  },
  {
    title: "Projects & Portfolio",
    tag: "projects",
    items: [
      { id: "p-1", title: "Pick 2–3 projects to present", desc: "Problem → solution → impact → your role." },
      { id: "p-2", title: "Prepare project deep-dive", desc: "Architecture diagram + stack + challenges + results." },
      { id: "p-3", title: "Clean GitHub repos", desc: "README, screenshots, run steps, meaningful commits." },
      { id: "p-4", title: "Deployment ready", desc: "Live demo link works (Netlify/Vercel/etc.)." },
    ],
  },
];

const root = document.getElementById("checklistRoot");
const progressFill = document.getElementById("progressFill");
const progressBadge = document.getElementById("progressBadge");
const doneCount = document.getElementById("doneCount");
const statusText = document.getElementById("statusText");
const resetBtn = document.getElementById("resetBtn");

function loadState(){
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
  catch { return {}; }
}
function saveState(s){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

function escapeHtml(str){
  return String(str || "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function getAllItems(){
  return DATA.flatMap(sec => sec.items);
}

function updateProgress(){
  const state = loadState();
  const all = getAllItems();
  const total = all.length;
  const done = all.filter(it => state[it.id]?.done).length;
  const pct = total ? Math.round((done/total)*100) : 0;

  progressFill.style.width = pct + "%";
  progressBadge.textContent = pct + "%";
  doneCount.textContent = `${done}/${total} done`;
}

function setActiveChip(tag){
  document.querySelectorAll(".chip").forEach(c => {
    c.classList.toggle("active", c.dataset.filter === tag);
  });
}

function render(filter="all"){
  const state = loadState();
  root.innerHTML = "";

  DATA.forEach(sec => {
    const secCard = document.createElement("div");
    secCard.className = "panel section";

    secCard.innerHTML = `
      <h3 class="h2">${escapeHtml(sec.title)} <span class="badge" style="margin-left:8px;">${escapeHtml(sec.tag)}</span></h3>
      <div class="p" style="margin-top:6px;">Tick tasks and add your notes.</div>
      <div class="secList"></div>
    `;

    const list = secCard.querySelector(".secList");

    sec.items.forEach(it => {
      if(filter !== "all" && sec.tag !== filter) return;

      const done = !!state[it.id]?.done;
      const note = state[it.id]?.note || "";

      const row = document.createElement("div");
      row.className = "item";
      row.innerHTML = `
        <input type="checkbox" data-id="${escapeHtml(it.id)}" ${done ? "checked" : ""}/>
        <div style="flex:1;">
          <div class="title">${escapeHtml(it.title)}</div>
          <div class="desc">${escapeHtml(it.desc)}</div>
          <textarea class="note" rows="2" placeholder="Add note..." data-note="${escapeHtml(it.id)}">${escapeHtml(note)}</textarea>
        </div>
      `;
      list.appendChild(row);
    });

    // show section only if it has items in this filter
    if(list.children.length > 0){
      root.appendChild(secCard);
    }
  });

  bindEvents();
  updateProgress();
}

function bindEvents(){
  const state = loadState();

  document.querySelectorAll('.item input[type="checkbox"]').forEach(cb => {
    cb.addEventListener("change", (e) => {
      const id = e.target.dataset.id;
      state[id] = state[id] || {};
      state[id].done = e.target.checked;
      saveState(state);
      updateProgress();
    });
  });

  document.querySelectorAll(".note").forEach(ta => {
    ta.addEventListener("input", (e) => {
      const id = e.target.dataset.note;
      state[id] = state[id] || {};
      state[id].note = e.target.value;
      saveState(state);
    });
  });
}

function currentFilter(){
  const active = document.querySelector(".chip.active");
  return active ? active.dataset.filter : "all";
}

document.querySelectorAll(".chip").forEach(chip => {
  chip.addEventListener("click", () => {
    setActiveChip(chip.dataset.filter);
    render(chip.dataset.filter);
    statusText.textContent = "Filtered";
  });
});

resetBtn.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  render(currentFilter());
  statusText.textContent = "Reset";
});

render("all");
