(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var toastTimer = null;
  var charts = {};
  var savedKey = "stackly.tenant.saved-properties.v1";
  var defaultSaved = ["ocean-house", "the-atelier", "the-grove", "cedar-haus"];

  function all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function one(selector, root) {
    return (root || document).querySelector(selector);
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
    }, 4400);
  }

  function formatCount(value, singular, plural) {
    return value + " " + (value === 1 ? singular : plural || singular + "s");
  }

  /* ----------------------------------------------------------------------- */
  /* Section routing                                                         */
  /* ----------------------------------------------------------------------- */

  function initViews() {
    var views = all(".dash-view");
    if (!views.length) return;

    var navLinks = all(".dash-nav__item");
    var crumb = one(".dash-crumb strong");
    var current = "";

    function labelFor(name) {
      var link = navLinks.filter(function (item) {
        return (item.getAttribute("href") || "").replace("#", "") === name;
      })[0];
      var label = link ? one("span", link) : null;
      return label ? label.textContent.trim() : name;
    }

    function activate(name, options) {
      var settings = options || {};
      var target = document.getElementById(name) || document.getElementById("overview");
      if (!target || !target.classList.contains("dash-view")) target = views[0];
      if (!target) return;

      name = target.id;
      if (name === current && !settings.force) return;
      current = name;

      views.forEach(function (view) {
        view.hidden = view !== target;
        view.classList.toggle("is-active", view === target);
      });

      navLinks.forEach(function (link) {
        var isActive = (link.getAttribute("href") || "").replace("#", "") === name;
        link.classList.toggle("is-active", isActive);
        if (isActive) {
          link.setAttribute("aria-current", "page");
        } else {
          link.removeAttribute("aria-current");
        }
      });

      var label = labelFor(name);
      if (crumb) crumb.textContent = label;

      var pageLabel = target.getAttribute("data-page-label");
      document.title = (pageLabel || label) + " - Stackly";

      if (settings.push && window.history && window.history.pushState) {
        window.history.pushState({ view: name }, "", "#" + name);
      }

      if (settings.scroll !== false) {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
      }

      initChartsIn(target);
      initChartPresets();
    }

    function requestedView() {
      var hash = (window.location.hash || "").replace("#", "");
      return document.getElementById(hash) && document.getElementById(hash).classList.contains("dash-view")
        ? hash
        : "overview";
    }

    all(".dash-nav__item[href^='#'], .dash-quick[href^='#'], [data-view-link]").forEach(function (link) {
      link.addEventListener("click", function (event) {
        var name = link.getAttribute("data-view-link") ||
          (link.getAttribute("href") || "").replace("#", "");
        if (!name || !document.getElementById(name)) return;

        event.preventDefault();
        activate(name, { push: true });
        if (document.body.classList.contains("dash-sidebar-open")) {
          document.body.classList.remove("dash-sidebar-open");
        }
      });
    });

    window.addEventListener("popstate", function () {
      activate(requestedView(), { scroll: false });
    });

    window.addEventListener("hashchange", function () {
      activate(requestedView(), { scroll: false });
    });

    activate(requestedView(), { force: true, scroll: false });
  }

  /* ----------------------------------------------------------------------- */
  /* Chart.js setup                                                          */
  /* ----------------------------------------------------------------------- */

  var COLORS = {
    ink: "#173F35",
    inkSoft: "#2C5E4F",
    accent: "#D9B77A",
    rust: "#8C6A33",
    sage: "#7FA58F",
    slate: "#A9B8AF",
    pale: "#E9E4D8",
    rose: "#C98B7A",
    grid: "rgba(23, 63, 53, 0.07)"
  };

  function areaFill(context, color) {
    var chart = context.chart;
    var chartArea = chart.chartArea;
    if (!chartArea) return "rgba(217, 183, 122, 0.12)";
    var gradient = chart.ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, "rgba(217, 183, 122, 0)");
    return gradient;
  }

  function baseOptions(extra) {
    var options = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      animation: prefersReducedMotion ? false : { duration: 650 },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: COLORS.ink,
          titleColor: "#FFFFFF",
          titleFont: { size: 11, weight: "700" },
          bodyColor: "rgba(255, 255, 255, 0.72)",
          bodyFont: { size: 10, weight: "600" },
          padding: 10,
          cornerRadius: 9,
          boxPadding: 4,
          displayColors: false
        }
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { color: COLORS.rust, font: { size: 10, weight: "700" }, maxRotation: 0 }
        },
        y: {
          grid: { color: COLORS.grid, drawTicks: false },
          border: { display: false },
          ticks: { color: COLORS.rust, font: { size: 10, weight: "700" }, padding: 7 }
        }
      }
    };

    if (extra) {
      Object.keys(extra).forEach(function (key) {
        if (key === "plugins") {
          options.plugins = Object.assign({}, options.plugins, extra.plugins);
          if (extra.plugins.tooltip) {
            options.plugins.tooltip = Object.assign({}, options.plugins.tooltip, extra.plugins.tooltip);
          }
          if (extra.plugins.legend) {
            options.plugins.legend = Object.assign({}, options.plugins.legend, extra.plugins.legend);
          }
        } else if (key === "scales") {
          Object.keys(extra.scales).forEach(function (scaleKey) {
            options.scales[scaleKey] = Object.assign({}, options.scales[scaleKey], extra.scales[scaleKey]);
          });
        } else {
          options[key] = extra[key];
        }
      });
    }

    return options;
  }

  function doughnutOptions(centerText, centerLabel) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "72%",
      animation: prefersReducedMotion ? false : { duration: 700 },
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            usePointStyle: true,
            pointStyle: "circle",
            boxWidth: 7,
            boxHeight: 7,
            padding: 13,
            color: "#5C6B63",
            font: { size: 10, weight: "600" }
          }
        },
        centerText: { text: centerText || "", label: centerLabel || "" },
        tooltip: {
          backgroundColor: COLORS.ink,
          titleColor: "#FFFFFF",
          bodyColor: "rgba(255, 255, 255, 0.72)",
          padding: 9,
          cornerRadius: 8,
          displayColors: false,
          bodyFont: { size: 10, weight: "600" }
        }
      }
    };
  }

  function lineConfig(labels, datasets, yCallback) {
    return {
      type: "line",
      data: { labels: labels, datasets: datasets },
      options: baseOptions({
        scales: {
          y: {
            ticks: {
              color: COLORS.rust,
              font: { size: 10, weight: "700" },
              padding: 7,
              callback: yCallback
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function (item) {
                var value = item.parsed.y;
                if (yCallback) return " " + yCallback(value);
                return " " + value;
              }
            }
          }
        }
      })
    };
  }

  function barConfig(labels, datasets, options) {
    return {
      type: "bar",
      data: { labels: labels, datasets: datasets },
      options: baseOptions(options || {
        scales: {
          x: { stacked: false },
          y: { beginAtZero: true, ticks: { precision: 0 } }
        }
      })
    };
  }

  function horizontalBarConfig(labels, values, color) {
    return {
      type: "bar",
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: color || COLORS.ink,
          borderRadius: 6,
          borderSkipped: false,
          barThickness: 13
        }]
      },
      options: baseOptions({
        indexAxis: "y",
        scales: {
          x: {
            grid: { color: COLORS.grid, drawTicks: false },
            border: { display: false },
            ticks: { color: COLORS.rust, font: { size: 10, weight: "700" } }
          },
          y: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: COLORS.ink, font: { size: 10, weight: "700" } }
          }
        }
      })
    };
  }

  var chartFactories = {
    adminIncomeChart: function () {
      return lineConfig(
        ["May", "Jun", "Jul", "Aug", "Sep", "Oct"],
        [
          {
            label: "Collected",
            data: [96, 104, 99, 118, 126, 142.8],
            borderColor: COLORS.ink,
            backgroundColor: function (context) {
              return areaFill(context, "rgba(23, 63, 53, 0.16)");
            },
            fill: true,
            tension: 0.38,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: "#FFFFFF",
            pointBorderColor: COLORS.ink,
            pointBorderWidth: 2
          },
          {
            label: "Last year",
            data: [90, 94, 91, 102, 108, 116],
            borderColor: "rgba(140, 106, 51, 0.45)",
            borderDash: [4, 5],
            fill: false,
            tension: 0.38,
            pointRadius: 0,
            pointHoverRadius: 4
          }
        ],
        function (value) { return "$" + value + "k"; }
      );
    },

    adminOccupancyChart: function () {
      return {
        type: "doughnut",
        data: {
          labels: ["Occupied", "Vacant", "In turnover"],
          datasets: [{
            data: [86, 3, 2],
            backgroundColor: [COLORS.accent, COLORS.pale, COLORS.ink],
            borderWidth: 0,
            hoverOffset: 4
          }]
        },
        options: doughnutOptions("94.5%", "Occupied")
      };
    },

    adminPropertyMixChart: function () {
      return {
        type: "doughnut",
        data: {
          labels: ["Apartments", "Villas", "Penthouses", "Cabins", "Townhomes"],
          datasets: [{
            data: [34, 22, 18, 10, 8],
            backgroundColor: [COLORS.ink, COLORS.accent, COLORS.sage, COLORS.rose, COLORS.pale],
            borderWidth: 0,
            hoverOffset: 4
          }]
        },
        options: doughnutOptions("92", "Properties")
      };
    },

    adminCityChart: function () {
      return horizontalBarConfig(
        ["Los Angeles", "New York", "Miami", "Austin", "Big Sur", "Palm Springs"],
        [97, 95, 92, 96, 89, 94],
        COLORS.ink
      );
    },

    adminTenantGrowthChart: function () {
      return lineConfig(
        ["May", "Jun", "Jul", "Aug", "Sep", "Oct"],
        [{
          label: "Tenants",
          data: [68, 72, 74, 79, 83, 86],
          borderColor: COLORS.ink,
          backgroundColor: function (context) {
            return areaFill(context, "rgba(217, 183, 122, 0.34)");
          },
          fill: true,
          tension: 0.38,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: COLORS.accent,
          pointBorderColor: COLORS.ink,
          pointBorderWidth: 2
        }],
        function (value) { return value + " tenants"; }
      );
    },

    adminTenantStandingChart: function () {
      return {
        type: "doughnut",
        data: {
          labels: ["On time", "Grace period", "Overdue"],
          datasets: [{
            data: [79, 5, 2],
            backgroundColor: [COLORS.sage, COLORS.accent, COLORS.rose],
            borderWidth: 0,
            hoverOffset: 4
          }]
        },
        options: doughnutOptions("92%", "On time")
      };
    },

    adminOwnerRevenueChart: function () {
      return horizontalBarConfig(
        ["Coastal Group", "Harbor Holdings", "M. Bennett", "Vista Partners", "K. Osei", "R. Tanaka"],
        [28.4, 24.8, 19.6, 15.2, 12.4, 10.8],
        COLORS.ink
      );
    },

    adminOwnerMixChart: function () {
      return {
        type: "doughnut",
        data: {
          labels: ["Institutional", "Private", "Family office"],
          datasets: [{
            data: [9, 11, 4],
            backgroundColor: [COLORS.ink, COLORS.accent, COLORS.pale],
            borderWidth: 0,
            hoverOffset: 4
          }]
        },
        options: doughnutOptions("24", "Owners")
      };
    },

    adminListingViewsChart: function () {
      return barConfig(
        ["May", "Jun", "Jul", "Aug", "Sep", "Oct"],
        [{
          label: "Listing views",
          data: [18.2, 22.4, 19.8, 28.1, 25.6, 34.2],
          backgroundColor: [COLORS.pale, COLORS.pale, COLORS.pale, COLORS.pale, COLORS.accent, COLORS.ink],
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 36
        }],
        {
          scales: {
            x: { grid: { display: false } },
            y: {
              beginAtZero: true,
              ticks: {
                color: COLORS.rust,
                font: { size: 10, weight: "700" },
                callback: function (value) { return value + "k"; }
              }
            }
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: function (item) { return " " + item.parsed.y + "k views"; }
              }
            }
          }
        }
      );
    },

    adminListingStatusChart: function () {
      return {
        type: "doughnut",
        data: {
          labels: ["Live", "Coming soon", "Draft"],
          datasets: [{
            data: [8, 4, 2],
            backgroundColor: [COLORS.sage, COLORS.accent, COLORS.pale],
            borderWidth: 0,
            hoverOffset: 4
          }]
        },
        options: doughnutOptions("14", "Listings")
      };
    },

    adminBookingsTrendChart: function () {
      return {
        type: "bar",
        data: {
          labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
          datasets: [
            {
              label: "Viewings",
              data: [12, 16, 14, 20],
              backgroundColor: COLORS.pale,
              borderRadius: 5,
              borderSkipped: false,
              maxBarThickness: 28
            },
            {
              label: "Confirmed",
              data: [8, 11, 9, 14],
              backgroundColor: COLORS.ink,
              borderRadius: 5,
              borderSkipped: false,
              maxBarThickness: 28
            }
          ]
        },
        options: baseOptions({
          scales: {
            x: { grid: { display: false } },
            y: { beginAtZero: true, ticks: { precision: 0 } }
          },
          plugins: {
            legend: {
              display: true,
              position: "bottom",
              labels: {
                usePointStyle: true,
                pointStyle: "circle",
                boxWidth: 7,
                padding: 14,
                color: "#5C6B63",
                font: { size: 10, weight: "600" }
              }
            }
          }
        })
      };
    },

    adminBookingStatusChart: function () {
      return {
        type: "doughnut",
        data: {
          labels: ["Confirmed", "Pending", "Cancelled"],
          datasets: [{
            data: [18, 4, 2],
            backgroundColor: [COLORS.sage, COLORS.accent, COLORS.rose],
            borderWidth: 0,
            hoverOffset: 4
          }]
        },
        options: doughnutOptions("24", "Viewings")
      };
    },

    adminPaymentFlowChart: function () {
      return {
        type: "bar",
        data: {
          labels: ["May", "Jun", "Jul", "Aug", "Sep", "Oct"],
          datasets: [
            {
              label: "Collected",
              data: [118, 127, 121, 134, 137, 142.8],
              backgroundColor: COLORS.ink,
              borderRadius: 5,
              borderSkipped: false,
              maxBarThickness: 22
            },
            {
              label: "Expected",
              data: [124, 130, 126, 138, 143, 149],
              backgroundColor: COLORS.pale,
              borderRadius: 5,
              borderSkipped: false,
              maxBarThickness: 22
            }
          ]
        },
        options: baseOptions({
          scales: {
            x: { grid: { display: false } },
            y: {
              beginAtZero: true,
              ticks: {
                color: COLORS.rust,
                font: { size: 10, weight: "700" },
                callback: function (value) { return "$" + value + "k"; }
              }
            }
          },
          plugins: {
            legend: {
              display: true,
              position: "bottom",
              labels: {
                usePointStyle: true,
                pointStyle: "circle",
                boxWidth: 7,
                padding: 14,
                color: "#5C6B63",
                font: { size: 10, weight: "600" }
              }
            },
            tooltip: {
              callbacks: {
                label: function (item) { return " " + item.dataset.label + ": $" + item.parsed.y + "k"; }
              }
            }
          }
        })
      };
    },

    adminPaymentStatusChart: function () {
      return {
        type: "doughnut",
        data: {
          labels: ["Paid", "Due", "Overdue"],
          datasets: [{
            data: [78, 5, 3],
            backgroundColor: [COLORS.sage, COLORS.accent, COLORS.rose],
            borderWidth: 0,
            hoverOffset: 4
          }]
        },
        options: doughnutOptions("96.2%", "Collected")
      };
    },

    adminReportChart: function () {
      return {
        type: "bar",
        data: {
          labels: ["May", "Jun", "Jul", "Aug", "Sep", "Oct"],
          datasets: [
            {
              type: "bar",
              label: "Income",
              data: [118, 127, 121, 134, 137, 142.8],
              backgroundColor: COLORS.ink,
              borderRadius: 5,
              borderSkipped: false,
              maxBarThickness: 20,
              order: 2
            },
            {
              type: "bar",
              label: "Expenses",
              data: [26, 28, 24, 31, 27, 28.6],
              backgroundColor: COLORS.pale,
              borderRadius: 5,
              borderSkipped: false,
              maxBarThickness: 20,
              order: 2
            },
            {
              type: "line",
              label: "NOI",
              data: [92, 99, 97, 103, 110, 96.4],
              borderColor: COLORS.accent,
              backgroundColor: COLORS.accent,
              tension: 0.35,
              pointRadius: 3,
              pointBackgroundColor: COLORS.accent,
              pointBorderColor: "#FFFFFF",
              pointBorderWidth: 2,
              order: 1
            }
          ]
        },
        options: baseOptions({
          scales: {
            x: { grid: { display: false } },
            y: {
              beginAtZero: true,
              ticks: {
                color: COLORS.rust,
                font: { size: 10, weight: "700" },
                callback: function (value) { return "$" + value + "k"; }
              }
            }
          },
          plugins: {
            legend: {
              display: true,
              position: "bottom",
              labels: {
                usePointStyle: true,
                pointStyle: "circle",
                boxWidth: 7,
                padding: 14,
                color: "#5C6B63",
                font: { size: 10, weight: "600" }
              }
            },
            tooltip: {
              callbacks: {
                label: function (item) { return " " + item.dataset.label + ": $" + item.parsed.y + "k"; }
              }
            }
          }
        })
      };
    },

    adminReportOccupancyChart: function () {
      return lineConfig(
        ["May", "Jun", "Jul", "Aug", "Sep", "Oct"],
        [{
          label: "Occupancy",
          data: [91, 92.5, 92, 93.8, 94.1, 94.5],
          borderColor: COLORS.ink,
          backgroundColor: function (context) {
            return areaFill(context, "rgba(127, 165, 143, 0.28)");
          },
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: COLORS.sage,
          pointBorderColor: COLORS.ink,
          pointBorderWidth: 2
        }],
        function (value) { return value + "%"; }
      );
    },

    adminReviewRatingChart: function () {
      return {
        type: "bar",
        data: {
          labels: ["5 stars", "4 stars", "3 stars", "2 stars", "1 star"],
          datasets: [{
            data: [142, 48, 16, 5, 3],
            backgroundColor: [COLORS.ink, COLORS.inkSoft, COLORS.sage, COLORS.accent, COLORS.rose],
            borderRadius: 6,
            borderSkipped: false,
            maxBarThickness: 34
          }]
        },
        options: baseOptions({
          scales: {
            x: { grid: { display: false } },
            y: { beginAtZero: true, ticks: { precision: 0 } }
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: function (item) { return " " + item.parsed.y + " reviews"; }
              }
            }
          }
        })
      };
    },

    adminReviewVolumeChart: function () {
      return lineConfig(
        ["May", "Jun", "Jul", "Aug", "Sep", "Oct"],
        [{
          label: "New reviews",
          data: [24, 31, 28, 35, 42, 54],
          borderColor: COLORS.rust,
          backgroundColor: function (context) {
            return areaFill(context, "rgba(217, 183, 122, 0.26)");
          },
          fill: true,
          tension: 0.38,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: COLORS.accent,
          pointBorderColor: COLORS.ink,
          pointBorderWidth: 2
        }],
        function (value) { return value + " reviews"; }
      );
    },

    tenantPaymentChart: function () {
      return barConfig(
        ["May", "Jun", "Jul", "Aug", "Sep", "Oct"],
        [{
          label: "Rent + utilities",
          data: [9310, 9240, 9380, 9290, 9410, 9350],
          backgroundColor: [COLORS.pale, COLORS.pale, COLORS.pale, COLORS.pale, COLORS.accent, COLORS.ink],
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 34
        }],
        {
          scales: {
            x: { grid: { display: false } },
            y: {
              beginAtZero: true,
              ticks: {
                color: COLORS.rust,
                font: { size: 10, weight: "700" },
                callback: function (value) { return "$" + value; }
              }
            }
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: function (item) { return " $" + item.parsed.y.toLocaleString(); }
              }
            }
          }
        }
      );
    },

    tenantApplicationChart: function () {
      return {
        type: "doughnut",
        data: {
          labels: ["Approved", "In review", "Submitted"],
          datasets: [{
            data: [1, 1, 1],
            backgroundColor: [COLORS.sage, COLORS.accent, COLORS.ink],
            borderWidth: 0,
            hoverOffset: 4
          }]
        },
        options: doughnutOptions("3", "Applications")
      };
    },

    tenantBookingChart: function () {
      return barConfig(
        ["May", "Jun", "Jul", "Aug", "Sep", "Oct"],
        [{
          label: "Viewings",
          data: [1, 2, 0, 1, 2, 1],
          backgroundColor: [COLORS.pale, COLORS.accent, COLORS.pale, COLORS.pale, COLORS.ink, COLORS.pale],
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 34
        }],
        {
          scales: {
            x: { grid: { display: false } },
            y: { beginAtZero: true, ticks: { precision: 0 } }
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: function (item) { return " " + formatCount(item.parsed.y, "viewing"); }
              }
            }
          }
        }
      );
    },

    tenantPaymentStatusChart: function () {
      return {
        type: "doughnut",
        data: {
          labels: ["On time", "Upcoming", "Late"],
          datasets: [{
            data: [23, 1, 0],
            backgroundColor: [COLORS.sage, COLORS.accent, COLORS.rose],
            borderWidth: 0,
            hoverOffset: 4
          }]
        },
        options: doughnutOptions("100%", "On time")
      };
    },

    tenantSavedMixChart: function () {
      return {
        type: "doughnut",
        data: {
          labels: ["Apartments", "Villas", "Cabins"],
          datasets: [{
            data: [2, 1, 1],
            backgroundColor: [COLORS.ink, COLORS.accent, COLORS.sage],
            borderWidth: 0,
            hoverOffset: 4
          }]
        },
        options: doughnutOptions("4", "Saved")
      };
    },

    tenantBookingStatusChart: function () {
      return {
        type: "doughnut",
        data: {
          labels: ["Upcoming", "Completed", "Cancelled"],
          datasets: [{
            data: [2, 4, 0],
            backgroundColor: [COLORS.accent, COLORS.sage, COLORS.rose],
            borderWidth: 0,
            hoverOffset: 4
          }]
        },
        options: doughnutOptions("6", "Viewings")
      };
    },

    tenantDepositChart: function () {
      return {
        type: "doughnut",
        data: {
          labels: ["First month", "Security deposit"],
          datasets: [{
            data: [8900, 8900],
            backgroundColor: [COLORS.ink, COLORS.accent],
            borderWidth: 0,
            hoverOffset: 4
          }]
        },
        options: doughnutOptions("$17.8k", "Move-in")
      };
    }
  };

  var rangePresets = {
    adminIncomeChart: {
      "6m": {
        labels: ["May", "Jun", "Jul", "Aug", "Sep", "Oct"],
        datasets: [
          [96, 104, 99, 118, 126, 142.8],
          [90, 94, 91, 102, 108, 116]
        ]
      },
      "12m": {
        labels: ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"],
        datasets: [
          [88, 92, 96, 101, 99, 108, 112, 118, 115, 124, 132, 142.8],
          [84, 88, 90, 95, 94, 99, 104, 108, 111, 116, 121, 126]
        ]
      }
    }
  };

  function registerChartPlugins() {
    if (!window.Chart || window.Chart.registry.plugins.get("stacklyCenterText")) return;

    window.Chart.register({
      id: "stacklyCenterText",
      afterDraw: function (chart) {
        var options = chart.config.options.plugins &&
          chart.config.options.plugins.centerText;
        if (!options || !options.text) return;

        var ctx = chart.ctx;
        var meta = chart.getDatasetMeta(0);
        if (!meta || !meta.data || !meta.data.length) return;

        var x = meta.data[0].x;
        var y = meta.data[0].y;

        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = COLORS.ink;
        ctx.font = '800 20px "Manrope", sans-serif';
        ctx.fillText(options.text, x, y - 7);
        ctx.fillStyle = "#5C6B63";
        ctx.font = '700 9px "Manrope", sans-serif';
        ctx.fillText((options.label || "").toUpperCase(), x, y + 12);
        ctx.restore();
      }
    });
  }

  function createChart(canvas) {
    if (!window.Chart || !canvas || charts[canvas.id]) return charts[canvas.id];

    var factory = chartFactories[canvas.id];
    if (!factory) return null;

    registerChartPlugins();
    window.Chart.defaults.font.family = '"Manrope", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    window.Chart.defaults.color = "#5C6B63";

    if (canvas.id === "adminIncomeChart") {
      factory = (function (baseFactory) {
        return function () {
          var config = baseFactory();
          config.data.labels = rangePresets.adminIncomeChart["6m"].labels;
          config.data.datasets[0].data = rangePresets.adminIncomeChart["6m"].datasets[0];
          config.data.datasets[1].data = rangePresets.adminIncomeChart["6m"].datasets[1];
          return config;
        };
      })(factory);
    }

    try {
      charts[canvas.id] = new window.Chart(canvas, factory());
      canvas.setAttribute("data-chart-ready", "true");
      updatePresetButtons(canvas.id);
    } catch (error) {
      canvas.setAttribute("data-chart-error", "true");
    }

    return charts[canvas.id];
  }

  function initChartsIn(root) {
    all("canvas[data-chart]", root || document).forEach(createChart);
  }

  function updatePresetButtons(chartId, activeRange) {
    var buttons = all('[data-chart-preset="' + chartId + '"]');
    if (!buttons.length) return;

    var range = activeRange || (buttons.filter(function (button) {
      return button.classList.contains("is-active");
    })[0] || buttons[0]).getAttribute("data-range");

    buttons.forEach(function (button) {
      var isActive = button.getAttribute("data-range") === range;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  function initChartPresets() {
    all("[data-chart-preset]").forEach(function (button) {
      if (button.getAttribute("data-preset-bound") === "true") return;
      button.setAttribute("data-preset-bound", "true");

      button.addEventListener("click", function () {
        var chartId = button.getAttribute("data-chart-preset");
        var range = button.getAttribute("data-range");
        var canvas = document.getElementById(chartId);
        var chart = charts[chartId] || (canvas ? createChart(canvas) : null);
        var preset = rangePresets[chartId] && rangePresets[chartId][range];
        if (!chart || !preset) return;

        chart.data.labels = preset.labels;
        preset.datasets.forEach(function (values, index) {
          if (chart.data.datasets[index]) chart.data.datasets[index].data = values;
        });
        chart.update();
        updatePresetButtons(chartId, range);
      });
    });
  }

  /* ----------------------------------------------------------------------- */
  /* Saved properties                                                        */
  /* ----------------------------------------------------------------------- */

  function readSaved() {
    try {
      var raw = window.localStorage.getItem(savedKey);
      if (!raw) return defaultSaved.slice();
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : defaultSaved.slice();
    } catch (error) {
      return defaultSaved.slice();
    }
  }

  function writeSaved(items) {
    try {
      window.localStorage.setItem(savedKey, JSON.stringify(items));
    } catch (error) {}
  }

  function initSavedProperties() {
    var buttons = all("[data-save-property]");
    var savedCards = all("[data-saved-card]");
    if (!buttons.length && !savedCards.length) return;

    function sync() {
      var saved = readSaved();

      all("[data-save-property]").forEach(function (button) {
        var id = button.getAttribute("data-property-id");
        var isSaved = saved.indexOf(id) !== -1;
        button.classList.toggle("is-saved", isSaved);
        button.setAttribute("aria-pressed", String(isSaved));
        button.setAttribute("aria-label", (isSaved ? "Remove " : "Save ") + button.getAttribute("data-property-name"));

        var label = one("[data-save-label]", button);
        if (label) label.textContent = isSaved ? "Saved" : "Save";
      });

      all("[data-saved-card]").forEach(function (card) {
        card.hidden = saved.indexOf(card.getAttribute("data-property-id")) === -1;
      });

      all("[data-saved-count]").forEach(function (element) {
        element.textContent = String(saved.length);
      });

      var empty = one("[data-saved-empty]");
      if (empty) {
        var hasVisible = savedCards.some(function (card) {
          return !card.hidden;
        });
        empty.classList.toggle("is-visible", !hasVisible && savedCards.length > 0);
      }
    }

    buttons.forEach(function (button) {
      if (button.getAttribute("data-save-bound") === "true") return;
      button.setAttribute("data-save-bound", "true");

      button.addEventListener("click", function () {
        var id = button.getAttribute("data-property-id");
        var name = button.getAttribute("data-property-name") || "This property";
        var saved = readSaved();
        var index = saved.indexOf(id);

        if (index === -1) {
          saved.push(id);
          writeSaved(saved);
          sync();
          showToast("Saved to your shortlist", name + " was added to your saved properties.");
        } else {
          saved.splice(index, 1);
          writeSaved(saved);
          sync();
          showToast("Removed from saved", name + " was removed from your saved properties.");
        }
      });
    });

    sync();
  }

  /* ----------------------------------------------------------------------- */
  /* Filters                                                                 */
  /* ----------------------------------------------------------------------- */

  function initListingFilters() {
    var form = one("[data-listing-filters]");
    if (!form) return;

    var queryField = form.querySelector('[name="q"]');
    var typeField = form.querySelector('[name="type"]');
    var maxField = form.querySelector('[name="max"]');
    var cards = all("[data-browse-card]");
    var count = one("[data-listing-count]");
    var empty = one("[data-listing-empty]");

    function apply() {
      var query = queryField ? queryField.value.trim().toLowerCase() : "";
      var type = typeField ? typeField.value : "all";
      var max = maxField && maxField.value ? Number(maxField.value) : Infinity;
      var visible = 0;
      var activeView = one(".dash-view.is-active");

      cards.forEach(function (card) {
        var text = card.textContent.toLowerCase();
        var cardType = card.getAttribute("data-type") || "";
        var price = Number(card.getAttribute("data-price") || 0);
        var show = (!query || text.indexOf(query) !== -1) &&
          (type === "all" || cardType === type) &&
          (!isFinite(max) || price <= max);
        card.hidden = !show;
        if (show) visible += 1;
      });

      if (count) count.textContent = formatCount(visible, "property", "properties");
      if (empty) empty.classList.toggle("is-visible", visible === 0);
      if (activeView && form.closest(".dash-view") === activeView) {
        initChartsIn(activeView);
      }
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      apply();
    });

    [queryField, typeField, maxField].forEach(function (field) {
      if (field) field.addEventListener("input", apply);
      if (field) field.addEventListener("change", apply);
    });

    var reset = form.querySelector('[type="reset"]');
    if (reset) {
      reset.addEventListener("click", function () {
        window.setTimeout(apply, 0);
      });
    }

    apply();
  }

  function initRowFilters() {
    all("[data-filterable]").forEach(function (container) {
      var select = container.querySelector("[data-row-filter]");
      var rows = all("[data-filter-row]", container);
      var count = container.querySelector("[data-filter-count]");
      if (!select || !rows.length) return;

      function apply() {
        var value = select.value;
        var visible = 0;

        rows.forEach(function (row) {
          var show = value === "all" || row.getAttribute("data-status") === value;
          row.hidden = !show;
          if (show) visible += 1;
        });

        if (count) count.textContent = formatCount(visible, "result");
      }

      select.addEventListener("change", apply);
      apply();
    });
  }

  /* ----------------------------------------------------------------------- */
  /* Notifications                                                           */
  /* ----------------------------------------------------------------------- */

  function initNotifications() {
    var rows = all("[data-notice]");
    if (!rows.length) return;

    var filterButtons = all("[data-notice-filter]");
    var markAll = one("[data-mark-all-read]");
    var unreadCount = all("[data-unread-count]");

    function updateCount() {
      var unread = all("[data-notice].is-unread").length;
      unreadCount.forEach(function (element) {
        element.textContent = String(unread);
      });
      if (markAll) markAll.disabled = unread === 0;
    }

    rows.forEach(function (row) {
      row.addEventListener("click", function () {
        if (!row.classList.contains("is-unread")) return;
        row.classList.remove("is-unread");
        updateCount();
      });
    });

    filterButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        var filter = button.getAttribute("data-notice-filter");
        filterButtons.forEach(function (other) {
          other.classList.toggle("is-active", other === button);
        });

        rows.forEach(function (row) {
          row.hidden = filter !== "all" && row.getAttribute("data-notice-type") !== filter;
        });
      });
    });

    if (markAll) {
      markAll.addEventListener("click", function () {
        if (markAll.disabled) return;
        rows.forEach(function (row) {
          row.classList.remove("is-unread");
        });
        updateCount();
        showToast("All caught up", "Every notification is marked as read.");
      });
    }

    updateCount();
  }

  /* ----------------------------------------------------------------------- */
  /* Chat                                                                    */
  /* ----------------------------------------------------------------------- */

  var threadMessages = {
    "tenant-nina": [
      { from: "them", text: "Morning Maya! The kitchen tap repair is confirmed for Thursday between 9 and 11.", time: "9:12 AM" },
      { from: "me", text: "Perfect, thank you. I\u2019ll leave the building access code in the portal.", time: "9:20 AM" },
      { from: "them", text: "Got it. I\u2019ll send a reminder the night before. Anything else I can help with?", time: "9:24 AM" }
    ],
    "tenant-desk": [
      { from: "them", text: "Hi Maya, this is the maintenance desk. Your request is queued with our plumbing partner.", time: "Yesterday" },
      { from: "me", text: "Thanks! Is there anything I need to prepare before the visit?", time: "Yesterday" },
      { from: "them", text: "Just clear the cabinet under the sink. The visit should take under an hour.", time: "Yesterday" }
    ],
    "tenant-lease": [
      { from: "them", text: "Hi Maya, your lease renewal window opens on May 1, 2027. We\u2019ll share options in April.", time: "Mon" },
      { from: "me", text: "Great, thanks for the heads-up. We\u2019d love to stay another year.", time: "Mon" },
      { from: "them", text: "Noted! I\u2019ll flag your interest with the owner.", time: "Mon" }
    ],
    "admin-olivia": [
      { from: "them", text: "Hi Alex, the dishwasher at Ocean House is making a loud noise again.", time: "10:04 AM" },
      { from: "me", text: "Thanks Olivia. I\u2019ve booked a technician for tomorrow morning.", time: "10:16 AM" },
      { from: "them", text: "Perfect. I\u2019ll be home from 8am.", time: "10:18 AM" }
    ],
    "admin-maya": [
      { from: "them", text: "Quick question about November rent \u2014 will autopay run on the 31st?", time: "9:02 AM" },
      { from: "me", text: "Yes, autopay is scheduled for October 31. You\u2019ll get a receipt instantly.", time: "9:10 AM" },
      { from: "them", text: "Wonderful, thank you!", time: "9:12 AM" }
    ],
    "admin-daniel": [
      { from: "them", text: "We\u2019re settled into The Grove. The move-in checklist is all complete.", time: "Yesterday" },
      { from: "me", text: "That\u2019s great to hear, Daniel. I\u2019ve updated your file. Welcome home!", time: "Yesterday" },
      { from: "them", text: "Appreciate the smooth handover.", time: "Yesterday" }
    ]
  };

  function initChats() {
    var inbox = all("[data-thread]");
    var chat = one("[data-chat]");
    var form = one("[data-chat-form]");
    if (!chat || !form) return;

    var nameTarget = one("[data-chat-name]");
    var roleTarget = one("[data-chat-role]");
    var avatarTarget = one("[data-chat-avatar]");
    var currentThread = (inbox.filter(function (item) {
      return item.classList.contains("is-active");
    })[0] || inbox[0]);

    function threadId() {
      return currentThread ? currentThread.getAttribute("data-thread") : "";
    }

    function renderThread(id) {
      var messages = threadMessages[id] || [];
      chat.innerHTML = "";

      messages.forEach(function (message) {
        if (message.from === "me") {
          var sent = document.createElement("div");
          var bubble = document.createElement("p");
          var time = document.createElement("span");
          sent.className = "dash-chat__sent";
          bubble.textContent = message.text;
          time.textContent = "Sent \u00b7 " + message.time;
          sent.appendChild(bubble);
          sent.appendChild(time);
          chat.appendChild(sent);
        } else {
          var received = document.createElement("div");
          received.className = "dash-chat__bubble";
          received.textContent = message.text;
          chat.appendChild(received);
        }
      });

      chat.scrollTop = chat.scrollHeight;
    }

    function activateThread(item) {
      if (!item) return;
      currentThread = item;
      inbox.forEach(function (other) {
        var isActive = other === item;
        other.classList.toggle("is-active", isActive);
        other.setAttribute("aria-pressed", String(isActive));
      });

      var id = item.getAttribute("data-thread");
      var name = item.getAttribute("data-thread-name") || "Conversation";
      var role = item.getAttribute("data-thread-role") || "Stackly";
      var initials = item.getAttribute("data-thread-initials") || name.charAt(0);

      if (nameTarget) nameTarget.textContent = name;
      if (roleTarget) roleTarget.textContent = role;
      if (avatarTarget) avatarTarget.textContent = initials;
      renderThread(id);
    }

    inbox.forEach(function (item) {
      item.addEventListener("click", function () {
        activateThread(item);
      });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var field = form.querySelector("input, textarea");
      var message = field ? field.value.trim() : "";
      if (!message) return;

      var now = new Date();
      var time = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      var id = threadId();

      if (!threadMessages[id]) threadMessages[id] = [];
      threadMessages[id].push({ from: "me", text: message, time: time });

      var sent = document.createElement("div");
      var bubble = document.createElement("p");
      var stamp = document.createElement("span");
      sent.className = "dash-chat__sent";
      bubble.textContent = message;
      stamp.textContent = "Sent \u00b7 " + time;
      sent.appendChild(bubble);
      sent.appendChild(stamp);
      chat.appendChild(sent);
      chat.scrollTop = chat.scrollHeight;

      form.reset();
      showToast("Message sent", "Your reply is on its way. We\u2019ll notify you when they respond.");
    });

    activateThread(currentThread);
  }

  /* ----------------------------------------------------------------------- */
  /* Small utilities                                                         */
  /* ----------------------------------------------------------------------- */

  function initMiscActions() {
    all("[data-action-toast]").forEach(function (button) {
      button.addEventListener("click", function () {
        showToast(
          button.getAttribute("data-toast-title") || "Updated",
          button.getAttribute("data-toast-message") || "Your changes are up to date."
        );
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    registerChartPlugins();
    initViews();
    initChartPresets();
    initSavedProperties();
    initListingFilters();
    initRowFilters();
    initNotifications();
    initChats();
    initMiscActions();
  });
})();
