/* CITF shared chrome — single source of truth for header + footer + i18n.
 *
 * Visual: matches the original Tilda citf.cy header layout —
 *   [ticker]
 *   [ 2-column menu | central logo | lang + social ]
 *
 * Usage on any page:
 *   <link rel="preconnect" href="https://fonts.googleapis.com">
 *   <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Unbounded:wght@400;500;600;700&display=swap" rel="stylesheet">
 *   <div id="citf-header-mount"></div>
 *     ... page content ...
 *   <div id="citf-footer-mount"></div>
 *   <script src="/components/chrome.js" defer></script>
 *
 * To update header/footer site-wide: edit ONLY this file.
 * Marquee message can be overridden per-page by setting window.CITF_MARQUEE
 * before this script loads.
 */
(function(){
  'use strict';

  var CSS = "" +
  ":root{--citf-bg:#181818;--citf-fg:#eeeeee;--citf-muted:#737373;--citf-gold:#FFA806;}" +
  /* base i18n */
  "html[data-lang=en] [data-ru],html[data-lang=en] [data-gr]," +
  "html[data-lang=ru] [data-en],html[data-lang=ru] [data-gr]," +
  "html[data-lang=gr] [data-en],html[data-lang=gr] [data-ru]{display:none !important}" +

  /* TICKER */
  ".citf-ticker{position:fixed;top:0;left:0;right:0;z-index:101;height:32px;background:#0e0e0e;color:#FFA806;border-bottom:1px solid #222;overflow:hidden;font-family:'Syne',Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;display:flex;align-items:center}" +
  ".citf-ticker-track{display:inline-flex;white-space:nowrap;animation:citf-ticker-roll 60s linear infinite;padding-left:100%}" +
  "@keyframes citf-ticker-roll{0%{transform:translate3d(0,0,0)}100%{transform:translate3d(-100%,0,0)}}" +

  /* NAV — 3-zone grid: menu(2col) | logo | right-stack */
  ".citf-nav{position:fixed;top:32px;left:0;right:0;z-index:100;background:rgba(24,24,24,0.94);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,0.06);font-family:'Syne',Arial,sans-serif}" +
  ".citf-nav-grid{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:18px 32px;gap:32px;max-width:1440px;margin:0 auto}" +

  /* logo block (center) */
  ".citf-nav-logo{display:flex;align-items:center;gap:14px;text-decoration:none;justify-content:center}" +
  ".citf-nav-logo img{height:54px;width:auto;display:block}" +
  ".citf-nav-logo-text{font-weight:800;letter-spacing:0.04em;text-transform:uppercase;font-size:9px;line-height:1.25;color:#eee}" +
  ".citf-nav-logo-text strong{color:#FFA806;display:block;font-size:14px;letter-spacing:0.18em;margin-bottom:2px}" +

  /* left menu — 2 columns of links in gold */
  ".citf-nav-menu{display:grid;grid-template-columns:auto auto;gap:6px 36px;justify-content:start;align-items:center}" +
  ".citf-nav-menu a{font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#FFA806;font-weight:700;padding:4px 0;text-decoration:none;transition:color 0.15s}" +
  ".citf-nav-menu a:hover{color:#fff}" +
  ".citf-nav-menu a.citf-nav-cocktail{color:#000;background:#FFA806;padding:5px 12px;border-radius:999px;letter-spacing:0.1em;justify-self:start}" +
  ".citf-nav-menu a.citf-nav-cocktail:hover{background:#ffbd38;color:#000}" +

  /* right block — lang on top, social on bottom */
  ".citf-nav-right{display:flex;flex-direction:column;align-items:flex-end;gap:10px;justify-self:end}" +
  ".citf-lang-switch{display:flex;align-items:center;gap:0;font-size:11px;letter-spacing:0.18em;text-transform:uppercase}" +
  ".citf-lang-switch button{font-family:inherit;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;padding:2px 10px;color:#888;font-weight:700;background:none;border:0;cursor:pointer;transition:color 0.15s}" +
  ".citf-lang-switch button:hover{color:#fff}" +
  ".citf-lang-switch button.active{color:#FFA806}" +
  ".citf-lang-switch .citf-lang-sep{color:#444;padding:0 0;font-weight:300}" +
  ".citf-nav-social{display:flex;gap:8px}" +
  ".citf-nav-social a{display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border:1px solid #444;border-radius:50%;color:#FFA806;font-size:13px;font-weight:700;letter-spacing:0;transition:background 0.15s,color 0.15s,border-color 0.15s;text-decoration:none}" +
  ".citf-nav-social a:hover{background:#FFA806;color:#000;border-color:#FFA806}" +

  /* mobile burger (hidden by default) */
  ".citf-nav-toggle{display:none;flex-direction:column;gap:4px;cursor:pointer;padding:8px;background:none;border:0}" +
  ".citf-nav-toggle span{display:block;width:22px;height:2px;background:#eee;transition:0.2s}" +

  /* push body content below fixed chrome (32 ticker + ~110 nav at desktop) */
  "body{padding-top:148px}" +

  /* RESPONSIVE */
  "@media(max-width:1180px){" +
  ".citf-nav-grid{grid-template-columns:auto 1fr auto;padding:14px 22px;gap:18px}" +
  ".citf-nav-logo img{height:44px}" +
  ".citf-nav-logo-text{display:none}" +
  ".citf-nav-menu{display:none;position:absolute;top:100%;left:0;right:0;flex-direction:column;background:#181818;border-bottom:1px solid #222;padding:6px 0;grid-template-columns:1fr;gap:0}" +
  ".citf-nav-menu.open{display:grid}" +
  ".citf-nav-menu a{padding:14px 22px;border-bottom:1px solid #1f1f1f;font-size:12px}" +
  ".citf-nav-menu a.citf-nav-cocktail{margin:10px 22px;text-align:center;justify-self:stretch}" +
  ".citf-nav-toggle{display:flex;order:-1}" +
  ".citf-nav-logo{order:0;justify-content:flex-start}" +
  ".citf-nav-right{order:1;flex-direction:row;align-items:center;gap:14px}" +
  ".citf-nav-social{display:none}" +
  "body{padding-top:108px}" +
  "}" +
  "@media(max-width:520px){" +
  ".citf-nav-grid{padding:12px 16px;gap:10px}" +
  ".citf-lang-switch button{padding:2px 6px;font-size:10px}" +
  ".citf-nav-logo img{height:38px}" +
  "}" +

  /* FOOTER */
  ".citf-footer{padding:64px 32px 28px;background:#0a0a0a;border-top:1px solid #1c1c1c;font-family:'Syne',Arial,sans-serif;color:#eee}" +
  ".citf-footer-inner{max-width:1280px;margin:0 auto;display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:40px 56px;margin-bottom:44px}" +
  ".citf-footer-brand h4{font-size:18px;font-weight:800;margin:0 0 12px;color:#FFA806;letter-spacing:0.02em}" +
  ".citf-footer-brand p{font-size:13px;line-height:1.6;color:#999;max-width:380px;margin:0 0 16px}" +
  ".citf-footer-brand .citf-footer-contact{font-size:13px;color:#bbb}" +
  ".citf-footer-brand .citf-footer-contact a{color:#FFA806;text-decoration:none}" +
  ".citf-footer-col h5{font-size:11px;letter-spacing:0.2em;color:#737373;text-transform:uppercase;margin:0 0 18px;font-weight:700}" +
  ".citf-footer-col a{display:block;font-size:13px;color:#bbb;margin-bottom:10px;text-decoration:none;transition:color 0.15s}" +
  ".citf-footer-col a:hover{color:#FFA806}" +
  ".citf-footer-bottom{max-width:1280px;margin:0 auto;padding-top:24px;border-top:1px solid #1c1c1c;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px;font-size:11px;letter-spacing:0.1em;color:#737373;text-transform:uppercase}" +
  ".citf-footer-social{display:flex;gap:14px}" +
  ".citf-footer-social a{color:#888;font-size:11px;letter-spacing:0.18em;text-decoration:none}" +
  ".citf-footer-social a:hover{color:#FFA806}" +
  "@media(max-width:880px){.citf-footer{padding:50px 22px 22px}.citf-footer-inner{grid-template-columns:1fr 1fr;gap:32px;margin-bottom:32px}.citf-footer-brand{grid-column:1/-1}}" +
  "@media(max-width:520px){.citf-footer-inner{grid-template-columns:1fr}}" +
  "";

  // -------------------------------------------------------- HEADER / FOOTER HTML
  var defaultMarquee = {
    en: "SHE IS HERE: Fanny Ardant, October 2, 2026 · Pattihio Theatre, Limassol   •   Cocktail with Fanny Ardant, October 3 · AYA Cooks · 18:00   •   ",
    ru: "SHE IS HERE: Фанни Ардан, 2 октября 2026 · Театр Паттихио, Лимассол   •   Коктейль с Фанни Ардан, 3 октября · AYA Cooks · 18:00   •   ",
    gr: "SHE IS HERE: Φανί Αρντάν, 2 Οκτωβρίου 2026 · Παττίχειο Θέατρο, Λεμεσός   •   Κοκτέιλ με τη Φανί Αρντάν, 3 Οκτωβρίου · AYA Cooks · 18:00   •   "
  };
  var marquee = (window.CITF_MARQUEE && typeof window.CITF_MARQUEE === 'object') ? window.CITF_MARQUEE : defaultMarquee;
  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function trackHTML(text){ return esc(text)+esc(text); }

  var HEADER_HTML =
    '<div class="citf-ticker" aria-hidden="true">' +
      '<div class="citf-ticker-track" data-en>'+ trackHTML(marquee.en) +'</div>' +
      '<div class="citf-ticker-track" data-ru>'+ trackHTML(marquee.ru) +'</div>' +
      '<div class="citf-ticker-track" data-gr>'+ trackHTML(marquee.gr) +'</div>' +
    '</div>' +
    '<nav class="citf-nav">' +
      '<div class="citf-nav-grid">' +
        /* LEFT — 2-col menu */
        '<div class="citf-nav-menu" id="citfNavMenu">' +
          '<a href="/" data-en>Shows &amp; Event</a><a href="/" data-ru>Афиша</a><a href="/" data-gr>Παραστάσεις</a>' +
          '<a href="/friends-club" data-en>Friends Club</a><a href="/friends-club" data-ru>Клуб друзей</a><a href="/friends-club" data-gr>Friends Club</a>' +

          '<a href="/about" data-en>About</a><a href="/ru/about" data-ru>О нас</a><a href="/gr/about" data-gr>Σχετικά</a>' +
          '<a href="/contact" data-en>Contact</a><a href="/contact" data-ru>Контакты</a><a href="/contact" data-gr>Επικοινωνία</a>' +

          '<a href="/gallery" data-en>Gallery</a><a href="/gallery" data-ru>Галерея</a><a href="/gallery" data-gr>Gallery</a>' +
          '<a href="/press" data-en>Press</a><a href="/press" data-ru>Пресса</a><a href="/press" data-gr>Τύπος</a>' +

          '<a class="citf-nav-cocktail" href="/2026/cocktail-with-fanny-ardant"><span data-en>Cocktail · Oct 3</span><span data-ru>Коктейль · 3 окт</span><span data-gr>Κοκτέιλ · 3 Οκτ</span></a>' +
          '<a href="/journal" data-en>Journal</a><a href="/journal" data-ru>Журнал</a><a href="/journal" data-gr>Περιοδικό</a>' +
        '</div>' +

        /* CENTER — logo */
        '<a class="citf-nav-logo" href="/" aria-label="CITF Home">' +
          '<img src="/images/tild3034-3531-4332-b433-633065323761__svg_1731001362156.svg" alt="" onerror="this.style.display=\'none\'">' +
          '<div class="citf-nav-logo-text">' +
            '<strong>CITF</strong>' +
            '<span data-en>Cyprus International<br>Theatre Festival</span>' +
            '<span data-ru>Кипрский международный<br>театральный фестиваль</span>' +
            '<span data-gr>ΔΙΕΘΝΕΣ ΦΕΣΤΙΒΑΛ<br>ΘΕΑΤΡΟΥ ΚΥΠΡΟΥ</span>' +
          '</div>' +
        '</a>' +

        /* RIGHT — lang + social */
        '<div class="citf-nav-right">' +
          '<div class="citf-lang-switch" role="tablist">' +
            '<button data-citf-setlang="en" class="active">EN</button>' +
            '<span class="citf-lang-sep">|</span>' +
            '<button data-citf-setlang="ru">RU</button>' +
            '<span class="citf-lang-sep">|</span>' +
            '<button data-citf-setlang="gr">EL</button>' +
          '</div>' +
          '<div class="citf-nav-social">' +
            '<a href="https://www.facebook.com/citf.cy" target="_blank" rel="noopener" aria-label="Facebook">f</a>' +
            '<a href="https://www.instagram.com/citf.cy" target="_blank" rel="noopener" aria-label="Instagram">IG</a>' +
            '<a href="mailto:office@citf.cy" aria-label="Email">@</a>' +
          '</div>' +
        '</div>' +

        '<button class="citf-nav-toggle" aria-label="Menu"><span></span><span></span><span></span></button>' +
      '</div>' +
    '</nav>';

  var FOOTER_HTML =
    '<footer class="citf-footer">' +
      '<div class="citf-footer-inner">' +
        '<div class="citf-footer-brand">' +
          '<h4>Cyprus International Theatre Festival</h4>' +
          '<p data-en>World-class theatre brought to Cyprus. Performances and special events at Pattihio Theatre, Limassol, throughout the year.</p>' +
          '<p data-ru>Театр мирового уровня на Кипре. Спектакли и специальные события в течение всего года в театре Паттихио, Лимассол.</p>' +
          '<p data-gr>Παγκόσμιας κλάσης θέατρο στην Κύπρο. Παραστάσεις και ειδικές εκδηλώσεις στο Παττίχειο Θέατρο, Λεμεσός, όλη τη διάρκεια του χρόνου.</p>' +
          '<div class="citf-footer-contact"><a href="mailto:office@citf.cy">office@citf.cy</a></div>' +
        '</div>' +
        '<div class="citf-footer-col">' +
          '<h5 data-en>Festival</h5><h5 data-ru>Фестиваль</h5><h5 data-gr>Φεστιβάλ</h5>' +
          '<a href="/" data-en>Shows &amp; Event</a><a href="/" data-ru>Афиша</a><a href="/" data-gr>Παραστάσεις</a>' +
          '<a href="/about" data-en>About</a><a href="/ru/about" data-ru>О нас</a><a href="/gr/about" data-gr>Σχετικά</a>' +
          '<a href="/friends-club" data-en>Friends Club</a><a href="/friends-club" data-ru>Клуб друзей</a><a href="/friends-club" data-gr>Friends Club</a>' +
          '<a href="/journal" data-en>Journal</a><a href="/journal" data-ru>Журнал</a><a href="/journal" data-gr>Περιοδικό</a>' +
        '</div>' +
        '<div class="citf-footer-col">' +
          '<h5 data-en>Connect</h5><h5 data-ru>Связь</h5><h5 data-gr>Επικοινωνία</h5>' +
          '<a href="/contact" data-en>Contact</a><a href="/contact" data-ru>Контакты</a><a href="/contact" data-gr>Επικοινωνία</a>' +
          '<a href="/press" data-en>Press</a><a href="/press" data-ru>Пресса</a><a href="/press" data-gr>Τύπος</a>' +
          '<a href="/gallery" data-en>Gallery</a><a href="/gallery" data-ru>Галерея</a><a href="/gallery" data-gr>Gallery</a>' +
        '</div>' +
        '<div class="citf-footer-col">' +
          '<h5 data-en>Follow</h5><h5 data-ru>Соцсети</h5><h5 data-gr>Κοινωνικά</h5>' +
          '<a href="https://www.instagram.com/citf.cy" target="_blank" rel="noopener">Instagram</a>' +
          '<a href="https://www.facebook.com/citf.cy" target="_blank" rel="noopener">Facebook</a>' +
          '<a href="https://www.youtube.com/channel/UCnM5xTx4ZlH9d1biuq_0MDA" target="_blank" rel="noopener">YouTube</a>' +
        '</div>' +
      '</div>' +
      '<div class="citf-footer-bottom">' +
        '<span data-en>© Cyprus International Theatre Festival</span>' +
        '<span data-ru>© Кипрский международный театральный фестиваль</span>' +
        '<span data-gr>© Διεθνές Φεστιβάλ Θεάτρου Κύπρου</span>' +
        '<div class="citf-footer-social">' +
          '<a href="/privacy" data-en>Privacy</a><a href="/privacy" data-ru>Политика</a><a href="/privacy" data-gr>Ιδιωτικότητα</a>' +
          '<a href="/terms" data-en>Terms</a><a href="/terms" data-ru>Условия</a><a href="/terms" data-gr>Όροι</a>' +
        '</div>' +
      '</div>' +
    '</footer>';

  // ------------------------------------------------------------- Mount + i18n
  function injectCSS(){
    if(document.getElementById('citf-chrome-css')) return;
    var s = document.createElement('style');
    s.id = 'citf-chrome-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  var LS_KEY = 'citf_lang';
  var VALID = ['en','ru','gr'];
  function setLang(l){
    if(VALID.indexOf(l) < 0) l = 'en';
    document.documentElement.setAttribute('data-lang', l);
    try{ localStorage.setItem(LS_KEY, l); }catch(e){}
    document.querySelectorAll('.citf-lang-switch button, [data-setlang]').forEach(function(b){
      var v = b.getAttribute('data-citf-setlang') || b.getAttribute('data-setlang');
      b.classList.toggle('active', v === l);
    });
    document.documentElement.lang = (l === 'gr') ? 'el' : l;
  }
  window.__citfSetLang = setLang;

  function initialLang(){
    var q = (new URL(location.href)).searchParams.get('lang');
    if(q && VALID.indexOf(q) >= 0) return q;
    var saved; try{ saved = localStorage.getItem(LS_KEY); }catch(e){}
    if(saved && VALID.indexOf(saved) >= 0) return saved;
    var b = (navigator.language || '').toLowerCase();
    if(b.indexOf('ru') === 0) return 'ru';
    if(b.indexOf('el') === 0) return 'gr';
    return 'en';
  }

  function mountAt(id, html){
    var slot = document.getElementById(id);
    if(!slot) return null;
    var tmp = document.createElement('div');
    tmp.innerHTML = html;
    var frag = document.createDocumentFragment();
    while(tmp.firstChild) frag.appendChild(tmp.firstChild);
    slot.parentNode.replaceChild(frag, slot);
    return true;
  }

  function bindNav(){
    document.querySelectorAll('.citf-lang-switch button').forEach(function(b){
      b.addEventListener('click', function(){
        setLang(b.getAttribute('data-citf-setlang'));
      });
    });
    var menu = document.getElementById('citfNavMenu');
    var toggle = document.querySelector('.citf-nav-toggle');
    if(toggle && menu){
      toggle.addEventListener('click', function(e){
        e.stopPropagation();
        menu.classList.toggle('open');
      });
      menu.querySelectorAll('a').forEach(function(a){
        a.addEventListener('click', function(){ menu.classList.remove('open'); });
      });
    }
  }

  function boot(){
    injectCSS();
    mountAt('citf-header-mount', HEADER_HTML);
    mountAt('citf-footer-mount', FOOTER_HTML);
    setLang(initialLang());
    bindNav();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
