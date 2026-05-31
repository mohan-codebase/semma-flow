import type { ExpenseCategory } from '@/lib/trip/types';

// Category → [text color, translucent bg]. Tuned for the dark theme.
const COLORS: Record<ExpenseCategory, [string, string]> = {
  Travel: ['#7DD3FC', 'rgba(56,189,248,0.14)'],
  Hotel: ['#C4B5FD', 'rgba(167,139,250,0.16)'],
  Food: ['#FCD34D', 'rgba(251,191,36,0.14)'],
  Fuel: ['#FDBA74', 'rgba(251,146,60,0.14)'],
  Clothing: ['#6EE7B7', 'rgba(52,211,153,0.14)'],
  Accessories: ['#5EEAD4', 'rgba(45,212,191,0.14)'],
  Medicine: ['#FDA4AF', 'rgba(251,113,133,0.14)'],
  Booking: ['#A5B4FC', 'rgba(129,140,248,0.16)'],
  Miscellaneous: ['#CBD5E1', 'rgba(148,163,184,0.14)'],
};

export default function CategoryBadge({ category }: { category: ExpenseCategory }) {
  const [color, bg] = COLORS[category] ?? COLORS.Miscellaneous;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 9px',
        borderRadius: 'var(--r-pill)',
        fontSize: 11.5,
        fontWeight: 600,
        color,
        background: bg,
        whiteSpace: 'nowrap',
      }}
    >
      {category}
    </span>
  );
}
