import type { TripExpense, Settlement } from '@/lib/trip/types';

// Who paid what for an expense. Falls back to the single `paid_by` when no
// per-payer breakdown is recorded, so callers never branch on the null case.
export function expensePayers(
  e: Pick<TripExpense, 'paid_by' | 'amount' | 'paid_by_amounts'>,
): Record<string, number> {
  const m = e.paid_by_amounts;
  return m && Object.keys(m).length > 0 ? m : { [e.paid_by]: Number(e.amount) };
}

// Net per-person position on a single expense: amount paid − share owed.
// Positive = the trip owes them; negative = they owe the trip.
function expenseNet(e: TripExpense, travelers: string[]): Record<string, number> {
  const net: Record<string, number> = {};
  const payers = expensePayers(e);
  for (const [name, paid] of Object.entries(payers)) net[name] = (net[name] ?? 0) + paid;

  const sharers = e.split_between && e.split_between.length > 0 ? e.split_between : travelers;
  if (sharers.length > 0) {
    const per = Number(e.amount) / sharers.length;
    for (const name of sharers) net[name] = (net[name] ?? 0) - per;
  }
  return net;
}

// People who still owe money on this expense (negative net), with the amount.
// Drives the inline "… pending" status and the detail modal's status row.
export function expenseShares(
  e: TripExpense,
  travelers: string[],
): Array<{ name: string; amount: number }> {
  return Object.entries(expenseNet(e, travelers))
    .filter(([, n]) => n < -0.01)
    .map(([name, n]) => ({ name, amount: -n }));
}

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

    // Who paid — one or several travelers, each credited their share.
    for (const [name, paid] of Object.entries(expensePayers(e))) {
      ensure(name);
      payments[name] += paid;
      if (!e.settled) pendingPaid[name] += paid;
    }

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
