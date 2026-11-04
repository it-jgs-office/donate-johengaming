export const AMOUNT_STYLE_OPTIONS = [
  { value: 'solid', label: 'Solid' },
  { value: 'outline', label: 'Outline' },
  { value: 'neon', label: 'Neon Glow' },
  { value: 'shadow', label: 'Bold Shadow' },
  { value: 'badge', label: 'Badge' },
];

export const getAmountStyle = (style, amountColor, textColor) => {
  const baseStyle = { color: amountColor };

  switch (style) {
    case 'outline':
      return {
        ...baseStyle,
        color: textColor,
        WebkitTextStroke: `2px ${amountColor}`,
        paintOrder: 'stroke fill',
      };
    case 'neon':
      return {
        ...baseStyle,
        textShadow: `0 0 7px ${amountColor}, 0 0 18px ${amountColor}, 0 0 32px ${amountColor}`,
      };
    case 'shadow':
      return {
        ...baseStyle,
        textShadow: '3px 3px 0 rgba(15, 42, 95, .9), 6px 6px 14px rgba(0, 0, 0, .28)',
      };
    case 'badge':
      return {
        color: textColor,
        backgroundColor: amountColor,
        borderRadius: '.28em',
        boxShadow: '0 8px 20px rgba(0, 0, 0, .22)',
        padding: '.1em .38em .14em',
      };
    default:
      return baseStyle;
  }
};
