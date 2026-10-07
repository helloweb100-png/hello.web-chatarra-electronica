/* =====================================================================
   CDL E-WASTE & SCRAP RECYCLING  |  Chatarra Electronica
   Vanilla JS. GSAP + ScrollTrigger (CDN) para el scroll: si no cargan,
   la pagina sigue siendo completamente funcional y legible.

   Indice:
   1 utilidades   2 loader   3 textos (split + scramble)   4 reveal
   5 nav y menu   6 canvas del hero   7 scroll (GSAP)   8 tabs   9 faq
   10 formulario  11 whatsapp  12 microinteracciones  13 arranque
===================================================================== */
(() => {
  'use strict';

  /* 1. UTILIDADES ---------------------------------------------------- */
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const root = document.documentElement;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);

  const WA_NUMBER = '523313585410';

  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);
  else root.classList.add('no-gsap');

  root.classList.add('is-loading');
  // Seguro: nunca dejar la pagina bloqueada
  setTimeout(() => root.classList.remove('is-loading'), 9000);

  /* 2. LOADER -------------------------------------------------------- */
  function runLoader(onDone) {
    const el = $('#loader');
    if (!el) { root.classList.remove('is-loading'); root.classList.add('is-ready'); onDone(); return; }

    const pctEl = $('#loader-pct');
    const ring = $('#loader-ring');
    const status = $('#loader-status');
    const CIRC = 289;
    const words = ['Recibiendo', 'Clasificando', 'Reciclando', 'Listo'];
    const duration = reduce ? 500 : 2600;

    let loaded = document.readyState === 'complete';
    if (!loaded) addEventListener('load', () => { loaded = true; }, { once: true });
    setTimeout(() => { loaded = true; }, 4500);

    const t0 = performance.now();
    let lastWord = -1;
    let finished = false;
    const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    function finish() {
      if (finished) return;
      finished = true;
      el.classList.add('is-done');
      setTimeout(() => {
        root.classList.add('is-ready');
        root.classList.remove('is-loading');
        onDone();
      }, 520);
      setTimeout(() => el.remove(), 1600);
    }

    function frame(now) {
      const t = Math.min(1, (now - t0) / duration);
      let p = ease(t);
      if (!loaded) p = Math.min(p, .94);

      const pct = Math.round(p * 100);
      pctEl.textContent = pct;
      ring.style.strokeDashoffset = String(CIRC * (1 - p));

      const w = pct >= 100 ? 3 : pct > 66 ? 2 : pct > 33 ? 1 : 0;
      if (w !== lastWord) { lastWord = w; status.textContent = words[w]; }

      if (p >= 1 && loaded) { finish(); return; }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* 3. TEXTOS -------------------------------------------------------- */
  // Divide los titulares en palabras para la animacion de entrada (mascara)
  function splitWords(el, wrapCls, innerCls) {
    let idx = 0;
    const walk = (node) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const outer = document.createElement('span');
            outer.className = wrapCls;
            if (innerCls) {
              const inner = document.createElement('span');
              inner.className = innerCls;
              inner.textContent = part;
              inner.style.setProperty('--wi', idx++);
              outer.appendChild(inner);
            } else {
              outer.textContent = part;
            }
            frag.appendChild(outer);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1) {
          walk(child);
        }
      });
    };
    walk(el);
  }

  function initSplit() {
    $$('[data-split]').forEach((h) => {
      splitWords(h, 'w', 'wi');
      h.setAttribute('data-split-ready', '');
    });
    const mani = $('[data-mani]');
    if (mani) splitWords(mani, 'mw');
  }

  // Efecto "decodificar" para el texto de marca del hero
  function scramble(el) {
    if (!el || reduce) return;
    const final = el.textContent;
    const pool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789&+/#';
    const total = 28;
    let n = 0;
    const id = setInterval(() => {
      n++;
      const k = Math.floor((final.length * n) / total);
      el.textContent = final.split('').map((c, i) => (c === ' ' || c === '&' || i < k ? c : pool[(Math.random() * pool.length) | 0])).join('');
      if (n >= total) { clearInterval(id); el.textContent = final; }
    }, 34);
  }

  /* 4. REVEAL (IntersectionObserver, sin listeners de scroll) -------- */
  function initReveal() {
    // retraso escalonado entre hermanos
    const groups = new Map();
    $$('.rv').forEach((el) => {
      const list = groups.get(el.parentElement) || [];
      el.style.setProperty('--d', Math.min(list.length, 4) * 90 + 'ms');
      list.push(el);
      groups.set(el.parentElement, list);
    });

    const targets = $$('.rv, [data-split]');
    if (!('IntersectionObserver' in window)) { targets.forEach((t) => t.classList.add('is-in')); return; }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { threshold: .18, rootMargin: '0px 0px -6% 0px' });
    targets.forEach((t) => io.observe(t));
  }

  /* 5. NAV Y MENU ---------------------------------------------------- */
  function initNav() {
    const nav = $('#nav');
    const burger = $('#burger');
    const menu = $('#menu');

    // Estado "scrolled" con un centinela (sin listener de scroll)
    if (nav && 'IntersectionObserver' in window) {
      const sentinel = document.createElement('div');
      sentinel.setAttribute('aria-hidden', 'true');
      sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:48px;pointer-events:none';
      document.body.prepend(sentinel);
      new IntersectionObserver(([e]) => nav.classList.toggle('is-scrolled', !e.isIntersecting)).observe(sentinel);
    }

    // Menu movil
    if (burger && menu) {
      menu.inert = true;
      const setMenu = (open) => {
        root.classList.toggle('menu-open', open);
        burger.setAttribute('aria-expanded', String(open));
        burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
        menu.setAttribute('aria-hidden', String(!open));
        menu.inert = !open;
      };
      burger.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));
      $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
      addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
      matchMedia('(min-width: 1024px)').addEventListener('change', (m) => { if (m.matches) setMenu(false); });
    }

    // Enlace activo segun la seccion visible
    const links = $$('.nav__links a');
    if (links.length && 'IntersectionObserver' in window) {
      const map = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          const a = map.get(e.target.id);
          if (a) a.setAttribute('aria-current', e.isIntersecting ? 'true' : 'false');
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      map.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
    }
  }

  /* 6. CANVAS DEL HERO ----------------------------------------------- */
  // Particulas que se mezclan como "chatarra", se ordenan en el simbolo de
  // reciclaje de la marca, se mantienen y vuelven a dispersarse. En bucle.
  function heroCanvas() {
    const canvas = $('#hero-canvas');
    const orb = $('#hero-orb');
    const hero = $('#inicio');
    if (!canvas || !orb || !hero) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const small = innerWidth < 768;
    const N = small ? 720 : 1500;
    const M = Math.floor(N * .84);          // particulas que forman el simbolo
    const NODES = small ? 26 : 54;
    const LINK = small ? 95 : 140;
    const REPEL = small ? 80 : 110;

    // Geometria del simbolo (misma que el SVG de la marca, espacio 0..100)
    const ARROWS = [
      { pts: [[32.4, 40.8], [50, 10], [60.8, 28.9]], head: [[50.4, 34.9], [71.2, 22.9], [69.2, 43.7]] },
      { pts: [[72.4, 49.2], [90, 80], [68.4, 80]], head: [[68.4, 68], [68.4, 92], [51.4, 80]] },
      { pts: [[45.2, 80], [10, 80], [20.8, 61.1]], head: [[31.2, 67.1], [10.4, 55.1], [29.2, 46.3]] }
    ];

    const px = new Float32Array(N), py = new Float32Array(N);
    const vx = new Float32Array(N), vy = new Float32Array(N);
    const tx = new Float32Array(N), ty = new Float32Array(N);
    const dl = new Float32Array(N), sz = new Float32Array(N);
    const nodes = [];

    let W = 0, H = 0, dpr = 1, cx = 0, cy = 0, size = 100;
    let started = false, running = false, raf = 0, last = 0, time = 0;
    const ptr = { x: -9999, y: -9999, on: false };

    // fases: 0 dispersa, 1 se ordena, 2 simbolo, 3 se rompe
    let phase = 0, pStart = 0, driftDur = 700;
    const DUR = () => [driftDur, 1900, 5400, 1000];

    function samplePoint() {
      const a = ARROWS[(Math.random() * 3) | 0];
      if (Math.random() < .28) {
        const [A, B, C] = a.head;
        const r1 = Math.sqrt(Math.random()), r2 = Math.random();
        return [(1 - r1) * A[0] + r1 * (1 - r2) * B[0] + r1 * r2 * C[0], (1 - r1) * A[1] + r1 * (1 - r2) * B[1] + r1 * r2 * C[1]];
      }
      const [p0, p1, p2] = a.pts;
      const l0 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
      const l1 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      const useFirst = Math.random() < l0 / (l0 + l1);
      const [s, e, l] = useFirst ? [p0, p1, l0] : [p1, p2, l1];
      const t = Math.random(), off = (Math.random() - .5) * 6.5;
      const nx = -(e[1] - s[1]) / l, ny = (e[0] - s[0]) / l;
      return [s[0] + (e[0] - s[0]) * t + nx * off, s[1] + (e[1] - s[1]) * t + ny * off];
    }

    function buildTargets() {
      for (let i = 0; i < N; i++) {
        if (i < M) {
          const [u, v] = samplePoint();
          tx[i] = cx + ((u - 50) / 100) * size;
          ty[i] = cy + ((v - 51) / 100) * size;
        }
      }
    }

    function measure() {
      const hr = hero.getBoundingClientRect();
      const or = orb.getBoundingClientRect();
      const oldW = W, oldH = H;
      dpr = Math.min(devicePixelRatio || 1, small ? 1.5 : 2);
      W = hr.width; H = hr.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = or.left + or.width / 2 - hr.left;
      cy = or.top + or.height / 2 - hr.top;
      size = or.width * .7;
      if (oldW && oldH) {
        for (let i = 0; i < N; i++) { px[i] *= W / oldW; py[i] *= H / oldH; }
        nodes.forEach((n) => { n.x *= W / oldW; n.y *= H / oldH; });
      }
      buildTargets();
      if (reduce && started) drawStatic();
    }

    function init() {
      measure();
      for (let i = 0; i < N; i++) {
        px[i] = Math.random() * W; py[i] = Math.random() * H;
        vx[i] = (Math.random() - .5) * 30; vy[i] = (Math.random() - .5) * 30;
        sz[i] = (small ? 1.2 : 1.4) + Math.random() * 1.5;
      }
      for (let i = 0; i < NODES; i++) {
        nodes.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * 22, vy: (Math.random() - .5) * 22 });
      }
    }

    function setPhase(p, now) {
      phase = p; pStart = now;
      if (p === 1) { for (let i = 0; i < N; i++) dl[i] = Math.random() * .55; }
      if (p === 3) {
        for (let i = 0; i < M; i++) {
          const a = Math.random() * 6.2832, s = 140 + Math.random() * 330;
          vx[i] += Math.cos(a) * s; vy[i] += Math.sin(a) * s;
        }
      }
      if (p === 0) driftDur = 2400;
    }

    const COLORS = ['rgba(57,196,108,.85)', 'rgba(141,255,181,.78)', 'rgba(39,161,88,.92)'];

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // red de nodos (circuito)
      ctx.globalCompositeOperation = 'source-over';
      ctx.lineWidth = 1;
      const L2 = LINK * LINK;
      for (let a = 0; a < nodes.length; a++) {
        const A = nodes[a];
        for (let b = a + 1; b < nodes.length; b++) {
          const B = nodes[b];
          const dx = A.x - B.x, dy = A.y - B.y, d2 = dx * dx + dy * dy;
          if (d2 < L2) {
            ctx.strokeStyle = 'rgba(57,196,108,' + ((1 - Math.sqrt(d2) / LINK) * .26).toFixed(3) + ')';
            ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
          }
        }
        if (ptr.on) {
          const dx = A.x - ptr.x, dy = A.y - ptr.y, d = Math.hypot(dx, dy);
          if (d < LINK * 1.5) {
            ctx.strokeStyle = 'rgba(141,255,181,' + ((1 - d / (LINK * 1.5)) * .5).toFixed(3) + ')';
            ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(ptr.x, ptr.y); ctx.stroke();
          }
        }
      }
      ctx.fillStyle = 'rgba(141,255,181,.75)';
      for (let a = 0; a < nodes.length; a++) ctx.fillRect(nodes[a].x - 1.5, nodes[a].y - 1.5, 3, 3);

      // particulas (suma de luz para el brillo)
      ctx.globalCompositeOperation = 'lighter';
      const per = Math.floor(N / 3);
      for (let b = 0; b < 3; b++) {
        ctx.fillStyle = COLORS[b];
        const end = b === 2 ? N : (b + 1) * per;
        for (let i = b * per; i < end; i++) {
          const s = sz[i];
          ctx.fillRect(px[i] - s / 2, py[i] - s / 2, s, s);
        }
      }
    }

    function drawStatic() {
      for (let i = 0; i < N; i++) { if (i < M) { px[i] = tx[i]; py[i] = ty[i]; } }
      draw();
    }

    function tick(now) {
      if (!running) return;
      raf = requestAnimationFrame(tick);
      const dt = Math.min(.033, (now - last) / 1000);
      last = now; time += dt;

      if (now - pStart > DUR()[phase]) setPhase((phase + 1) % 4, now);

      const formed = phase === 1 || phase === 2;
      const tsec = (now - pStart) / 1000;
      const K = phase === 2 ? 24 : 14;
      const dragForm = Math.exp(-(phase === 2 ? 7 : 4.4) * dt);
      const dragFree = Math.exp(-.9 * dt);
      const R2 = REPEL * REPEL;

      for (let i = 0; i < N; i++) {
        let ax, ay, locked = false;
        if (i < M && formed && (phase === 2 || tsec > dl[i])) {
          const wob = phase === 2 ? Math.sin(time * 2.2 + i) * 1.1 : 0;
          ax = (tx[i] + wob - px[i]) * K;
          ay = (ty[i] + wob * .8 - py[i]) * K;
          locked = true;
        } else {
          ax = Math.sin(py[i] * .006 + time * .5 + i * .13) * 30;
          ay = Math.cos(px[i] * .006 + time * .45 + i * .07) * 30;
        }

        if (ptr.on) {
          const dx = px[i] - ptr.x, dy = py[i] - ptr.y, d2 = dx * dx + dy * dy;
          if (d2 < R2) {
            const d = Math.sqrt(d2) + .001, f = (1 - d / REPEL) * 1100;
            ax += (dx / d) * f; ay += (dy / d) * f;
          }
        }

        const drag = locked ? dragForm : dragFree;
        vx[i] = (vx[i] + ax * dt) * drag;
        vy[i] = (vy[i] + ay * dt) * drag;
        px[i] += vx[i] * dt; py[i] += vy[i] * dt;

        if (!locked) {
          if (px[i] < -20) px[i] = W + 20; else if (px[i] > W + 20) px[i] = -20;
          if (py[i] < -20) py[i] = H + 20; else if (py[i] > H + 20) py[i] = -20;
        }
      }

      for (let a = 0; a < nodes.length; a++) {
        const n = nodes[a];
        n.x += n.vx * dt; n.y += n.vy * dt;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
      }
      draw();
    }

    function run() {
      if (running || !started || reduce) return;
      running = true; last = performance.now();
      raf = requestAnimationFrame(tick);
    }
    function stop() { running = false; cancelAnimationFrame(raf); }

    // Puntero
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; ptr.on = true;
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { ptr.on = false; });

    // Pausa cuando el hero no se ve o la pestana esta oculta
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => (e.isIntersecting ? run() : stop()), { threshold: 0 }).observe(hero);
    }
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : run()));

    // Re-medir al cambiar el tamano
    let rt;
    if ('ResizeObserver' in window) {
      new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(measure, 150); }).observe(hero);
    } else {
      addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(measure, 150); });
    }

    init();

    return {
      start() {
        started = true;
        measure();
        if (reduce) { drawStatic(); return; }
        setPhase(0, performance.now());
        run();
      }
    };
  }

  /* 7. SCROLL (GSAP + ScrollTrigger) --------------------------------- */
  function scrollFx() {
    if (!hasGSAP || reduce) return;

    // barra de progreso de lectura
    gsap.to('.progress i', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .25 } });

    // el hero se desvanece suavemente al salir
    gsap.to('.hero__copy', { yPercent: -10, opacity: .15, ease: 'none', scrollTrigger: { trigger: '#inicio', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero__orb', { yPercent: -8, scale: .92, ease: 'none', scrollTrigger: { trigger: '#inicio', start: 'top top', end: 'bottom top', scrub: true } });

    // manifiesto: las palabras se encienden con el scroll
    const words = $$('.mw');
    if (words.length) {
      gsap.set(words, { opacity: .14 });
      gsap.to(words, { opacity: 1, ease: 'none', stagger: .12, scrollTrigger: { trigger: '.mani__text', start: 'top 82%', end: 'bottom 58%', scrub: .4 } });
    }

    // paralaje
    $$('[data-speed]').forEach((el) => {
      const s = parseFloat(el.dataset.speed) || 0;
      const host = el.closest('section, footer') || el;
      gsap.fromTo(el, { yPercent: -s }, {
        yPercent: s, ease: 'none',
        scrollTrigger: { trigger: host, start: 'top bottom', end: host.tagName === 'FOOTER' ? 'bottom bottom' : 'bottom top', scrub: true }
      });
    });

    // proceso: la linea se llena y los pasos se activan
    const steps = $$('.step');
    if (steps.length) {
      gsap.to('.steps__line i', { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.steps', start: 'top 65%', end: 'bottom 65%', scrub: .3 } });
      steps.forEach((s) => ScrollTrigger.create({
        trigger: s, start: 'top 68%',
        onEnter: () => s.classList.add('is-on'),
        onLeaveBack: () => s.classList.remove('is-on')
      }));
    }

    // materiales: scroll horizontal anclado (solo escritorio)
    const mm = gsap.matchMedia();
    mm.add('(min-width: 1024px) and (min-height: 700px)', () => {
      const sec = $('.mat');
      const track = $('.mat__track');
      if (!sec || !track) return undefined;
      sec.classList.add('is-pinned');
      const dist = () => Math.max(0, track.scrollWidth - innerWidth);
      gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: { trigger: sec, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: .8, invalidateOnRefresh: true, anticipatePin: 1 }
      });
      return () => sec.classList.remove('is-pinned');
    });
  }

  /* 8. TABS ---------------------------------------------------------- */
  function initTabs() {
    const tabs = $$('.tab');
    const panels = $$('.pan');
    const ico = $('#dent-ico');
    if (!tabs.length) return;
    const icons = ['ph-cpu', 'ph-laptop', 'ph-device-mobile', 'ph-plug'];

    function select(i, focus) {
      tabs.forEach((t, k) => {
        const on = k === i;
        t.classList.toggle('is-on', on);
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      panels.forEach((p, k) => { p.hidden = k !== i; p.classList.toggle('is-on', k === i); });
      if (ico) {
        ico.classList.add('is-swap');
        setTimeout(() => {
          ico.className = 'ph ' + icons[i] + ' is-swap';
          requestAnimationFrame(() => requestAnimationFrame(() => ico.classList.remove('is-swap')));
        }, 220);
      }
      if (focus) tabs[i].focus();
    }

    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i));
      t.addEventListener('keydown', (e) => {
        const keys = { ArrowRight: 1, ArrowLeft: -1 };
        if (e.key in keys) { e.preventDefault(); select((i + keys[e.key] + tabs.length) % tabs.length, true); }
        if (e.key === 'Home') { e.preventDefault(); select(0, true); }
        if (e.key === 'End') { e.preventDefault(); select(tabs.length - 1, true); }
      });
    });
  }

  /* 9. FAQ ----------------------------------------------------------- */
  function initFaq() {
    $$('.qa button').forEach((b) => {
      b.addEventListener('click', () => {
        const qa = b.closest('.qa');
        const open = !qa.classList.contains('is-open');
        $$('.qa.is-open').forEach((o) => {
          if (o === qa) return;
          o.classList.remove('is-open');
          $('button', o).setAttribute('aria-expanded', 'false');
        });
        qa.classList.toggle('is-open', open);
        b.setAttribute('aria-expanded', String(open));
      });
    });
  }

  /* 10. FORMULARIO (termina en WhatsApp) ----------------------------- */
  function initForm() {
    const form = $('#quote-form');
    if (!form) return;
    const status = $('#form-status');
    const btn = $('#f-submit');

    const cleanPhone = (v) => {
      let d = v.replace(/\D/g, '');
      if (d.length === 12 && d.startsWith('52')) d = d.slice(2);
      return d;
    };

    const rules = [
      { el: $('#f-name'), err: $('#e-name'), test: (v) => v.trim().length >= 2 || 'Escribe tu nombre para saber con quién hablamos.' },
      { el: $('#f-tel'), err: $('#e-tel'), test: (v) => cleanPhone(v).length === 10 || 'Escribe tu número a 10 dígitos.' },
      { el: $('#f-mat'), err: $('#e-mat'), test: (v) => v !== '' || 'Elige qué tipo de chatarra tienes.' },
      { el: $('#f-vol'), err: $('#e-vol'), test: (v) => v !== '' || 'Elige una cantidad aproximada.' }
    ];

    function check(rule, show = true) {
      const res = rule.test(rule.el.value);
      const msg = res === true ? '' : res;
      const wrap = rule.el.closest('.field');
      if (show || !msg) {
        wrap.classList.toggle('has-err', !!msg);
        rule.err.textContent = msg;
        rule.el.setAttribute('aria-invalid', String(!!msg));
      }
      return !msg;
    }

    rules.forEach((r) => {
      r.el.addEventListener('blur', () => check(r));
      r.el.addEventListener('input', () => { if (r.el.closest('.field').classList.contains('has-err')) check(r); });
      r.el.addEventListener('change', () => { if (r.el.closest('.field').classList.contains('has-err')) check(r); });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      status.textContent = '';
      const results = rules.map((r) => check(r));
      if (results.includes(false)) {
        rules.find((r, i) => !results[i]).el.focus();
        status.textContent = 'Revisa los campos marcados para continuar.';
        return;
      }

      const name = $('#f-name').value.trim();
      const tel = cleanPhone($('#f-tel').value);
      const mat = $('#f-mat').value;
      const vol = $('#f-vol').value;
      const msg = $('#f-msg').value.trim();

      const text = [
        'Hola, soy ' + name + '. Quiero cotizar mi chatarra electrónica.',
        'Material: ' + mat,
        'Cantidad: ' + vol,
        'Mi WhatsApp: ' + tel,
        msg ? 'Detalles: ' + msg : ''
      ].filter(Boolean).join('\n');

      const url = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text);

      btn.classList.add('is-loading');
      status.textContent = 'Perfecto. Abriendo WhatsApp con tu mensaje listo...';
      setTimeout(() => {
        const w = window.open(url, '_blank', 'noopener');
        if (!w) location.href = url;
        btn.classList.remove('is-loading');
        status.textContent = 'Si WhatsApp no se abrió, toca el botón verde de la esquina.';
      }, 750);
    });
  }

  /* 11. WHATSAPP FLOTANTE -------------------------------------------- */
  function initWa() {
    const tip = $('#wa-tip');
    const wa = $('#wa');
    if (!tip || !wa) return;
    setTimeout(() => tip.classList.add('is-on'), 6000);
    setTimeout(() => tip.classList.remove('is-on'), 14000);
    wa.addEventListener('click', () => tip.classList.remove('is-on'));
  }

  /* 12. MICROINTERACCIONES ------------------------------------------- */
  function initMicro() {
    // Foco que sigue al cursor en tarjetas
    $$('[data-spot]').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--x', e.clientX - r.left + 'px');
        card.style.setProperty('--y', e.clientY - r.top + 'px');
      }, { passive: true });
    });

    // Botones magneticos (solo puntero fino)
    if (finePointer && !reduce) {
      $$('[data-magnetic]').forEach((el) => {
        el.addEventListener('pointermove', (e) => {
          const r = el.getBoundingClientRect();
          el.style.setProperty('--mx', (e.clientX - (r.left + r.width / 2)) * .22 + 'px');
          el.style.setProperty('--my', (e.clientY - (r.top + r.height / 2)) * .3 + 'px');
        });
        el.addEventListener('pointerleave', () => {
          el.style.setProperty('--mx', '0px');
          el.style.setProperty('--my', '0px');
        });
      });
    }

    // Imagen caida: el contenedor conserva su fondo y gradiente
    document.addEventListener('error', (e) => {
      if (e.target && e.target.tagName === 'IMG') e.target.style.display = 'none';
    }, true);

    const y = $('#year');
    if (y) y.textContent = new Date().getFullYear();
  }

  /* 13. ARRANQUE ------------------------------------------------------ */
  function boot() {
    initSplit();
    initReveal();
    initNav();
    initTabs();
    initFaq();
    initForm();
    initWa();
    initMicro();

    const hero = heroCanvas();

    runLoader(() => {
      if (hero) hero.start();
      setTimeout(() => scramble($('#hero-eyebrow')), 350);
      if (hasGSAP) {
        scrollFx();
        ScrollTrigger.refresh();
        addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
      } else {
        // sin GSAP: todos los pasos visibles
        $$('.step').forEach((s) => s.classList.add('is-on'));
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
