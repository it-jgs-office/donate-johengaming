export const ALERT_FONT_OPTIONS = [
  { value: 'modern', label: 'Modern', family: 'Arial, Helvetica, sans-serif' },
  { value: 'rounded', label: 'Rounded', family: '"Trebuchet MS", "Arial Rounded MT Bold", Arial, sans-serif' },
  { value: 'geometric', label: 'Geometric', family: '"Century Gothic", Futura, Arial, sans-serif' },
  { value: 'classic', label: 'Classic', family: 'Verdana, Geneva, sans-serif' },
  { value: 'condensed', label: 'Condensed', family: '"Arial Narrow", "Roboto Condensed", Arial, sans-serif' },
  { value: 'display', label: 'Display Bold', family: 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif' },
  { value: 'serif', label: 'Serif', family: 'Georgia, "Times New Roman", serif' },
  { value: 'elegant', label: 'Elegant', family: 'Palatino, "Palatino Linotype", Georgia, serif' },
  { value: 'mono', label: 'Monospace', family: '"Courier New", Courier, monospace' },
  { value: 'retro', label: 'Retro', family: '"Lucida Console", Monaco, monospace' },
  { value: 'playful', label: 'Playful', family: '"Comic Sans MS", "Trebuchet MS", cursive' },
  { value: 'gaming', label: 'Gaming', family: 'Copperplate, Papyrus, fantasy' },
];

export const ALERT_FONT_FAMILIES = Object.fromEntries(
  ALERT_FONT_OPTIONS.map((font) => [font.value, font.family]),
);
