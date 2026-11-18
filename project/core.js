(function (G) {
  var T = G.T;
  G.input = { left: false, right: false, jump: false, fire: false };
  G.rect = function (a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; };
  G.cell = function (L, tx, ty) {
    if (tx < 0 || tx >= L.w) return '#';
    if (ty < 0 || ty >= G.ROWS) return '.';
    return L.g[ty][tx];
  };

  /* axis-separated box vs tile movement; fills e.ground and e.hitX */
  G.move = function (L, e, dt) {
    var x0, x1, y0, y1, tx, ty;
    e.hitX = false;
    e.x += e.vx * dt;
    x0 = Math.floor(e.x / T); x1 = Math.floor((e.x + e.w - 0.01) / T);
    y0 = Math.floor(e.y / T); y1 = Math.floor((e.y + e.h - 0.01) / T);
    for (ty = y0; ty <= y1; ty++) for (tx = x0; tx <= x1; tx++) if (G.cell(L, tx, ty) === '#') {
      if (e.vx > 0) e.x = tx * T - e.w; else if (e.vx < 0) e.x = (tx + 1) * T;
      e.vx = 0; e.hitX = true;
    }
    e.y += e.vy * dt; e.ground = false;
    x0 = Math.floor(e.x / T); x1 = Math.floor((e.x + e.w - 0.01) / T);
    y0 = Math.floor(e.y / T); y1 = Math.floor((e.y + e.h - 0.01) / T);
    for (ty = y0; ty <= y1; ty++) for (tx = x0; tx <= x1; tx++) if (G.cell(L, tx, ty) === '#') {
      if (e.vy > 0) { e.y = ty * T - e.h; e.ground = true; } else if (e.vy < 0) e.y = (ty + 1) * T;
      e.vy = 0;
    }
  };

  G.burst = function (x, y, col, n, sp) {
    var r = G.run, i, a, v;
    for (i = 0; i < n; i++) {
      a = Math.random() * 6.283; v = (0.3 + Math.random()) * (sp || 160);
      r.parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, life: 0.5 + Math.random() * 0.4, col: col, size: 2 + Math.random() * 3 });
    }
  };
  G.pop = function (x, y, txt, col) { G.run.pops.push({ x: x, y: y, t: txt, col: col, life: 1 }); };
  G.addGems = function (n, x, y) {
    var r = G.run; G.save.gems += n; r.gems += n;
    if (n > 1) G.pop(x, y, '+' + G.fa(n), '#7df0ff');
  };

  G.start = function (n) {
    var L = G.gen(n), st = G.stats(G.save);
    var r = G.run = {
      n: n, L: L, st: st, t: 0, en: [], bl: [], parts: [], pops: [], coins: 0, gems: 0, kills: 0,
      shake: 0, over: false, won: false, endT: 0, bossAlive: L.boss, cam: { x: 0, y: 0 }, lockMsg: 0,
      p: { x: L.start.x, y: L.start.y - 34, w: 20, h: 34, vx: 0, vy: 0, ground: false, face: 1, hp: st.maxHp,
        fuel: st.fuel, inv: 0, fireT: 0, ph: 0, jet: false, coy: 0, buf: 0, recoil: 0, jumpHeld: false,
        safeX: L.start.x, safeY: L.start.y - 34, safeT: 0, moving: false }
    };
    L.en.forEach(function (d) { G.spawn(r, d); });
    G.input.jump = G.input.fire = false;
  };

  G.hurt = function (d, kx) {
    var r = G.run, p = r.p;
    if (p.inv > 0 || r.over || r.won) return;
    p.hp -= d; p.inv = 1.1; p.vy = -260; p.vx = (kx || 0) * 220; r.shake = 0.3;
    G.burst(p.x + p.w / 2, p.y + p.h / 2, '#ff6b6b', 10);
    if (p.hp <= 0) { p.hp = 0; r.over = true; G.burst(p.x + p.w / 2, p.y + p.h / 2, '#d7deea', 40, 260); G.burst(p.x + p.w / 2, p.y + p.h / 2, '#38d0ff', 20, 200); r.shake = 0.6; }
  };

  G.playerShoot = function () {
    var r = G.run, p = r.p, st = r.st, angs = st.triple ? [-0.17, 0, 0.17] : [0], i, a;
    for (i = 0; i < angs.length; i++) {
      a = angs[i];
      r.bl.push({ x: p.x + p.w / 2 + p.face * 17, y: p.y + 14, vx: Math.cos(a) * 560 * p.face, vy: Math.sin(a) * 560,
        dmg: st.dmg, own: 'p', r: 4, life: 0.9, col: '#4fe8ff', pierce: st.pierce, hit: [] });
    }
    p.recoil = 3;
    G.burst(p.x + p.w / 2 + p.face * 19, p.y + 14, '#bff6ff', 3, 90);
  };

  G.updatePlayer = function (dt) {
    var r = G.run, p = r.p, L = r.L, st = r.st, inp = G.input, i, tx, ty, c;
    var dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    if (dir) p.face = dir;
    p.vx += (dir * st.speed - p.vx) * Math.min(1, (p.ground ? 0.3 : 0.14) * dt * 60);
    if (Math.abs(p.vx) < 3 && !dir) p.vx = 0;

    p.coy = p.ground ? 0.1 : Math.max(0, p.coy - dt);
    p.buf = Math.max(0, p.buf - dt);
    if (inp.jump && !p.jumpHeld) p.buf = 0.12;
    p.jumpHeld = inp.jump; p.jet = false;
    if (p.buf > 0 && p.coy > 0) { p.vy = -520; p.coy = 0; p.buf = 0; p.ground = false; }
    else if (inp.jump && !p.ground && p.fuel > 0 && p.vy > -140) {
      p.vy = Math.max(-280, p.vy - 2350 * dt); p.fuel = Math.max(0, p.fuel - 42 * dt); p.jet = true;
      if (Math.random() < 0.7) r.parts.push({ x: p.x + p.w / 2 - p.face * 8, y: p.y + 22, vx: (Math.random() - 0.5) * 40, vy: 120 + Math.random() * 80, life: 0.35, col: Math.random() < 0.5 ? '#ffb347' : '#ff7a3d', size: 3 });
    }
    p.vy = Math.min(820, p.vy + 1500 * dt);
    if (p.ground) p.fuel = Math.min(st.fuel, p.fuel + 45 * dt);

    p.fireT -= dt; p.recoil = Math.max(0, p.recoil - dt * 30); p.inv = Math.max(0, p.inv - dt);
    if (inp.fire && p.fireT <= 0) { p.fireT = st.delay; G.playerShoot(); }

    G.move(L, p, dt);
    if (p.y < 0) { p.y = 0; if (p.vy < 0) p.vy = 0; }
    p.moving = p.ground && Math.abs(p.vx) > 10;
    if (p.moving) p.ph += Math.abs(p.vx) * dt * 0.09;

    p.safeT -= dt;
    if (p.ground && p.safeT <= 0 && G.cell(L, Math.floor((p.x + 1) / T), Math.floor((p.y + p.h + 2) / T)) === '#' &&
        G.cell(L, Math.floor((p.x + p.w - 1) / T), Math.floor((p.y + p.h + 2) / T)) === '#') { p.safeX = p.x; p.safeY = p.y; p.safeT = 0.4; }
    if (p.y > G.ROWS * T + 40) {
      p.hp -= 1; p.vx = p.vy = 0; p.x = p.safeX; p.y = p.safeY; p.inv = 1.5; r.shake = 0.3;
      if (p.hp <= 0) { p.hp = 0; r.over = true; }
    }

    var cx = p.x + p.w / 2, cy = p.y + p.h / 2, rad = 16 + st.magnet, tr = Math.ceil(rad / T) + 1;
    var tx0 = Math.floor(cx / T), ty0 = Math.floor(cy / T), dx, dy;
    for (ty = ty0 - tr; ty <= ty0 + tr; ty++) for (tx = tx0 - tr; tx <= tx0 + tr; tx++) {
      if (G.cell(L, tx, ty) !== 'c') continue;
      dx = tx * T + 16 - cx; dy = ty * T + 16 - cy;
      if (dx * dx + dy * dy < rad * rad) { L.g[ty][tx] = '.'; r.coins++; G.addGems(1); G.burst(tx * T + 16, ty * T + 16, '#ffd45a', 5, 90); }
    }
    var x0 = Math.floor(p.x / T), x1 = Math.floor((p.x + p.w - 0.01) / T), y0 = Math.floor(p.y / T), y1 = Math.floor((p.y + p.h - 0.01) / T);
    for (ty = y0; ty <= y1; ty++) for (tx = x0; tx <= x1; tx++) {
      c = G.cell(L, tx, ty);
      if (c === '^') {
        if (p.x < tx * T + T - 5 && p.x + p.w > tx * T + 5 && p.y + p.h > ty * T + 14) G.hurt(1, -p.face);
      } else if (c === 'F') {
        if (r.bossAlive) { if (r.lockMsg <= 0) { G.pop(tx * T + 16, ty * T - 10, 'اول باس رو نابود کن', '#ffb347'); r.lockMsg = 2; } }
        else { r.won = true; }
      }
    }
    r.lockMsg -= dt;
  };

  G.updateBullets = function (dt) {
    var r = G.run, L = r.L, i, j, b, e;
    for (i = 0; i < r.bl.length; i++) {
      b = r.bl[i]; b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      if (b.life <= 0 || G.cell(L, Math.floor(b.x / T), Math.floor(b.y / T)) === '#') {
        if (b.life > 0) G.burst(b.x, b.y, b.col, 4, 80);
        b.dead = true; continue;
      }
      if (b.own === 'p') {
        for (j = 0; j < r.en.length; j++) {
          e = r.en[j];
          if (e.dead || b.hit.indexOf(e) >= 0) continue;
          if (b.x + b.r > e.x && b.x - b.r < e.x + e.w && b.y + b.r > e.y && b.y - b.r < e.y + e.h) {
            G.hitEnemy(e, b.dmg, b.vx > 0 ? 1 : -1); b.hit.push(e);
            if (!b.pierce) { b.dead = true; break; }
          }
        }
      } else if (G.rect({ x: b.x - b.r, y: b.y - b.r, w: b.r * 2, h: b.r * 2 }, r.p)) {
        G.hurt(b.dmg, b.vx > 0 ? 1 : -1); b.dead = true;
      }
    }
    r.bl = r.bl.filter(function (q) { return !q.dead; });
  };

  G.update = function (dt) {
    var r = G.run, p = r.p, i, q;
    r.t += dt;
    if (!r.over && !r.won) { G.updatePlayer(dt); G.updateEnemies(dt); }
    G.updateBullets(dt);
    for (i = 0; i < r.parts.length; i++) { q = r.parts[i]; q.life -= dt; q.vy += 600 * dt; q.x += q.vx * dt; q.y += q.vy * dt; }
    r.parts = r.parts.filter(function (a) { return a.life > 0; });
    for (i = 0; i < r.pops.length; i++) { q = r.pops[i]; q.life -= dt; q.y -= 30 * dt; }
    r.pops = r.pops.filter(function (a) { return a.life > 0; });
    r.shake = Math.max(0, r.shake - dt);
    var tx = p.x + p.w / 2 - G.VW / 2 + p.face * 60, ty = p.y + p.h / 2 - G.VH / 2 - 20;
    tx = Math.max(0, Math.min(r.L.w * T - G.VW, tx)); ty = Math.max(0, Math.min(G.ROWS * T - G.VH, ty));
    r.cam.x += (tx - r.cam.x) * Math.min(1, dt * 6); r.cam.y += (ty - r.cam.y) * Math.min(1, dt * 6);
    if (r.over || r.won) r.endT += dt;
  };
})(window.G);
