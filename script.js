/* Malixis — progressive enhancement. The site is fully usable without JS. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var body = document.body;

  /* ==================== Sticky header state ==================== */
  var header = document.querySelector(".site-header");
  var onScroll = function () {
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ==================== Mobile menu ==================== */
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.getElementById("mobile-menu");

  if (toggle && menu) {
    var setMenu = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      menu.hidden = !open;
      menu.classList.toggle("is-open", open);
    };

    toggle.addEventListener("click", function () {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });

    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setMenu(false);
        toggle.focus();
      }
    });
  }

  /* ==================== Marquee: duplicate track for seamless loop ==================== */
  document.querySelectorAll("[data-marquee] .marquee-track").forEach(function (track) {
    if (reduceMotion) return;
    Array.prototype.slice.call(track.children).forEach(function (item) {
      var clone = item.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      track.appendChild(clone);
    });
  });

  /* ==================== Hero title: word-by-word blur reveal ==================== */
  var heroTitle = document.querySelector(".hero-title");
  var titleSplit = false;

  var splitHeroTitle = function () {
    if (!heroTitle || reduceMotion || titleSplit) return;
    var delay = 0.05;
    var step = 0.085;

    var wrapWords = function (source, target) {
      Array.prototype.slice.call(source.childNodes).forEach(function (child) {
        if (child.nodeType === Node.TEXT_NODE) {
          // Split on breakable whitespace only — words joined by &nbsp; stay
          // in one span, preserving the editorial line breaks
          child.textContent.split(/([ \t\r\n\f]+)/).forEach(function (part) {
            if (!part) return;
            if (/^[ \t\r\n\f]+$/.test(part)) {
              target.appendChild(document.createTextNode(" "));
              return;
            }
            var wi = document.createElement("span");
            wi.className = "wi";
            wi.textContent = part;
            wi.style.setProperty("--d", delay.toFixed(2) + "s");
            delay += step;
            target.appendChild(wi);
          });
        } else if (child.nodeName === "BR") {
          target.appendChild(document.createElement("br"));
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          var shell = child.cloneNode(false);
          target.appendChild(shell);
          wrapWords(child, shell);
        }
      });
    };

    var fragment = document.createDocumentFragment();
    wrapWords(heroTitle, fragment);
    heroTitle.innerHTML = "";
    heroTitle.appendChild(fragment);
    heroTitle.classList.add("is-split");
    titleSplit = true;
  };

  /* ==================== Reveal on scroll (blur reveal) ==================== */
  var initReveals = function () {
    var revealEls = document.querySelectorAll(".reveal");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealEls.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  };

  /* ==================== Animated counters ==================== */
  var initCounters = function () {
    var counters = document.querySelectorAll("[data-count]");
    if (reduceMotion || !("IntersectionObserver" in window)) return; // markup already shows final values

    var animateCount = function (el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
      var duration = 1700;
      var start = null;
      var frame = function (ts) {
        if (start === null) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 4);
        el.textContent = (target * eased).toFixed(decimals);
        if (progress < 1) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    };

    var countObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            countObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );

    counters.forEach(function (el) {
      el.textContent = (0).toFixed(parseInt(el.getAttribute("data-decimals") || "0", 10));
      countObserver.observe(el);
    });
  };

  /* ==================== Preloader — cinematic intro ==================== */
  var preloader = document.querySelector(".preloader");
  var startTime = performance.now();

  var siteReady = function () {
    body.classList.add("is-loaded");
    if (heroTitle && titleSplit) {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          heroTitle.classList.add("is-in");
        });
      });
    }
    initReveals();
    initCounters();
  };

  if (reduceMotion || !preloader) {
    if (preloader) preloader.remove();
    siteReady();
  } else {
    splitHeroTitle();
    var MIN_SHOW = 1150;
    var finished = false;

    var finish = function () {
      if (finished) return;
      finished = true;
      preloader.classList.add("is-done");
      siteReady();
      setTimeout(function () { preloader.remove(); }, 900);
    };

    var scheduleFinish = function () {
      var remaining = Math.max(0, MIN_SHOW - (performance.now() - startTime));
      setTimeout(finish, remaining);
    };

    setTimeout(finish, 3200); // safety net: never trap the user

    if (document.readyState === "complete") scheduleFinish();
    else window.addEventListener("load", scheduleFinish);
  }

  /* ==================== Hero background video ==================== */
  var heroVideo = document.querySelector(".hero-video");
  if (heroVideo) {
    if (reduceMotion) {
      heroVideo.removeAttribute("autoplay");
      heroVideo.pause();
    } else if ("IntersectionObserver" in window) {
      // Only play while the hero is on screen
      var videoObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              var p = heroVideo.play();
              if (p && p.catch) p.catch(function () {});
            } else {
              heroVideo.pause();
            }
          });
        },
        { threshold: 0.05 }
      );
      videoObserver.observe(heroVideo);
    }
  }

  /* ==================== Hero parallax ==================== */
  var hero = document.querySelector(".hero");
  if (hero && !reduceMotion) {
    var heroGlow = hero.querySelector(".hero-glow");
    var heroLines = hero.querySelector(".hero-grid-lines");
    var heroInner = hero.querySelector(".hero-inner");
    var parallaxTicking = false;

    var updateParallax = function () {
      parallaxTicking = false;
      var y = window.scrollY;
      var h = hero.offsetHeight || 1;
      if (y > h) return;
      var p = y / h;
      if (heroGlow) heroGlow.style.transform = "translate3d(0," + (y * 0.32).toFixed(1) + "px,0)";
      if (heroLines) heroLines.style.transform = "translate3d(0," + (y * 0.18).toFixed(1) + "px,0)";
      if (heroInner) {
        heroInner.style.transform = "translate3d(0," + (y * 0.1).toFixed(1) + "px,0)";
        heroInner.style.opacity = String(Math.max(0, 1 - p * 0.6));
      }
    };

    window.addEventListener(
      "scroll",
      function () {
        if (!parallaxTicking) {
          parallaxTicking = true;
          requestAnimationFrame(updateParallax);
        }
      },
      { passive: true }
    );
  }

  /* ==================== Mouse-follow lighting ==================== */
  var light = document.querySelector(".cursor-light");
  if (light && finePointer && !reduceMotion) {
    var ltx = 0, lty = 0, lcx = 0, lcy = 0;
    var lightActive = false;
    var half = 0;

    var lightLoop = function () {
      lcx += (ltx - lcx) * 0.07;
      lcy += (lty - lcy) * 0.07;
      light.style.transform = "translate3d(" + (lcx - half).toFixed(1) + "px," + (lcy - half).toFixed(1) + "px,0)";
      if (Math.abs(ltx - lcx) < 0.3 && Math.abs(lty - lcy) < 0.3) {
        lightActive = false;
        return;
      }
      requestAnimationFrame(lightLoop);
    };

    document.addEventListener(
      "pointermove",
      function (e) {
        ltx = e.clientX;
        lty = e.clientY;
        if (!lightActive) {
          if (!body.classList.contains("has-pointer")) {
            body.classList.add("has-pointer");
            half = light.offsetWidth / 2;
            lcx = ltx;
            lcy = lty;
          }
          lightActive = true;
          requestAnimationFrame(lightLoop);
        }
      },
      { passive: true }
    );
  }

  /* ==================== Card spotlight (gold light tracks cursor) ==================== */
  if (finePointer) {
    var spotSelector = ".solution-card, .case-card, .testimonial-card, .contact-form, .project-card, .process-step, .stat, .cta-band";
    document.querySelectorAll(spotSelector).forEach(function (el) {
      el.classList.add("spot");
    });

    document.addEventListener(
      "pointermove",
      function (e) {
        var el = e.target && e.target.closest ? e.target.closest(".spot") : null;
        if (!el) return;
        var rect = el.getBoundingClientRect();
        el.style.setProperty("--mx", (e.clientX - rect.left).toFixed(0) + "px");
        el.style.setProperty("--my", (e.clientY - rect.top).toFixed(0) + "px");
      },
      { passive: true }
    );
  }

  /* ==================== Magnetic buttons ==================== */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll(".btn").forEach(function (btn) {
      btn.addEventListener("pointermove", function (e) {
        var rect = btn.getBoundingClientRect();
        var dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
        var dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
        btn.style.setProperty("--tx", (dx * 7).toFixed(1) + "px");
        btn.style.setProperty("--ty", (dy * 5).toFixed(1) + "px");
      });
      btn.addEventListener("pointerleave", function () {
        btn.style.setProperty("--tx", "0px");
        btn.style.setProperty("--ty", "0px");
      });
    });
  }

  /* ==================== Floating particles (hero) ==================== */
  var canvas = document.querySelector(".hero-particles");
  if (canvas && !reduceMotion && window.innerWidth > 600) {
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cw = 0, ch = 0;
    var particles = [];
    var particlesRunning = false;
    var heroVisible = true;

    var makeParticle = function (anywhere) {
      return {
        x: Math.random() * cw,
        y: anywhere ? Math.random() * ch : ch + 8,
        r: 0.5 + Math.random() * 1.3,
        vy: 0.1 + Math.random() * 0.26,
        drift: Math.random() * Math.PI * 2,
        driftSpeed: 0.002 + Math.random() * 0.004,
        base: 0.06 + Math.random() * 0.38,
        tw: Math.random() * Math.PI * 2,
      };
    };

    var resizeCanvas = function () {
      cw = canvas.clientWidth;
      ch = canvas.clientHeight;
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.round(Math.min(44, cw / 34));
      particles = [];
      for (var i = 0; i < count; i++) particles.push(makeParticle(true));
    };

    var tick = function () {
      if (!particlesRunning) return;
      ctx.clearRect(0, 0, cw, ch);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.y -= p.vy;
        p.drift += p.driftSpeed;
        p.tw += 0.02;
        p.x += Math.sin(p.drift) * 0.16;
        if (p.y < -8) particles[i] = p = makeParticle(false);
        var alpha = p.base * (0.6 + 0.4 * Math.sin(p.tw));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(124, 156, 255, " + alpha.toFixed(3) + ")";
        ctx.fill();
      }
      requestAnimationFrame(tick);
    };

    var syncRunning = function () {
      var shouldRun = heroVisible && !document.hidden;
      if (shouldRun && !particlesRunning) {
        particlesRunning = true;
        requestAnimationFrame(tick);
      } else if (!shouldRun) {
        particlesRunning = false;
      }
    };

    resizeCanvas();

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resizeCanvas, 200);
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        heroVisible = entries[0].isIntersecting;
        syncRunning();
      }).observe(canvas);
    }

    document.addEventListener("visibilitychange", syncRunning);
    syncRunning();
  }

  /* ==================== Floating strategy-call CTA ==================== */
  var floatingCta = document.querySelector(".floating-cta");
  if (floatingCta && "IntersectionObserver" in window) {
    var heroSection = document.querySelector(".hero");
    var contactSection = document.getElementById("contact");
    var footerSection = document.querySelector(".site-footer");
    var nearTop = true;
    var nearAction = false;

    var syncFloatingCta = function () {
      floatingCta.classList.toggle("is-shown", !nearTop && !nearAction);
    };

    if (heroSection) {
      new IntersectionObserver(function (entries) {
        nearTop = entries[0].isIntersecting;
        syncFloatingCta();
      }, { threshold: 0.1 }).observe(heroSection);
    }

    var visibleActions = { contact: false, footer: false };
    var actionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.target === contactSection) visibleActions.contact = e.isIntersecting;
        if (e.target === footerSection) visibleActions.footer = e.isIntersecting;
      });
      nearAction = visibleActions.contact || visibleActions.footer;
      syncFloatingCta();
    }, { threshold: 0.05 });
    if (contactSection) actionObserver.observe(contactSection);
    if (footerSection) actionObserver.observe(footerSection);
  }

  /* ==================== Strategy-call prefill ==================== */
  var messageField = document.getElementById("cf-message");
  if (messageField) {
    document.querySelectorAll("[data-prefill-call]").forEach(function (el) {
      el.addEventListener("click", function () {
        if (!messageField.value.trim()) {
          messageField.value = "I'd like to book a 30-minute strategy call. Some context on what we're building: ";
        }
      });
    });
  }

  /* ==================== Active nav link tracking ==================== */
  var navLinks = document.querySelectorAll(".primary-nav a[href^='#']");
  if (navLinks.length && "IntersectionObserver" in window) {
    var linkById = {};
    navLinks.forEach(function (a) {
      linkById[a.getAttribute("href").slice(1)] = a;
    });

    var activeLink = null;
    var sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          if (activeLink) {
            activeLink.classList.remove("is-active");
            activeLink.removeAttribute("aria-current");
          }
          activeLink = linkById[entry.target.id];
          if (activeLink) {
            activeLink.classList.add("is-active");
            activeLink.setAttribute("aria-current", "true");
          }
        });
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );

    Object.keys(linkById).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) sectionObserver.observe(section);
    });
  }

  /* ==================== FAQ: keep a single item open ==================== */
  var faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach(function (item) {
    item.addEventListener("toggle", function () {
      if (!item.open) return;
      faqItems.forEach(function (other) {
        if (other !== item) other.open = false;
      });
    });
  });

  /* ==================== Contact form ==================== */
  var form = document.querySelector(".contact-form");
  if (form) {
    var errorEl = form.querySelector(".form-error");
    var successEl = form.querySelector(".form-success");
    var nameInput = form.querySelector("#cf-name");
    var emailInput = form.querySelector("#cf-email");
    var messageInput = form.querySelector("#cf-message");

    var validEmail = function (value) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var invalid = [];
      if (!nameInput.value.trim()) invalid.push(nameInput);
      if (!validEmail(emailInput.value.trim())) invalid.push(emailInput);
      if (!messageInput.value.trim()) invalid.push(messageInput);

      [nameInput, emailInput, messageInput].forEach(function (input) {
        input.setAttribute("aria-invalid", String(invalid.indexOf(input) !== -1));
      });

      if (invalid.length > 0) {
        errorEl.hidden = false;
        invalid[0].focus();
        form.classList.remove("is-shaking");
        void form.offsetWidth; // restart the animation
        form.classList.add("is-shaking");
        return;
      }

      errorEl.hidden = true;
      successEl.hidden = false;
      successEl.setAttribute("tabindex", "-1");
      successEl.focus();
    });
  }

  /* ==================== Footer year ==================== */
  var yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
