(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGSAP = Boolean(window.gsap && window.ScrollTrigger);

  if (hasGSAP) {
    window.gsap.registerPlugin(window.ScrollTrigger);
  }

  function initHeader() {
    var header = document.getElementById("siteHeader");
    var nav = document.getElementById("mainNav");
    if (!header) return;

    function updateHeader() {
      header.classList.toggle("is-scrolled", window.scrollY > 36);
    }

    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });

    if (nav && window.bootstrap) {
      var collapse = bootstrap.Collapse.getOrCreateInstance(nav, { toggle: false });

      nav.querySelectorAll("a, [data-bs-toggle='modal']").forEach(function (trigger) {
        trigger.addEventListener("click", function () {
          if (nav.classList.contains("show")) collapse.hide();
        });
      });

      nav.addEventListener("show.bs.collapse", function () {
        header.classList.add("nav-open");
      });

      nav.addEventListener("hidden.bs.collapse", function () {
        header.classList.remove("nav-open");
        updateHeader();
      });
    }
  }

  function initHeroAnimation() {
    if (!document.querySelector(".hero") || !hasGSAP || prefersReducedMotion) return;

    var gsap = window.gsap;
    var tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.from(".site-header", { y: -24, autoAlpha: 0, duration: 0.8 }, 0)
      .from(".hero-media img", { scale: 1.14, duration: 2.2, ease: "power2.out" }, 0)
      .from(".hero-kicker", { y: 22, autoAlpha: 0, duration: 0.7 }, 0.3)
      .from(".hero-title .hero-line > span", { yPercent: 115, duration: 1.15, stagger: 0.12 }, 0.4)
      .from(".hero-lead", { y: 24, autoAlpha: 0, duration: 0.8 }, 0.86)
      .from(".hero-actions > *", { y: 20, autoAlpha: 0, duration: 0.7, stagger: 0.1 }, 1)
      .from(".hero-meta", { y: 22, autoAlpha: 0, duration: 0.7 }, 1.1)
      .from(".search-panel", { y: 50, autoAlpha: 0, duration: 0.9 }, 1.18);
  }

  function initScrollAnimations() {
    if (!hasGSAP || prefersReducedMotion) return;

    var gsap = window.gsap;
    var ScrollTrigger = window.ScrollTrigger;

    gsap.to(".scroll-progress span", {
      scaleX: 1,
      ease: "none",
      scrollTrigger: {
        trigger: document.documentElement,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.25
      }
    });

    gsap.utils.toArray("[data-reveal]").forEach(function (element) {
      gsap.from(element, {
        y: 38,
        autoAlpha: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: element,
          start: "top 88%",
          once: true
        },
        onComplete: function () {
          gsap.set(element, { clearProps: "opacity,visibility,transform" });
        }
      });
    });

    gsap.utils.toArray("[data-reveal-stagger]").forEach(function (group) {
      gsap.from(group.children, {
        y: 34,
        autoAlpha: 0,
        duration: 0.9,
        stagger: 0.09,
        ease: "power3.out",
        scrollTrigger: {
          trigger: group,
          start: "top 84%",
          once: true
        },
        onComplete: function () {
          gsap.set(group.children, { clearProps: "opacity,visibility,transform" });
        }
      });
    });

    var propertyGrid = document.getElementById("propertyGrid");
    if (propertyGrid) {
      gsap.from(propertyGrid.children, {
        y: 42,
        autoAlpha: 0,
        duration: 0.95,
        stagger: 0.075,
        ease: "power3.out",
        scrollTrigger: {
          trigger: propertyGrid,
          start: "top 84%",
          once: true
        },
        onComplete: function () {
          gsap.set(propertyGrid.children, { clearProps: "opacity,visibility,transform" });
        }
      });
    }

    gsap.utils.toArray("[data-image-reveal]").forEach(function (element) {
      gsap.fromTo(
        element,
        { clipPath: "inset(0 0 100% 0)" },
        {
          clipPath: "inset(0 0 0% 0)",
          duration: 1.35,
          ease: "power4.inOut",
          scrollTrigger: {
            trigger: element,
            start: "top 86%",
            once: true
          },
          onComplete: function () {
            gsap.set(element, { clearProps: "clipPath" });
          }
        }
      );
    });

    gsap.utils.toArray("[data-parallax]").forEach(function (image) {
      var trigger = image.closest(".about-media__main") || image.closest(".cta-card") || image.parentElement;
      gsap.fromTo(
        image,
        { yPercent: -4 },
        {
          yPercent: 4,
          ease: "none",
          scrollTrigger: {
            trigger: trigger,
            start: "top bottom",
            end: "bottom top",
            scrub: true
          }
        }
      );
    });

    gsap.utils.toArray("[data-count]").forEach(function (element) {
      var target = parseFloat(element.getAttribute("data-count"));
      var decimals = parseInt(element.getAttribute("data-decimals") || "0", 10);
      var counter = { value: 0 };

      gsap.to(counter, {
        value: target,
        duration: 1.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: element,
          start: "top 92%",
          once: true
        },
        onUpdate: function () {
          var value = decimals ? counter.value.toFixed(decimals) : Math.round(counter.value);
          element.textContent = Number(value).toLocaleString("en-US", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
          });
        }
      });
    });

    var track = document.querySelector(".marquee-track");
    if (track) {
      gsap.to(track, {
        xPercent: -50,
        duration: 34,
        ease: "none",
        repeat: -1
      });
    }

    var footerTop = document.querySelector(".footer-top");
    if (footerTop) {
      gsap.from(footerTop, {
        y: 30,
        autoAlpha: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: footerTop,
          start: "top 94%",
          once: true
        },
        onComplete: function () {
          gsap.set(footerTop, { clearProps: "opacity,visibility,transform" });
        }
      });
    }

    window.addEventListener("load", function () {
      ScrollTrigger.refresh();
    });
  }

  function initSearchAndFilters() {
    var searchForm = document.getElementById("searchForm");
    var grid = document.getElementById("propertyGrid");
    if (!grid) return;

    var cards = Array.prototype.slice.call(grid.querySelectorAll(".property-card"));
    var chips = Array.prototype.slice.call(document.querySelectorAll(".filter-pill"));
    var resultsCount = document.getElementById("resultsCount");
    var emptyState = document.getElementById("emptyState");
    var clearButton = document.getElementById("clearFilters");
    var locationSelect = document.getElementById("searchLocation");
    var typeSelect = document.getElementById("searchType");
    var priceSelect = document.getElementById("searchPrice");

    var state = {
      type: "all",
      location: "all",
      budget: "all"
    };

    var params = new URLSearchParams(window.location.search);

    function applyParam(select, key, fallback) {
      var value = params.get(key);
      if (!select || !value) return fallback;
      var valid = Array.prototype.some.call(select.options, function (option) {
        return option.value === value;
      });
      if (valid) select.value = value;
      return valid ? value : fallback;
    }

    state.location = applyParam(locationSelect, "location", "all");
    state.type = applyParam(typeSelect, "type", "all");
    state.budget = applyParam(priceSelect, "price", "all");
    syncChips();

    function parseBudget(value) {
      if (!value || value === "all") return { min: 0, max: Infinity };
      var parts = value.split("-").map(Number);
      return { min: parts[0] || 0, max: parts[1] || Infinity };
    }

    function syncChips() {
      chips.forEach(function (chip) {
        var isActive = chip.getAttribute("data-filter") === state.type;
        chip.classList.toggle("is-active", isActive);
        chip.setAttribute("aria-pressed", String(isActive));
      });
    }

    function applyFilters(animate) {
      var budget = parseBudget(state.budget);
      var visible = 0;

      cards.forEach(function (card) {
        var price = Number(card.getAttribute("data-price"));
        var matchesType = state.type === "all" || card.getAttribute("data-type") === state.type;
        var matchesLocation =
          state.location === "all" ||
          card.getAttribute("data-city").toLowerCase() === state.location.toLowerCase();
        var matchesBudget = price >= budget.min && price <= budget.max;
        var show = matchesType && matchesLocation && matchesBudget;

        card.hidden = !show;
        if (show) visible += 1;
      });

      resultsCount.textContent = visible + (visible === 1 ? " residence" : " residences");
      emptyState.hidden = visible !== 0;

      var hasFilters = state.type !== "all" || state.location !== "all" || state.budget !== "all";
      clearButton.hidden = !hasFilters;

      if (animate && hasGSAP && !prefersReducedMotion && visible > 0) {
        var shownCards = cards.filter(function (card) {
          return !card.hidden;
        });

        window.gsap.fromTo(
          shownCards,
          { autoAlpha: 0, y: 16 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.45,
            stagger: 0.04,
            ease: "power2.out",
            overwrite: true,
            clearProps: "opacity,visibility,transform"
          }
        );
      }
    }

    function resetFilters() {
      state.type = "all";
      state.location = "all";
      state.budget = "all";
      if (searchForm) searchForm.reset();
      syncChips();
      applyFilters(true);
    }

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        state.type = chip.getAttribute("data-filter");
        if (typeSelect) typeSelect.value = state.type;
        syncChips();
        applyFilters(true);
      });
    });

    var filterLinks = Array.prototype.slice.call(document.querySelectorAll(".footer-filter, .type-link"));
    filterLinks.forEach(function (link) {
      link.addEventListener("click", function (event) {
        var filter = link.getAttribute("data-filter");
        if (!filter) return;
        event.preventDefault();
        state.type = filter;
        if (typeSelect) typeSelect.value = state.type;
        if (locationSelect) state.location = locationSelect.value || "all";
        if (priceSelect) state.budget = priceSelect.value || "all";
        syncChips();
        applyFilters(true);
        var section = document.getElementById("properties");
        if (section) {
          section.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });

    if (clearButton) clearButton.addEventListener("click", resetFilters);

    var emptyReset = document.getElementById("emptyReset");
    if (emptyReset) emptyReset.addEventListener("click", resetFilters);

    applyFilters(false);
  }

  function initSavedHomes() {
    var saved = new Set();
    var storageKey = "stackly-saved-homes";

    try {
      var stored = JSON.parse(window.localStorage.getItem(storageKey) || "[]");
      if (Array.isArray(stored)) saved = new Set(stored);
    } catch (error) {
      saved = new Set();
    }

    function getCardTitle(button) {
      var card = button.closest(".property-card");
      var heading = card ? card.querySelector("h3") : null;
      return heading ? heading.textContent.trim() : "this home";
    }

    function syncSavedButtons() {
      document.querySelectorAll("[data-save]").forEach(function (button) {
        var id = button.getAttribute("data-save");
        var isSaved = saved.has(id);
        var title = getCardTitle(button);

        button.classList.toggle("is-saved", isSaved);
        button.setAttribute("aria-pressed", String(isSaved));
        button.setAttribute(
          "aria-label",
          (isSaved ? "Remove " : "Save ") + title + (isSaved ? " from" : " to") + " your shortlist"
        );
      });
    }

    document.addEventListener("click", function (event) {
      var button = event.target.closest("[data-save]");
      if (!button) return;

      event.preventDefault();
      var id = button.getAttribute("data-save");
      var title = getCardTitle(button);

      if (saved.has(id)) {
        saved.delete(id);
        showToast("Removed from your shortlist", title + " is no longer saved.");
      } else {
        saved.add(id);
        showToast("Saved to your shortlist", "We'll keep " + title + " close at hand.");
      }

      try {
        window.localStorage.setItem(storageKey, JSON.stringify(Array.from(saved)));
      } catch (error) {
        // Storage can be unavailable in private browsing; the UI still works for this session.
      }

      syncSavedButtons();
    });

    syncSavedButtons();
  }

  var propertyData = {
    "ocean-house": {
      title: "Ocean House",
      type: "Villa · California",
      location: "Malibu, California",
      price: "$12,400",
      tag: "Villa",
      image: "assets/images/property-01.webp",
      alt: "Modern villa with a pool at dusk",
      description:
        "A rare oceanfront retreat with floor-to-ceiling glass, a sun-drenched pool terrace, and direct beach access. Designed for slow mornings and long dinners.",
      beds: "4",
      baths: "5",
      area: "4,200",
      features: ["Private pool", "Pet friendly", "Furnished", "Ocean view"]
    },
    "the-atelier": {
      title: "The Atelier",
      type: "Apartment · New York",
      location: "SoHo, New York",
      price: "$8,900",
      tag: "Apartment",
      image: "assets/images/property-03.webp",
      alt: "Warm, gallery-like apartment interior with natural light",
      description:
        "A gallery-like loft in the heart of SoHo with oversized windows, original cast-iron details, and a quietly luxurious renovation by a local design studio.",
      beds: "2",
      baths: "2",
      area: "1,650",
      features: ["Doorman", "Pet friendly", "Furnished", "Gym access"]
    },
    "casa-marea": {
      title: "Casa Marea",
      type: "Villa · California",
      location: "Palm Springs, California",
      price: "$9,600",
      tag: "Villa",
      image: "assets/images/property-04.webp",
      alt: "Desert modern home with sculptural architecture",
      description:
        "Desert modernism at its most considered. A private courtyard, mountain views, and a pool that catches the last light of the day.",
      beds: "5",
      baths: "4",
      area: "3,800",
      features: ["Private pool", "Mountain view", "Furnished", "Fireplace"]
    },
    "skyline-penthouse": {
      title: "Skyline Penthouse",
      type: "Penthouse · Florida",
      location: "Brickell, Miami",
      price: "$15,200",
      tag: "Penthouse",
      image: "assets/images/property-02.webp",
      alt: "Contemporary waterfront residence with clean lines",
      description:
        "A full-floor penthouse above Brickell with wraparound terraces, sunset water views, and hotel-level services just an elevator ride away.",
      beds: "3",
      baths: "3",
      area: "2,900",
      features: ["Wraparound terrace", "Concierge", "Furnished", "Water view"]
    },
    "the-grove": {
      title: "The Grove",
      type: "Apartment · Texas",
      location: "East Austin, Texas",
      price: "$6,400",
      tag: "Apartment",
      image: "assets/images/property-05.webp",
      alt: "Sunlit living room with warm wood and designer furniture",
      description:
        "A warm, light-filled home tucked into a leafy East Austin block. Walk to coffee, galleries, and the best tacos in the city.",
      beds: "2",
      baths: "2",
      area: "1,420",
      features: ["Private balcony", "Pet friendly", "Furnished", "Parking"]
    },
    "cedar-haus": {
      title: "Cedar Haus",
      type: "Cabin · California",
      location: "Big Sur, California",
      price: "$7,800",
      tag: "Cabin",
      image: "assets/images/property-06.webp",
      alt: "Secluded modern cabin surrounded by trees",
      description:
        "A secluded cedar-clad retreat among the redwoods. Deep tubs, a wood-burning stove, and nothing but the sound of the trees.",
      beds: "3",
      baths: "2",
      area: "2,100",
      features: ["Wood stove", "Pet friendly", "Furnished", "Forest view"]
    }
  };

  var activeProperty = null;

  function initPropertyModal() {
    var modal = document.getElementById("propertyModal");
    if (!modal) return;

    var image = document.getElementById("modalImage");
    var tag = document.getElementById("modalTag");
    var type = document.getElementById("modalType");
    var title = document.getElementById("propertyModalTitle");
    var location = document.getElementById("modalLocation");
    var price = document.getElementById("modalPrice");
    var description = document.getElementById("modalDescription");
    var beds = document.getElementById("modalBeds");
    var baths = document.getElementById("modalBaths");
    var area = document.getElementById("modalArea");
    var features = modal.querySelector(".property-modal__features");
    var tourButton = document.getElementById("modalTour");

    function populateModal(id) {
      var property = propertyData[id];
      if (!property) return;

      activeProperty = property;
      image.src = property.image;
      image.alt = property.alt;
      tag.textContent = property.tag;
      type.textContent = property.type;
      title.textContent = property.title;
      location.textContent = property.location;
      price.innerHTML = property.price + " <span>/ month</span>";
      description.textContent = property.description;
      beds.textContent = property.beds;
      baths.textContent = property.baths;
      area.textContent = property.area;

      features.innerHTML = property.features
        .map(function (feature) {
          return (
            '<span><svg class="icon" aria-hidden="true"><use href="#icon-check"></use></svg>' +
            feature +
            "</span>"
          );
        })
        .join("");
    }

    document.querySelectorAll(".js-open-property").forEach(function (button) {
      button.addEventListener("click", function () {
        populateModal(button.getAttribute("data-property"));
      });
    });

    if (tourButton) {
      tourButton.addEventListener("click", function () {
        var instance = window.bootstrap ? bootstrap.Modal.getInstance(modal) : null;
        if (instance) instance.hide();

        showToast(
          "Viewing request received",
          activeProperty
            ? "We'll be in touch about " + activeProperty.title + " within one business day."
            : "We'll be in touch within one business day."
        );
      });
    }
  }

  function initInquiryModal() {
    var modal = document.getElementById("inquiryModal");
    if (!modal) return;

    var title = document.getElementById("inquiryModalTitle");
    var intentSelect = document.getElementById("inquiryIntent");
    var defaultTitle = title ? title.textContent : "Let's talk.";

    document.querySelectorAll('[data-bs-target="#inquiryModal"]').forEach(function (trigger) {
      trigger.addEventListener("click", function () {
        var nextTitle = trigger.getAttribute("data-inquiry-title");
        var nextIntent = trigger.getAttribute("data-inquiry-intent");

        if (title) title.textContent = nextTitle || defaultTitle;

        if (intentSelect && nextIntent) {
          Array.prototype.forEach.call(intentSelect.options, function (option) {
            if (option.value === nextIntent) intentSelect.value = option.value;
          });
        }
      });
    });
  }

  function initTestimonials() {
    var carousel = document.getElementById("testimonialCarousel");
    if (!carousel) return;

    var index = document.getElementById("testimonialIndex");

    carousel.addEventListener("slid.bs.carousel", function (event) {
      var nextIndex = typeof event.to === "number" ? event.to : 0;
      if (index) index.textContent = String(nextIndex + 1).padStart(2, "0");

      if (hasGSAP && !prefersReducedMotion) {
        var content = event.relatedTarget.querySelectorAll("blockquote, figcaption");
        window.gsap.fromTo(
          content,
          { y: 18, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.6,
            stagger: 0.07,
            ease: "power3.out",
            clearProps: "opacity,visibility,transform"
          }
        );
      }
    });
  }

  function showToast(title, message) {
    var toastElement = document.getElementById("siteToast");
    if (!toastElement || !window.bootstrap) return;

    var titleElement = document.getElementById("toastTitle");
    var messageElement = document.getElementById("toastMessage");

    if (titleElement) titleElement.textContent = title;
    if (messageElement) messageElement.textContent = message;

    var toast = bootstrap.Toast.getOrCreateInstance(toastElement, { delay: 4300 });
    toast.show();
  }

  function hideModal(element) {
    if (!element || !window.bootstrap) return;
    var instance = bootstrap.Modal.getInstance(element);
    if (instance) instance.hide();
  }

  function emailFeedbackElement(input) {
    if (!input) return null;

    var ids = String(input.getAttribute("aria-describedby") || "").split(/\s+/);
    for (var i = 0; i < ids.length; i += 1) {
      if (!ids[i]) continue;
      var element = document.getElementById(ids[i]);
      if (element) return element;
    }

    return null;
  }

  function showEmailError(input, message) {
    if (!input) return;

    var feedback = emailFeedbackElement(input);
    var field = input.closest(".newsletter-strip__field");

    input.classList.add("is-invalid");
    input.setAttribute("aria-invalid", "true");
    input.setCustomValidity(message);

    if (feedback) {
      feedback.textContent = message;
      if (feedback.classList.contains("newsletter-strip__error")) {
        feedback.hidden = false;
      }
    }

    if (field) field.classList.add("has-error");
  }

  function clearEmailError(input) {
    if (!input) return;

    var feedback = emailFeedbackElement(input);
    var field = input.closest(".newsletter-strip__field");

    input.classList.remove("is-invalid");
    input.removeAttribute("aria-invalid");
    input.setCustomValidity("");

    if (feedback && feedback.classList.contains("newsletter-strip__error")) {
      feedback.hidden = true;
    }

    if (field) field.classList.remove("has-error");
  }

  function validateEmailField(input, showEmpty) {
    if (!input) return true;

    var result = window.StacklyEmail.validate(input.value);
    if (result.valid) {
      clearEmailError(input);
      return true;
    }

    if (showEmpty || input.value.trim()) {
      showEmailError(input, result.message);
    }

    return false;
  }

  function bindEmailValidation(input) {
    if (!input) return;

    input.addEventListener("blur", function () {
      validateEmailField(input, true);
    });

    input.addEventListener("input", function () {
      if (input.classList.contains("is-invalid")) {
        validateEmailField(input, true);
      }
    });
  }

  function initInquiryForm() {
    var form = document.getElementById("inquiryForm");
    if (!form) return;

    var nameInput = document.getElementById("inquiryName");
    var emailInput = document.getElementById("inquiryEmail");
    var phoneInput = document.getElementById("inquiryPhone");
    var intentInput = document.getElementById("inquiryIntent");

    if (!nameInput || !emailInput || !phoneInput || !intentInput) return;

    var fields = [
      {
        control: nameInput,
        error: document.getElementById("inquiryNameError"),
        validate: function (value) {
          var name = String(value || "").trim();
          if (!name) return { valid: false, message: "Please enter your name." };
          if (!/^[A-Za-z]+(?:\s+[A-Za-z]+)*$/.test(name)) {
            return { valid: false, message: "Your name can only contain letters and spaces." };
          }
          return { valid: true, message: "" };
        }
      },
      {
        control: emailInput,
        error: document.getElementById("inquiryEmailError"),
        validate: function (value) {
          return window.StacklyEmail.validate(value);
        }
      },
      {
        control: phoneInput,
        error: document.getElementById("inquiryPhoneError"),
        validate: function (value) {
          var phone = String(value || "").trim();
          if (!phone) return { valid: false, message: "Please enter your phone number." };
          if (!/^\d+$/.test(phone)) {
            return { valid: false, message: "Your phone number can only contain digits." };
          }
          return { valid: true, message: "" };
        }
      },
      {
        control: intentInput,
        error: document.getElementById("inquiryIntentError"),
        validate: function (value) {
          if (!String(value || "").trim()) {
            return { valid: false, message: "Please select what you need help with." };
          }
          return { valid: true, message: "" };
        }
      }
    ];

    var submitted = false;

    function showFieldError(field, message) {
      field.control.classList.add("is-invalid");
      field.control.setAttribute("aria-invalid", "true");
      field.control.setCustomValidity(message);

      if (field.error) {
        field.error.textContent = message;
        field.error.classList.add("is-visible");
      }
    }

    function clearFieldError(field) {
      field.control.classList.remove("is-invalid");
      field.control.removeAttribute("aria-invalid");
      field.control.setCustomValidity("");

      if (field.error) field.error.classList.remove("is-visible");
    }

    function validateField(field) {
      var result = field.validate(field.control.value);

      if (result.valid) {
        clearFieldError(field);
        return true;
      }

      showFieldError(field, result.message);
      return false;
    }

    fields.forEach(function (field) {
      function handleChange() {
        if (submitted || field.control.classList.contains("is-invalid")) {
          validateField(field);
        }
      }

      field.control.addEventListener("input", handleChange);
      field.control.addEventListener("change", handleChange);

      field.control.addEventListener("blur", function () {
        if (submitted || field.control.value.trim()) validateField(field);
      });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      submitted = true;

      var firstInvalid = null;
      fields.forEach(function (field) {
        if (!validateField(field) && !firstInvalid) firstInvalid = field;
      });

      if (firstInvalid) {
        firstInvalid.control.focus();
        return;
      }

      window.location.assign("404.html");
    });
  }

  function initForms() {
    initInquiryForm();

    var newsletterForm = document.getElementById("newsletterForm");

    if (newsletterForm) {
      newsletterForm.addEventListener("submit", function (event) {
        event.preventDefault();

        if (!newsletterForm.checkValidity()) {
          newsletterForm.reportValidity();
          return;
        }

        var emailField = document.getElementById("newsletterEmail");
        newsletterForm.reset();
        if (emailField) emailField.blur();
        showToast("You're on the list", "Look out for our next edit of remarkable homes.");
      });
    }
  }

  function initNewsletterRedirect() {
    var redirectUrl = "404.html";
    var forms = document.querySelectorAll(".newsletter-strip__form");

    Array.prototype.forEach.call(forms, function (form) {
      var email = form.querySelector('input[type="email"]');
      if (!email) return;

      bindEmailValidation(email);

      form.addEventListener("submit", function (event) {
        event.preventDefault();

        if (!validateEmailField(email, true)) {
          window.setTimeout(function () {
            email.focus();
          }, 0);
          return;
        }

        window.location.assign(redirectUrl);
      });
    });
  }

  function initHeroSearch() {
    var forms = document.querySelectorAll(".search-panel");

    Array.prototype.forEach.call(forms, function (form) {
      var fields = [
        { control: form.querySelector('select[name="location"]'), label: "a location" },
        { control: form.querySelector('select[name="type"]'), label: "a property type" },
        { control: form.querySelector('select[name="price"]'), label: "a monthly budget" }
      ];
      var error = form.querySelector(".search-panel__error");
      var missingControl = fields.some(function (field) {
        return !field.control;
      });

      if (!error || missingControl) return;

      var submitted = false;

      function getMissingFields() {
        return fields.filter(function (field) {
          return !String(field.control.value || "").trim();
        });
      }

      function formatFields(items) {
        var labels = items.map(function (field) {
          return field.label;
        });

        if (labels.length === 1) return labels[0];
        if (labels.length === 2) return labels[0] + " and " + labels[1];
        return labels.slice(0, -1).join(", ") + ", and " + labels[labels.length - 1];
      }

      function markInvalid(field) {
        field.control.setAttribute("aria-invalid", "true");
        var wrapper = field.control.closest(".search-field");
        if (wrapper) wrapper.classList.add("has-error");
      }

      function clearInvalid(field) {
        field.control.removeAttribute("aria-invalid");
        var wrapper = field.control.closest(".search-field");
        if (wrapper) wrapper.classList.remove("has-error");
      }

      function updateError() {
        var missing = getMissingFields();

        if (!missing.length) {
          error.textContent = "";
          error.hidden = true;
          return;
        }

        error.textContent = "Please select " + formatFields(missing) + " to continue.";
        error.hidden = false;
      }

      fields.forEach(function (field) {
        field.control.addEventListener("change", function () {
          if (field.control.value) clearInvalid(field);

          if (submitted) {
            if (field.control.value) clearInvalid(field);
            else markInvalid(field);
            updateError();
          }
        });
      });

      form.addEventListener("submit", function (event) {
        event.preventDefault();
        submitted = true;

        var missing = getMissingFields();
        fields.forEach(function (field) {
          if (field.control.value) clearInvalid(field);
          else markInvalid(field);
        });

        if (missing.length) {
          updateError();
          window.setTimeout(function () {
            missing[0].control.focus();
          }, 0);
          return;
        }

        error.textContent = "";
        error.hidden = true;
        window.location.assign("404.html");
      });
    });
  }

  function initContactIntent() {
    var intentSelect = document.getElementById("inquiryIntent");
    if (!intentSelect) return;

    var intent = new URLSearchParams(window.location.search).get("intent");
    if (!intent) return;

    Array.prototype.forEach.call(intentSelect.options, function (option) {
      if (option.value === intent) intentSelect.value = option.value;
    });
  }

  function initHashScroll() {
    if (!window.location.hash) return;

    function scrollToHash() {
      var target;
      try {
        target = document.querySelector(window.location.hash);
      } catch (error) {
        return;
      }
      if (!target) return;

      var header = document.querySelector(".site-header");
      var offset = header ? header.getBoundingClientRect().height : 0;
      var top = target.getBoundingClientRect().top + window.pageYOffset - offset - 16;
      window.scrollTo(0, Math.max(0, top));
    }

    if (document.readyState === "complete") {
      window.setTimeout(scrollToHash, 100);
    } else {
      window.addEventListener("load", function () {
        window.setTimeout(scrollToHash, 100);
      }, { once: true });
    }
  }

  function initMagneticButtons() {
    var supportsFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!hasGSAP || prefersReducedMotion || !supportsFinePointer) return;

    var gsap = window.gsap;

    document.querySelectorAll("[data-magnetic]").forEach(function (button) {
      button.addEventListener("mousemove", function (event) {
        var rect = button.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        var x = event.clientX - rect.left - rect.width / 2;
        var y = event.clientY - rect.top - rect.height / 2;

        gsap.to(button, {
          x: x * 0.16,
          y: y * 0.16,
          duration: 0.35,
          ease: "power2.out",
          overwrite: "auto"
        });
      });

      button.addEventListener("mouseleave", function () {
        gsap.to(button, {
          x: 0,
          y: 0,
          duration: 0.55,
          ease: "elastic.out(1, 0.45)",
          overwrite: "auto"
        });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initHeader();
    initSearchAndFilters();
    initHeroSearch();
    initSavedHomes();
    initPropertyModal();
    initInquiryModal();
    initTestimonials();
    initForms();
    initNewsletterRedirect();
    initContactIntent();
    initHashScroll();
    initHeroAnimation();
    initScrollAnimations();
    initMagneticButtons();
  });
})();
