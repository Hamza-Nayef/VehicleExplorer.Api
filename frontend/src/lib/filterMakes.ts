import type { Make } from '../api';

/**
 * Case-insensitive search over the (several thousand) makes.
 * Names that START with the query come first ("ford" -> Ford before Radford),
 * then names that merely contain it. Capped so the dropdown stays small and fast.
 */
export function filterMakes(makes: Make[], query: string, limit = 50): Make[] {
  const q = query.trim().toLowerCase();
  if (!q) return makes.slice(0, limit);

  const startsWith: Make[] = [];
  const contains: Make[] = [];

  for (const make of makes) {
    const name = make.name.toLowerCase();
    if (name.startsWith(q)) startsWith.push(make);
    else if (name.includes(q)) contains.push(make);
  }

  return [...startsWith, ...contains].slice(0, limit);
}
