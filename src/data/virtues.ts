// The seven virtues of Bushido. One source of truth for the hanging scrolls (Bushido.tsx) and the katana (KatanaReveal.tsx).
export interface Virtue { kanji: string; jp: string; name: string; seal: string; text: string }

export const VIRTUES: readonly Virtue[] = [
  { kanji: '義', jp: 'Gi', name: 'Righteousness', seal: '一', text: 'Choose what is right over what is easy. Travel in ways that leave a place better than you found it.' },
  { kanji: '勇', jp: 'Yū', name: 'Courage', seal: '二', text: 'Take the longer road, the unfamiliar door, the idea nobody has tried yet.' },
  { kanji: '仁', jp: 'Jin', name: 'Benevolence', seal: '三', text: 'Great places are made by people. Stay with them, eat with them, support what they keep alive.' },
  { kanji: '礼', jp: 'Rei', name: 'Respect', seal: '四', text: 'Greet the house before you enter it. Good design and good guests both begin with courtesy.' },
  { kanji: '誠', jp: 'Makoto', name: 'Honesty', seal: '五', text: 'Say what a space is, not what a brochure wishes it were. Real materials, real light, real costs.' },
  { kanji: '名誉', jp: 'Meiyo', name: 'Honour', seal: '六', text: 'A name is built slowly. Craft that lasts is the quiet kind of fame worth wanting.' },
  { kanji: '忠義', jp: 'Chūgi', name: 'Loyalty', seal: '七', text: 'Stay true to what inspires you. Save it, return to it, and build your plans around it.' },
];
