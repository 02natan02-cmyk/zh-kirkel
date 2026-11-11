/* Z&H Aufbereitung – Leasing-Rückläufer (31.10.2026, Falcon Eye)
   Rückgabeprotokoll mit Stempel · Folie abziehen (Eselsohr, Ziehen, Impuls) · Rückgabe-Check → WhatsApp · Unterseite: Ablauf, Umdreh-Bilder */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DPR = () => Math.min(2, devicePixelRatio || 1);
  const HAND = '<svg class="hand" viewBox="0 0 24 24" aria-hidden="true"><path d="M9.2 11.2V4.6a1.6 1.6 0 0 1 3.2 0v5.2h.4V8.6a1.6 1.6 0 0 1 3.2 0v1.6h.4v-.7a1.6 1.6 0 0 1 3.2 0v5.6c0 3.6-2.8 6.5-6.4 6.5h-1.3a6.3 6.3 0 0 1-4.9-2.3l-3.4-4.2a1.7 1.7 0 0 1 2.5-2.2l1.9 1.8z"/></svg>';
  // sichtbar? (IntersectionObserver + Scroll-Rückfall wie in app.js; frac = Anteil der Fensterhöhe, der das Element schon im Bild sein muss)
  const onView = (el, fn, frac = .22) => { if (!el) return; let done = false;
    const chk = () => { if (done) return; const r = el.getBoundingClientRect(); if (!r.width && !r.height) return; if (r.top < innerHeight * (1 - frac) && r.bottom > innerHeight * frac * .5) { done = true; io.disconnect(); removeEventListener('scroll', chk); fn(); } };
    const io = new IntersectionObserver(chk, { threshold: [0, .1, .25, .5, .75, 1] }); io.observe(el); addEventListener('scroll', chk, { passive: true }); setTimeout(chk, 400); };
  document.documentElement.classList.add('js-ls');

  /* ---------- Kopf: „Nicht mit uns.“ wird gestempelt ---------- */
  $$('.ls-no').forEach(n => onView(n, () => setTimeout(() => n.classList.add('in'), 250), .15));

  /* ---------- Rückgabeprotokoll: Posten erscheinen, Z&H stempelt sie weg, Foto dreht sich ---------- */
  $$('[data-lp]').forEach(lp => {
    const lis = $$('.lp-list li', lp), tot = $('[data-lp-tot]', lp); let tms = [];
    const at = (t, f) => tms.push(setTimeout(f, t));
    const eur = v => v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
    const SUM = tot ? +tot.dataset.sum : 0; let cur = SUM, raf = 0;
    const roll = to => { cancelAnimationFrame(raf); const from = cur, t0 = performance.now(); cur = to;   // Summe zählt nach jedem erledigten Posten herunter
      const f = n => { const k = Math.min(1, (n - t0) / 380), v = from + (to - from) * (1 - Math.pow(1 - k, 3)); if (tot) tot.textContent = eur(Math.round(v)); if (k < 1) raf = requestAnimationFrame(f); }; raf = requestAnimationFrame(f); };
    const setTot = v => { cancelAnimationFrame(raf); cur = v; if (tot) tot.textContent = eur(v); };
    const run = () => {
      tms.forEach(clearTimeout); tms = [];
      lp.classList.remove('done', 'flip', 'thud'); lis.forEach(li => li.classList.remove('in', 'ok')); setTot(0);
      if (reduce) { lp.classList.remove('pre', 'run'); lis.forEach(li => li.classList.add('in', 'ok')); lp.classList.add('done', 'flip'); setTot(0); return; }
      lp.classList.add('pre', 'run'); void lp.offsetWidth;
      let t = 120; at(t, () => lp.classList.remove('pre'));
      t += 650; let sub = 0; lis.forEach(li => { sub += +li.dataset.amt || 0; const s0 = sub; at(t, () => { li.classList.add('in'); roll(s0); }); t += 260; });   // Summe wächst mit jedem Posten
      t += 900; let rest = SUM; lis.forEach(li => { rest -= +li.dataset.amt || 0; const r = rest; at(t, () => { li.classList.add('ok'); roll(Math.max(0, r)); }); t += 420; });
      at(t - 150, () => lp.classList.add('flip'));
      t += 420; at(t, () => { lp.classList.add('done', 'thud'); lp.classList.remove('run'); });
      at(t + 500, () => lp.classList.remove('thud'));
    };
    if (!reduce) lp.classList.add('pre');
    onView(lp, run, .2);
    const re = $('[data-lp-re]', lp); if (re) re.addEventListener('click', run);
  });

  /* ---------- Folie abziehen ---------- */
  const clipPoly = (poly, f) => { const out = []; for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length], fa = f(a), fb = f(b); if (fa >= 0) out.push(a); if ((fa >= 0) !== (fb >= 0)) { const k = fa / (fa - fb); out.push({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k }); } } return out; };
  const area = p => { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a.x * b.y - b.x * a.y; } return Math.abs(s) / 2; };
  const path = (ctx, p) => { ctx.beginPath(); p.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.closePath(); };
  const ease = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  const pls = $$('[data-pl]'), plSum = $('[data-pl-sum]'), plAll = $('[data-pl-all]');
  const plCount = () => { const n = pls.filter(p => p.classList.contains('done')).length;
    if (plSum) { plSum.textContent = n === pls.length ? 'Beide Folien ab. So geht das Auto zurück an den Leasinggeber.' : `${n} von ${pls.length} Folien ab`; plSum.classList.toggle('ok', n === pls.length); }
    if (plAll) plAll.textContent = n === pls.length ? 'Folie wieder drauf' : 'Beide Folien abziehen'; };
  let slot = 0; const nextSlot = () => { const n = performance.now(), t = Math.max(n + 500, slot + 900); slot = t; return t - n; };
  const REST = .045;
  pls.forEach(pl => {
    const st = $('.pl-stage', pl), v = $('.pl-v', st), cv = $('.pl-cv', st), ctx = cv.getContext('2d'), inp = $('input', st);
    const grip = document.createElement('span'); grip.className = 'pl-grip'; grip.setAttribute('aria-hidden', 'true'); st.append(grip);
    let W = 1, H = 1, u = 1, w = 0, frac = 0, raf = 0, touched = false;           // u, w: Ecke der Folie relativ zur Bühne (1,0 = oben rechts, unberührt)
    const diag = t => ({ u: 1 - 2.06 * t, w: 2.06 * t });                           // t: 0 = Folie drauf, 1 = ganz ab (Knick läuft über die ganze Diagonale)
    const render = () => {
      ctx.setTransform(DPR(), 0, 0, DPR(), 0, 0); ctx.clearRect(0, 0, W, H);
      const C = { x: W, y: 0 }, P = { x: u * W, y: w * H };
      let nx = C.x - P.x, ny = C.y - P.y; const len = Math.hypot(nx, ny);
      if (len < .5) { v.style.clipPath = ''; frac = 0; return; }
      nx /= len; ny /= len; const mx = (C.x + P.x) / 2, my = (C.y + P.y) / 2;
      const side = p => (p.x - mx) * nx + (p.y - my) * ny;                         // > 0: Seite zur Ecke hin = abgezogen
      const rect = [{ x: 0, y: 0 }, { x: W, y: 0 }, { x: W, y: H }, { x: 0, y: H }];
      const keep = clipPoly(rect, p => -side(p)), peel = clipPoly(rect, side);
      v.style.clipPath = keep.length > 2 ? `polygon(${keep.map(p => `${p.x.toFixed(1)}px ${p.y.toFixed(1)}px`).join(',')})` : 'polygon(0 0,0 0,0 0)';
      frac = Math.min(1, area(peel) / (W * H));
      if (keep.length > 2) {                                                         // Schatten an der Knickkante auf der Folie, die noch klebt
        ctx.save(); path(ctx, keep); ctx.clip(); const g = ctx.createLinearGradient(mx, my, mx - nx * 22, my - ny * 22);
        g.addColorStop(0, 'rgba(6,9,10,.26)'); g.addColorStop(1, 'rgba(6,9,10,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); }
      if (peel.length > 2) {                                                         // umgeklappter Folienlappen: Rückseite, Wölbung, Schatten
        const fl = peel.map(p => { const s = side(p); return { x: p.x - 2 * s * nx, y: p.y - 2 * s * ny }; });
        ctx.save(); path(ctx, fl); ctx.shadowColor = 'rgba(6,9,10,.42)'; ctx.shadowBlur = 28; ctx.shadowOffsetX = -nx * 12; ctx.shadowOffsetY = -ny * 12;
        const g = ctx.createLinearGradient(mx, my, P.x, P.y);
        g.addColorStop(0, '#aeb9bb'); g.addColorStop(.05, '#eef3f3'); g.addColorStop(.16, '#ffffff'); g.addColorStop(.6, '#edf1f1'); g.addColorStop(1, '#cdd5d6');
        ctx.fillStyle = g; ctx.fill(); ctx.restore();
        ctx.save(); path(ctx, fl); ctx.clip(); const s = ctx.createLinearGradient(mx, my, mx - nx * 60, my - ny * 60);
        s.addColorStop(0, 'rgba(255,255,255,0)'); s.addColorStop(.35, 'rgba(255,255,255,.9)'); s.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = s; ctx.fillRect(0, 0, W, H); ctx.restore();
        ctx.strokeStyle = 'rgba(6,9,10,.14)'; ctx.lineWidth = 1; path(ctx, fl); ctx.stroke();
      }
    };
    const set = (nu, nw) => {
      u = Math.min(1, Math.max(-1.25, nu)); w = Math.max(0, Math.min(2.25, nw));
      render(); inp.value = Math.round(100 * (frac <= .5 ? Math.sqrt(frac / 2) : 1 - Math.sqrt((1 - frac) / 2)));   // Regler = Weg entlang der Diagonale
      pl.classList.toggle('part', frac > .06);
      const was = pl.classList.contains('done'); pl.classList.toggle('done', frac > .985); if (was !== pl.classList.contains('done')) plCount();
    };
    const size = () => { const d = DPR(); W = st.clientWidth || 1; H = st.clientHeight || 1; cv.width = Math.round(W * d); cv.height = Math.round(H * d); render(); };
    new ResizeObserver(size).observe(st); size();
    const r0 = diag(REST); set(r0.u, r0.w);
    const anim = (tu, tw, dur = .9) => { cancelAnimationFrame(raf); const fu = u, fw = w, t0 = performance.now();
      if (reduce) return set(tu, tw);
      const f = n => { const k = Math.min(1, (n - t0) / (dur * 1000)), e = ease(k); set(fu + (tu - fu) * e, fw + (tw - fw) * e); if (k < 1) raf = requestAnimationFrame(f); }; raf = requestAnimationFrame(f); };
    const animT = (t, dur) => { const d = diag(t); anim(d.u, d.w, dur); };
    pl._peel = () => { touch(); animT(1, 1.25); };
    pl._back = () => { animT(REST, 1.1); };
    const touch = () => { cancelAnimationFrame(raf); if (touched) return; touched = true; pl.classList.add('touched'); };
    // Ziehen: Maus überall, Finger in der Ecke sofort, sonst nach seitlicher Bewegung (Seite bleibt scrollbar)
    let down = false, drag = false, sx = 0, sy = 0, su = 0, sw = 0, moved = false;
    st.addEventListener('pointerdown', e => { touch(); down = true; moved = false; sx = e.clientX; sy = e.clientY; su = u; sw = w; drag = e.pointerType === 'mouse' || e.target === grip;
      if (drag) { try { st.setPointerCapture(e.pointerId); } catch (_) {} st.classList.add('drag'); } });
    st.addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx, dy = e.clientY - sy;
      if (!drag) { if (Math.abs(dx) > 7 && Math.abs(dx) > Math.abs(dy) * 1.1) { drag = true; try { st.setPointerCapture(e.pointerId); } catch (_) {} st.classList.add('drag'); } else return; }
      if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
      set(su + dx / W, sw + dy / H); });
    const up = () => { if (!down) return; down = false; st.classList.remove('drag'); if (!drag || !moved) return; drag = false;
      if (frac > .45) animT(1, .7); else if (frac < .1) animT(REST, .5); };
    st.addEventListener('pointerup', up); st.addEventListener('pointercancel', up); st.addEventListener('lostpointercapture', up);
    st.addEventListener('click', () => { if (moved) return; if (frac < .4) pl._peel(); });
    inp.addEventListener('input', () => { touch(); const t = Math.max(REST, +inp.value / 100); const d = diag(t); set(d.u, d.w); });
    // Selbst-Impuls beim ersten Sichtkontakt: Folie hebt sich ein Stück und klebt wieder an
    onView(st, () => setTimeout(() => { if (touched || reduce) return; animT(.3, 1.05); setTimeout(() => { if (!touched) animT(REST, .9); }, 1500); }, nextSlot()), .3);
  });
  if (plAll) plAll.addEventListener('click', () => { const all = pls.every(p => p.classList.contains('done')); pls.forEach((p, i) => setTimeout(() => all ? p._back() : p._peel(), i * 220)); });
  plCount();

  /* ---------- Rückgabe-Check: antippen → Karte → WhatsApp an Ali ---------- */
  $$('.ls-chk').forEach(box => {
    const chips = $$('[data-c]', box), list = $('[data-lc-list]', box), n = $('[data-lc-n]', box), wa = $('[data-lc-wa]', box),
      car = $('[data-lc-car]', box), carOut = $('[data-lc-car-out]', box), date = $('[data-lc-date]', box), days = $('[data-lc-days]', box),
      tip = $('[data-lc-tip]', box), ghost = $('.lc-ghost', box), wrap = $('[data-lc]', box);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    date.min = iso(today);
    const upd = () => {
      const sel = chips.filter(c => c.getAttribute('aria-pressed') === 'true');
      n.textContent = sel.length === 1 ? '1 Punkt' : `${sel.length} Punkte`;
      list.replaceChildren(...(sel.length ? sel.map(c => { const li = document.createElement('li'); li.textContent = c.dataset.l; return li; }) : [Object.assign(document.createElement('li'), { className: 'lc-empty', textContent: 'Noch nichts ausgewählt' })]));
      const cv = car.value.trim(); carOut.textContent = cv || 'Ihr Leasingauto';
      let dt = '', txt = 'Rückgabetermin noch offen';
      if (date.value) { const [y, m, d] = date.value.split('-').map(Number), t = new Date(y, m - 1, d), diff = Math.round((t - today) / 864e5);
        dt = `${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.${y}`;
        txt = diff > 1 ? `Rückgabe am ${dt} · noch ${diff} Tage` : diff === 1 ? `Rückgabe morgen, ${dt}` : diff === 0 ? `Rückgabe heute, ${dt}` : `Dieses Datum liegt in der Vergangenheit. Bitte den kommenden Rückgabetermin wählen.`; if (diff < 0) dt = ''; }
      days.textContent = txt;
      const msg = ['Hallo Z&H, mein Leasingauto geht bald zurück.', cv && `Fahrzeug: ${cv}`, dt && `Rückgabe am: ${dt}`, sel.length && `Bitte vorher: ${sel.map(c => c.dataset.l).join(', ')}`, 'Fotos schicke ich gleich mit.'].filter(Boolean).join('\n');
      wa.href = 'https://wa.me/4917624401827?text=' + encodeURIComponent(msg);
    };
    let demo = false, user = false, tms = [];
    const stopDemo = () => { tms.forEach(clearTimeout); tms = []; demo = false; ghost.classList.remove('on', 'tap'); };
    const userAct = () => { if (!user) { user = true; tip.classList.add('off'); } stopDemo(); };
    chips.forEach(c => c.addEventListener('click', e => { if (e.isTrusted) userAct(); c.setAttribute('aria-pressed', c.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'); upd(); }));
    car.addEventListener('input', () => { userAct(); upd(); }); date.addEventListener('input', () => { userAct(); upd(); }); date.addEventListener('change', upd);
    upd();
    // Selbst-Impuls: Hand tippt „Folie & Beschriftung“ und „Kleberreste“ an (bleiben als Vorschlag gewählt)
    const moveTo = b => { const r = b.getBoundingClientRect(), R = wrap.getBoundingClientRect(); ghost.style.transform = `translate(${Math.round(r.left - R.left + r.width * .9 - 12)}px,${Math.round(r.top - R.top + r.height * .72)}px)`; };   // Fingerspitze unten rechts, Beschriftung bleibt lesbar
    onView(wrap, () => { if (user || reduce) { if (reduce && !user) { chips.slice(0, 2).forEach(c => c.setAttribute('aria-pressed', 'true')); upd(); } return; }
      demo = true; ghost.style.transition = 'none'; moveTo(chips[0]); void ghost.offsetWidth; ghost.style.transition = ''; ghost.classList.add('on'); let t = 450;
      chips.slice(0, 2).forEach((b, i) => { tms.push(setTimeout(() => moveTo(b), t)); t += 520;
        tms.push(setTimeout(() => { ghost.classList.remove('tap'); void ghost.offsetWidth; ghost.classList.add('tap'); if (b.getAttribute('aria-pressed') !== 'true') { b.setAttribute('aria-pressed', 'true'); upd(); } }, t)); t += 480; });
      tms.push(setTimeout(stopDemo, t + 300)); }, .3);
  });

  /* ---------- Unterseite: Ablauf läuft mit dem Scrollen ---------- */
  $$('[data-lr]').forEach(lr => { const steps = $$('.lst', lr); let tick = false;
    const f = () => { tick = false; const r = lr.getBoundingClientRect(), p = Math.max(0, Math.min(1, (innerHeight * .78 - r.top) / (r.height + innerHeight * .1)));
      lr.style.setProperty('--p', reduce ? 1 : p.toFixed(3)); steps.forEach((s, i) => s.classList.toggle('on', reduce || p >= i / steps.length + .05)); };
    addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(f); } }, { passive: true }); addEventListener('resize', f); f(); });

  /* ---------- Unterseite: Vorher/Nachher zum Umdrehen ---------- */
  $$('[data-flg]').forEach(g => { const fls = $$('[data-fl]', g); let user = false;
    fls.forEach(b => b.addEventListener('click', e => { if (e.isTrusted) user = true; b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'); }));
    const all = g.parentElement.querySelector('[data-fl-all]');
    if (all) all.addEventListener('click', () => { user = true; const on = fls.some(b => b.getAttribute('aria-pressed') !== 'true'); fls.forEach((b, i) => setTimeout(() => b.setAttribute('aria-pressed', on ? 'true' : 'false'), i * 160)); all.textContent = on ? 'Alle zurückdrehen' : 'Alle umdrehen'; });
    onView(g, () => { if (reduce) return; setTimeout(() => { if (user) return; fls[0].setAttribute('aria-pressed', 'true'); setTimeout(() => { if (!user) fls[0].setAttribute('aria-pressed', 'false'); }, 1700); }, 500); }, .3);
  });
})();
