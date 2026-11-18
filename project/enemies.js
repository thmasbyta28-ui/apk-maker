(function (G) {
  var T = G.T;

  G.spawn = function (r, d) {
    var def = G.EN[d.t], boss = d.t === 'boss';
    var hp = boss ? 50 + r.n * 6 : def.hp * (1 + r.n * 0.07);
    var e = { t: d.t, w: def.w, h: def.h, x: d.x - def.w / 2, y: d.t === 'drone' ? d.y : d.y - def.h,
      vx: 0, vy: 0, hp: hp, maxHp: hp, face: -1, dir: Math.random() < 0.5 ? -1 : 1, cd: 1 + Math.random(),
      ph: Math.random() * 6, walk: 0, hitT: 0, ground: false, baseY: d.y, aim: 0, jt: 1, summon: 5, recoil: 0, dead: false };
    r.en.push(e);
    return e;
  };

  function eshoot(e, ox, oy, sp, dmg, rad, col, spread) {
    var r = G.run, p = r.p;
    var a = Math.atan2(p.y + p.h / 2 - oy, p.x + p.w / 2 - ox) + (spread || 0);
    r.bl.push({ x: ox, y: oy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, dmg: dmg, own: 'e', r: rad, life: 3, col: col });
    e.aim = a; e.recoil = 3;
  }

  function patrol(L, e, sp, dt) {
    var fx = Math.floor((e.x + (e.dir > 0 ? e.w + 3 : -3)) / T), fy = Math.floor((e.y + e.h + 4) / T);
    if (e.ground && G.cell(L, fx, fy) !== '#') e.dir *= -1;
    e.vx = e.dir * sp; e.face = e.dir;
  }

  G.hitEnemy = function (e, dmg, dir) {
    var r = G.run, def = G.EN[e.t], cx = e.x + e.w / 2, cy = e.y + e.h / 2, boss = e.t === 'boss';
    if (e.dead) return;
    e.hp -= dmg; e.hitT = 0.1;
    G.burst(cx, cy, '#ffe08a', 3, 100);
    if (e.hp <= 0) {
      e.dead = true; r.kills++;
      var cols = { soldier: '#8a9a62', turret: '#8b95a8', drone: '#ff5c7a', tank: '#7c8a6a', jumper: '#ff9a3d', boss: '#ff4d4d' };
      G.burst(cx, cy, cols[e.t], boss ? 60 : 16, boss ? 320 : 220);
      G.burst(cx, cy, '#ffb347', boss ? 30 : 8, 200);
      G.burst(cx, cy, '#7df0ff', 6 + Math.min(14, def.rew), 150);
      G.addGems(def.rew, cx, e.y - 6);
      r.shake = Math.max(r.shake, boss ? 0.8 : 0.18);
      if (boss) { r.bossAlive = false; G.pop(cx, e.y - 30, 'باس نابود شد!', '#ffe08a'); }
    }
  };

  G.updateEnemies = function (dt) {
    var r = G.run, L = r.L, p = r.p, spd = Math.min(330, 240 + r.n * 3);
    r.en.forEach(function (e) {
      if (e.dead) return;
      var def = G.EN[e.t], ex = e.x + e.w / 2, ey = e.y + e.h / 2, px = p.x + p.w / 2, py = p.y + p.h / 2;
      var dx = px - ex, dy = py - ey, dist = Math.sqrt(dx * dx + dy * dy), sgn = dx >= 0 ? 1 : -1, near;
      e.hitT = Math.max(0, e.hitT - dt); e.cd -= dt; e.ph += dt; e.recoil = Math.max(0, e.recoil - dt * 30);
      if (Math.abs(dx) > 900) return;

      switch (e.t) {
        case 'soldier':
          near = dist < def.range && Math.abs(dy) < 110;
          if (near) {
            e.face = sgn; e.vx = 0;
            if (e.cd <= 0) { eshoot(e, ex + e.face * 14, e.y + 14, spd, 1, 4, '#ff8a5c'); e.cd = def.gun + Math.random() * 0.6; }
          } else patrol(L, e, def.sp, dt);
          e.vy = Math.min(800, e.vy + 1500 * dt); G.move(L, e, dt);
          if (e.hitX && !near) e.dir *= -1;
          e.walk += Math.abs(e.vx) * dt * 0.1;
          break;
        case 'turret':
          if (dist < def.range) {
            e.aim = Math.atan2(py - (e.y + 6), px - ex); e.face = sgn;
            if (e.cd <= 0) { eshoot(e, ex + Math.cos(e.aim) * 18, e.y + 6 + Math.sin(e.aim) * 18, spd, 1, 4, '#ff8a5c'); e.cd = def.gun; }
          }
          break;
        case 'drone':
          near = dist < def.range; e.face = sgn;
          e.vx += ((near ? sgn * def.sp * (Math.abs(dx) > 150 ? 1 : -0.6) : Math.sin(e.ph * 0.7) * 30) - e.vx) * Math.min(1, dt * 3);
          e.vy += (((near ? py - 90 : e.baseY) - ey) * 1.2 + Math.sin(e.ph * 3) * 20 - e.vy) * Math.min(1, dt * 3);
          G.move(L, e, dt);
          if (near && e.cd <= 0) { eshoot(e, ex, ey + 8, spd * 0.9, 1, 4, '#ff5c7a'); e.cd = def.gun + Math.random() * 0.8; }
          break;
        case 'tank':
          near = dist < 520;
          if (near && Math.abs(dx) > 170) { e.vx = sgn * def.sp; e.face = sgn; }
          else if (!near) patrol(L, e, def.sp, dt); else { e.vx = 0; e.face = sgn; }
          if (near && e.cd <= 0 && Math.abs(dy) < 200) { eshoot(e, ex + e.face * 20, e.y + 4, 190, 2, 7, '#ffb347'); e.cd = def.gun; }
          e.vy = Math.min(800, e.vy + 1500 * dt); G.move(L, e, dt);
          if (e.hitX && !near) e.dir *= -1;
          e.walk += Math.abs(e.vx) * dt * 0.12;
          break;
        case 'jumper':
          if (e.ground) {
            e.vx *= 0.7; e.jt -= dt;
            if (dist < def.range) {
              e.face = sgn;
              if (e.jt <= 0) { e.vy = -470; e.vx = sgn * def.sp * 1.7; e.jt = 1.1 + Math.random() * 0.6; }
            } else patrol(L, e, 30, dt);
          }
          e.vy = Math.min(800, e.vy + 1500 * dt); G.move(L, e, dt);
          break;
        case 'boss':
          var rage = e.hp / e.maxHp < 0.5, want = Math.abs(dx) > 260 ? sgn : (Math.abs(dx) < 140 ? -sgn : 0);
          e.vx = want * def.sp * (rage ? 1.6 : 1); e.face = sgn;
          e.jt -= dt;
          if (e.ground && e.jt <= 0) { e.vy = -560; e.jt = 3 + Math.random() * 2; }
          e.vy = Math.min(800, e.vy + 1500 * dt); G.move(L, e, dt);
          e.walk += Math.abs(e.vx) * dt * 0.08;
          if (e.cd <= 0 && dist < def.range) {
            var cnt = rage ? 7 : 5, k;
            for (k = 0; k < cnt; k++) eshoot(e, ex + sgn * 30, e.y + 26, 260, 1, 5, '#ff4d4d', (k - (cnt - 1) / 2) * 0.16);
            e.cd = def.gun * (rage ? 0.7 : 1);
          }
          e.summon -= dt;
          if (rage && e.summon <= 0) { e.summon = 7; G.spawn(r, { t: 'drone', x: ex, y: e.y - 60 }); }
          break;
      }

      if (e.y > G.ROWS * T + 120) { e.dead = true; return; }
      if (!r.over && !r.won && G.rect(e, p)) {
        if (p.vy > 100 && p.y + p.h - e.y < 22) { G.hitEnemy(e, 2.5, sgn); p.vy = -400; }
        else G.hurt(e.t === 'tank' || e.t === 'boss' ? 2 : 1, sgn);
      }
    });
    r.en = r.en.filter(function (e) { return !e.dead; });
  };
})(window.G);
