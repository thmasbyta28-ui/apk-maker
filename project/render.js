(function (G) {
  var T = G.T, TAU = Math.PI * 2, VW = G.VW, VH = G.VH, FONT = '"Vazirmatn", system-ui, sans-serif';
  var rr = G.rr, grCache = {};

  function makeSky(r) {
    var R = G.rng(r.n * 131 + 7), th = r.L.theme, layers = [], li, x, arr, i, w, stars = [];
    for (li = 0; li < 2; li++) {
      arr = []; x = 0;
      while (x < 1700) { w = 40 + R() * 90; arr.push({ x: x, w: w, h: (li ? 60 : 100) + R() * (li ? 90 : 140), lit: R() }); x += w * (0.7 + R() * 0.4); }
      layers.push(arr);
    }
    for (i = 0; i < 60; i++) stars.push({ x: R() * VW, y: R() * 250, s: R() < 0.2 ? 2 : 1 });
    return { layers: layers, stars: stars, tri: th === 1 || th === 3 };
  }

  function background(c, r, th, cam) {
    var k = th.a, sk = r.sky, li, i, b, par, base, sx, g;
    if (!grCache[k]) { g = c.createLinearGradient(0, 0, 0, VH); g.addColorStop(0, th.a); g.addColorStop(1, th.b); grCache[k] = g; }
    c.fillStyle = grCache[k]; c.fillRect(0, 0, VW, VH);
    c.fillStyle = 'rgba(255,255,255,0.5)';
    for (i = 0; i < sk.stars.length; i++) { b = sk.stars[i]; c.fillRect((((b.x - cam.x * 0.03) % VW) + VW) % VW, b.y, b.s, b.s); }
    for (li = 0; li < 2; li++) {
      par = li ? 0.4 : 0.2; base = 340 - cam.y * par - (li ? 0 : 30);
      c.fillStyle = th.far; c.globalAlpha = li ? 0.95 : 0.55;
      for (i = 0; i < sk.layers[li].length; i++) {
        b = sk.layers[li][i]; sx = (((b.x - cam.x * par) % 1700) + 1700) % 1700 - 150;
        if (sk.tri) { c.beginPath(); c.moveTo(sx, base); c.lineTo(sx + b.w * 1.2, base); c.lineTo(sx + b.w * 0.6, base - b.h * 1.1); c.fill(); }
        else {
          c.fillRect(sx, base - b.h, b.w, b.h);
          if (li && b.lit > 0.4) { c.fillStyle = 'rgba(255,230,150,0.28)'; c.fillRect(sx + 6, base - b.h + 10, 4, 4); c.fillRect(sx + b.w - 12, base - b.h + 24, 4, 4); c.fillStyle = th.far; }
        }
      }
      c.fillRect(0, base, VW, VH); c.globalAlpha = 1;
    }
  }

  function tiles(c, r, th, cx, cy) {
    var L = r.L, t = r.t, x0 = Math.max(0, Math.floor(cx / T)), x1 = Math.min(L.w - 1, Math.ceil((cx + VW) / T));
    var y0 = Math.max(0, Math.floor(cy / T)), y1 = Math.min(G.ROWS - 1, Math.ceil((cy + VH) / T)), tx, ty, ch, X, Y, bob, w;
    for (ty = y0; ty <= y1; ty++) for (tx = x0; tx <= x1; tx++) {
      ch = L.g[ty][tx]; if (ch === '.') continue; X = tx * T; Y = ty * T;
      if (ch === '#') {
        c.fillStyle = th.gnd; c.fillRect(X, Y, T, T);
        if ((tx + ty) % 2) { c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(X, Y, T, T); }
        if (ty === 0 || L.g[ty - 1][tx] !== '#') { c.fillStyle = th.top; c.fillRect(X, Y, T, 5); }
        if (tx > 0 && L.g[ty][tx - 1] !== '#') { c.fillStyle = 'rgba(255,255,255,0.08)'; c.fillRect(X, Y, 2, T); }
        c.fillStyle = 'rgba(255,255,255,0.1)'; c.fillRect(X + T - 6, Y + T - 6, 2, 2);
      } else if (ch === '^') {
        c.fillStyle = '#e5484d'; c.beginPath(); c.moveTo(X + 3, Y + T); c.lineTo(X + T / 2, Y + 8); c.lineTo(X + T - 3, Y + T); c.closePath(); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.3)'; c.beginPath(); c.moveTo(X + T / 2, Y + 8); c.lineTo(X + T / 2 + 3, Y + 18); c.lineTo(X + T / 2 - 2, Y + 18); c.closePath(); c.fill();
      } else if (ch === 'c') {
        bob = Math.sin(t * 3 + tx) * 3; w = Math.abs(Math.cos(t * 2.5 + tx)) * 7 + 1.5;
        c.fillStyle = '#ffd45a'; c.beginPath(); c.ellipse(X + 16, Y + 16 + bob, w, 8, 0, 0, TAU); c.fill();
        c.strokeStyle = '#c98f12'; c.lineWidth = 1.5; c.stroke();
      } else if (ch === 'F' && ty + 1 < G.ROWS && L.g[ty + 1][tx] === 'F') {
        c.fillStyle = '#aab3c4'; c.fillRect(X + 14, Y - 8, 4, T * 2 + 8);
        c.fillStyle = r.bossAlive ? '#667084' : '#2ed3a6';
        c.beginPath(); c.moveTo(X + 18, Y - 6); c.lineTo(X + 44, Y + 4 + Math.sin(t * 5) * 2); c.lineTo(X + 18, Y + 14); c.closePath(); c.fill();
        c.fillStyle = '#d7deea'; c.beginPath(); c.arc(X + 16, Y - 9, 3, 0, TAU); c.fill();
      }
    }
  }

  function text(c, s, x, y, size, col, align) {
    c.font = '700 ' + size + 'px ' + FONT; c.textAlign = align || 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,0.55)';
    c.strokeText(s, x, y); c.fillStyle = col; c.fillText(s, x, y);
  }

  function hud(c, r) {
    var p = r.p, st = r.st, i, boss = null;
    c.save(); c.textBaseline = 'middle'; c.direction = 'rtl';
    c.fillStyle = '#ff5470'; c.fillRect(16, 17.5, 9, 3); c.fillRect(19, 14.5, 3, 9);
    for (i = 0; i < st.maxHp; i++) { c.fillStyle = i < p.hp ? '#ff5470' : 'rgba(255,255,255,0.16)'; rr(c, 32 + i * 17, 14, 14, 10, 3); c.fill(); }
    c.fillStyle = '#ffb347'; c.beginPath(); c.moveTo(20, 28); c.lineTo(25, 40); c.lineTo(15, 40); c.closePath(); c.fill();
    c.fillStyle = 'rgba(0,0,0,0.4)'; rr(c, 32, 31, 150, 8, 4); c.fill();
    c.fillStyle = p.fuel / st.fuel < 0.25 ? '#ff5470' : '#ffb347'; rr(c, 32, 31, Math.max(0, 150 * p.fuel / st.fuel), 8, 4); c.fill();
    c.fillStyle = '#7df0ff'; c.beginPath(); c.moveTo(VW - 20, 11); c.lineTo(VW - 14, 19); c.lineTo(VW - 20, 27); c.lineTo(VW - 26, 19); c.closePath(); c.fill();
    text(c, G.fa(G.save.gems), VW - 34, 20, 16, '#7df0ff', 'right');
    c.fillStyle = '#ffd45a'; c.beginPath(); c.arc(VW - 20, 41, 6, 0, TAU); c.fill();
    text(c, G.fa(r.coins) + ' / ' + G.fa(r.L.coinN), VW - 34, 41, 13, '#ffe9a8', 'right');
    text(c, 'مرحله ' + G.fa(r.n) + ' · ' + G.THEMES[r.L.theme].name, VW / 2, 18, 14, 'rgba(255,255,255,0.88)');
    for (i = 0; i < r.en.length; i++) if (r.en[i].t === 'boss') boss = r.en[i];
    if (boss) {
      text(c, 'غول فولادی', VW / 2, 40, 12, '#ffb0b0');
      c.fillStyle = 'rgba(0,0,0,0.5)'; rr(c, VW / 2 - 160, 50, 320, 10, 5); c.fill();
      c.fillStyle = '#ff4d4d'; rr(c, VW / 2 - 160, 50, Math.max(0, 320 * boss.hp / boss.maxHp), 10, 5); c.fill();
    }
    if (r.endT > 0.3) {
      c.fillStyle = 'rgba(0,0,0,' + Math.min(0.5, (r.endT - 0.3)) + ')'; c.fillRect(0, 0, VW, VH);
      text(c, r.won ? 'مرحله تمام شد!' : 'نابود شدی', VW / 2, VH / 2, 38, r.won ? '#2ed3a6' : '#ff6b70');
    }
    c.restore();
  }

  G.render = function (c) {
    var r = G.run, L = r.L, th = G.THEMES[L.theme], cam = r.cam, p = r.p, t = r.t, i, q, b;
    if (!r.sky) r.sky = makeSky(r);
    var sx = r.shake > 0 ? (Math.random() - 0.5) * r.shake * 16 : 0, sy = r.shake > 0 ? (Math.random() - 0.5) * r.shake * 16 : 0;
    var cx = Math.round(cam.x + sx), cy = Math.round(cam.y + sy);
    background(c, r, th, cam);
    c.save(); c.translate(-cx, -cy);
    tiles(c, r, th, cx, cy);
    for (i = 0; i < r.en.length; i++) { q = r.en[i]; if (q.x + q.w > cx - 80 && q.x < cx + VW + 80) G.drawEnemy(c, q, t, p); }
    if (!r.over) G.drawRobot(c, p.x + p.w / 2, p.y + p.h, { face: p.face, ph: p.ph, moving: p.moving, air: !p.ground, vy: p.vy, jet: p.jet, inv: p.inv, t: t, recoil: p.recoil });
    for (i = 0; i < r.bl.length; i++) {
      b = r.bl[i];
      if (b.own === 'p') {
        c.save(); c.translate(b.x, b.y); c.rotate(Math.atan2(b.vy, b.vx));
        c.fillStyle = 'rgba(79,232,255,0.3)'; c.fillRect(-16, -3.5, 18, 7);
        c.fillStyle = '#bff6ff'; rr(c, -9, -1.7, 15, 3.4, 1.7); c.fill(); c.restore();
      } else {
        c.fillStyle = b.col; c.beginPath(); c.arc(b.x, b.y, b.r, 0, TAU); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.75)'; c.beginPath(); c.arc(b.x, b.y, b.r * 0.45, 0, TAU); c.fill();
      }
    }
    for (i = 0; i < r.parts.length; i++) { q = r.parts[i]; c.globalAlpha = Math.min(1, q.life * 2); c.fillStyle = q.col; c.fillRect(q.x, q.y, q.size, q.size); }
    c.globalAlpha = 1;
    for (i = 0; i < r.pops.length; i++) { q = r.pops[i]; c.globalAlpha = Math.min(1, q.life * 2); text(c, q.t, q.x, q.y, 16, q.col); }
    c.globalAlpha = 1;
    c.restore();
    hud(c, r);
  };

  G.drawPreview = function (c, w, h, t) {
    var fly = (t % 6) > 4, y = h - 22 - (fly ? 18 + Math.sin(t * 4) * 3 : 0);
    c.clearRect(0, 0, w, h); c.fillStyle = '#101826'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#28324a'; c.fillRect(0, h - 22, w, 22); c.fillStyle = '#5b7399'; c.fillRect(0, h - 22, w, 3);
    c.save(); c.translate(w / 2, y); c.scale(2.6, 2.6);
    G.drawRobot(c, 0, 0, { face: 1, ph: t * 8, moving: !fly, air: fly, vy: fly ? -100 : 0, jet: fly, inv: 0, t: t, recoil: 0 });
    c.restore();
  };
})(window.G);
