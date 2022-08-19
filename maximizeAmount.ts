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

  // Initialize matrix with { totalAmount: 0, transactions: []} everywhere
  const matrix = Array(_transactions.length + 1) // # rows: # transactions + 1 --> first row will always contain initial values { totalAmount: 0, transactions: []}
    .fill(null)
    .map(
      () =>
        Array(totalTime + 1).fill({ totalAmount: 0, transactions: [] }) // # columns: totalTime + 1 --> the first column with index 0 isn't being use so the column index equals the ms in time
    );

  function getOptimalCombination(row: number, col: number) {
      const currentTransaction = _transactions[row - 1];    // _transactions array is zero indexed, so first matrix row with index 1 corresponds to first _transaction with index 0
      const lastOptimal = matrix[row - 1][col];
      if (currentTransaction.latency > col) {
        return lastOptimal;
      }

      const remaining = col - currentTransaction.latency;
      const lastOptimalWithRemainingLatency = matrix[row - 1][remaining];
      let candidate = lastOptimalWithRemainingLatency.totalAmount +  currentTransaction.amount;
      candidate = Number(candidate.toFixed(2)); // parse it to guard against js floating issues like 0.2 + 0.1 = 0.30000000000000004
      if (candidate > lastOptimal.totalAmount) {
          return  {
              totalAmount: candidate,
              transactions: [
                  ...lastOptimalWithRemainingLatency.transactions,
                  currentTransaction,
              ],
              latency: lastOptimalWithRemainingLatency.latency + currentTransaction.latency,
          }
      }
      return lastOptimal;
  }

  for (let row = 1; row < matrix.length; row++) {
    // col goes through time 1ms to totalTime
    for (let col = 1; col < matrix[row].length; col++) {
      matrix[row][col] = getOptimalCombination(row, col);
    }
  }
  return matrix[matrix.length - 1].pop();
}

export type Transaction = {
  id: string;
  amount: number;
  bank_country_code: string;
};
