'use server';

import { desc, eq, isNull } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { auth } from '@/auth';
import { db } from '@/lib/db/client';
import { articles, dealDrafts, deals } from '@/lib/db/schema';
import { DEALS_CACHE_TAG, toDeal } from '@/lib/data/deals';
import { normalizeDealInput, type Deal, type DealInput } from '@/lib/deals';
import type { DraftFields } from '@/lib/deal-draft';

// Same guard as lib/actions/admin.ts's requireEditor — redefined because a
// 'use server' module can only export async actions (see lib/actions/team.ts).
async function requireEditor() {
  const session = await auth();
  if (!session || session.user.role !== 'editor') {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function listDeals(): Promise<Deal[]> {
  await requireEditor();
  const rows = await db.select().from(deals).orderBy(desc(deals.date), desc(deals.createdAt));
  return rows.map(toDeal);
}

// id null = new deal. Every write invalidates the public cache, so the rail
// and /marcador pick it up on the next request.
export async function saveDeal(id: string | null, input: Partial<DealInput>): Promise<Deal> {
  await requireEditor();
  const values = normalizeDealInput(input);
  const [row] = id
    ? await db.update(deals).set({ ...values, updatedAt: new Date() }).where(eq(deals.id, id)).returning()
    : await db.insert(deals).values(values).returning();
  if (!row) throw new Error('El acuerdo ya no existe; recarga la lista.');
  revalidateTag(DEALS_CACHE_TAG);
  return toDeal(row);
}

export async function deleteDeal(id: string): Promise<void> {
  await requireEditor();
  await db.delete(deals).where(eq(deals.id, id));
  revalidateTag(DEALS_CACHE_TAG);
}

// ----------------------------------------------------------------- Review queue
// Drafts proposed from published articles (lib/data/deal-drafts.ts). They
// live in their own table and nothing public reads it; approveDealDraft is
// the only door into `deals`.

export type DealDraftView = {
  id: string;
  articleId: string;
  articleTitle: string;
  articleDate: string;
  fields: DraftFields;
  missing: string[];
  createdAt: string;
};

export async function listDealDrafts(): Promise<DealDraftView[]> {
  await requireEditor();
  const rows = await db
    .select({ draft: dealDrafts, title: articles.title, date: articles.date })
    .from(dealDrafts)
    .leftJoin(articles, eq(articles.id, dealDrafts.articleId))
    .where(isNull(dealDrafts.dismissedAt))
    .orderBy(desc(articles.date), desc(dealDrafts.createdAt));
  return rows.map(r => ({
    id: r.draft.id,
    articleId: r.draft.articleId,
    articleTitle: r.title ?? r.draft.articleId,
    articleDate: r.date ?? '',
    fields: r.draft.fields as DraftFields,
    missing: r.draft.missing,
    createdAt: r.draft.createdAt.toISOString(),
  }));
}

// Same validation as a hand-entered deal (normalizeDealInput), then the
// draft is removed in the same transaction, so a deal can't be approved twice.
export async function approveDealDraft(draftId: string, input: Partial<DealInput>): Promise<Deal> {
  await requireEditor();
  const values = normalizeDealInput(input);
  const row = await db.transaction(async tx => {
    const removed = await tx.delete(dealDrafts).where(eq(dealDrafts.id, draftId)).returning({ id: dealDrafts.id });
    if (!removed.length) throw new Error('Ese borrador ya no existe (¿lo aprobó o descartó alguien más?).');
    const [inserted] = await tx.insert(deals).values(values).returning();
    return inserted;
  });
  revalidateTag(DEALS_CACHE_TAG);
  return toDeal(row);
}

export async function dismissDealDraft(draftId: string): Promise<void> {
  await requireEditor();
  await db.update(dealDrafts).set({ dismissedAt: new Date() }).where(eq(dealDrafts.id, draftId));
}
