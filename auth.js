(() => {
  "use strict";

  const sessionKey = "ruffryan13-test-session";
  const rememberKey = "ruffryan13-remembered";
  const gate = document.querySelector("#auth-gate");
  const shell = document.querySelector("#launchpad-shell");
  const form = document.querySelector("#auth-form");
  const identity = document.querySelector("#auth-identity");
  const password = document.querySelector("#auth-password");
  const remember = document.querySelector("#auth-remember");
  const feedback = document.querySelector("#auth-feedback");
  const passwordToggle = document.querySelector("#auth-password-toggle");

  function readRemembered() {
    try {
      return localStorage.getItem(rememberKey) === "ruffryan13";
    } catch (error) {
      return false;
    }
  }

  function hasSession() {
    try {
      return sessionStorage.getItem(sessionKey) === "ruffryan13";
    } catch (error) {
      return false;
    }
  }

  function writeRemembered(shouldRemember) {
    try {
      if (shouldRemember) localStorage.setItem(rememberKey, "ruffryan13");
      else localStorage.removeItem(rememberKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  function setSession(active) {
    try {
      if (active) sessionStorage.setItem(sessionKey, "ruffryan13");
      else sessionStorage.removeItem(sessionKey);
    } catch (error) {
      // A remembered local session still unlocks this visit when session storage is blocked.
    }
  }

  function unlock() {
    gate.hidden = true;
    shell.hidden = false;
    const userButton = document.querySelector(".user-button");
    const userLabel = userButton?.querySelector("span:nth-child(2)");
    if (userLabel) userLabel.textContent = "Signed in";
    userButton?.setAttribute("aria-label", "Ruffryan13 test account signed in");
    document.documentElement.classList.remove("auth-shell-hidden");
    document.dispatchEvent(new CustomEvent("ruffryan13:auth", { detail: { signedIn: true } }));
  }

  function signOut() {
    setSession(false);
    writeRemembered(false);
    document.querySelector("#app-dialog")?.close();
    shell.hidden = true;
    gate.hidden = false;
    const userButton = document.querySelector(".user-button");
    const userLabel = userButton?.querySelector("span:nth-child(2)");
    if (userLabel) userLabel.textContent = "Sign in";
    userButton?.setAttribute("aria-label", "Sign in");
    password.value = "";
    feedback.textContent = "";
    document.documentElement.classList.add("auth-shell-hidden");
    identity.focus();
    document.dispatchEvent(new CustomEvent("ruffryan13:auth", { detail: { signedIn: false } }));
  }

  window.R13Auth = { signOut, isSignedIn: () => hasSession() || readRemembered() };

  passwordToggle.addEventListener("click", () => {
    const visible = password.type === "password";
    password.type = visible ? "text" : "password";
    passwordToggle.textContent = visible ? "Hide" : "Show";
    passwordToggle.setAttribute("aria-pressed", String(visible));
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = identity.value.trim().toLowerCase();
    const validIdentity = value === "ruffryan13" || value === "ruffryan13@localhost";
    if (!validIdentity || password.value !== "1234") {
      feedback.textContent = "The test account details are not accepted.";
      password.select();
      return;
    }
    setSession(true);
    const storageAvailable = writeRemembered(remember.checked);
    feedback.textContent = storageAvailable || !remember.checked
      ? ""
      : "Signed in for this visit; browser storage is unavailable, so it cannot be remembered.";
    unlock();
  });

  if (readRemembered() || hasSession()) {
    setSession(true);
    unlock();
  }

  document.addEventListener("ruffryan13:signout", signOut);
})();
