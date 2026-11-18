(function (G) {
  var T = G.T, TAU = Math.PI * 2, FONT = '"Vazirmatn", system-ui, sans-serif';
  function rr(c, x, y, w, h, r) {
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  G.rr = rr;

  /* two-bone walking legs; hip line at hipY, feet near y=0 */
  G.legs = function (c, hipY, sep, len, ph, air, vy, col, joint, foot) {
    for (var i = 0; i < 2; i++) {
      var off = i * Math.PI, a, k;
      if (air) { a = (i ? 0.5 : -0.25) + Math.max(-0.3, Math.min(0.3, vy / 1500)); k = 0.9; }
      else if (ph === null) { a = 0; k = 0; }
      else { a = Math.sin(ph + off) * 0.62; k = Math.max(0, Math.cos(ph + off)) * 1.0; }
      var hx = i ? sep : -sep, kx = hx + Math.sin(a) * len, ky = hipY + Math.cos(a) * len;
      var b = a - k, ax = kx + Math.sin(b) * len, ay = ky + Math.cos(b) * len;
      c.strokeStyle = col; c.lineWidth = 4; c.lineCap = 'round'; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(hx, hipY); c.lineTo(kx, ky); c.lineTo(ax, ay); c.stroke();
      c.fillStyle = joint; c.beginPath(); c.arc(kx, ky, 2, 0, TAU); c.fill();
      c.fillStyle = foot; rr(c, ax - 2.5, ay - 1.5, 8, 3.5, 1.5); c.fill();
    }
  };

  /* the player robot: x = center, y = feet */
  G.drawRobot = function (c, x, y, o) {
    c.save(); c.translate(Math.round(x), Math.round(y)); c.scale(o.face, 1);
    var bob = o.moving && !o.air ? Math.abs(Math.sin(o.ph)) * 1.6 : 0, pulse = Math.sin(o.t * 5);
    if (o.inv > 0 && Math.floor(o.t * 20) % 2) c.globalAlpha = 0.4;
    if (o.jet) {
      var fl = 9 + Math.random() * 8;
      c.fillStyle = '#ff7a3d'; c.beginPath(); c.moveTo(-12.5, -13); c.lineTo(-9, -13); c.lineTo(-10.7, -13 + fl + 6); c.closePath(); c.fill();
      c.fillStyle = '#ffe08a'; c.beginPath(); c.moveTo(-11.8, -13); c.lineTo(-9.7, -13); c.lineTo(-10.7, -13 + fl); c.closePath(); c.fill();
    }
    G.legs(c, -14, 3.5, 7, (o.moving || o.air) ? o.ph : null, o.air, o.vy, '#47566e', '#38d0ff', '#2b3547');
    c.translate(0, -bob);
    c.fillStyle = '#3a475c'; rr(c, -13, -27, 6, 13, 2); c.fill();
    c.fillStyle = '#ff8a3d'; c.fillRect(-12, -17, 4, 2);
    c.strokeStyle = '#47566e'; c.lineWidth = 3.2; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-4, -23); c.lineTo(-7, -17); c.stroke();
    c.fillStyle = '#d7deea'; rr(c, -8, -26, 16, 13, 3); c.fill();
    c.fillStyle = '#47566e'; rr(c, -5, -23.5, 10, 7.5, 2); c.fill();
    c.fillStyle = '#38d0ff'; c.globalAlpha *= 0.35; c.beginPath(); c.arc(0, -19.8, 4.5 + pulse * 0.6, 0, TAU); c.fill(); c.globalAlpha /= 0.35;
    c.beginPath(); c.arc(0, -19.8, 2.2 + pulse * 0.3, 0, TAU); c.fill();
    c.fillStyle = '#8b97ad'; c.fillRect(-7, -14.5, 14, 1.5);
    c.fillStyle = '#47566e'; c.fillRect(-2, -28, 4, 3);
    c.fillStyle = '#d7deea'; rr(c, -6, -36, 12, 9, 3); c.fill();
    c.fillStyle = '#0f1b2a'; rr(c, -1, -34.5, 7, 4.5, 2); c.fill();
    c.fillStyle = '#38d0ff'; c.fillRect(2, -33.5, 3, 2.2);
    c.strokeStyle = '#8b97ad'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-3, -36); c.lineTo(-4, -40); c.stroke();
    c.fillStyle = Math.sin(o.t * 6) > 0 ? '#ff5470' : '#5a2430'; c.beginPath(); c.arc(-4, -40.5, 1.4, 0, TAU); c.fill();
    var rc = o.recoil || 0;
    c.strokeStyle = '#8b97ad'; c.lineWidth = 3.2; c.beginPath(); c.moveTo(5, -23); c.lineTo(10 - rc * 0.5, -19); c.stroke();
    c.fillStyle = '#2b3547'; rr(c, 7 - rc, -22, 13, 5, 1.5); c.fill();
    c.fillStyle = '#ff8a3d'; c.fillRect(18 - rc, -21, 2, 3);
    c.restore();
  };

  function drawSoldier(c, e, col) {
    var moving = Math.abs(e.vx) > 1;
    G.legs(c, -14, 3.5, 7, moving ? e.walk : null, !e.ground, e.vy, col('#4a5636'), '#2a3320', '#222');
    c.fillStyle = col('#6b7a4f'); rr(c, -7, -27, 14, 14, 3); c.fill();
    c.fillStyle = col('#3d4730'); c.fillRect(-7, -17, 14, 2);
    c.fillStyle = col('#e0b48f'); c.beginPath(); c.arc(1, -31, 5, 0, TAU); c.fill();
    c.fillStyle = col('#4d5a39'); c.beginPath(); c.arc(1, -32, 5.8, Math.PI, TAU); c.fill(); c.fillRect(-5, -33, 13, 1.6);
    c.fillStyle = '#222'; c.fillRect(3, -31, 1.6, 1.6);
    c.fillStyle = col('#2b2b2b'); rr(c, 2 - e.recoil, -22.5, 17, 3.6, 1); c.fill(); c.fillRect(-2 - e.recoil, -21.5, 6, 3);
    c.strokeStyle = col('#6b7a4f'); c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(3, -24); c.lineTo(8, -20.5); c.stroke();
  }
  function drawJumper(c, e, col) {
    var h = e.ground ? 8 : 15, i;
    c.strokeStyle = col('#8a8f9a'); c.lineWidth = 2.5; c.lineJoin = 'round'; c.beginPath(); c.moveTo(0, 0);
    for (i = 1; i <= 4; i++) c.lineTo(i % 2 ? -5 : 5, -h * i / 5);
    c.lineTo(0, -h); c.stroke();
    c.fillStyle = col('#ff9a3d'); c.beginPath(); c.arc(0, -h - 9, 10, 0, TAU); c.fill();
    c.fillStyle = col('#b8641d'); c.fillRect(-10, -h - 8, 20, 2);
    c.fillStyle = '#fff'; c.beginPath(); c.arc(3, -h - 10, 4, 0, TAU); c.fill();
    c.fillStyle = '#2a1608'; c.beginPath(); c.arc(4.2, -h - 10, 2, 0, TAU); c.fill();
    c.strokeStyle = col('#8a8f9a'); c.lineWidth = 1.4; c.beginPath(); c.moveTo(-3, -h - 18); c.lineTo(-5, -h - 23); c.stroke();
  }
  function drawBoss(c, e, col, t) {
    var moving = Math.abs(e.vx) > 1, rage = e.hp / e.maxHp < 0.5, pulse = 0.6 + Math.sin(t * (rage ? 12 : 5)) * 0.4;
    c.scale(2.1, 2.1);
    G.legs(c, -14, 4.5, 7, moving ? e.walk : null, !e.ground, e.vy, col('#3a2a30'), '#ff4d4d', '#1c1216');
    c.fillStyle = col('#5a3640'); rr(c, -11, -29, 22, 16, 3); c.fill();
    c.fillStyle = col('#2a1c20'); rr(c, -6, -26, 12, 9, 2); c.fill();
    c.fillStyle = '#ff4d4d'; c.globalAlpha = 0.4 * pulse; c.beginPath(); c.arc(0, -21.5, 6, 0, TAU); c.fill(); c.globalAlpha = 1;
    c.beginPath(); c.arc(0, -21.5, 2.8, 0, TAU); c.fill();
    c.fillStyle = col('#3a2a30'); rr(c, -16, -31, 7, 10, 2); c.fill(); rr(c, 9, -31, 7, 10, 2); c.fill();
    c.fillStyle = col('#4a3038'); rr(c, -7, -38, 14, 10, 3); c.fill();
    c.fillStyle = '#1a0f12'; rr(c, -1, -36, 8, 5, 2); c.fill();
    c.fillStyle = rage ? '#ffb347' : '#ff4d4d'; c.fillRect(2, -35, 4, 3);
    c.fillStyle = col('#3a2a30'); c.beginPath(); c.moveTo(-6, -38); c.lineTo(-9, -44); c.lineTo(-3, -38); c.fill(); c.beginPath(); c.moveTo(6, -38); c.lineTo(9, -44); c.lineTo(3, -38); c.fill();
    c.fillStyle = col('#2a1c20'); rr(c, 8 - e.recoil, -25, 18, 6, 2); c.fill(); c.fillStyle = '#ff4d4d'; c.fillRect(24 - e.recoil, -24, 2, 4);
  }
  function drawDrone(c, e, col, t) {
    c.fillStyle = col('#5a2430'); c.beginPath(); c.ellipse(0, 0, 14, 8, 0, 0, TAU); c.fill();
    c.fillStyle = col('#7a3345'); c.beginPath(); c.ellipse(0, -2, 10, 5, 0, Math.PI, TAU); c.fill();
    c.fillStyle = '#ff4d6a'; c.beginPath(); c.arc(e.face * 5, 1, 3.6 + Math.sin(t * 6) * 0.5, 0, TAU); c.fill();
    c.strokeStyle = col('#2a1218'); c.lineWidth = 2; c.beginPath(); c.moveTo(0, -8); c.lineTo(0, -11); c.moveTo(-5, 8); c.lineTo(-7, 12); c.moveTo(5, 8); c.lineTo(7, 12); c.stroke();
    c.globalAlpha = 0.35; c.fillStyle = '#c9d3e3'; c.beginPath(); c.ellipse(0, -11, 17, 1.8, 0, 0, TAU); c.fill(); c.globalAlpha = 1;
    c.strokeStyle = '#c9d3e3'; c.lineWidth = 1.5; var s = Math.sin(t * 40) * 16; c.beginPath(); c.moveTo(-s, -11); c.lineTo(s, -11); c.stroke();
  }
  function drawTank(c, e, col, aim) {
    var i;
    c.fillStyle = col('#2f3a2a'); rr(c, -21, -9, 42, 9, 4.5); c.fill();
    for (i = 0; i < 4; i++) {
      var wx = -14 + i * 9.3;
      c.fillStyle = col('#556044'); c.beginPath(); c.arc(wx, -4.5, 3.4, 0, TAU); c.fill();
      c.strokeStyle = '#222'; c.lineWidth = 1; c.beginPath(); c.moveTo(wx + Math.cos(e.walk) * 3, -4.5 + Math.sin(e.walk) * 3); c.lineTo(wx - Math.cos(e.walk) * 3, -4.5 - Math.sin(e.walk) * 3); c.stroke();
    }
    c.fillStyle = col('#6e7d5b'); rr(c, -17, -17, 34, 9, 2); c.fill();
    c.fillStyle = col('#7f8f6a'); rr(c, -8, -24, 16, 8, 3); c.fill();
    c.save(); c.translate(0, -20); c.rotate(aim); c.fillStyle = col('#2b2b2b'); c.fillRect(2, -2.2, 21 - e.recoil, 4.4); c.restore();
    c.fillStyle = '#ffb347'; c.fillRect(-14, -14, 3, 2);
  }
  function drawTurret(c, e, col, aim) {
    c.fillStyle = col('#4a5362'); c.beginPath(); c.moveTo(-14, 0); c.lineTo(14, 0); c.lineTo(9, -9); c.lineTo(-9, -9); c.closePath(); c.fill();
    c.fillStyle = col('#8b95a8'); c.beginPath(); c.arc(0, -9, 9, Math.PI, TAU); c.fill();
    c.save(); c.translate(0, -12); c.rotate(aim); c.fillStyle = col('#2b3140'); c.fillRect(2, -2.5, 16 - e.recoil, 5); c.restore();
    c.fillStyle = '#ff4d4d'; c.beginPath(); c.arc(0, -12, 2.2, 0, TAU); c.fill();
  }

  G.drawEnemy = function (c, e, t, p) {
    var col = function (k) { return e.hitT > 0 ? '#ffffff' : k; };
    var cx = e.x + e.w / 2, by = e.y + e.h, cy = e.y + e.h / 2;
    c.save();
    if (e.t === 'drone') { c.translate(Math.round(cx), Math.round(cy)); drawDrone(c, e, col, t); }
    else {
      c.translate(Math.round(cx), Math.round(by));
      var px = p.x + p.w / 2, py = p.y + p.h / 2;
      if (e.t === 'tank') drawTank(c, e, col, Math.atan2(py - (by - 20), px - cx));
      else if (e.t === 'turret') drawTurret(c, e, col, Math.atan2(py - (by - 12), px - cx));
      else { c.scale(e.face, 1); if (e.t === 'soldier') drawSoldier(c, e, col); else if (e.t === 'jumper') drawJumper(c, e, col); else drawBoss(c, e, col, t); }
    }
    c.restore();
    if (e.hp < e.maxHp && e.t !== 'boss') {
      c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(cx - 14, e.y - 9, 28, 4);
      c.fillStyle = '#ff5470'; c.fillRect(cx - 14, e.y - 9, 28 * Math.max(0, e.hp / e.maxHp), 4);
    }
  };
})(window.G);
