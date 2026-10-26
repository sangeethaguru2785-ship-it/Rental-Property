(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var toastTimer = null;
  var closeModalHandler = null;
  var closePopoversHandler = null;

  function all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function isTypingTarget(target) {
    if (!target) return false;
    return (
      target.isContentEditable ||
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT"
    );
  }

  function showToast(title, message) {
    var toast = document.getElementById("dashToast");
    if (!toast) return;

    var titleElement = toast.querySelector("[data-toast-title]");
    var messageElement = toast.querySelector("[data-toast-message]");

    if (titleElement) titleElement.textContent = title || "Saved";
    if (messageElement) messageElement.textContent = message || "Your changes are up to date.";

    toast.classList.remove("is-visible");
    void toast.offsetWidth;
    toast.classList.add("is-visible");

    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 4600);
  }

  function closeSidebar() {
    var toggle = document.querySelector("[data-sidebar-toggle]");
    document.body.classList.remove("dash-sidebar-open");

    if (toggle) {
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open navigation");
    }
  }

  function initSidebar() {
    var toggle = document.querySelector("[data-sidebar-toggle]");
    if (!toggle) return;

    toggle.addEventListener("click", function () {
      var isOpen = document.body.classList.toggle("dash-sidebar-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
      toggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
    });

    all("[data-sidebar-close]").forEach(function (element) {
      element.addEventListener("click", closeSidebar);
    });

    all(".dash-sidebar a, .dash-sidebar button").forEach(function (element) {
      element.addEventListener("click", closeSidebar);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 1120) closeSidebar();
    });
  }

  function initPopovers() {
    var triggers = all("[data-popover]");
    if (!triggers.length) return;

    function closeOpen(restoreFocus) {
      var openTrigger = null;

      triggers.forEach(function (trigger) {
        var popover = document.getElementById(trigger.getAttribute("data-popover"));
        if (!popover) return;

        if (popover.classList.contains("is-open")) openTrigger = trigger;
        popover.classList.remove("is-open");
        trigger.setAttribute("aria-expanded", "false");
      });

      if (restoreFocus && openTrigger) openTrigger.focus();
      return Boolean(openTrigger);
    }

    closePopoversHandler = function () {
      return closeOpen(true);
    };

    triggers.forEach(function (trigger) {
      var popover = document.getElementById(trigger.getAttribute("data-popover"));
      if (!popover) return;

      trigger.addEventListener("click", function (event) {
        event.stopPropagation();
        var isOpen = popover.classList.contains("is-open");

        closeOpen(false);

        if (!isOpen) {
          popover.classList.add("is-open");
          trigger.setAttribute("aria-expanded", "true");
        }
      });

      popover.addEventListener("click", function (event) {
        if (event.target.closest("a, button")) closeOpen(false);
      });
    });

    document.addEventListener("click", function (event) {
      if (!event.target.closest(".dash-dropdown")) closeOpen(false);
    });
  }

  function getFocusable(container) {
    return all(
      'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      container
    ).filter(function (element) {
      return element.offsetParent !== null;
    });
  }

  function trapModalFocus(event) {
    var modal = document.querySelector(".dash-modal:not([hidden])");
    if (!modal) return;

    var dialog = modal.querySelector(".dash-modal__dialog");
    if (!dialog) return;

    var focusable = getFocusable(dialog);
    if (!focusable.length) {
      event.preventDefault();
      return;
    }

    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    var active = document.activeElement;

    if (event.shiftKey) {
      if (active === first || !dialog.contains(active)) {
        event.preventDefault();
        last.focus();
      }
    } else if (active === last || !dialog.contains(active)) {
      event.preventDefault();
      first.focus();
    }
  }

  function initModals() {
    var openButtons = all("[data-open-modal]");
    var lastTrigger = null;

    function closeModal(modal, restoreFocus) {
      if (!modal || modal.hidden) return;

      modal.hidden = true;
      document.body.classList.remove("dash-modal-open");

      if (restoreFocus && lastTrigger && document.contains(lastTrigger)) lastTrigger.focus();
      lastTrigger = null;
    }

    function openModal(modal, trigger) {
      if (!modal) return;

      lastTrigger = trigger || document.activeElement;
      closeSidebar();
      if (closePopoversHandler) closePopoversHandler();

      modal.hidden = false;
      document.body.classList.add("dash-modal-open");

      var focusTarget = modal.querySelector("input, select, textarea, button:not(.dash-modal__close)");
      if (!focusTarget) focusTarget = modal.querySelector(".dash-modal__close");

      window.requestAnimationFrame(function () {
        if (focusTarget) focusTarget.focus();
      });
    }

    openButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        openModal(document.getElementById(button.getAttribute("data-open-modal")), button);
      });
    });

    document.addEventListener("click", function (event) {
      var closeTrigger = event.target.closest("[data-close-modal]");
      if (!closeTrigger) return;

      var modal = closeTrigger.closest(".dash-modal");
      if (modal) {
        event.preventDefault();
        closeModal(modal, true);
      }
    });

    closeModalHandler = function () {
      var modal = document.querySelector(".dash-modal:not([hidden])");
      if (!modal) return false;

      closeModal(modal, true);
      return true;
    };
  }

  function initDemoForms() {
    all("[data-demo-form]").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();

        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }

        var modal = form.closest(".dash-modal");
        if (modal && closeModalHandler) closeModalHandler();

        form.reset();
        showToast(
          form.getAttribute("data-toast-title") || "Saved",
          form.getAttribute("data-toast") || "Your changes are up to date."
        );
      });
    });
  }

  function initToasts() {
    document.addEventListener("click", function (event) {
      var trigger = event.target.closest("[data-toast]");
      if (!trigger || trigger.closest("form")) return;

      event.preventDefault();
      showToast(
        trigger.getAttribute("data-toast-title"),
        trigger.getAttribute("data-toast")
      );
    });
  }

  function initRentFilter() {
    var filter = document.querySelector("[data-table-filter]");
    var rows = all("[data-rent-row]");
    var count = document.querySelector("[data-table-count]");
    if (!filter || !rows.length) return;

    function applyFilter() {
      var status = filter.value;
      var visible = 0;

      rows.forEach(function (row) {
        var show = status === "all" || row.getAttribute("data-status") === status;
        row.hidden = !show;
        if (show) visible += 1;
      });

      if (count) count.textContent = visible + (visible === 1 ? " lease" : " leases");
    }

    filter.addEventListener("change", applyFilter);
    applyFilter();
  }

  function initChart() {
    var chart = document.querySelector("[data-chart][data-values-6m]");
    if (!chart) return;

    var line = chart.querySelector("[data-chart-line]");
    var area = chart.querySelector("[data-chart-area]");
    var dots = chart.querySelector("[data-chart-dots]");
    var labels = document.querySelector("[data-chart-labels]");
    var total = document.querySelector("[data-chart-total]");
    var period = document.querySelector("[data-chart-period]");
    var buttons = all("[data-chart-range]");
    var width = 640;
    var height = 230;
    var plotTop = 26;
    var plotBottom = 208;

    function buildPath(points) {
      if (!points.length) return "";

      var path = "M" + points[0].x.toFixed(2) + " " + points[0].y.toFixed(2);

      for (var index = 0; index < points.length - 1; index += 1) {
        var previous = points[index - 1] || points[index];
        var current = points[index];
        var next = points[index + 1];
        var following = points[index + 2] || next;

        var controlOneX = current.x + (next.x - previous.x) / 6;
        var controlOneY = current.y + (next.y - previous.y) / 6;
        var controlTwoX = next.x - (following.x - current.x) / 6;
        var controlTwoY = next.y - (following.y - current.y) / 6;

        path +=
          " C" +
          controlOneX.toFixed(2) +
          " " +
          controlOneY.toFixed(2) +
          " " +
          controlTwoX.toFixed(2) +
          " " +
          controlTwoY.toFixed(2) +
          " " +
          next.x.toFixed(2) +
          " " +
          next.y.toFixed(2);
      }

      return path;
    }

    function render(range) {
      var values = (chart.getAttribute("data-values-" + range) || "")
        .split(",")
        .map(Number)
        .filter(function (value) {
          return isFinite(value);
        });
      var labelsText = (chart.getAttribute("data-labels-" + range) || "").split(",");
      if (!values.length) return;

      var minimum = Math.min.apply(null, values);
      var maximum = Math.max.apply(null, values);
      var padding = Math.max(8, (maximum - minimum) * 0.25);
      var low = Math.max(0, minimum - padding);
      var high = maximum + padding;
      var span = high - low || 1;

      var points = values.map(function (value, index) {
        return {
          x: values.length === 1 ? width / 2 : (index * width) / (values.length - 1),
          y: plotBottom - ((value - low) / span) * (plotBottom - plotTop)
        };
      });

      var linePath = buildPath(points);
      line.setAttribute("d", linePath);
      area.setAttribute(
        "d",
        linePath +
          " L" +
          points[points.length - 1].x.toFixed(2) +
          " " +
          height +
          " L" +
          points[0].x.toFixed(2) +
          " " +
          height +
          " Z"
      );

      while (dots.firstChild) dots.removeChild(dots.firstChild);

      points.forEach(function (point, index) {
        var circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("class", "dash-chart__dot" + (index === points.length - 1 ? " dash-chart__dot--last" : ""));
        circle.setAttribute("cx", point.x.toFixed(2));
        circle.setAttribute("cy", point.y.toFixed(2));
        circle.setAttribute("r", index === points.length - 1 ? "4" : "3");
        dots.appendChild(circle);
      });

      if (labels) {
        labels.innerHTML = "";
        labels.classList.toggle("is-tight", values.length > 8);

        values.forEach(function (value, index) {
          var label = document.createElement("span");
          label.textContent = (labelsText[index] || "").trim();
          labels.appendChild(label);
        });
      }

      if (total) total.textContent = chart.getAttribute("data-total-" + range) || "";
      if (period) period.textContent = chart.getAttribute("data-period-" + range) || "";
      chart.setAttribute(
        "aria-label",
        "Rental income over the last " + (range === "12m" ? "twelve" : "six") + " months"
      );

      buttons.forEach(function (button) {
        var isActive = button.getAttribute("data-chart-range") === range;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
      });
    }

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        render(button.getAttribute("data-chart-range"));
      });
    });

    render("6m");
  }

  function initSearch() {
    var forms = all("[data-dashboard-search]");
    var input = document.querySelector("[data-dashboard-search] input");
    if (!forms.length) return;

    forms.forEach(function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();

        var field = form.querySelector("input");
        var query = field ? field.value.trim() : "";
        if (!query) return;

        var needle = query.toLowerCase();
        var activeView = document.querySelector(".dash-view.is-active");
        var root = activeView || document;
        var pool = all(
          "[data-rent-row], [data-search-item], [data-maintenance-item], .dash-maintenance__item, .dash-activity__item, .dash-file, [data-filter-row], [data-notice], .dash-listing:not([hidden])",
          root
        );
        var matches = pool.filter(function (element) {
          return element.offsetParent !== null &&
            element.textContent.toLowerCase().indexOf(needle) !== -1;
        });

        if (matches.length) {
          showToast(
            "Search results",
            matches.length +
              (matches.length === 1 ? " match" : " matches") +
              ' for "' +
              query +
              '".'
          );
          matches[0].scrollIntoView({
            behavior: prefersReducedMotion ? "auto" : "smooth",
            block: "center"
          });
        } else {
          showToast("No matches", 'Nothing on this dashboard matches "' + query + '".');
        }
      });
    });

    document.addEventListener("keydown", function (event) {
      if (
        event.key !== "/" ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        isTypingTarget(event.target) ||
        !input ||
        input.offsetParent === null
      ) {
        return;
      }

      event.preventDefault();
      input.focus();
      input.select();
    });

    if (input) {
      input.addEventListener("keydown", function (event) {
        if (event.key === "Escape") input.blur();
      });
    }
  }

  function initChat() {
    var form = document.querySelector("[data-message-form]");
    if (!form) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var field = form.querySelector("input, textarea");
      var message = field ? field.value.trim() : "";
      var chat = document.querySelector(".dash-chat");
      if (!message) return;

      if (chat) {
        var sent = document.createElement("div");
        var bubble = document.createElement("p");
        var time = document.createElement("span");
        var now = new Date();

        sent.className = "dash-chat__sent";
        bubble.textContent = message;
        time.textContent =
          "Sent \u00b7 " +
          now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

        sent.appendChild(bubble);
        sent.appendChild(time);
        chat.appendChild(sent);
      }

      form.reset();
      showToast(
        form.getAttribute("data-toast-title") || "Message sent",
        form.getAttribute("data-toast") || "Your message is on its way."
      );
    });
  }

  function initNavState() {
    var links = all(".dash-nav__item[href^='#']");
    var crumb = document.querySelector(".dash-crumb strong");
    if (!links.length) return;

    links.forEach(function (link) {
      link.addEventListener("click", function () {
        links.forEach(function (other) {
          other.classList.remove("is-active");
          other.removeAttribute("aria-current");
        });

        link.classList.add("is-active");
        link.setAttribute("aria-current", "page");

        var label = link.querySelector("span");
        if (crumb && label) crumb.textContent = label.textContent.trim();
        closeSidebar();
      });
    });
  }

  function initDateTime() {
    var now = new Date();
    var dateLabel = now.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric"
    });
    var hour = now.getHours();
    var greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

    all("[data-today]").forEach(function (element) {
      element.textContent = dateLabel;
    });

    all("[data-greeting]").forEach(function (element) {
      element.textContent = greeting;
    });
  }

  function initKeyboardShortcuts() {
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        if (closeModalHandler && closeModalHandler()) return;
        if (closePopoversHandler && closePopoversHandler()) return;
        closeSidebar();
        return;
      }

      if (event.key === "Tab") trapModalFocus(event);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initSidebar();
    initPopovers();
    initModals();
    initDemoForms();
    initToasts();
    initRentFilter();
    initChart();
    initSearch();
    initChat();
    initNavState();
    initDateTime();
    initKeyboardShortcuts();
  });
})();
