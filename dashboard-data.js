// dashboard-data.js
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// UI
const statMock7 = document.getElementById("statMock7");
const statAnsweredTotal = document.getElementById("statAnsweredTotal");
const nextFocusText = document.getElementById("nextFocusText");
const recentPracticeBody = document.getElementById("recentPracticeBody");

function safeText(el, txt) {
  if (!el) return;
  el.textContent = txt;
}

function formatDate(d) {
  // d: JS Date
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function pickNextFocus(summary) {
  // simple rule-based next focus from data (no AI)
  if (summary.mock7 === 0) return "Start 1 mock interview today and review feedback.";
  if (summary.totalAnswered < 10) return "Answer 3 common HR questions and refine 1 STAR story.";
  if (summary.behavioralCount < 2) return "Practice 2 behavioral questions using STAR framework.";
  if (summary.technicalCount < 2) return "Practice 2 technical questions and explain your approach aloud.";
  return "Do 1 mock + improve your weakest answer from the last session.";
}

function classifyType(docData) {
  // We only have mockHistory currently. We'll infer type by fields.
  // If later you add other collections, you can improve this.
  return "Mock";
}

function inferTopic(question) {
  const q = (question || "").toLowerCase();
  if (q.includes("tell me about yourself")) return "Tell me about yourself";
  if (q.includes("strength")) return "Biggest strength";
  if (q.includes("weakness")) return "Biggest weakness";
  if (q.includes("conflict") || q.includes("team")) return "Behavioral";
  if (q.includes("sql") || q.includes("api") || q.includes("react") || q.includes("javascript")) return "Technical";
  return "General";
}

function buildRow({ date, type, topic, note }) {
  return `
    <tr>
      <td>${date}</td>
      <td>${type}</td>
      <td>${topic}</td>
      <td>${note}</td>
    </tr>
  `;
}

async function loadDashboard(uid) {
  // read user's mock history
  const ref = collection(db, "users", uid, "mockHistory");

  // get last 50 for computing stats locally (simple + reliable)
  const q1 = query(ref, orderBy("createdAt", "desc"), limit(50));
  const snap = await getDocs(q1);

  const rows = [];
  let totalAnswered = 0;
  let mock7 = 0;

  let behavioralCount = 0;
  let technicalCount = 0;

  const sevenDaysAgo = daysAgo(7);

  snap.forEach((doc) => {
    const d = doc.data();
    totalAnswered += 1;

    // createdAt can be null if serverTimestamp not resolved yet; fallback
    const created = d.createdAt?.toDate ? d.createdAt.toDate() : new Date();
    if (created >= sevenDaysAgo) mock7 += 1;

    const question = d.question || "";
    const topic = inferTopic(question);

    // simple classification
    const ql = question.toLowerCase();
    if (ql.includes("conflict") || ql.includes("team") || ql.includes("challenge") || ql.includes("failure")) behavioralCount += 1;
    if (ql.includes("react") || ql.includes("javascript") || ql.includes("api") || ql.includes("sql") || ql.includes("database")) technicalCount += 1;

    // recent table row
    rows.push({
      date: formatDate(created),
      type: classifyType(d),
      topic,
      note: (Array.isArray(d.feedback) && d.feedback[0]) ? d.feedback[0] : "—",
    });
  });

  // update cards
  safeText(statMock7, String(mock7));
  safeText(statAnsweredTotal, String(totalAnswered));

  // next focus (rule-based)
  const focus = pickNextFocus({ mock7, totalAnswered, behavioralCount, technicalCount });
  safeText(nextFocusText, focus);

  // table
  if (recentPracticeBody) {
    if (!rows.length) {
      recentPracticeBody.innerHTML = `<tr><td colspan="4">No practice yet. Start a mock interview!</td></tr>`;
    } else {
      recentPracticeBody.innerHTML = rows
        .slice(0, 10)
        .map(r => buildRow(r))
        .join("");
    }
  }
}

onAuthStateChanged(auth, (user) => {
  if (!user) return; // dashboard-auth.js already redirects
  loadDashboard(user.uid).catch((e) => {
    console.error(e);
    safeText(nextFocusText, "Could not load dashboard data.");
    if (recentPracticeBody) {
      recentPracticeBody.innerHTML = `<tr><td colspan="4">Error loading data.</td></tr>`;
    }
  });
});
