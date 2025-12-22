import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const list = document.getElementById("historyList");

function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;");
}

onAuthStateChanged(auth, async (user)=>{
  if(!user){
    location.href = "signup.html";
    return;
  }

  const ref = collection(db, "users", user.uid, "mockHistory");
  const qy = query(ref, orderBy("createdAt","desc"), limit(50));
  const snap = await getDocs(qy);

  if(snap.empty){
    list.innerHTML = `<div class="panel pad">No history yet. Start a mock interview.</div>`;
    return;
  }

  list.innerHTML = snap.docs.map(d=>{
    const x = d.data();
    return `
      <div class="panel pad" style="margin-top:12px;">
        <div style="display:flex;justify-content:space-between;gap:10px;">
          <div><b>Score:</b> ${escapeHtml(x.score ?? "-")}/10</div>
          <div style="color:var(--muted);font-size:12px;">${escapeHtml(x.type || "")}</div>
        </div>
        <div class="hr"></div>
        <div><b>Q:</b> ${escapeHtml(x.question || "")}</div>
        <div style="margin-top:6px;"><b>Your A:</b> ${escapeHtml(x.answer || "")}</div>
        <div style="margin-top:6px;"><b>Improved:</b> ${escapeHtml(x.improved_answer || "")}</div>
      </div>
    `;
  }).join("");
});
