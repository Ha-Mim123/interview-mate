// ===== active nav =====
(function () {
  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("[data-nav]").forEach(a => {
    if (a.getAttribute("href") === path) a.classList.add("active");
  });
})();

// ===== toggle (demo) =====
document.addEventListener("click", (e) => {
  const t = e.target.closest(".toggle");
  if (!t) return;
  t.classList.toggle("on");
});

// ===== Questions page filter (demo) =====
window.setQuestionFilter = function (key) {
  const blocks = document.querySelectorAll("[data-qblock]");
  blocks.forEach(b => {
    const k = b.getAttribute("data-qblock");
    b.style.display = (key === "all" || k === key) ? "block" : "none";
  });

  document.querySelectorAll(".side-link").forEach(x => x.classList.remove("active"));
  const active = document.querySelector(`.side-link[data-filter="${key}"]`);
  if (active) active.classList.add("active");
};

// ===== Resume upload filename (demo) =====
window.bindResumeUpload = function () {
  const input = document.querySelector("#resumeFile");
  const out = document.querySelector("#resumeFilename");
  if (!input || !out) return;

  input.addEventListener("change", () => {
    out.textContent = input.files?.[0]?.name ? input.files[0].name : "No file chosen";
  });
};

// ===== Mock interview (REAL AI via Cloudflare Worker) =====
window.bindMockDemo = function () {
  const startBtn = document.querySelector("#startMockBtn");
  const qText = document.querySelector("#currentQuestion");
  const answerEl = document.querySelector("#answerText");
  const submitBtn = document.querySelector("#submitAnswerBtn");
  const feedbackBox = document.querySelector("#feedbackBox");
  const badge = document.querySelector("#sessionBadge");

  if (!startBtn || !qText || !submitBtn || !answerEl) return;

  // ✅ CHANGE THIS if your deployed URL is different
  const WORKER_EVALUATE_URL = "https://interviewmate-api.interviewmate.workers.dev/evaluate";
  


  const questionBank = {
    "HR / General": [
      "Tell me about yourself.",
      "Why do you want to work here?",
      "What do you know about our company?",
      "Where do you see yourself in 3 years?"
    ],
    "Behavioral": [
      "Tell me about a time you worked under pressure.",
      "Tell me about a time you had a conflict with a coworker.",
      "Tell me about a time you made a mistake and what you learned."
    ],
    "Strength / weakness": [
      "What is your biggest strength?",
      "What is your biggest weakness?",
      "How do you handle feedback?"
    ],
    "Mix of questions": [] // will be created dynamically
  };

  function buildMix(n) {
    const all = [
      ...questionBank["HR / General"],
      ...questionBank["Behavioral"],
      ...questionBank["Strength / weakness"]
    ];
    // simple shuffle
    all.sort(() => Math.random() - 0.5);
    return all.slice(0, n);
  }

  let queue = [];
  let index = 0;

  function setStatus(text) {
    if (badge) badge.textContent = text;
  }

  function renderError(msg) {
    if (!feedbackBox) return;
    feedbackBox.innerHTML = `
      <div class="panel pad" style="margin-top:12px;border:1px solid #ffd0d0;">
        <div class="badge" style="background:#ffe9e9;color:#b42318;">Error</div>
        <div class="hr"></div>
        <div style="color:#2f3442;">${msg}</div>
        <small style="display:block;margin-top:8px;">
          Tip: Open Console (F12) → Network → /evaluate response.
        </small>
      </div>
    `;
  }

  function renderResult(parsed) {
    const score = (parsed && typeof parsed.score !== "undefined") ? parsed.score : "?";
    const feedback = Array.isArray(parsed?.feedback) ? parsed.feedback : [];
    const improved = parsed?.improved_answer || "";

    feedbackBox.innerHTML = `
      <div class="panel pad" style="margin-top:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
          <div class="badge">Score: ${score}/10</div>
          <small>OpenAI via Cloudflare Worker</small>
        </div>
        <div class="hr"></div>
        <ul style="margin:0; padding-left:18px; color:#2f3442;">
          ${feedback.length ? feedback.map(x => `<li>${escapeHtml(String(x))}</li>`).join("") : "<li>No feedback returned.</li>"}
        </ul>
        <div class="hr"></div>
        <div style="color:#2f3442;">
          <b>Improved Answer:</b><br/>
          ${escapeHtml(String(improved))}
        </div>
      </div>
    `;
  }

  function escapeHtml(str) {
    return str
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  async function evaluateWithAI(question, answer) {
    const res = await fetch(WORKER_EVALUATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, answer })
    });

    const text = await res.text();
    let data = {};
    try { data = JSON.parse(text); } catch { }

    if (!res.ok) {
      throw new Error(data?.details || data?.error || text || `Request failed: ${res.status}`);
    }
    return data;
  }


  function nextQuestionOrEnd() {
    index++;
    if (index >= queue.length) {
      qText.textContent = "Round completed ✅";
      submitBtn.disabled = true;
      setStatus("Completed");
      return;
    }
    qText.textContent = queue[index];
    answerEl.value = "";
    setStatus(`Q ${index + 1}/${queue.length}`);
  }

  // Start
  startBtn.addEventListener("click", () => {
    const role = document.querySelector("#roleSelect")?.value || "General";
    const type = document.querySelector("#typeSelect")?.value || "Mix of questions";
    const n = parseInt(document.querySelector("#countSelect")?.value || "3", 10);

    if (feedbackBox) feedbackBox.innerHTML = "";

    if (type === "Mix of questions") {
      queue = buildMix(n);
    } else {
      const pick = questionBank[type] || questionBank["HR / General"];
      queue = pick.slice(0, n);
    }

    index = 0;
    qText.textContent = queue[index] || "Tell me about yourself.";
    answerEl.value = "";
    submitBtn.disabled = false;

    setStatus(`${role} • ${type} • ${n} Q`);
  });


  // Submit → AI
  submitBtn.addEventListener("click", async () => {
    if (!queue.length) return;

    const q = (qText.textContent || "").trim();
    const a = (answerEl.value || "").trim();

    if (!a) {
      alert("Please write an answer first.");
      return;
    }

    // UI state
    submitBtn.disabled = true;
    submitBtn.textContent = "Checking...";
    setStatus("Evaluating...");

    try {
      const out = await evaluateWithAI(q, a); // { raw }
      let parsed = null;

      try {
        parsed = JSON.parse(out.raw);
      } catch (_) {
        // if model returned non-json
        renderError("AI returned invalid JSON. Please try again.");
        console.log("RAW AI:", out.raw);
        return;
      }

      renderResult(parsed);

      // move to next
      submitBtn.textContent = "Submit answer";
      submitBtn.disabled = false;

      // auto next question after showing feedback (optional)
      // comment this out if you want manual next
      setTimeout(() => nextQuestionOrEnd(), 900);

    } catch (e) {
      console.error(e);
      renderError(`AI call failed: ${escapeHtml(String(e.message || e))}`);
      submitBtn.textContent = "Submit answer";
      submitBtn.disabled = false;
      setStatus("Error");
    }

});
};
