// questions-ai.js
const WORKER_BASE = "https://interviewmate-api.interviewmate.workers.dev";
const SEARCH_URL = `${WORKER_BASE}/qbank-search`;

const qSearch = document.getElementById("qSearch");
const qRole = document.getElementById("qRole");
const qDifficulty = document.getElementById("qDifficulty");
const qCount = document.getElementById("qCount");
const generateBtn = document.getElementById("generateBtn");
const clearBtn = document.getElementById("clearBtn");
const statusLine = document.getElementById("statusLine");
const results = document.getElementById("results");

function escapeHtml(s){
  return String(s||"")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function setStatus(t){
  if(statusLine) statusLine.textContent = t;
}

function renderEmpty(){
  results.innerHTML = `
    <div class="panel pad">
      <div class="badge">No results</div>
      <div class="hr"></div>
      <div class="muted">Try another keyword (example: "teamwork conflict", "React hooks", "SQL join").</div>
    </div>
  `;
}

function renderCards(list){
  results.innerHTML = list.map((r, idx) => {
    const tips = Array.isArray(r.tips) ? r.tips : [];
    return `
      <div class="panel qcard">
        <div class="qmeta">
          <span class="badge">${escapeHtml(r.category || "other")}</span>
          <span class="badge">#${idx + 1}</span>
        </div>

        <div style="margin-top:10px;font-weight:900;font-size:16px;">
          ${escapeHtml(r.question || "")}
        </div>

        <div class="divider"></div>

        <div style="font-weight:900;">Sample answer</div>
        <div class="answerBox" style="margin-top:8px;color:#2f3442 (var);">
          ${escapeHtml(r.sample_answer || "—")}
        </div>

        <div class="divider"></div>

        <div style="font-weight:900;">Tips</div>
        <ul class="tips" style="color:#2f3442;">
          ${tips.length ? tips.map(t => `<li>${escapeHtml(t)}</li>`).join("") : "<li>—</li>"}
        </ul>

        <div class="divider"></div>

        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button class="btn primary" type="button"
            data-use="${escapeHtml(r.question || "")}">
            Use in mock
          </button>
          <button class="btn" type="button"
            data-copy="${escapeHtml(r.sample_answer || "")}">
            Copy answer
          </button>
        </div>
      </div>
    `;
  }).join("");

  // bind buttons
  results.querySelectorAll("button[data-use]").forEach(btn => {
    btn.addEventListener("click", () => {
      const question = btn.getAttribute("data-use") || "";
      // store for mock page to read
      localStorage.setItem("im_prefill_question", question);
      location.href = "mock.html";
    });
  });

  results.querySelectorAll("button[data-copy]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const txt = btn.getAttribute("data-copy") || "";
      try{
        await navigator.clipboard.writeText(txt);
        setStatus("Copied sample answer ✅");
      }catch{
        setStatus("Copy failed (browser permission).");
      }
    });
  });
}

async function postJSON(url, body){
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let data = {};
  try { data = JSON.parse(text); } catch {}

  if(!res.ok){
    throw new Error(data?.error || data?.details || text || `HTTP ${res.status}`);
  }
  return data;
}

async function generate(){
  const query = (qSearch.value || "").trim();
  if(!query) return alert("Type a keyword/topic first.");

  generateBtn.disabled = true;
  setStatus("Generating questions...");

  try{
    const out = await postJSON(SEARCH_URL, {
      query,
      role: qRole.value,
      difficulty: qDifficulty.value,
      n: Number(qCount.value || 5),
    });

    let parsed;
    try { parsed = JSON.parse(out.raw); }
    catch { throw new Error("AI returned invalid JSON."); }

    const list = Array.isArray(parsed?.results) ? parsed.results : [];
    if(!list.length){
      renderEmpty();
      setStatus("No results. Try a different keyword.");
      return;
    }

    renderCards(list);
    setStatus(`Generated ${list.length} results for: ${parsed.query || query}`);
  } catch(e){
    console.error(e);
    results.innerHTML = `
      <div class="panel pad" style="border:1px solid #ffd0d0;">
        <div class="badge" style="background:#ffe9e9;color:#b42318;">Error</div>
        <div class="hr"></div>
        <div>${escapeHtml(String(e.message || e))}</div>
      </div>
    `;
    setStatus("Error.");
  } finally {
    generateBtn.disabled = false;
  }
}

generateBtn.addEventListener("click", generate);
clearBtn.addEventListener("click", () => {
  qSearch.value = "";
  results.innerHTML = "";
  setStatus("Cleared.");
});

qSearch.addEventListener("keydown", (e) => {
  if(e.key === "Enter") generate();
});
