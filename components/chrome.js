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
    injectInlineCSS();
  }

  // i18n CSS + visible lang-toggle pill styles. Injected synchronously so the
  // page never flashes all three language versions at once.
  function injectInlineCSS() {
    if (document.getElementById('citf-i18n-css')) return;
    var s = document.createElement('style');
    s.id = 'citf-i18n-css';
    s.textContent = "" +
      /* hide inactive language nodes */
      "html[data-lang=en] [data-ru],html[data-lang=en] [data-gr]," +
      "html[data-lang=ru] [data-en],html[data-lang=ru] [data-gr]," +
      "html[data-lang=gr] [data-en],html[data-lang=gr] [data-ru]{display:none !important}" +

      /* visible lang toggle pill — sits BELOW the marquee (top:40) so it never covers menu */
      ".citf-langpill{position:fixed;top:40px;right:14px;z-index:9999;display:inline-flex;align-items:center;gap:0;background:rgba(17,17,17,0.94);border:1px solid #FFA806;border-radius:999px;padding:3px 4px;font-family:'Syne',Arial,sans-serif;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);box-shadow:0 4px 16px rgba(0,0,0,0.4)}" +
      ".citf-langpill button{font-family:inherit;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;padding:5px 10px;color:#888;font-weight:700;background:none;border:0;cursor:pointer;border-radius:999px;transition:color 0.15s,background 0.15s}" +
      ".citf-langpill button:hover{color:#fff}" +
      ".citf-langpill button.active{background:#FFA806;color:#000}" +
      "@media(max-width:520px){.citf-langpill{top:36px;right:8px;padding:2px 3px}.citf-langpill button{padding:4px 8px;font-size:10px}}" +
      "";
    document.head.appendChild(s);
  }

  // Build the visible language-toggle pill (always available, not dependent on Tilda chrome)
  function injectLangPill() {
    if (document.querySelector('.citf-langpill')) return;
    var pill = document.createElement('div');
    pill.className = 'citf-langpill';
    pill.setAttribute('role', 'tablist');
    pill.innerHTML =
      '<button data-citf-setlang="en">EN</button>' +
      '<button data-citf-setlang="ru">RU</button>' +
      '<button data-citf-setlang="gr">EL</button>';
    document.body.appendChild(pill);
    pill.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        setLang(b.getAttribute('data-citf-setlang'));
      });
    });
  }

  function loadTildaJS() {
    // Load sequentially so dependencies (jquery first) resolve in order
    return TILDA_JS.reduce(function (acc, src) {
      return acc.then(function () { return injectScript(src); });
    }, Promise.resolve());
  }

  // Tilda CSS keys on body.t-body and #allrecords ancestors. Set those up so
  // the chrome's fonts, sizes, and #allrecords-scoped selectors apply.
  function prepareBody() {
    document.body.classList.add('t-body');
    document.body.style.margin = '0';
  }

  // Wrap ALL existing body children in <div id="allrecords"> so Tilda's
  // '#allrecords .r', '#allrecords a' and similar selectors apply to the
  // chrome AND we keep the page's natural document order
  // (header-mount → page content → footer-mount).
  function ensureAllrecords() {
    var ar = document.getElementById('allrecords');
    if (ar) return ar;
    ar = document.createElement('div');
    ar.id = 'allrecords';
    ar.className = 't-records';
    ar.setAttribute('data-tilda-export', 'yes');
    ar.setAttribute('data-tilda-project-id', '8561442');
    ar.setAttribute('data-tilda-formskey', 'b4653a09f154d821fd96e21128561442');
    // Move every existing body child into ar (preserves order)
    while (document.body.firstChild) {
      ar.appendChild(document.body.firstChild);
    }
    document.body.appendChild(ar);
    return ar;
  }

  // Fetch chrome HTML and replace the slot in-place (the slot is already
  // inside #allrecords because we wrapped the whole body). Re-executes inline
  // scripts so Tilda's t396_init / t1003_init / t1093__init fire.
  function mountFragment(slotId, url) {
    var slot = document.getElementById(slotId);
    if (!slot) return Promise.resolve();
    return fetch(url, { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.text() : Promise.reject(new Error(slotId + ' ' + r.status)); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var node = doc.body.firstElementChild || doc.body.firstChild;
        if (!node) throw new Error('empty fragment ' + slotId);
        slot.parentNode.replaceChild(node, slot);

        // Re-execute inline scripts (DOMParser disables them) by cloning into live <script> nodes.
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
    document.querySelectorAll('.citf-langpill button, [data-citf-setlang]').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-citf-setlang') === l);
    });
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
    // 0) Inject i18n CSS + lang-pill styles SYNCHRONOUSLY so the page never
    //    flashes all three language versions before chrome arrives.
    injectInlineCSS();
    setLang(initialLang());
    injectLangPill();
    setLang(initialLang());

    // 1) Prepare Tilda parent DOM (body.t-body + #allrecords wrapper)
    prepareBody();
    ensureAllrecords();

    // 2) Tilda CSS bundles (the ticker/nav/footer styles)
    injectAllCSS();
    // 3) Tilda JS bundle (must finish before re-running inline scripts that call t396_init etc.)
    try { await loadTildaJS(); } catch (e) { console.warn('[citf chrome] tilda bundle load error', e); }
    // 4) Mount header + footer (slots are already in document order inside #allrecords)
    await Promise.all([
      mountFragment('citf-header-mount', '/components/header.html'),
      mountFragment('citf-footer-mount', '/components/footer.html')
    ]);
    // 5) Apply initial language again now that Tilda menu is in DOM
    setLang(initialLang());
    // 6) Force Tilda block init in case inline scripts didn't fire
    setTimeout(function () {
      reinitTildaBlocks();
      bindLangSwitcher();
      window.addEventListener('resize', function () { reinitTildaBlocks(); });
    }, 50);
    // 7) Final pass after window load (images, fonts, etc) so layout settles
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
