// The topics the site offers as entry points, as an ALLOW-LIST.
//
// Deliberately not a deny-list of leagues. The standing rule (publisher,
// 2026-10-01) is that no league or championship may appear under "Temas" —
// Liga MX, NFL, NBA, F1, LFA, MLS and whatever gets added next; league
// coverage is reached through "Alianzas" instead. A deny-list would hold that
// line only until the next league is added in the CMS, at which point it
// would surface on the homepage by default and nobody would notice. With an
// allow-list a new CMS value is invisible here until someone adds it on
// purpose, which is the failure mode we want.
//
// lib/taxonomy.ts stays the source of truth for what the CMS may STORE. This
// file is about what the public site PROMOTES, which is a smaller set and
// changes for editorial reasons rather than data ones.

import { SPORT_OPTIONS, VERTICAL_OPTIONS } from './taxonomy';

export type Topic = {
  /** Short display label — what the chip and the row badge show. */
  label: string;
  /** Stable slug used in /archivo?deporte= / ?industria= URLs. */
  slug: string;
  /**
   * The taxonomy values this topic covers. More than one because the sport
   * tier mixes sports with leagues: the 31 articles about the NFL are tagged
   * 'NFL', never 'Fútbol americano' (which no article carries at all), so a
   * topic that linked at its own name would land on an empty archive.
   */
  values: string[];
};

// ------------------------------------------------------------------ Sports
// Six buckets, none of them a league. `values` is where the leagues go: they
// remain perfectly good tags, they just stop being their own front door.
export const SPORT_TOPICS: Topic[] = [
  { label: 'Fútbol', slug: 'futbol', values: ['Fútbol', 'Liga MX'] },
  { label: 'Fútbol americano', slug: 'futbol-americano', values: ['NFL'] },
  { label: 'Basquetbol', slug: 'basquetbol', values: ['NBA'] },
  { label: 'Béisbol', slug: 'beisbol', values: ['Béisbol'] },
  { label: 'Automovilismo', slug: 'automovilismo', values: ['F1'] },
  // Tenis, Golf and Olímpico are real tags with ~28 articles between them and
  // no bucket of their own in the six the publisher chose, so they land here
  // rather than losing their way in (publisher's call, 2026-10-01).
  { label: 'Multi-deporte / Otros', slug: 'multideporte', values: ['Multi-deporte / Otros', 'Tenis', 'Golf', 'Olímpico'] },
];

// -------------------------------------------------------------- Industries
// Seven of the thirteen verticals the CMS stores. The labels are shorthand:
// "Private Equity e Inversiones" does not fit a chip, let alone a row badge.
export const INDUSTRY_TOPICS: Topic[] = [
  { label: 'Derechos de TV', slug: 'derechos-de-tv', values: ['Derechos de TV y Streaming'] },
  { label: 'Patrocinios', slug: 'patrocinios', values: ['Patrocinios'] },
  { label: 'Finanzas', slug: 'finanzas', values: ['Finanzas y Negocio'] },
  { label: 'Inversión', slug: 'inversion', values: ['Private Equity e Inversiones'] },
  { label: 'Venues', slug: 'venues', values: ['Infraestructura y Venues'] },
  { label: 'Audiencias', slug: 'audiencias', values: ['Audiencias y Consumo'] },
  { label: 'Gobernanza', slug: 'gobernanza', values: ['Gobernanza y Regulación'] },
];

// ------------------------------------------------------------------ Scope
export const SCOPE_TOPICS: Topic[] = [
  { label: 'Nacional', slug: 'nacional', values: ['Nacional'] },
  { label: 'Internacional', slug: 'internacional', values: ['Internacional'] },
];

// Every value an allow-listed topic covers must still be a real taxonomy
// value, or the topic links to an archive filter that matches nothing. A
// typo here is otherwise silent, and silently-empty is this codebase's
// recurring failure mode. Module scope on purpose: it runs at import, so a
// bad edit fails the build rather than a page.
for (const [tier, topics, allowed] of [
  ['deporte', SPORT_TOPICS, SPORT_OPTIONS as readonly string[]],
  ['industria', INDUSTRY_TOPICS, VERTICAL_OPTIONS as readonly string[]],
] as const) {
  for (const topic of topics) {
    for (const value of topic.values) {
      if (!allowed.includes(value)) {
        throw new Error(`lib/topics.ts: "${value}" (tema ${tier} "${topic.label}") no existe en lib/taxonomy.ts`);
      }
    }
  }
}

/**
 * The industry badge for an article's row in the homepage list.
 *
 * `tags_vertical` is an ARRAY and 183 of 362 published articles carry more
 * than one, so "the article's industry" has to be chosen rather than read.
 * The allow-list's own order decides (publisher, 2026-10-01): it is an
 * editorial priority, so the same pair of tags always badges the same way
 * instead of depending on capture order in the CMS.
 *
 * An article whose verticals are all outside the allow-list keeps its first
 * one at full length — six real verticals live outside those seven, among
 * them Fusiones y Adquisiciones with 41 articles, and badging those
 * "NOTICIAS" would throw away the more specific thing we know. `null` means
 * the caller should fall back to its own label.
 */
export function industryLabel(verticals: string[] | null | undefined): string | null {
  if (!verticals?.length) return null;
  for (const topic of INDUSTRY_TOPICS) {
    if (topic.values.some(value => verticals.includes(value))) return topic.label;
  }
  return verticals[0] ?? null;
}

// ------------------------------------------------------- Tiers and lookups
// One tier per column of the Temas panel. `param` is the query key the
// archive reads, and it is a NEW key rather than a reuse of ?sport=: a
// grouped topic and a raw taxonomy value are different things, and the old
// links have to keep working untouched. /archivo?sport=Liga%20MX still
// filters to exactly Liga MX; /archivo?deporte=futbol covers Fútbol AND
// Liga MX. Both are legitimate, so both exist.
export const TOPIC_TIERS = {
  deporte: { label: 'Por deporte', topics: SPORT_TOPICS, field: 'tagsSport' },
  industria: { label: 'Por industria', topics: INDUSTRY_TOPICS, field: 'tagsVertical' },
  ambito: { label: 'Por ámbito', topics: SCOPE_TOPICS, field: 'tagsScope' },
} as const;

export type TopicTier = keyof typeof TOPIC_TIERS;
export const TOPIC_TIER_KEYS = Object.keys(TOPIC_TIERS) as TopicTier[];

export function topicBySlug(tier: TopicTier, slug: string): Topic | undefined {
  return TOPIC_TIERS[tier].topics.find(t => t.slug === slug);
}

/** The archive URL for a topic — the one place these links are built. */
export function topicHref(tier: TopicTier, slug: string): string {
  return `/archivo?${tier}=${encodeURIComponent(slug)}`;
}

/** Every allow-listed topic, flattened, for the chips row to rank. */
export function allTopics(): { tier: TopicTier; topic: Topic }[] {
  return TOPIC_TIER_KEYS.flatMap(tier => TOPIC_TIERS[tier].topics.map(topic => ({ tier, topic })));
}

/**
 * Does this article belong to the topic? True when ANY of the topic's
 * taxonomy values appears in the article's tags for that tier.
 */
export function articleInTopic(
  article: { tagsSport: string[]; tagsVertical: string[]; tagsScope: string[] },
  tier: TopicTier,
  topic: Topic,
): boolean {
  const tags = article[TOPIC_TIERS[tier].field];
  return topic.values.some(value => tags.includes(value));
}

/**
 * The six topics to promote in the chips row: the allow-listed topics with
 * the most articles in `articles`, ties broken by the allow-list's own order
 * so the row is stable rather than reshuffling on every rebuild.
 *
 * Ámbito is excluded: Nacional and Internacional split the whole archive
 * between them (311/91 today), so they would win on volume every time and
 * crowd out the topics a reader actually browses by. They stay in the panel,
 * where they are a useful axis rather than a popularity contest.
 */
export function topTopics(
  articles: { tagsSport: string[]; tagsVertical: string[]; tagsScope: string[] }[],
  limit = 6,
): { tier: TopicTier; topic: Topic; count: number }[] {
  return allTopics()
    .filter(({ tier }) => tier !== 'ambito')
    .map((entry, index) => ({
      ...entry,
      count: articles.filter(a => articleInTopic(a, entry.tier, entry.topic)).length,
      index,
    }))
    .filter(t => t.count > 0)
    .sort((a, b) => b.count - a.count || a.index - b.index)
    .slice(0, limit)
    .map(({ tier, topic, count }) => ({ tier, topic, count }));
}

/**
 * What the chips row shows when the 30-day window is empty or the query
 * fails — a quiet fortnight must not blank the row. Six fixed topics in the
 * allow-list's order, which is also the editorial priority.
 */
export const FALLBACK_TOP_TOPICS: { tier: TopicTier; topic: Topic }[] = [
  { tier: 'industria', topic: INDUSTRY_TOPICS[0] },
  { tier: 'deporte', topic: SPORT_TOPICS[0] },
  { tier: 'industria', topic: INDUSTRY_TOPICS[1] },
  { tier: 'industria', topic: INDUSTRY_TOPICS[6] },
  { tier: 'deporte', topic: SPORT_TOPICS[1] },
  { tier: 'industria', topic: INDUSTRY_TOPICS[2] },
];
