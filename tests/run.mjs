// Dependency-free tests for the Phase 1 foundation. Run with: npm test
// Pure modules are transpiled with the project's own TypeScript, then exercised in Node (no browser, no extra packages).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'tests', '.build');
rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true });
for (const f of ['season-pick', 'preferences-core', 'capability', 'bootScript', 'storage', 'preferences-store', 'scrollHub', 'director', 'particles', 'visibility', 'katana-state', 'katana-geometry', 'sfx', 'data/virtues', 'data/virtue-glyphs']) {
  const src = readFileSync(join(root, 'src', f.includes('/') ? '' : 'lib', f + '.ts'), 'utf8');
  writeFileSync(join(out, f.split('/').pop() + '.js'), ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText);
}
writeFileSync(join(out, 'package.json'), '{"type":"commonjs"}');
const require = createRequire(join(out, 'x.js'));
const core = require('./preferences-core.js');
const { detectCapability } = require('./capability.js');
const { BOOT_SCRIPT } = require('./bootScript.js');

// ---------------------------------------------------------------- preferences normalisation
test('defaults: silent, system motion, auto season, free browse', () => {
  const d = core.normalizePrefs(undefined);
  assert.equal(d.mode, 'fast'); assert.equal(d.season, 'auto'); assert.equal(d.motion, 'system');
  assert.equal(d.audio.enabled, false); assert.equal(d.audio.sfx, false); assert.equal(d.narration, 'captions'); assert.equal(d.performance, 'auto');
});
test('non-object input falls back to defaults without throwing', () => {
  for (const bad of [null, undefined, 'x', 42, true, [], [1, 2], () => 1]) assert.deepEqual(core.normalizePrefs(bad), core.DEFAULT_PREFS);
});
test('a valid object round-trips unchanged', () => {
  const p = core.mergePrefs(core.cloneDefaults(), { mode: 'story', season: 'winter', motion: 'calm', narration: 'captions-voice', performance: 'light', audio: { enabled: true, master: 0.25, sfx: true, ambient: { rain: 0.9 } } });
  assert.deepEqual(core.normalizePrefs(JSON.parse(JSON.stringify(p))), p);
  assert.equal(p.audio.ambient.rain, 0.9); assert.equal(p.audio.ambient.wind, 0.5);
});
test('each bad field falls back alone and good fields survive', () => {
  const p = core.normalizePrefs({ mode: 'story', season: 'monsoon', motion: 7, audio: { enabled: 'yes', master: 'loud', sfx: true, ambient: { wind: 2, rain: -1, water: NaN, insects: '0.3', bogus: 1 } }, narration: 'captions-voice', performance: null });
  assert.equal(p.mode, 'story'); assert.equal(p.season, 'auto'); assert.equal(p.motion, 'system');
  assert.equal(p.audio.enabled, false); assert.equal(p.audio.master, 0.6); assert.equal(p.audio.sfx, true);
  assert.equal(p.audio.ambient.wind, 1); assert.equal(p.audio.ambient.rain, 0); assert.equal(p.audio.ambient.water, 0.5); assert.equal(p.audio.ambient.insects, 0.5);
  assert.ok(!('bogus' in p.audio.ambient)); assert.equal(p.narration, 'captions-voice'); assert.equal(p.performance, 'auto');
});
test('outdated schema and unknown keys are migrated, not trusted', () => {
  const p = core.normalizePrefs({ schema: 0, mode: 'fast', volume: 0.3, theme: 'purple', motion: 'calm' });
  assert.equal(p.schema, core.PREFS_SCHEMA); assert.equal(p.motion, 'calm'); assert.ok(!('volume' in p) && !('theme' in p));
});
test('volumes are clamped and rounded', () => {
  const p = core.normalizePrefs({ audio: { master: 0.123456 } }); assert.equal(p.audio.master, 0.12);
  assert.equal(core.normalizePrefs({ audio: { master: 99 } }).audio.master, 1); assert.equal(core.normalizePrefs({ audio: { master: -3 } }).audio.master, 0);
});
test('normalise never returns shared references to defaults', () => {
  const a = core.normalizePrefs(null); a.audio.ambient.wind = 0; assert.equal(core.DEFAULT_PREFS.audio.ambient.wind, 0.5);
  const b = core.cloneDefaults(); b.audio.ambient.rain = 0; assert.equal(core.DEFAULT_PREFS.audio.ambient.rain, 0.5);
});
test('resolveSeason: explicit wins, auto follows meteorological months', () => {
  assert.equal(core.resolveSeason('winter', new Date(2026, 6, 1)), 'winter');
  const expect = ['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter'];
  expect.forEach((s, m) => assert.equal(core.resolveSeason('auto', new Date(2026, m, 15)), s, `month ${m}`));
});
test('tierFromPref', () => {
  assert.equal(core.tierFromPref('auto'), null); assert.equal(core.tierFromPref('full'), 2); assert.equal(core.tierFromPref('light'), 1); assert.equal(core.tierFromPref('static'), 0);
});

// ---------------------------------------------------------------- capability tiers
const win = (o = {}) => ({ innerWidth: o.width, navigator: { deviceMemory: o.mem, hardwareConcurrency: o.cores, connection: o.conn }, matchMedia: o.mm });
test('capability: no hints, or no APIs at all, means full experience', () => {
  assert.equal(detectCapability(undefined).tier, 2); assert.equal(detectCapability(null).tier, 2); assert.equal(detectCapability({}).tier, 2); assert.equal(detectCapability(win()).tier, 2);
});
test('capability: explicit signals give tier 0', () => {
  assert.equal(detectCapability(win({ conn: { saveData: true } })).tier, 0);
  assert.equal(detectCapability(win({ conn: { effectiveType: '2g' } })).tier, 0);
  assert.equal(detectCapability(win({ conn: { effectiveType: 'slow-2g' } })).tier, 0);
  assert.equal(detectCapability(win({ mm: (q) => ({ matches: q.includes('reduced-data') }) })).tier, 0);
  assert.equal(detectCapability(win({ mem: 1 })).tier, 0);
  assert.equal(detectCapability(win({ mem: 2, cores: 2 })).tier, 0);
});
test('capability: a single soft hint never lowers the tier', () => {
  for (const o of [{ mem: 4 }, { cores: 4 }, { width: 390 }, { conn: { effectiveType: '3g' } }, { mem: 2 }, { cores: 2 }]) assert.equal(detectCapability(win(o)).tier, 2, JSON.stringify(o));
});
test('capability: two agreeing soft hints give tier 1', () => {
  assert.equal(detectCapability(win({ mem: 4, cores: 4 })).tier, 1); assert.equal(detectCapability(win({ width: 390, conn: { effectiveType: '3g' } })).tier, 1);
  assert.equal(detectCapability(win({ mem: 8, cores: 8, width: 1440 })).tier, 2);
});
test('capability: malformed hint values are ignored', () => {
  assert.equal(detectCapability(win({ mem: 'lots', cores: NaN, width: '800', conn: { effectiveType: 5, saveData: 'true' } })).tier, 2);
});

// ---------------------------------------------------------------- boot script (the same string the layout inlines)
function boot({ stored, throwStorage = false, reduced = false, noMatchMedia = false, month = 0, ...cap } = {}) {
  const attrs = {};
  const documentElement = { setAttribute: (k, v) => { attrs[k] = v; } };
  const localStorage = { getItem: (k) => { if (throwStorage) throw new Error('SecurityError'); return k === 'aether:v1:prefs' && stored !== undefined ? stored : null; } };
  const window = { localStorage, innerWidth: cap.width, navigator: { deviceMemory: cap.mem, hardwareConcurrency: cap.cores, connection: cap.conn }, matchMedia: noMatchMedia ? undefined : (q) => ({ matches: q.includes('reduced-motion') ? reduced : false }) };
  vm.runInNewContext(BOOT_SCRIPT, { window, document: { documentElement }, Date: function () { return { getMonth: () => month }; } });
  return attrs;
}
test('boot: defaults (Auto season in January is winter)', () => assert.deepEqual(boot(), { 'data-season': 'winter', 'data-calm': 'false', 'data-tier': '2', 'data-still': 'false' }));
test('boot: saved Calm sets calm and still', () => assert.deepEqual(boot({ stored: '{"motion":"calm"}' }), { 'data-season': 'winter', 'data-calm': 'true', 'data-tier': '2', 'data-still': 'true' }));
test('boot: system reduced motion makes it still without Calm', () => assert.deepEqual(boot({ reduced: true }), { 'data-season': 'winter', 'data-calm': 'false', 'data-tier': '2', 'data-still': 'true' }));
test('boot: performance overrides beat detection', () => {
  assert.equal(boot({ stored: '{"performance":"static"}' })['data-tier'], '0'); assert.equal(boot({ stored: '{"performance":"static"}' })['data-still'], 'true');
  assert.equal(boot({ stored: '{"performance":"full"}', conn: { saveData: true } })['data-tier'], '2');
  assert.equal(boot({ stored: '{"performance":"light"}' })['data-tier'], '1');
});
test('boot: detection used when override is auto or junk', () => {
  assert.equal(boot({ stored: '{"performance":"turbo"}', conn: { saveData: true } })['data-tier'], '0'); assert.equal(boot({ stored: '{"performance":"auto"}', mem: 4, cores: 4 })['data-tier'], '1');
});
test('boot: malformed, wrong-type and blocked storage fall back without throwing', () => {
  for (const stored of ['{not json', 'null', '"calm"', '123', '[]', '{"motion":1}', '']) assert.equal(boot({ stored })['data-calm'], 'false', stored);
  assert.equal(boot({ throwStorage: true })['data-calm'], 'false'); assert.equal(boot({ noMatchMedia: true })['data-still'], 'false');
});
test('boot: agrees with normalizePrefs on every motion/performance combination', () => {
  for (const motion of ['system', 'calm', 'x', 3, null]) for (const performance of ['auto', 'full', 'light', 'static', 'x', null]) {
    const stored = JSON.stringify({ motion, performance }); const n = core.normalizePrefs({ motion, performance }); const a = boot({ stored });
    assert.equal(a['data-calm'], String(n.motion === 'calm'), stored);
    assert.equal(a['data-tier'], String(core.tierFromPref(n.performance) ?? 2), stored);
  }
});
const built = join(root, 'out', 'index.html');
test('boot: the script inlined in the production build behaves like the source', { skip: !existsSync(built) && 'run `npm run build` first' }, () => {
  const html = readFileSync(built, 'utf8'); const head = html.slice(0, html.indexOf('</head>'));
  const m = head.match(/<script>(\(function\(\)\{[\s\S]*?\}\)\(\);)<\/script>/); assert.ok(m, 'boot script present in <head>');
  const attrs = {}; const w = { localStorage: { getItem: () => '{"motion":"calm","season":"autumn"}' }, navigator: { connection: { saveData: true } }, matchMedia: () => ({ matches: false }) };
  vm.runInNewContext(m[1], { window: w, document: { documentElement: { setAttribute: (k, v) => { attrs[k] = v; } } } });
  assert.deepEqual(attrs, { 'data-season': 'autumn', 'data-calm': 'true', 'data-tier': '0', 'data-still': 'true' });
});

// ---------------------------------------------------------------- preference store (persistence, recovery, cross-tab)
function fakeWindow({ data = {}, blocked = false, raf = false } = {}) {
  const listeners = {}; const store = { ...data };
  const localStorage = {
    getItem: (k) => { if (blocked) throw new Error('blocked'); return k in store ? store[k] : null; },
    setItem: (k, v) => { if (blocked) throw new Error('blocked'); store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
  };
  const w = { localStorage, store, listeners, innerWidth: 1280, setTimeout: (f, ms) => setTimeout(f, ms), clearTimeout: (id) => clearTimeout(id),
    ...(raf ? { requestAnimationFrame: (f) => setTimeout(f, 16), cancelAnimationFrame: (id) => clearTimeout(id) } : {}),
    addEventListener: (t, f) => { (listeners[t] ||= new Set()).add(f); }, removeEventListener: (t, f) => { listeners[t]?.delete(f); },
    count: (t) => listeners[t]?.size ?? 0 };
  return w;
}
function freshStore(w) { delete require.cache[require.resolve('./preferences-store.js')]; delete require.cache[require.resolve('./storage.js')]; globalThis.window = w; return require('./preferences-store.js').preferencesStore; }
test('store: server snapshot is defaults; empty storage gives defaults', () => {
  const s = freshStore(fakeWindow()); assert.deepEqual(s.getServerSnapshot(), core.DEFAULT_PREFS); assert.deepEqual(s.getSnapshot(), core.DEFAULT_PREFS);
});
test('store: saved preferences load; snapshot identity is stable until a change', () => {
  const w = fakeWindow({ data: { 'aether:v1:prefs': JSON.stringify({ mode: 'story', motion: 'calm' }) } }); const s = freshStore(w);
  assert.equal(s.getSnapshot().mode, 'story'); assert.equal(s.getSnapshot().motion, 'calm'); assert.equal(s.getSnapshot(), s.getSnapshot());
});
test('store: malformed JSON recovers to defaults and keeps a backup copy', () => {
  const w = fakeWindow({ data: { 'aether:v1:prefs': '{oops' } }); const s = freshStore(w);
  assert.deepEqual(s.getSnapshot(), core.DEFAULT_PREFS); assert.equal(w.store['aether:v1:prefs:corrupt'], '{oops');
});
test('store: wrong-shaped JSON recovers field by field', () => {
  const s = freshStore(fakeWindow({ data: { 'aether:v1:prefs': '[1,2,3]' } })); assert.deepEqual(s.getSnapshot(), core.DEFAULT_PREFS);
  const s2 = freshStore(fakeWindow({ data: { 'aether:v1:prefs': '{"mode":"story","audio":"loud"}' } })); assert.equal(s2.getSnapshot().mode, 'story'); assert.equal(s2.getSnapshot().audio.master, 0.6);
});
test('store: update persists, notifies and merges nested audio', () => {
  const w = fakeWindow(); const s = freshStore(w); let n = 0; const off = s.subscribe(() => { n++; });
  s.update({ audio: { enabled: true, ambient: { rain: 0.2 } } }); s.update({ audio: { master: 0.3 } });
  assert.equal(n, 2); const saved = JSON.parse(w.store['aether:v1:prefs']);
  assert.equal(saved.audio.enabled, true); assert.equal(saved.audio.master, 0.3); assert.equal(saved.audio.ambient.rain, 0.2); assert.equal(saved.audio.ambient.wind, 0.5); off();
});
test('store: reset returns to defaults and persists them', () => {
  const w = fakeWindow(); const s = freshStore(w); s.update({ motion: 'calm' }); s.reset();
  assert.deepEqual(s.getSnapshot(), core.DEFAULT_PREFS); assert.equal(JSON.parse(w.store['aether:v1:prefs']).motion, 'system');
});
test('store: blocked storage still works in memory and never throws', () => {
  const s = freshStore(fakeWindow({ blocked: true })); assert.deepEqual(s.getSnapshot(), core.DEFAULT_PREFS);
  s.update({ mode: 'story' }); assert.equal(s.getSnapshot().mode, 'story');
});
test('store: cross-tab storage events reload; unrelated keys are ignored; listener is removed with the last subscriber', () => {
  const w = fakeWindow(); const s = freshStore(w); let n = 0; const a = s.subscribe(() => { n++; }); const b = s.subscribe(() => { n++; });
  assert.equal(w.count('storage'), 1, 'one shared storage listener');
  w.store['aether:v1:prefs'] = '{"motion":"calm"}'; for (const f of w.listeners.storage) f({ key: 'aether:v1:prefs' });
  assert.equal(s.getSnapshot().motion, 'calm'); assert.equal(n, 2);
  for (const f of w.listeners.storage) f({ key: 'aether:v1:trips' }); assert.equal(n, 2);
  w.store['aether:v1:prefs'] = '{"motion":"system"}'; for (const f of w.listeners.storage) f({ key: null }); assert.equal(s.getSnapshot().motion, 'system');
  a(); assert.equal(w.count('storage'), 1); b(); assert.equal(w.count('storage'), 0);
});

// ---------------------------------------------------------------- scroll hub + director (shared ticker, coalesced hubs)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
test('pages that never load GSAP do not import it (scrollHub, environment, preferences, Header, ScrollProgress, SettingsMenu)', () => {
  for (const f of ['lib/scrollHub.ts', 'lib/environment.ts', 'lib/preferences.tsx', 'lib/preferences-store.ts', 'components/Header.tsx', 'components/SettingsMenu.tsx', 'components/samurai/ScrollProgress.tsx'])
    assert.ok(!/from ['"](gsap|@\/lib\/director|\.\/director)/.test(readFileSync(join(root, 'src', f), 'utf8')), f);
});
for (const raf of [false, true]) {
  const how = raf ? 'requestAnimationFrame' : 'timeout fallback';
  test(`scrollHub alone (no GSAP, ${how}): one listener, coalesced, duplicate-safe, torn down with the last subscriber`, async () => {
    const w = fakeWindow({ raf }); globalThis.window = w; delete require.cache[require.resolve('./scrollHub.js')];
    const hub = require('./scrollHub.js');
    let a = 0; const fa = () => { a++; }; const off1 = hub.onScroll(fa); const off2 = hub.onScroll(fa);
    assert.equal(w.count('scroll'), 1);
    for (let i = 0; i < 40; i++) for (const f of w.listeners.scroll) f();
    await sleep(80); assert.equal(a, 1); off1(); assert.equal(w.count('scroll'), 0);
    off2(); // already removed: must not throw or re-detach
    assert.equal(w.count('scroll'), 0);
  });
  test(`scrollHub (${how}): unsubscribing while a flush is pending cancels it`, async () => {
    const w = fakeWindow({ raf }); globalThis.window = w; delete require.cache[require.resolve('./scrollHub.js')];
    const hub = require('./scrollHub.js'); let a = 0; const off = hub.onScroll(() => { a++; });
    for (const f of w.listeners.scroll) f(); off(); await sleep(80); assert.equal(a, 0);
  });
}
test('director: hubs ride the GSAP ticker: one shared listener, coalesced flush, clean teardown, no duplicate subscriptions', async () => {
  const w = fakeWindow(); globalThis.window = w; delete require.cache[require.resolve('./director.js')]; delete require.cache[require.resolve('./scrollHub.js')];
  const { director } = require('./director.js');
  let a = 0, b = 0; const fa = () => { a++; }; const fb = () => { b++; };
  const offA = director.onScroll(fa); const offB = director.onScroll(fb); const offDup = director.onScroll(fa);
  assert.equal(w.count('scroll'), 1, 'single window scroll listener');
  for (let i = 0; i < 25; i++) for (const f of w.listeners.scroll) f();
  await sleep(120);
  assert.equal(a, 1, 'coalesced to one call per frame, duplicate subscribe is a no-op'); assert.equal(b, 1);
  offA(); offDup(); for (const f of w.listeners.scroll) f(); await sleep(120); assert.equal(a, 1); assert.equal(b, 2);
  offB(); assert.equal(w.count('scroll'), 0, 'listener removed with last subscriber');
  const offR = director.onResize(() => {}); assert.equal(w.count('resize'), 1); offR(); assert.equal(w.count('resize'), 0);
});
test('director: frame callbacks run on the shared ticker, de-duplicate, and stop on unsubscribe', async () => {
  globalThis.window = fakeWindow(); const { director } = require('./director.js');
  let n = 0; const f = (dt) => { n++; assert.ok(Number.isFinite(dt)); };
  const off1 = director.frame(f); const off2 = director.frame(f);
  await sleep(150); assert.ok(n > 0, 'callback ran'); off1(); const at = n; await sleep(100); assert.equal(n, at, 'stopped after unsubscribe'); off2();
});

// ---------------------------------------------------------------- hero video is untouched
test('hero video hash is unchanged', () => {
  const h = createRequire(import.meta.url)('node:crypto').createHash('sha256').update(readFileSync(join(root, 'public', 'media', 'aether-hero.mp4'))).digest('hex');
  assert.equal(h, 'd9cf2a8a7a4bc12563d99176d769e9a1d796b4c7f8aac72798870d7ae430c4d8');
});

// ================================================================ Phase 2: seasons
const { pickSeason } = require('./season-pick.js');
test('pickSeason: explicit seasons win in any month and hemisphere', () => {
  for (const s of ['spring', 'summer', 'autumn', 'winter']) for (let m = 0; m < 12; m++) for (const h of ['north', 'south']) assert.equal(pickSeason(s, h, m), s);
});
test('pickSeason: Auto follows the month (north)', () => {
  const want = ['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter'];
  want.forEach((s, m) => assert.equal(pickSeason('auto', 'north', m), s, 'month ' + m));
});
test('pickSeason: Auto in the south is shifted six months', () => {
  const want = ['summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter', 'winter', 'winter', 'spring', 'spring', 'spring', 'summer'];
  want.forEach((s, m) => assert.equal(pickSeason('auto', 'south', m), s, 'month ' + m));
});
test('pickSeason: junk preference means Auto; junk hemisphere means north', () => {
  for (const bad of [undefined, null, '', 'monsoon', 5, {}, 'AUTO', 'Winter']) assert.equal(pickSeason(bad, 'north', 8), 'autumn', String(bad));
  for (const bad of [undefined, 'east', 1, null]) assert.equal(pickSeason('auto', bad, 8), 'autumn', String(bad));
});
test('pickSeason: invalid months fall back to spring (the established look), never throw', () => {
  for (const bad of [NaN, -1, 12, 99, Infinity, undefined, null, '3', {}]) assert.equal(pickSeason('auto', 'north', bad), 'spring', String(bad));
  assert.equal(pickSeason('auto', 'north', 2.9), 'spring'); assert.equal(pickSeason('auto', 'north', 11.9), 'winter');
});
test('resolveSeason: uses the date, the hemisphere, and survives an invalid Date', () => {
  assert.equal(core.resolveSeason('auto', new Date(2026, 9, 12)), 'autumn'); assert.equal(core.resolveSeason('auto', new Date(2026, 9, 12), 'south'), 'spring');
  assert.equal(core.resolveSeason('auto', new Date('nope')), 'spring'); assert.equal(core.resolveSeason('summer', new Date('nope')), 'summer');
});
test('hemisphere: default, validation, persistence round trip, partial update', () => {
  assert.equal(core.DEFAULT_PREFS.hemisphere, 'north');
  for (const bad of ['east', 3, null, undefined, {}]) assert.equal(core.normalizePrefs({ hemisphere: bad }).hemisphere, 'north');
  assert.equal(core.normalizePrefs({ hemisphere: 'south' }).hemisphere, 'south');
  const p = core.mergePrefs(core.cloneDefaults(), { hemisphere: 'south', season: 'winter' }); assert.deepEqual(core.normalizePrefs(JSON.parse(JSON.stringify(p))), p);
  assert.equal(core.normalizePrefs({ mode: 'story', season: 'autumn' }).hemisphere, 'north', 'Phase 1 saved prefs (no hemisphere) still load');
});
test('boot: data-season from saved choice, Auto month and hemisphere', () => {
  assert.equal(boot({ stored: '{"season":"summer"}', month: 0 })['data-season'], 'summer');
  assert.equal(boot({ stored: '{"season":"auto"}', month: 9 })['data-season'], 'autumn');
  assert.equal(boot({ stored: '{"season":"auto","hemisphere":"south"}', month: 9 })['data-season'], 'spring');
  assert.equal(boot({ stored: '{"season":"nonsense"}', month: 6 })['data-season'], 'summer', 'junk season means Auto');
  for (const stored of ['{oops', 'null', '[]']) assert.equal(boot({ stored, month: 4 })['data-season'], 'spring', stored);
  assert.equal(boot({ throwStorage: true, month: 11 })['data-season'], 'winter');
});
test('boot: season agrees with resolveSeason for every saved season, hemisphere and month', () => {
  for (const season of ['auto', 'spring', 'summer', 'autumn', 'winter', 'x', null]) for (const hemisphere of ['north', 'south', 'x', null]) for (let month = 0; month < 12; month++) {
    const n = core.normalizePrefs({ season, hemisphere });
    assert.equal(boot({ stored: JSON.stringify({ season, hemisphere }), month })['data-season'], core.resolveSeason(n.season, new Date(2026, month, 15), n.hemisphere), JSON.stringify({ season, hemisphere, month }));
  }
});
test('every season has a complete palette in globals.css and a branch asset on disk', () => {
  const css = readFileSync(join(root, 'src/app/globals.css'), 'utf8');
  for (const season of ['spring', 'summer', 'autumn', 'winter']) {
    const block = css.match(new RegExp(`html\\[data-season='${season}'\\][^{]*\\{([^}]*)\\}`))?.[1] ?? '';
    for (const v of ['--s-sky-1', '--s-sky-2', '--s-sky-3', '--s-sky-4', '--s-glow-a', '--s-glow-b', '--s-veil-a', '--s-veil-b', '--s-prog-a', '--s-prog-b']) assert.ok(block.includes(v + ':'), `${season} missing ${v}`);
    assert.match(css, new RegExp(`\\.sb\\[data-s='${season}'\\]`), `${season} layer rule`);
  }
  const src = readFileSync(join(root, 'src/components/samurai/SeasonBranch.tsx'), 'utf8');
  const paths = [...src.matchAll(/'(\/img\/samurai\/[^']+\.svg)'/g)].map((m) => m[1]); assert.equal(paths.length, 8);
  for (const p of paths) assert.ok(existsSync(join(root, 'public', p)), p);
  // no purple in the new palettes (hue between roughly 255 and 320 degrees)
  for (const season of ['summer', 'autumn', 'winter']) {
    const block = css.match(new RegExp(`html\\[data-season='${season}'\\][^{]*\\{([^}]*)\\}`))[1];
    for (const hex of block.match(/#[0-9a-f]{6}/gi) ?? []) { const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)); const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      if (mx - mn < 24) continue; const hue = mx === r ? ((g - b) / (mx - mn) + 6) % 6 * 60 : mx === g ? ((b - r) / (mx - mn) + 2) * 60 : ((r - g) / (mx - mn) + 4) * 60; assert.ok(!(hue > 255 && hue < 320), `${season} ${hex} is purple (hue ${Math.round(hue)})`); }
  }
});

// ================================================================ Phase 2: particles
const P = require('./particles.js');
test('particles: season to kind mapping, spring stays petals', () => {
  assert.deepEqual(['spring', 'summer', 'autumn', 'winter'].map(P.kindForSeason), ['petal', 'firefly', 'leaf', 'snow']); assert.equal(P.kindForSeason('bogus'), 'petal');
});
test('particles: budgets keep Phase 1 petal numbers, tier 1 halves, tier 0 is zero, nothing exceeds 24', () => {
  assert.equal(P.particleCount('petal', 1280, 2), 18); assert.equal(P.particleCount('petal', 390, 2), 9);
  assert.equal(P.particleCount('petal', 1280, 1), 9); assert.equal(P.particleCount('petal', 390, 1), 5);
  for (const k of ['petal', 'leaf', 'snow', 'firefly']) { assert.equal(P.particleCount(k, 1280, 0), 0, k); assert.ok(P.particleCount(k, 1280, 2) <= 24 && P.particleCount(k, 390, 2) <= 12, k); assert.ok(P.particleCount(k, 1280, 1) < P.particleCount(k, 1280, 2), k); }
});
test('particles: pointer push is zero outside 120px, outward, smooth and fading with distance', () => {
  assert.deepEqual(P.pointerPush(120, 0, 0), { ax: 0, ay: 0 }); assert.deepEqual(P.pointerPush(200, 90, 500), { ax: 0, ay: 0 }); assert.deepEqual(P.pointerPush(NaN, 0, 0), { ax: 0, ay: 0 });
  const right = P.pointerPush(40, 0, 0); assert.ok(right.ax > 0 && Math.abs(right.ay) < 1e-9); const left = P.pointerPush(-40, 0, 0); assert.ok(left.ax < 0);
  const down = P.pointerPush(0, 40, 0); assert.ok(down.ay > 0);
  let prev = Infinity; for (let d = 1; d < 120; d += 7) { const m = Math.hypot(...Object.values(P.pointerPush(d, 0, 300))); assert.ok(m <= prev + 1e-9, 'monotonic at ' + d); prev = m; }
  assert.ok(Math.hypot(...Object.values(P.pointerPush(119.9, 0, 300))) < 0.5, 'tapers to ~0 at the edge (no hard step)');
  assert.ok(P.pointerPush(30, 0, 1400).ax > P.pointerPush(30, 0, 0).ax, 'a moving pointer stirs more'); assert.equal(P.pointerPush(30, 0, 99999).ax, P.pointerPush(30, 0, 1400).ax, 'stir is capped');
  const under = P.pointerPush(0, 0, 0); assert.ok(Number.isFinite(under.ax) && Number.isFinite(under.ay));
});
test('particles: damping relaxes to zero and clamp limits magnitude', () => {
  let v = 150; for (let i = 0; i < 300; i++) v = P.damp(v, 1 / 60); assert.ok(Math.abs(v) < 0.5, 'returns to its own drift within ~5s'); assert.ok(P.damp(100, 0.016) < 100 && P.damp(100, 0.016) > 95);
  const c = P.clampMag(300, 400, 170); assert.ok(Math.abs(Math.hypot(c.x, c.y) - 170) < 1e-9); assert.deepEqual(P.clampMag(3, 4, 170), { x: 3, y: 4 });
  // sustained push cannot exceed the cap
  let ex = 0; for (let i = 0; i < 600; i++) { ex += P.pointerPush(10, 0, 1400).ax / 60; ex = P.damp(ex, 1 / 60); ex = P.clampMag(ex, 0, P.POINTER_MAX_PUSH_SPEED).x; } assert.ok(ex <= P.POINTER_MAX_PUSH_SPEED + 1e-9);
});
test('particles: scroll wind is clamped, signed (down +, up -), and never NaN', () => {
  assert.equal(P.scrollWind(0), 0); assert.equal(P.scrollWind(99999), 1); assert.equal(P.scrollWind(-99999), -1); assert.equal(P.scrollWind(NaN), 0); assert.equal(P.scrollWind(Infinity), 0);
  assert.ok(P.scrollWind(1100) > 0 && P.scrollWind(-1100) < 0);
  for (const depth of [0, 0.5, 1, 7, -3]) for (const w of [-9, -1, 0, 0.4, 1, 9]) assert.ok(Math.abs(P.windY(w, depth)) <= 55 + 1e-9, `${w},${depth}`);
  assert.ok(P.windY(1, 1) > P.windY(1, 0), 'nearer particles feel more wind'); assert.ok(P.windY(-1, 0.5) < 0, 'scrolling up gives an upward wake');
  assert.equal(P.smoothVelocity(0, 1000, 0.35), 350);
});
test('particles: season crossfade fades stay within 0..1 and take about FADE_SECONDS', () => {
  let f = 0; let t = 0; while (f < 1 && t < 10) { f = P.stepFade(f, 1 / 60, 1); t += 1 / 60; } assert.ok(Math.abs(t - P.FADE_SECONDS) < 0.05, 'in: ' + t);
  f = 1; t = 0; while (f > 0 && t < 10) { f = P.stepFade(f, 1 / 60, -1); t += 1 / 60; } assert.ok(Math.abs(t - P.FADE_SECONDS) < 0.05); assert.equal(P.stepFade(0, 5, -1), 0); assert.equal(P.stepFade(1, 5, 1), 1);
});

// ================================================================ Phase 2: shared visibility observer
test('visibility: one shared observer, per-subscriber thresholds, clean disconnect, fallback without IntersectionObserver', () => {
  const made = []; let disconnected = 0;
  globalThis.IntersectionObserver = class { constructor(cb, o) { this.cb = cb; this.o = o; this.els = new Set(); made.push(this); } observe(e) { this.els.add(e); } unobserve(e) { this.els.delete(e); } disconnect() { disconnected++; this.els.clear(); } };
  delete require.cache[require.resolve('./visibility.js')]; const { observeVisibility } = require('./visibility.js');
  const a = {}, b = {}; const log = [];
  const offA = observeVisibility(a, (v) => log.push(['a', v]), { min: 0.55 }); const offA2 = observeVisibility(a, (v) => log.push(['a2', v])); const offB = observeVisibility(b, (v) => log.push(['b', v]));
  assert.equal(made.length, 1, 'exactly one IntersectionObserver'); assert.equal(made[0].els.size, 2);
  const io = made[0]; io.cb([{ target: a, isIntersecting: true, intersectionRatio: 0.3 }]); assert.deepEqual(log, [['a2', true]], 'min 0.55 not reached yet; min 0 is');
  io.cb([{ target: a, isIntersecting: true, intersectionRatio: 0.6 }]); assert.deepEqual(log.slice(1), [['a', true]], 'fires once when the threshold is crossed');
  io.cb([{ target: a, isIntersecting: true, intersectionRatio: 0.9 }]); assert.equal(log.length, 2, 'no duplicate callbacks');
  io.cb([{ target: a, isIntersecting: false, intersectionRatio: 0 }]); assert.deepEqual(log.slice(2).sort(), [['a', false], ['a2', false]].sort());
  offA(); assert.equal(io.els.has(a), true, 'still observed for the other subscriber'); offA2(); assert.equal(io.els.has(a), false); assert.equal(disconnected, 0); offB(); assert.equal(disconnected, 1, 'disconnects with the last subscriber');
  offB(); offA(); // double unsubscribe is harmless
  const again = observeVisibility(a, () => {}); assert.equal(made.length, 2, 'a new observer is created after a full teardown'); again();
  delete globalThis.IntersectionObserver; delete require.cache[require.resolve('./visibility.js')]; const v2 = require('./visibility.js'); const seen = [];
  v2.observeVisibility(a, (v) => seen.push(v), { fallback: true }); v2.observeVisibility(a, (v) => seen.push(v)); assert.deepEqual(seen, [true, false], 'fallback value is honoured');
});

// ================================================================ Phase 2: no new loops or listeners outside the shared infrastructure
test('no component adds its own rAF loop or scroll/resize listener', () => {
  const files = ['components/samurai/Petals.tsx', 'components/samurai/SeasonAtmosphere.tsx', 'components/samurai/SeasonBranch.tsx', 'components/samurai/FooterCrest.tsx', 'components/samurai/Crest.tsx', 'components/samurai/CrestBloom.tsx', 'components/samurai/Bushido.tsx', 'components/Header.tsx'];
  for (const f of files) { const t = readFileSync(join(root, 'src', f), 'utf8'); assert.ok(!/requestAnimationFrame\(/.test(t.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')), f + ' uses rAF'); assert.ok(!/addEventListener\(\s*['"](scroll|resize)['"]/.test(t), f + ' adds scroll/resize listener'); }
});

// ================================================================ Phase 3: katana reveal
const { VIRTUES } = require('./virtues.js'); const { VIRTUE_GLYPHS } = require('./virtue-glyphs.js');
const K = require('./katana-state.js'); const G = require('./katana-geometry.js'); const { createSfx, COOLDOWN_MS } = require('./sfx.js');

test('virtues: exactly the seven, with kanji, romanisation, meaning and text for each', () => {
  assert.deepEqual(VIRTUES.map((v) => [v.kanji, v.jp, v.name]), [['義', 'Gi', 'Righteousness'], ['勇', 'Yū', 'Courage'], ['仁', 'Jin', 'Benevolence'], ['礼', 'Rei', 'Respect'], ['誠', 'Makoto', 'Honesty'], ['名誉', 'Meiyo', 'Honour'], ['忠義', 'Chūgi', 'Loyalty']]);
  for (const v of VIRTUES) { assert.ok(v.text.length > 20 && v.seal, v.jp); }
});
test('virtues: every character has an outlined glyph path, so no font is needed', () => {
  for (const ch of new Set(VIRTUES.flatMap((v) => Array.from(v.kanji)))) { const d = VIRTUE_GLYPHS[ch]; assert.ok(d && d.startsWith('M') && d.endsWith('Z') && d.length > 150, ch); assert.ok(!/NaN|undefined/.test(d), ch); }
  assert.equal(Object.keys(VIRTUE_GLYPHS).length, 8, 'only the glyphs that are used');
});
test('virtues: Bushido scrolls and the katana share one data source', () => {
  const b = readFileSync(join(root, 'src/components/samurai/Bushido.tsx'), 'utf8'); assert.match(b, /from '@\/data\/virtues'/); assert.doesNotMatch(b, /Righteousness/, 'no second copy of the list');
  assert.match(readFileSync(join(root, 'src/components/samurai/KatanaReveal.tsx'), 'utf8'), /from '@\/data\/virtues'/);
});

const ev = (type, x = {}) => ({ type, ...x });
const run = (s, ...es) => es.reduce((a, e) => K.katanaReduce(a, e), s);
test('katana state: mouse and pen hover draw and release; touch never hovers', () => {
  for (const pointerType of ['mouse', 'pen']) { const s = run(K.INITIAL_KATANA, ev('pointer-enter', { pointerType })); assert.equal(K.isOpen(s, false), true); assert.equal(K.isOpen(run(s, ev('pointer-leave')), false), false); }
  assert.deepEqual(run(K.INITIAL_KATANA, ev('pointer-enter', { pointerType: 'touch' })), K.INITIAL_KATANA);
  assert.deepEqual(run(K.INITIAL_KATANA, ev('pointer-enter', { pointerType: '' })), K.INITIAL_KATANA);
});
test('katana state: touch tap draws, second tap sheathes (and hover cannot interfere)', () => {
  let s = run(K.INITIAL_KATANA, ev('pointer-enter', { pointerType: 'touch' }), ev('toggle')); assert.equal(K.isOpen(s, false), true); assert.equal(K.isDrawn(s, false), true);
  s = run(s, ev('pointer-leave'), ev('toggle')); assert.equal(K.isOpen(s, false), false); assert.equal(K.isDrawn(s, false), false);
});
test('katana state: a toggled sword stays drawn after the pointer leaves; hover alone is not "pressed"', () => {
  let s = run(K.INITIAL_KATANA, ev('pointer-enter', { pointerType: 'mouse' })); assert.equal(K.isDrawn(s, false), false, 'peeking is not pressed');
  s = run(s, ev('toggle'), ev('pointer-leave')); assert.equal(K.isOpen(s, false), true); assert.equal(K.isDrawn(s, false), true);
  s = run(s, ev('toggle')); assert.equal(K.isOpen(s, false), false, 'sheathed with the pointer already gone');
});
test('katana state: keyboard focus draws; focus that came from a click does not hold the blade out', () => {
  let s = run(K.INITIAL_KATANA, ev('focus', { viaPointer: false })); assert.equal(K.isOpen(s, false), true); assert.equal(K.isOpen(run(s, ev('blur')), false), false);
  s = run(K.INITIAL_KATANA, ev('focus', { viaPointer: true }), ev('toggle'), ev('toggle')); assert.equal(K.isOpen(s, false), false, 'click, draw, click again: sheathed');
});
test('katana state: static mode shows the sword drawn, ignores hover and focus, and toggles instantly', () => {
  const s0 = K.INITIAL_KATANA; assert.equal(K.isOpen(s0, true), true); assert.equal(K.isDrawn(s0, true), true);
  assert.equal(K.isOpen(run(s0, ev('pointer-leave')), true), true); const t = run(s0, ev('toggle')); assert.equal(K.isOpen(t, true), false); assert.equal(K.isDrawn(t, true), false);
  assert.equal(K.isOpen(run(t, ev('pointer-enter', { pointerType: 'mouse' }), ev('focus', { viaPointer: false })), true), false, 'hover and focus do nothing in static mode');
});
test('katana state: only a deliberate toggle that leaves the sword drawn earns a sound', () => {
  for (const staticMode of [false, true]) { const drawn = run(K.INITIAL_KATANA, ev('toggle')); const sheathed = run(drawn, ev('toggle'));
    assert.equal(K.drawsOnToggle(staticMode ? sheathed : drawn, staticMode), true, 'draw, static=' + staticMode); assert.equal(K.drawsOnToggle(staticMode ? drawn : sheathed, staticMode), false, 'sheathe, static=' + staticMode); }
  assert.equal(K.drawsOnToggle(run(K.INITIAL_KATANA, ev('pointer-enter', { pointerType: 'mouse' }), ev('focus', { viaPointer: false })), false), false, 'hover and focus are silent');
});
test('katana state: redundant events return the same object (no needless re-renders); reset clears', () => {
  const h = run(K.INITIAL_KATANA, ev('pointer-enter', { pointerType: 'mouse' })); assert.equal(run(h, ev('pointer-enter', { pointerType: 'mouse' })), h); assert.equal(run(K.INITIAL_KATANA, ev('pointer-leave')), K.INITIAL_KATANA); assert.equal(run(K.INITIAL_KATANA, ev('blur')), K.INITIAL_KATANA);
  assert.deepEqual(run(run(h, ev('toggle')), ev('reset')), K.INITIAL_KATANA);
});

test('geometry: the blade curves like a katana (edge-up bowl, about 2% sori) on a true circular arc', () => {
  assert.equal(Math.round(G.cy(G.XM) * 1000) / 1000, G.CY); assert.ok(G.cy(G.BLADE[0]) < G.CY && G.cy(G.BLADE[1]) < G.CY, 'ends higher than the middle');
  const sag = Math.max(G.cy(G.BLADE[0]), G.cy(G.BLADE[1])) - Math.min(G.cy(G.BLADE[0]), G.cy(G.BLADE[1])); const chord = G.BLADE[1] - G.BLADE[0];
  const mid = (G.cy(G.BLADE[0]) + G.cy(G.BLADE[1])) / 2; const depth = Math.abs(mid - G.cy((G.BLADE[0] + G.BLADE[1]) / 2)); assert.ok(depth / chord > 0.01 && depth / chord < 0.035, 'sori ' + (depth / chord));
  for (const x of [100, 330, 540, 800, 960]) assert.ok(Math.abs(Math.hypot(x - G.CENTER.x, G.cy(x) - G.CENTER.y) - G.R) < 1e-6, 'on the circle at ' + x);
});
test('geometry: the draw is 15% of the blade, a rotation about the arc centre that moves points along their own curve', () => {
  assert.ok(Math.abs(G.TRAVEL / G.BLADE_LEN - 0.15) < 1e-9); assert.ok(Math.abs(G.DRAW_DEG * Math.PI / 180 * G.R - G.TRAVEL) < 1e-9);
  assert.ok(G.DRAW_DEG > 0.5 && G.DRAW_DEG < 3, 'a small, restrained rotation: ' + G.DRAW_DEG);
  for (const x of [G.TSUBA_X, G.HABAKI[0], G.BLADE[1]]) { const moved = x - G.rotatedX(x, G.DRAW_DEG); assert.ok(Math.abs(moved - G.TRAVEL) < 1.2, `x=${x} moves ${moved.toFixed(2)} (travel ${G.TRAVEL.toFixed(2)})`); }
});
test('geometry: physically plausible: tip stays inside the saya, tsuba meets the mouth at rest and clears it drawn, pommel stays in the box', () => {
  const tipDrawn = G.rotatedX(G.BLADE[1], G.DRAW_DEG); assert.ok(tipDrawn > G.SAYA[0] + 300 && tipDrawn < G.SAYA[1] - 24, 'tip inside saya when drawn: ' + tipDrawn); assert.ok(G.BLADE[1] < G.SAYA[1] - 24, 'and at rest');
  const gapRest = G.SAYA[0] - (G.TSUBA_X + 7); assert.ok(gapRest >= 0 && gapRest <= 6, 'tsuba touches the koiguchi at rest: gap ' + gapRest);
  assert.ok(G.rotatedX(G.TSUBA_X, G.DRAW_DEG) + 7 < G.SAYA[0] - 60, 'tsuba well clear of the saya when drawn');
  const habakiEnd = G.rotatedX(G.HABAKI[1], G.DRAW_DEG); assert.ok(G.SAYA[0] - habakiEnd > 40, 'bare blade shows between habaki and saya: ' + (G.SAYA[0] - habakiEnd));
  assert.ok(G.rotatedX(G.KASHIRA[0], G.DRAW_DEG) >= 0, 'pommel still inside the viewBox when drawn: ' + G.rotatedX(G.KASHIRA[0], G.DRAW_DEG)); assert.ok(G.SAYA[1] + 4 <= G.VB_W);
  assert.ok(G.HABAKI[0] > G.SAYA[0] && G.HABAKI[1] < G.BLADE[0] + 1, 'habaki is hidden inside the saya at rest');
});
test('geometry: every path is finite and inside the viewBox; the kurikara fits on the exposed blade', () => {
  const all = [G.bladeSilhouette(), ...Object.values(G.bladeFacets), G.hamonLine, G.edgeLine, G.glintPath, G.shinogiLine, G.kurikara().ken, G.kurikara().body, G.kurikara().glow, G.strip(70, 300, -12, 12)];
  const head = G.kurikara().head; assert.ok(!/NaN|Infinity/.test(head)); const [hx, hy] = head.match(/^M(-?[\d.]+) (-?[\d.]+)/).slice(1).map(Number); assert.ok(hx > 0 && hx < G.VB_W && hy > 0 && hy < G.VB_H, 'head starts inside the box (its other segments are relative)');
  for (const d of all) { assert.ok(!/NaN|Infinity|undefined/.test(d)); const nums = d.match(/-?\d+(\.\d+)?/g).map(Number); for (let i = 0; i < nums.length; i += 2) { assert.ok(nums[i] >= 0 && nums[i] <= G.VB_W, 'x ' + nums[i]); assert.ok(nums[i + 1] >= 0 && nums[i + 1] <= G.VB_H, 'y ' + nums[i + 1]); } }
  const dragonEnd = G.BLADE[0] + 8 + 46 + 8; assert.ok(G.rotatedX(dragonEnd, G.DRAW_DEG) < G.SAYA[0], 'dragon is wholly outside the saya when drawn');
  assert.ok(G.BLADE[0] + 5 > G.HABAKI[1], 'and starts past the habaki');
});
test('geometry: the seven markings are evenly spaced, in order, inside the saya and no taller than it', () => {
  const slots = G.layoutMarks(VIRTUES.map((v) => v.kanji)); assert.equal(slots.length, 7);
  let prevEnd = -Infinity; const gaps = []; for (const s of slots) { const w = s.size * s.chars.length; assert.ok(s.x >= 392 - 1e-9 && s.x + w <= 928 + 1e-6); assert.ok(s.x > prevEnd, 'no overlap'); if (prevEnd > -Infinity) gaps.push(s.x - prevEnd); prevEnd = s.x + w; assert.ok(s.size <= 30 && s.size < 2 * 18, 'fits the saya height'); }
  assert.ok(Math.max(...gaps) - Math.min(...gaps) < 1e-6, 'equal gaps'); assert.deepEqual(slots.map((s) => s.chars.join('')), VIRTUES.map((v) => v.kanji));
});

// ---- sound: a fake AudioContext records every node
function fakeAudio({ state = 'running', resumeRejects = false } = {}) {
  const made = { ctx: 0, nodes: [], resume: 0 }; let t = 0;
  const param = () => ({ value: 0, calls: [], setValueAtTime(v, at) { this.calls.push(['set', v, at]); }, linearRampToValueAtTime(v, at) { this.calls.push(['lin', v, at]); }, exponentialRampToValueAtTime(v, at) { this.calls.push(['exp', v, at]); } });
  const node = (kind, extra = {}) => { const n = { kind, connected: [], disconnected: false, connect(o) { this.connected.push(o); return o; }, disconnect() { this.disconnected = true; }, start() { this.started = true; }, stop() { this.stopped = true; }, onended: null, ...extra }; made.nodes.push(n); return n; };
  class Ctx { constructor() { made.ctx++; this.state = state; this.sampleRate = 8000; this.destination = { kind: 'dest' }; } get currentTime() { return t; }
    resume() { made.resume++; return resumeRejects ? Promise.reject(new Error('NotAllowedError')) : Promise.resolve(); }
    createBuffer(c, n) { return { getChannelData: () => new Float32Array(n), length: n }; }
    createBufferSource() { return node('source'); } createBiquadFilter() { return node('filter', { frequency: param(), Q: { value: 0 } }); }
    createGain() { return node('gain', { gain: param() }); } createOscillator() { return node('osc', { frequency: { value: 0 } }); } }
  return { made, Ctx, endAll: () => made.nodes.filter((n) => n.onended).forEach((n) => n.onended()) };
}
const sfxWith = (fa, clock) => createSfx({ createContext: fa ? () => new fa.Ctx() : null, now: () => clock.t });
test('sfx: nothing is created or played while sound effects are disabled (the default)', () => {
  const fa = fakeAudio(); const clock = { t: 5000 }; const s = sfxWith(fa, clock);
  assert.equal(s.play({ enabled: false, volume: 0.6 }), false); assert.equal(fa.made.ctx, 0, 'no AudioContext was even constructed'); assert.equal(fa.made.nodes.length, 0); assert.equal(s.stats().hasContext, false);
  assert.equal(s.play({ enabled: true, volume: 0 }), false); assert.equal(fa.made.ctx, 0, 'muted master volume is silent too');
  assert.equal(core.DEFAULT_PREFS.audio.sfx, false, 'default preference is off');
});
test('sfx: enabled plays once with one context; repeats are ignored during the sound and the cooldown', () => {
  const fa = fakeAudio(); const clock = { t: 5000 }; const s = sfxWith(fa, clock);
  assert.equal(s.play({ enabled: true, volume: 0.6 }), true); assert.equal(fa.made.ctx, 1); const n1 = fa.made.nodes.length; assert.ok(n1 >= 8 && n1 <= 12, 'a small, fixed number of nodes: ' + n1);
  for (let i = 0; i < 20; i++) assert.equal(s.play({ enabled: true, volume: 0.6 }), false); assert.equal(fa.made.nodes.length, n1, 'spamming adds no nodes');
  fa.endAll(); assert.equal(s.stats().active, 0); assert.equal(s.play({ enabled: true, volume: 0.6 }), false, 'still inside the cooldown');
  clock.t += COOLDOWN_MS + 1; assert.equal(s.play({ enabled: true, volume: 0.6 }), true); assert.equal(fa.made.ctx, 1, 'the one context is reused');
});
test('sfx: every node is disconnected when its sound ends, so nothing accumulates', () => {
  const fa = fakeAudio(); const clock = { t: 0 }; const s = sfxWith(fa, clock);
  for (let round = 0; round < 6; round++) { clock.t += COOLDOWN_MS + 1; assert.equal(s.play({ enabled: true, volume: 1 }), true); fa.endAll(); }
  const sources = fa.made.nodes.filter((n) => n.kind === 'source' || n.kind === 'osc'); assert.ok(sources.every((n) => n.started && n.stopped), 'all scheduled to stop');
  assert.ok(fa.made.nodes.every((n) => n.disconnected), 'all disconnected after ending'); assert.equal(s.stats().active, 0);
});
test('sfx: volume is clamped, quiet, and scales with the master volume', () => {
  const peak = (vol) => { const fa = fakeAudio(); sfxWith(fa, { t: 0 }).play({ enabled: true, volume: vol }); return Math.max(...fa.made.nodes.filter((n) => n.kind === 'gain').flatMap((n) => n.gain.calls.filter((c) => c[0] === 'lin').map((c) => c[1]))); };
  assert.ok(peak(1) <= 0.16 + 1e-9 && peak(99) === peak(1), 'clamped at 1 and never loud'); assert.ok(peak(0.5) < peak(1) && Math.abs(peak(0.5) * 2 - peak(1)) < 1e-9); assert.equal(sfxWith(fakeAudio(), { t: 0 }).play({ enabled: true, volume: NaN }), false);
});
test('sfx: no AudioContext, a null context, or a refused resume degrade silently and never throw', async () => {
  assert.equal(sfxWith(null, { t: 0 }).play({ enabled: true, volume: 1 }), false);
  assert.equal(createSfx({ createContext: () => null, now: () => 0 }).play({ enabled: true, volume: 1 }), false);
  const fa = fakeAudio({ state: 'suspended', resumeRejects: true }); const unhandled = []; const h = (e) => unhandled.push(e); process.on('unhandledRejection', h);
  assert.equal(sfxWith(fa, { t: 0 }).play({ enabled: true, volume: 1 }), true); await sleep(20); process.off('unhandledRejection', h);
  assert.equal(fa.made.resume, 1, 'resume attempted from the gesture'); assert.deepEqual(unhandled, [], 'a refused resume is handled');
});
test('KatanaReveal source: a real button, no loops or global listeners, no filters, sound only from the click handler', () => {
  const src = readFileSync(join(root, 'src/components/samurai/KatanaReveal.tsx'), 'utf8'); const code = src.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.match(code, /<button\s+type="button"/); assert.match(code, /aria-pressed=\{drawn\}/); assert.match(code, /aria-label="Draw the katana"/); assert.match(code, /<svg[^>]*aria-hidden="true"/); assert.match(code, /aria-describedby=\{listId\}/);
  assert.ok(!/requestAnimationFrame|setInterval|setTimeout|addEventListener|director|gsap/.test(code), 'no animation loop, timer, global listener or GSAP'); assert.ok(!/<filter|filter=|feGaussian|feDropShadow/.test(code), 'no SVG filters');
  assert.equal((code.match(/sfx\.play\(/g) || []).length, 1, 'exactly one call site'); const onClick = code.slice(code.indexOf('const onClick'), code.indexOf('const g = ')); assert.ok(onClick.includes('sfx.play('), 'inside the click handler');
  assert.ok(!/onPointerEnter=[^\n]*sfx|onFocus=[^\n]*sfx/.test(code), 'hover and focus never play'); assert.ok(!/preventDefault/.test(code), 'native Enter and Space behaviour is untouched');
});
test('katana CSS: transform and opacity only; static state is correct before hydration; the box reserves its aspect ratio (no layout shift)', () => {
  const css = readFileSync(join(root, 'src/app/globals.css'), 'utf8'); const block = css.slice(css.indexOf('Katana reveal (Phase 3)'));
  assert.ok(!/filter\s*:|drop-shadow|blur\(/.test(block), 'no CSS filters'); assert.ok(!/(width|height|top|left|margin|padding)\s*:[^;}]*;[^}]*transition/.test(block));
  for (const t of block.match(/transition:[^;]+;/g)) assert.ok(/transform|opacity|stroke-dashoffset/.test(t) && !/\b(width|height|top|left)\b/.test(t), t);
  assert.match(block, new RegExp(`aspect-ratio: ${G.VB_W} / ${G.VB_H}`)); assert.match(block, /html\[data-still='true'\] \.katana:not\(\[data-ready\]\) \.k-draw/); assert.match(block, /html\[data-still='true'\] \.k-glint/);
});
test('page integration: one interactive sword in the first divider slot; the other divider stays decorative; no second KatanaReveal', () => {
  const page = readFileSync(join(root, 'src/app/page.tsx'), 'utf8'); assert.equal((page.match(/variant="katana-reveal"/g) || []).length, 1); assert.equal((page.match(/variant="katana"/g) || []).length, 1);
  assert.ok(page.indexOf('<Cinematic />') < page.indexOf('katana-reveal') && page.indexOf('katana-reveal') < page.indexOf('<Explore />'));
  assert.ok(!/KatanaReveal/.test(readFileSync(join(root, 'src/components/samurai/Bushido.tsx'), 'utf8')), 'the pinned Bushido section is untouched');
});
