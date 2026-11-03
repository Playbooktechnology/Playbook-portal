import { eq } from 'drizzle-orm';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import { articles, dealDrafts, deals } from '../db/schema';
import { isDealArticle, proposeDealDraft } from '../deal-draft';

type ArticleRow = typeof articles.$inferSelect;
// The caller's drizzle instance: lib/db/client's node-postgres pool inside
// Next, the neon-http one scripts/publish-newsletter.ts builds for itself.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = PgDatabase<PgQueryResultHKT, any>;

// Called right after an article is published or saved (lib/actions/admin.ts,
// app/api/update-articles, scripts/publish-newsletter.ts). Proposes a
// Marcador draft when the article sits in a deal vertical and nothing for
// it exists yet: no deal already linking to it, no draft (pending OR
// dismissed — a "Descartar" is remembered, so re-saving the article
// doesn't bring it back).
//
// Never throws. A draft is a convenience for the editor; publishing an
// article must not fail because of it (e.g. before the deal_drafts
// migration has reached the database).
export async function proposeDealDraftForArticle(db: Db, article: ArticleRow): Promise<'created' | 'skipped' | 'error'> {
  try {
    if (article.status !== 'published' || !isDealArticle(article.tagsVertical)) return 'skipped';
    const url = `/articulo/${article.id}`;
    const [linked] = await db.select({ id: deals.id }).from(deals).where(eq(deals.articleUrl, url)).limit(1);
    if (linked) return 'skipped';
    const { fields, missing } = proposeDealDraft(article);
    const inserted = await db
      .insert(dealDrafts)
      .values({ articleId: article.id, fields, missing })
      .onConflictDoNothing({ target: dealDrafts.articleId })
      .returning({ id: dealDrafts.id });
    return inserted.length ? 'created' : 'skipped';
  } catch (err) {
    console.error(`[deal-drafts] could not propose a draft for ${article.id}:`, err);
    return 'error';
  }
}
