// Generates original, illustrative SVG architectural scenes (no external assets).
import { writeFileSync, mkdirSync } from 'node:fs';
mkdirSync('public/img', { recursive: true });
const W = 1200, H = 800;
const rnd = (s) => () => (s = (s * 16807) % 2147483647) / 2147483647;
const scenes = {
  'coastal-villa': { sky: ['#0b1b2e', '#3b5a78', '#e6b98a'], sea: '#14304a', kind: 'villa', seed: 3 },
  'cliff-house': { sky: ['#101a2a', '#4a5f7a', '#f0c9a0'], sea: '#1b3b57', kind: 'cliff', seed: 5 },
  'mountain-retreat': { sky: ['#0c1522', '#2d4560', '#c9b28f'], sea: '#223446', kind: 'cabin', seed: 7 },
  'alpine-lodge': { sky: ['#101826', '#38506b', '#d8c3a0'], sea: '#2a3d52', kind: 'cabin', seed: 11 },
  'glass-residence': { sky: ['#0a1320', '#294662', '#9fb7c9'], sea: '#18324a', kind: 'modern', seed: 13 },
  'courtyard-house': { sky: ['#111b2b', '#3c5470', '#d9b88a'], sea: '#1f3850', kind: 'modern', seed: 17 },
  'boutique-hotel': { sky: ['#0d1624', '#33506c', '#e3b98b'], sea: '#1a3650', kind: 'hotel', seed: 19 },
  'harbor-inn': { sky: ['#0e1826', '#2f4a66', '#d2ad84'], sea: '#183148', kind: 'hotel', seed: 23 },
  'concrete-pavilion': { sky: ['#0b121d', '#2b3f56', '#a9b4c0'], sea: '#1a2e43', kind: 'landmark', seed: 29 },
  'tower-landmark': { sky: ['#0a111b', '#27394f', '#b8a98f'], sea: '#192c40', kind: 'landmark', seed: 31 },
  'interior-lounge': { sky: ['#1a1410', '#4a3a2c', '#c9a97a'], sea: '#2a2018', kind: 'interior', seed: 37 },
  'interior-kitchen': { sky: ['#141618', '#3a3f45', '#b7a98f'], sea: '#22262a', kind: 'interior', seed: 41 },
  'dest-coast': { sky: ['#0a1a2c', '#2f6a8c', '#f2c58f'], sea: '#14405e', kind: 'shore', seed: 43 },
  'dest-mountain': { sky: ['#0b1420', '#3a5877', '#e0c9a5'], sea: '#2a4258', kind: 'range', seed: 47 },
  'dest-road': { sky: ['#0d1624', '#47607c', '#efc08a'], sea: '#2c3e50', kind: 'road', seed: 53 },
  'dest-culture': { sky: ['#101a28', '#3d5470', '#d6b487'], sea: '#223a52', kind: 'landmark', seed: 59 },
  'dest-nature': { sky: ['#0a1a1c', '#2f5a57', '#cdd6a6'], sea: '#1e4442', kind: 'range', seed: 61 },
  'dest-retreat': { sky: ['#101826', '#3f5670', '#e6c493'], sea: '#2a4156', kind: 'cabin', seed: 67 },
};
function build(name, s) {
  const r = rnd(s.seed * 977);
  let o = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">`;
  o += `<defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.sky[0]}"/><stop offset=".6" stop-color="${s.sky[1]}"/><stop offset="1" stop-color="${s.sky[2]}"/></linearGradient>`;
  o += `<linearGradient id="gl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd9a0"/><stop offset="1" stop-color="#d89a4a"/></linearGradient></defs>`;
  o += `<rect width="${W}" height="${H}" fill="url(#sk)"/>`;
  for (let i = 0; i < 40; i++) o += `<circle cx="${r() * W}" cy="${r() * 300}" r="${r() * 1.3 + 0.3}" fill="#fff" opacity="${0.2 + r() * 0.5}"/>`;
  const hz = 520;
  const win = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#gl)" opacity=".92"/>`;
  const ridge = (base, amp, col, op = 1) => { let p = `M0 ${H} L0 ${base}`; for (let x = 0; x <= W; x += 60) p += ` L${x} ${base - r() * amp}`; return `<path d="${p} L${W} ${H} Z" fill="${col}" opacity="${op}"/>`; };
  if (['range', 'cabin', 'road'].includes(s.kind)) { o += ridge(430, 160, '#1c2f44', .8) + ridge(500, 120, '#14243a') + ridge(580, 80, '#0c1827'); }
  else { o += `<rect y="${hz}" width="${W}" height="${H - hz}" fill="${s.sea}"/>`; for (let i = 0; i < 14; i++) o += `<rect x="${300 + r() * 600}" y="${hz + 12 + i * 18}" width="${60 + r() * 160}" height="2" fill="#fff" opacity=".12"/>`; }
  switch (s.kind) {
    case 'villa': o += `<rect x="220" y="360" width="760" height="170" fill="#0a1018"/><rect x="180" y="340" width="840" height="24" fill="#05080d"/>`; for (let i = 0; i < 8; i++) o += win(250 + i * 90, 395, 60, 100); o += `<rect x="0" y="530" width="${W}" height="20" fill="#121a24"/>`; break;
    case 'cliff': o += `<path d="M0 ${H} L0 470 L420 440 L520 520 L${W} 560 L${W} ${H}Z" fill="#0d151f"/><rect x="120" y="360" width="440" height="90" fill="#05080d"/><rect x="100" y="345" width="480" height="18" fill="#0a1018"/>`; for (let i = 0; i < 5; i++) o += win(150 + i * 80, 380, 52, 56); break;
    case 'cabin': o += `<path d="M340 520 L600 330 L860 520Z" fill="#060a10"/><rect x="380" y="500" width="440" height="80" fill="#0a1018"/>`; o += win(520, 430, 80, 90) + win(620, 430, 80, 90) + win(440, 520, 60, 50) + win(700, 520, 60, 50); for (let i = 0; i < 14; i++) { const x = 60 + r() * 1080; o += `<path d="M${x} 600 L${x + 22} 520 L${x + 44} 600Z" fill="#07121a"/>`; } break;
    case 'modern': o += `<rect x="240" y="330" width="720" height="150" fill="#0a1018"/><rect x="180" y="470" width="620" height="110" fill="#070c13"/><rect x="200" y="320" width="800" height="14" fill="#d8bd8a" opacity=".55"/>`; o += `<rect x="270" y="360" width="660" height="100" fill="url(#gl)" opacity=".35"/>`; for (let i = 0; i < 6; i++) o += `<rect x="${268 + i * 112}" y="360" width="3" height="100" fill="#05080d"/>`; o += `<rect x="0" y="580" width="${W}" height="${H - 580}" fill="#0b121b"/>`; break;
    case 'hotel': for (let k = 0; k < 3; k++) { const x = 220 + k * 260, h = 200 + k % 2 * 70; o += `<rect x="${x}" y="${hz - h}" width="230" height="${h}" fill="#0a1018"/>`; for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) if (r() > .25) o += win(x + 24 + i * 68, hz - h + 28 + j * 46, 40, 28); } break;
    case 'landmark': o += `<rect x="540" y="200" width="120" height="${hz - 200}" fill="#080d14"/><rect x="520" y="190" width="160" height="14" fill="#d8bd8a" opacity=".6"/>`; for (let j = 0; j < 8; j++) o += `<rect x="560" y="${230 + j * 34}" width="80" height="6" fill="#ffd9a0" opacity="${.3 + r() * .5}"/>`; o += `<rect x="260" y="${hz - 70}" width="680" height="70" fill="#0a1018"/>`; for (let i = 0; i < 10; i++) o += `<rect x="${290 + i * 64}" y="${hz - 60}" width="6" height="60" fill="#d8bd8a" opacity=".5"/>`; break;
    case 'interior': o = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="gl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd9a0"/><stop offset="1" stop-color="#d89a4a"/></linearGradient></defs><rect width="${W}" height="${H}" fill="${s.sky[1]}"/><rect y="560" width="${W}" height="240" fill="${s.sky[0]}"/><rect x="140" y="110" width="560" height="380" fill="#0d1a2a"/><rect x="150" y="120" width="540" height="360" fill="#2a4766" opacity=".8"/><rect x="418" y="110" width="4" height="380" fill="#080d14"/><rect x="760" y="300" width="300" height="140" fill="#1a130d"/><rect x="740" y="420" width="340" height="60" fill="#241a12"/><circle cx="910" cy="190" r="46" fill="url(#gl)" opacity=".85"/><rect x="908" y="60" width="4" height="84" fill="#d8bd8a"/><rect x="200" y="590" width="420" height="14" fill="#d8bd8a" opacity=".4"/>`; break;
    case 'shore': o += `<path d="M0 ${H} L0 600 Q300 560 600 620 T${W} 600 L${W} ${H}Z" fill="#d9bf92" opacity=".9"/><circle cx="880" cy="250" r="60" fill="#ffe3b0" opacity=".9"/>`; break;
    case 'range': o += `<circle cx="860" cy="230" r="54" fill="#f1dfb8" opacity=".85"/>`; break;
    case 'road': o += `<path d="M520 ${H} L680 ${H} L610 440 L590 440Z" fill="#0a0f16"/><path d="M598 ${H} L602 ${H} L600 450Z" stroke="#d8bd8a" stroke-width="3" stroke-dasharray="22 18" fill="none"/><circle cx="600" cy="300" r="52" fill="#f6d9a6" opacity=".85"/>`; break;
  }
  return o + `</svg>`;
}
for (const [n, s] of Object.entries(scenes)) writeFileSync(`public/img/${n}.svg`, build(n, s));
console.log('generated', Object.keys(scenes).length);
