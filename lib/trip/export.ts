'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { TripExpense, Settlement } from '@/lib/trip/types';
import { formatDate } from '@/lib/trip/format';
import { expensePayers } from '@/lib/trip/settlement';

// "Mohan" for one payer, "Mohan (600), Charles (486)" when several paid.
const paidByText = (e: TripExpense): string => {
  const payers = expensePayers(e);
  const names = Object.keys(payers);
  if (names.length <= 1) return e.paid_by;
  return names.map((n) => `${n} (${Number(payers[n]).toLocaleString('en-IN')})`).join(', ');
};

const ROWS = (expenses: TripExpense[]) =>
  expenses.map((e) => ({
    Date: formatDate(e.expense_date),
    Category: e.category,
    Item: e.item,
    'Paid By': paidByText(e),
    'Amount (INR)': Number(e.amount),
    Notes: e.notes ?? '',
    Source: e.source_url ?? '',
  }));

/** Download the expense list as an .xlsx workbook. */
export function exportExpensesToExcel(expenses: TripExpense[]) {
  const ws = XLSX.utils.json_to_sheet(ROWS(expenses));
  ws['!cols'] = [{ wch: 14 }, { wch: 14 }, { wch: 32 }, { wch: 10 }, { wch: 14 }, { wch: 28 }, { wch: 30 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
  XLSX.writeFile(wb, 'trip-expenses.xlsx');
}

/** Download the expense list + settlement summary as a PDF. */
export function exportExpensesToPDF(expenses: TripExpense[], settlement: Settlement) {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text('Trip — Expenses', 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text(`Generated ${formatDate(new Date())}`, 14, 24);

  autoTable(doc, {
    startY: 30,
    head: [['Date', 'Category', 'Item', 'Paid By', 'Amount (Rs.)']],
    body: expenses.map((e) => [
      formatDate(e.expense_date),
      e.category,
      e.item,
      paidByText(e),
      Number(e.amount).toLocaleString('en-IN'),
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [124, 58, 237] },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const endY = (doc as any).lastAutoTable?.finalY ?? 40;
  doc.setTextColor(20);
  doc.setFontSize(11);
  doc.text('Settlement summary', 14, endY + 12);
  doc.setFontSize(10);
  const lines = [
    `Total expenses: Rs. ${settlement.totalExpenses.toLocaleString('en-IN')}`,
    `Share per person: Rs. ${settlement.sharePerPerson.toLocaleString('en-IN')}`,
  ];
  Object.entries(settlement.payments).forEach(([name, amount]) => {
    lines.push(`Paid by ${name}: Rs. ${amount.toLocaleString('en-IN')}`);
  });
  if (settlement.transfers.length === 0) {
    lines.push('All settled up.');
  } else {
    settlement.transfers.forEach((t) => {
      lines.push(`${t.from} owes ${t.to}: Rs. ${t.amount.toLocaleString('en-IN')}`);
    });
  }
  lines.forEach((line, i) => doc.text(line, 14, endY + 20 + i * 6));

  doc.save('trip-expenses.pdf');
}
