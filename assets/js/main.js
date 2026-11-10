/* ==========================================================================
   main.js — My Order Line
   Dependency-free UI behaviour (replaces jQuery, SmartMenus, Swiper,
   jquery-numerator, Lottie and the Elementor frontend runtime).
   Modules: header, mobileNav, reveal, counters, carousel, accordion, tabs, forms
   ========================================================================== */
(function () {
  "use strict";

  var mqDesktop = window.matchMedia("(min-width: 1025px)");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var on = function (el, ev, fn, opt) { el && el.addEventListener(ev, fn, opt || false); };
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ------------------------------------------------ header scroll state */
  function initHeader() {
    var header = $(".site-header");
    if (!header) return;
    var apply = function () { header.classList.toggle("is-scrolled", window.scrollY > 12); };
    apply();
    on(window, "scroll", apply, { passive: true });
  }

  /* ------------------------------------------------ mobile navigation */
  function initNav() {
    var toggle = $(".nav-toggle");
    var nav = $(".nav");
    var backdrop = $(".nav-backdrop");
    if (!toggle || !nav) return;

    function setOpen(open) {
      document.body.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
    }
    on(toggle, "click", function () { setOpen(!document.body.classList.contains("nav-open")); });
    on(backdrop, "click", function () { setOpen(false); });
    on(document, "keydown", function (e) { if (e.key === "Escape") setOpen(false); });

    /* submenu accordions (mobile only) */
    $$(".nav__item.has-sub").forEach(function (item) {
      var link = item.querySelector(":scope > .nav__link");
      on(link, "click", function (e) {
        if (mqDesktop.matches) return;                 // desktop uses hover
        var href = link.getAttribute("href");
        if (!href || href === "#") e.preventDefault();
        var wasOpen = item.classList.contains("is-open");
        // close siblings
        $$(".nav__item.has-sub.is-open").forEach(function (s) { if (s !== item) s.classList.remove("is-open"); });
        item.classList.toggle("is-open", !wasOpen);
      });
    });

    /* close drawer after tapping a real link */
    $$(".nav a").forEach(function (a) {
      on(a, "click", function () {
        var href = a.getAttribute("href");
        if (href && href !== "#" && !mqDesktop.matches) setOpen(false);
      });
    });

    /* reset state when crossing back to desktop */
    on(mqDesktop, "change", function (e) {
      if (e.matches) { setOpen(false); $$(".nav__item.is-open").forEach(function (i) { i.classList.remove("is-open"); }); }
    });
  }

  /* ------------------------------------------------ scroll reveal */
  function initReveal() {
    var items = $$("[data-reveal]");
    if (!items.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var el = en.target;
          var delay = el.getAttribute("data-reveal-delay");
          if (delay) el.style.setProperty("--reveal-delay", delay + "ms");
          el.classList.add("is-visible");
          io.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------ count-up numbers */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-target")) || 0;
    var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var dur = parseInt(el.getAttribute("data-duration") || "2000", 10);
    if (reduceMotion) { el.textContent = target.toFixed(decimals); return; }
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);           // easeOutCubic
      el.textContent = (target * eased).toFixed(decimals);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target.toFixed(decimals);
    }
    requestAnimationFrame(step);
  }
  function initCounters() {
    var nums = $$(".count[data-target]");
    if (!nums.length) return;
    if (!("IntersectionObserver" in window)) { nums.forEach(animateCount); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { animateCount(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.4 });
    nums.forEach(function (n) { io.observe(n); });
  }

  /* ------------------------------------------------ carousel / slider */
  function initCarousels() {
    $$("[data-carousel]").forEach(function (root) {
      var track = $(".carousel__track", root);
      var slides = $$(".carousel__slide", root);
      if (!track || !slides.length) return;

      var perView = function () {
        var w = window.innerWidth;
        var d = root.dataset;
        if (w <= 767) return parseInt(d.perSm || 1, 10);
        if (w <= 1024) return parseInt(d.perMd || d.per || 2, 10);
        return parseInt(d.per || 1, 10);
      };
      var index = 0, per = perView(), autoTimer = null;
      var dotsWrap = $(".carousel__dots", root);
      var prev = $("[data-prev]", root), next = $("[data-next]", root);

      function pages() { return Math.max(1, slides.length - per + 1); }
      function layout() {
        per = perView();
        slides.forEach(function (s) { s.style.flexBasis = (100 / per) + "%"; });
        index = Math.min(index, pages() - 1);
        buildDots();
        go(index);
      }
      function buildDots() {
        if (!dotsWrap) return;
        dotsWrap.innerHTML = "";
        for (var i = 0; i < pages(); i++) {
          var b = document.createElement("button");
          b.className = "carousel__dot" + (i === index ? " is-active" : "");
          b.setAttribute("aria-label", "Go to slide " + (i + 1));
          (function (i) { on(b, "click", function () { go(i); rest(); }); })(i);
          dotsWrap.appendChild(b);
        }
      }
      function go(i) {
        index = (i + pages()) % pages();
        var offset = -(index * (100 / per));
        track.style.transform = "translateX(" + offset + "%)";
        if (dotsWrap) $$(".carousel__dot", dotsWrap).forEach(function (d, di) { d.classList.toggle("is-active", di === index); });
      }
      on(prev, "click", function () { go(index - 1); rest(); });
      on(next, "click", function () { go(index + 1); rest(); });

      /* autoplay */
      function auto() {
        var ms = parseInt(root.dataset.autoplay || 0, 10);
        if (!ms || reduceMotion) return;
        autoTimer = setInterval(function () { go(index + 1); }, ms);
      }
      function rest() { if (autoTimer) { clearInterval(autoTimer); auto(); } }
      on(root, "mouseenter", function () { if (autoTimer) clearInterval(autoTimer); });
      on(root, "mouseleave", function () { rest(); });

      /* touch / drag swipe */
      var startX = 0, dx = 0, dragging = false;
      function down(x) { dragging = true; startX = x; dx = 0; track.style.transition = "none"; }
      function move(x) { if (!dragging) return; dx = x - startX; }
      function up() {
        if (!dragging) return;
        dragging = false; track.style.transition = "";
        if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
        else go(index);
        rest();
      }
      on(track, "touchstart", function (e) { down(e.touches[0].clientX); }, { passive: true });
      on(track, "touchmove", function (e) { move(e.touches[0].clientX); }, { passive: true });
      on(track, "touchend", up);
      on(track, "mousedown", function (e) { e.preventDefault(); down(e.clientX); });
      on(window, "mousemove", function (e) { move(e.clientX); });
      on(window, "mouseup", up);

      var rt;
      on(window, "resize", function () { clearTimeout(rt); rt = setTimeout(layout, 150); });
      layout(); auto();
    });
  }

  /* ------------------------------------------------ accordion (FAQ) */
  function initAccordions() {
    $$(".accordion").forEach(function (acc) {
      var single = acc.dataset.single !== "false";
      $$(".acc-item", acc).forEach(function (item) {
        var trigger = $(".acc-trigger", item);
        var panel = $(".acc-panel", item);
        on(trigger, "click", function () {
          var open = item.classList.contains("is-open");
          if (single) $$(".acc-item.is-open", acc).forEach(function (o) {
            o.classList.remove("is-open"); var p = $(".acc-panel", o); if (p) p.style.maxHeight = null;
            var t = $(".acc-trigger", o); if (t) t.setAttribute("aria-expanded", "false");
          });
          item.classList.toggle("is-open", !open);
          trigger.setAttribute("aria-expanded", !open ? "true" : "false");
          panel.style.maxHeight = !open ? panel.scrollHeight + "px" : null;
        });
      });
    });
  }

  /* ------------------------------------------------ tabs */
  function initTabs() {
    $$("[data-tabs]").forEach(function (root) {
      var btns = $$(".tab-btn", root);
      btns.forEach(function (btn) {
        on(btn, "click", function () {
          var id = btn.getAttribute("data-tab");
          btns.forEach(function (b) { b.classList.toggle("is-active", b === btn); });
          $$(".tab-panel", root).forEach(function (p) { p.classList.toggle("is-active", p.getAttribute("data-panel") === id); });
        });
      });
    });
  }

  /* ------------------------------------------------ forms (client-side) */
  function initForms() {
    $$("form[data-form]").forEach(function (form) {
      var note = $(".form-note", form);
      on(form, "submit", function (e) {
        e.preventDefault();
        var ok = true;
        $$("[required]", form).forEach(function (f) {
          var valid = f.value.trim() !== "" && (f.type !== "email" || /.+@.+\..+/.test(f.value));
          f.classList.toggle("is-invalid", !valid);
          if (!valid) ok = false;
        });
        if (!note) return;
        if (!ok) { note.textContent = "Please complete all fields with a valid email."; note.className = "form-note error"; return; }
        note.textContent = "Thanks! Your request has been received — we'll be in touch shortly."; note.className = "form-note ok";
        form.reset();
      });
    });
  }

  /* ------------------------------------------------ boot */
  function boot() {
    initHeader(); initNav(); initReveal(); initCounters();
    initCarousels(); initAccordions(); initTabs(); initForms();
  }
  if (document.readyState === "loading") on(document, "DOMContentLoaded", boot);
  else boot();
})();
