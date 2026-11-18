(function (G) {
  var fa = G.fa, S = G.save;
  function $(id) { return document.getElementById(id); }
  var screen = $('screen'), stage = $('stage'), pad = $('pad'), hint = $('hint'), cv = $('cv'), c = cv.getContext('2d');
  var dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round(G.VW * dpr); cv.height = Math.round(G.VH * dpr);
  c.setTransform(dpr, 0, 0, dpr, 0, 0);

  var touchMQ = window.matchMedia ? window.matchMedia('(hover: none), (pointer: coarse)') : { matches: false };
  function isTouch() { return !!touchMQ.matches; }
  function portrait() { return isTouch() && window.innerHeight > window.innerWidth; }
  /* on phones the canvas fills the screen at 16:9; elsewhere CSS sizes it */
  function fit() {
    if (document.body.classList.contains('playing') && isTouch()) {
      var w = Math.min(window.innerWidth, window.innerHeight * 16 / 9);
      cv.style.width = Math.floor(w) + 'px'; cv.style.height = Math.floor(w * 9 / 16) + 'px';
    } else { cv.style.width = ''; cv.style.height = ''; }
  }
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', fit);

  var mode = 'screen', paused = false, last = 0, acc = 0, FD = 1 / 60, cur = 1, finished = false;
  var fx1 = function (x) { return Number(x).toLocaleString('fa-IR', { maximumFractionDigits: 1 }); };
  var FMT = {
    hp: function (l) { return fa(5 + l) + ' جان'; },
    dmg: function (l) { return '×' + fx1(1 + 0.7 * l); },
    rate: function (l) { return fx1(1 / Math.max(0.16, 0.4 - 0.038 * l)) + ' شلیک بر ثانیه'; },
    fuel: function (l) { return fa(100 + 35 * l) + ' سوخت'; },
    speed: function (l) { return fa(190 + 17 * l) + ' سرعت'; },
    magnet: function (l) { return l ? fa(l * 38) + ' پیکسل' : 'ندارد'; }
  };

  function chip() { $('gemN').textContent = fa(S.gems); }
  function show(html) {
    mode = 'screen'; stage.hidden = true; pad.hidden = true; hint.hidden = true; screen.hidden = false;
    document.body.classList.remove('playing'); fit();
    screen.innerHTML = html; chip(); window.scrollTo(0, 0);
  }

  function menu() {
    var next = Math.min(G.LEVELS, S.unlocked);
    show('<div class="hero"><canvas id="pv" width="240" height="170" aria-label="ربات"></canvas><div class="heroText">' +
      '<h2>ربات پرنده</h2><p>با پاهای فلزی راه برو، با جت‌پک پرواز کن و دشمن‌ها رو نابود کن. سکه و جم جمع کن و ربات رو توی فروشگاه قوی‌تر کن.</p>' +
      '<div class="row"><button class="btn primary" data-a="lvl" data-n="' + next + '">ادامه · مرحله ' + fa(next) + '</button>' +
      '<button class="btn" data-a="levels">مراحل</button><button class="btn" data-a="shop">فروشگاه</button></div>' +
      '<p class="keys">حرکت: ← → یا A D · پرش و پرواز (نگه دار): فاصله یا ↑ · شلیک: J یا X</p></div></div>');
  }

  function levels() {
    var h = '<div class="bar"><h2>مراحل</h2><button class="btn" data-a="menu">بازگشت</button></div><div class="grid">', n, st, s, lock;
    for (n = 1; n <= G.LEVELS; n++) {
      lock = n > S.unlocked; st = S.stars[n] || 0; s = '';
      for (var i = 1; i <= 3; i++) s += '<i class="' + (i <= st ? 'on' : '') + '">★</i>';
      h += '<button class="lvl' + (n % 5 === 0 ? ' boss' : '') + '" data-a="lvl" data-n="' + n + '"' + (lock ? ' disabled' : '') + '>' +
        '<b>' + fa(n) + '</b><span class="stars">' + (lock ? '🔒' : s) + '</span>' + (n % 5 === 0 ? '<em>باس</em>' : '') + '</button>';
    }
    show(h + '</div><p class="hint2">هر ۵ مرحله یک غول فولادی منتظرته. ستاره‌ها بر اساس سکه‌های جمع‌شده‌ست.</p>');
  }

  function shop() {
    var h = '<div class="bar"><h2>فروشگاه</h2><button class="btn" data-a="menu">بازگشت</button></div>' +
      '<div class="shopTop"><canvas id="pv" width="240" height="170" aria-label="ربات"></canvas>' +
      '<div class="have"><span>جم‌های تو</span><b>' + fa(S.gems) + '</b><small>با کشتن دشمن‌ها و جمع کردن سکه جم می‌گیری</small></div></div><div class="cards">';
    G.UPS.forEach(function (u) {
      var l = S.up[u.id], max = l >= u.max, cost = G.upCost(u, l), pips = '', i;
      for (i = 0; i < u.max; i++) pips += '<i class="' + (i < l ? 'on' : '') + '"></i>';
      h += '<div class="card"><div class="ch"><b>' + u.name + '</b><span>' + fa(l) + ' از ' + fa(u.max) + '</span></div><p>' + u.desc + '</p>' +
        '<div class="pips">' + pips + '</div><div class="eff">' + FMT[u.id](l) + (max ? '' : ' ← ' + FMT[u.id](l + 1)) + '</div>' +
        '<button class="btn buy" data-a="up" data-id="' + u.id + '"' + (max || S.gems < cost ? ' disabled' : '') + '>' + (max ? 'کامل شد' : 'خرید · ' + fa(cost) + ' جم') + '</button></div>';
    });
    G.WEAPONS.forEach(function (w) {
      var own = !!S.w[w.id];
      h += '<div class="card wp"><div class="ch"><b>' + w.name + '</b><span>' + (own ? 'فعال' : 'سلاح') + '</span></div><p>' + w.desc + '</p>' +
        '<button class="btn buy" data-a="wp" data-id="' + w.id + '"' + (own || S.gems < w.cost ? ' disabled' : '') + '>' + (own ? 'خریداری شد' : 'خرید · ' + fa(w.cost) + ' جم') + '</button></div>';
    });
    show(h + '</div>');
  }

  function result() {
    var r = G.run, ratio = r.L.coinN ? r.coins / r.L.coinN : 1, stars = r.won ? 1 + (ratio >= 0.6 ? 1 : 0) + (ratio >= 0.9 ? 1 : 0) : 0, s = '', i, last = r.n >= G.LEVELS;
    for (i = 1; i <= 3; i++) s += '<i class="' + (i <= stars ? 'on' : '') + '">★</i>';
    if (r.won) {
      S.stars[r.n] = Math.max(S.stars[r.n] || 0, stars);
      S.unlocked = Math.max(S.unlocked, Math.min(G.LEVELS, r.n + 1));
    }
    G.persist();
    show('<div class="res"><h2>' + (r.won ? (last ? 'همه مرحله‌ها تموم شد!' : 'مرحله ' + fa(r.n) + ' تمام شد') : 'ربات نابود شد') + '</h2>' +
      (r.won ? '<div class="stars big">' + s + '</div>' : '') +
      '<ul class="stats"><li><span>جم این مرحله</span><b>' + fa(r.gems) + '</b></li><li><span>سکه</span><b>' + fa(r.coins) + ' از ' + fa(r.L.coinN) + '</b></li><li><span>دشمن نابودشده</span><b>' + fa(r.kills) + '</b></li></ul>' +
      '<div class="row">' + (r.won && !last ? '<button class="btn primary" data-a="lvl" data-n="' + (r.n + 1) + '">مرحله بعد</button>' : '') +
      (!r.won ? '<button class="btn primary" data-a="lvl" data-n="' + r.n + '">دوباره تلاش کن</button>' : '') +
      '<button class="btn" data-a="shop">فروشگاه</button><button class="btn" data-a="levels">مراحل</button></div>' +
      (!r.won ? '<p class="hint2">جم‌هایی که گرفتی نگه داشته می‌شن. می‌تونی قبل از تلاش دوباره ارتقا بخری.</p>' : '') + '</div>');
  }

  function play(n) {
    cur = n; G.start(n); finished = false; paused = false; acc = 0;
    mode = 'play'; screen.hidden = true; stage.hidden = false; pad.hidden = false; hint.hidden = false; chip();
    document.body.classList.add('playing'); fit();
    if (isTouch()) {
      try {
        var de = document.documentElement;
        var fs = de.requestFullscreen ? de.requestFullscreen() : null;
        if (fs && fs.catch) fs.catch(function () {});
        if (screen.orientation && screen.orientation.lock) { var lk = screen.orientation.lock('landscape'); if (lk && lk.catch) lk.catch(function () {}); }
      } catch (e) {}
    }
  }

  screen.addEventListener('click', function (e) {
    var b = e.target.closest('[data-a]'); if (!b || b.disabled) return;
    var a = b.getAttribute('data-a'), id = b.getAttribute('data-id'), n = +b.getAttribute('data-n');
    if (a === 'menu') menu(); else if (a === 'levels') levels(); else if (a === 'shop') shop(); else if (a === 'lvl') play(n);
    else if (a === 'up') {
      var u = G.UPS.filter(function (x) { return x.id === id; })[0], l = S.up[id], cost = G.upCost(u, l);
      if (l < u.max && S.gems >= cost) { S.gems -= cost; S.up[id]++; G.persist(); shop(); }
    } else if (a === 'wp') {
      var w = G.WEAPONS.filter(function (x) { return x.id === id; })[0];
      if (!S.w[id] && S.gems >= w.cost) { S.gems -= w.cost; S.w[id] = 1; G.persist(); shop(); }
    }
  });

  /* ---- input ---- */
  var map = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'jump', KeyW: 'jump', Space: 'jump', KeyJ: 'fire', KeyX: 'fire', KeyK: 'fire' };
  window.addEventListener('keydown', function (e) {
    if (mode !== 'play') return;
    if (e.code === 'Escape' || e.code === 'KeyP') { paused = !paused; e.preventDefault(); return; }
    var k = map[e.code]; if (!k) return; e.preventDefault(); G.input[k] = true;
  });
  window.addEventListener('keyup', function (e) { var k = map[e.code]; if (k) G.input[k] = false; });
  window.addEventListener('blur', function () { G.input.left = G.input.right = G.input.jump = G.input.fire = false; });
  function bind(id, k) {
    var b = $(id);
    function dn(e) { e.preventDefault(); G.input[k] = true; b.classList.add('on'); }
    function up(e) { e.preventDefault(); G.input[k] = false; b.classList.remove('on'); }
    b.addEventListener('pointerdown', dn); b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', up);
    b.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }
  bind('bL', 'left'); bind('bR', 'right'); bind('bJ', 'jump'); bind('bF', 'fire');
  cv.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse') G.input.fire = true; });
  window.addEventListener('pointerup', function (e) { if (e.pointerType === 'mouse') G.input.fire = false; });

  function frame(ts) {
    var dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts;
    if (mode === 'play' && G.run) {
      if (!paused && !portrait()) { acc += dt; while (acc >= FD) { G.update(FD); acc -= FD; } }
      G.render(c);
      if (paused) {
        c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(0, 0, G.VW, G.VH);
        c.fillStyle = '#fff'; c.font = '800 30px "Vazirmatn", sans-serif'; c.textAlign = 'center'; c.direction = 'rtl';
        c.fillText('مکث', G.VW / 2, G.VH / 2); c.font = '600 14px "Vazirmatn", sans-serif'; c.fillText('برای ادامه P یا Esc بزن', G.VW / 2, G.VH / 2 + 30);
      }
      if (!finished && (G.run.over || G.run.won) && G.run.endT > 1.6) { finished = true; G.input.left = G.input.right = G.input.jump = G.input.fire = false; result(); }
    } else {
      var pv = $('pv'); if (pv) G.drawPreview(pv.getContext('2d'), pv.width, pv.height, ts / 1000);
    }
    requestAnimationFrame(frame);
  }

  G.load(); menu();
  requestAnimationFrame(frame);
})(window.G);
