export const motionConfig = {
  duration: { fast: 0.18, base: 0.32, slow: 0.6 },
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
  gsapEase: 'power3.out',
};
export const uid = (p = 'id') => `${p}-${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`;
