/* Z&H Aufbereitung – Wischen mit dem Finger (04.11.2026, Falcon Eye)
   Vorher-Bild liegt auf einer Leinwand über dem Nachher-Bild. Wo der Finger (oder die Maus) wischt, verschwindet das Vorher:
   art "schaum": Schaumblasen quellen auf und platzen · art "politur": Polierpad dreht unter dem Finger, kleine Glanzpunkte.
   window.FEWisch(el, {art, onProgress(p), onDone()}) → {setBefore(src), reset(), clearAll(), demo()} */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.FEWisch = (el, o = {}) => {
    const art = o.art || 'schaum';
    const cv = document.createElement('canvas'), fx = document.createElement('canvas');
    cv.className = 'wi-cv'; fx.className = 'wi-fx'; cv.setAttribute('aria-hidden', 'true'); fx.setAttribute('aria-hidden', 'true');
    const pad = document.createElement('span'); pad.className = 'wi-pad ' + art; pad.setAttribute('aria-hidden', 'true');
    el.append(cv, fx, pad); el.classList.add('wi');
    // Scroll-Sperre: solange noch Schmutz drauf ist, gehört der Finger dem Bild (die Seite scrollt daneben); fertig gewischt → normal scrollen
    const lock = on => { el.style.touchAction = on ? 'none' : 'pan-y'; }; lock(true);
    const c = cv.getContext('2d'), f = fx.getContext('2d');
    let img = null, W = 0, H = 0, d = 1, strokes = [], cur = null, done = false, parts = [], raf = 0, last = null;
    const GX = 36, GY = 27; let grid = new Uint8Array(GX * GY), cleared = 0;
    const cover = () => { if (!img) return; const s = Math.max(W / img.naturalWidth, H / img.naturalHeight), w = img.naturalWidth * s, h = img.naturalHeight * s;
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.clearRect(0, 0, W, H); c.drawImage(img, (W - w) / 2, (H - h) / 2, w, h); };
    const R = () => Math.max(26, Math.min(W, H) * .11);
    const dab = (x, y) => { const r = R(); const g = c.createRadialGradient(x, y, r * .35, x, y, r);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.globalCompositeOperation = 'destination-out'; c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
      const gx0 = Math.max(0, Math.floor((x - r * .75) / W * GX)), gx1 = Math.min(GX - 1, Math.floor((x + r * .75) / W * GX)), gy0 = Math.max(0, Math.floor((y - r * .75) / H * GY)), gy1 = Math.min(GY - 1, Math.floor((y + r * .75) / H * GY));
      for (let j = gy0; j <= gy1; j++) for (let i = gx0; i <= gx1; i++) if (!grid[j * GX + i]) { grid[j * GX + i] = 1; cleared++; } };
    const line = (a, b) => { const r = R(), n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / (r * .3)));
      for (let k = 1; k <= n; k++) dab(a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n); };
    const replay = () => { cover(); grid = new Uint8Array(GX * GY); cleared = 0; if (done) { c.clearRect(0, 0, W, H); return; }
      strokes.forEach(s => { s.forEach((p, k) => k ? line([s[k - 1][0] * W, s[k - 1][1] * H], [p[0] * W, p[1] * H]) : dab(p[0] * W, p[1] * H)); }); };
    const size = () => { d = Math.min(devicePixelRatio || 1, 2); const w = Math.round(el.clientWidth * d), h = Math.round(el.clientHeight * d); if (!w || !h || (w === W && h === H)) return;
      W = cv.width = fx.width = w; H = cv.height = fx.height = h; replay(); };
    new ResizeObserver(size).observe(el);
    const prog = () => Math.min(1, cleared / (GX * GY * .82));
    // Effekte: Schaumblasen bzw. Glanzpunkte
    const spawn = (x, y) => { if (reduce) return; const n = art === 'schaum' ? 3 : 2;
      for (let k = 0; k < n; k++) parts.push(art === 'schaum'
        ? { x: x + (Math.random() - .5) * R() * 1.3, y: y + (Math.random() - .5) * R() * 1.3, r: (3 + Math.random() * 12) * d, vx: (Math.random() - .5) * .4 * d, vy: (-.25 - Math.random() * .5) * d, t: 0, L: 50 + Math.random() * 50 }
        : { x: x + (Math.random() - .5) * R(), y: y + (Math.random() - .5) * R(), r: (1.5 + Math.random() * 3) * d, vx: 0, vy: 0, t: 0, L: 22 + Math.random() * 20 });
      if (!raf) raf = requestAnimationFrame(tick); };
    const tick = () => { raf = 0; f.clearRect(0, 0, W, H);
      parts = parts.filter(p => (p.t += 1) < p.L);
      for (const p of parts) { p.x += p.vx; p.y += p.vy; const a = 1 - p.t / p.L;
        if (art === 'schaum') { const r = p.r * (1 + p.t / p.L * .35);
          f.globalAlpha = a * .9; f.fillStyle = 'rgba(255,255,255,.28)'; f.strokeStyle = 'rgba(255,255,255,.95)'; f.lineWidth = Math.max(1, d * .9);
          f.beginPath(); f.arc(p.x, p.y, r, 0, 7); f.fill(); f.stroke();
          f.fillStyle = 'rgba(255,255,255,.95)'; f.beginPath(); f.arc(p.x - r * .35, p.y - r * .35, r * .22, 0, 7); f.fill(); }
        else { f.globalAlpha = a; f.fillStyle = '#fff'; f.beginPath(); const s = p.r * (1.5 - Math.abs(.5 - p.t / p.L));
          f.moveTo(p.x - s * 3, p.y); f.lineTo(p.x, p.y - s * .5); f.lineTo(p.x + s * 3, p.y); f.lineTo(p.x, p.y + s * .5); f.closePath(); f.fill();
          f.beginPath(); f.moveTo(p.x, p.y - s * 3); f.lineTo(p.x + s * .5, p.y); f.lineTo(p.x, p.y + s * 3); f.lineTo(p.x - s * .5, p.y); f.closePath(); f.fill(); } }
      f.globalAlpha = 1; if (parts.length) raf = requestAnimationFrame(tick); };
    const at = e => { const r = el.getBoundingClientRect(); return [(e.clientX - r.left) * d, (e.clientY - r.top) * d]; };
    const movePad = (p, on) => { pad.style.transform = `translate(${p[0] / d}px,${p[1] / d}px)`; pad.classList.toggle('on', on); };
    const finish = () => { if (done) return; done = true; el.classList.add('wi-done'); lock(false);
      if (reduce || !cv.animate) { c.clearRect(0, 0, W, H); } else cv.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 650, easing: 'ease-out' }).onfinish = () => { c.clearRect(0, 0, W, H); };
      if (!reduce) for (let k = 0; k < 26; k++) spawn(Math.random() * W, Math.random() * H);
      o.onProgress && o.onProgress(1); o.onDone && o.onDone(); };
    const add = p => { if (done) return; const lp = cur[cur.length - 1]; cur.push([p[0] / W, p[1] / H]);
      lp ? line([lp[0] * W, lp[1] * H], p) : dab(p[0], p[1]); spawn(p[0], p[1]);
      const pr = prog(); o.onProgress && o.onProgress(pr); if (pr >= 1) finish(); };
    // Zeiger: jede Richtung putzt (touch-action: none bis fertig)
    let down = false, pid = null;
    el.addEventListener('pointerdown', e => { if (e.button > 0 || !img) return; down = true; pid = e.pointerId; o.onTouch && o.onTouch(); el.classList.add('wi-used');
      cur = []; strokes.push(cur); const p = at(e); movePad(p, true); add(p); });
    el.addEventListener('pointermove', e => { const p = at(e); if (e.pointerType === 'mouse' && !down) { movePad(p, art === 'politur' && el.matches(':hover')); return; }
      if (!down || e.pointerId !== pid) return; movePad(p, true); add(p); });
    const up = e => { if (!down || (e && e.pointerId !== pid)) return; down = false; pad.classList.remove('on'); };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('pointerleave', e => { up(e); pad.classList.remove('on'); });
    const api = {
      setBefore(src) { return new Promise(res => { const im = new Image(); im.decoding = 'async'; im.onload = () => { img = im; strokes = []; done = false; el.classList.remove('wi-done'); lock(true); cv.style.opacity = ''; W = 0; size(); o.onProgress && o.onProgress(0); res(); }; im.onerror = res; im.src = src; }); },
      reset() { strokes = []; done = false; el.classList.remove('wi-done'); lock(true); cv.getAnimations && cv.getAnimations().forEach(a => a.cancel()); cv.style.opacity = ''; replay(); o.onProgress && o.onProgress(0); },
      clearAll() { finish(); },
      // Selbst-Impuls: eine Hand wischt einmal quer drüber und lässt eine saubere Spur stehen
      demo() { if (reduce || !img || done) return; const hand = el.querySelector('.wi-hand'); const P = [[.18, .62], [.36, .42], [.55, .58], [.74, .40], [.86, .55]];
        cur = []; strokes.push(cur); let t0 = performance.now(), D = 1300; if (hand) hand.classList.add('on');
        const st = now => { const q = Math.max(0, Math.min(1, (now - t0) / D)), u = q * (P.length - 1), k = Math.min(P.length - 2, Math.floor(u)), r = u - k;
          const x = (P[k][0] + (P[k + 1][0] - P[k][0]) * r) * W, y = (P[k][1] + (P[k + 1][1] - P[k][1]) * r) * H;
          add([x, y]); movePad([x, y], art === 'politur'); if (hand) hand.style.transform = `translate(${x / d}px,${y / d}px)`;
          if (q < 1 && !el.classList.contains('wi-used')) requestAnimationFrame(st); else { pad.classList.remove('on'); if (hand) hand.classList.remove('on'); } };
        requestAnimationFrame(st); },
      progress: prog
    };
    return api;
  };
})();
