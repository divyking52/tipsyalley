/**
 * Tipsy Alley — interaction + animation layer.
 * Mirrors the behaviour of bellhopco.com:
 *   Lenis smooth scroll, GSAP ScrollTrigger reveals, line-split headings,
 *   image reveal, pinned horizontal showcase, mouse-follow mask reveal,
 *   Splide auto-scroll logo marquee + guest-book slider, custom cursor.
 */
(() => {
  const root = document.documentElement;
  root.classList.remove("no-js");
  root.classList.add("js");

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isFine = window.matchMedia("(min-width: 992px) and (pointer: fine)").matches;
  const isTouch =
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0;

  const header = document.querySelector("[data-header]");
  const navTrigger = document.querySelector("[data-nav-trigger]");
  const navMenu = document.querySelector("[data-nav-menu]");
  const customCursor = document.querySelector(".custom-cursor");
  const cursorTextEl = document.querySelector(".custom-cursor__text-container");
  const loader = document.querySelector("[data-loader]");
  const heroOverlay = document.querySelector(".hero__media-overlay");

  const hasGsap = typeof window.gsap !== "undefined";
  if (hasGsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  let lenis = null;

  /* ----------------------------------------------------------- Hero video */
  function setupHeroVideo() {
    const videos = document.querySelectorAll(".hero__video, .section-moments__video");
    videos.forEach((video) => {
      if (reduce) {
        video.pause();
        video.removeAttribute("autoplay");
        return;
      }
      const play = () => {
        const p = video.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
      };
      if (video.readyState >= 2) play();
      else video.addEventListener("loadeddata", play, { once: true });
    });
  }

  /* ----------------------------------------------------- Parallax on scroll */
  function setupParallax() {
    const items = document.querySelectorAll("[data-parallax]");
    if (!items.length || !hasGsap || reduce || !window.ScrollTrigger) return;

    items.forEach((el) => {
      const amount = Number(el.getAttribute("data-parallax")) || 30;
      gsap.fromTo(
        el,
        { yPercent: -amount * 0.35 },
        {
          yPercent: amount * 0.35,
          ease: "none",
          scrollTrigger: {
            trigger: el.closest("section") || el,
            start: "top bottom",
            end: "bottom top",
            scrub: 1.2
          }
        }
      );
    });
  }

  /* ------------------------------------------------------------------ Lenis */
  function startLenis() {
    if (reduce || typeof window.Lenis === "undefined") return;
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.4,
      syncTouch: false
    });
    window.lenis = lenis;

    if (hasGsap && window.ScrollTrigger) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (time) => {
        lenis.raf(time);
        requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);
    }

    lenis.on("scroll", checkSticky);
  }

  /* ----------------------------------------------------------- Sticky header */
  function checkSticky() {
    if (!header) return;
    const top = window.pageYOffset || root.scrollTop || 0;
    header.classList.toggle("is-sticky", top > 1);
  }

  /* --------------------------------------------------------------- Full menu */
  function setupMenu() {
    if (!navTrigger || !header || !navMenu) return;
    let open = false;

    const setOpen = (state) => {
      open = state;
      header.classList.toggle("is-active", open);
      navTrigger.classList.toggle("is-active", open);
      navTrigger.setAttribute("aria-expanded", open ? "true" : "false");
      navTrigger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      navMenu.setAttribute("aria-hidden", open ? "false" : "true");
      document.body.classList.toggle("is-fixed", open);
      root.classList.toggle("nav-open", open);
      if (lenis) open ? lenis.stop() : lenis.start();
    };

    navTrigger.addEventListener("click", () => setOpen(!open));

    navMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setOpen(false));
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && open) setOpen(false);
    });

    document.addEventListener("click", (event) => {
      if (!open) return;
      if (!event.target.closest(".header")) setOpen(false);
    });
  }

  /* ------------------------------------------------------ Split lines on <br> */
  function splitTextToNewLines() {
    document.querySelectorAll("[data-split-lines]").forEach((el) => {
      const parts = el.innerHTML.trim().split(/<br\s*\/?>/i);
      el.innerHTML = parts
        .map(
          (part) =>
            '<div class="text-newline"><span>' + part.trim() + "</span></div>"
        )
        .join("");
    });
  }

  /* -------------------------------------------------------------- Intro layer */
  /* Font-cycling "t." then fade loader + curtain reveal */
  function playIntro() {
    const unlock = () => document.body.classList.remove("is-fixed");
    document.body.classList.add("is-fixed");
    const mark = loader && loader.querySelector("[data-loader-mark]");

    if (reduce || !hasGsap) {
      if (loader) loader.style.display = "none";
      if (heroOverlay) heroOverlay.style.display = "none";
      unlock();
      return;
    }

    if (heroOverlay) gsap.set(heroOverlay, { yPercent: 0 });

    const faces = [
      { family: '"Newsreader", "Times New Roman", serif', mode: "" },
      { family: '"Figtree", "Segoe UI", sans-serif', mode: "is-sans" },
      { family: '"Playfair Display", Georgia, serif', mode: "is-display" },
      { family: '"Syne", "Segoe UI", sans-serif', mode: "is-sans" },
      { family: '"Cormorant Garamond", Georgia, serif', mode: "is-display" },
      { family: '"Outfit", "Segoe UI", sans-serif', mode: "is-sans" },
      { family: '"Mr De Haviland", cursive', mode: "is-script" },
      { family: '"Newsreader", "Times New Roman", serif', mode: "" }
    ];

    const applyFace = (face) => {
      if (!mark) return;
      mark.style.fontFamily = face.family;
      mark.classList.remove("is-script", "is-display", "is-sans");
      if (face.mode) mark.classList.add(face.mode);
    };

    const warmFonts = () => {
      if (!document.fonts || !document.fonts.load) return Promise.resolve();
      const loads = Promise.all(
        [
          "700 120px Newsreader",
          "700 120px Figtree",
          "700 120px 'Playfair Display'",
          "800 120px Syne",
          "700 120px 'Cormorant Garamond'",
          "700 120px Outfit",
          "400 120px 'Mr De Haviland'"
        ].map((spec) => document.fonts.load(spec).catch(() => null))
      );
      // Never block the intro if a webfont hangs
      const timeout = new Promise((resolve) => setTimeout(resolve, 900));
      return Promise.race([loads, timeout]);
    };

    const tl = gsap.timeline({ paused: true, onComplete: unlock });

    const buildIntro = () => {
      if (mark) {
        applyFace(faces[0]);
        gsap.set(mark, { scale: 1, autoAlpha: 1 });

        faces.forEach((face, i) => {
          if (i === 0) return;
          tl.to(mark, {
            scale: 0.86,
            autoAlpha: 0.35,
            duration: 0.1,
            ease: "power2.in",
            onComplete: () => applyFace(face)
          });
          tl.to(mark, {
            scale: 1,
            autoAlpha: 1,
            duration: 0.16,
            ease: "power2.out"
          });
          tl.to({}, { duration: 0.12 });
        });

        tl.to({}, { duration: 0.28 });
      } else {
        tl.to({}, { duration: 1.6 });
      }

      if (loader) {
        tl.to(loader, {
          autoAlpha: 0,
          duration: 0.35,
          ease: "power2.out",
          onComplete: () => {
            loader.style.display = "none";
            loader.classList.add("is-done");
          }
        });
      }

      if (heroOverlay) {
        tl.to(
          heroOverlay,
          {
            yPercent: -101,
            duration: 1.15,
            ease: "power4.inOut"
          },
          loader ? "-=0.12" : 0
        );
      }

      tl.play(0);
    };

    warmFonts().then(buildIntro).catch(buildIntro);
  }

  /* ------------------------------------------------------------ Image reveal */
  function setupImageReveal() {
    const containers = document.querySelectorAll("[data-image-reveal-container]");
    if (!containers.length) return;

    if (!hasGsap || reduce) {
      containers.forEach((container) => {
        const wrapper = container.querySelector("[data-image-reveal-wrapper]");
        if (wrapper) wrapper.style.width = "100%";
      });
      return;
    }

    containers.forEach((container) => {
      const wrapper = container.querySelector("[data-image-reveal-wrapper]");
      if (!wrapper) return;
      const vertical = container.hasAttribute("data-image-reveal-vertical");

      if (vertical) {
        gsap.to(wrapper, {
          height: "100%",
          ease: "none",
          scrollTrigger: {
            trigger: container,
            start: "-10% center",
            end: "90% bottom",
            scrub: 1.5
          }
        });
      } else {
        gsap.to(wrapper, {
          width: "100%",
          ease: "none",
          scrollTrigger: {
            trigger: container,
            start: "-55% 35%",
            end: "65% bottom",
            scrub: 1.5
          }
        });
      }
    });
  }

  /* ------------------------------------------------- Pinned horizontal scroll */
  /* Runs at every width (mobile included) so the showcase scrolls the same way. */
  function setupHorizontalScroll() {
    const tracks = document.querySelectorAll("[data-horizontal-scroll-track]");
    if (!tracks.length) return;

    const bar = document.querySelector(
      "[data-section-showcase] .section-showcase__bar"
    );
    const targets = [header, bar].filter(Boolean);

    tracks.forEach((track) => {
      const element = track.querySelector("[data-horizontal-scroll-element]");
      if (!element) return;

      // Degrade to a native horizontal swipe when the pin cannot run.
      if (!hasGsap || reduce) {
        track.classList.add("is-fallback");
        return;
      }

      const travel = () => Math.max(track.scrollWidth - window.innerWidth + 64, 1);

      gsap.to(element, {
        x: () => track.scrollWidth * -1,
        xPercent: 100,
        ease: "none",
        scrollTrigger: {
          trigger: track,
          pin: true,
          start: "top top",
          end: () => "+=" + travel(),
          scrub: 1,
          invalidateOnRefresh: true,
          toggleClass: { targets, className: "is-hidden" }
        }
      });
    });
  }

  /* -------------------------------------------------------- Masked section */
  function setupMaskedSection() {
    const sections = document.querySelectorAll("[data-masked-section]");
    if (!sections.length || !hasGsap || reduce) return;

    sections.forEach((section) => {
      const overlay = section.querySelector("[data-masked-section-overlay]");
      const circle = section.querySelector("[data-masked-section-circle]");
      const trigger = section.querySelector("[data-masked-section-trigger]");
      if (!overlay || !circle || !trigger) return;

      const updateCircle = (event) => {
        const rect = section.getBoundingClientRect();
        const xPercent = ((event.clientX - rect.left) / rect.width) * 100;
        const yPercent = ((event.clientY - rect.top) / rect.height) * 100;

        gsap.to(circle, {
          x: xPercent - (circle.offsetWidth / rect.width) * 50 + "%",
          y: yPercent - (circle.offsetHeight / rect.height) * 50 + "%",
          duration: 0.4,
          ease: "linear",
          onUpdate: () => {
            overlay.style.clipPath = `circle(${
              (circle.offsetWidth / rect.width) * 50
            }% at ${xPercent}% ${yPercent}%)`;
          }
        });
      };

      section.addEventListener("mousemove", (event) => {
        if (window.innerWidth < 992) return;
        updateCircle(event);
        if (event.target.closest("[data-masked-section-trigger]")) {
          gsap.to(overlay, {
            clipPath: "circle(100% at 50% 50%)",
            duration: 0.4,
            ease: "linear"
          });
        }
      });

      section.addEventListener("mouseleave", (event) => {
        if (window.innerWidth < 992) return;
        const rect = section.getBoundingClientRect();
        const xPercent = ((event.clientX - rect.left) / rect.width) * 100;
        const yPercent = ((event.clientY - rect.top) / rect.height) * 100;
        updateCircle(event);
        gsap.to(overlay, {
          duration: 0.4,
          ease: "linear",
          onUpdate: () => {
            overlay.style.clipPath = `circle(0% at ${xPercent}% ${yPercent}%)`;
          }
        });
      });

      trigger.addEventListener("mouseenter", () => {
        if (window.innerWidth < 992) return;
        section.classList.add("is-active");
        gsap.to(overlay, {
          clipPath: "circle(100% at 50% 50%)",
          duration: 0.4,
          ease: "linear"
        });
      });

      trigger.addEventListener("mouseleave", () => {
        if (window.innerWidth < 992) return;
        section.classList.remove("is-active");
        const rect = section.getBoundingClientRect();
        const xPercent =
          ((circle.offsetLeft + circle.offsetWidth / 2) / rect.width) * 100;
        const yPercent =
          ((circle.offsetTop + circle.offsetHeight / 2) / rect.height) * 100;
        gsap.to(overlay, {
          clipPath: `circle(${
            (circle.offsetWidth / rect.width) * 50
          }% at ${xPercent}% ${yPercent}%)`,
          duration: 0.4,
          ease: "linear"
        });
      });
    });
  }

  /* --------------------------------------------------- Reveal animations */
  function setupAnimations() {
    const animated = document.querySelectorAll("[data-animation]");

    animated.forEach((el) => {
      el.style.setProperty(
        "--animation-delay",
        (el.dataset.animationDelay == null ? 0 : el.dataset.animationDelay) + "s"
      );
      el.style.setProperty(
        "--animation-duration",
        (el.dataset.animationDuration == null
          ? ".3"
          : el.dataset.animationDuration) + "s"
      );
      el.style.setProperty(
        "--animation-easing",
        el.dataset.animationEasing == null ? "ease-in-out" : el.dataset.animationEasing
      );
    });

    const textNewlines = document.querySelectorAll(".text-newline");

    if (reduce) {
      animated.forEach((el) => el.classList.add("is-animated"));
      textNewlines.forEach((el) => el.classList.add("is-animated"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-animated");
        });
      },
      { rootMargin: "-10%" }
    );

    const reveal = () => {
      animated.forEach((el) => {
        if (el.hasAttribute("data-animate-on-load")) el.classList.add("is-animated");
        else observer.observe(el);
      });
      textNewlines.forEach((el) => {
        const loadParent = el.closest("[data-animate-on-load]");
        if (loadParent) loadParent.classList.add("is-animated");
        else observer.observe(el);
      });
    };

    requestAnimationFrame(() => requestAnimationFrame(reveal));
  }

  /* -------------------------------------------------------- Book carousel */
  function setupBookCarousel() {
    const root = document.querySelector("[data-book-carousel]");
    if (!root) return;

    const stage = root.querySelector(".book__stage");
    const pages = Array.from(root.querySelectorAll("[data-book-page]"));
    const prevBtn = root.querySelector("[data-book-prev]");
    const nextBtn = root.querySelector("[data-book-next]");
    const pager = root.querySelector("[data-book-pager]");
    if (!stage || !pages.length) return;

    let index = 0;
    let busy = false;
    const total = pages.length;
    const duration = reduce ? 0.01 : 0.9;
    const ease = "power2.inOut";

    if (hasGsap) {
      gsap.set(stage, { perspective: 2200 });
      gsap.set(pages, {
        transformOrigin: "left center",
        transformStyle: "preserve-3d",
        rotationY: 0,
        force3D: true
      });
    }

    function syncZ() {
      pages.forEach((page, i) => {
        // Flipped pages stack on the left; remaining pages stack on the right.
        page.style.zIndex = String(i < index ? i + 1 : total - i + 10);
      });
    }

    function updateUI() {
      const label = Math.min(Math.max(index, 0) + 1, total);
      if (pager) pager.textContent = `${label} / ${total}`;
      if (prevBtn) prevBtn.disabled = busy || index <= 0;
      if (nextBtn) nextBtn.disabled = busy || index >= total;
      stage.classList.toggle("is-at-start", index <= 0);
      stage.classList.toggle("is-at-end", index >= total);
    }

    function setPageRotation(page, deg, animate, onDone) {
      if (!hasGsap || reduce) {
        page.style.transform = `rotateY(${deg}deg)`;
        if (onDone) onDone();
        return;
      }
      gsap.killTweensOf(page);
      if (!animate) {
        gsap.set(page, { rotationY: deg });
        if (onDone) onDone();
        return;
      }
      gsap.to(page, {
        rotationY: deg,
        duration,
        ease,
        overwrite: true,
        onComplete: onDone
      });
    }

    function flipTo(nextIndex) {
      if (busy) return;
      nextIndex = Math.max(0, Math.min(total, nextIndex));
      if (nextIndex === index) return;

      const from = index;
      const goingForward = nextIndex > from;
      busy = true;
      updateUI();

      const done = () => {
        index = nextIndex;
        busy = false;
        syncZ();
        updateUI();
      };

      if (goingForward) {
        // Flip exactly one page at a time for click reliability
        const page = pages[from];
        if (!page) {
          done();
          return;
        }
        page.style.zIndex = String(total + 20);
        setPageRotation(page, -180, true, done);
        return;
      }

      const page = pages[nextIndex];
      if (!page) {
        done();
        return;
      }
      page.style.zIndex = String(total + 20);
      setPageRotation(page, 0, true, done);
    }

    function next() {
      if (index >= total) return;
      flipTo(index + 1);
    }

    function prev() {
      if (index <= 0) return;
      flipTo(index - 1);
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        next();
      });
    }
    if (prevBtn) {
      prevBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        prev();
      });
    }

    // Click: right side turns forward, left side turns back
    stage.addEventListener("click", (event) => {
      if (busy) return;
      if (event.target.closest("button")) return;
      const rect = stage.getBoundingClientRect();
      const ratio = (event.clientX - rect.left) / rect.width;
      if (ratio < 0.5) prev();
      else next();
    });

    syncZ();
    updateUI();
  }

  /* --------------------------------------------------------------- Splide */
  function setupSliders() {
    if (typeof window.Splide === "undefined") return;

    document.querySelectorAll(".slider-logos").forEach((el) => {
      const options = {
        type: "loop",
        drag: "free",
        dragAngleThreshold: 15,
        speed: 800,
        easing: "cubic-bezier(0.25,0.46,1.45,0.94)",
        focus: "center",
        arrows: false,
        pagination: false,
        autoWidth: true
      };
      if (!reduce) options.autoScroll = { speed: 1.5, pauseOnHover: true };
      new Splide(el, options).mount(
        options.autoScroll && window.splide ? window.splide.Extensions : undefined
      );
    });

    document.querySelectorAll(".slider-reviews").forEach((el) => {
      const options = {
        type: "loop",
        drag: "free",
        dragAngleThreshold: 15,
        speed: 700,
        easing: "cubic-bezier(0.25,0.46,0.45,0.94)",
        focus: "center",
        arrows: false,
        pagination: false,
        gap: "1.1rem",
        autoWidth: true,
        pauseOnHover: true,
        pauseOnFocus: true
      };
      if (!reduce) options.autoScroll = { speed: 0.65, pauseOnHover: true };
      new Splide(el, options).mount(
        options.autoScroll && window.splide ? window.splide.Extensions : undefined
      );
    });
  }

  /* --------------------------------------------------------- Custom cursor */
  function setupCursor() {
    if (!customCursor || !isFine || isTouch) {
      if (customCursor) customCursor.classList.add("is-invisible");
      return;
    }

    document.addEventListener("mousemove", (event) => {
      customCursor.style.left = event.clientX + "px";
      customCursor.style.top = event.clientY + "px";
    });

    document.querySelectorAll("[data-cursor-text]").forEach((el) => {
      const text = el.getAttribute("data-cursor-text");
      el.addEventListener("mouseenter", () => {
        customCursor.classList.add("is-active");
        if (text) {
          if (cursorTextEl) cursorTextEl.textContent = text;
          customCursor.classList.add("has-text");
        }
      });
      el.addEventListener("mouseleave", () => {
        customCursor.classList.remove("is-active", "has-text");
        if (cursorTextEl) cursorTextEl.textContent = "";
      });
    });
  }

  /* -------------------------------------------------- Footer intersection */
  function setupFooter() {
    const footer = document.querySelector(".footer");
    if (!footer) return;

    if (reduce || typeof IntersectionObserver === "undefined") {
      footer.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          footer.classList.toggle("is-visible", entry.isIntersecting);
        });
      },
      { root: null, rootMargin: "0px 0px -30% 0px", threshold: [0, 1] }
    );
    observer.observe(footer);
  }

  /* ---------------------------------------------------- Smooth anchor links */
  function setupAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (event) => {
        const id = link.getAttribute("href");
        if (!id || id === "#") return;
        const target = document.querySelector(id);
        if (!target) return;
        event.preventDefault();
        if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.2 });
        else target.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
      });
    });
  }

  /* ----------------------------------------------------------------- Boot */
  function init() {
    startLenis();
    setupMenu();
    setupAnchors();
    setupHeroVideo();

    splitTextToNewLines();

    if (hasGsap && window.ScrollTrigger) {
      setupImageReveal();
      setupHorizontalScroll();
      setupMaskedSection();
      setupParallax();
    } else {
      document
        .querySelectorAll("[data-image-reveal-wrapper]")
        .forEach((w) => (w.style.width = "100%"));
    }

    setupAnimations();
    setupBookCarousel();
    setupSliders();
    setupCursor();
    setupFooter();
    playIntro();
    checkSticky();

    window.addEventListener("scroll", checkSticky, { passive: true });

    window.addEventListener(
      "load",
      () => {
        checkSticky();
        if (hasGsap && window.ScrollTrigger) ScrollTrigger.refresh();
        if (lenis) lenis.resize();
      },
      { once: true }
    );

    let resizeTimer;
    window.addEventListener("resize", () => {
      checkSticky();
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (hasGsap && window.ScrollTrigger) ScrollTrigger.refresh();
      }, 120);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
