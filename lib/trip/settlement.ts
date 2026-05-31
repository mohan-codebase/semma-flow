import type { TripExpense, Settlement } from '@/lib/trip/types';

/**
 * Auto-settlement between N travelers, honouring per-expense splits.
 *
 *   For each expense, the payer is credited the full amount, and the cost is
 *   divided equally among that expense's `split_between` travelers (falling back
 *   to all trip travelers when unset). A personal expense is simply one whose
 *   `split_between` is just the payer.
 *
 *   balance = amountPaid − amountOwed
 *   Greedy transfers then settle all balances.
 */
export function computeSettlement(
  expenses: TripExpense[],
  travelers: string[],
  settled: Array<{ from_person: string; to_person: string; amount: number }> = [],
): Settlement {
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  // Seed every defined traveler so they appear even with zero activity.
  // payments/owed are informational (all expenses); pending* feed the balance
  // and exclude per-expense-settled rows.
  const payments: Record<string, number> = {};
  const owed: Record<string, number> = {};
  const pendingPaid: Record<string, number> = {};
  const pendingOwed: Record<string, number> = {};
  travelers.forEach((t) => {
    payments[t] = 0;
    owed[t] = 0;
    pendingPaid[t] = 0;
    pendingOwed[t] = 0;
  });

  const ensure = (name: string) => {
    if (payments[name] === undefined) payments[name] = 0;
    if (owed[name] === undefined) owed[name] = 0;
    if (pendingPaid[name] === undefined) pendingPaid[name] = 0;
    if (pendingOwed[name] === undefined) pendingOwed[name] = 0;
  };

  expenses.forEach((e) => {
    const amount = Number(e.amount);

    // Who paid.
    ensure(e.paid_by);
    payments[e.paid_by] += amount;
    if (!e.settled) pendingPaid[e.paid_by] += amount;

    // Who shares it — the chosen subset, or everyone when unset/empty.
    const sharers = e.split_between && e.split_between.length > 0 ? e.split_between : travelers;
    if (sharers.length === 0) return; // no one to split among — skip
    const perHead = amount / sharers.length;
    sharers.forEach((name) => {
      ensure(name);
      owed[name] += perHead;
      if (!e.settled) pendingOwed[name] += perHead;
    });
  });

  const participantNames = Object.keys(payments);
  const sharePerPerson = totalExpenses / (travelers.length || participantNames.length || 1);

  // Net balance per person (positive = creditor, negative = debtor). Only
  // unsettled expenses count toward the pending balance.
  const balances: Record<string, number> = {};
  participantNames.forEach((name) => {
    balances[name] = (pendingPaid[name] || 0) - (pendingOwed[name] || 0);
  });

  // Apply recorded settle-up payments: a payment from a debtor to a creditor
  // moves both balances toward zero, so the cleared debt stops showing.
  settled.forEach((s) => {
    const amt = Number(s.amount);
    if (balances[s.from_person] !== undefined) balances[s.from_person] += amt;
    if (balances[s.to_person] !== undefined) balances[s.to_person] -= amt;
  });

  // Separate list whose objects can be mutated by the greedy pass below,
  // leaving `balances` as the displayed net-pending snapshot.
  const balanceList = participantNames.map((name) => ({ name, balance: balances[name] }));

  const debtors = balanceList
    .filter((b) => b.balance < -0.01)
    .sort((a, b) => a.balance - b.balance); // most negative first
  const creditors = balanceList
    .filter((b) => b.balance > 0.01)
    .sort((a, b) => b.balance - a.balance); // most positive first

  const transfers: Array<{ from: string; to: string; amount: number }> = [];
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const oweAmount = -debtor.balance;
    const receiveAmount = creditor.balance;
    const transferAmount = Math.min(oweAmount, receiveAmount);

    if (transferAmount > 0.01) {
      transfers.push({
        from: debtor.name,
        to: creditor.name,
        amount: Number(transferAmount.toFixed(2)),
      });
    }

    debtor.balance += transferAmount;
    creditor.balance -= transferAmount;

    if (Math.abs(debtor.balance) < 0.01) dIdx++;
    if (Math.abs(creditor.balance) < 0.01) cIdx++;
  }

  return {
    totalExpenses,
    sharePerPerson,
    payments,
    owed,
    balances,
    transfers,
  };
}
