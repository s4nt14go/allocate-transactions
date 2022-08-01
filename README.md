## Exercise

You have a real-time fraud-detection system that accepts transactions and returns `true` or `false` if transaction is fraudulent or not.
Transaction class

```js
class Transaction {
  // a UUID of transaction
  string ID;
  // in USD, typically a value betwen 0.01 and 1000 USD.
  decimal Amount;
  // a 2-letter country code of where the bank is located
  string BankCountryCode;
}
```

You have a method that accepts a collection of transactions

```js
function processTransactions(transactions []Transaction){
  results = []
  foreach transaction in transactions {
    result = {id: transaction.ID}
    result.fraudulent = processTransaction(transaction)
    results.push(result)
  }
  return results
}
```

The `processTransactions` method is called every second and receives an array of transactions;

Once your code processes all of them, it returns an array of results (id and fraudulent or not)
To verify a specific transaction, you need to call an existing function that will internally call the bank API and verify the transaction using this API.

Calling a bank API can be very fast (1-10ms) or very slow (200-300ms) depending on where the bank is located.

If the bank is somewhere in the US - the API call will take very little time.

If the bank is somewhere in Australia, the call will take more time.

Over time, you start noticing that the number of transactions pushed to your `processTransactions` method every second becomes too big,
and you can no longer process all transactions in one second.

You need to write a function, that will prioritize the transactions based on their `Amount`.

The more money you handle, the better, the goal of this exercise is to maximize the total USD value your function processes in 1 second.

You can only process transactions sequentially, i.e. you cannot spawn additional threads or routines.

**Task:**

Write a `prioritize` function body, which returns a subset of `transactions` that have the maximum total USD in a given `totalTime`.
For example, if the `totalTime` parameter is 1000ms, the total time of the prioritized transactions should be less than or
equal to 1000ms.

```js
// function should return a subset (or full array)
// that will maximize the USD value and fit the transactions under 1 second
function prioritize(transaction []Transaction, totalTime=1000): []Transaction {
}
```

**Question:**
What is the max USD value that can be processed in 50ms, 60ms, 90ms, 1000ms?

**Instructions:**
Use the api_latencies.json to tell how long each API call takes.

Use the transactions.csv to calculate the total USD values for each question.

Implement the solution as a private GitHub repository and invite `borislobanov92`, `IvanHR21`, `GeorgeFingerprint`, `kimdrip`, and `penyaev` GitHub users to it. Make sure to include answers to all questions in the repo's readme.

Take as much time as you want to get back to us with a solution, but don't spend more than 4 hours on the actual implementation after you started working on it.

You can use any language for the implementation, but our preference is TypeScript or Golang.

**Notes**:
For simplicity, please ignore the time to run the prioritization itself, your goal is to fit the maximum USD transaction amount into the allotted time slots.

**Please briefly describe your algorithm and why you think it's optimal. If you had multiple solutions in mind, why did you choose this particular one?**

## Responses

| Max time \[ms] | Max amount \[USD] | # transactions | Processing time \[ms] |
| -------------: | ----------------: | -------------: | --------------------: |
|          1,000 |         35,471.81 |             48 |                 1,000 |
|             90 |          6,972.29 |              8 |                    90 |
|             60 |          4,675.71 |              5 |                    60 |
|             50 |          4,139.43 |              5 |                    50 |

### Algorithm

To understand the algorithm it's better using a simplified example. Let's say we want to find the maximum amount for a 10ms and these transactions (Ts):

```json5
[
  {
    id: '1',
    amount: 10,
    latency: 2,
  },
  {
    id: '2',
    amount: 20,
    latency: 4,
  },
  {
    id: '3',
    amount: 30,
    latency: 1,
  },
  {
    id: '4',
    amount: 40,
    latency: 3,
  },
]
```

We construct this matrix, with the optimal combination in the last cell (row 4 col 5ms, total amount USD70, transactions 3 and 4) :

| Transaction/row |             1ms             |             2ms             |              3ms              |              4ms              |              5ms              |
| :-------------: | :-------------------------: | :-------------------------: | :---------------------------: | :---------------------------: | :---------------------------: |
|        1        |  {totalAmount: 0, Ts: []}   | {totalAmount: 10, Ts: \[1]} |  {totalAmount: 10, Ts: \[1]}  |  {totalAmount: 10, Ts: \[1]}  |  {totalAmount: 10, Ts: \[1]}  |
|        2        |  {totalAmount: 0, Ts: []}   | {totalAmount: 10, Ts: \[1]} |  {totalAmount: 10, Ts: \[1]}  |  {totalAmount: 20, Ts: \[2]}  |  {totalAmount: 20, Ts: \[2]}  |
|        3        | {totalAmount: 30, Ts: \[3]} | {totalAmount: 30, Ts: \[3]} | {totalAmount: 40, Ts: \[1,3]} | {totalAmount: 40, Ts: \[1,3]} | {totalAmount: 50, Ts: \[2,3]} |
|        4        | {totalAmount: 30, Ts: \[3]} | {totalAmount: 30, Ts: \[3]} | {totalAmount: 40, Ts: \[1,3]} | {totalAmount: 70, Ts: \[3,4]} | {totalAmount: 70, Ts: \[3,4]} |

First, we initialize a matrix where every row corresponds to a transaction and every column to a certain time to allocate transactions. First we populate the matrix with `{totalAmount: 0, Ts: []}` everywhere. We will go through each cell from column 1ms to 5ms, and once we complete row 1 we'll continue with row 2 and so on, adding into the cells the transactions that shape the optimal combination. When we advance from one row to the next, we're making available the transaction of the new row to be combined with the already processed transactions from the previous rows.

Actually, the matrix has one extra row (not shown in the table above), at the very beginning (row 0) that will always hold `{totalAmount: 0, Ts: []}` in all its columns.

Once the initial setup is ready, this is how the algorithm goes on row 1:

- STEP 1: Copy from 1ms to the time just before the latency of the current transaction 1 (that latency happens to be 2ms, so "just before" is just time 1ms) the combination from the previous row (row 0): So copy `{totalAmount: 0, Ts: []}` into row 1 time 1ms.
- STEP 2: Once we arrive at the time equal to transaction 1 latency, check if transaction 1 amount (USD10) is greater than the previous combination total amount at that time (for row 0 all total amounts are USD0), if that's the case, we have a new winner combination, so put the current transaction (transaction 1) alone into that cell combination, if that's not the case copy the previous combination. After this step we should have `{totalAmount: 10, Ts: \[1]}` into row 1, time 2ms.
- STEP 3: Once we surpass the current transaction latency, we start to have more time available than just the enough to allocate the current transaction, so we can consider adding other transactions, that's why we look into the smaller in time combinations from the previous row and check if they get in with the current transaction to find a new winner combination.

This is how the algorithm goes on row 4:

- STEP 1: Copy from 1ms to the time just before the latency of the current transaction 4 (so this is time 1ms and 2ms) the combination from the previous row (row 3): So copy `{totalAmount: 30, Ts: [3]}` into row 4 times 1ms and 2ms.
- STEP 2: Once we arrive at the time equal to transaction 4 latency, we check if transaction 4 amount (USD40) is greater than the previous combination total amount at that time (40USD), as that's not the case (they are equal) just copy the previous combination `{totalAmount: 40, Ts: [1,3]}`.
- STEP 3: Once we surpass the current transaction latency, we start to have more time available than just the enough to allocate the current transaction, so we can consider adding other transactions, so at time 4ms we can combine the current transaction 4 with previous combination from row 3 time 1ms, that would yield a new total amount of USD70 (USD40 + USD30), that is greater than the previous combination (40USD), so we have a new winner combination, so we put in row 4 time 4ms `{totalAmount: 70, Ts: [3,4]}`. In cell row 4 time 5ms it happens similarly and we put the same combination `{totalAmount: 70, Ts: [3,4]}` which is the optimal combination that maximizes the total amount for those transactions within 5ms.

I think this is an optimal approach as the complexity depends on the number of transactions multiplied by time/latency buckets, while if I had used a tree like algorithm using the `totalTime` as the root node and branching out all the available transactions I would have had an exponential complexity of number of transactions raised to the power of latency tree levels.
