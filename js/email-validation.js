(function () {
  "use strict";

  var EMAIL_PATTERN = "[A-Za-z0-9]+(?:\\.[A-Za-z0-9]+)*@[A-Za-z0-9]+(?:\\.[A-Za-z0-9]+)*\\.[A-Za-z]{2,}";
  var EMAIL_REGEX = new RegExp("^" + EMAIL_PATTERN + "$");
  var ALLOWED_REGEX = /^[A-Za-z0-9.@]+$/;

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function validate(value) {
    var raw = String(value || "");
    var normalized = normalize(raw);

    if (!normalized) {
      return { valid: false, message: "Enter your email address.", value: "" };
    }

    if (!ALLOWED_REGEX.test(raw)) {
      return {
        valid: false,
        message: "Use only letters, numbers, @ and . in your email address.",
        value: normalized
      };
    }

    if (!EMAIL_REGEX.test(raw)) {
      return {
        valid: false,
        message: "Enter a valid email address, like user@example.com.",
        value: normalized
      };
    }

    return { valid: true, message: "", value: normalized };
  }

  window.StacklyEmail = {
    pattern: EMAIL_PATTERN,
    normalize: normalize,
    validate: validate
  };
})();
