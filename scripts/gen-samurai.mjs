// Generates original samurai-themed SVG artwork (no external assets, fully deterministic).
//   node scripts/gen-samurai.mjs
// Outputs parallax layers to public/img/samurai/ and destination scenes to public/img/.
import { writeFileSync, mkdirSync } from 'node:fs';
mkdirSync('public/img/samurai', { recursive: true });

const rnd = (seed) => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
const f = (n) => Math.round(n * 10) / 10;
const svg = (w, h, body, extra = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" ${extra}>${body}</svg>`;

/* ---------- shared fragments ---------- */
const samurai = (c = '#04070b', rim = 'rgba(232,190,120,.55)') => `
<g fill="${c}" stroke="${rim}" stroke-width="1.2" stroke-linejoin="round">
  <path d="M110 22 L36 98 Q110 116 184 98 Z"/>
  <path d="M110 22 L110 8" stroke-width="3"/>
  <rect x="100" y="98" width="20" height="24" rx="6"/>
  <path d="M148 120 Q202 150 218 262 Q194 240 180 272 Q184 204 156 170 Z"/>
  <path d="M70 118 Q110 104 150 118 L164 196 Q170 252 182 398 L126 398 L110 286 L94 398 L40 398 Q52 252 56 196 Z"/>
  <path d="M72 122 L46 184 L64 222 L84 210 L72 178 L94 134 Z"/>
  <path d="M58 208 L82 226 L77 233 L53 215 Z"/>
  <ellipse cx="84" cy="228" rx="3.2" ry="10" transform="rotate(35 84 228)"/>
  <path d="M87 231 L206 310 L202 318 L83 239 Z"/>
  <path d="M96 190 L152 190" stroke-width="5"/>
</g>`;

const torii = (c = '#b3261e', dark = '#5c0f0b') => `
<path d="M0 22 Q150 56 300 22 L290 48 Q150 80 10 48 Z" fill="${dark}"/>
<path d="M6 16 Q150 50 294 16 L300 22 Q150 56 0 22 Z" fill="#14181d"/>
<rect x="18" y="62" width="264" height="13" fill="${c}"/>
<rect x="40" y="94" width="220" height="12" fill="${c}"/>
<rect x="56" y="58" width="22" height="206" fill="${c}"/><rect x="222" y="58" width="22" height="206" fill="${c}"/>
<rect x="52" y="244" width="30" height="20" fill="#14181d"/><rect x="218" y="244" width="30" height="20" fill="#14181d"/>
<rect x="56" y="58" width="6" height="206" fill="#e0463a" opacity=".55"/><rect x="222" y="58" width="6" height="206" fill="#e0463a" opacity=".55"/>`;

/** Upturned-eave roof. cx centre, yb eave line, w width, h rise. */
const roof = (cx, yb, w, h, c = '#0a0f16', tile = 'rgba(255,255,255,.08)') => {
  const x0 = cx - w / 2 - 22; const x1 = cx + w / 2 + 22;
  return `<path d="M${f(x0)} ${f(yb - 10)} Q${f(x0 + 40)} ${f(yb + 10)} ${f(cx)} ${f(yb + 8)} T${f(x1)} ${f(yb - 10)} L${f(cx + w / 2 - 18)} ${f(yb - h)} L${f(cx - w / 2 + 18)} ${f(yb - h)} Z" fill="${c}"/>`
    + `<path d="M${f(cx - w / 2 + 18)} ${f(yb - h)} L${f(cx + w / 2 - 18)} ${f(yb - h)}" stroke="${tile}" stroke-width="2"/>`;
};
const castle = (cx, base, scale = 1, lit = '#ffd9a0') => {
  const s = scale; let o = '';
  const tiers = [[300, 70], [220, 62], [150, 54], [90, 46]];
  let y = base;
  o += `<path d="M${f(cx - 210 * s)} ${f(base + 70 * s)} L${f(cx - 170 * s)} ${f(base)} L${f(cx + 170 * s)} ${f(base)} L${f(cx + 210 * s)} ${f(base + 70 * s)} Z" fill="#0b1119"/>`;
  tiers.forEach(([w, h], i) => {
    const ww = w * s; const hh = h * s;
    o += `<rect x="${f(cx - ww / 2)}" y="${f(y - hh)}" width="${f(ww)}" height="${f(hh)}" fill="#e9e4d8" opacity=".92"/>`;
    o += `<rect x="${f(cx - ww / 2)}" y="${f(y - hh)}" width="${f(ww)}" height="${f(hh)}" fill="#0a1018" opacity=".55"/>`;
    const n = Math.max(2, Math.floor(ww / (46 * s)));
    for (let k = 0; k < n; k++) o += `<rect x="${f(cx - ww / 2 + (k + 0.5) * (ww / n) - 6 * s)}" y="${f(y - hh * 0.68)}" width="${f(12 * s)}" height="${f(hh * 0.36)}" fill="${lit}" opacity=".85"/>`;
    o += roof(cx, y - hh, ww + 30 * s, 30 * s);
    y -= hh + 26 * s;
  });
  o += `<path d="M${f(cx - 4 * s)} ${f(y + 14 * s)} L${f(cx)} ${f(y - 18 * s)} L${f(cx + 4 * s)} ${f(y + 14 * s)} Z" fill="#0a0f16"/>`;
  return o;
};
const pagoda = (cx, base, s = 1, lit = '#ffd9a0') => {
  let o = ''; let y = base;
  for (let i = 0; i < 5; i++) {
    const w = (150 - i * 22) * s; const h = 34 * s;
    o += `<rect x="${f(cx - w / 2)}" y="${f(y - h)}" width="${f(w)}" height="${f(h)}" fill="#14100e"/>`;
    o += `<rect x="${f(cx - 7 * s)}" y="${f(y - h + 8 * s)}" width="${f(14 * s)}" height="${f(h - 8 * s)}" fill="${lit}" opacity=".8"/>`;
    o += roof(cx, y - h, w + 36 * s, 22 * s, '#0a0f16');
    y -= h + 14 * s;
  }
  o += `<path d="M${f(cx)} ${f(y + 8 * s)} L${f(cx)} ${f(y - 52 * s)}" stroke="#0a0f16" stroke-width="${f(4 * s)}"/>`;
  for (let k = 0; k < 5; k++) o += `<rect x="${f(cx - (10 - k) * s)}" y="${f(y - 8 * s - k * 9 * s)}" width="${f((20 - 2 * k) * s)}" height="${f(3 * s)}" fill="#0a0f16"/>`;
  return o;
};
const pine = (x, y, s, c) => {
  let o = `<rect x="${f(x - 2 * s)}" y="${f(y - 20 * s)}" width="${f(4 * s)}" height="${f(24 * s)}" fill="${c}"/>`;
  for (let i = 0; i < 4; i++) { const w = (30 - i * 6) * s; const yy = y - 18 * s - i * 16 * s; o += `<path d="M${f(x - w)} ${f(yy)} L${f(x)} ${f(yy - 26 * s)} L${f(x + w)} ${f(yy)} Z" fill="${c}"/>`; }
  return o;
};
const ridge = (W, base, amp, seed, c, step = 50) => {
  const r = rnd(seed); let p = `M0 ${base + amp * 2} L0 ${base}`;
  for (let x = step; x <= W + step; x += step) p += ` L${x} ${f(base - r() * amp)}`;
  return `<path d="${p} L${W} ${base + amp * 2} Z" fill="${c}"/>`;
};
const blossom = (x, y, r, rot, c = '#f4b6c8', c2 = '#fff0f4') => {
  let o = `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot})">`;
  for (let i = 0; i < 5; i++) o += `<path d="M0 0 C${f(-r * .55)} ${f(-r * .5)} ${f(-r * .5)} ${f(-r * 1.05)} 0 ${f(-r * .92)} C${f(r * .5)} ${f(-r * 1.05)} ${f(r * .55)} ${f(-r * .5)} 0 0Z" fill="${c}" transform="rotate(${i * 72})" opacity=".95"/>`;
  return o + `<circle r="${f(r * .16)}" fill="${c2}"/></g>`;
};
const sakuraBranch = (W, H, seed, dir = 1, n = 46) => {
  const r = rnd(seed); const sx = (x) => (dir === 1 ? x : W - x);
  let o = `<path d="M${sx(W)} ${f(H * .08)} C${sx(W * .78)} ${f(H * .16)} ${sx(W * .62)} ${f(H * .14)} ${sx(W * .45)} ${f(H * .4)} S${sx(W * .2)} ${f(H * .62)} ${sx(W * .08)} ${f(H * .56)}" fill="none" stroke="#1a1210" stroke-width="${f(H * .03)}" stroke-linecap="round"/>`;
  o += `<path d="M${sx(W * .62)} ${f(H * .14)} C${sx(W * .55)} ${f(H * .3)} ${sx(W * .5)} ${f(H * .36)} ${sx(W * .52)} ${f(H * .5)}" fill="none" stroke="#1a1210" stroke-width="${f(H * .016)}" stroke-linecap="round"/>`;
  for (let i = 0; i < n; i++) {
    const t = r(); const x = W * (0.05 + t * 0.92); const y = H * (0.1 + Math.abs(Math.sin(t * 3.1)) * 0.5) + r() * H * .16;
    o += blossom(sx(x), y, H * (0.035 + r() * 0.04), f(r() * 360), r() > .35 ? '#f4b6c8' : '#fbd3df');
  }
  return o;
};

/* ---------- seasonal branches (Phase 2) ----------
 * Reuse the sakura trunk (sakuraBranch with zero blossoms) and dress it for another season.
 * Positions follow the same scatter rule as the blossoms, so every season sits on the same silhouette. */
const leaf = (x, y, r, rot, c, vein) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot})"><path d="M0 0 C${f(-r * .5)} ${f(-r * .4)} ${f(-r * .38)} ${f(-r * .98)} 0 ${f(-r * 1.2)} C${f(r * .38)} ${f(-r * .98)} ${f(r * .5)} ${f(-r * .4)} 0 0Z" fill="${c}"/><path d="M0 0 L0 ${f(-r * 1.05)}" stroke="${vein}" stroke-width="1" opacity=".5"/></g>`;
const MAPLE = [[0, -1], [.22, -.5], [.62, -.62], [.5, -.18], [.98, -.1], [.52, .2], [.62, .58], [.2, .42], [0, .95], [-.2, .42], [-.62, .58], [-.52, .2], [-.98, -.1], [-.5, -.18], [-.62, -.62], [-.22, -.5]];
const maple = (x, y, r, rot, c) => `<path transform="translate(${f(x)} ${f(y)}) rotate(${rot})" d="M${MAPLE.map(([a, b]) => `${f(a * r)} ${f(b * r)}`).join(' L')}Z" fill="${c}" opacity=".95"/>`;
const seasonBranch = (W, H, seed, dir, season) => {
  const r = rnd(seed); const sx = (x) => (dir === 1 ? x : W - x);
  let o = sakuraBranch(W, H, seed, dir, 0); // trunk only
  // Winter: snow riding on top of the same trunk strokes (dashed white copy, nudged up).
  if (season === 'winter') o += `<g transform="translate(0 ${f(-H * .013)})" opacity=".95">${o.replace(/stroke="#1a1210"/g, 'stroke="#eef4fa"').replace(/stroke-width="[\d.]+"/g, `stroke-width="${f(H * .012)}" stroke-dasharray="${f(H * .09)} ${f(H * .06)}"`)}</g>`;
  const n = season === 'winter' ? 14 : 40;
  for (let i = 0; i < n; i++) {
    const t = r(); const x = W * (0.05 + t * 0.92); const y = H * (0.1 + Math.abs(Math.sin(t * 3.1)) * 0.5) + r() * H * .16;
    const size = H * (0.035 + r() * 0.04); const rot = f(r() * 360); const pick = r();
    if (season === 'summer') o += leaf(sx(x), y, size * 1.5, rot, pick > .5 ? '#2f7d5a' : pick > .2 ? '#1f5a45' : '#4fa070', '#0e2a20');
    else if (season === 'autumn') o += maple(sx(x), y, size * 1.15, rot, pick > .66 ? '#c8641e' : pick > .33 ? '#a63f16' : '#e0902f');
    else { // winter: bare twig tipped with snow
      const dx = f((r() - .5) * H * .09); const dy = f((r() - .2) * H * .09);
      o += `<path d="M${f(sx(x))} ${f(y)} l${dx} ${dy}" stroke="#4a3d35" stroke-width="${f(H * .009)}" stroke-linecap="round"/><circle cx="${f(sx(x) + dx)}" cy="${f(y + dy)}" r="${f(size * .22)}" fill="${pick > .5 ? '#eef4fa' : '#cfdcea'}"/>`;
    }
  }
  return o;
};

/* ---------- parallax layers (public/img/samurai) ---------- */
const w = (name, content) => writeFileSync(`public/img/samurai/${name}.svg`, content);

w('moon', svg(600, 600, `<defs><radialGradient id="g" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff6dc" stop-opacity=".9"/><stop offset=".35" stop-color="#ffe4b0" stop-opacity=".35"/><stop offset="1" stop-color="#ffe4b0" stop-opacity="0"/></radialGradient>
<radialGradient id="m" cx="40%" cy="38%" r="70%"><stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#f2d9a6"/></radialGradient></defs>
<circle cx="300" cy="300" r="300" fill="url(#g)"/><circle cx="300" cy="300" r="132" fill="url(#m)"/>
<circle cx="262" cy="270" r="22" fill="#e9c98f" opacity=".45"/><circle cx="342" cy="338" r="30" fill="#e9c98f" opacity=".35"/><circle cx="320" cy="248" r="12" fill="#e9c98f" opacity=".4"/>`));

w('fuji', svg(1600, 520, `<defs><linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a4f72"/><stop offset="1" stop-color="#1b2a45"/></linearGradient></defs>
${ridge(1600, 330, 90, 11, '#24365a', 70)}
<path d="M360 520 L640 140 Q700 96 760 140 L1060 520 Z" fill="url(#f)"/>
<path d="M600 190 L640 140 Q700 96 760 140 L800 190 L760 170 L735 208 L705 172 L675 214 L650 176 Z" fill="#e8eef7" opacity=".92"/>
${ridge(1600, 420, 70, 23, '#182640', 60)}`, 'preserveAspectRatio="xMidYMax slice"'));

w('hills', svg(1600, 420, `${ridge(1600, 250, 80, 31, '#101c30', 55)}
${Array.from({ length: 26 }, (_, i) => pine(30 + i * 62 + (i % 3) * 9, 300 + (i % 4) * 14, 0.8 + (i % 3) * 0.15, '#0b1424')).join('')}
${ridge(1600, 330, 40, 41, '#0b1424', 45)}`, 'preserveAspectRatio="xMidYMax slice"'));

w('mist', svg(1600, 260, `<defs><linearGradient id="a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fb3d1" stop-opacity="0"/><stop offset=".55" stop-color="#9fb3d1" stop-opacity=".28"/><stop offset="1" stop-color="#9fb3d1" stop-opacity="0"/></linearGradient></defs>
${Array.from({ length: 7 }, (_, i) => `<ellipse cx="${120 + i * 240}" cy="${120 + (i % 3) * 28}" rx="${260 + (i % 2) * 70}" ry="${44 + (i % 3) * 10}" fill="url(#a)"/>`).join('')}`, 'preserveAspectRatio="none"'));

w('torii', svg(300, 270, torii()));
w('samurai', svg(230, 420, samurai()));
w('cliff', svg(900, 360, `<path d="M0 360 L0 120 Q80 90 150 110 Q250 60 360 80 L520 40 Q640 30 700 70 L900 90 L900 360 Z" fill="#05080d"/>
<path d="M0 120 Q80 90 150 110 Q250 60 360 80 L520 40 Q640 30 700 70 L900 90" fill="none" stroke="rgba(232,190,120,.35)" stroke-width="2"/>
${Array.from({ length: 40 }, (_, i) => `<path d="M${20 + i * 22} 360 L${24 + i * 22} ${160 + (i * 37) % 70} L${28 + i * 22} 360Z" fill="#070b11"/>`).join('')}`, 'preserveAspectRatio="xMidYMax slice"'));
w('sakura-branch', svg(900, 520, sakuraBranch(900, 520, 7, 1, 54)));
w('sakura-branch-left', svg(900, 520, sakuraBranch(900, 520, 19, -1, 54)));

for (const season of ['summer', 'autumn', 'winter']) {
  w(`branch-${season}`, svg(900, 520, seasonBranch(900, 520, 7, 1, season)));
  w(`branch-${season}-left`, svg(900, 520, seasonBranch(900, 520, 19, -1, season)));
}

w('katana', svg(900, 60, `<defs><linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f7fb"/><stop offset=".5" stop-color="#aab6c6"/><stop offset="1" stop-color="#5f6b7c"/></linearGradient></defs>
<path d="M250 26 L880 22 Q892 24 896 30 L880 34 L250 36 Z" fill="url(#b)"/>
<path d="M300 33 Q420 28 560 31 T860 30" fill="none" stroke="#fff" stroke-width="1" opacity=".6"/>
<ellipse cx="238" cy="31" rx="7" ry="20" fill="#d8bd8a"/><ellipse cx="238" cy="31" rx="3" ry="14" fill="#7a5f2a"/>
<rect x="110" y="22" width="122" height="18" rx="4" fill="#1a1a22"/>
${Array.from({ length: 10 }, (_, i) => `<path d="M${118 + i * 12} 22 L${126 + i * 12} 40" stroke="#d8bd8a" stroke-width="2" opacity=".75"/>`).join('')}
<rect x="96" y="20" width="16" height="22" rx="5" fill="#d8bd8a"/>
<path d="M96 31 Q60 30 30 10" fill="none" stroke="#b3261e" stroke-width="3"/><path d="M96 31 Q60 36 30 56" fill="none" stroke="#b3261e" stroke-width="3"/>`));

w('kamon', svg(120, 120, `<g fill="none" stroke="#d8bd8a" stroke-width="3"><circle cx="60" cy="60" r="54"/><circle cx="60" cy="60" r="46" stroke-width="1.2"/></g>
<g fill="#d8bd8a">${Array.from({ length: 8 }, (_, i) => `<path d="M60 60 C46 46 48 20 60 12 C72 20 74 46 60 60Z" transform="rotate(${i * 45} 60 60)" opacity="${i % 2 ? .55 : .95}"/>`).join('')}</g><circle cx="60" cy="60" r="7" fill="#080E16"/>`));

/* ---------- destination scenes (public/img) ---------- */
const W = 1200, H = 800;
const sky = (a, b, c) => `<defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".6" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient>
<radialGradient id="mg" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff2cf" stop-opacity=".85"/><stop offset="1" stop-color="#fff2cf" stop-opacity="0"/></radialGradient>
<linearGradient id="ms" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9c8de" stop-opacity="0"/><stop offset="1" stop-color="#b9c8de" stop-opacity=".5"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#sk)"/>`;
const stars = (seed, n = 50) => { const r = rnd(seed); return Array.from({ length: n }, () => `<circle cx="${f(r() * W)}" cy="${f(r() * 300)}" r="${f(r() * 1.3 + .3)}" fill="#fff" opacity="${f(.2 + r() * .5)}"/>`).join(''); };
const moon = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r * 2.6}" fill="url(#mg)"/><circle cx="${x}" cy="${y}" r="${r}" fill="#fff6dc"/>`;
const mist = (y, h = 120) => `<rect y="${y}" width="${W}" height="${h}" fill="url(#ms)"/>`;
const out = (name, body) => writeFileSync(`public/img/${name}.svg`, svg(W, H, body, 'preserveAspectRatio="xMidYMid slice"'));

// Castle town: moonlit keep on a hill with cherry blossom foreground
out('dest-castle-town', sky('#0b1226', '#3a3f6e', '#e7a98f') + stars(3) + moon(900, 170, 54)
  + ridge(W, 470, 90, 5, '#1c2447', 70) + ridge(W, 540, 60, 8, '#121a36', 60)
  + `<path d="M0 800 L0 600 Q200 540 420 560 L780 560 Q1000 540 1200 600 L1200 800Z" fill="#0a0f1c"/>` + castle(600, 560, 1, '#ffd9a0')
  + mist(500, 140) + pine(160, 720, 1.4, '#05080d') + pine(1040, 730, 1.6, '#05080d') + pine(230, 745, 1, '#070b14')
  + `<g transform="translate(0 -20)">${sakuraBranch(700, 380, 13, 1, 38)}</g>`
  + `<g transform="translate(500 0)">${sakuraBranch(700, 330, 29, -1, 26)}</g>`
  + `<rect y="740" width="${W}" height="60" fill="#05080d"/>`);

// Nakasendo: a lone wanderer on a lantern-lit forest road
{
  const r = rnd(77); let trees = '';
  for (let i = 0; i < 16; i++) { const x = 20 + i * 76 + r() * 30; const hh = 420 + r() * 200; trees += `<path d="M${f(x)} 800 L${f(x + 6)} ${800 - hh} L${f(x + 18)} 800Z" fill="${i % 2 ? '#0a1512' : '#06100d'}"/>`; for (let k = 0; k < 6; k++) trees += `<path d="M${f(x - 30 + k * 4)} ${f(800 - hh * .4 - k * 55)} L${f(x + 12)} ${f(800 - hh * .4 - k * 55 - 70)} L${f(x + 54 - k * 4)} ${f(800 - hh * .4 - k * 55)}Z" fill="${i % 2 ? '#0c1a16' : '#08120f'}"/>`; }
  out('dest-nakasendo', sky('#071612', '#2c5a52', '#d9c389') + stars(9, 20) + moon(280, 150, 40)
    + ridge(W, 430, 110, 15, '#17352f', 60) + trees
    + `<rect y="640" width="${W}" height="160" fill="#06100d"/><path d="M470 800 L570 470 L630 470 L860 800Z" fill="#1d1a12"/><path d="M540 800 L592 500 L615 500 L710 800Z" fill="#2b2619" opacity=".8"/>`
    + mist(420, 200)
    + `<g transform="translate(600 450) scale(.62)">${samurai('#03070a', 'rgba(255,200,130,.5)')}</g>`
    + [[430, 560], [800, 600]].map(([x, y]) => `<rect x="${x - 2}" y="${y}" width="4" height="170" fill="#05080d"/><rect x="${x - 16}" y="${y - 40}" width="32" height="42" rx="6" fill="#e8923a"/><circle cx="${x}" cy="${y - 19}" r="44" fill="url(#mg)" opacity=".5"/>`).join(''));
}

// Zen temple: five-tier pagoda above the clouds with a vermilion gate
out('dest-zen-temple', sky('#1a1030', '#5b4a86', '#f0b08c') + stars(21, 36) + moon(220, 190, 46)
  + ridge(W, 420, 120, 33, '#2c2552', 80) + ridge(W, 500, 90, 35, '#1c1a3e', 70)
  + pagoda(780, 660, 1.15, '#ffd9a0')
  + `<path d="M0 800 L0 660 Q300 640 560 650 Q900 640 1200 650 L1200 800Z" fill="#0a0c16"/>`
  + mist(540, 160)
  + `<g transform="translate(150 520) scale(.95)">${torii()}</g>`
  + pine(1010, 700, 1.5, '#05060c') + pine(1110, 720, 1.2, '#070810') + pine(60, 770, 1.8, '#05060c')
  + mist(640, 160) + `<rect y="760" width="${W}" height="40" fill="#05060c"/>`);

// Bamboo grove: light shafts and a swordsman at stillness
{
  const r = rnd(101); let stalks = ''; let rays = '';
  for (let i = 0; i < 7; i++) rays += `<path d="M${f(100 + i * 160)} 0 L${f(150 + i * 160)} 0 L${f(40 + i * 160 + 160)} 800 L${f(i * 160 - 20)} 800Z" fill="#fff4cf" opacity="${f(.05 + r() * .06)}"/>`;
  for (let i = 0; i < 26; i++) {
    const x = 10 + i * 46 + r() * 20; const wd = 10 + r() * 14; const c = ['#0b2a1e', '#0e3524', '#071c14', '#12432d'][i % 4];
    stalks += `<rect x="${f(x)}" y="0" width="${f(wd)}" height="800" fill="${c}"/>`;
    for (let k = 0; k < 9; k++) stalks += `<rect x="${f(x - 1)}" y="${f(60 + k * 90 + r() * 30)}" width="${f(wd + 2)}" height="4" fill="#041510"/>`;
    for (let k = 0; k < 4; k++) { const yy = 100 + r() * 600; stalks += `<path d="M${f(x + wd)} ${f(yy)} Q${f(x + wd + 50)} ${f(yy - 14)} ${f(x + wd + 90)} ${f(yy + 10)} Q${f(x + wd + 50)} ${f(yy - 4)} ${f(x + wd)} ${f(yy)}Z" fill="#17583a" opacity=".8"/>`; }
  }
  out('dest-bamboo', sky('#05140f', '#1d5a42', '#e3e6a4') + rays + stalks
    + `<ellipse cx="600" cy="770" rx="320" ry="30" fill="#04100b" opacity=".7"/>`
    + `<g transform="translate(494 400) scale(.88)">${samurai('#020605', 'rgba(255,238,180,.55)')}</g>` + mist(560, 220));
}

console.log('samurai art generated');
