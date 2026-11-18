window.G = window.G || {};
(function (G) {
  G.T = 32; G.VW = 800; G.VH = 450; G.ROWS = 16; G.LEVELS = 30;
  G.fa = function (n) { return Number(Math.round(n)).toLocaleString('fa-IR'); };
  G.rng = function (seed) {
    var s = (seed >>> 0) || 1;
    return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  };

  G.THEMES = [
    { name: 'شهر خاموش', a: '#17202e', b: '#2d3f5c', gnd: '#28324a', top: '#5b7399', far: '#1f2b40' },
    { name: 'صحرای آهن', a: '#3a2519', b: '#8a5530', gnd: '#4b3223', top: '#a56b3e', far: '#5a3a24' },
    { name: 'جنگل مصنوعی', a: '#0e271d', b: '#1f5240', gnd: '#1c3a2c', top: '#48906a', far: '#14382b' },
    { name: 'یخچال', a: '#16303f', b: '#4a83a3', gnd: '#2f5166', top: '#a5d4ea', far: '#27475c' },
    { name: 'گدازه', a: '#250d12', b: '#64201f', gnd: '#391a1b', top: '#d2603a', far: '#4a1b1c' },
    { name: 'فضا', a: '#0a0a1c', b: '#231c52', gnd: '#25234a', top: '#7a74da', far: '#171538' }
  ];

  /* ---- upgrades ---- */
  G.UPS = [
    { id: 'hp', name: 'زره', desc: 'یک جان بیشتر در هر سطح', max: 6, base: 30 },
    { id: 'dmg', name: 'قدرت شلیک', desc: 'آسیب بیشتر هر گلوله', max: 6, base: 40 },
    { id: 'rate', name: 'سرعت شلیک', desc: 'تیراندازی سریع‌تر', max: 6, base: 40 },
    { id: 'fuel', name: 'مخزن جت', desc: 'پرواز طولانی‌تر', max: 6, base: 35 },
    { id: 'speed', name: 'موتور پاها', desc: 'راه رفتن سریع‌تر', max: 5, base: 30 },
    { id: 'magnet', name: 'آهنربا', desc: 'جذب سکه از فاصله بیشتر', max: 5, base: 25 }
  ];
  G.WEAPONS = [
    { id: 'triple', name: 'شلیک سه‌گانه', desc: 'سه گلوله هم‌زمان به‌صورت بادبزنی', cost: 180 },
    { id: 'pierce', name: 'گلوله سوراخ‌کن', desc: 'گلوله از چند دشمن رد می‌شود', cost: 260 }
  ];
  G.upCost = function (u, l) { return Math.round(u.base * (1 + l * 0.9) + l * l * 8); };
  G.stats = function (sv) {
    var u = sv.up;
    return {
      maxHp: 5 + u.hp, dmg: 1 + 0.7 * u.dmg, delay: Math.max(0.16, 0.4 - 0.038 * u.rate),
      fuel: 100 + 35 * u.fuel, speed: 190 + 17 * u.speed, magnet: u.magnet * 38,
      triple: !!sv.w.triple, pierce: !!sv.w.pierce
    };
  };

  /* ---- save ---- */
  var KEY = 'robot-fly-v1';
  G.save = { gems: 0, up: { hp: 0, dmg: 0, rate: 0, fuel: 0, speed: 0, magnet: 0 }, w: {}, unlocked: 1, stars: {} };
  G.load = function () {
    try {
      var o = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (o) {
        G.save.gems = o.gems | 0; G.save.unlocked = o.unlocked || 1;
        G.save.w = o.w || {}; G.save.stars = o.stars || {};
        for (var k in G.save.up) G.save.up[k] = (o.up && o.up[k]) | 0;
      }
    } catch (e) {}
  };
  G.persist = function () { try { localStorage.setItem(KEY, JSON.stringify(G.save)); } catch (e) {} };

  /* ---- enemies ---- */
  G.EN = {
    soldier: { hp: 3, w: 20, h: 32, sp: 48, rew: 4, min: 1, gun: 1.7, range: 340 },
    turret: { hp: 5, w: 28, h: 22, sp: 0, rew: 6, min: 3, gun: 1.5, range: 400 },
    drone: { hp: 2, w: 28, h: 20, sp: 80, rew: 5, min: 2, gun: 2.1, range: 420 },
    tank: { hp: 9, w: 42, h: 26, sp: 30, rew: 11, min: 4, gun: 2.6, range: 420 },
    jumper: { hp: 4, w: 22, h: 28, sp: 90, rew: 7, min: 6, gun: 0, range: 360 },
    boss: { hp: 50, w: 64, h: 76, sp: 40, rew: 80, min: 5, gun: 1.8, range: 640 }
  };

  /* ---- level generator ---- */
  G.gen = function (n) {
    var R = G.rng(n * 7919 + 13), H = G.ROWS, T = G.T;
    var W = Math.min(230, 100 + n * 5), boss = n % 5 === 0, arena = W - 46;
    var g = [], surf = [], x, y, i;
    for (y = 0; y < H; y++) { g.push([]); for (x = 0; x < W; x++) g[y].push('.'); }
    var s = 12; x = 0;
    while (x < W) {
      var inArena = boss && x >= arena, safe = x < 10 || x >= W - 16 || inArena;
      if (inArena) s = 12;
      if (!safe && x < W - 20 && R() < 0.1 + Math.min(0.12, n * 0.004)) {
        var gw = 2 + Math.floor(R() * 3);
        for (i = 0; i < gw; i++) { surf[x] = -1; x++; }
        continue;
      }
      var len = 3 + Math.floor(R() * 7);
      for (i = 0; i < len && x < W; i++) { surf[x] = s; x++; }
      if (!safe) { var d = R(); if (d < 0.3) s = Math.max(9, s - 1); else if (d < 0.55) s = Math.min(13, s + 1); }
    }
    for (x = (boss ? arena : W - 16); x < W; x++) surf[x] = 12;
    for (x = 0; x < W; x++) if (surf[x] >= 0) for (y = surf[x]; y < H; y++) g[y][x] = '#';
    function sr(c) { return surf[c] >= 0 ? surf[c] : 12; }

    for (x = 14; x < W - 20; x += 5 + Math.floor(R() * 6)) {
      if (boss && x > arena - 4) break;
      if (R() < 0.55) {
        var pw = 3 + Math.floor(R() * 3), py = Math.max(3, sr(x) - 3 - Math.floor(R() * 3));
        for (i = 0; i < pw; i++) if (g[py][x + i] === '.') g[py][x + i] = '#';
        for (i = 0; i < pw; i++) if (g[py - 1][x + i] === '.' && R() < 0.8) g[py - 1][x + i] = 'c';
      } else if (surf[x] >= 0 && surf[x + 1] >= 0 && R() < 0.5) {
        var th = 1 + Math.floor(R() * 3);
        for (i = 1; i <= th; i++) { g[surf[x] - i][x] = '#'; g[surf[x + 1] - i][x + 1] = '#'; }
      }
    }
    for (x = 14; x < W - 18; x++) {
      if (boss && x >= arena) break;
      var sp = surf[x];
      if (sp >= 0 && surf[x - 1] === sp && surf[x + 1] === sp && g[sp - 1][x] === '.' && R() < 0.03 + n * 0.0016) {
        g[sp - 1][x] = '^';
        if (R() < 0.4 && g[sp - 1][x + 1] === '.') { g[sp - 1][x + 1] = '^'; x++; }
      }
    }
    var arc = [0, -1, -2, -1, 0];
    for (x = 6; x < W - 8; x += 6 + Math.floor(R() * 8)) {
      for (i = 0; i < 5; i++) { var cy = sr(x + i) - 2 + arc[i]; if (cy > 0 && g[cy][x + i] === '.') g[cy][x + i] = 'c'; }
    }

    var en = [], types = ['soldier'];
    ['turret', 'drone', 'tank', 'jumper'].forEach(function (t) { if (G.EN[t].min <= n) types.push(t); });
    if (types.length > 1) types.push('soldier');
    var gap = Math.max(4.5, 13 - n * 0.3), cx = 18;
    while (cx < (boss ? arena - 2 : W - 20)) {
      var col = Math.floor(cx), t = types[Math.floor(R() * types.length)], cnt = (n > 8 && R() < 0.3) ? 2 : 1;
      for (i = 0; i < cnt; i++) {
        var c2 = col + i * 2, sv = surf[c2];
        if (t === 'drone') en.push({ t: t, x: c2 * T + 16, y: (sr(c2) - 5 - Math.floor(R() * 3)) * T });
        else if (sv >= 0 && surf[c2 - 1] >= 0 && surf[c2 + 1] >= 0 && g[sv - 1][c2] === '.' && g[sv - 2][c2] === '.')
          en.push({ t: t, x: c2 * T + 16, y: sv * T });
      }
      cx += gap * (0.7 + R() * 0.6);
    }
    if (boss) en.push({ t: 'boss', x: (W - 24) * T, y: 12 * T });

    var fx = W - 4; g[11][fx] = 'F'; g[10][fx] = 'F';
    var coinN = 0;
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) if (g[y][x] === 'c') coinN++;
    return { n: n, w: W, g: g, surf: surf, en: en, boss: boss, arena: arena, coinN: coinN, flag: fx,
      start: { x: 3 * T + 6, y: surf[3] * T }, theme: Math.floor((n - 1) / 5) % G.THEMES.length };
  };
})(window.G);
