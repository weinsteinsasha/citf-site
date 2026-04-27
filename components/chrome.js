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

      /* lang pill mounted INSIDE the Tilda nav, just before the social icons */
      ".citf-navlangs{display:inline-flex;align-items:center;gap:0;font-family:'Syne',Arial,sans-serif;background:#0e0e0e;border:1px solid #333;border-radius:999px;padding:3px 4px;margin-right:8px;vertical-align:middle}" +
      ".citf-navlangs button{font-family:inherit;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;padding:5px 9px;color:#888;font-weight:700;background:none;border:0;cursor:pointer;border-radius:999px;transition:color 0.15s,background 0.15s}" +
      ".citf-navlangs button:hover{color:#fff}" +
      ".citf-navlangs button.active{background:#FFA806;color:#000}" +
      ".citf-navlangs.floating{position:fixed;top:40px;right:14px;z-index:9999;background:rgba(17,17,17,0.94);box-shadow:0 4px 16px rgba(0,0,0,0.4);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}" +

      /* floating Buy Ticket button — bottom-right, configurable per page via window.CITF_BUY */
      ".citf-buyfab{position:fixed;bottom:22px;right:22px;z-index:9998;display:inline-flex;align-items:center;gap:8px;background:#FFA806;color:#000 !important;font-family:'Syne',Arial,sans-serif;font-size:13px;letter-spacing:0.16em;text-transform:uppercase;font-weight:800;padding:14px 22px;border-radius:999px;text-decoration:none !important;box-shadow:0 8px 28px rgba(255,168,6,0.35),0 4px 12px rgba(0,0,0,0.4);transition:transform 0.15s ease,background 0.15s ease}" +
      ".citf-buyfab:hover{background:#ffbd38;transform:translateY(-2px)}" +
      ".citf-buyfab svg{width:14px;height:14px;fill:currentColor}" +
      ".citf-buyfab small{display:block;font-size:9px;letter-spacing:0.14em;color:rgba(0,0,0,0.6);font-weight:600;margin-top:2px;text-transform:none}" +
      ".citf-buyfab-inner{display:flex;flex-direction:column;align-items:flex-start}" +
      "@media(max-width:520px){.citf-buyfab{bottom:14px;right:14px;padding:12px 16px;font-size:11px;letter-spacing:0.12em}}" +

      /* hide Tilda's partners image (it's a fixed bitmap that doesn't adapt and includes St. Raphael); we render our own below */
      "img[imgfield='tn_img_1741704123132']{display:none !important}" +
      "img[imgfield='tn_img_1741704123132']+*{display:none !important}" +

      /* custom adaptive partners block — replaces the bitmap */
      ".citf-partners{padding:60px 32px 30px;background:#0a0a0a;border-top:1px solid #1c1c1c}" +
      ".citf-partners-inner{max-width:1280px;margin:0 auto}" +
      ".citf-partners-row{display:flex;flex-wrap:wrap;gap:36px 56px;justify-content:center;align-items:flex-start}" +
      ".citf-partner-item{text-align:center;min-width:120px}" +
      ".citf-partner-role{font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#737373;margin-bottom:6px;font-family:'Syne',Arial,sans-serif;font-weight:600}" +
      ".citf-partner-name{font-size:14px;color:#ddd;font-weight:700;letter-spacing:-0.005em;font-family:'Syne',Arial,sans-serif}" +
      ".citf-partners-divider{display:block;text-align:center;font-size:10px;letter-spacing:0.22em;color:#555;text-transform:uppercase;margin:36px 0 24px;font-family:'Syne',Arial,sans-serif}" +
      "@media(max-width:600px){.citf-partners{padding:40px 22px 20px}.citf-partners-row{gap:22px 28px}.citf-partner-item{min-width:0;flex:1 1 40%}}" +
      "";
    document.head.appendChild(s);
  }

  // Build the EN | RU | EL pill markup (used both as floating fallback and inside nav)
  function makeLangPillElement(extraClass) {
    var pill = document.createElement('div');
    pill.className = 'citf-navlangs' + (extraClass ? ' ' + extraClass : '');
    pill.setAttribute('role', 'tablist');
    pill.innerHTML =
      '<button data-citf-setlang="en">EN</button>' +
      '<button data-citf-setlang="ru">RU</button>' +
      '<button data-citf-setlang="gr">EL</button>';
    pill.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        setLang(b.getAttribute('data-citf-setlang'));
      });
    });
    return pill;
  }

  // Floating fallback pill — visible only until the chrome arrives and we move it into the nav.
  function injectFallbackLangPill() {
    if (document.querySelector('.citf-navlangs.floating')) return;
    document.body.appendChild(makeLangPillElement('floating'));
  }

  // After chrome mounts, find the social-icons block in the Tilda header and
  // place the lang pill immediately to the left of it. Removes the floating one.
  function attachLangSwitcherToNav() {
    var floating = document.querySelector('.citf-navlangs.floating');
    // Tilda nav has rec841567062 (T396) which holds the small icons & subscribe button.
    // Look for a known target: the email/social anchors.
    // Strategy: pick the first `<a>` whose href starts with mailto: or fb/instagram inside the header.
    var header = document.getElementById('t-header');
    if (!header) return;
    var anchorImg = header.querySelector('a[href^="mailto:"],a[href*="instagram.com"],a[href*="facebook.com"]');
    if (!anchorImg) return;
    // Walk up to find the parent that holds the social icon row
    var socialRow = anchorImg.closest('[class*="t-col"], .tn-elem, .t396__elem') || anchorImg.parentElement;
    if (!socialRow) return;
    var pill = makeLangPillElement();
    socialRow.parentNode.insertBefore(pill, socialRow);
    if (floating) floating.remove();
    setLang(initialLang());
  }

  // Floating "Buy Ticket" FAB. Page configures via window.CITF_BUY before chrome.js loads:
  //   window.CITF_BUY = { url: '...', en: 'Buy ticket', ru: 'Купить билет', gr: 'Αγοράστε', sub_en: 'from €30', ... }
  function injectBuyFab() {
    if (document.querySelector('.citf-buyfab')) return;
    var cfg = (window.CITF_BUY && typeof window.CITF_BUY === 'object') ? window.CITF_BUY : null;
    if (!cfg || !cfg.url) return;
    var a = document.createElement('a');
    a.className = 'citf-buyfab';
    a.href = cfg.url;
    a.target = '_blank';
    a.rel = 'noopener';
    var inner =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 7H3a1 1 0 0 0-1 1v3a2 2 0 0 1 0 4v3a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-3a2 2 0 0 1 0-4V8a1 1 0 0 0-1-1Zm-7 8h-2v-2h2v2Zm0-4h-2V9h2v2Z"/></svg>' +
      '<span class="citf-buyfab-inner">' +
        '<span data-en>'+ (cfg.en || 'Buy ticket') +'</span>' +
        '<span data-ru>'+ (cfg.ru || 'Купить билет') +'</span>' +
        '<span data-gr>'+ (cfg.gr || 'Εισιτήριο') +'</span>' +
        (cfg.sub_en || cfg.sub_ru || cfg.sub_gr ?
          '<small data-en>'+ (cfg.sub_en || '') +'</small>' +
          '<small data-ru>'+ (cfg.sub_ru || '') +'</small>' +
          '<small data-gr>'+ (cfg.sub_gr || '') +'</small>'
        : '') +
      '</span>';
    a.innerHTML = inner;
    document.body.appendChild(a);
  }

  // Custom adaptive partners block — replaces Tilda's fixed bitmap.
  // Removed: St. Raphael (per direction).
  var PARTNERS = [
    {role_en:'Under the Auspices', role_ru:'Под патронажем', role_gr:'Υπό την Αιγίδα', name:'Mayor of Limassol', name_ru:'Мэра Лимассола', name_gr:'Δήμου Λεμεσού'},
    {role_en:'Main Partner', role_ru:'Главный партнёр', role_gr:'Κύριος Συνεργάτης', name:'Pattihio Theatre', name_ru:'Театр Паттихио', name_gr:'Παττίχειο Θέατρο'},
    {role_en:'Sponsor', role_ru:'Спонсор', role_gr:'Χορηγός', name:'ASG Leasing'},
    {role_en:'Official Flight Partner', role_ru:'Авиаперевозчик', role_gr:'Επίσημος Αεροπορικός Συνεργάτης', name:'Cyprus Airways'},
    {role_en:'Media Partner', role_ru:'Медиа-партнёр', role_gr:'Χορηγός Επικοινωνίας', name:'Ο Φιλελεύθερος'},
    {role_en:'Media Partner', role_ru:'Медиа-партнёр', role_gr:'Χορηγός Επικοινωνίας', name:'ZIMA'},
    {role_en:'Venue', role_ru:'Площадка', role_gr:'Χώρος', name:'ETKO'},
    {role_en:'Official Hotel', role_ru:'Официальный отель', role_gr:'Επίσημο Ξενοδοχείο', name:'Crowne Plaza'},
    {role_en:'Event Partner', role_ru:'Партнёр события', role_gr:'Συνεργάτης Εκδήλωσης', name:'Allegro'},
    {role_en:'Orchestra', role_ru:'Оркестр', role_gr:'Ορχήστρα', name:'Commandaria Orchestra', name_ru:'Оркестр Commandaria', name_gr:'Ορχήστρα Κομμανταρία'},
    {role_en:'Flowers', role_ru:'Цветы', role_gr:'Λουλούδια', name:'Be Bloomy'},
    {role_en:'Event Partner', role_ru:'Партнёр события', role_gr:'Συνεργάτης Εκδήλωσης', name:'AYA Cooks'}
  ];

  function injectPartnersBlock() {
    if (document.querySelector('.citf-partners')) return;
    var sec = document.createElement('section');
    sec.className = 'citf-partners';
    var inner = document.createElement('div');
    inner.className = 'citf-partners-inner';

    var divider = document.createElement('div');
    divider.className = 'citf-partners-divider';
    divider.innerHTML =
      '<span data-en>With the support of</span>' +
      '<span data-ru>При поддержке</span>' +
      '<span data-gr>Με την υποστήριξη</span>';
    inner.appendChild(divider);

    var row = document.createElement('div');
    row.className = 'citf-partners-row';
    PARTNERS.forEach(function (p) {
      var item = document.createElement('div');
      item.className = 'citf-partner-item';
      item.innerHTML =
        '<div class="citf-partner-role" data-en>'+ p.role_en +'</div>' +
        '<div class="citf-partner-role" data-ru>'+ (p.role_ru || p.role_en) +'</div>' +
        '<div class="citf-partner-role" data-gr>'+ (p.role_gr || p.role_en) +'</div>' +
        '<div class="citf-partner-name" data-en>'+ p.name +'</div>' +
        '<div class="citf-partner-name" data-ru>'+ (p.name_ru || p.name) +'</div>' +
        '<div class="citf-partner-name" data-gr>'+ (p.name_gr || p.name) +'</div>';
      row.appendChild(item);
    });
    inner.appendChild(row);
    sec.appendChild(inner);

    // Insert just before the footer mount so it lives BETWEEN page content and the Tilda footer
    var footerMount = document.getElementById('citf-footer-mount') || document.getElementById('t-footer');
    if (footerMount && footerMount.parentNode) {
      footerMount.parentNode.insertBefore(sec, footerMount);
    } else {
      // fallback to end of #allrecords
      var ar = document.getElementById('allrecords') || document.body;
      ar.appendChild(sec);
    }
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

        // Tilda's lazyload swaps src<-data-original on scroll. On our pages
        // the lazy-load init isn't catching properly, so partner logos and
        // other images stay as 20px-wide placeholders. Force the swap now.
        node.querySelectorAll('img[data-original]').forEach(function (img) {
          var full = img.getAttribute('data-original');
          if (full) img.setAttribute('src', full);
        });

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
    document.querySelectorAll('.citf-navlangs button, [data-citf-setlang]').forEach(function (b) {
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
    // 0) i18n CSS + initial language SYNCHRONOUSLY so the page never flashes
    //    all three language versions.
    injectInlineCSS();
    setLang(initialLang());
    // 0.7) Floating Buy Ticket FAB if page configured one (instant, no chrome dep)
    injectBuyFab();

    // 1) Tilda parent DOM (body.t-body + #allrecords wrapper)
    prepareBody();
    ensureAllrecords();

    // 2) Tilda CSS bundles (parallel, non-blocking)
    injectAllCSS();

    // 3) Mount header + footer IMMEDIATELY — do NOT wait for the heavy Tilda
    //    JS bundle. The static HTML + CSS render the chrome correctly on its
    //    own; Tilda JS only adds extra interactivity (animations, popups) that
    //    we re-init in the background once it loads.
    await Promise.all([
      mountFragment('citf-header-mount', '/components/header.html'),
      mountFragment('citf-footer-mount', '/components/footer.html')
    ]);
    // 3.5) Inject our adaptive partners block between page content and footer,
    //      and move the lang pill into the nav (right next to the social icons).
    injectPartnersBlock();
    attachLangSwitcherToNav();
    // 3.6) If for some reason the lang pill couldn't be attached to the nav,
    //      show the floating fallback (only after a short delay so it never
    //      flashes when chrome attaches normally).
    setTimeout(function () {
      if (!document.querySelector('.citf-navlangs')) injectFallbackLangPill();
    }, 600);

    // 4) Apply language again now that all i18n nodes are in DOM
    setLang(initialLang());
    bindLangSwitcher();

    // 5) NOW load Tilda JS in the background. The chrome is already visible;
    //    when the bundle resolves we re-init blocks (animations, popups, scale).
    loadTildaJS()
      .then(function () {
        setTimeout(function () {
          reinitTildaBlocks();
          bindLangSwitcher();
        }, 50);
      })
      .catch(function (e) { console.warn('[citf chrome] tilda bundle load error', e); });

    window.addEventListener('resize', function () { reinitTildaBlocks(); });
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
