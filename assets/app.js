/* Z&H Aufbereitung – Designentwurf v2 von Falcon Eye */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const hasG = !!(window.gsap && window.ScrollTrigger);
  const store = { get(k) { try { return sessionStorage.getItem(k) } catch (e) { return null } }, set(k, v) { try { sessionStorage.setItem(k, v) } catch (e) {} } };
  const DPR = () => Math.min(2, devicePixelRatio || 1);
  const portrait = () => innerHeight > innerWidth * 1.05;
  if (hasG) gsap.registerPlugin(ScrollTrigger);
  // v6: Scroll-Fallback respektiert jetzt den Rand (vorher feuerte er schon 200px vor dem Bild – Impulse liefen unsichtbar ab)
  const onView = (el, fn, margin = '200px') => { if (!el) return; let done = false;
    const mpx = () => { const v = parseFloat(margin) || 0; return /%$/.test(margin) ? v / 100 * innerHeight : v; };
    const go = () => { if (done) return; done = true; io.disconnect(); removeEventListener('scroll', chk); fn(); };
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) go(); }, { rootMargin: margin });
    const chk = () => { if (done) return; const r = el.getBoundingClientRect(), m = mpx(); if (!r.width && !r.height) return; if (r.top < innerHeight + m && r.bottom > -m) go(); };
    io.observe(el); addEventListener('scroll', chk, { passive: true }); setTimeout(chk, 300); };
  const HAND = '<svg class="hand" viewBox="0 0 24 24" aria-hidden="true"><path d="M9.2 11.2V4.6a1.6 1.6 0 0 1 3.2 0v5.2h.4V8.6a1.6 1.6 0 0 1 3.2 0v1.6h.4v-.7a1.6 1.6 0 0 1 3.2 0v5.6c0 3.6-2.8 6.5-6.4 6.5h-1.3a6.3 6.3 0 0 1-4.9-2.3l-3.4-4.2a1.7 1.7 0 0 1 2.5-2.2l1.9 1.8z"/></svg>';
  const visTrack = (el, cb) => { let v = false; new IntersectionObserver(([e]) => { v = e.isIntersecting; cb && cb(v); }).observe(el); const chk = () => { const r = el.getBoundingClientRect(); v = r.top < innerHeight && r.bottom > 0; }; addEventListener('scroll', chk, { passive: true }); chk(); return () => v; };

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (hasG && window.Lenis && !reduce) { lenis = new Lenis({ lerp: .1 }); window.feLenis = lenis; lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }

  /* ---------- header: hell/dunkel je nach Abschnitt ---------- */
  const hdr = $('.hdr'), bar = $('.progress i'), dock = $('.dock'); let lastY = 0;
  const darkSel = '.hero,.night,.fpv,.gloss,.cta,.ftr,.phero,.arbeit';
  const onScroll = () => {
    const y = scrollY, max = root.scrollHeight - innerHeight;
    hdr.style.visibility = 'hidden'; const el = document.elementFromPoint(innerWidth / 2, 30); hdr.style.visibility = '';
    const sec = el && el.closest(darkSel), top = y < 30 && $('.hero,.phero');
    hdr.classList.toggle('dark', !!sec && !top); hdr.classList.toggle('solid', !sec && !top);
    hdr.classList.toggle('hide', y > 600 && y > lastY + 2 && !root.classList.contains('menu-open'));
    if (dock) dock.classList.toggle('away', y > lastY + 2 && y > 300 && false);
    lastY = y; bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const burger = $('.burger');
  const setMenu = o => { root.classList.toggle('menu-open', o); burger.setAttribute('aria-expanded', o); burger.setAttribute('aria-label', o ? 'Menü schließen' : 'Menü öffnen'); $('.mnav').setAttribute('aria-hidden', !o); lenis && (o ? lenis.stop() : lenis.start()); };
  burger.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && root.classList.contains('menu-open')) { setMenu(false); burger.focus(); } });
  $$('.mnav a').forEach(a => a.addEventListener('click', () => { root.classList.remove('menu-open'); lenis && lenis.start(); }));

  /* ---------- Öffnungszeiten Mo–Fr 08:00–16:30 ---------- */
  const berlin = () => { const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date()).map(x => [x.type, x.value])); return { d: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday), m: (+p.hour % 24) * 60 + +p.minute }; };
  const O = 480, C = 990, DN = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const hours = () => {
    const { d, m } = berlin(), wd = d >= 1 && d <= 5, open = wd && m >= O && m < C;
    let txt; if (open) { const r = C - m; txt = `Geöffnet · noch ${Math.floor(r / 60) ? Math.floor(r / 60) + ' Std ' : ''}${r % 60} Min`; }
    else { let k = 0; if (!(wd && m < O)) { do { k++; } while ([0, 6].includes((d + k) % 7)); } txt = `Geschlossen · öffnet ${k === 0 ? 'heute' : k === 1 ? 'morgen' : DN[(d + k) % 7]} um 08:00`; }
    $$('[data-status]').forEach(s => { s.classList.toggle('open', open); s.classList.toggle('closed', !open); s.querySelector('b').textContent = open ? 'Jetzt geöffnet' : txt; });
    const big = $('[data-status-big]'), sub = $('[data-status-sub]'); if (big) { big.textContent = open ? 'Geöffnet' : 'Mo–Fr'; sub.textContent = open ? txt.replace('Geöffnet · ', '') + ' heute' : '08:00–16:30 · ' + txt.split(' · ')[1]; }
    $$('[data-countdown]').forEach(c => c.textContent = txt);
  };
  hours(); setInterval(hours, 30000);

  /* ---------- Zähler ---------- */
  $$('[data-count]').forEach(c => onView(c, () => { if (reduce) return; const end = +c.dataset.count, dec = +(c.dataset.dec || 0), t0 = performance.now(); (function f(n) { const p = Math.min(1, (n - t0) / 1600), v = end * (1 - Math.pow(1 - p, 3)); c.textContent = v.toFixed(dec).replace('.', ','); if (p < 1) requestAnimationFrame(f); else c.textContent = end.toFixed(dec).replace('.', ','); })(t0); }, '0px'));

  /* ---------- Videos: Quelle je nach Format, erst kurz vor Sicht laden ---------- */
  const pickSrc = v => v.dataset.src || (portrait() && v.dataset.m ? v.dataset.m : v.dataset.d);
  $$('video[data-src],video[data-d]').forEach(v => {
    v.muted = true; v.setAttribute('muted', '');
    const load = () => { if (v.src) return; const s = pickSrc(v); if (s) { v.src = s; } };
    if (v.classList.contains('hero-v') || v.closest('.phero')) { if (portrait() && v.classList.contains('hero-v')) v.poster = 'vid/hero_poster_m_turm.jpg'; load(); }
    else onView(v, load, '600px');
  });
  const vio = new IntersectionObserver(es => es.forEach(e => { const v = e.target; if (e.isIntersecting) { if (!v.src && (v.dataset.src || v.dataset.d)) v.src = pickSrc(v); const p = v.play(); p && p.catch(() => {}); } else v.pause(); }), { threshold: .05 });
  $$('video[muted],video[data-src],video[data-d]').forEach(v => { v.muted = true; if (!v.closest('.lb')) vio.observe(v); });

  /* ---------- Imagefilm ---------- */
  const lb = $('.lb');
  $$('[data-film]').forEach(b => b.addEventListener('click', () => { const v = $('video', lb); v.src = 'vid/imagefilm.mp4'; v.poster = 'vid/imagefilm.jpg'; lb.hidden = false; v.muted = false; v.play().catch(() => {}); lenis && lenis.stop(); }));
  const closeLb = () => { const v = $('video', lb); v.pause(); lb.hidden = true; lenis && lenis.start(); };
  $('.lb-x').addEventListener('click', closeLb); lb.addEventListener('click', e => { if (e.target === lb) closeLb(); }); addEventListener('keydown', e => { if (e.key === 'Escape' && !lb.hidden) closeLb(); });

  /* =====================================================================
     INTRO: Seifenblasen – die große platzt, das Logo steht scharf da
     ===================================================================== */
  const intro = $('.intro');
  const heroIn = () => { if (!hasG || reduce || !$('.hero-c')) return; gsap.from('.hero-c > *', { y: 46, opacity: .01, duration: 1.2, ease: 'power3.out', stagger: .09 }); gsap.from('.hud > span', { opacity: 0, duration: 1, delay: .4, stagger: .1 }); };
  if (intro) {
    /* Seifenblasen-Intro nur beim ersten Besuch (localStorage zh-intro), höchstens ~2 s, Klick öffnet sofort. ?intro erzwingt, ?nointro überspringt. */
    const force = /[?&]intro\b/.test(location.search), skip = /[?&]nointro/.test(location.search);
    let navType = ''; try { navType = (performance.getEntriesByType('navigation')[0] || {}).type || ''; } catch (e) {}
    let inside = false; try { const r = new URL(document.referrer), base = location.pathname.replace(/[^/]*$/, ''); inside = r.origin === location.origin && r.pathname.startsWith(base); } catch (e) {}
    let seen = false; try { seen = localStorage.getItem('zh-intro') === '1'; } catch (e) {}
    /* Natan 11.11.: Intro nur beim allerersten Besuch, danach nie wieder (pro Gerät). */
    const show = hasG && !skip && (force || (!reduce && !seen && !inside));
    if (show) { try { localStorage.setItem('zh-intro', '1'); } catch (e) {} }
    if (!show) { intro.classList.add('gone'); heroIn(); }
    else {
      intro.classList.remove('gone'); intro.removeAttribute('aria-hidden'); intro.setAttribute('role', 'dialog'); intro.setAttribute('aria-label', 'Intro'); lenis && lenis.stop(); root.style.overflow = 'hidden';
      const cv = $('.ib', intro), ctx = cv.getContext('2d'), mark = $('.intro-mark', intro);
      let W, H, dpr = DPR(); const fit = () => { dpr = DPR(); W = cv.width = innerWidth * dpr; H = cv.height = innerHeight * dpr; }; fit(); addEventListener('resize', fit);
      const S = () => Math.min(W, H);
      const bubbles = [], drops = [], rings = [];
      const mk = (big) => ({ x: big ? W / 2 : Math.random() * W, y: big ? H + S() * .45 : H + 40 * dpr + Math.random() * H * .6, r: big ? S() * .3 : (10 + Math.random() * 46) * dpr, vy: big ? 0 : -(18 + Math.random() * 40) * dpr, ph: Math.random() * 6.28, hue: Math.random() * 360, big, wob: Math.random() * 6.28 });
      for (let i = 0; i < (innerWidth < 700 ? 9 : 16); i++) bubbles.push(mk(false));
      const main = mk(true); bubbles.push(main);
      const film = (b, t) => { // Seifenhaut: Interferenzfarben am Rand
        const { x, y, r } = b, h = (b.hue + t * 40) % 360;
        const body = ctx.createRadialGradient(x, y, r * .55, x, y, r);
        body.addColorStop(0, 'rgba(255,255,255,0.0)'); body.addColorStop(.82, 'rgba(170,235,245,0.05)'); body.addColorStop(1, 'rgba(210,250,255,0.22)');
        ctx.fillStyle = body; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
        const g = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
        g.addColorStop(0, `hsla(${h},95%,70%,.55)`); g.addColorStop(.33, `hsla(${h + 90},95%,68%,.35)`); g.addColorStop(.66, `hsla(${h + 200},95%,70%,.5)`); g.addColorStop(1, `hsla(${h + 300},95%,72%,.4)`);
        ctx.strokeStyle = g; ctx.lineWidth = Math.max(1.2 * dpr, r * .045); ctx.beginPath(); ctx.arc(x, y, r * .985, 0, 7); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = Math.max(1 * dpr, r * .035); ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(x, y, r * .86, Math.PI * 1.08, Math.PI * 1.38); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(x, y, r * .86, Math.PI * .15, Math.PI * .3); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.ellipse(x - r * .42, y - r * .48, r * .09, r * .05, -.7, 0, 7); ctx.fill();
      };
      const pop = (b) => { b.dead = true; const n = b.big ? 70 : 16;
        for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, sp = (b.big ? 380 + Math.random() * 900 : 120 + Math.random() * 260) * dpr; drops.push({ x: b.x + Math.cos(a) * b.r, y: b.y + Math.sin(a) * b.r, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: (b.big ? 1.5 + Math.random() * 3.5 : 1 + Math.random() * 2) * dpr, l: 1, h: (b.hue + i * 9) % 360 }); }
        rings.push({ x: b.x, y: b.y, r: b.r, l: 1, big: b.big });
      };
      let run = true, t0 = performance.now(), last = t0, mainPopped = false;
      const loop = (now) => {
        if (!run) return; requestAnimationFrame(loop);
        const dt = Math.min(.05, (now - last) / 1000), t = (now - t0) / 1000; last = now;
        ctx.clearRect(0, 0, W, H);
        for (const b of bubbles) {
          if (b.dead) continue;
          if (b.big) { const p = Math.min(1, t / .8), e = 1 - Math.pow(1 - p, 3); b.y = (H + S() * .45) + (H / 2 - (H + S() * .45)) * e; b.x = W / 2 + Math.sin(t * 1.3) * 8 * dpr; b.r = S() * (.3 + .03 * Math.sin(t * 2.2)); }
          else { b.y += b.vy * dt; b.x += Math.sin(t * 1.2 + b.wob) * 12 * dpr * dt; if (b.y < -b.r * 2) Object.assign(b, mk(false), { y: H + b.r * 2 }); }
          film(b, t);
        }
        for (const r of rings) { r.l -= dt * (r.big ? 1.6 : 3); r.r += dt * (r.big ? 600 : 200) * dpr; if (r.l <= 0) continue; ctx.strokeStyle = `rgba(160,245,250,${r.l * .5})`; ctx.lineWidth = 2 * dpr * r.l; ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, 7); ctx.stroke(); }
        for (const d of drops) { d.vy += 900 * dpr * dt; d.vx *= .985; d.x += d.vx * dt; d.y += d.vy * dt; d.l -= dt * .9; if (d.l <= 0) continue; ctx.fillStyle = `hsla(${d.h},90%,82%,${d.l})`; ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 7); ctx.fill(); }
        if (!mainPopped && t > .9) { mainPopped = true; pop(main); reveal(); }
      };
      requestAnimationFrame(loop);
      const reveal = () => {
        gsap.to(mark, { opacity: 1, filter: 'blur(0px)', scale: 1, duration: .55, ease: 'power3.out' });
        gsap.fromTo(mark.querySelectorAll('.lg-l'), { strokeDasharray: 900, strokeDashoffset: 900 }, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.out', stagger: .05 });
        gsap.from(mark.querySelectorAll('.lg-bub circle'), { scale: 0, transformOrigin: 'center', transformBox: 'fill-box', duration: .5, ease: 'back.out(3)', stagger: .06, delay: .25 });
      };
      gsap.to(mark, { opacity: .28, duration: 1.2, delay: .3 });
      /* Klick/Tipp irgendwo: Blase platzt und die Seite geht sofort auf */
      intro.addEventListener('pointerdown', e => { const x = e.clientX * dpr, y = e.clientY * dpr; for (const b of bubbles) { if (!b.dead && Math.hypot(b.x - x, b.y - y) < b.r) { pop(b); break; } } if (!mainPopped) { mainPopped = true; pop(main); reveal(); } setTimeout(done, 280); });
      let fin = false; const done = () => { if (fin) return; fin = true; gsap.to(intro, { yPercent: -100, duration: .6, ease: 'power3.inOut', onComplete: () => { run = false; intro.classList.add('gone'); intro.setAttribute('aria-hidden', 'true'); } }); root.style.overflow = ''; lenis && lenis.start(); setTimeout(heroIn, 250); };
      setTimeout(() => done(), 1600); setTimeout(() => { if (!fin) { fin = true; run = false; intro.classList.add('gone'); intro.setAttribute('aria-hidden', 'true'); root.style.overflow = ''; lenis && lenis.start(); } }, 4500);
      $('.intro-skip').addEventListener('click', e => { e.stopPropagation(); if (!mainPopped) { mainPopped = true; pop(main); reveal(); } setTimeout(done, 350); });
    }
  } else heroIn();

  /* ---------- Hero: Höhenmesser aus dem Video ---------- */
  const hv = $('.hero-v'), altEl = $('[data-alt]');
  if (hv && altEl) { const upd = () => { const d = hv.duration || 35.9, p = (hv.currentTime % d) / d, a = p < .5 ? 42 - (p / .5) * 39 : 3 + ((p - .5) / .5) * 39; altEl.textContent = Math.max(2, Math.round(a)); }; hv.addEventListener('timeupdate', upd); }
  if (hv) { const tryPlay = () => { const p = hv.play(); p && p.catch(() => {}); }; hv.addEventListener('canplay', tryPlay, { once: true }); tryPlay(); }

  /* =====================================================================
     BEFUND: Abzieher über das Bild ziehen
     ===================================================================== */
  const bfs = $$('[data-bf]'); const sum = $('[data-bf-sum]');
  let bfLast = 0; const bfSlot = () => { const n = performance.now(), t = Math.max(n + 450, bfLast + 700); bfLast = t; return t - n; }; // v6: Impulse nacheinander wie eine Welle
  const countDone = () => { if (!sum) return; const n = bfs.filter(b => b.classList.contains('done')).length; sum.textContent = n === bfs.length ? 'Alles sauber. So fährt es vom Hof.' : `${n} von ${bfs.length} Stellen sauber`; sum.classList.toggle('ok', n === bfs.length); };
  bfs.forEach((bf, idx) => {
    const st = $('.bf-stage', bf), inp = $('input', st), cv = $('.bf-wet', st), ctx = cv.getContext('2d');
    let x = 0, W = 0, H = 0, drips = [], vis = false, lastX = 0;
    const size = () => { const d = DPR(); W = cv.width = st.clientWidth * d; H = cv.height = st.clientHeight * d; };
    size(); new ResizeObserver(size).observe(st);
    const knob = $('.bf-blade i', st);
    const set = v => { v = Math.max(0, Math.min(100, v)); const dx = v - x; x = v; st.style.setProperty('--x', v + '%'); { const w = st.clientWidth, kw = (knob && knob.offsetWidth) || 52, px = v / 100 * w, h = kw / 2 + 6; st.style.setProperty('--ko', (Math.max(h, Math.min(w - h, px)) - px - kw / 2) + 'px'); } inp.value = Math.round(v); bf.classList.toggle('part', v > 4); const was = bf.classList.contains('done'); bf.classList.toggle('done', v > 95); if (was !== bf.classList.contains('done')) countDone();
      if (Math.abs(dx) > .4 && Math.random() < .55) drips.push({ x: v / 100 * W - Math.sign(dx) * (4 + Math.random() * 10) * DPR(), y: Math.random() * H, l: 0, v: (30 + Math.random() * 80), w: (1 + Math.random() * 1.8) * DPR(), a: .8 }); };
    set(0); new ResizeObserver(() => set(x)).observe(st);
    // v6: erste echte Berührung beendet Impuls + Hinweis dieser Karte
    let touched = false, tw = null;
    const touch = () => { tw && tw.kill(); tw = null; if (touched) return; touched = true; bf.classList.add('touched'); };
    inp.addEventListener('input', () => { touch(); set(+inp.value); });
    let down = false, sx = 0, sy = 0, dragging = false;
    st.addEventListener('pointerdown', e => { touch(); down = true; dragging = false; sx = e.clientX; sy = e.clientY; if (e.pointerType === 'mouse') { dragging = true; st.setPointerCapture(e.pointerId); move(e); } });
    const move = e => { const r = st.getBoundingClientRect(); set((e.clientX - r.left) / r.width * 100); };
    st.addEventListener('pointermove', e => { if (!down) return; if (!dragging) { if (Math.abs(e.clientX - sx) > 6 && Math.abs(e.clientX - sx) > Math.abs(e.clientY - sy)) { dragging = true; try { st.setPointerCapture(e.pointerId); } catch (_) {} } else return; } move(e); });
    // 31.10.: Vorher- und Nachher-Foto zeigen nicht exakt denselben Ausschnitt – nach dem Loslassen fährt der Abzieher deshalb ganz durch oder ganz zurück, statt halb stehen zu bleiben
    const up = () => { const was = dragging; down = false; dragging = false; if (was && x > 0 && x < 100) animTo(x >= 50 ? 100 : 0, .55); };
    st.addEventListener('pointerup', up); st.addEventListener('pointercancel', up);
    st.addEventListener('click', e => { if (Math.abs(e.clientX - sx) < 4 && x < 5) { animTo(100); } });
    const animTo = (to, dur = 1.6) => { if (!hasG) return set(to); tw && tw.kill(); const o = { v: x }; tw = gsap.to(o, { v: to, duration: dur, ease: 'power2.inOut', onUpdate: () => set(o.v), onComplete: () => tw = null }); };
    bf._anim = (to, dur) => { touch(); animTo(to, dur); };
    // nasse Spur hinter dem Abzieher
    visTrack(st, v => vis = v);
    (function loop(now) { requestAnimationFrame(loop); if (!vis || !drips.length) { if (drips.length === 0 && lastX !== -1) { ctx.clearRect(0, 0, W, H); lastX = -1; } return; } lastX = 0; ctx.clearRect(0, 0, W, H);
      for (const d of drips) { d.l = Math.min(d.l + d.v * .016 * DPR(), 34 * DPR()); d.y += d.v * .006; d.a -= .016; if (d.a <= 0) continue; const g = ctx.createLinearGradient(0, d.y - d.l, 0, d.y); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, `rgba(235,250,252,${.4 * d.a})`); ctx.strokeStyle = g; ctx.lineWidth = d.w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(d.x, d.y - d.l); ctx.lineTo(d.x, d.y); ctx.stroke(); ctx.fillStyle = `rgba(255,255,255,${.7 * d.a})`; ctx.beginPath(); ctx.arc(d.x, d.y, d.w * 1.2, 0, 7); ctx.fill(); }
      drips = drips.filter(d => d.a > 0).slice(-160); })();
    // v6: Impuls für JEDE Karte beim ersten Sichtkontakt (Abzieher fährt ein Stück und zurück), Paare leicht versetzt
    onView(st, () => setTimeout(() => { if (touched || x > 2 || !hasG || reduce) return; const o = { v: 0 }; tw = gsap.timeline({ onComplete: () => tw = null }).to(o, { v: 92, duration: 1.5, ease: 'power2.inOut', onUpdate: () => set(o.v) }).to(o, { v: 0, duration: 1.1, ease: 'power2.inOut', onUpdate: () => set(o.v) }, '+=1.1'); }, bfSlot()), '-22%');
  });
  const all = $('[data-bf-all]'); if (all) all.addEventListener('click', () => bfs.forEach((b, i) => setTimeout(() => b._anim(100, 1.2), i * 180)));
  countDone();

  /* ---------- Glanz: Licht folgt Maus / Scroll ---------- */
  const gl = $('.gloss');
  if (gl) { const light = $('.gloss-light', gl);
    if (fine) gl.addEventListener('pointermove', e => { const r = gl.getBoundingClientRect(); light.style.setProperty('--lx', (e.clientX - r.left) + 'px'); light.style.setProperty('--ly', (e.clientY - r.top) + 'px'); });
    if (hasG) gsap.fromTo('.gloss-v', { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: gl, start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  /* =====================================================================
     Schritt 1 – Polieren: echte Haube, Finger wischt die Wirbelkratzer weg (04.11.2026)
     ===================================================================== */
  const pol = $('[data-polish]');
  if (pol && window.FEWisch) {
    const gl = $('[data-gloss]'), gb = $('[data-gloss-bar]'); let used = false;
    const W = FEWisch(pol, { art: 'politur', onTouch: () => { used = true; pol.classList.add('touched'); },
      onProgress: p => { const v = Math.round(12 + p * 88); if (gl) gl.textContent = v + ' %'; if (gb) gb.style.transform = `scaleX(${v / 100})`; } });
    W.setBefore(pol.dataset.before);
    const rs = $('[data-polish-reset]'); if (rs) rs.addEventListener('click', () => { used = true; W.reset(); });
    onView(pol, () => { if (!reduce) setTimeout(() => { if (!used) W.demo(); }, 600); }, '0px');
  }

  /* =====================================================================
     Schritt 2 – Versiegeln: links ohne, rechts Keramik (helle Tropfen), Trennlinie ziehen
     ===================================================================== */
  const rain = $('[data-rain]');
  if (rain) {
    const mi = $('.cer-m', rain), ln = $('.cer-line', rain), seal = $('[data-seal]'); let pos = 50, user = false, dr = false, anim = 0;
    const set = v => { pos = Math.max(0, Math.min(100, v)); mi.style.clipPath = `inset(0 0 0 ${pos}%)`; ln.style.left = pos + '%'; if (seal) seal.value = 100 - pos; };
    const fromX = x => { const r = rain.getBoundingClientRect(); return (x - r.left) / r.width * 100; };
    const stop = () => { user = true; cancelAnimationFrame(anim); rain.classList.add('touched'); };
    rain.addEventListener('pointerdown', e => { if (e.button > 0) return; stop(); dr = true; rain.setPointerCapture(e.pointerId); set(fromX(e.clientX)); });
    rain.addEventListener('pointermove', e => { if (dr) set(fromX(e.clientX)); });
    const up = () => { dr = false; }; rain.addEventListener('pointerup', up); rain.addEventListener('pointercancel', up);
    if (seal) seal.addEventListener('input', () => { stop(); set(100 - +seal.value); });
    set(50);
    // Selbst-Impuls: Linie wandert einmal hin und her, damit man sieht, was passiert
    onView(rain, () => { if (reduce) return; const t0 = performance.now(), D = 2600;
      const st = now => { if (user) return; const q = Math.min(1, (now - t0) / D); set(50 + Math.sin(q * Math.PI * 2) * 28 * (1 - q * .3)); if (q < 1) anim = requestAnimationFrame(st); else set(50); };
      setTimeout(() => { if (!user) anim = requestAnimationFrame(st); }, 500); }, '0px');
  }

  /* =====================================================================
     OZON
     ===================================================================== */
  const oz = $('[data-ozone-stage]');
  if (oz) {
    const cv = $('canvas', oz), ctx = cv.getContext('2d'), btn = $('[data-ozone]'), st = $('[data-oz-state]');
    let W, H, dpr = DPR(), hold = false, vis = false, mol = [];
    const size = () => { dpr = DPR(); W = cv.width = Math.max(10, oz.clientWidth * dpr); H = cv.height = Math.max(10, oz.clientHeight * dpr); }; size(); new ResizeObserver(size).observe(oz);
    visTrack(oz, v => vis = v);
    const mk = () => [['Rauch', .25, .35, '170,160,140'], ['Hund', .72, .3, '150,130,90'], ['Essen', .32, .72, '170,140,80'], ['Feuchtigkeit', .7, .7, '110,140,110']].map(([n, x, y, c]) => ({ n, x, y, c, a: 1, p: Math.random() * 6 }));
    let clouds = mk();
    const lab = $('[data-oz-l]', btn) || btn;
    const setState = () => { const left = clouds.filter(c => c.a > .05).length; st.textContent = left ? `${left} ${left === 1 ? 'Geruch' : 'Gerüche'} im Innenraum` : 'Neutralisiert. Danach wird gründlich gelüftet.'; oz.classList.toggle('clean', !left); lab.textContent = left ? 'Ozon gedrückt halten' : 'Nochmal von vorn'; };
    // v6: Impuls – beim ersten Sichtkontakt strömt kurz Ozon von selbst (Wolken werden dünner, keine verschwindet); Knopf pulsiert bis zum ersten Drücken
    let ozDemo = false;
    const on = e => { e.preventDefault(); ozDemo = false; btn.classList.add('tried'); if (!clouds.some(c => c.a > .05)) { clouds = mk(); setState(); return; } hold = true; btn.classList.add('hold'); };
    const off = () => { hold = false; ozDemo = false; btn.classList.remove('hold'); };
    onView(oz, () => setTimeout(() => { if (btn.classList.contains('tried') || reduce) return; ozDemo = true; hold = true; btn.classList.add('hold'); setTimeout(() => { if (ozDemo) off(); }, 1800); }, 650), '-28%');
    btn.addEventListener('pointerdown', on); addEventListener('pointerup', off); btn.addEventListener('pointerleave', off); btn.addEventListener('pointercancel', off); btn.addEventListener('contextmenu', e => e.preventDefault());
    btn.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!e.repeat) on(e); } }); btn.addEventListener('keyup', off);
    let tick = 0;
    (function loop(t) { requestAnimationFrame(loop); if (!vis) return; ctx.clearRect(0, 0, W, H);
      if (hold) for (let i = 0; i < 3; i++) mol.push({ x: W * (.45 + Math.random() * .1), y: H * .98, vx: (Math.random() - .5) * 6 * dpr, vy: -(3 + Math.random() * 4) * dpr, r: (4 + Math.random() * 3) * dpr, a: 6.28 * Math.random(), l: 1, demo: ozDemo });
      for (const c of clouds) { if (c.a <= .02) continue; const cx = c.x * W + Math.sin(t / 1300 + c.p) * 14 * dpr, cy = c.y * H + Math.cos(t / 1700 + c.p) * 10 * dpr;
        for (let k = 0; k < 5; k++) { const r = (56 + k * 12) * dpr * (.6 + c.a * .4), ox = Math.sin(c.p + k * 1.7) * 30 * dpr, oy = Math.cos(c.p + k) * 18 * dpr; const g = ctx.createRadialGradient(cx + ox, cy + oy, 0, cx + ox, cy + oy, r); g.addColorStop(0, `rgba(${c.c},${.4 * c.a})`); g.addColorStop(1, `rgba(${c.c},0)`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx + ox, cy + oy, r, 0, 7); ctx.fill(); }
        ctx.globalAlpha = c.a; ctx.fillStyle = '#fff'; ctx.font = `700 ${14 * dpr}px Figtree,sans-serif`; ctx.textAlign = 'center'; ctx.fillText(c.n, cx, cy); ctx.globalAlpha = 1; c.cx = cx; c.cy = cy; }
      for (const m of mol) { m.x += m.vx; m.y += m.vy; m.vx += (Math.random() - .5) * .6 * dpr; m.vy *= .995; m.a += .05; m.l -= .004;
        for (const c of clouds) if (c.a > .02 && c.cx && Math.hypot(m.x - c.cx, m.y - c.cy) < 80 * dpr) { c.a = Math.max(m.demo ? Math.min(c.a, .55) : 0, c.a - .006); m.l -= .02; }
        ctx.globalAlpha = Math.max(0, m.l); ctx.fillStyle = '#9ff0f2';
        for (let k = 0; k < 3; k++) { const a = m.a + k * 2.09; ctx.beginPath(); ctx.arc(m.x + Math.cos(a) * m.r, m.y + Math.sin(a) * m.r, m.r * .55, 0, 7); ctx.fill(); }
        ctx.globalAlpha = 1; }
      mol = mol.filter(m => m.l > 0 && m.y > -20).slice(-500);
      if (hold || ++tick % 30 === 0) setState();
    })();
    setState();
  }

  /* =====================================================================
     FPV: scroll-gesteuerte Bildsequenz (4K-Quelle)
     ===================================================================== */
  const fpv = $('.fpv');
  if (fpv) {
    const cv = $('.fpv-cv'), ctx = cv.getContext('2d'), N = 190;
    let dir = portrait() ? 'm' : 'd';
    const src = i => `seq/${dir}/f${String(i + 1).padStart(3, '0')}.webp`;
    let frames = new Array(N), cur = 0, shown = -1, started = false;
    const load = i => { if (frames[i]) return; const im = new Image(); im.decoding = 'async'; im.src = src(i); frames[i] = im; im.onload = () => { if (Math.abs(i - cur) < 4) draw(cur, true); }; };
    const order = []; for (const s of [6, 3, 1]) for (let i = 0; i < N; i += s) if (!order.includes(i)) order.push(i);
    let oi = 0; const pump = () => { for (let k = 0; k < 5 && oi < order.length; k++, oi++) load(order[oi]); if (oi < order.length) setTimeout(pump, 70); };
    const start = () => { if (started) return; started = true; load(0); pump(); };
    onView(fpv, start, '1400px');
    let lw = 0, lh = 0;
    const size = () => { const d = Math.min(DPR(), 2), w = Math.round(cv.clientWidth * d), h = Math.round(cv.clientHeight * d); if (w === lw && Math.abs(h - lh) < 160 * d && lw) return; lw = w; lh = h; cv.width = w; cv.height = h; const nd = portrait() ? 'm' : 'd'; if (nd !== dir && started) { dir = nd; frames = new Array(N); oi = 0; load(cur); pump(); } draw(cur, true); };
    const nearest = i => { for (let k = 0; k < N; k++) for (const j of [i - k, i + k]) if (j >= 0 && j < N && frames[j] && frames[j].complete && frames[j].naturalWidth) return frames[j]; return null; };
    function draw(i, force) { if (!force && i === shown) return; const im = nearest(i); if (!im) return; shown = i; const W = cv.width, H = cv.height, s = Math.max(W / im.naturalWidth, H / im.naturalHeight), w = im.naturalWidth * s, h = im.naturalHeight * s; ctx.drawImage(im, (W - w) / 2, (H - h) / 2, w, h); }
    addEventListener('resize', size); size();
    const alt = $('[data-falt]'), hb = $('.fpv .hud-bar i'), fcs = $$('.fc', fpv);
    const vis = [[0, .22], [.32, .58], [.74, 1.02]];
    const phase = p => {
      fcs.forEach((f, i) => { const [a, b] = vis[i]; const o = p < a - .05 || p > b + .05 ? 0 : Math.min(1, (p - a + .05) / .06, (b + .05 - p) / .06); f.style.opacity = i === 0 && p < .04 ? 1 : Math.max(0, o); f.style.transform = `translateY(${(1 - Math.max(0, o)) * 30}px)`; });
      alt.textContent = Math.max(1, Math.round(p < .6 ? 12 - p * 10 : 6 - (p - .6) * 12)); hb.style.transform = `scaleX(${p})`;
    };
    let tgt = 0, fpos = 0, raf = 0;
    const tick = () => { raf = 0; fpos += (tgt - fpos) * .22; if (Math.abs(tgt - fpos) < .05) fpos = tgt; cur = Math.round(fpos); draw(cur); if (fpos !== tgt) raf = requestAnimationFrame(tick); };
    const onP = p => { tgt = Math.min(N - 1, Math.max(0, p * (N - 1))); if (!raf) raf = requestAnimationFrame(tick); phase(p); };
    if (hasG) ScrollTrigger.create({ trigger: fpv, start: 'top top', end: 'bottom bottom', scrub: true, onUpdate: s => onP(s.progress) });
    addEventListener('scroll', () => { const r = fpv.getBoundingClientRect(); const p = Math.min(1, Math.max(0, -r.top / (fpv.offsetHeight - innerHeight))); if (!hasG) onP(p); }, { passive: true });
    phase(0);
    // v6: „Flug abspielen“ – fliegt die Strecke von selbst (für alle, die nicht scrollen mögen); jede eigene Bewegung übernimmt sofort
    const pb = $('[data-fpv-play]');
    if (pb) { const pl = $('span', pb); let flying = false, fr = 0;
      const jump = y => lenis ? lenis.scrollTo(y, { immediate: true, force: true }) : window.scrollTo(0, y);
      const evs = ['wheel', 'touchstart', 'keydown'];
      const stopFly = (txt) => { if (!flying) return; flying = false; cancelAnimationFrame(fr); pb.classList.remove('on'); pl.textContent = txt || 'Weiter fliegen'; pb.setAttribute('aria-label', 'Drohnenflug weiter abspielen'); evs.forEach(ev => removeEventListener(ev, onUser)); };
      const onUser = e => { if (e.type !== 'wheel' && e.target && e.target.closest && e.target.closest('[data-fpv-play]')) return; /* Tippen/Taste auf dem Knopf selbst schaltet über click */ stopFly(); };
      pb.addEventListener('click', () => {
        if (flying) return stopFly();
        pb.classList.add('used');
        const top = fpv.getBoundingClientRect().top + scrollY, end = top + fpv.offsetHeight - innerHeight;
        let y0 = scrollY; if (y0 >= end - 6 || y0 < top - 2) { y0 = top; jump(top); }
        const D = Math.max(1800, (end - y0) / Math.max(1, end - top) * 16000), t0 = performance.now();
        flying = true; pb.classList.add('on'); pl.textContent = 'Anhalten'; pb.setAttribute('aria-label', 'Drohnenflug anhalten');
        const st = now => { if (!flying) return; const p = Math.min(1, (now - t0) / D), e = p * p * (3 - 2 * p) * .35 + p * .65;
          jump(y0 + (end - y0) * e); if (p < 1) fr = requestAnimationFrame(st); else stopFly('Nochmal fliegen'); };
        fr = requestAnimationFrame(st);
        setTimeout(() => { if (flying) evs.forEach(ev => addEventListener(ev, onUser, { passive: true })); }, 60);
      });
    }
  }

  /* ---------- Reveals ---------- */
  if (hasG && !reduce) {
    $$('.ch-head, .stn, .rv, .w, .p, .kc, .st-list li, .sv, .ali, .bf').forEach(el => { gsap.from(el, { y: 40, opacity: 0, duration: 1.05, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } }); });
    $$('.h2').forEach(h => { if (h.closest('.fc')) return; gsap.from(h, { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: h, start: 'top 90%', once: true } }); });
  }

  /* ---------- Glanz-Galerie: Lichtreflex beim Erscheinen ---------- */
  $$('.sh').forEach((f, i) => { onView(f, () => setTimeout(() => f.classList.add('lit'), 200 + i * 140), '-10%');
    const mv = e => { const r = f.getBoundingClientRect(); f.style.setProperty('--mx', (e.clientX - r.left) + 'px'); f.style.setProperty('--my', (e.clientY - r.top) + 'px'); f.classList.add('lamp'); };
    f.addEventListener('pointermove', mv); f.addEventListener('pointerdown', mv); f.addEventListener('pointerleave', () => f.classList.remove('lamp')); f.addEventListener('pointercancel', () => f.classList.remove('lamp')); });
  // v6: Leistungen – Licht folgt Maus/Finger auch auf den Leistungsbildern
  $$('.sv-media').forEach(f => { const mv = e => { const r = f.getBoundingClientRect(); f.style.setProperty('--mx', (e.clientX - r.left) + 'px'); f.style.setProperty('--my', (e.clientY - r.top) + 'px'); f.classList.add('lamp'); };
    f.addEventListener('pointermove', mv); f.addEventListener('pointerdown', mv); ['pointerleave', 'pointercancel'].forEach(ev => f.addEventListener(ev, () => f.classList.remove('lamp'))); });

  /* ---------- v6: Glanz-Galerie als Wisch-Leiste auf dem Handy (Zähler, Punkte, Impuls) ---------- */
  const shg = $('[data-shine]');
  if (shg) { const items = $$('.sh', shg), dots = $('[data-sh-dots]'), num = $('[data-sh-n]'), sh_h = $('.sh-hint');
    const strip = () => getComputedStyle(shg).display === 'flex';
    if (dots) { dots.innerHTML = items.map((_, i) => `<i data-i="${i}"></i>`).join(''); dots.addEventListener('click', e => { const d = e.target.closest('[data-i]'); if (!d) return; shTouch(); const it = items[+d.dataset.i]; shg.scrollTo({ left: it.offsetLeft - items[0].offsetLeft, behavior: 'smooth' }); }); }
    const di = dots ? $$('i', dots) : [];
    let shTouched = false;
    const shTouch = () => { if (shTouched) return; shTouched = true; sh_h && sh_h.classList.add('gone'); };
    const cur = () => { const L = shg.scrollLeft; let best = 0, bd = 1e9; items.forEach((it, i) => { const d = Math.abs(it.offsetLeft - items[0].offsetLeft - L); if (d < bd) { bd = d; best = i; } }); return best; };
    const upd = () => { const i = cur(); if (num) num.textContent = `${i + 1} / ${items.length}`; di.forEach((d, k) => d.classList.toggle('on', k === i)); };
    let rq = 0; shg.addEventListener('scroll', () => { if (!rq) rq = requestAnimationFrame(() => { rq = 0; upd(); }); }, { passive: true }); upd();
    ['pointerdown', 'touchstart', 'wheel'].forEach(ev => shg.addEventListener(ev, shTouch, { passive: true }));
    onView(shg, () => setTimeout(() => { if (!strip() || reduce || shTouched) return; const w = items[0].offsetWidth; shg.scrollTo({ left: w * .6, behavior: 'smooth' }); setTimeout(() => { if (!shTouched) shg.scrollTo({ left: 0, behavior: 'smooth' }); }, 1250); }, 450), '-25%');
  }

  /* ---------- Start: Hero-Karte – echte Fahrzeugfotos wechseln sich ab ---------- */
  const havPh = $('[data-hav-ph]');
  if (havPh && !reduce) { const ims = $$('img', havPh); if (ims.length > 1) { let k = 0; setInterval(() => { if (document.hidden) return; ims[k].classList.remove('on'); k = (k + 1) % ims.length; ims[k].classList.add('on'); }, 2800); } }

  /* ---------- Start: Hof-Leiste mit echten Fahrzeugen – Auffahren, Glanz, Impuls, Ziehen, Punkte, Pfeile, 3D-Neigung ---------- */
  const hs = $('[data-hs]');
  if (hs) {
    const sec = hs.closest('.hofs'), items = $$('[data-hs-item]', hs), cars = $$('.hs-car', hs);
    const dots = $('[data-hs-dots]', sec), hint = $('.hs-hint', sec), prev = $('[data-hs-prev]', sec), next = $('[data-hs-next]', sec);
    let touched = false, dragEnd = 0;
    if (hint && fine) $('b', hint).textContent = '← ziehen →';
    const touch = () => { if (touched) return; touched = true; hint && hint.classList.add('gone'); };
    const x0 = () => items[0].offsetLeft, maxL = () => hs.scrollWidth - hs.clientWidth;
    const cur = () => { const L = hs.scrollLeft, m = maxL(); if (m > 0 && L >= m - 4) return items.length - 1; let best = 0, bd = 1e9; items.forEach((it, i) => { const d = Math.abs(Math.min(m, it.offsetLeft - x0()) - L); if (d < bd) { bd = d; best = i; } }); return best; };
    const goL = L => hs.scrollTo({ left: Math.max(0, Math.min(maxL(), L)), behavior: reduce ? 'auto' : 'smooth' });
    const go = i => { i = Math.max(0, Math.min(items.length - 1, i)); goL(items[i].offsetLeft - x0()); };
    const step = () => items.length > 1 ? items[1].offsetLeft - items[0].offsetLeft : hs.clientWidth;
    const by = dir => { const s = step(); goL(Math.round((hs.scrollLeft + dir * s) / s) * s); };
    if (dots) { dots.innerHTML = items.map((_, i) => `<i data-i="${i}"></i>`).join(''); dots.addEventListener('click', e => { const d = e.target.closest('[data-i]'); if (d) { touch(); go(+d.dataset.i); } }); }
    const di = dots ? $$('i', dots) : [];
    const upd = () => { const i = cur(), L = hs.scrollLeft, m = maxL(); di.forEach((d, k) => d.classList.toggle('on', k === i)); if (prev) prev.disabled = L < 4; if (next) next.disabled = L > m - 4; };
    let rq = 0; hs.addEventListener('scroll', () => { if (!rq) rq = requestAnimationFrame(() => { rq = 0; upd(); }); }, { passive: true }); upd(); addEventListener('resize', upd);
    prev && prev.addEventListener('click', () => { touch(); by(-1); });
    next && next.addEventListener('click', () => { touch(); by(1); });
    ['touchstart', 'keydown', 'focusin'].forEach(ev => hs.addEventListener(ev, touch, { passive: true }));
    // Trackpad/Shift+Rad seitwärts: nativ in der Leiste scrollen (nicht an das weiche Seiten-Scrollen weitergeben)
    hs.addEventListener('wheel', e => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { e.stopPropagation(); touch(); } }, { passive: true });
    // Maus: Leiste mit gedrückter Taste ziehen (Finger scrollen nativ); nach dem Ziehen keinen Klick auslösen
    let drag = null;
    hs.addEventListener('dragstart', e => e.preventDefault());
    hs.addEventListener('pointerdown', e => { touch(); if (e.pointerType !== 'mouse' || e.button !== 0) return; drag = { x: e.clientX, L: hs.scrollLeft, moved: false }; });
    addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.x; if (!drag.moved && Math.abs(dx) > 6) { drag.moved = true; hs.classList.add('drag', 'free'); } if (drag.moved) hs.scrollLeft = drag.L - dx; });
    const endDrag = () => { if (!drag) return; const moved = drag.moved; drag = null; if (!moved) return; dragEnd = performance.now(); hs.classList.remove('drag'); const i = cur(); hs.classList.remove('free'); go(i); };
    addEventListener('pointerup', endDrag); addEventListener('pointercancel', endDrag);
    hs.addEventListener('click', e => { if (performance.now() - dragEnd < 350) { e.preventDefault(); e.stopPropagation(); } }, true);
    // Glanz läuft einmal über jedes Foto
    const shineAll = () => cars.forEach((c, i) => setTimeout(() => c.classList.add('shine'), reduce ? 0 : 160 * i));
    // Auffahren: die Autos rollen nacheinander von rechts ein
    let played = false;
    const play = () => { if (played) return; played = true;
      if (hasG && !reduce) gsap.fromTo(items, { opacity: 0, x: 110, rotationY: -24, transformPerspective: 900 }, { opacity: 1, x: 0, rotationY: 0, duration: 1.15, ease: 'power3.out', stagger: .09, clearProps: 'opacity,transform', onComplete: shineAll });
      else shineAll(); };
    if (hasG && !reduce) gsap.set(items, { opacity: 0 });
    onView(hs, play, '0px 0px -12% 0px');
    // Impuls: die Leiste fährt beim ersten Sichtkontakt ein Stück nach links und zurück
    onView(hs, () => setTimeout(() => { if (reduce || touched || maxL() < 10) return; hs.classList.add('free'); hs.scrollTo({ left: Math.min(maxL(), items[0].offsetWidth * .62), behavior: 'smooth' });
      setTimeout(() => { if (!touched) hs.scrollTo({ left: 0, behavior: 'smooth' }); setTimeout(() => hs.classList.remove('free'), 750); }, 1350); }, 1900), '-22%');
    // 3D-Neigung und Lichtfleck folgen der Maus
    if (fine && !reduce) cars.forEach(c => {
      c.addEventListener('pointermove', e => { if (drag && drag.moved) return; const r = c.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        c.style.setProperty('--ry', ((px - .5) * 9).toFixed(2) + 'deg'); c.style.setProperty('--rx', ((.5 - py) * 7).toFixed(2) + 'deg');
        c.style.setProperty('--mx', (px * 100).toFixed(1) + '%'); c.style.setProperty('--my', (py * 100).toFixed(1) + '%'); });
      c.addEventListener('pointerleave', () => { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
    });
  }

  /* ---------- Start: Bewertungen – Sterne füllen sich beim Sichtkontakt ---------- */
  if (!reduce) $$('[data-hs-rev]').forEach(r => { r.classList.add('pre'); onView(r, () => { r.classList.remove('pre'); r.classList.add('in'); }, '0px 0px -15% 0px'); });

  /* ---------- Paket ---------- */
  const veh = $('[data-veh]');
  if (veh) {
    const mods = $('[data-mods]'), tv = $('[data-tk-veh]'), tl = $('[data-tk-list]'), no = $('[data-tk-no]'), tk = $('.ticket');
    let v = 'Kleinwagen';
    const roof = $('[data-m^="Dach"]', mods);
    let prev = []; const render = () => { tv.textContent = v; const on = $$('button.on', mods).map(b => b.textContent); tl.innerHTML = on.length ? on.map(m => `<li${prev.length && !prev.includes(m) ? ' class="new"' : ''}>${m}</li>`).join('') : '<li style="opacity:.5">Noch nichts gewählt</li>'; if (prev.length || on.length) { tk.classList.remove('bump'); void tk.offsetWidth; tk.classList.add('bump'); } prev = on.length ? on : ['—']; no.textContent = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }); tk.classList.remove('stamped'); void tk.offsetWidth; if (on.length >= 2) tk.classList.add('stamped'); };
    const twa = $('[data-tk-wa]'); const setWa = () => { const txt = `Hallo Z&H, hier meine Anfrage von der Website:\nFahrzeug: ${v}\nLeistungen: ${$$('button.on', mods).map(b => b.textContent).join(', ') || 'bitte beraten Sie mich'}\nWann hätten Sie Zeit? Fotos schicke ich gern mit.`; twa.href = 'https://wa.me/4917624401827?text=' + encodeURIComponent(txt); };
    const pick = b => { $$('button', veh).forEach(x => x.classList.toggle('on', x === b)); v = b.dataset.v; const wm = /Wohn/.test(v); roof.style.display = wm ? '' : 'none'; if (!wm) roof.classList.remove('on'); render(); setWa(); };
    const tog = b => { b.classList.toggle('on'); render(); setWa(); };
    $$('button', veh).forEach(b => b.addEventListener('click', () => pick(b)));
    $$('button', mods).forEach(b => b.addEventListener('click', () => tog(b)));
    roof.style.display = 'none';
    setWa(); render();
    /* v6: Impuls – ein „Finger“ tippt beim ersten Sichtkontakt einmal durch (SUV, Politur, Wohnmobil …) und stellt danach
       exakt den Ausgangszustand wieder her. Jede echte Berührung bricht sofort ab und setzt vorher zurück. */
    const pkBox = veh.parentElement, pkAll = veh.closest('.pk-g') || pkBox, ghost = $('.ghost', pkBox), tapH = $('[data-tap-hint]');
    if (ghost) { let pkDemo = false, pkTouched = false, tms = [];
      const defaults = () => { $$('button', mods).forEach(b => b.classList.toggle('on', b.dataset.m === 'Keramikversiegelung')); pick($('[data-v="Kleinwagen"]', veh)); };
      const stopPk = () => { if (!pkDemo) return; pkDemo = false; tms.forEach(clearTimeout); tms = []; ghost.classList.remove('on', 'tap'); defaults(); };
      const real = e => { if (e.type === 'pointerdown' && !(e.target.closest && e.target.closest('button,a'))) return; /* reines Weiterscrollen bricht nicht ab */ pkTouched = true; tapH && tapH.classList.add('gone'); stopPk(); };
      pkAll.addEventListener('pointerdown', real, true); pkAll.addEventListener('keydown', real, true);
      const moveTo = b => { const r = b.getBoundingClientRect(), R = pkBox.getBoundingClientRect(); ghost.style.transform = `translate(${Math.round(r.left - R.left + r.width * .55 - 21)}px,${Math.round(r.top - R.top + r.height * .55 - 6)}px)`; };
      const seq = [['v', 'SUV'], ['m', 'Politur'], ['v', 'Wohnmobil'], ['v', 'Kleinwagen'], ['m', 'Politur']];
      const runPk = () => { if (pkTouched || pkDemo || reduce) return; pkDemo = true; ghost.classList.add('on'); let t = 150;
        seq.forEach(([k, val]) => { const b = k === 'v' ? $(`[data-v="${val}"]`, veh) : $(`[data-m="${val}"]`, mods); tms.push(setTimeout(() => moveTo(b), t)); t += 620;
          tms.push(setTimeout(() => { ghost.classList.remove('tap'); void ghost.offsetWidth; ghost.classList.add('tap'); k === 'v' ? pick(b) : tog(b); }, t)); t += 480; });
        tms.push(setTimeout(() => { ghost.classList.remove('on', 'tap'); pkDemo = false; tms = []; }, t + 250)); };
      onView(veh, () => setTimeout(runPk, 500), '-30%');
    }
  }

  /* ---------- Wetter (Open-Meteo) ---------- */
  const wx = $('[data-wx]');
  if (wx) {
    const ICON = c => c === 0 ? '☀️' : c <= 2 ? '🌤️' : c === 3 ? '☁️' : c <= 48 ? '🌫️' : c <= 67 ? '🌧️' : c <= 77 ? '🌨️' : c <= 82 ? '🌦️' : '⛈️';
    const go = () => fetch('https://api.open-meteo.com/v1/forecast?latitude=49.3196&longitude=7.2845&daily=weathercode,temperature_2m_max,precipitation_sum,precipitation_probability_max&timezone=Europe%2FBerlin&forecast_days=7')
      .then(r => r.json()).then(d => {
        const D = d.daily, days = D.time.map((t, i) => ({ t: new Date(t + 'T12:00'), c: D.weathercode[i], tx: Math.round(D.temperature_2m_max[i]), pr: D.precipitation_sum[i] || 0, pp: D.precipitation_probability_max ? D.precipitation_probability_max[i] : null }));
        const wk = days.filter(x => x.t.getDay() >= 1 && x.t.getDay() <= 5); const best = (wk.length ? wk : days).reduce((a, b) => (b.pr + (b.pp || 0) / 50) < (a.pr + (a.pp || 0) / 50) ? b : a);
        const max = Math.max(5, ...days.map(x => x.pr));
        const tile = x => { const we = x.t.getDay() === 0 || x.t.getDay() === 6, lab = x.t.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }), inner = `<small>${x.t.toLocaleDateString('de-DE', { weekday: 'short' }).replace('.', '')}</small><span class="ic" aria-hidden="true">${ICON(x.c)}</span><b>${x.tx}°</b><span class="pr" title="${x.pr.toFixed(1)} mm"><i style="height:${Math.min(100, x.pr / max * 100)}%"></i></span><span class="mm">${we ? 'geschlossen' : x.pr.toFixed(1) + ' mm'}</span>`; return we ? `<div class="wd off" style="--i:${days.indexOf(x)}" title="${lab}: geschlossen">${inner}</div>` : `<a class="wd${x === best ? ' best' : ''}" style="--i:${days.indexOf(x)}" href="https://wa.me/4917624401827?text=${encodeURIComponent('Hallo Z&H, passt ein Termin oder eine Abholung am ' + lab + '?')}" target="_blank" rel="noopener" aria-label="${lab}: Termin per WhatsApp anfragen">${inner}</a>`; };
        wx.innerHTML = days.map(tile).join('') +
          `<p class="wx-tip">Bester Abholtag: <b>${best.t.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}</b>. Tippen Sie auf einen Tag, um ihn per WhatsApp anzufragen. ${days.some(x => x.pr > 2) ? 'Regen in Sicht? Mit Keramikversiegelung perlt er einfach ab.' : 'Trocken und klar – perfekt für frischen Glanz.'}</p>`;
      onView(wx, () => wx.classList.add('in'), '-12%'); /* v6: Kacheln fahren erst ein, wenn man sie sieht */
      sky(days.slice(0, 3).some(x => x.pr > 1) ? 'rain' : 'sun'); hasG && ScrollTrigger.refresh();
      }).catch(() => { wx.closest('section').style.display = 'none'; hasG && ScrollTrigger.refresh(); });
    // Himmel hinter den Kacheln: Regen, wenn welcher kommt – sonst Sonnenglanz
    const sky = mode => { if (reduce) return; const sec = wx.closest('section'), cv = document.createElement('canvas'); cv.className = 'wx-sky'; cv.setAttribute('aria-hidden', 'true'); sec.prepend(cv); const c = cv.getContext('2d'), d = DPR(); let W, H, vis = false; const fit = () => { W = cv.width = sec.clientWidth * d; H = cv.height = sec.clientHeight * d; }; fit(); addEventListener('resize', fit); visTrack(sec, v => vis = v);
      const P = Array.from({ length: mode === 'rain' ? 140 : 26 }, () => ({ x: Math.random(), y: Math.random(), v: .4 + Math.random() * .8, l: Math.random() }));
      (function loop(t) { requestAnimationFrame(loop); if (!vis) return; c.clearRect(0, 0, W, H);
        if (mode === 'rain') { c.strokeStyle = 'rgba(120,200,230,.35)'; c.lineWidth = 1.2 * d; c.beginPath(); for (const p of P) { p.y += .006 * p.v; if (p.y > 1.05) { p.y = -.05; p.x = Math.random(); } const x = p.x * W - p.y * 40 * d, y = p.y * H; c.moveTo(x, y); c.lineTo(x - 5 * d, y + 18 * d * p.v); } c.stroke(); }
        else { const g = c.createRadialGradient(W * .88, H * .1, 0, W * .88, H * .1, H * .9); g.addColorStop(0, 'rgba(255,214,120,.35)'); g.addColorStop(1, 'rgba(255,214,120,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H); for (const p of P) { p.l += .004 * p.v; const a = Math.sin(p.l * 6.28) * .5 + .5; c.fillStyle = `rgba(255,240,200,${a * .5})`; c.beginPath(); c.arc(p.x * W, p.y * H, (1 + a * 1.6) * d, 0, 7); c.fill(); } } })(); };
    onView(wx, go, '800px');
  }

  /* ---------- Saisonplaner ---------- */
  const pls = $('[data-pl-start]');
  if (pls) {
    const ple = $('[data-pl-end]'), yr = $('[data-pl-year]'), info = $('[data-pl-info]'), plH = $('[data-pl-hint]'), plM = $('[data-pl-mode]'), M = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
    const ML = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    const BELL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22a2.4 2.4 0 0 0 2.4-2.4H9.6A2.4 2.4 0 0 0 12 22zm6.5-6.2V11a6.5 6.5 0 0 0-5-6.3v-.9a1.5 1.5 0 0 0-3 0v.9a6.5 6.5 0 0 0-5 6.3v4.8L3.6 17.7v1h16.8v-1z"/></svg>';
    // v6: jede Erinnerung ist der NÄCHSTE passende Termin ab heute (vorher landete „Einwintern“ ein Jahr zu spät)
    const nextD = (m, d, off) => { const now = new Date(); now.setHours(0, 0, 0, 0); for (let k = -1; k < 3; k++) { const t = new Date(now.getFullYear() + k, m, d); t.setDate(t.getDate() + off); if (t > now) return t; } };
    const calc = () => { const s = +pls.value, e = +ple.value; return { s, e, a: nextD(s, 1, -21), b: nextD(e + 1, 7, 0) }; };
    const fmt = d => d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
    yr.innerHTML = M.map((m, i) => `<button type="button" data-mo="${i}"><span>${m}</span> <small></small></button>`).join('');
    const mb = $$('[data-mo]', yr);
    const draw = () => { const { s, e, a, b } = calc();
      mb.forEach((el, i) => { const tour = s <= e ? i >= s && i <= e : i >= s || i <= e, rem = i === a.getMonth() || i === b.getMonth(), tag = i === s ? 'Start' : i === e ? 'Ende' : '';
        el.className = [tour && 'tour', rem && 'rem', tag && 'tag'].filter(Boolean).join(' '); el.style.setProperty('--k', (i - s + 12) % 12);
        el.querySelector('small').innerHTML = tag || (rem ? BELL : '');
        el.setAttribute('aria-label', M[i] + (tag ? ' ' + tag : '') + ' (' + ML[i] + (i === s ? ', erste Tour' : '') + (i === e ? ', letzte Tour' : '') + (rem ? ', Erinnerung' : '') + ')'); });
      const L = [[a, 'Saison-Aufbereitung vereinbaren'], [b, 'Einwintern']].sort((x, y) => x[0] - y[0]);
      info.textContent = `Nächste Erinnerung: ${fmt(L[0][0])} (${L[0][1]}) · danach: ${fmt(L[1][0])} (${L[1][1]})`; };
    let want = 'start', plT = false;
    const plTouch = () => { if (plT) return; plT = true; plH && plH.classList.add('done'); yr.classList.remove('sweep'); };
    yr.addEventListener('click', ev => { const btn = ev.target.closest('[data-mo]'); if (!btn) return; plTouch(); const i = +btn.dataset.mo;
      if (want === 'start') { pls.value = i; want = 'end'; plM.textContent = `Erste Tour im ${ML[i]}. Jetzt den Monat der letzten Tour antippen.`; }
      else { ple.value = i; want = 'start'; plM.textContent = `Saison ${ML[+pls.value]} bis ${ML[i]} – die Erinnerungen stehen unten.`; }
      draw(); btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop'); });
    pls.addEventListener('change', () => { plTouch(); draw(); }); ple.addEventListener('change', () => { plTouch(); draw(); }); draw();
    // Impuls: die Saison „läuft“ beim ersten Sichtkontakt einmal von Start bis Ende durch, die Glocken klingeln
    onView(yr, () => setTimeout(() => { if (!plT && !reduce) yr.classList.add('sweep'); }, 300), '-22%');
    const f = d => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    $('[data-pl-ics]').addEventListener('click', () => { const { a, b } = calc(); const ev = (d, s, desc) => { const e = new Date(d); e.setDate(e.getDate() + 1); return `BEGIN:VEVENT\r\nUID:${f(d)}-${Math.random().toString(36).slice(2)}@zh-aufbereitung\r\nDTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z\r\nDTSTART;VALUE=DATE:${f(d)}\r\nDTEND;VALUE=DATE:${f(e)}\r\nSUMMARY:${s}\r\nDESCRIPTION:${desc}\\nZ&H Aufbereitung · Ortsstraße 14 · 66459 Kirkel-Altstadt · Tel. 06841 / 890 200\r\nBEGIN:VALARM\r\nTRIGGER:-PT0M\r\nACTION:DISPLAY\r\nDESCRIPTION:${s}\r\nEND:VALARM\r\nEND:VEVENT\r\n`; };
      const ics = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Z&H Aufbereitung//Saisonplaner//DE\r\n${ev(a, 'Wohnmobil: Termin für Saison-Aufbereitung vereinbaren', 'Jetzt bei Z&H anrufen: Außenreinigung, Dach, Keramikversiegelung, Innenraum.')}${ev(b, 'Wohnmobil einwintern: Aufbereitung bei Z&H', 'Vor dem Winter gründlich reinigen und versiegeln lassen.')}END:VCALENDAR\r\n`;
      const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); const l = document.createElement('a'); l.href = url; l.download = 'wohnmobil-saison-zh-aufbereitung.ics'; document.body.appendChild(l); l.click(); setTimeout(() => { URL.revokeObjectURL(url); l.remove(); }, 1000); });
  }

  /* ---------- Entwurf-Hinweis: über dem Footer ausblenden ---------- */
  const cpt = $('.concept'), ftr = $('.ftr');
  if (cpt && ftr) new IntersectionObserver(([e]) => cpt.classList.toggle('off', e.isIntersecting), { rootMargin: '0px 0px -40px 0px' }).observe(ftr);
  // v6: Hinweis schrumpft beim Scrollen auf „Entwurf“ (überdeckt sonst Knöpfe), Hover zeigt den ganzen Text
  if (cpt) { const mini = () => cpt.classList.toggle('mini', scrollY > 260); addEventListener('scroll', mini, { passive: true }); mini(); }

  /* ---------- v6: Leistungs-Leiste – Pfeil, Randverlauf, kurzer Impuls nach rechts ---------- */
  const lw = $('.lnav-w');
  if (lw) { const ln = $('.lnav', lw), more = $('.lnav-more', lw);
    const lst = () => { lw.classList.toggle('scrollable', ln.scrollWidth > ln.clientWidth + 4); lw.classList.toggle('end', ln.scrollLeft + ln.clientWidth >= ln.scrollWidth - 4); lw.classList.toggle('mid', ln.scrollLeft > 4); };
    ln.addEventListener('scroll', lst, { passive: true }); addEventListener('resize', lst); lst();
    more.addEventListener('click', () => ln.scrollBy({ left: Math.max(120, ln.clientWidth * .6), behavior: 'smooth' }));
    let lnT = false; ['pointerdown', 'touchstart', 'wheel'].forEach(ev => ln.addEventListener(ev, () => lnT = true, { passive: true }));
    if (!reduce) setTimeout(() => { if (lnT || !lw.classList.contains('scrollable') || ln.scrollLeft > 4) return; ln.scrollTo({ left: 110, behavior: 'smooth' }); setTimeout(() => { if (!lnT && ln.scrollLeft > 4) ln.scrollTo({ left: 0, behavior: 'smooth' }); }, 1000); }, 1300);
  }

  /* ---------- Leistungen: Schaum-Abzieher ---------- */
  $$('[data-foam]').forEach(m => reduce ? m.classList.add('in') : onView(m, () => setTimeout(() => m.classList.add('in'), 120), '-18%'));

  /* ---------- Wohnmobile: Ablauf am Wohnmobil ---------- */
  const cvb = $('[data-cv]');
  if (cvb) {
    const btns = $$('[data-cv-go]'), st = $('[data-cv-state]'), re = $('[data-cv-re]');
    const TXT = ['So kommt es an: Laufstreifen, Grünbelag, Grauschleier.', 'Dach & Rinnen: Laufstreifen und Grünbelag sind weg.', 'Wäsche & Politur: Die Außenhaut glänzt wieder.', 'Keramik drauf: Wasser perlt einfach ab.', 'Innenraum frisch – bereit für die nächste Saison.'];
    let step = 0, auto = false, tm = 0; const seen = visTrack(cvb);
    const set = (n, isAuto) => { step = n; cvb.dataset.step = n; cvb.dataset.act = n; for (let i = 1; i <= 4; i++) cvb.classList.toggle('s' + i, i <= n); btns.forEach(b => { const k = +b.dataset.cvGo; b.classList.toggle('on', k === n); b.classList.toggle('done', k < n); b.classList.toggle('auto', !!isAuto && k === n); b.setAttribute('aria-pressed', k === n); }); st.textContent = TXT[n]; };
    const next = () => { if (!auto) return; if (!seen()) { tm = setTimeout(next, 800); return; } const n = step >= 4 ? 0 : step + 1; set(n, n > 0 && n < 4); tm = setTimeout(next, n === 4 ? 4600 : n === 0 ? 1500 : 2800); };
    const play = () => { clearTimeout(tm); auto = true; set(0); tm = setTimeout(next, 1100); };
    btns.forEach(b => b.addEventListener('click', () => { auto = false; clearTimeout(tm); set(+b.dataset.cvGo); }));
    re && re.addEventListener('click', play);
    set(0); if (reduce) set(4); else onView(cvb, play, '-20%');
  }

  /* ---------- Leistungen-Navigation ---------- */
  const lnav = $$('.lnav a');
  if (lnav.length) { const map = new Map(lnav.map(a => [a.getAttribute('href').slice(1), a]));
    const spy = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; const a = map.get(e.target.id); lnav.forEach(x => x.classList.toggle('on', x === a)); if (a) a.parentElement.scrollTo({ left: a.offsetLeft - 20, behavior: 'smooth' }); }), { rootMargin: '-45% 0px -50% 0px' });
    $$('.sv').forEach(s => spy.observe(s));
    lnav.forEach(a => a.addEventListener('click', e => { e.preventDefault(); const t = $(a.getAttribute('href')); lenis ? lenis.scrollTo(t, { offset: -130 }) : t.scrollIntoView({ behavior: 'smooth' }); })); }

  /* ---------- Anker ---------- */
  $$('a[href^="#"]').forEach(a => { if (a.closest('.lnav')) return; a.addEventListener('click', e => { const t = $(a.getAttribute('href')); if (!t) return; e.preventDefault(); lenis ? lenis.scrollTo(t, { offset: -70 }) : t.scrollIntoView({ behavior: 'smooth' }); }); });
  $$('a[href^="index.html#"]').forEach(a => { if (root.dataset.page !== 'home') return; a.addEventListener('click', e => { const t = $(a.getAttribute('href').slice(10)); if (!t) return; e.preventDefault(); lenis ? lenis.scrollTo(t, { offset: -70 }) : t.scrollIntoView({ behavior: 'smooth' }); }); });
  if (location.hash && $(location.hash)) setTimeout(() => lenis ? lenis.scrollTo($(location.hash), { offset: -70, immediate: true }) : null, 500);

  /* ---------- Kontakt: Karte erst nach Klick laden (Zwei-Klick, Datenschutz) ---------- */
  $$('[data-map2k]').forEach(m => { const go = $('[data-map2k-go]', m); if (go) go.addEventListener('click', () => { const f = document.createElement('iframe'); f.title = m.dataset.title.replace('&amp;', '&'); f.src = m.dataset.src; f.loading = 'lazy'; m.replaceChildren(f); m.classList.add('on'); }); });

  /* ---------- Halle: Tore gehen auf ---------- */
  $$('[data-halle]').forEach(h => onView(h, () => setTimeout(() => h.classList.add('open'), 250), '-15%'));

  /* ---------- CTA-Blasen ---------- */
  const cb = $('.cta-bubbles');
  if (cb && !reduce) { const ctx = cb.getContext('2d'); let W, H, vis = false, bs = []; const dpr = DPR();
    const size = () => { W = cb.width = cb.clientWidth * dpr; H = cb.height = cb.clientHeight * dpr; }; size(); addEventListener('resize', size);
    visTrack(cb, v => vis = v);
    (function loop() { requestAnimationFrame(loop); if (!vis) return; if (Math.random() < .3) bs.push({ x: Math.random() * W, y: H + 20, r: (3 + Math.random() * 22) * dpr, v: (.4 + Math.random() * 1.2) * dpr, p: Math.random() * 6 });
      ctx.clearRect(0, 0, W, H); for (const b of bs) { b.y -= b.v; b.p += .02; const x = b.x + Math.sin(b.p) * 8 * dpr; ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.2 * dpr; ctx.beginPath(); ctx.arc(x, b.y, b.r, 0, 7); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.arc(x - b.r * .35, b.y - b.r * .35, b.r * .18, 0, 7); ctx.fill(); }
      bs = bs.filter(b => b.y > -40); })(); }

  if (reduce) $$('svg').forEach(v => v.pauseAnimations && v.pauseAnimations());
  if (hasG) { ScrollTrigger.sort(); ScrollTrigger.refresh(); addEventListener('load', () => ScrollTrigger.refresh()); }
})();
