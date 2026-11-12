/* Rowell Fernandez — interactions */
(() => {
  "use strict";

  const doc = document;

  /* Reveal on scroll ------------------------------------------------ */
  const revealables = Array.from(doc.querySelectorAll("[data-reveal]"));
  revealables.forEach((el) => {
    const delay = Number(el.dataset.delay || 0);
    if (delay) el.style.setProperty("--d", String(delay));
  });

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if ("IntersectionObserver" in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealables.forEach((el) => revealObserver.observe(el));
  } else {
    revealables.forEach((el) => el.classList.add("is-in"));
  }

  /* Header state, progress line ------------------------------------ */
  const header = doc.querySelector("[data-header]");
  const progressBar = doc.querySelector("[data-progress]");
  let ticking = false;

  const updateScrollState = () => {
    const y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle("is-scrolled", y > 12);

    if (progressBar) {
      const scrollable = doc.documentElement.scrollHeight - window.innerHeight;
      const ratio = scrollable > 0 ? Math.min(1, Math.max(0, y / scrollable)) : 0;
      progressBar.style.width = `${ratio * 100}%`;
    }
    ticking = false;
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateScrollState);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  updateScrollState();

  /* Active navigation ---------------------------------------------- */
  const navLinks = Array.from(doc.querySelectorAll(".nav a[href^='#']"));
  const sections = navLinks
    .map((link) => doc.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((link) => {
            const isCurrent = link.getAttribute("href") === `#${entry.target.id}`;
            link.classList.toggle("is-active", isCurrent);
            if (isCurrent) link.setAttribute("aria-current", "true");
            else link.removeAttribute("aria-current");
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach((section) => spy.observe(section));
  }

  /* Mobile menu ---------------------------------------------------- */
  const toggle = doc.querySelector("[data-menu-toggle]");
  const nav = doc.querySelector("#primary-nav");

  if (toggle && nav) {
    const setMenu = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      nav.classList.toggle("is-open", open);
    };

    toggle.addEventListener("click", () => {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });

    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) setMenu(false);
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 860 && nav.classList.contains("is-open")) setMenu(false);
    }, { passive: true });

    doc.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        setMenu(false);
        toggle.focus();
      }
    });

    doc.addEventListener("click", (event) => {
      if (!nav.classList.contains("is-open")) return;
      if (nav.contains(event.target) || toggle.contains(event.target)) return;
      setMenu(false);
    });
  }

  /* Copy email ----------------------------------------------------- */
  const copyButton = doc.querySelector("[data-copy-email]");
  const copyLabel = doc.querySelector("[data-copy-label]");
  const copyStatus = doc.querySelector("[data-copy-status]");

  const announce = (message) => {
    if (copyStatus) copyStatus.textContent = message;
  };

  if (copyButton && copyLabel) {
    const email = copyButton.dataset.email || "";
    let resetTimer;

    const legacyCopy = () => {
      const helper = doc.createElement("textarea");
      helper.value = email;
      helper.setAttribute("readonly", "");
      helper.style.position = "fixed";
      helper.style.top = "-1000px";
      helper.style.opacity = "0";
      doc.body.appendChild(helper);
      helper.select();
      const ok = doc.execCommand("copy");
      doc.body.removeChild(helper);
      return ok;
    };

    copyButton.addEventListener("click", async () => {
      let copied = false;

      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(email);
          copied = true;
        } catch (error) {
          copied = false;
        }
      }

      if (!copied) {
        try {
          copied = legacyCopy();
        } catch (error) {
          copied = false;
        }
      }

      copyLabel.textContent = copied ? "Address copied" : "Copy failed";
      announce(
        copied
          ? "Email address copied to clipboard."
          : "Could not copy. The address is shown above."
      );

      window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(() => {
        copyLabel.textContent = "Copy address";
      }, 2400);
    });
  }

})();
