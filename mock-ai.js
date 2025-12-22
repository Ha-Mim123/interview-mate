import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const WORKER_BASE = "https://interviewmate-api.interviewmate.workers.dev";
const EVAL_URL = `${WORKER_BASE}/evaluate`;
const Q_URL = `${WORKER_BASE}/question`;

let currentUser = null;
let askedQuestions = [];
let totalQuestions = 3;
let index = 0;
let role = "General HR / any role";
let type = "Mix of questions";

const startBtn = document.querySelector("#startMockBtn");
const qText = document.querySelector("#currentQuestion");
const answerEl = document.querySelector("#answerText");
const submitBtn = document.querySelector("#submitAnswerBtn");
const feedbackBox = document.querySelector("#feedbackBox");
const badge = document.querySelector("#sessionBadge");

function setStatus(t){ if(badge) badge.textContent = t; }

function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function renderError(msg){
  feedbackBox.innerHTML = `
    <div class="panel pad" style="margin-top:12px;border:1px solid #ffd0d0;">
      <div class="badge" style="background:#ffe9e9;color:#b42318;">Error</div>
      <div class="hr"></div>
      <div style="color:#2f3442;">${escapeHtml(msg)}</div>
    </div>
  `;
}

function renderResult(parsed){
  const score = (parsed && typeof parsed.score !== "undefined") ? parsed.score : "?";
  const feedback = Array.isArray(parsed?.feedback) ? parsed.feedback : [];
  const improved = parsed?.improved_answer || "";

  feedbackBox.innerHTML = `
    <div class="panel pad" style="margin-top:12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
        <div class="badge">Score: ${score}/10</div>
        <small>AI via Cloudflare Worker</small>
      </div>
      <div class="hr"></div>
      <ul style="margin:0; padding-left:18px; color:#2f3442;">
        ${feedback.length ? feedback.map(x=>`<li>${escapeHtml(x)}</li>`).join("") : "<li>No feedback returned.</li>"}
      </ul>
      <div class="hr"></div>
      <div style="color:#2f3442;">
        <b>Improved Answer:</b><br/>
        ${escapeHtml(improved)}
      </div>
    </div>
  `;
}

async function postJSON(url, body){
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  let data = {};
  try { data = JSON.parse(text); } catch {}
  if(!res.ok){
    throw new Error(data?.error || data?.details || text || `HTTP ${res.status}`);
  }
  return data;
}

async function getNextQuestion(){
  const out = await postJSON(Q_URL, {
    role, type,
    difficulty: "normal",
    asked: askedQuestions
  });

  if(!out?.question) throw new Error("AI did not return a question.");
  askedQuestions.push(out.question);
  return out.question;
}

async function saveHistory({question, answer, score, feedback, improved_answer}){
  if(!currentUser) return;

  const ref = collection(db, "users", currentUser.uid, "mockHistory");
  await addDoc(ref, {
    role,
    type,
    question,
    answer,
    score: Number(score ?? 0),
    feedback: Array.isArray(feedback) ? feedback : [],
    improved_answer: improved_answer || "",
    createdAt: serverTimestamp()
  });
}

async function startRound(){
  role = document.querySelector("#roleSelect")?.value || role;
  type = document.querySelector("#typeSelect")?.value || type;
  totalQuestions = parseInt(document.querySelector("#countSelect")?.value || "3", 10);

  askedQuestions = [];
  index = 0;
  feedbackBox.innerHTML = "";
  submitBtn.disabled = true;
  answerEl.value = "";

  setStatus("Loading question...");
  const q = await getNextQuestion();
  qText.textContent = q;
  submitBtn.disabled = false;
  setStatus(`Q ${index+1}/${totalQuestions}`);
}

async function submitAnswer(){
  const q = (qText.textContent || "").trim();
  const a = (answerEl.value || "").trim();
  if(!a) return alert("Please write an answer first.");

  submitBtn.disabled = true;
  submitBtn.textContent = "Checking...";
  setStatus("Evaluating...");

  try{
    const out = await postJSON(EVAL_URL, { question: q, answer: a });

    let parsed;
    try { parsed = JSON.parse(out.raw); }
    catch { throw new Error("AI returned invalid JSON."); }

    renderResult(parsed);

    // Save history
    await saveHistory({
      question: q,
      answer: a,
      score: parsed.score,
      feedback: parsed.feedback,
      improved_answer: parsed.improved_answer
    });

    // Next
    index++;
    if(index >= totalQuestions){
      qText.textContent = "Round completed ✅";
      submitBtn.disabled = true;
      setStatus("Completed");
      return;
    }

    answerEl.value = "";
    submitBtn.textContent = "Submit answer";
    submitBtn.disabled = false;

    setStatus("Loading next...");
    const nq = await getNextQuestion();
    qText.textContent = nq;
    setStatus(`Q ${index+1}/${totalQuestions}`);

  }catch(e){
    console.error(e);
    renderError(String(e.message || e));
    submitBtn.textContent = "Submit answer";
    submitBtn.disabled = false;
    setStatus("Error");
  }
}

onAuthStateChanged(auth, (user)=>{
  if(!user){
    // login না থাকলে mock page protect
    location.href = "signup.html";
    return;
  }
  currentUser = user;
});

startBtn.addEventListener("click", ()=> startRound().catch(err=>renderError(err.message)));
submitBtn.addEventListener("click", ()=> submitAnswer());
