// dashboard-auth.js
import { auth } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

const userNameEl = document.getElementById("userName");
const userEmailEl = document.getElementById("userEmail");
const userPill = document.getElementById("userPill");
const userDropdown = document.getElementById("userDropdown");
const logoutBtn = document.getElementById("logoutBtn");

// dropdown toggle
userPill.addEventListener("click", () => {
  userDropdown.classList.toggle("open");
});

// click outside -> close
document.addEventListener("click", (e) => {
  if (!e.target.closest(".userwrap")) userDropdown.classList.remove("open");
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  location.href = "login.html"; // অথবা signup.html
});

// ✅ protect dashboard: login না থাকলে redirect
onAuthStateChanged(auth, (user) => {
  if (!user) {
    location.href = "signup.html";
    return;
  }

  const displayName =
    user.displayName ||
    (user.email ? user.email.split("@")[0] : "User");

  userNameEl.textContent = displayName.toUpperCase();
  userEmailEl.textContent = user.email || "—";
});
