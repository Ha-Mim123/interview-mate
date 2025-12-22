// login.js
import { auth } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

const form = document.getElementById("loginForm");
const emailEl = document.getElementById("email");
const passEl = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const forgotBtn = document.getElementById("forgotBtn");
const msgOk = document.getElementById("msgOk");
const msgErr = document.getElementById("msgErr");

function showErr(text){
  msgErr.style.display = "block";
  msgErr.textContent = text;
  msgOk.style.display = "none";
  msgOk.textContent = "";
}
function showOk(text){
  msgOk.style.display = "block";
  msgOk.textContent = text;
  msgErr.style.display = "none";
  msgErr.textContent = "";
}

function humanError(code){
  // common firebase auth errors
  const map = {
    "auth/invalid-email": "Email ভুল আছে।",
    "auth/user-not-found": "এই email দিয়ে account পাওয়া যায়নি। আগে Sign up করো।",
    "auth/wrong-password": "Password ভুল। আবার চেষ্টা করো।",
    "auth/invalid-credential": "Email/Password ঠিক নেই।",
    "auth/too-many-requests": "অনেকবার চেষ্টা হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করো।",
    "auth/network-request-failed": "Network সমস্যা। ইন্টারনেট চেক করো।",
  };
  return map[code] || code;
}

// already logged in -> dashboard
onAuthStateChanged(auth, (user) => {
  if (user) location.href = "dashboard.html";
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  msgErr.style.display = "none";
  msgOk.style.display = "none";

  const email = (emailEl.value || "").trim();
  const password = (passEl.value || "").trim();

  if(!email || !password){
    showErr("Email এবং Password দুটোই লাগবে।");
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = "Logging in...";

  try{
    await signInWithEmailAndPassword(auth, email, password);
    showOk("Login successful! Redirecting...");
    location.href = "dashboard.html";
  }catch(err){
    showErr("Firebase: " + humanError(err.code || err.message));
  }finally{
    loginBtn.disabled = false;
    loginBtn.textContent = "Login";
  }
});

forgotBtn.addEventListener("click", async () => {
  const email = (emailEl.value || "").trim();
  if(!email){
    showErr("Password reset করতে হলে আগে email লিখো।");
    return;
  }
  try{
    await sendPasswordResetEmail(auth, email);
    showOk("Password reset email পাঠানো হয়েছে ✅ ইনবক্স/স্প্যাম চেক করো।");
  }catch(err){
    showErr("Firebase: " + humanError(err.code || err.message));
  }
});
