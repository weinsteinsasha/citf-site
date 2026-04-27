/* CITF shared chrome — loads the EXACT Tilda header + footer
 * (extracted verbatim from the homepage) onto any page.
 *
 * Usage on any page:
 *   <div id="citf-header-mount"></div>
 *     ... page content ...
 *   <div id="citf-footer-mount"></div>
 *   <script src="/components/chrome.js" defer></script>
 *
 * The script:
 *   1. Injects the Tilda CSS bundles the chrome depends on (idempotent).
 *   2. Loads the Tilda JS bundles in dependency order (jquery -> scripts ->
 *      page-blocks -> animation/popup/forms/etc).
 *   3. Fetches /components/header.html and /components/footer.html
 *      (verbatim copies from the homepage Tilda export) and inserts
 *      them at the mount points.
 *   4. Re-executes the inline <script> tags inside the fetched chrome
 *      so Tilda's t396_init / t1003_init / t1093__init callbacks fire.
 *
 * To update the chrome site-wide: re-export header/footer from the
 * homepage and overwrite components/header.html / components/footer.html.
 */
(function () {
  'use strict';

  var TILDA_CSS = [
    '/css/tilda-grid-3.0.min.css',
    '/css/tilda-blocks-page121413356.min.css?t=1776697778',
    '/css/tilda-animation-2.0.min.css',
    '/css/tilda-popup-1.1.min.css',
    '/css/tilda-forms-1.0.min.css',
    '/css/custom.css?t=1776697778'
  ];

  var TILDA_JS = [
    'https://neo.tildacdn.com/js/tilda-fallback-1.0.min.js',
    '/js/tilda-polyfill-1.0.min.js',
    '/js/jquery-1.10.2.min.js',
    '/js/tilda-scripts-3.0.min.js',
    '/js/tilda-blocks-page121413356.min.js?t=1776697778',
    '/js/lazyload-1.3.min.export.js',
    '/js/tilda-animation-2.0.min.js',
    '/js/tilda-zero-1.1.min.js',
    '/js/tilda-popup-1.0.min.js',
    '/js/tilda-forms-1.0.min.js',
    '/js/tilda-zero-forms-1.0.min.js',
    '/js/tilda-animation-ext-1.0.min.js',
    '/js/tilda-animation-sbs-1.0.min.js',
    '/js/tilda-zero-scale-1.0.min.js',
    '/js/tilda-zero-video-1.0.min.js',
    '/js/tilda-events-1.0.min.js'
  ];

  function injectCSS(href) {
    if (document.querySelector('link[href="' + href + '"]')) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    l.type = 'text/css';
    l.media = 'all';
    document.head.appendChild(l);
  }

  function injectScript(src) {
    return new Promise(function (resolve, reject) {
      // skip if already on page
      if (document.querySelector('script[src="' + src + '"]')) {
        resolve();
        return;
      }
      var s = document.createElement('script');
      s.src = src;
      s.async = false;          // keep load order
      s.onload = resolve;
      s.onerror = function () { console.warn('[citf chrome] failed to load', src); resolve(); };
      document.head.appendChild(s);
    });
  }

  function injectAllCSS() {
    TILDA_CSS.forEach(injectCSS);
  }

  function loadTildaJS() {
    // Load sequentially so dependencies (jquery first) resolve in order
    return TILDA_JS.reduce(function (acc, src) {
      return acc.then(function () { return injectScript(src); });
    }, Promise.resolve());
  }

  // Fetch chrome HTML and replace a mount point with it, replaying inline scripts
  function mountFragment(slotId, url) {
    var slot = document.getElementById(slotId);
    if (!slot) return Promise.resolve();
    return fetch(url, { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.text() : Promise.reject(new Error(slotId + ' ' + r.status)); })
      .then(function (html) {
        // Parse and extract the first element child (the <header> or <footer>)
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var node = doc.body.firstElementChild || doc.body.firstChild;
        if (!node) throw new Error('empty fragment ' + slotId);
        // Replace slot with the parsed node
        slot.parentNode.replaceChild(node, slot);

        // Re-execute inline scripts (DOMParser disables them) by cloning into live <script> nodes.
        // We need to do this in document order so tilda inits queue properly.
        var scripts = node.querySelectorAll('script');
        scripts.forEach(function (old) {
          var s = document.createElement('script');
          for (var i = 0; i < old.attributes.length; i++) {
            s.setAttribute(old.attributes[i].name, old.attributes[i].value);
          }
          s.text = old.textContent || '';
          old.parentNode.replaceChild(s, old);
        });
      })
      .catch(function (err) { console.warn('[citf chrome] mount failed', slotId, err); });
  }

  // Header rec ids that need t396_init / t1003_init / t1093__init to render correctly.
  // (We force these after mount in case the inline scripts inside the chrome HTML
  // didn't get a chance to run before the bundle loaded.)
  var HEADER_RECS_T396 = ['853550221', '841567060', '841567062'];
  var HEADER_REC_T1003 = '1157755106';
  var HEADER_RECS_T1093 = ['841567061', '841567063'];
  var FOOTER_RECS_T396 = ['890778214', '890781301'];

  function callIfExists(fn /*, ...args */) {
    var args = Array.prototype.slice.call(arguments, 1);
    if (typeof window[fn] === 'function') {
      try { window[fn].apply(window, args); } catch (e) { console.warn('[citf chrome]', fn, e); }
    }
  }

  function reinitTildaBlocks() {
    // ticker
    callIfExists('t1003_init', HEADER_REC_T1003, '');
    // nav rec blocks (logo+menu, mobile menu, social/buy)
    HEADER_RECS_T396.concat(FOOTER_RECS_T396).forEach(function (id) {
      callIfExists('t396_initialScale', id);
      callIfExists('t396_init', id);
    });
    // mobile menu popups
    HEADER_RECS_T1093.forEach(function (id) {
      callIfExists('t1093__init', id);
      callIfExists('t1093__initPopup', id);
    });
  }

  // Intercept Tilda's lang switcher (which redirects to /ru/ /gr/ paths) so
  // it stays on this page and toggles our data-lang i18n instead.
  var LS_KEY = 'citf_lang';
  var VALID_LANGS = ['en', 'ru', 'gr'];
  function setLang(l) {
    if (VALID_LANGS.indexOf(l) < 0) l = 'en';
    document.documentElement.setAttribute('data-lang', l);
    try { localStorage.setItem(LS_KEY, l); } catch (e) {}
    document.documentElement.lang = (l === 'gr') ? 'el' : l;
    var u = new URL(location.href);
    if (l === 'en') u.searchParams.delete('lang'); else u.searchParams.set('lang', l);
    history.replaceState(null, '', u.toString());
  }
  window.__citfSetLang = setLang;

  function initialLang() {
    var q = (new URL(location.href)).searchParams.get('lang');
    if (q && VALID_LANGS.indexOf(q) >= 0) return q;
    var saved; try { saved = localStorage.getItem(LS_KEY); } catch (e) {}
    if (saved && VALID_LANGS.indexOf(saved) >= 0) return saved;
    var b = (navigator.language || '').toLowerCase();
    if (b.indexOf('ru') === 0) return 'ru';
    if (b.indexOf('el') === 0) return 'gr';
    return 'en';
  }

  function bindLangSwitcher() {
    // Tilda lang switcher uses [data-tilda-lang] or hrefs like /ru/, /gr/, /
    var langButtons = document.querySelectorAll('[data-tilda-lang], a[href="/ru/"], a[href="/gr/"], a[href="/en/"]');
    langButtons.forEach(function (el) {
      // figure out target lang
      var t = el.getAttribute('data-tilda-lang');
      if (!t) {
        var h = el.getAttribute('href') || '';
        if (h === '/ru/' || h === '/ru') t = 'ru';
        else if (h === '/gr/' || h === '/gr') t = 'gr';
        else if (h === '/en/' || h === '/en') t = 'en';
      }
      if (!t) return;
      el.addEventListener('click', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        setLang(t);
      }, true);
    });
  }

  async function boot() {
    // 1) CSS first so the ticker/nav/footer aren't unstyled flashes
    injectAllCSS();
    // 2) Tilda JS bundle (must finish before re-running inline scripts that call t396_init etc.)
    try { await loadTildaJS(); } catch (e) { console.warn('[citf chrome] tilda bundle load error', e); }
    // 3) Mount header + footer (parallel fetch)
    await Promise.all([
      mountFragment('citf-header-mount', '/components/header.html'),
      mountFragment('citf-footer-mount', '/components/footer.html')
    ]);
    // 4) Apply initial language BEFORE forcing re-init (so Tilda lang menu shows correct active state)
    setLang(initialLang());
    // 5) Force Tilda block init in case inline scripts didn't fire
    //    (give the DOM a tick to settle first)
    setTimeout(function () {
      reinitTildaBlocks();
      bindLangSwitcher();
      // Also re-run scaling on resize (Tilda does this automatically when its own
      // page bootstraps, but on our pages we need to nudge it)
      window.addEventListener('resize', function () { reinitTildaBlocks(); });
    }, 50);
    // 6) Final pass after window load (images, fonts, etc) so layout settles
    if (document.readyState === 'complete') {
      setTimeout(reinitTildaBlocks, 200);
    } else {
      window.addEventListener('load', function () { setTimeout(reinitTildaBlocks, 200); });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
