/* Keramik auf der Felge – Scroll-Film aus echter Aufnahme (100 Bilder), Texte nach Fortschritt */
(function () {
  const sec = document.querySelector('.kf');
  if (!sec) return;
  const pin = sec.querySelector('.kf-pin'), cv = sec.querySelector('.kf-cv'), ctx = cv.getContext('2d');
  const cards = [...sec.querySelectorAll('.kfc')], bar = sec.querySelector('.kf-bar i');
  const N = +sec.dataset.n || 93, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const portrait = () => innerWidth / innerHeight < 0.9;
  let dir = portrait() ? 'm' : 'd', imgs = [], loaded = false, cur = -1, want = 0;
  const src = i => `seq/kf/${dir}/k${String(i + 1).padStart(3, '0')}.webp`;
  const load = () => {
    if (loaded) return; loaded = true;
    imgs = Array.from({ length: N }, () => new Image());
    const order = [0, N - 1]; for (let s = 32; s >= 1; s >>= 1) for (let i = 0; i < N; i += s) order.push(i);
    const seen = new Set(); order.forEach(i => { if (seen.has(i)) return; seen.add(i); const im = imgs[i]; im.decoding = 'async'; im.onload = () => { if (i === 0) sec.classList.add('on'); draw(true); }; im.src = src(i); });
  };
  const fit = () => { const d = Math.min(devicePixelRatio || 1, 2); cv.width = Math.round(pin.clientWidth * d); cv.height = Math.round(pin.clientHeight * d); cur = -1; draw(true); };
  const near = i => { for (let k = 0; k < N; k++) { const a = imgs[i - k], b = imgs[i + k]; if (a && a.complete && a.naturalWidth) return a; if (b && b.complete && b.naturalWidth) return b; } return null; };
  function draw(force) {
    if (!imgs.length) return;
    const i = Math.max(0, Math.min(N - 1, Math.round(want)));
    if (i === cur && !force) return;
    const im = near(i); if (!im) return; cur = i;
    const W = cv.width, H = cv.height, r = Math.max(W / im.naturalWidth, H / im.naturalHeight), w = im.naturalWidth * r, h = im.naturalHeight * r;
    ctx.drawImage(im, (W - w) / 2, (H - h) / 2, w, h);
  }
  const step = () => {
    const rect = sec.getBoundingClientRect(), span = sec.offsetHeight - innerHeight;
    const p = Math.max(0, Math.min(1, -rect.top / Math.max(1, span)));
    if (rect.top < innerHeight * 2.2 && rect.bottom > -innerHeight) load();
    want = reduce ? (N - 1) * Math.round(p * 2) / 2 : p * (N - 1);
    draw(false);
    if (bar) bar.style.transform = `scaleX(${p})`;
    if (p > 0.02) sec.classList.add('moved');
    cards.forEach(c => { const a = +c.dataset.a, b = +c.dataset.b; c.classList.toggle('on', p >= a && p < b); });
  };
  let raf = 0; const tick = () => { raf = 0; step(); };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(tick); }, { passive: true });
  addEventListener('resize', () => { const nd = portrait() ? 'm' : 'd'; if (nd !== dir && loaded) { dir = nd; loaded = false; sec.classList.remove('on'); load(); } fit(); step(); });
  fit(); step();
})();
