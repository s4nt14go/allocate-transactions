const latencies: { [key: string]: number } = require('./latencies.json');
/**
 * Returns a subset (or full array) that will maximize the USD amount and fit the transactions under 1 second
 * @param _transactions Input transactions
 * @param totalTime Period time in milliseconds
 * @returns transactions Prioritized transactions
 */
export function prioritize(
  _transactions: Transaction[],
  totalTime = 1000
): TransactionWithMetric[] {
  const transactions = _transactions.map((transaction) => ({
    ...transaction,
    amount_per_ms: transaction.amount / latencies[transaction.bank_country_code],
  }));

  transactions.sort((b, a) => a.amount_per_ms - b.amount_per_ms);

  let remainingTime = totalTime;
  const prioritized = [];

  for (let i = 0; i < transactions.length; i++) {
    const latency = latencies[transactions[i].bank_country_code];
    if (latency > remainingTime) {
      break;
    }
    prioritized.push(transactions[i]);
    remainingTime -= latency;
  }

  return prioritized;
}

export type Transaction = {
  id: string;
  amount: number;
  bank_country_code: string;
};
type TransactionWithMetric = Transaction & { amount_per_ms: number };
