'use server';

import { desc, eq } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { auth } from '@/auth';
import { db } from '@/lib/db/client';
import { deals } from '@/lib/db/schema';
import { DEALS_CACHE_TAG, toDeal } from '@/lib/data/deals';
import { normalizeDealInput, type Deal, type DealInput } from '@/lib/deals';

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
