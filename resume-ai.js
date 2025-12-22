// resume-ai.js
const WORKER_BASE = "https://interviewmate-api.interviewmate.workers.dev";
const RESUME_URL = `${WORKER_BASE}/resume-evaluate`;

const btn = document.getElementById("analyzeResumeBtn");
const clearBtn = document.getElementById("clearResumeTextBtn");
const roleSel = document.getElementById("targetRole");
const textEl = document.getElementById("resumeText");
const out = document.getElementById("resumeResult");

function escapeHtml(s){
  return String(s || "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function renderError(msg, details){
  out.innerHTML = `
    <div class="panel pad" style="margin-top:12px;border:1px solid #ffd0d0;">
      <div class="badge" style="background:#ffe9e9;color:#b42318;">Error</div>
      <div class="hr"></div>
      <div style="color:#2f3442;">${escapeHtml(msg)}</div>
      ${details ? `<pre style="margin-top:10px;white-space:pre-wrap;color:var(--muted);font-size:12px;">${escapeHtml(details)}</pre>` : ""}
    </div>
  `;
}

function renderResult(r){
  const strengths = Array.isArray(r?.strengths) ? r.strengths : [];
  const issues = Array.isArray(r?.issues) ? r.issues : [];
  const improvements = Array.isArray(r?.improvements) ? r.improvements : [];
  const missing = Array.isArray(r?.ats_keywords_missing) ? r.ats_keywords_missing : [];
  const summary = r?.rewrite_summary || "";

  out.innerHTML = `
    <div class="panel pad" style="margin-top:12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
        <div style="font-weight:900;">Resume Score</div>
        <span class="badge">${escapeHtml(r?.score ?? "?")}/10</span>
      </div>

      <div class="hr"></div>
      <b>Strengths</b>
      <ul style="padding-left:18px; margin-top:6px; color:#2f3442;">
        ${strengths.length ? strengths.map(x=>`<li>${escapeHtml(x)}</li>`).join("") : "<li>—</li>"}
      </ul>

      <b>Issues</b>
      <ul style="padding-left:18px; margin-top:6px; color:#2f3442;">
        ${issues.length ? issues.map(x=>`<li>${escapeHtml(x)}</li>`).join("") : "<li>—</li>"}
      </ul>

      <b>Improvements</b>
      <ul style="padding-left:18px; margin-top:6px; color:#2f3442;">
        ${improvements.length ? improvements.map(x=>`<li>${escapeHtml(x)}</li>`).join("") : "<li>—</li>"}
      </ul>

      <b>Missing ATS Keywords</b>
      <div class="panel soft pad" style="margin-top:8px;">
        ${missing.length ? missing.map(x=>`<span class="badge" style="margin:4px;display:inline-block;">${escapeHtml(x)}</span>`).join("") : "—"}
      </div>

      <div class="hr"></div>
      <b>Rewrite Summary</b>
      <div class="panel soft pad" style="margin-top:8px; color:#2f3442;">${escapeHtml(summary)}</div>
    </div>
  `;
}

clearBtn?.addEventListener("click", () => {
  textEl.value = "";
  out.innerHTML = "";
});

btn?.addEventListener("click", async () => {
  const resumeText = (textEl.value || "").trim();
  if (!resumeText || resumeText.length < 80) {
    alert("Please paste your resume text (at least 80 characters).");
    return;
  }

  out.innerHTML = `<div class="panel pad" style="margin-top:12px;">Analyzing with AI...</div>`;
  btn.disabled = true;

  try {
    const res = await fetch(RESUME_URL, {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({
        targetRole: roleSel.value,
        resumeText: resumeText.slice(0, 18000)
      }),
    });

    const dataText = await res.text();
    let data = {};
    try { data = JSON.parse(dataText); } catch {}

    if (!res.ok) {
      renderError(data?.error || "Request failed", data?.details || dataText);
      return;
    }

    let parsed;
    try { parsed = JSON.parse(data.raw); }
    catch {
      renderError("AI returned invalid JSON.", data.raw || "");
      return;
    }

    renderResult(parsed);
  } catch (e) {
    renderError("Network error", String(e));
  } finally {
    btn.disabled = false;
  }
});
