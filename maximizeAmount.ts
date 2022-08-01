const latenciesFromFile: { [key: string]: number } = require('./latencies.json');
/**
 * Returns a subset (or full array) that will maximize the USD amount and fit the transactions under totalTime
 * @param transactions
 * @param totalTime Period time in milliseconds
 * @param [latencies] Default is latencies file
 */
export function prioritize(
  transactions: Transaction[],
  totalTime: number,
  latencies = latenciesFromFile
): {
  transactions: Transaction[];
  totalAmount: number;
  latency: number;
} {
  const _transactions = transactions.map((transaction) => ({
    ...transaction,
    latency: latencies[transaction.bank_country_code],
  }));

  // Initialize matrix with { totalAmount: 0, transactions: [], latency: 0 } everywhere
  const matrix = Array(_transactions.length + 1) // # rows: # transactions + 1 --> first row will always contain initial values { totalAmount: 0, transactions: [], latency: 0 }
    .fill(null)
    .map(
      () =>
        Array(totalTime + 1).fill({ totalAmount: 0, transactions: [], latency: 0 }) // # columns: totalTime + 1 --> the first column with index 0 isn't being use so the column index equals the ms in time
    );
  for (let row = 1; row < matrix.length; row++) {
    const transaction = _transactions[row - 1]; // _transactions array is zero indexed, so first row with index 1 corresponds to first _transaction with index 0
    for (let col = 1; col < matrix[row].length; col++) {
      // col goes through latency 1ms to totalTime
      const prevCombination = matrix[row - 1][col]; // best combination of previous transactions for this latency/col is taken from previous row

      matrix[row][col] = prevCombination; // initial guess: transaction won't render a new optimal combination, just copy previous combination

      if (transaction.latency <= col) { // if our transaction fits in the time col
        if (transaction.amount > prevCombination.totalAmount) { // ...check if by its own is better than previous combination
          matrix[row][col] = { // ...if that's the case save the new winner combination for that time
            totalAmount: transaction.amount,
            transactions: [transaction],
            latency: transaction.latency,
          };
        }

        // Once we surpass the time col of transaction.latency we have some available free time where we could get in the smaller previous combinations
        const smallPrevCombination = matrix[row - 1][col - transaction.latency];
        const newAmount = smallPrevCombination.totalAmount + transaction.amount;
        const newLatency = smallPrevCombination.latency + transaction.latency;
        if (newLatency <= col && newAmount > prevCombination.totalAmount) {
          matrix[row][col] = {
            totalAmount: Number(newAmount.toFixed(2)),
            transactions: [...smallPrevCombination.transactions, transaction],
            latency: newLatency,
          };
        }
      }
    }
  }
  return matrix[matrix.length -1].pop();
}

export type Transaction = {
  id: string;
  amount: number;
  bank_country_code: string;
};
