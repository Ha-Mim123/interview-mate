// signup.js
import { auth } from "./firebase-config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

const form = document.getElementById("signupForm");
const emailEl = document.getElementById("email");
const passEl = document.getElementById("password");
const errorBox = document.getElementById("errorBox");
const btn = document.getElementById("signupBtn");

function niceError(err) {
  const code = err?.code || "";
  if (code.includes("auth/email-already-in-use")) return "This email is already used. Please login instead.";
  if (code.includes("auth/invalid-email")) return "Invalid email address.";
  if (code.includes("auth/weak-password")) return "Password is too weak. Use 6+ characters.";
  return err?.message || "Something went wrong. Try again.";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorBox.textContent = "";
  btn.disabled = true;
  btn.textContent = "Creating account...";

  const email = emailEl.value.trim();
  const password = passEl.value.trim();

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    // ✅ signup done → dashboard
    location.href = "dashboard.html";
  } catch (err) {
    errorBox.textContent = niceError(err);
  } finally {
    btn.disabled = false;
    btn.textContent = "Sign up";
  }
});
