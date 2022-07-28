/**
 * Returns a subset (or full array) that will maximize the USD amount and fit the transactions under 1 second
 * @param transactions Input transactions
 * @param totalTime Period time in milliseconds
 * @returns transactions Prioritized transactions
 */
export function prioritize(
  transactions: Transaction[],
  totalTime = 1000
): Transaction[] {
  return [];
}

type Transaction = {
  id: string;
  amount: number;
  bank_country_code: string;
};
