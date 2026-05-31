import type { TripExpense, Settlement } from '@/lib/trip/types';

/**
 * Auto-settlement between N travelers.
 *
 *   sharePerPerson = totalExpenses / number of travelers
 *   balance = amountPaid - sharePerPerson
 *   Generates greedy transfers to settle all balances.
 */
export function computeSettlement(expenses: TripExpense[], travelers: string[]): Settlement {
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  // Initialize all defined travelers to 0 payments
  const payments: Record<string, number> = {};
  travelers.forEach((t) => {
    payments[t] = 0;
  });

  // Aggregate actual payments
  expenses.forEach((e) => {
    if (payments[e.paid_by] === undefined) {
      payments[e.paid_by] = 0;
    }
    payments[e.paid_by] += Number(e.amount);
  });

  const participantNames = Object.keys(payments);
  const numPeople = participantNames.length || 1;
  const sharePerPerson = totalExpenses / numPeople;

  // Calculate net balances (positive = creditor, negative = debtor)
  const balances = participantNames.map((name) => ({
    name,
    balance: (payments[name] || 0) - sharePerPerson,
  }));

  // Separate debtors and creditors
  const debtors = balances
    .filter((b) => b.balance < -0.01)
    .sort((a, b) => a.balance - b.balance); // most negative first
  const creditors = balances
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
    transfers,
  };
}

