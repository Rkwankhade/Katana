'use client';
import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useMotionState, usePreferences, useSeason } from '@/lib/preferences';
import type { PerformancePref, SeasonPref } from '@/lib/preferences-core';

interface Opt<T extends string> { value: T; label: string }

/** Single-choice control built as a radio group: one tab stop, arrow keys move and select, every target is at least 44px tall. */
function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: Opt<T>[]; onChange: (v: T) => void }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const move = (e: KeyboardEvent, i: number) => {
    const n = options.length; let j = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % n;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + n) % n;
    else if (e.key === 'Home') j = 0; else if (e.key === 'End') j = n - 1;
    if (j < 0) return;
    e.preventDefault(); onChange(options[j].value); refs.current[j]?.focus();
  };
  return (
    <div role="radiogroup" aria-label={label} className="seg">
      {options.map((o, i) => (
        <button key={o.value} ref={(el) => { refs.current[i] = el; }} type="button" role="radio" aria-checked={value === o.value} tabIndex={value === o.value ? 0 : -1}
          onClick={() => onChange(o.value)} onKeyDown={(e) => move(e, i)} className="seg-btn">{o.label}</button>
      ))}
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="border-t border-white/10 py-3.5 first:border-t-0 first:pt-0">
      <p className="mb-2 text-sm text-ivory">{label}</p>
      {children}
      {hint && <p className="mt-2 text-xs leading-relaxed text-silver">{hint}</p>}
    </div>
  );
}

const onOff = [{ value: 'off', label: 'Off' }, { value: 'on', label: 'On' }] as Opt<'off' | 'on'>[];
const TIER_NAME = ['Static', 'Light', 'Full'] as const;

export default function SettingsMenu({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { prefs, update, reset } = usePreferences();
  const motion = useMotionState();
  const season = useSeason();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const volId = useId();
  const audioOn = prefs.audio.enabled || prefs.audio.sfx;

  // Keep the latest callback in a ref so the listeners below are attached once per open, not once per parent render.
  const change = useRef(onOpenChange);
  useEffect(() => { change.current = onOpenChange; });

  useEffect(() => { if (open) panel.current?.querySelector<HTMLElement>('[role="radio"][tabindex="0"]')?.focus(); }, [open]);
  useEffect(() => {
    if (!open) return;
    const key = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') { change.current(false); button.current?.focus(); } };
    const away = (e: PointerEvent) => { if (root.current && !root.current.contains(e.target as Node)) change.current(false); };
    document.addEventListener('keydown', key); document.addEventListener('pointerdown', away);
    return () => { document.removeEventListener('keydown', key); document.removeEventListener('pointerdown', away); };
  }, [open]);

  const seasonOpts: Opt<SeasonPref>[] = [{ value: 'auto', label: 'Auto' }, { value: 'spring', label: 'Spring' }, { value: 'summer', label: 'Summer' }, { value: 'autumn', label: 'Autumn' }, { value: 'winter', label: 'Winter' }];
  const perfOpts: Opt<PerformancePref>[] = [{ value: 'auto', label: 'Auto' }, { value: 'full', label: 'Full' }, { value: 'light', label: 'Light' }, { value: 'static', label: 'Static' }];

  return (
    <div ref={root}>
      <button ref={button} type="button" onClick={() => onOpenChange(!open)} aria-expanded={open} aria-controls={open ? panelId : undefined}
        aria-label="Settings" title="Settings" className="grid h-11 w-11 place-items-center border border-white/25 transition-colors hover:border-gold hover:text-gold">
        <SlidersHorizontal size={19} aria-hidden />
      </button>
      {open && (
        <div ref={panel} id={panelId} role="dialog" aria-label="Settings"
          className="glass-solid fixed inset-x-3 top-[4.25rem] max-h-[calc(100dvh-5.5rem)] overflow-y-auto overscroll-contain p-5 md:inset-x-auto md:right-8 md:w-[23rem]">
          <h2 className="font-display text-xl text-ivory">Settings</h2>
          <div className="mt-4">
            <Row label="Browsing">
              <Segmented label="Browsing" value={prefs.mode} onChange={(mode) => update({ mode })} options={[{ value: 'fast', label: 'Free Browse' }, { value: 'story', label: 'Guided Story' }]} />
            </Row>
            <Row label="Season" hint={prefs.season === 'auto' ? `Auto follows your local calendar. Right now: ${season}.` : undefined}>
              <Segmented label="Season" value={prefs.season} onChange={(s) => update({ season: s })} options={seasonOpts} />
            </Row>
            {prefs.season === 'auto' && (
              <Row label="Hemisphere for Auto" hint="Southern flips the calendar: December counts as summer.">
                <Segmented label="Hemisphere for Auto" value={prefs.hemisphere} onChange={(hemisphere) => update({ hemisphere })} options={[{ value: 'north', label: 'Northern' }, { value: 'south', label: 'Southern' }]} />
              </Row>
            )}
            <Row label="Calm mode" hint={motion.systemReduced
              ? 'Your device already asks for reduced motion, so animation is off either way.'
              : 'Turns off parallax, falling petals and scroll-driven effects. All content stays.'}>
              <Segmented label="Calm mode" value={prefs.motion === 'calm' ? 'on' : 'off'} onChange={(v) => update({ motion: v === 'on' ? 'calm' : 'system' })} options={onOff} />
            </Row>
            <Row label="Ambient sound">
              <Segmented label="Ambient sound" value={prefs.audio.enabled ? 'on' : 'off'} onChange={(v) => update({ audio: { enabled: v === 'on' } })} options={onOff} />
            </Row>
            <Row label="Sound effects">
              <Segmented label="Sound effects" value={prefs.audio.sfx ? 'on' : 'off'} onChange={(v) => update({ audio: { sfx: v === 'on' } })} options={onOff} />
            </Row>
            {audioOn && (
              <Row label="Master volume">
                <div className="flex min-h-[44px] items-center gap-3">
                  <input id={volId} type="range" min={0} max={100} step={5} value={Math.round(prefs.audio.master * 100)} aria-label="Master volume"
                    onChange={(e) => update({ audio: { master: Number(e.target.value) / 100 } })} className="range flex-1" />
                  <output htmlFor={volId} className="w-10 text-right text-sm tabular-nums text-silver">{Math.round(prefs.audio.master * 100)}%</output>
                </div>
              </Row>
            )}
            <Row label="Performance" hint={prefs.performance === 'auto'
              ? `Auto is using ${TIER_NAME[motion.detectedTier]} on this device. Static shows still artwork and the opening frame.`
              : 'Static shows still artwork and the opening frame.'}>
              <Segmented label="Performance" value={prefs.performance} onChange={(performance) => update({ performance })} options={perfOpts} />
            </Row>
          </div>
          <p className="border-t border-white/10 pt-3 text-xs leading-relaxed text-silver">Guided Story and sound choices are saved now and will apply as those features are added. Nothing plays sound until you turn it on.</p>
          <button type="button" onClick={reset} className="btn btn-ghost btn-sm mt-3 min-h-[44px] w-full">Reset to defaults</button>
        </div>
      )}
    </div>
  );
}
