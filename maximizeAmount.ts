const fileLatencies: { [key: string]: number } = require('./latencies.json');
/**
 * Returns a subset (or full array) that will maximize the USD amount and fit the transactions under totalTime
 * @param transactions
 * @param [totalTime] Period time in milliseconds (default 1000ms)
 * @param [latencies] Default is latencies file
 * @returns prioritization
 */
export function prioritize(
  transactions: Transaction[],
  totalTime = 1000,
  latencies = fileLatencies
): Prioritization {
  const _transactions = transactions.map((transaction) => ({
    ...transaction,
    amount_per_ms: transaction.amount / latencies[transaction.bank_country_code],
    latency: latencies[transaction.bank_country_code],
  }));

  _transactions.sort((b, a) => {
    // first sort by amount_per_ms, secondly by latency
    const sortByAmountPerMs = a.amount_per_ms - b.amount_per_ms;
    const sortByLatency = a.latency - b.latency;
    const offsetAmountPerMs = Math.trunc(Math.abs(sortByLatency)).toString()
      .length;
    return sortByAmountPerMs * 10 ** offsetAmountPerMs + sortByLatency;
  });

  let remainingTime = totalTime;
  const prioritized = [];

  for (let i = 0; i < _transactions.length; i++) {
    const latency = _transactions[i].latency;
    if (latency > remainingTime) {
      continue;
    }
    prioritized.push(_transactions[i]);
    remainingTime -= latency;
  }

  const totalAmount = prioritized.reduce((acc, obj) => {
    return acc + obj.amount;
  }, 0);

  return {
    prioritized,
    totalAmount,
  };
}

export type Transaction = {
  id: string;
  amount: number;
  bank_country_code: string;
};
type Prioritization = {
  prioritized: (Transaction & {
    amount_per_ms: number;
    latency: number;
  })[];
  totalAmount: number;
};
