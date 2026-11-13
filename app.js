/* ============================================================
   Rowell Fernandez — portfolio interactions
   ============================================================ */

(() => {
  "use strict";

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const pointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const rand = (min, max) => Math.random() * (max - min) + min;
  const rgba = (rgb, alpha) => `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;

  /* ----------------------------------------------------------
     Ambient particle net behind the page
     ---------------------------------------------------------- */

  (function ambientField() {
    const canvas = document.getElementById("ambient-canvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const colors = [
      [0, 245, 255],
      [123, 44, 191],
      [170, 200, 255],
    ];

    let width = 0;
    let height = 0;
    let dpr = 1;
    let particles = [];
    let frameId = null;
    let lastTime = 0;
    let reduced = motionQuery.matches;
    const mouse = { x: -9999, y: -9999, active: false };

    function seed() {
      const target = clamp(Math.round((width * height) / 27000), 24, 70);
      particles = Array.from({ length: target }, () => {
        const colorRoll = Math.random();
        const rgb = colorRoll < 0.16 ? colors[2] : colorRoll < 0.62 ? colors[0] : colors[1];
        return {
          x: rand(0, width),
          y: rand(0, height),
          vx: rand(-0.16, 0.16),
          vy: rand(-0.16, 0.16),
          r: rand(0.7, 1.85),
          alpha: rand(0.24, 0.52),
          rgb,
        };
      });
    }

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
      if (reduced) draw();
    }

    function update(step) {
      const pointerRadius = 165;

      for (const particle of particles) {
        if (mouse.active) {
          const dx = particle.x - mouse.x;
          const dy = particle.y - mouse.y;
          const distance = Math.hypot(dx, dy);
          if (distance < pointerRadius && distance > 0.5) {
            const force = (1 - distance / pointerRadius) * 0.22 * step;
            particle.vx += (dx / distance) * force;
            particle.vy += (dy / distance) * force;
          }
        }

        particle.vx = clamp(particle.vx, -0.65, 0.65);
        particle.vy = clamp(particle.vy, -0.65, 0.65);
        particle.x += particle.vx * step;
        particle.y += particle.vy * step;

        if (particle.x < -30) particle.x = width + 30;
        if (particle.x > width + 30) particle.x = -30;
        if (particle.y < -30) particle.y = height + 30;
        if (particle.y > height + 30) particle.y = -30;
      }
    }

    function draw() {
      if (!width || !height) return;

      ctx.clearRect(0, 0, width, height);

      const linkDistance = 132;
      const linkSq = linkDistance * linkDistance;

      for (let i = 0; i < particles.length; i += 1) {
        const a = particles[i];

        for (let j = i + 1; j < particles.length; j += 1) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distanceSq = dx * dx + dy * dy;

          if (distanceSq > linkSq) continue;

          const distance = Math.sqrt(distanceSq);
          ctx.strokeStyle = rgba(a.rgb, (1 - distance / linkDistance) * 0.17);
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }

        if (mouse.active) {
          const dx = a.x - mouse.x;
          const dy = a.y - mouse.y;
          const distance = Math.hypot(dx, dy);
          if (distance < 190) {
            ctx.strokeStyle = rgba(colors[0], (1 - distance / 190) * 0.14);
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }

        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fillStyle = rgba(a.rgb, a.alpha);
        ctx.fill();
      }
    }

    function tick(time) {
      if (!lastTime) lastTime = time;
      const step = clamp((time - lastTime) / 16.667, 0, 2.4);
      lastTime = time;
      update(step);
      draw();
      frameId = window.requestAnimationFrame(tick);
    }

    function start() {
      if (frameId !== null || reduced || document.hidden) return;
      lastTime = 0;
      frameId = window.requestAnimationFrame(tick);
    }

    function stop() {
      if (frameId === null) return;
      window.cancelAnimationFrame(frameId);
      frameId = null;
    }

    let resizeTimer = 0;
    window.addEventListener("resize", () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 150);
    });

    document.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") return;
      mouse.x = event.clientX;
      mouse.y = event.clientY;
      mouse.active = true;
    }, { passive: true });

    document.addEventListener("mouseleave", () => {
      mouse.active = false;
    });

    window.addEventListener("blur", () => {
      mouse.active = false;
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      else start();
    });

    motionQuery.addEventListener("change", (event) => {
      reduced = event.matches;
      if (reduced) {
        stop();
        draw();
      } else {
        start();
      }
    });

    resize();
    start();
  })();

  /* ----------------------------------------------------------
     Generative field widget
     ---------------------------------------------------------- */

  (function generativeField() {
    const canvas = document.getElementById("field-canvas");
    const stage = canvas ? canvas.closest(".field-stage") : null;
    const readout = document.getElementById("field-readout");
    const modeButtons = Array.from(document.querySelectorAll("[data-mode]"));
    const paletteButton = document.getElementById("palette-btn");
    const paletteDot = document.getElementById("palette-dot");
    const pauseButton = document.getElementById("pause-btn");
    const pauseIcon = document.getElementById("pause-icon");
    const playIcon = document.getElementById("play-icon");
    const speedInput = document.getElementById("speed-input");

    if (!canvas || !stage) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const palettes = [
      { name: "Ion", a: [0, 245, 255], b: [123, 44, 191], c: [226, 242, 255] },
      { name: "Bloom", a: [255, 92, 138], b: [123, 44, 191], c: [255, 228, 240] },
      { name: "Ice", a: [196, 228, 255], b: [0, 170, 210], c: [255, 255, 255] },
    ];

    const orbitRings = [
      { radius: 0.27, count: 9, speed: 0.22, direction: 1, tone: 0 },
      { radius: 0.41, count: 15, speed: -0.15, direction: -1, tone: 1 },
      { radius: 0.55, count: 22, speed: 0.1, direction: 1, tone: 0 },
    ];

    let width = 0;
    let height = 0;
    let dpr = 1;
    let mode = "mesh";
    let paletteIndex = 0;
    let speed = 1;
    let paused = false;
    let reduced = motionQuery.matches;
    let time = 0;
    let lastTime = 0;
    let frameId = null;
    let nodes = [];
    let particles = [];
    let linkCount = 0;
    let orbitCount = orbitRings.reduce((total, ring) => total + ring.count, 0);
    let pulse = null;
    let readoutCache = "";
    const mouse = { x: -9999, y: -9999, inside: false };

    const palette = () => palettes[paletteIndex];

    function setReadout() {
      let text;
      if (mode === "mesh") {
        text = `mesh · ${nodes.length} nodes · ${linkCount} links`;
      } else if (mode === "orbit") {
        text = `orbit · ${orbitCount} nodes · ${orbitRings.length} rings`;
      } else {
        text = `drift · ${particles.length} particles`;
      }
      if (text !== readoutCache && readout) {
        readoutCache = text;
        readout.textContent = text;
      }
    }

    function seedMesh() {
      const count = clamp(Math.round((width * height) / 3800), 22, 46);
      nodes = Array.from({ length: count }, () => ({
        x: rand(10, Math.max(12, width - 10)),
        y: rand(10, Math.max(12, height - 10)),
        vx: rand(-0.34, 0.34),
        vy: rand(-0.34, 0.34),
        r: rand(1.1, 2),
        tone: Math.random() < 0.24 ? 1 : 0,
      }));
      linkCount = 0;
    }

    function seedDrift() {
      const count = clamp(Math.round((width * height) / 3600), 26, 58);
      particles = Array.from({ length: count }, () => {
        const x = rand(0, width);
        const y = rand(0, height);
        return {
          x,
          y,
          px: x,
          py: y,
          seed: rand(0, Math.PI * 2),
          tone: Math.random() < 0.26 ? 1 : 0,
          r: rand(0.8, 1.7),
        };
      });
    }

    function resetScene() {
      if (mode === "mesh") seedMesh();
      if (mode === "drift") seedDrift();
      pulse = null;
      mouse.inside = false;
      linkCount = 0;
      setReadout();
    }

    function measure(force) {
      const rect = stage.getBoundingClientRect();
      const nextWidth = Math.max(1, Math.round(rect.width));
      const nextHeight = Math.max(1, Math.round(rect.height));

      if (!force && nextWidth === width && nextHeight === height) return false;

      width = nextWidth;
      height = nextHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      resetScene();
      return true;
    }

    function updateMesh(step) {
      const influence = 74;
      const influenceSq = influence * influence;

      for (const node of nodes) {
        if (mouse.inside) {
          const dx = node.x - mouse.x;
          const dy = node.y - mouse.y;
          const distanceSq = dx * dx + dy * dy;
          if (distanceSq < influenceSq && distanceSq > 1) {
            const distance = Math.sqrt(distanceSq);
            const force = (1 - distance / influence) * 0.5 * step;
            node.vx += (dx / distance) * force;
            node.vy += (dy / distance) * force;
          }
        }

        node.vx = clamp(node.vx, -1.1, 1.1);
        node.vy = clamp(node.vy, -1.1, 1.1);
        node.x += node.vx * step * speed;
        node.y += node.vy * step * speed;

        if (node.x < node.r) {
          node.x = node.r;
          node.vx = Math.abs(node.vx);
        }
        if (node.x > width - node.r) {
          node.x = width - node.r;
          node.vx = -Math.abs(node.vx);
        }
        if (node.y < node.r) {
          node.y = node.r;
          node.vy = Math.abs(node.vy);
        }
        if (node.y > height - node.r) {
          node.y = height - node.r;
          node.vy = -Math.abs(node.vy);
        }
      }
    }

    function updateDrift(dt) {
      for (const particle of particles) {
        const angle =
          Math.sin(particle.y * 0.012 + time * 0.55 + particle.seed) +
          Math.cos(particle.x * 0.009 - time * 0.38 + particle.seed);

        particle.px = particle.x;
        particle.py = particle.y;
        particle.x += Math.cos(angle * 1.7) * 58 * dt * speed;
        particle.y += Math.sin(angle * 1.25) * 46 * dt * speed;

        if (particle.x < -16) {
          particle.x = width + 16;
          particle.px = particle.x;
        } else if (particle.x > width + 16) {
          particle.x = -16;
          particle.px = particle.x;
        }

        if (particle.y < -16) {
          particle.y = height + 16;
          particle.py = particle.y;
        } else if (particle.y > height + 16) {
          particle.y = -16;
          particle.py = particle.y;
        }
      }
    }

    function drawPulse() {
      if (!pulse) return;
      const progress = pulse.age / 1.4;
      if (progress >= 1) {
        pulse = null;
        return;
      }
      const radius = 8 + pulse.age * 95;
      ctx.strokeStyle = rgba(palette().a, (1 - progress) * 0.42);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(pulse.x, pulse.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    function drawMesh() {
      const colors = palette();
      const linkDistance = clamp(Math.min(width, height) * 0.36, 62, 104);
      const linkSq = linkDistance * linkDistance;
      linkCount = 0;

      for (let i = 0; i < nodes.length; i += 1) {
        const a = nodes[i];

        for (let j = i + 1; j < nodes.length; j += 1) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distanceSq = dx * dx + dy * dy;

          if (distanceSq > linkSq) continue;

          const distance = Math.sqrt(distanceSq);
          ctx.strokeStyle = rgba(a.tone ? colors.b : colors.a, (1 - distance / linkDistance) * 0.34);
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
          linkCount += 1;
        }

        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fillStyle = rgba(a.tone ? colors.b : colors.a, 0.9);
        ctx.fill();
      }
    }

    function drawOrbit() {
      const colors = palette();
      const cx = width / 2;
      const cy = height / 2;
      const base = Math.min(width, height);

      const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, base * 0.22);
      halo.addColorStop(0, rgba(colors.a, 0.2));
      halo.addColorStop(0.45, rgba(colors.b, 0.09));
      halo.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, base * 0.24, 0, Math.PI * 2);
      ctx.fill();

      for (const ring of orbitRings) {
        const radius = base * ring.radius;
        ctx.strokeStyle = rgba(colors.a, 0.09);
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();

        const positions = [];

        for (let i = 0; i < ring.count; i += 1) {
          const angle =
            (i / ring.count) * Math.PI * 2 +
            time * ring.speed * ring.direction +
            ring.radius * 4;

          let x = cx + Math.cos(angle) * radius;
          let y = cy + Math.sin(angle) * radius;

          if (mouse.inside) {
            const dx = x - mouse.x;
            const dy = y - mouse.y;
            const distance = Math.hypot(dx, dy);
            if (distance < 58 && distance > 0.5) {
              const push = (1 - distance / 58) * 9;
              x += (dx / distance) * push;
              y += (dy / distance) * push;
            }
          }

          positions.push({ x, y });
        }

        ctx.strokeStyle = rgba(ring.tone ? colors.b : colors.a, 0.2);
        ctx.beginPath();
        positions.forEach((point, index) => {
          if (index === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        });
        ctx.closePath();
        ctx.stroke();

        for (const point of positions) {
          ctx.beginPath();
          ctx.arc(point.x, point.y, ring.tone ? 1.4 : 1.7, 0, Math.PI * 2);
          ctx.fillStyle = rgba(ring.tone ? colors.b : colors.a, 0.92);
          ctx.fill();
        }
      }

      ctx.beginPath();
      ctx.arc(cx, cy, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = rgba(colors.c, 0.85);
      ctx.fill();
    }

    function drawDrift() {
      const colors = palette();

      for (const particle of particles) {
        ctx.strokeStyle = rgba(particle.tone ? colors.b : colors.a, 0.36);
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(particle.px, particle.py);
        ctx.lineTo(particle.x, particle.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
        ctx.fillStyle = rgba(particle.tone ? colors.b : colors.a, 0.8);
        ctx.fill();
      }
    }

    function draw() {
      if (!width || !height) return;
      ctx.clearRect(0, 0, width, height);

      if (mode === "mesh") drawMesh();
      else if (mode === "orbit") drawOrbit();
      else drawDrift();

      drawPulse();
      setReadout();
    }

    function update(step, dt) {
      if (mode === "mesh") updateMesh(step);
      if (mode === "drift") updateDrift(dt);
      if (pulse) pulse.age += dt;
    }

    function tick(timestamp) {
      if (!lastTime) lastTime = timestamp;
      const dt = clamp((timestamp - lastTime) / 1000, 0, 0.05);
      const step = clamp(dt * 60, 0, 2.4);
      lastTime = timestamp;

      time += dt * speed;
      update(step, dt);
      draw();
      frameId = window.requestAnimationFrame(tick);
    }

    function start() {
      if (frameId !== null || paused || reduced || document.hidden) return;
      lastTime = 0;
      frameId = window.requestAnimationFrame(tick);
    }

    function stop() {
      if (frameId === null) return;
      window.cancelAnimationFrame(frameId);
      frameId = null;
    }

    function setPaused(nextPaused) {
      paused = nextPaused;
      if (pauseButton) {
        pauseButton.setAttribute("aria-label", paused ? "Play animation" : "Pause animation");
        pauseButton.title = paused ? "Play animation" : "Pause animation";
      }
      if (pauseIcon) pauseIcon.hidden = paused;
      if (playIcon) playIcon.hidden = !paused;

      if (paused) {
        stop();
        draw();
      } else {
        start();
      }
    }

    function setMode(nextMode) {
      if (nextMode === mode) return;
      mode = nextMode;
      modeButtons.forEach((button) => {
        const active = button.dataset.mode === mode;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      resetScene();
      if (reduced || paused) draw();
      else start();
    }

    function cyclePalette() {
      paletteIndex = (paletteIndex + 1) % palettes.length;
      const colors = palette();
      if (paletteDot) {
        paletteDot.style.background = `linear-gradient(135deg, ${rgba(colors.a, 1)}, ${rgba(colors.b, 1)})`;
      }
      if (paletteButton) {
        paletteButton.setAttribute("aria-label", `Color palette: ${colors.name}. Change palette.`);
        paletteButton.title = `Palette: ${colors.name}`;
      }
      if (reduced || paused) draw();
    }

    modeButtons.forEach((button) => {
      button.addEventListener("click", () => setMode(button.dataset.mode));
    });

    if (paletteButton) {
      paletteButton.addEventListener("click", cyclePalette);
    }

    if (pauseButton) {
      pauseButton.addEventListener("click", () => setPaused(!paused));
    }

    if (speedInput) {
      speedInput.addEventListener("input", () => {
        speed = clamp(Number(speedInput.value) / 100, 0.2, 2);
      });
    }

    function pointerPosition(event) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    }

    canvas.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") return;
      const point = pointerPosition(event);
      mouse.x = point.x;
      mouse.y = point.y;
      mouse.inside = true;
    }, { passive: true });

    canvas.addEventListener("pointerleave", () => {
      mouse.inside = false;
    });

    canvas.addEventListener("pointerdown", (event) => {
      const point = pointerPosition(event);
      pulse = { x: point.x, y: point.y, age: 0 };
      if (mode === "mesh") {
        for (const node of nodes) {
          const dx = node.x - point.x;
          const dy = node.y - point.y;
          const distance = Math.hypot(dx, dy);
          if (distance < 110 && distance > 0.5) {
            const force = (1 - distance / 110) * 1.6;
            node.vx += (dx / distance) * force;
            node.vy += (dy / distance) * force;
          }
        }
      }
      if (reduced || paused) draw();
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      else if (!paused) start();
    });

    motionQuery.addEventListener("change", (event) => {
      reduced = event.matches;
      if (reduced) {
        stop();
        draw();
      } else if (!paused) {
        start();
      }
    });

    if (typeof ResizeObserver === "function") {
      const observer = new ResizeObserver(() => {
        if (measure(false) && (reduced || paused)) draw();
      });
      observer.observe(stage);
    } else {
      window.addEventListener("resize", () => {
        if (measure(false) && (reduced || paused)) draw();
      });
    }

    window.requestAnimationFrame(() => {
      measure(true);
      draw();
      start();
    });
  })();

  /* ----------------------------------------------------------
     Card spotlight + subtle pointer tilt
     ---------------------------------------------------------- */

  (function cardInteractions() {
    const cards = Array.from(document.querySelectorAll(".card"));

    cards.forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        card.style.setProperty("--mx", `${x}px`);
        card.style.setProperty("--my", `${y}px`);

        if (!pointerQuery.matches || motionQuery.matches) return;
        if (event.pointerType === "touch") return;
        if (card.classList.contains("field-card")) return;

        const rotateX = ((y / rect.height) - 0.5) * -2.4;
        const rotateY = ((x / rect.width) - 0.5) * 2.4;
        card.style.transform =
          `perspective(1200px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
      });

      const reset = () => {
        card.style.transform = "";
      };

      card.addEventListener("pointerleave", reset);
      card.addEventListener("pointercancel", reset);
    });
  })();

  /* ----------------------------------------------------------
     Cursor glow
     ---------------------------------------------------------- */

  (function cursorGlow() {
    const glow = document.querySelector(".cursor-glow");
    if (!glow || !pointerQuery.matches || motionQuery.matches) return;

    let targetX = -9999;
    let targetY = -9999;
    let currentX = -9999;
    let currentY = -9999;
    let frameId = null;
    let visible = false;

    function frame() {
      currentX += (targetX - currentX) * 0.16;
      currentY += (targetY - currentY) * 0.16;
      glow.style.transform = `translate3d(${currentX - 310}px, ${currentY - 310}px, 0)`;

      if (Math.abs(targetX - currentX) > 0.5 || Math.abs(targetY - currentY) > 0.5) {
        frameId = window.requestAnimationFrame(frame);
      } else {
        frameId = null;
      }
    }

    document.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") return;
      targetX = event.clientX;
      targetY = event.clientY;

      if (!visible) {
        currentX = targetX;
        currentY = targetY;
        visible = true;
        glow.style.opacity = "1";
      }

      if (frameId === null) frameId = window.requestAnimationFrame(frame);
    }, { passive: true });

    function hide() {
      visible = false;
      glow.style.opacity = "0";
    }

    document.addEventListener("mouseleave", hide);
    window.addEventListener("blur", hide);
  })();

  /* ----------------------------------------------------------
     Skill filter
     ---------------------------------------------------------- */

  (function skillFilter() {
    const list = document.getElementById("skill-list");
    const buttons = Array.from(document.querySelectorAll("[data-skill-filter]"));
    if (!list || buttons.length === 0) return;

    let resetTimer = 0;

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const filter = button.dataset.skillFilter;
        if (filter === list.dataset.filter) return;

        list.dataset.filter = filter;
        buttons.forEach((item) => {
          const active = item === button;
          item.classList.toggle("is-active", active);
          item.setAttribute("aria-pressed", String(active));
        });

        list.classList.remove("is-switching");
        void list.offsetWidth;
        list.classList.add("is-switching");
        window.clearTimeout(resetTimer);
        resetTimer = window.setTimeout(() => list.classList.remove("is-switching"), 380);
      });
    });
  })();

  /* ----------------------------------------------------------
     Contact dialog
     ---------------------------------------------------------- */

  (function contactDialog() {
    const dialog = document.getElementById("contact-dialog");
    const openers = Array.from(document.querySelectorAll("[data-open-contact]"));
    if (!dialog) return;

    const supportsDialog = typeof dialog.showModal === "function";

    openers.forEach((opener) => {
      opener.addEventListener("click", () => {
        if (supportsDialog) {
          if (!dialog.open) dialog.showModal();
          document.body.classList.add("dialog-open");
        } else {
          window.location.href = "mailto:rowellfernandez.careers@gmail.com";
        }
      });
    });

    dialog.querySelectorAll("[data-close-contact]").forEach((button) => {
      button.addEventListener("click", () => dialog.close());
    });

    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const outside =
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom;
      if (outside) dialog.close();
    });

    dialog.addEventListener("close", () => {
      document.body.classList.remove("dialog-open");
    });
  })();

  /* ----------------------------------------------------------
     Copy to clipboard
     ---------------------------------------------------------- */

  (function copyActions() {
    const buttons = Array.from(document.querySelectorAll("[data-copy]"));
    const status = document.querySelector(".copy-status");
    if (buttons.length === 0) return;

    function fallbackCopy(text) {
      const field = document.createElement("textarea");
      field.value = text;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.top = "-1000px";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();

      let copied = false;
      try {
        copied = document.execCommand("copy");
      } catch (error) {
        copied = false;
      }

      document.body.removeChild(field);
      return copied;
    }

    buttons.forEach((button) => {
      button.addEventListener("click", async () => {
        const value = button.dataset.copy;
        const label = button.querySelector("span");
        let copied = false;

        if (navigator.clipboard && navigator.clipboard.writeText) {
          try {
            await navigator.clipboard.writeText(value);
            copied = true;
          } catch (error) {
            copied = false;
          }
        }

        if (!copied) copied = fallbackCopy(value);

        if (copied) {
          button.classList.add("copied");
          if (label) label.textContent = "Copied";
          if (status) status.textContent = `${value} copied to clipboard.`;

          window.clearTimeout(button._copyTimer);
          button._copyTimer = window.setTimeout(() => {
            button.classList.remove("copied");
            if (label) label.textContent = "Copy";
            if (status) status.textContent = "";
          }, 2200);
        } else if (status) {
          status.textContent = "Could not copy automatically. Select the text instead.";
        }
      });
    });
  })();

  /* ----------------------------------------------------------
     Footer year + local time
     ---------------------------------------------------------- */

  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  const localTime = document.getElementById("local-time");
  if (localTime) {
    const formatter = new Intl.DateTimeFormat("en-PH", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Manila",
    });

    const updateTime = () => {
      const now = new Date();
      localTime.textContent = formatter.format(now);
      localTime.setAttribute("datetime", now.toISOString());
    };

    updateTime();
    window.setInterval(updateTime, 30000);
  }
})();
