/* Z&H Aufbereitung – Seite „Fahrzeuge“: Hof-Scan, Suche, Filter, Merkliste, Detailansicht mit Fotogalerie (echter Bestand oder Beispiele) */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  if (root.dataset.page !== 'fahrzeuge') return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let DATA = [];
  try { DATA = JSON.parse($('#fz-data').textContent); } catch (e) { DATA = []; }
  const byId = id => DATA.find(d => String(d.id) === String(id));
  const num = v => Number(v).toLocaleString('de-DE');
  const eur = v => num(v) + ' €';
  const dmy = iso => iso.split('-').reverse().join('.');
  const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const WA = t => 'https://wa.me/4917624401827?text=' + encodeURIComponent(t);
  const TEL = 'tel:+496841890200';
  const MAIL = window.ZH_MAIL || '';
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  const onView = (el, fn, thr = .3) => {
    if (!el) return;
    let done = false;
    const go = () => { if (done) return; done = true; io.disconnect(); removeEventListener('scroll', chk); fn(); };
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) go(); }, { threshold: thr });
    const chk = () => { const r = el.getBoundingClientRect(); if (r.height && r.top < innerHeight * (1 - thr * .5) && r.bottom > 0) go(); };
    io.observe(el); addEventListener('scroll', chk, { passive: true }); setTimeout(chk, 400);
  };
  const ICON_WA = ($('.fz-srcchip.wa svg') || {}).outerHTML || '';
  const ICON_SYNC = ($('.fz-srcchip.mob svg') || {}).outerHTML || '';
  const ICON_HOF = '<svg class="fz-hofic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/></svg>';
  const REAL = !!$('[data-grid][data-real]');

  const grid = $('[data-grid]');
  const cards = $$('.fz-card', grid);
  const cardOf = id => cards.find(c => c.dataset.id === String(id));

  /* ---------- Fahrzeug fährt ein (Räder drehen, Glanzlicht) ---------- */
  const drive = (el, delay = 0) => {
    if (reduce) return;
    setTimeout(() => { el.classList.remove('pre', 'drive'); void el.offsetWidth; el.classList.add('drive'); }, delay);
  };
  if (!reduce) cards.forEach(c => c.classList.add('pre'));
  cards.forEach((c, i) => onView(c, () => drive(c, (i % 2) * 140), .25));

  /* ---------- Hof-Scan: Pins erscheinen mit der Scan-Linie, dann Selbst-Impuls ---------- */
  const mon = $('[data-mon]'), frame = $('.fz-mon-v'), pins = $$('.fz-pin'), hint = $('[data-mon-hint]'), found = $('[data-found]');
  let pinTouched = false;
  if (hint && !REAL && matchMedia('(hover:hover) and (pointer:fine)').matches) { const t = $('span', hint); if (t) t.textContent = 'Markiertes Auto anklicken'; }
  const placeLabel = p => {
    const fr = frame.getBoundingClientRect(), pr = p.getBoundingClientRect();
    const fx = (pr.left + pr.width / 2 - fr.left) / fr.width, fy = (pr.top + pr.height / 2 - fr.top) / fr.height;
    p.classList.toggle('al-l', fx < .24); p.classList.toggle('al-r', fx > .76); p.classList.toggle('v-b', fy < .34);
  };
  const stopCycle = () => { pinTouched = true; pins.forEach(p => p.classList.remove('show')); hint && hint.classList.add('on'); };
  pins.forEach(p => {
    p.addEventListener('click', () => { stopCycle(); if (p.dataset.pin) open(p.dataset.pin, p); });
    p.addEventListener('mouseenter', () => { placeLabel(p); const c = cardOf(p.dataset.pin); c && c.classList.add('hl'); });
    p.addEventListener('mouseleave', () => { const c = cardOf(p.dataset.pin); c && c.classList.remove('hl'); });
    p.addEventListener('focus', () => placeLabel(p));
  });
  if (frame) frame.addEventListener('pointerdown', () => { pinTouched = true; }, { passive: true });
  const runScan = () => {
    const fr = frame.getBoundingClientRect();
    const items = pins.map(p => { const r = p.getBoundingClientRect(); return { p, y: Math.min(1, Math.max(0, (r.top + r.height / 2 - fr.top) / fr.height)), x: r.left }; });
    let n = 0;
    const total = found && found.dataset.total ? +found.dataset.total : 0;
    items.forEach(it => setTimeout(() => { it.p.classList.add('on'); n++; if (found && !total) found.textContent = n; }, reduce ? 0 : 300 + it.y * 2250));
    if (total && found) {
      if (reduce) found.textContent = total;
      else { const t0 = performance.now(), dur = 2500; const tick = now => { const k = Math.min(1, (now - t0) / dur); found.textContent = Math.round(total * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(tick); }; setTimeout(() => requestAnimationFrame(tick), 300); }
    }
    if (reduce) { hint && hint.classList.add('on'); return; }
    if (!$('.fz-pin-lab', frame)) { setTimeout(() => { hint && hint.classList.add('on'); }, 2900); return; }
    const order = items.slice().sort((a, b) => a.x - b.x).map(it => it.p);
    let i = 0;
    const step = () => {
      if (pinTouched) return;
      pins.forEach(p => p.classList.remove('show'));
      if (i >= order.length) { hint && hint.classList.add('on'); return; }
      placeLabel(order[i]); order[i].classList.add('show'); i++;
      setTimeout(step, 1400);
    };
    setTimeout(step, 3000);
  };
  if (mon && frame && pins.length) onView(mon, () => { mon.classList.add('go'); runScan(); }, .35);

  /* ---------- Suche und Filter ---------- */
  const q = $('[data-q]');
  if (q && innerWidth >= 600) q.placeholder = 'Marke, Modell oder Ausstattung – z. B. Automatik';
  const slider = $('[data-max]'), maxv = $('[data-maxv]'), maxhint = $('[data-maxhint]');
  const countEl = $('[data-fz-n]'), countL = $('[data-countl]'), empty = $('[data-empty]'), wish = $('[data-wish]');
  const chips = $$('.fz-chips [data-body]'), favChip = $('[data-favonly]'), sorts = $$('[data-sort]');
  const MAX = slider ? +slider.max : Infinity;
  const st = { q: '', body: '', max: MAX, sort: 'neu', fav: false };
  let favs = new Set();
  try { favs = new Set(JSON.parse(store.get('zh-fz-merk') || '[]').map(String)); } catch (e) { favs = new Set(); }

  const GEAR = { automatik: 'Automatik', automatic: 'Automatik', automat: 'Automatik', schaltgetriebe: 'Schaltgetriebe', schalter: 'Schaltgetriebe', handschalter: 'Schaltgetriebe', manuell: 'Schaltgetriebe' };
  const matches = c => {
    if (st.body && c.dataset.kind !== st.body) return false;
    if (+c.dataset.price > st.max) return false;
    if (st.fav && !favs.has(c.dataset.id)) return false;
    if (st.q) {
      // „Automatik“ meint das Getriebe – nicht die Klimaautomatik
      const d = byId(c.dataset.id), hay = norm(c.dataset.q + ' ' + c.dataset.price);
      return norm(st.q).split(/\s+/).filter(Boolean).every(w => GEAR[w] ? !!d && d.gear === GEAR[w] : hay.includes(w));
    }
    return true;
  };
  // Gleichstand (z. B. gleicher Tag) bleibt in der ursprünglichen Reihenfolge – sonst springen die Karten beim Filtern hin und her
  const rank = new Map(cards.map((c, i) => [c, i]));
  const sorter = (a, b) => (st.sort === 'preis' ? a.dataset.price - b.dataset.price : st.sort === 'km' ? a.dataset.km - b.dataset.km : (a.dataset.added < b.dataset.added ? 1 : a.dataset.added > b.dataset.added ? -1 : 0)) || rank.get(a) - rank.get(b);
  const visibleOrder = () => cards.filter(matches).sort(sorter);
  const setCount = n => {
    if (countEl) countEl.textContent = n;
    if (countL) countL.textContent = n === cards.length ? (n === 1 ? 'Fahrzeug' : 'Fahrzeuge') : `von ${cards.length} Fahrzeugen`;
  };
  const updateWish = () => {
    if (!wish) return;
    const parts = [];
    const chip = chips.find(c => c.dataset.body === st.body && st.body);
    if (chip) parts.push(chip.textContent.replace(/\d+/g, '').trim());
    if (st.q) parts.push(st.q.trim());
    if (st.max < MAX) parts.push('bis ' + eur(st.max));
    wish.href = WA('Hallo Z&H, ich suche ein Auto' + (parts.length ? ': ' + parts.join(', ') : '') + '. Bitte melden Sie sich, wenn etwas Passendes auf den Hof kommt.');
  };
  let busy = false, pending = false, lastSig = '';
  const apply = () => {
    if (busy) { pending = true; return; }
    const vis = visibleOrder();
    const shown = cards.filter(c => !c.hidden);
    const leaving = shown.filter(c => !vis.includes(c));
    const finish = () => {
      const staying = vis.filter(c => !c.hidden);
      const first = new Map(staying.map(c => [c, c.getBoundingClientRect()]));
      leaving.forEach(c => { c.hidden = true; c.style.opacity = ''; });
      vis.forEach(c => grid.appendChild(c));
      const entering = vis.filter(c => c.hidden);
      entering.forEach(c => { c.hidden = false; });
      if (!reduce) {
        staying.forEach(c => {
          const f = first.get(c), l = c.getBoundingClientRect(), dx = f.left - l.left, dy = f.top - l.top;
          if (Math.abs(dx) + Math.abs(dy) > 1) c.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], { duration: 560, easing: 'cubic-bezier(.2,.7,.1,1)' });
        });
        entering.forEach((c, i) => { c.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: i * 80, easing: 'ease-out', fill: 'backwards' }); drive(c, i * 80); });
      }
      setCount(vis.length);
      if (empty) empty.hidden = vis.length > 0;
      updateWish();
      lastSig = vis.map(c => c.dataset.id).join(',');
      busy = false;
      if (pending) { pending = false; apply(); }
    };
    if (leaving.length && !reduce) {
      busy = true;
      leaving.forEach(c => { c.classList.remove('drive', 'pre'); c.classList.add('away'); c.animate([{ opacity: 1 }, { opacity: 0, transform: 'scale(.97)' }], { duration: 380, delay: 60, easing: 'ease-in', fill: 'forwards' }); });
      setTimeout(() => { leaving.forEach(c => { c.classList.remove('away'); c.getAnimations().forEach(a => a.cancel()); }); finish(); }, 460);
    } else finish();
  };
  const applyIfChanged = () => { const sig = visibleOrder().map(c => c.dataset.id).join(','); if (sig !== lastSig) apply(); };

  let qT;
  if (q) q.addEventListener('input', () => { clearTimeout(qT); qT = setTimeout(() => { st.q = q.value; apply(); }, 160); });
  if (q) q.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); q.blur(); } });
  chips.forEach(b => b.addEventListener('click', () => {
    chips.forEach(x => x.classList.toggle('on', x === b)); st.body = b.dataset.body; apply();
  }));
  sorts.forEach(b => b.addEventListener('click', () => { sorts.forEach(x => x.classList.toggle('on', x === b)); st.sort = b.dataset.sort; apply(); }));

  // Preisregler mit Selbst-Impuls (fährt einmal herunter und zurück, die Autos fahren live raus und wieder rein)
  let sliderTouched = false;
  const showMax = v => { if (maxv) maxv.textContent = v >= MAX ? eur(MAX) : eur(v); };
  const touchSlider = () => { if (sliderTouched) return; sliderTouched = true; maxhint && maxhint.classList.remove('on'); };
  if (slider) {
    ['pointerdown', 'touchstart', 'keydown'].forEach(ev => slider.addEventListener(ev, touchSlider, { passive: true }));
    slider.addEventListener('input', () => { st.max = +slider.value; showMax(st.max); applyIfChanged(); });
    onView($('.fz-bar'), () => {
      if (reduce) { maxhint && maxhint.classList.add('on'); return; }
      setTimeout(() => {
        if (sliderTouched) return;
        const lo = Math.max(+slider.min, REAL && slider.dataset.lo ? +slider.dataset.lo : 15000), t0 = performance.now(), dur = 2800;
        const tick = now => {
          if (sliderTouched) return;
          const p = Math.min(1, (now - t0) / dur), e = Math.sin(p * Math.PI);
          const v = Math.round((MAX - (MAX - lo) * (e * e * (3 - 2 * e))) / 500) * 500;
          slider.value = v; st.max = v; showMax(v); applyIfChanged();
          if (p < 1) requestAnimationFrame(tick); else { slider.value = MAX; st.max = MAX; showMax(MAX); applyIfChanged(); maxhint && maxhint.classList.add('on'); }
        };
        requestAnimationFrame(tick);
      }, 1500);
    }, .6);
  }

  // Merkliste
  const saveFav = () => store.set('zh-fz-merk', JSON.stringify([...favs]));
  const syncFav = () => {
    cards.forEach(c => { const b = $('.fz-fav', c); if (b) b.setAttribute('aria-pressed', favs.has(c.dataset.id)); });
    if (favChip) { favChip.hidden = favs.size === 0; $('i', favChip).textContent = favs.size; if (!favs.size && st.fav) { st.fav = false; favChip.classList.remove('on'); apply(); } }
  };
  cards.forEach(c => { const b = $('.fz-fav', c); if (!b) return; b.addEventListener('click', () => {
    const id = c.dataset.id; favs.has(id) ? favs.delete(id) : favs.add(id); saveFav(); syncFav();
    b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
    if (st.fav) apply();
  }); });
  if (favChip) favChip.addEventListener('click', () => { st.fav = !st.fav; favChip.classList.toggle('on', st.fav); apply(); });
  const reset = $('[data-reset]');
  if (reset) reset.addEventListener('click', () => {
    st.q = ''; st.body = ''; st.max = MAX; st.fav = false;
    if (q) q.value = ''; if (slider) { slider.value = MAX; showMax(MAX); }
    chips.forEach(x => x.classList.toggle('on', x.dataset.body === '')); favChip && favChip.classList.remove('on');
    apply();
  });
  syncFav(); lastSig = visibleOrder().map(c => c.dataset.id).join(','); updateWish();

  /* ---------- Ankauf: Schritte erscheinen ---------- */
  const steps = $('[data-steps]');
  onView(steps, () => steps.classList.add('in'), .2);

  /* ---------- Detailansicht ---------- */
  const sheet = $('[data-sheet]'), box = $('.fz-sheet-box');
  const S = k => $(`[data-s-${k}]`, sheet);
  let isOpen = false, curId = null, opener = null, pushed = false, hideT;
  const order = () => { const v = visibleOrder().map(c => c.dataset.id); return v.includes(String(curId)) ? v : DATA.map(d => String(d.id)); };
  const odo = (el, value) => {
    const s = num(value);
    el.innerHTML = [...s].map(ch => /\d/.test(ch) ? `<span class="od"><span>${'0123456789'.split('').map(n => `<i>${n}</i>`).join('')}</span></span>` : `<span class="sep">${ch}</span>`).join('');
    el.setAttribute('aria-label', s + ' Kilometer');
    const ds = $$('.od>span', el), digits = s.replace(/\D/g, '');
    if (reduce) { ds.forEach((d, i) => { d.style.transition = 'none'; d.style.transform = `translateY(-${+digits[i] * 1.1}em)`; }); return; }
    void el.offsetWidth;
    requestAnimationFrame(() => ds.forEach((d, i) => { d.style.transitionDelay = (i * 90) + 'ms'; d.style.transform = `translateY(-${+digits[i] * 1.1}em)`; }));
  };
  const PIC = (id, n, s) => `img/fz/${id}-${n}-${s}.webp`;
  let galTouched = false, galNudged = false;
  const galleryHTML = d => {
    const ph = d.photos, name = esc(`${d.make} ${d.model}`), N = ph.length;
    return `<div class="fzs-gal" data-gal><div class="fzs-track" data-track tabindex="0" role="group" aria-roledescription="Fotogalerie" aria-label="Fotos: ${name}">`
      + ph.map((p, i) => `<figure><img src="${PIC(d.id, p.n, 's')}" srcset="${PIC(d.id, p.n, 's')} 640w, ${PIC(d.id, p.n, 'l')} 1280w" sizes="(min-width:901px) 580px, 100vw" width="${p.w}" height="${p.h}" alt="${name} – Foto ${i + 1} von ${N}"${i ? ' loading="lazy"' : ''} decoding="async"></figure>`).join('')
      + `</div>${N > 1 ? '<button class="fzs-gb p" type="button" data-gp aria-label="Vorheriges Foto">‹</button><button class="fzs-gb n" type="button" data-gn aria-label="Nächstes Foto">›</button>' : ''}<span class="fzs-gc" data-gc aria-hidden="true">1 / ${N}</span>`
      + (N > 1 ? `<span class="fzs-gh" data-gh aria-hidden="true">← wischen →</span>` : '') + `</div>`
      + (N > 1 ? `<div class="fzs-thumbs" data-thumbs>${ph.map((p, i) => `<button type="button" data-ti="${i}" aria-label="Foto ${i + 1} von ${N}"${i ? '' : ' class="on" aria-current="true"'}><img src="${PIC(d.id, p.n, 't')}" alt="" width="192" height="144" loading="lazy" decoding="async"></button>`).join('')}</div>` : '');
  };
  const wireGallery = stage => {
    const track = $('[data-track]', stage); if (!track) return;
    const figs = $$('figure', track), gc = $('[data-gc]', stage), gh = $('[data-gh]', stage), th = $$('[data-ti]', stage), N = figs.length;
    const idx = () => Math.max(0, Math.min(N - 1, Math.round(track.scrollLeft / Math.max(1, track.clientWidth))));
    const goTo = i => { galTouched = true; gh && gh.classList.remove('on'); i = (i + N) % N; track.scrollTo({ left: i * track.clientWidth, behavior: reduce ? 'auto' : 'smooth' }); };
    let raf = 0, last = 0;
    track.addEventListener('scroll', () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const i = idx(); if (gc) gc.textContent = `${i + 1} / ${N}`;
        if (i !== last) { last = i; th.forEach((b, k) => { b.classList.toggle('on', k === i); if (k === i) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); }); const b = th[i]; if (b) b.parentElement.scrollTo({ left: b.offsetLeft - (b.parentElement.clientWidth - b.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' }); }
      });
    }, { passive: true });
    ['pointerdown', 'touchstart', 'wheel'].forEach(ev => track.addEventListener(ev, () => { galTouched = true; gh && gh.classList.remove('on'); }, { passive: true }));
    const gp = $('[data-gp]', stage), gn = $('[data-gn]', stage);
    gp && gp.addEventListener('click', () => goTo(idx() - 1));
    gn && gn.addEventListener('click', () => goTo(idx() + 1));
    track.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); goTo(idx() + (e.key === 'ArrowRight' ? 1 : -1)); } });
    th.forEach((b, k) => b.addEventListener('click', () => goTo(k)));
    // Selbst-Impuls beim ersten Öffnen: die Galerie zuckt kurz zum nächsten Foto und zurück
    if (N > 1 && !galNudged && !galTouched) {
      galNudged = true;
      if (reduce) { gh && gh.classList.add('on'); return; }
      setTimeout(() => {
        if (galTouched || !isOpen) return;
        gh && gh.classList.add('on');
        track.scrollTo({ left: track.clientWidth * .24, behavior: 'smooth' });
        setTimeout(() => { if (!galTouched) track.scrollTo({ left: 0, behavior: 'smooth' }); }, 700);
        setTimeout(() => { gh && gh.classList.remove('on'); }, 4200);
      }, 1100);
    }
  };
  const fill = id => {
    const d = byId(id), c = cardOf(id);
    if (!d || !c) return;
    curId = d.id;
    const stage = S('stage');
    if (d.photos && d.photos.length) {
      stage.classList.add('gal'); stage.classList.remove('drive'); stage.innerHTML = galleryHTML(d); wireGallery(stage);
    } else {
      const svg = $('.fz-car', c).outerHTML.replace(/id="([a-z])(\d+)"/g, 'id="$1$2s"').replace(/url\(#([a-z])(\d+)\)/g, 'url(#$1$2s)');
      stage.classList.remove('gal'); stage.innerHTML = svg; stage.classList.remove('drive'); void stage.offsetWidth; if (!reduce) stage.classList.add('drive');
    }
    const ord = order(); S('pos').textContent = `${ord.indexOf(String(d.id)) + 1} / ${ord.length}`;
    S('src').className = 'fz-src ' + d.src;
    S('src').innerHTML = (d.src === 'wa' ? ICON_WA + '<span>Per WhatsApp eingestellt · ' : d.src === 'hof' ? ICON_HOF + '<span>Auf dem Hof seit ' : ICON_SYNC + '<span>Automatisch aus AutoScout24 · ') + dmy(d.added) + '</span>';
    S('t').innerHTML = `<span>${esc(d.make)}</span> ${esc(d.model)}`;
    S('v').textContent = d.variant;
    S('res').hidden = d.status !== 'reserviert';
    S('p').textContent = eur(d.price);
    S('facts').innerHTML = [['Erstzulassung', d.ez], ['Kilometer', num(d.km) + ' km'], ['Leistung', `${d.kw} kW (${d.ps} PS)`], ['Kraftstoff', d.fuel], ['Getriebe', d.gear_l], ['Farbe', d.color], ['HU bis', d.hu], ['Vorbesitzer', d.owners], ['Karosserie', d.body], ['Fahrzeug-Nr.', d.id]]
      .filter(([, v]) => v !== '' && v !== null && v !== undefined).map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('');
    S('eq').innerHTML = d.equip.map(e => `<li>${esc(e)}</li>`).join(''); S('eqw').hidden = !d.equip.length;
    S('prep').innerHTML = d.prep.map((p, i) => `<li><a href="leistungen.html#${d.prepLinks[i]}">${esc(p)}</a></li>`).join(''); S('prepw').hidden = !d.prep.length;
    S('txt').textContent = d.text; S('txt').hidden = !d.text;
    const name = `${d.make} ${d.model}`;
    S('cta').innerHTML = `<a class="btn btn-wa wide" href="${WA(`Hallo Z&H, ich interessiere mich für den ${name} (Nummer ${d.id}, ${eur(d.price)}). Ist er noch zu haben?`)}" target="_blank" rel="noopener">${ICON_WA}Per WhatsApp anfragen</a>`
      + `<a class="btn btn-aqua" href="${TEL}">Anrufen</a>`
      + `<a class="btn btn-line" href="${WA(`Hallo Z&H, ich würde den ${name} (Nummer ${d.id}) gern Probe fahren. Wann passt es Ihnen?`)}" target="_blank" rel="noopener">Probefahrt</a>`
      + (MAIL ? `<a class="btn btn-line" href="mailto:${MAIL}?subject=${encodeURIComponent(`Anfrage ${name} (Nummer ${d.id})`)}&body=${encodeURIComponent(`Hallo Z&H,\n\nich interessiere mich für den ${name} (Nummer ${d.id}, ${eur(d.price)}).\n${location.href.split('#')[0]}#fz-${d.id}\n\nBitte melden Sie sich bei mir.\nName: \nTelefon: \n`)}">E-Mail</a>` : '')
      + `<button class="btn btn-line" type="button" data-fz-share="${d.id}">Teilen</button>`
      + `<a class="fzs-trade" href="${WA(`Hallo Z&H, ich interessiere mich für den ${name} (Nummer ${d.id}) und möchte mein jetziges Auto in Zahlung geben.\nMarke und Modell: \nBaujahr: \nKilometer: `)}" target="_blank" rel="noopener">Eigenes Auto in Zahlung geben <span aria-hidden="true">→</span></a>`;
    odo(S('odo'), d.km);
    box.scrollTop = 0;
  };
  let lockY = 0;
  // Beim Zurück-Button stellt der Browser sonst selbst eine alte Scrollposition her und kämpft mit der Scroll-Engine
  try { history.scrollRestoration = 'manual'; } catch (e) {}
  const open = (id, from, { push = true } = {}) => {
    if (!byId(id)) return;
    clearTimeout(hideT);
    opener = from || document.activeElement;
    fill(id);
    if (!isOpen) {
      sheet.hidden = false; void sheet.offsetWidth; sheet.classList.add('open');
      lockY = scrollY; const L = window.feLenis; if (L) L.stop();
      root.classList.add('fz-lock'); isOpen = true;
      setTimeout(() => { const x = $('.fz-x', sheet); x && x.focus({ preventScroll: true }); }, 60);
    }
    try {
      if (push) { history.pushState({ fz: String(id) }, '', '#fz-' + id); pushed = true; }
      else history.replaceState({ fz: String(id) }, '', '#fz-' + id);
    } catch (e) {}
  };
  const hide = () => {
    if (!isOpen) return;
    isOpen = false; sheet.classList.remove('open'); root.classList.remove('fz-lock');
    // Scrollposition festhalten und die weiche Scroll-Engine wieder exakt dort starten (sonst springt die Seite hoch und runter)
    const L = window.feLenis; if (Math.abs(scrollY - lockY) > 2) scrollTo(0, lockY);
    if (L) { L.scrollTo(lockY, { immediate: true, force: true }); L.start(); }
    hideT = setTimeout(() => { sheet.hidden = true; S('stage').innerHTML = ''; S('stage').classList.remove('gal'); }, 560);
    if (opener && document.contains(opener)) { try { opener.focus({ preventScroll: true }); } catch (e) {} }
  };
  const close = () => {
    if (!isOpen) return;
    hide();
    try {
      if (pushed) { pushed = false; history.back(); }
      else history.replaceState(null, '', location.pathname + location.search);
    } catch (e) {}
  };
  const go = dir => {
    const ord = order(); if (!ord.length) return;
    const i = ord.indexOf(String(curId)), nid = ord[(i + dir + ord.length) % ord.length];
    fill(nid);
    try { history.replaceState({ fz: nid }, '', '#fz-' + nid); } catch (e) {}
  };
  addEventListener('popstate', e => {
    const s = e.state;
    if (s && s.fz) { if (isOpen) fill(s.fz); else open(s.fz, null, { push: false }); }
    else if (isOpen) { pushed = false; hide(); }
  });
  cards.forEach(c => $$('[data-open]', c).forEach(b => b.addEventListener('click', () => open(c.dataset.id, b))));
  $$('[data-close]', sheet).forEach(b => b.addEventListener('click', close));
  $('[data-prev]', sheet).addEventListener('click', () => go(-1));
  $('[data-next]', sheet).addEventListener('click', () => go(1));
  addEventListener('keydown', e => {
    if (!isOpen) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowRight') go(1);
    else if (e.key === 'ArrowLeft') go(-1);
    else if (e.key === 'Tab') {
      const f = $$('a[href],button:not([disabled]),input,[tabindex]:not([tabindex="-1"])', box).filter(x => x.offsetParent !== null);
      if (!f.length) return;
      const a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    }
  });
  // Wischen über das Auto: nächstes / vorheriges Fahrzeug
  let tx = null, ty = null;
  const stageEl = S('stage');
  stageEl.addEventListener('touchstart', e => { if (e.target.closest('[data-gal],[data-thumbs]')) { tx = null; return; } tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  stageEl.addEventListener('touchend', e => {
    if (tx === null) return;
    const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty; tx = null;
    if (Math.abs(dx) > 50 && Math.abs(dy) < 60) go(dx < 0 ? 1 : -1);
  }, { passive: true });

  /* ---------- Ankauf-Formular: Live-Zusammenfassung, Fotos verkleinern, WhatsApp, Danke ---------- */
  const sell = $('[data-sell]');
  if (sell) {
    const done = $('[data-sell-done]', sell), sendBtn = $('[data-sell-send]', sell), SEND = sendBtn.textContent;
    const val = n => { const e = sell.elements[n]; return e ? String(e.value || '').trim() : ''; };
    const REQ = ['Fahrzeug', 'Erstzulassung', 'Kilometerstand', 'Name', 'Telefon'];
    const sumBox = $('.fzf-sum', sell), sumCar = $('[data-sum-car]', sell), sumMeta = $('[data-sum-meta]', sell), sumBar = $('[data-sum-bar]', sell), sumLeft = $('[data-sum-left]', sell);
    let photos = [];
    const update = () => {
      sumCar.textContent = val('Fahrzeug') || 'Ihr Auto';
      const ez = val('Erstzulassung'), km = val('Kilometerstand'), pr = val('Preisvorstellung');
      const meta = [ez && (/^\d{4}$/.test(ez) ? 'Erstzulassung ' + ez : 'Erstzulassung vor 1990'), km && km + ' km', val('Kraftstoff'), val('Getriebe'), val('Zustand'),
        photos.length && (photos.length === 1 ? '1 Foto' : photos.length + ' Fotos'), pr && 'Wunschpreis ' + pr + ' €'].filter(Boolean);
      sumMeta.textContent = meta.length ? meta.join(' · ') : 'Ihre Angaben erscheinen hier.';
      const ok = REQ.filter(n => { const e = sell.elements[n]; return e && String(e.value).trim() && e.checkValidity(); }).length, left = REQ.length - ok;
      sumBar.style.width = (ok / REQ.length * 100) + '%';
      sumLeft.textContent = left ? `Noch ${left} Pflichtangabe${left === 1 ? '' : 'n'}` : 'Alles da – bereit zum Senden';
      sumBox.classList.toggle('ok', !left);
    };
    sell.addEventListener('input', update); sell.addEventListener('change', update);

    // Kilometer und Preis mit Tausenderpunkt
    $$('[data-sell-num]', sell).forEach(inp => inp.addEventListener('input', () => {
      const d = inp.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 7), f = d ? Number(d).toLocaleString('de-DE') : '';
      if (inp.value !== f) inp.value = f;
    }));
    // Auswahl-Chips: zweiter Klick nimmt die Auswahl wieder raus
    $$('.fzf-chip input', sell).forEach(r => {
      r.addEventListener('pointerdown', () => { r.dataset.was = r.checked ? '1' : ''; });
      r.addEventListener('click', () => { if (r.dataset.was === '1') { r.checked = false; r.dataset.was = ''; update(); } });
    });

    // Fotos: im Browser auf 1600 px verkleinern und auf einzelne Felder verteilen (Formulardienst: mehrere Dateifelder, zusammen max. 10 MB)
    const MAXP = 4, pick = $('[data-sell-pick]', sell), thumbs = $('[data-sell-thumbs]', sell), pmsg = $('[data-sell-pmsg]', sell), drop = pick.closest('.fzf-drop'), PMSG = pmsg.textContent;
    let canDT = false;
    try { canDT = !!new DataTransfer(); } catch (e) { canDT = false; }
    const slots = [];
    if (canDT) {
      pick.removeAttribute('name');
      for (let i = 1; i <= MAXP; i++) { const h = document.createElement('input'); h.type = 'file'; h.name = 'Foto_' + i; h.hidden = true; h.tabIndex = -1; h.setAttribute('aria-hidden', 'true'); sell.appendChild(h); slots.push(h); }
    }
    const note = (t, warn) => { pmsg.textContent = t; pmsg.classList.toggle('warn', !!warn); };
    const shrink = file => new Promise(res => {
      const url = URL.createObjectURL(file), img = new Image(), fallback = () => res(file.size < 2.5e6 ? file : null);
      img.onload = () => {
        try {
          const s = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement('canvas');
          c.width = Math.max(1, Math.round(img.naturalWidth * s)); c.height = Math.max(1, Math.round(img.naturalHeight * s));
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          URL.revokeObjectURL(url);
          c.toBlob(b => b ? res(new File([b], (file.name.replace(/\.[^.]+$/, '') || 'foto') + '.jpg', { type: 'image/jpeg' })) : fallback(), 'image/jpeg', .82);
        } catch (e) { URL.revokeObjectURL(url); fallback(); }
      };
      img.onerror = () => { URL.revokeObjectURL(url); fallback(); };
      img.src = url;
    });
    const sync = () => slots.forEach((h, i) => { const dt = new DataTransfer(); if (photos[i] && photos[i].file) dt.items.add(photos[i].file); h.files = dt.files; });
    const renderThumbs = () => {
      thumbs.innerHTML = '';
      photos.forEach((p, i) => {
        const li = document.createElement('li');
        if (p.url) { const im = document.createElement('img'); im.src = p.url; im.alt = `Foto ${i + 1}`; li.appendChild(im); } else li.className = 'busy';
        const x = document.createElement('button'); x.type = 'button'; x.textContent = '×'; x.setAttribute('aria-label', `Foto ${i + 1} entfernen`);
        x.addEventListener('click', () => { if (p.url) URL.revokeObjectURL(p.url); photos.splice(photos.indexOf(p), 1); sync(); renderThumbs(); update(); note(photos.length ? `${photos.length} von ${MAXP} Fotos` : PMSG); });
        li.appendChild(x); thumbs.appendChild(li);
      });
      drop.classList.toggle('full', photos.length >= MAXP);
    };
    const addFiles = async list => {
      const all = [...list].filter(f => /^image\//.test(f.type) || /\.(jpe?g|png|webp|heic|heif)$/i.test(f.name));
      const files = all.slice(0, Math.max(0, MAXP - photos.length));
      if (!files.length) { if (all.length) note(`Maximal ${MAXP} Fotos – weitere gern per WhatsApp.`, true); return; }
      const items = files.map(() => ({ file: null, url: '' }));
      photos.push(...items); renderThumbs(); note('Fotos werden verkleinert …');
      let bad = 0;
      for (let k = 0; k < files.length; k++) {
        const out = await shrink(files[k]);
        if (out) { items[k].file = out; items[k].url = URL.createObjectURL(out); } else { bad++; photos.splice(photos.indexOf(items[k]), 1); }
        renderThumbs();
      }
      sync(); update();
      if (bad) note('Ein Foto ließ sich nicht lesen – bitte per WhatsApp schicken.', true);
      else if (all.length > files.length) note(`Maximal ${MAXP} Fotos – weitere gern per WhatsApp.`, true);
      else note(`${photos.length} von ${MAXP} Fotos – verkleinert und bereit`);
    };
    if (canDT) {
      pick.addEventListener('change', () => { const l = pick.files; addFiles(l); pick.value = ''; });
      ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, () => drop.classList.add('drag')));
      ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, () => drop.classList.remove('drag')));
    } else pick.addEventListener('change', () => note(pick.files.length ? `${pick.files.length} Foto(s) ausgewählt` : PMSG));

    // Senden über den Formulardienst, danach zurück auf diese Seite
    sell.addEventListener('submit', e => {
      if (photos.some(p => !p.file)) { e.preventDefault(); note('Einen Moment – die Fotos werden noch verkleinert …'); setTimeout(() => sell.requestSubmit ? sell.requestSubmit() : sell.submit(), 700); return; }
      sell.elements._next.value = location.href.split('#')[0].split('?')[0] + '?gesendet=ankauf#fz-sell';
      const ez = val('Erstzulassung');
      sell.elements._subject.value = 'Ankauf-Anfrage: ' + val('Fahrzeug') + (ez ? ' (Erstzulassung ' + ez + ')' : '');
      sendBtn.disabled = true; sendBtn.textContent = 'Wird gesendet …';
    });
    addEventListener('pageshow', () => { sendBtn.disabled = false; sendBtn.textContent = SEND; });

    // Dieselben Angaben per WhatsApp
    $('[data-sell-wa]', sell).addEventListener('click', () => {
      const L = [['Fahrzeug', 'Marke und Modell'], ['Erstzulassung', 'Erstzulassung'], ['Kilometerstand', 'Kilometer', ' km'], ['Kraftstoff', 'Kraftstoff'], ['Getriebe', 'Getriebe'], ['Zustand', 'Zustand'], ['Preisvorstellung', 'Preisvorstellung', ' €'], ['Hinweise', 'Hinweise'], ['Name', 'Name']];
      const lines = L.map(([n, l, u]) => val(n) ? `${l}: ${val(n)}${u || ''}` : '').filter(Boolean);
      const t = 'Hallo Z&H, ich möchte mein Auto verkaufen.\n' + (lines.length ? lines.join('\n') : 'Marke und Modell: \nBaujahr: \nKilometer: ') + '\nFotos schicke ich gleich hier im Chat.';
      window.open(WA(t), '_blank', 'noopener');
    });

    // Danke-Ansicht nach dem Senden
    const showDone = () => { sell.classList.add('sent'); done.hidden = false; setTimeout(() => { try { done.focus({ preventScroll: true }); } catch (e) {} }, 900);
      // 04.11.: danach freiwillig kurz nach der Seite fragen (fe-feedback.js, höchstens einmal je Besuch)
      setTimeout(() => { if (window.FEFeedback) window.FEFeedback.invite({ topic: 'Fahrzeug-Seite', art: 'die' }); }, 2600); };
    if (/[?&]gesendet=ankauf\b/.test(location.search)) showDone();
    $('[data-sell-again]', sell).addEventListener('click', () => {
      sell.reset(); photos.forEach(p => p.url && URL.revokeObjectURL(p.url)); photos = [];
      if (canDT) sync(); renderThumbs(); note(PMSG); update();
      sell.classList.remove('sent'); done.hidden = true; sendBtn.disabled = false; sendBtn.textContent = SEND;
      try { history.replaceState(null, '', location.pathname + '#ankauf'); } catch (e) {}
      $('[data-sell-car]', sell).focus();
    });

    // Selbst-Impuls: Beispiele tippen sich ins erste Feld, bis jemand loslegt
    const carIn = $('[data-sell-car]', sell), hint = $('[data-sell-hint]', sell), PH = carIn.placeholder;
    const EX = ['VW Golf 7 Variant', 'Opel Corsa', 'Hyundai Tucson'];
    let stopped = false;
    const stop = () => { if (stopped) return; stopped = true; carIn.placeholder = PH; hint.classList.remove('on'); };
    carIn.addEventListener('focus', stop); sell.addEventListener('input', stop);
    onView(sell, () => {
      if (stopped) return;
      hint.classList.add('on');
      if (reduce) return;
      let w = 0, i = 0, del = false;
      const tick = () => {
        if (stopped) return;
        const word = EX[w];
        if (!del) { i++; carIn.placeholder = 'z. B. ' + word.slice(0, i); if (i >= word.length) { del = true; if (w === EX.length - 1) { setTimeout(() => { if (!stopped) carIn.placeholder = PH; }, 1600); return; } return setTimeout(tick, 1300); } }
        else { i--; carIn.placeholder = 'z. B. ' + word.slice(0, i); if (i <= 0) { del = false; w++; } }
        setTimeout(tick, del ? 32 : 70);
      };
      carIn.placeholder = 'z. B. ';
      setTimeout(tick, 500);
    }, .3);
    update();
  }

  // Fahrzeug teilen: Handy-Teilen-Menü, sonst Link kopieren
  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-fz-share]'); if (!b) return;
    const d = byId(b.dataset.fzShare); if (!d) return;
    const url = location.href.split('#')[0].split('?')[0] + '#fz-' + d.id, title = `${d.make} ${d.model} bei Z&H Aufbereitung`;
    try { if (navigator.share) { await navigator.share({ title, text: `${d.make} ${d.model} · ${eur(d.price)}`, url }); return; } } catch (err) { if (err && err.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(url); b.textContent = 'Link kopiert'; } catch (err) { b.textContent = 'Link: ' + url; }
    setTimeout(() => { b.textContent = 'Teilen'; }, 2600);
  });
  // Direktlink #fz-1048 öffnet das Fahrzeug
  const m = location.hash.match(/^#fz-(\d+)$/);
  if (m && byId(m[1])) setTimeout(() => open(m[1], null, { push: false }), 650);
})();
