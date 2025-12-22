// auth.js
import { auth } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

const el = (id) => document.getElementById(id);

const emailEl = el("email");
const passEl = el("password");

const primaryBtn = el("primaryBtn");
const secondaryBtn = el("secondaryBtn");
const switchLink = el("switchLink");
const switchText = el("switchText");

const title = el("formTitle");
const subtitle = el("formSubtitle");
const badge = el("modeBadge");

const errorBox = el("errorBox");
const okBox = el("okBox");
const googleBtn = el("googleBtn");

let mode = "signup"; // "signup" | "login"

function showError(msg){
  errorBox.style.display = "block";
  errorBox.textContent = msg;
  okBox.style.display = "none";
  okBox.textContent = "";
}
function showOk(msg){
  okBox.style.display = "block";
  okBox.textContent = msg;
  errorBox.style.display = "none";
  errorBox.textContent = "";
}

function setMode(next){
  mode = next;

  if(mode === "signup"){
    badge.textContent = "Sign up";
    title.textContent = "Welcome 👋";
    subtitle.textContent = "Create an account to continue";
    primaryBtn.textContent = "Sign up";
    secondaryBtn.textContent = "Login";
    switchText.textContent = "Already have an account?";
    switchLink.textContent = "Login";
  }else{
    badge.textContent = "Login";
    title.textContent = "Welcome back 👋";
    subtitle.textContent = "Login to continue";
    primaryBtn.textContent = "Login";
    secondaryBtn.textContent = "Sign up";
    switchText.textContent = "Don’t have an account?";
    switchLink.textContent = "Sign up";
  }

  errorBox.style.display = "none";
  okBox.style.display = "none";
}

setMode("signup");

// toggle link
switchLink.addEventListener("click", (e)=>{
  e.preventDefault();
  setMode(mode === "signup" ? "login" : "signup");
});

// Primary action
primaryBtn.addEventListener("click", async ()=>{
  const email = (emailEl.value || "").trim();
  const password = (passEl.value || "").trim();

  if(!email || !password) return showError("Email এবং password দিন.");
  if(password.length < 6) return showError("Password কমপক্ষে 6 characters হতে হবে.");

  primaryBtn.disabled = true;

  try{
    if(mode === "signup"){
      await createUserWithEmailAndPassword(auth, email, password);
      showOk("Account created ✅ Redirecting...");
      location.href = "dashboard.html";
    }else{
      await signInWithEmailAndPassword(auth, email, password);
      showOk("Login success ✅ Redirecting...");
      location.href = "dashboard.html";
    }
  }catch(err){
    showError(err?.message || "Something went wrong.");
  }finally{
    primaryBtn.disabled = false;
  }
});

// Secondary action = opposite
secondaryBtn.addEventListener("click", ()=>{
  setMode(mode === "signup" ? "login" : "signup");
});

// Google login (optional)
googleBtn.addEventListener("click", async ()=>{
  try{
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    showOk("Google login success ✅ Redirecting...");
    location.href = "dashboard.html";
  }catch(err){
    showError(err?.message || "Google login failed.");
  }
});

// If already logged in, go dashboard
onAuthStateChanged(auth, (user)=>{
  if(user){
    // already logged in
    // location.href = "dashboard.html"; // চাইলে auto redirect অন করো
  }
});
