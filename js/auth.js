(function () {
  "use strict";

  var USERS_KEY = "stackly.portal.users.v1";
  var SESSION_KEY = "stackly.portal.session.v1";
  var ROLE_LABELS = { admin: "Admin", tenant: "Tenant" };
  var DASHBOARDS = { admin: "admin-dashboard.html", tenant: "tenant-dashboard.html" };
  var SESSION_DURATION = 8 * 60 * 60 * 1000;
  var REMEMBER_DURATION = 30 * 24 * 60 * 60 * 1000;
  var PBKDF2_ITERATIONS = 210000;
  var PASSWORD_REQUIREMENTS = "Use at least 8 characters with uppercase, lowercase, a number, and a special character.";

  var currentScript = document.currentScript;
  var guardRole = currentScript ? currentScript.getAttribute("data-auth-guard") : null;

  function all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function authError(code, message, field) {
    var error = new Error(message);
    error.code = code;
    error.field = field || "";
    return error;
  }

  function normalizeEmail(value) {
    return String(value || "").trim().toLowerCase();
  }

  function validateEmail(value) {
    if (window.StacklyEmail && typeof window.StacklyEmail.validate === "function") {
      return window.StacklyEmail.validate(value);
    }

    var raw = String(value || "");
    var normalized = normalizeEmail(raw);

    if (!normalized) {
      return { valid: false, message: "Enter your email address.", value: "" };
    }

    if (/[^A-Za-z0-9.@]/.test(raw)) {
      return {
        valid: false,
        message: "Use only letters, numbers, @ and . in your email address.",
        value: normalized
      };
    }

    if (!/^[A-Za-z0-9]+(?:\.[A-Za-z0-9]+)*@[A-Za-z0-9]+(?:\.[A-Za-z0-9]+)*\.[A-Za-z]{2,}$/.test(raw)) {
      return {
        valid: false,
        message: "Enter a valid email address, like user@example.com.",
        value: normalized
      };
    }

    return { valid: true, message: "", value: normalized };
  }

  function passwordChecks(value) {
    return {
      length: value.length >= 8 && value.length <= 128,
      upper: /[A-Z]/.test(value),
      lower: /[a-z]/.test(value),
      number: /[0-9]/.test(value),
      special: /[^A-Za-z0-9\s]/.test(value)
    };
  }

  function isStrongPassword(value) {
    var checks = passwordChecks(value);
    return checks.length && checks.upper && checks.lower && checks.number && checks.special;
  }

  function readJson(storage, key) {
    try {
      var raw = storage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function writeJson(storage, key, value) {
    storage.setItem(key, JSON.stringify(value));
  }

  function removeItem(storage, key) {
    try {
      storage.removeItem(key);
    } catch (error) {}
  }

  function loadUsers() {
    try {
      var users = readJson(window.localStorage, USERS_KEY);
      if (!Array.isArray(users)) return [];
      return users.filter(function (user) {
        return user && user.id && user.email && user.role && user.salt && user.hash;
      });
    } catch (error) {
      return [];
    }
  }

  function saveUsers(users) {
    try {
      writeJson(window.localStorage, USERS_KEY, users);
    } catch (error) {
      throw authError("storage", "This browser could not save your account. Check that local storage is enabled and try again.");
    }
  }

  function findUserByEmail(email) {
    var normalized = normalizeEmail(email);
    return loadUsers().find(function (user) {
      return normalizeEmail(user.email) === normalized;
    }) || null;
  }

  function sessionIsValid(session) {
    if (!session || typeof session !== "object") return false;
    if (!session.token || !session.userId || !session.email || !session.role || !session.expiresAt) return false;
    if (!DASHBOARDS[session.role]) return false;
    if (Number(session.expiresAt) <= Date.now()) return false;
    return true;
  }

  function readSession() {
    var stores = [];
    try {
      stores.push(window.sessionStorage);
    } catch (error) {}
    try {
      stores.push(window.localStorage);
    } catch (error) {}

    for (var index = 0; index < stores.length; index += 1) {
      var storage = stores[index];
      var session = readJson(storage, SESSION_KEY);
      if (!session) continue;

      if (sessionIsValid(session)) return session;
      removeItem(storage, SESSION_KEY);
    }

    return null;
  }

  function clearSession() {
    removeItem(window.sessionStorage, SESSION_KEY);
    removeItem(window.localStorage, SESSION_KEY);
  }

  function storeSession(session, remember) {
    var target = remember ? window.localStorage : window.sessionStorage;
    var other = remember ? window.sessionStorage : window.localStorage;

    try {
      writeJson(target, SESSION_KEY, session);
      removeItem(other, SESSION_KEY);
    } catch (error) {
      throw authError("storage", "This browser could not start your session. Check that local storage is enabled and try again.");
    }
  }

  function randomBase64(byteLength) {
    if (!window.crypto || !window.crypto.getRandomValues) {
      throw authError("crypto", "Secure browser features are unavailable. Open the portal over localhost or HTTPS.");
    }

    var bytes = new Uint8Array(byteLength);
    window.crypto.getRandomValues(bytes);
    return bytesToBase64(bytes);
  }

  function bytesToBase64(bytes) {
    var binary = "";
    for (var index = 0; index < bytes.length; index += 1) {
      binary += String.fromCharCode(bytes[index]);
    }
    return window.btoa(binary);
  }

  function base64ToBytes(value) {
    var binary = window.atob(value);
    var bytes = new Uint8Array(binary.length);
    for (var index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }

  async function derivePassword(password, salt) {
    if (!window.crypto || !window.crypto.subtle) {
      throw authError("crypto", "Secure password hashing is unavailable. Open the portal over localhost or HTTPS.");
    }

    var encoder = new TextEncoder();
    var key = await window.crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );

    var bits = await window.crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: base64ToBytes(salt),
        iterations: PBKDF2_ITERATIONS,
        hash: "SHA-256"
      },
      key,
      256
    );

    return bytesToBase64(new Uint8Array(bits));
  }

  function makeUserId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return randomBase64(18).replace(/[+/=]/g, "").slice(0, 24);
  }

  function nameFromEmail(email, role) {
    var local = normalizeEmail(email).split("@")[0];
    var words = local.split(".").filter(Boolean);

    if (!words.length) return (ROLE_LABELS[role] || "Portal") + " User";

    return words.map(function (word) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(" ");
  }

  function createSession(user, remember) {
    var now = Date.now();
    var session = {
      token: randomBase64(32),
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      issuedAt: now,
      expiresAt: now + (remember ? REMEMBER_DURATION : SESSION_DURATION),
      remember: Boolean(remember)
    };

    storeSession(session, Boolean(remember));
    return session;
  }

  function loginRedirect(role) {
    return DASHBOARDS[role] || "login.html";
  }

  function runGuard(role) {
    var session = readSession();

    if (!session) {
      window.location.replace("login.html?role=" + encodeURIComponent(role));
      return false;
    }

    if (session.role !== role) {
      window.location.replace(loginRedirect(session.role));
      return false;
    }

    document.documentElement.classList.remove("auth-checking");
    return true;
  }

  function setText(selector, value) {
    all(selector).forEach(function (element) {
      element.textContent = value;
    });
  }

  function hydrateUser() {
    var session = readSession();
    if (!session) return;

    var parts = String(session.name || "").trim().split(/\s+/);
    var first = parts[0] || "Resident";
    var initials = (parts[0] ? parts[0].charAt(0) : "") + (parts.length > 1 ? parts[parts.length - 1].charAt(0) : "");

    setText("[data-auth-user-name]", session.name);
    setText("[data-auth-user-email]", session.email);
    setText("[data-auth-user-first-name]", first);
    setText("[data-auth-user-initials]", initials.toUpperCase() || "ST");
  }

  function setError(input, message) {
    if (!input) return;
    var field = input.closest(".auth-field");
    input.classList.add("is-invalid");
    input.setAttribute("aria-invalid", "true");
    if (field) {
      field.classList.add("has-error");
      var feedback = field.querySelector(".invalid-feedback");
      if (feedback) feedback.textContent = message;
    }
  }

  function clearError(input) {
    if (!input) return;
    var field = input.closest(".auth-field");
    input.classList.remove("is-invalid");
    input.removeAttribute("aria-invalid");
    if (field) field.classList.remove("has-error");
  }

  function updateEmailError(input, showEmpty) {
    if (!input) return true;

    var result = validateEmail(input.value);
    if (result.valid) {
      clearError(input);
      return true;
    }

    if (showEmpty || input.value.trim()) {
      setError(input, result.message);
    }

    return false;
  }

  function initEmailFeedback(input) {
    if (!input) return;

    input.addEventListener("blur", function () {
      updateEmailError(input, true);
    });

    input.addEventListener("input", function () {
      if (input.classList.contains("is-invalid")) {
        updateEmailError(input, true);
      }
    });
  }

  function clearFormErrors(form) {
    all(".is-invalid", form).forEach(function (input) {
      input.classList.remove("is-invalid");
      input.removeAttribute("aria-invalid");
    });
    all(".has-error", form).forEach(function (field) {
      field.classList.remove("has-error");
    });
  }

  function showAlert(alert, message, tone) {
    if (!alert) return;
    alert.textContent = message;
    alert.classList.toggle("auth-alert--success", tone === "success");
    alert.hidden = false;
  }

  function hideAlert(alert) {
    if (!alert) return;
    alert.hidden = true;
    alert.textContent = "";
    alert.classList.remove("auth-alert--success");
  }

  function setLoading(form, loading) {
    var button = form.querySelector("[data-auth-submit]");
    if (!button) return;
    var label = button.querySelector("[data-submit-label]");

    if (loading) {
      if (label) {
        label.setAttribute("data-idle-label", label.textContent);
        label.textContent = button.getAttribute("data-loading-text") || "Please wait\u2026";
      }
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
      return;
    }

    if (label && label.hasAttribute("data-idle-label")) {
      label.textContent = label.getAttribute("data-idle-label");
      label.removeAttribute("data-idle-label");
    }
    button.disabled = false;
    button.removeAttribute("aria-busy");
  }

  function focusFirstError(form) {
    var first = form.querySelector(".is-invalid");
    if (first) first.focus();
  }

  function selectedRole(form) {
    var selected = form.querySelector('input[name="role"]:checked');
    var role = selected ? selected.value : "tenant";
    return DASHBOARDS[role] ? role : "tenant";
  }

  function updateRoleSelection(role, updateUrl) {
    var form = document.querySelector(".auth-form");
    if (!form) return;

    all('input[name="role"]', form).forEach(function (input) {
      input.checked = input.value === role;
    });

    all("[data-auth-role-link]").forEach(function (link) {
      var base = link.getAttribute("href").split("?")[0];
      link.setAttribute("href", base + (role ? "?role=" + encodeURIComponent(role) : ""));
    });

    if (updateUrl) {
      try {
        var url = new URL(window.location.href);
        url.searchParams.set("role", role);
        window.history.replaceState({}, "", url);
      } catch (error) {}
    }
  }

  function initPasswordToggles() {
    all("[data-password-toggle]").forEach(function (button) {
      var input = document.getElementById(button.getAttribute("data-password-toggle"));
      if (!input) return;

      button.addEventListener("click", function () {
        var reveal = input.type === "password";
        input.type = reveal ? "text" : "password";
        button.setAttribute("aria-pressed", String(reveal));
        button.setAttribute("aria-label", reveal ? "Hide password" : "Show password");

        var showIcon = button.querySelector(".auth-eye--show");
        var hideIcon = button.querySelector(".auth-eye--hide");
        if (showIcon) showIcon.hidden = reveal;
        if (hideIcon) hideIcon.hidden = !reveal;
        input.focus({ preventScroll: true });
      });
    });
  }

  function initRoleLinks() {
    all('input[name="role"]').forEach(function (input) {
      input.addEventListener("change", function () {
        updateRoleSelection(input.value, true);
        var alert = document.querySelector(".auth-alert");
        hideAlert(alert);
      });
    });
  }

  function initFieldCleanup(form, alert) {
    all(".form-control", form).forEach(function (input) {
      input.addEventListener("input", function () {
        if (input.type !== "email" && input.getAttribute("name") !== "password") clearError(input);
        hideAlert(alert);
      });
    });
  }

  function initPasswordFeedback(input) {
    if (!input) return;

    input.addEventListener("blur", function () {
      if (!input.value || isStrongPassword(input.value)) {
        clearError(input);
        return;
      }
      setError(input, PASSWORD_REQUIREMENTS);
    });

    input.addEventListener("input", function () {
      if (input.getAttribute("aria-invalid") !== "true") return;
      if (!input.value || isStrongPassword(input.value)) {
        clearError(input);
        return;
      }
      setError(input, PASSWORD_REQUIREMENTS);
    });
  }

  function initLogin() {
    var form = document.getElementById("loginForm");
    if (!form) return;

    var alert = document.querySelector(".auth-alert");
    var email = document.getElementById("loginEmail");
    var password = document.getElementById("loginPassword");
    var remember = document.getElementById("rememberMe");
    var params = new URLSearchParams(window.location.search);
    var switchMode = params.get("switch") === "1";
    var logoutMode = params.get("logout") === "1";
    var requestedRole = params.get("role") === "admin" ? "admin" : "tenant";

    if (switchMode || logoutMode) clearSession();

    var existing = readSession();
    if (existing && !switchMode && !logoutMode) {
      window.location.replace(loginRedirect(existing.role));
      return;
    }

    updateRoleSelection(requestedRole, false);
    initPasswordToggles();
    initRoleLinks();
    initFieldCleanup(form, alert);
    initEmailFeedback(email);
    initPasswordFeedback(password);

    if (remember) {
      remember.addEventListener("change", function () {
        hideAlert(alert);
        if (remember.checked) clearError(remember);
      });
    }

    if (logoutMode) {
      showAlert(alert, "You have been signed out securely.", "success");
    } else if (params.get("expired") === "1") {
      showAlert(alert, "Your session expired. Sign in again to continue.");
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      hideAlert(alert);
      clearFormErrors(form);

      var valid = true;
      var emailCheck = validateEmail(email.value);
      var emailValue = emailCheck.valid ? emailCheck.value : "";
      var role = selectedRole(form);

      if (!emailCheck.valid) {
        setError(email, emailCheck.message);
        valid = false;
      }

      if (!password.value) {
        setError(password, "Enter your password.");
        valid = false;
      } else if (!isStrongPassword(password.value)) {
        setError(password, PASSWORD_REQUIREMENTS);
        valid = false;
      }

      if (!remember || !remember.checked) {
        setError(remember, "Please select \"Remember me\" to continue.");
        valid = false;
      }

      if (!valid) {
        focusFirstError(form);
        return;
      }

      setLoading(form, true);

      try {
        var account = findUserByEmail(emailValue);
        var sessionUser = {
          id: account ? account.id : makeUserId(),
          name: account && account.name ? account.name : nameFromEmail(emailValue, role),
          email: emailValue,
          role: role
        };

        createSession(sessionUser, Boolean(remember && remember.checked));
        window.location.assign(loginRedirect(role));
      } catch (error) {
        showAlert(alert, error.message || "We could not sign you in. Please try again.");
      } finally {
        setLoading(form, false);
      }
    });
  }

  function initSignup() {
    var form = document.getElementById("signupForm");
    if (!form) return;

    var alert = document.querySelector(".auth-alert");
    var name = document.getElementById("signupName");
    var email = document.getElementById("signupEmail");
    var password = document.getElementById("signupPassword");
    var confirm = document.getElementById("signupConfirm");
    var terms = document.getElementById("signupTerms");
    var params = new URLSearchParams(window.location.search);
    var requestedRole = params.get("role") === "admin" ? "admin" : "tenant";

    updateRoleSelection(requestedRole, false);
    initPasswordToggles();
    initRoleLinks();
    initFieldCleanup(form, alert);
    initEmailFeedback(email);
    initPasswordFeedback(password);

    if (terms) {
      terms.addEventListener("change", function () {
        if (terms.checked) clearError(terms);
        hideAlert(alert);
      });
    }

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      hideAlert(alert);
      clearFormErrors(form);

      var valid = true;
      var nameValue = name.value.trim().replace(/\s+/g, " ");
      var emailCheck = validateEmail(email.value);
      var emailValue = emailCheck.valid ? emailCheck.value : "";
      var role = selectedRole(form);

      if (nameValue.length < 2) {
        setError(name, "Enter your full name.");
        valid = false;
      }

      if (!emailCheck.valid) {
        setError(email, emailCheck.message);
        valid = false;
      }

      if (!password.value) {
        setError(password, "Enter your password.");
        valid = false;
      } else if (!isStrongPassword(password.value)) {
        setError(password, PASSWORD_REQUIREMENTS);
        valid = false;
      }

      if (!confirm.value || confirm.value !== password.value) {
        setError(confirm, confirm.value ? "Passwords do not match." : "Confirm your password.");
        valid = false;
      }

      if (!terms || !terms.checked) {
        if (terms) setError(terms, "Please agree to the Privacy Policy and Terms & Conditions to continue.");
        valid = false;
      }

      if (!valid) {
        focusFirstError(form);
        return;
      }

      setLoading(form, true);

      try {
        if (findUserByEmail(emailValue)) {
          setError(email, "An account with this email already exists.");
          showAlert(alert, "That email is already registered. Sign in instead.");
          focusFirstError(form);
          return;
        }

        var salt = randomBase64(16);
        var hash = await derivePassword(password.value, salt);

        var user = {
          id: makeUserId(),
          name: nameValue,
          email: emailValue,
          role: role,
          salt: salt,
          hash: hash,
          createdAt: new Date().toISOString()
        };

        var users = loadUsers();
        users.push(user);
        saveUsers(users);
        createSession(user, false);
        window.location.assign(loginRedirect(role));
      } catch (error) {
        showAlert(alert, error.message || "We could not create your account. Please try again.");
      } finally {
        setLoading(form, false);
      }
    });
  }

  function initLogout() {
    document.addEventListener("click", function (event) {
      var trigger = event.target.closest("[data-auth-logout]");
      if (!trigger) return;
      event.preventDefault();
      clearSession();
      window.location.replace("login.html?logout=1");
    });
  }

  if (guardRole && DASHBOARDS[guardRole]) {
    runGuard(guardRole);
    window.addEventListener("pageshow", function (event) {
      if (event.persisted) runGuard(guardRole);
    });
  }

  function init() {
    initLogout();

    if (guardRole) hydrateUser();
    if (document.getElementById("loginForm")) initLogin();
    if (document.getElementById("signupForm")) initSignup();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
