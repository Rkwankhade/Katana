// Interaction state for the katana reveal. Pure, so every rule is unit-tested without a browser.
//
// Motion mode: the blade is out while the mouse hovers, the control has keyboard focus, or the visitor has toggled it drawn.
//   Touch never hovers: the first tap draws (toggled), the second sheathes. Mouse and keyboard clicks toggle the same flag.
// Static mode (Calm, system reduced motion, tier 0): the sword is shown drawn, with its markings, and nothing moves. The control
//   still toggles instantly (sheathed / drawn), and hover and focus do nothing.

export interface KatanaState { hover: boolean; focus: boolean; toggled: boolean }
export type KatanaEvent =
  | { type: 'pointer-enter'; pointerType: string }
  | { type: 'pointer-leave' }
  | { type: 'focus'; viaPointer: boolean }
  | { type: 'blur' }
  | { type: 'toggle' }
  | { type: 'reset' };

export const INITIAL_KATANA: KatanaState = { hover: false, focus: false, toggled: false };

export function katanaReduce(s: KatanaState, e: KatanaEvent): KatanaState {
  switch (e.type) {
    case 'pointer-enter': return e.pointerType === 'mouse' || e.pointerType === 'pen' ? (s.hover ? s : { ...s, hover: true }) : s; // touch is never a hover
    case 'pointer-leave': return s.hover ? { ...s, hover: false } : s;
    case 'focus': return e.viaPointer || s.focus ? s : { ...s, focus: true }; // a click's focus must not hold the blade out after sheathing
    case 'blur': return s.focus ? { ...s, focus: false } : s;
    case 'toggle': return { ...s, toggled: !s.toggled };
    case 'reset': return INITIAL_KATANA;
  }
}

export const isOpen = (s: KatanaState, staticMode: boolean): boolean => (staticMode ? !s.toggled : s.hover || s.focus || s.toggled);
/** What assistive tech hears as "pressed": the sword has been deliberately drawn (never just peeked). */
export const isDrawn = (s: KatanaState, staticMode: boolean): boolean => (staticMode ? !s.toggled : s.toggled);
/** A sound belongs only to a deliberate toggle that leaves the sword drawn. Hover, focus and sheathing are silent. */
export const drawsOnToggle = (next: KatanaState, staticMode: boolean): boolean => isDrawn(next, staticMode);
