export type FeeItemLite = { id: string; name: string; amount: number; dueOn: Date; classId: string | null };
export type PayLite = { itemId: string | null; amount: number };
export type FeeRow = { item: FeeItemLite; paid: number; balance: number; overdue: boolean };

/**
 * Works out what a student still owes. A payment tied to a fee item reduces that item; a general payment is
 * applied to the oldest unpaid items first. `credit` is money paid beyond what was charged.
 */
export function ledger(items: FeeItemLite[], pays: PayLite[], today: Date) {
  const bal = new Map(items.map((i) => [i.id, i.amount]));
  let general = 0;
  for (const p of pays) {
    if (p.itemId && bal.has(p.itemId)) bal.set(p.itemId, bal.get(p.itemId)! - p.amount);
    else general += p.amount;
  }
  for (const it of [...items].sort((a, b) => a.dueOn.getTime() - b.dueOn.getTime())) {
    if (general <= 0) break;
    const b = bal.get(it.id)!;
    if (b > 0) { const take = Math.min(b, general); bal.set(it.id, b - take); general -= take; }
  }
  const rows: FeeRow[] = items
    .map((item) => { const balance = bal.get(item.id)!; return { item, paid: item.amount - balance, balance, overdue: balance > 0 && item.dueOn < today }; })
    .sort((a, b) => a.item.dueOn.getTime() - b.item.dueOn.getTime());
  const due = rows.reduce((a, r) => a + Math.max(0, r.balance), 0);
  const overdue = rows.reduce((a, r) => a + (r.overdue ? r.balance : 0), 0);
  const credit = general + rows.reduce((a, r) => a + Math.max(0, -r.balance), 0);
  const charged = items.reduce((a, i) => a + i.amount, 0);
  return { rows, due, overdue, credit, charged };
}
