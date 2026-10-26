(function () {
  "use strict";

  var notFoundUrl = "404.html";
  var scopeSelector = ".dash-main, .dash-modal";
  var excludedSelector = ".dash-sidebar, .dash-topbar, .dash-brand";
  var triggerSelector = [
    "a[href]",
    "button",
    "select",
    "summary",
    "[role='button']",
    "input[type='button']",
    "input[type='submit']",
    "input[type='reset']",
    "[data-close-modal]",
    "article",
    "[data-filter-row]",
    "[data-browse-card]",
    "[data-saved-card]",
    "canvas[data-chart]"
  ].join(", ");
  var textFieldSelector = [
    "input:not([type='button']):not([type='submit']):not([type='reset'])",
    "textarea",
    "[contenteditable='true']"
  ].join(", ");

  function inScope(element) {
    return !!(element.closest(scopeSelector) && !element.closest(excludedSelector));
  }

  function routeToNotFound() {
    window.location.assign(new URL(notFoundUrl, window.location.href).href);
  }

  function routeTarget(target) {
    if (!(target instanceof Element) || !inScope(target)) return null;
    if (target.closest(textFieldSelector)) return null;
    return target.closest(triggerSelector);
  }

  Array.prototype.forEach.call(document.querySelectorAll(".dash-main a[href], .dash-modal a[href]"), function (link) {
    if (inScope(link)) link.setAttribute("href", notFoundUrl);
  });

  document.addEventListener("click", function (event) {
    if (!routeTarget(event.target)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    routeToNotFound();
  }, true);

  document.addEventListener("submit", function (event) {
    if (!(event.target instanceof Element) || !inScope(event.target)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    routeToNotFound();
  }, true);

  document.addEventListener("change", function (event) {
    if (!(event.target instanceof Element) || !event.target.matches("select")) return;
    if (!inScope(event.target)) return;
    event.stopImmediatePropagation();
    routeToNotFound();
  }, true);
})();
