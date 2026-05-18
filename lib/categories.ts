/**
 * categories.ts — Fuente única de verdad para la taxonomía de categorías de Pitzbol.
 * Usada por: mapa (filtros), páginas de categoría (quick filters),
 *            interfaz /informacion (etiquetas editables por el admin).
 */

export interface SubCategory {
  id: string;
  label: string;
  /** Palabras clave para filtrar lugares por rawCategoria */
  keywords: string[];
}

export interface Category {
  id: string;
  label: string;
  emoji: string;
  /** Route de la página principal de esta categoría */
  route?: string;
  /** Keywords para matching con rawCategoria del lugar */
  keywords: string[];
  subs: SubCategory[];
}

export const TAXONOMY: Category[] = [
  {
    id: 'gastronomia',
    label: 'Gastronomía',
    emoji: '🍽️',
    route: '/gastronomia',
    keywords: ['gastronomia', 'mexicana', 'postre', 'vegana', 'comida calle', 'cafeteria', 'cafe', 'bistro'],
    subs: [
      { id: 'mexicana',      label: 'Mexicana',           keywords: ['mexicana', 'birria', 'torta', 'tacos', 'pozole'] },
      { id: 'cafeterias',    label: 'Cafeterías',          keywords: ['cafeteria', 'cafe', 'brunch'] },
      { id: 'internacional', label: 'Internacional',        keywords: ['gastronomia', 'bistro', 'americana'] },
      { id: 'postres',       label: 'Postres & Dulces',    keywords: ['postre', 'nieves', 'dulces', 'churros'] },
      { id: 'vegana',        label: 'Vegana',              keywords: ['vegana', 'vegetariana'] },
      { id: 'callejera',     label: 'Comida de calle',     keywords: ['comida calle', 'lonche', 'fonda'] },
    ],
  },
  {
    id: 'futbol',
    label: 'Fútbol',
    emoji: '⚽',
    route: '/futbol',
    keywords: ['futbol', 'fan zone', 'fanzone', 'deportivo', 'estadio', 'sportsbar'],
    subs: [
      { id: 'estadios',  label: 'Estadios',          keywords: ['estadio'] },
      { id: 'fan_zone',  label: 'Fan Zones / Fest',  keywords: ['fan zone', 'fanzone', 'fan fest'] },
      { id: 'bares_dep', label: 'Bares deportivos',  keywords: ['sportsbar', 'bar deportivo'] },
    ],
  },
  {
    id: 'cultura',
    label: 'Cultura',
    emoji: '🏛️',
    route: '/cultura',
    keywords: ['cultura', 'museos', 'arte e historia', 'arquitectura', 'patrimonio', 'historico', 'musica'],
    subs: [
      { id: 'museos',       label: 'Museos',           keywords: ['museos', 'museo'] },
      { id: 'arte',         label: 'Arte e Historia',  keywords: ['arte e historia', 'arte'] },
      { id: 'arquitectura', label: 'Arquitectura',     keywords: ['arquitectura', 'historico', 'patrimonio'] },
      { id: 'fotografia',   label: 'Fotografía',       keywords: ['fotografia', 'mirador'] },
      { id: 'musica_vivo',  label: 'Música en vivo',   keywords: ['musica', 'teatro'] },
    ],
  },
  {
    id: 'clubs',
    label: 'Clubs / Bar',
    emoji: '🍹',
    route: '/clubs',
    keywords: ['nocturna', 'bar', 'cantina', 'club', 'mezcal', 'tequila'],
    subs: [
      { id: 'cantinas',    label: 'Cantinas',          keywords: ['cantina'] },
      { id: 'bares',       label: 'Bares',             keywords: ['bar', 'nocturna'] },
      { id: 'clubs',       label: 'Clubs nocturnos',   keywords: ['club', 'discoteca'] },
      { id: 'rooftops',    label: 'Rooftops',          keywords: ['rooftop', 'terraza'] },
      { id: 'mezcalerias', label: 'Mezcalerías',       keywords: ['mezcal', 'tequila'] },
    ],
  },
  {
    id: 'eventos',
    label: 'Eventos',
    emoji: '🎉',
    route: '/eventos',
    keywords: ['eventos', 'musica', 'conciertos', 'festival', 'teatro'],
    subs: [
      { id: 'conciertos', label: 'Conciertos',        keywords: ['concierto', 'musica en vivo'] },
      { id: 'teatro',     label: 'Teatro',            keywords: ['teatro'] },
      { id: 'ferias',     label: 'Ferias y Mercados', keywords: ['feria', 'mercados locales'] },
      { id: 'fifa',       label: 'Eventos FIFA',      keywords: ['fifa', 'mundial'] },
    ],
  },
  {
    id: 'naturaleza',
    label: 'Naturaleza',
    emoji: '🌿',
    keywords: ['naturaleza', 'parque', 'verde', 'bosque', 'aventura'],
    subs: [
      { id: 'parques',   label: 'Parques',            keywords: ['parque', 'verde'] },
      { id: 'miradores', label: 'Miradores',           keywords: ['mirador', 'vista'] },
      { id: 'bosques',   label: 'Bosques y jardines', keywords: ['bosque', 'jardin', 'naturaleza'] },
      { id: 'aventura',  label: 'Aventura',            keywords: ['aventura'] },
    ],
  },
  {
    id: 'compras',
    label: 'Compras',
    emoji: '🛍️',
    keywords: ['compras', 'mercados locales', 'centro comercial', 'artesanias', 'tienda'],
    subs: [
      { id: 'mercados',    label: 'Mercados Locales',    keywords: ['mercado local', 'mercados locales', 'tianguis'] },
      { id: 'centros_com', label: 'Centros Comerciales', keywords: ['centro comercial', 'plaza', 'mall'] },
      { id: 'artesanias',  label: 'Artesanías',          keywords: ['artesanias', 'artesanal'] },
      { id: 'diseno',      label: 'Diseño y Moda',       keywords: ['diseno', 'ropa', 'boutique'] },
    ],
  },
  {
    id: 'tours',
    label: 'Tours',
    emoji: '🗺️',
    route: '/tours',
    keywords: ['tours', 'tour', 'guia'],
    subs: [],
  },
  {
    id: 'casas_cambio',
    label: 'Casas de Cambio',
    emoji: '💱',
    route: '/casas-cambio',
    keywords: ['casas de cambio', 'cambio', 'divisas'],
    subs: [],
  },
  {
    id: 'hospitales',
    label: 'Hospitales',
    emoji: '🏥',
    route: '/hospitales',
    keywords: ['hospitales', 'hospital', 'salud', 'medico', 'clinica'],
    subs: [],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

/** ¿El rawCategoria de un lugar incluye algún keyword de la categoría/sub? */
export function placeMatchesCategory(rawCategoria: string, categoryId: string): boolean {
  const cat = TAXONOMY.find(c => c.id === categoryId);
  if (!cat) return false;
  const n = norm(rawCategoria);
  const allKws = [...cat.keywords, ...cat.subs.flatMap(s => s.keywords)];
  return allKws.some(kw => n.includes(norm(kw)));
}

/** Quick-filters de una categoría para las páginas de categoría (incluye keywords) */
export function getQuickFilters(categoryId: string): SubCategory[] {
  return TAXONOMY.find(c => c.id === categoryId)?.subs ?? [];
}

/** Filtra lugares por sub-categoría */
export function placeMatchesSub(rawCategoria: string, subId: string): boolean {
  const sub = TAXONOMY.flatMap(c => c.subs).find(s => s.id === subId);
  if (!sub) return false;
  const n = norm(rawCategoria);
  return sub.keywords.some(kw => n.includes(norm(kw)));
}

/** Todas las etiquetas disponibles para el admin en /informacion */
export const ALL_ADMIN_TAGS: string[] = [
  ...TAXONOMY.map(c => c.label),
  ...TAXONOMY.flatMap(c => c.subs.map(s => s.label)),
].filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a.localeCompare(b, 'es'));

/** Aliases para el filtro del mapa { 'gastronomia': ['gastronomia', 'mexicana', ...] } */
export const MAP_FILTER_ALIASES: Record<string, string[]> = Object.fromEntries(
  TAXONOMY.map(cat => [
    norm(cat.label),
    [...new Set([...cat.keywords, ...cat.subs.flatMap(s => s.keywords)])],
  ])
);
