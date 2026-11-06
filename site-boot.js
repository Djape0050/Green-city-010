/* GREEN CITY 010 – pokretanje stranice i prelazi između stranica.
 * Učitava se u <head> pre support.js, pa ne zavisi od React-a.
 *  - ako <head> stranice nestane, pokreće se iz <helmet> dela šablona
 *  - sadržaj se prikazuje tek kada je spreman, bez belog bljeska
 *  - klik na link odmah pokreće navigaciju, a stara stranica ostaje vidljiva dok nova ne bude spremna
 *  - stranica se priprema unapred kada korisnik pređe mišem ili dodirne link
 */
(function () {
  if (window.gcReady) return; // skripta je pozvana i iz <head> i iz <helmet>
  var d = document, root = d.documentElement, isTop = window.parent === window;

  // Prazan objekat sprečava runtime da ponovo preuzima ceo HTML. Editoru (iframe) je to preuzimanje
  // potrebno, a izvezeni paket već ima svoj __resources, pa se u ta dva slučaja ništa ne menja.
  if (isTop && !window.__resources) window.__resources = {};
  // Ove stranice ne koriste slike iz starog sidecar fajla od 394 KB (njega koristi svetla verzija).
  window.GC_SLOT_STATE = '.gc-slots.state.json';

  /* ---------- prikaz sadržaja ---------- */
  window.gcReady = function () {
    if (!root.classList.contains('gc-ready') && performance.mark) performance.mark('gc-ready');
    root.classList.add('gc-ready');
  };
  setTimeout(window.gcReady, 3000); // osigurač: stranica nikada ne ostaje nevidljiva

  window.gcWhenReady = function (ids, cb) {
    var start = Date.now(), hash = location.hash.slice(1);
    (function tick() {
      var ok = ids.every(function (id) { return d.getElementById(id); }) && (!hash || d.getElementById(hash));
      if (!ok && Date.now() - start < 450) { setTimeout(tick, 16); return; }
      var wait = [customElements.whenDefined('iconify-icon')];
      if (d.fonts && d.fonts.ready) wait.push(d.fonts.ready);
      Promise.race([Promise.all(wait), new Promise(function (r) { setTimeout(r, 160); })]).then(cb);
    })();
  };

  /* ---------- skripte koje smeju da se učitaju tek posle šablona ----------
   * Dok je sirovi <x-dc> šablon u DOM-u, image-slot bi tražio doslovne adrese
   * tipa „{{ v.src }}“. Zato se ove dve skripte pokreću tek kad runtime zameni šablon. */
  var late = new MutationObserver(function () {
    if (!d.getElementById('dc-root')) return;
    late.disconnect();
    ['icons.js', 'image-slot.js'].forEach(function (src) {
      var s = d.createElement('script');
      s.src = src;
      s.async = false;
      d.head.appendChild(s);
    });
  });
  late.observe(root, { childList: true, subtree: true });

  /* ---------- položaj skrola pri povratku ---------- */
  var scrollKey = function () { return 'gc-scroll:' + location.pathname + location.search; };
  try { history.scrollRestoration = 'manual'; } catch (e) {}
  window.addEventListener('pagehide', function () {
    try { sessionStorage.setItem(scrollKey(), String(window.scrollY)); } catch (e) {}
  });
  window.gcRestoreScroll = function (fallback) {
    try {
      var nav = (performance.getEntriesByType && performance.getEntriesByType('navigation')[0]) || {};
      var saved = sessionStorage.getItem(scrollKey());
      if (nav.type === 'back_forward' && saved !== null) { window.scrollTo(0, +saved); return; }
    } catch (e) {}
    if (fallback) fallback();
  };

  /* ---------- prelazi ---------- */
  function otherPage(a) {
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return null;
    var u;
    try { u = new URL(a.getAttribute('href'), location.href); } catch (e) { return null; }
    if (u.origin !== location.origin || !/\.html$/i.test(u.pathname)) return null;
    if (u.pathname === location.pathname && u.search === location.search) return null;
    return u;
  }

  var leavingTimer;
  d.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (!otherPage(e.target.closest && e.target.closest('a[href]'))) return;
    root.classList.add('gc-leaving'); // tanka linija na vrhu, vidi se samo na sporoj vezi
    clearTimeout(leavingTimer);
    leavingTimer = setTimeout(function () { root.classList.remove('gc-leaving'); }, 8000);
  });
  window.addEventListener('pageshow', function () {
    root.classList.remove('gc-leaving');
    window.gcReady();
  });

  /* ---------- priprema sledeće stranice ---------- */
  var saveData = navigator.connection && navigator.connection.saveData;
  if (saveData) return;
  if (isTop && window.HTMLScriptElement && HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules')) {
    // Chrome/Edge: stranica se pripremi unapred pri zadržavanju miša ili dodiru, pa se otvara trenutno.
    // Veze između usluga se ne pripremaju jer stranica usluge njih menja bez ponovnog učitavanja.
    var selector = /usluga[^\/]*$/i.test(location.pathname) ? 'a[href*=".html"]:not([href*="?u="])' : 'a[href*="?u="]';
    var rules = d.createElement('script');
    rules.type = 'speculationrules';
    rules.textContent = JSON.stringify({ prerender: [{ source: 'document', where: { selector_matches: selector }, eagerness: 'moderate' }] });
    d.head.appendChild(rules);
  } else {
    // Ostali pregledači: unapred se preuzima samo HTML.
    var seen = {};
    var prefetch = function (e) {
      var u = otherPage(e.target.closest && e.target.closest('a[href]'));
      if (!u) return;
      u.hash = '';
      if (seen[u.href]) return;
      seen[u.href] = 1;
      var l = d.createElement('link');
      l.rel = 'prefetch';
      l.href = u.href;
      d.head.appendChild(l);
    };
    d.addEventListener('pointerover', prefetch, { passive: true });
    d.addEventListener('touchstart', prefetch, { passive: true });
  }
})();
