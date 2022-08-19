# Select the optimal combination of transactions

Every second we receive many bank transactions that we forward to banks APIs for further processing, the transaction processing time takes different amount of time depending on where the bank is located. For example, if the bank is in the US - the API call will take very little time, on the contrary, if the bank is in Australia, the call will take more time.

As we receive thousands of transaction every second to be sent to the banks APIs, it isn't possible to process all of them in just one second.

The transactions have this shape:

```typescript
type Transaction = {
  // a UUID of transaction
  id: string;
  // in USD, typically a value betwen 0.01 and 1000 USD.
  amount: number;
  // a 2-letter country code of where the bank is located
  bank_country_code: string;
};
```

We will use file `transactions.csv` as a sample with the transactions to be processed.

We also know how much time takes processing every transaction based on the bank country according to file `api_latencies.json`.

## Goal

As the more money you handle, the better, the goal is writing a function to select those transactions that will fit into 1 second and maximize the total USD amount. It can only process transactions sequentially, i.e. you cannot spawn additional threads or routines.

Also, we'll include the limit time as an argument, so we can know the optimal combination of transactions that will fit into 50ms, 60ms and 90ms too, besides 1000ms.

> For simplicity, we'll ignore the time to run the prioritization of transactions itself, the goal is to fit the maximum USD amount into the allotted time slots.

## Responses

| Max time \[ms] | Max amount \[USD] | # transactions |
| -------------: | ----------------: | -------------: |
|          1,000 |         35,471.81 |             48 |
|             90 |          6,972.29 |              8 |
|             60 |          4,675.71 |              5 |
|             50 |          4,139.43 |              5 |

### Algorithm

To understand the algorithm it's better using a simplified example. Let's say we want to find the maximum amount for a 5ms period and these transactions (Ts):

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

We will end up with this matrix, with the optimal combination in the last cell (row 4 col 5ms, total amount USD70, transactions 3 and 4) :

| Transaction/row |             1ms             |             2ms             |              3ms              |              4ms              |              5ms              |
| :-------------: | :-------------------------: | :-------------------------: | :---------------------------: | :---------------------------: | :---------------------------: |
|        1        |  {totalAmount: 0, Ts: []}   | {totalAmount: 10, Ts: \[1]} |  {totalAmount: 10, Ts: \[1]}  |  {totalAmount: 10, Ts: \[1]}  |  {totalAmount: 10, Ts: \[1]}  |
|        2        |  {totalAmount: 0, Ts: []}   | {totalAmount: 10, Ts: \[1]} |  {totalAmount: 10, Ts: \[1]}  |  {totalAmount: 20, Ts: \[2]}  |  {totalAmount: 20, Ts: \[2]}  |
|        3        | {totalAmount: 30, Ts: \[3]} | {totalAmount: 30, Ts: \[3]} | {totalAmount: 40, Ts: \[1,3]} | {totalAmount: 40, Ts: \[1,3]} | {totalAmount: 50, Ts: \[2,3]} |
|        4        | {totalAmount: 30, Ts: \[3]} | {totalAmount: 30, Ts: \[3]} | {totalAmount: 40, Ts: \[1,3]} | {totalAmount: 70, Ts: \[3,4]} | {totalAmount: 70, Ts: \[3,4]} |

First, we initialize a matrix where every row corresponds to a transaction and every column to a certain time to allocate transactions. First we populate the matrix with an initial setup of `{totalAmount: 0, Ts: []}` everywhere. We will go through each cell from column 1ms to 5ms, and once we complete row 1 we'll continue with row 2 and so on, adding into the cells the transactions that shape the optimal combination. When we advance from one row to the next, we're making available the transaction of the new row to be combined with the already processed transactions from the previous rows.

Actually, the matrix has one extra row (not shown in the table above), at the very beginning (row 0) that will always hold `{totalAmount: 0, Ts: []}` in all its columns.

After the initial setup, this is how the algorithm goes on row 1:

- STEP 1: Copy from 1ms to the time just before the latency of the current transaction 1 (that latency happens to be 2ms, so "just before" is just time 1ms) the combination from the previous row (row 0): So copy `{totalAmount: 0, Ts: []}` into row 1 time 1ms.
- STEP 2: Once we arrive at the time equal to transaction 1 latency, check if transaction 1 amount (USD10) is greater than the previous combination total amount at that time (for row 0 all total amounts are USD0), if that's the case, we have a new winner combination, so put the current transaction (transaction 1) alone into that cell combination, if that's not the case copy the previous combination. After this step we should have `{totalAmount: 10, Ts: [1]}` into row 1, time 2ms.
- STEP 3: Once we surpass the current transaction latency, we start to have more time available than just the enough to allocate the current transaction, so we can consider adding other transactions, that's why we look into the smaller in time combinations from the previous row and check if they get in with the current transaction to find a new winner combination.

This is how the algorithm goes on row 4:

- STEP 1: Copy from 1ms to the time just before the latency of the current transaction 4 (so this is time 1ms and 2ms) the combination from the previous row (row 3): So copy `{totalAmount: 30, Ts: [3]}` into row 4 times 1ms and 2ms.
- STEP 2: Once we arrive at the time equal to transaction 4 latency, we check if transaction 4 amount (USD40) is greater than the previous combination total amount at that time (40USD), as that's not the case (they are equal) just copy the previous combination `{totalAmount: 40, Ts: [1,3]}`.
- STEP 3: Once we surpass the current transaction latency, we start to have more time available than just the enough to allocate the current transaction, so we can consider adding other transactions, so at time 4ms we can combine the current transaction 4 with previous combination from row 3 time 1ms, that would yield a new total amount of USD70 (USD40 + USD30), that is greater than the previous combination (40USD), so we have a new winner combination, so we put in row 4 time 4ms `{totalAmount: 70, Ts: [3,4]}`. In cell row 4 time 5ms it happens similarly and we put the same combination `{totalAmount: 70, Ts: [3,4]}` which is the optimal combination that maximizes the total amount for those transactions within 5ms.

## Instructions

```shell
npm i
npm test
```
