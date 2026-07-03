/* ============================================================
   Apartmán u mešťana — script.js
   Vanilla JS: header shadow, mobile menu, language switcher,
   lightbox gallery, scroll-reveal, cookie banner, footer year.
   ============================================================ */

(function () {
  "use strict";

  /* -------- Footer year -------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* -------- Cookie helpers (used for language + consent) -------- */
  var COOKIE_MAX_DAYS = 365; // ~12 months, matches the cookie modal text
  function setCookie(name, value, days) {
    var d = new Date();
    d.setTime(d.getTime() + days * 86400000);
    document.cookie = name + "=" + encodeURIComponent(value) +
      ";expires=" + d.toUTCString() + ";path=/;SameSite=Lax";
  }
  function getCookie(name) {
    var m = document.cookie.match("(?:^|; )" + name + "=([^;]*)");
    return m ? decodeURIComponent(m[1]) : null;
  }

  /* ==========================================================
     Auto-loading galleries — drop 01.jpg, 02.jpg … into the
     folder (up to MAX) and they appear automatically.
     Each candidate is probed first; only files that actually
     exist get a tile, inserted in numeric order. Missing numbers
     are skipped — no gaps, no empty tiles. Built before the
     lightbox wires up so the new tiles get picked up.
     ========================================================== */
  function autoGallery(containerId, path, group, max, alt) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var insertInOrder = function (a, num) {
      var kids = container.children;
      for (var i = 0; i < kids.length; i++) {
        if (Number(kids[i].dataset.num) > num) {
          container.insertBefore(a, kids[i]);
          return;
        }
      }
      container.appendChild(a);
    };

    var addTile = function (src, num) {
      var a = document.createElement("a");
      a.className = "gallery-item";
      a.href = src;
      a.dataset.num = num;
      a.setAttribute("data-lightbox", group);
      var img = document.createElement("img");
      img.src = src; // already cached by the probe → instant
      img.alt = alt;
      img.loading = "lazy";
      a.appendChild(img);
      insertInOrder(a, num);
    };

    for (var n = 1; n <= max; n++) {
      (function (num) {
        // Accept 1-, 2- or 3-digit names: 1.jpg / 01.jpg / 001.jpg.
        var names = [String(num), ("0" + num).slice(-2), ("00" + num).slice(-3)];
        var candidates = [];
        names.forEach(function (nm) {
          var src = path + nm + ".jpg";
          if (candidates.indexOf(src) === -1) candidates.push(src);
        });
        // Try each variant in order; use the first one that exists.
        (function tryNext(i) {
          if (i >= candidates.length) return;
          var src = candidates[i];
          var probe = new Image();
          probe.onload = function () { addTile(src, num); };
          probe.onerror = function () { tryNext(i + 1); };
          probe.src = src;
        })(0);
      })(n);
    }
  }

  // Apartment interior gallery (default lightbox group "")
  autoGallery("apartmentGallery", "assets/img/apartment/", "", 30, "Apartmán u Mešťana");
  // Town & surroundings gallery ("mood" lightbox group)
  autoGallery("moodGallery", "assets/img/gallery/", "mood", 30, "Banská Štiavnica a okolie");

  /* ==========================================================
     Carousel arrows — prev/next scroll the track by one slide.
     Arrows hide at the start/end. Works with the auto-loaded
     slides (widths are read at click time).
     ========================================================== */
  document.querySelectorAll(".carousel").forEach(function (car) {
    var track = car.querySelector(".carousel-track");
    var prev = car.querySelector(".carousel-prev");
    var next = car.querySelector(".carousel-next");
    if (!track) return;

    function slideStep() {
      var slide = track.querySelector(".gallery-item");
      if (slide) return slide.getBoundingClientRect().width + 14; // + gap
      return track.clientWidth * 0.8;
    }
    function updateArrows() {
      var maxScroll = track.scrollWidth - track.clientWidth - 1;
      if (prev) prev.hidden = track.scrollLeft <= 0;
      if (next) next.hidden = track.scrollLeft >= maxScroll;
    }

    if (prev) prev.addEventListener("click", function () {
      track.scrollBy({ left: -slideStep(), behavior: "smooth" });
    });
    if (next) next.addEventListener("click", function () {
      track.scrollBy({ left: slideStep(), behavior: "smooth" });
    });

    track.addEventListener("scroll", function () {
      window.requestAnimationFrame(updateArrows);
    }, { passive: true });
    window.addEventListener("resize", updateArrows);
    // Slides load asynchronously — refresh arrow state a few times after load
    updateArrows();
    setTimeout(updateArrows, 400);
    setTimeout(updateArrows, 1500);
  });

  /* ==========================================================
     Header: add shadow once the user scrolls
     ========================================================== */
  var header = document.getElementById("siteHeader");
  function onScroll() {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ==========================================================
     Mobile menu
     ========================================================== */
  var hamburger = document.getElementById("hamburger");
  var nav = document.getElementById("primaryNav");

  function closeMenu() {
    if (!nav || !hamburger) return;
    nav.classList.remove("open");
    hamburger.setAttribute("aria-expanded", "false");
  }

  if (hamburger && nav) {
    hamburger.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      hamburger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    // Close after tapping a nav link
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeMenu);
    });
  }
  // Close menu on Escape
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeMenu();
  });

  /* ==========================================================
     Language switcher (Option A: data-sk / data-en)
     ========================================================== */
  var langButtons = document.querySelectorAll(".lang-btn");

  function getStoredLang() { return getCookie("lang"); }
  function storeLang(lang) { setCookie("lang", lang, COOKIE_MAX_DAYS); }

  function applyLanguage(lang) {
    if (lang !== "sk" && lang !== "en") lang = "sk";

    document.documentElement.lang = lang;

    // Swap every element that carries both strings
    document.querySelectorAll("[data-" + lang + "]").forEach(function (el) {
      var val = el.getAttribute("data-" + lang);
      if (val === null) return;

      if (el.tagName === "TITLE") {
        document.title = val;
      } else if (el.tagName === "META") {
        el.setAttribute("content", val);
      } else {
        el.textContent = val;
      }
    });

    // Update toggle state
    langButtons.forEach(function (btn) {
      var active = btn.getAttribute("data-lang") === lang;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });

    storeLang(lang);
  }

  langButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      applyLanguage(btn.getAttribute("data-lang"));
    });
  });

  // Initial language: stored choice → Slovak default
  applyLanguage(getStoredLang() || "sk");

  /* ==========================================================
     Scroll reveal (IntersectionObserver)
     ========================================================== */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ==========================================================
     Lightbox gallery
     ========================================================== */
  var lightbox = document.getElementById("lightbox");
  var lbImage = document.getElementById("lbImage");
  var lbClose = document.getElementById("lbClose");
  var lbPrev = document.getElementById("lbPrev");
  var lbNext = document.getElementById("lbNext");

  var currentGroup = [];
  var currentIndex = 0;

  function openLightbox(items, index) {
    currentGroup = items;
    currentIndex = index;
    showCurrent();
    lightbox.hidden = false;
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    lbClose.focus();
  }

  function closeLightbox() {
    lightbox.hidden = true;
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    lbImage.src = "";
  }

  function showCurrent() {
    var item = currentGroup[currentIndex];
    if (!item) return;
    lbImage.src = item.href;
    var img = item.querySelector("img");
    lbImage.alt = img ? img.alt : "";
  }

  function step(delta) {
    if (!currentGroup.length) return;
    currentIndex = (currentIndex + delta + currentGroup.length) % currentGroup.length;
    showCurrent();
  }

  if (lightbox && lbImage) {
    // Delegated so it also covers gallery tiles added dynamically after load.
    document.addEventListener("click", function (e) {
      var link = e.target.closest ? e.target.closest("[data-lightbox]") : null;
      if (!link) return;
      e.preventDefault();
      // Group by the data-lightbox value (default group = "")
      var groupName = link.getAttribute("data-lightbox") || "";
      var group = Array.prototype.slice.call(
        document.querySelectorAll('[data-lightbox="' + groupName + '"]')
      );
      openLightbox(group, group.indexOf(link));
    });

    lbClose.addEventListener("click", closeLightbox);
    lbPrev.addEventListener("click", function () { step(-1); });
    lbNext.addEventListener("click", function () { step(1); });

    // Click on backdrop (not the image or buttons) closes
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener("keydown", function (e) {
      if (lightbox.hidden) return;
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
    });
  }

  /* ==========================================================
     Cookie banner
     Shows until the visitor dismisses it, then remembers the
     choice in the `cookie_consent` cookie (12 months).
     ========================================================== */
  var banner = document.getElementById("cookieBanner");
  var acceptBtn = document.getElementById("cookieAccept");

  function cookieAccepted() { return getCookie("cookie_consent") === "1"; }

  if (banner && acceptBtn) {
    if (!cookieAccepted()) {
      banner.hidden = false;
    }
    acceptBtn.addEventListener("click", function () {
      setCookie("cookie_consent", "1", COOKIE_MAX_DAYS);
      banner.hidden = true;
    });
  }

  /* ==========================================================
     Cookie info modal ("More" link in the banner + footer link)
     Exposed on window so inline onclick handlers can reach them.
     ========================================================== */
  var cookieModal = document.getElementById("cookie-modal");

  window.openCookieModal = function () {
    if (!cookieModal) return;
    cookieModal.classList.add("is-open");
    document.body.style.overflow = "hidden";
  };
  window.closeCookieModal = function () {
    if (!cookieModal) return;
    cookieModal.classList.remove("is-open");
    document.body.style.overflow = "";
  };

  if (cookieModal) {
    // Close on backdrop click
    cookieModal.addEventListener("click", function (e) {
      if (e.target === cookieModal) window.closeCookieModal();
    });
    // Close on Escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && cookieModal.classList.contains("is-open")) {
        window.closeCookieModal();
      }
    });
  }

})();
