import type { ExpenseCategory } from '@/lib/trip/types';

// Theme-aware category tag. Colours live in globals.css (.cat-badge / .cat-*),
// with separate dark and light-theme palettes so the label stays legible on
// both surfaces.
export default function CategoryBadge({ category }: { category: ExpenseCategory }) {
  return <span className={`cat-badge cat-${category.toLowerCase()}`}>{category}</span>;
}
