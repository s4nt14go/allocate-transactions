import { prioritize, Transaction } from './maximizeAmount';
import fs from 'fs';

describe('prioritize latency file', () => {
  test.each([[1000, 47, 35371.51999999999, 994], [90, 8, 6870.4800000000005, 88], [60, 5, 4362.01, 52], [50, 4, 3637.98, 42]])(
      'for a maximum time of %ims gives %i transactions with a total amount of $%i processed in %ims',
      (totalTime, expectedLength, expectedTotalAmount, expectedTotalTime) => {
        const prioritization = prioritize(readFile(), totalTime);

        expect(prioritization.prioritized.length).toBe(expectedLength);
        expect(prioritization.totalAmount).toBe(expectedTotalAmount);
        expect(prioritization.totalTime).toBe(expectedTotalTime);
      },
  );
});

it('prioritizes secondly by latency', () => {
  const transactions = [
    {
      id: '1',
      amount: 100,
      bank_country_code: 'us',
    },
    {
      id: '2',
      amount: 200,
      bank_country_code: 'ar',
    },
    {
      id: '3',
      amount: 200,
      bank_country_code: 'ar',
    },
    {
      id: '4',
      amount: 100,
      bank_country_code: 'au',
    },
  ];
  const latencies = {
    us: 1,
    ar: 2,
    au: 3,
  };

  const prioritization = prioritize(transactions, 4, latencies);

  expect(prioritization.prioritized.length).toBe(2);
  expect(prioritization.totalAmount).toBe(400);
  expect(prioritization.totalTime).toBe(4);
});

test(`after stumbling into the first transaction that doesn't fit in the remaining time, it continues checking if lower latency transactions fit`, () => {
  const transactions = [
    {
      id: '1',
      amount: 100,
      bank_country_code: 'us',
    },
    {
      id: '2',
      amount: 200,
      bank_country_code: 'ar',
    },
    {
      id: '3',
      amount: 200,
      bank_country_code: 'ar',
    },
    {
      id: '4',
      amount: 400,
      bank_country_code: 'au',
    },
  ];
  const latencies = {
    us: 1,
    ar: 2,
    au: 3,
  };

  const prioritization = prioritize(transactions, 6, latencies);

  expect(prioritization.prioritized.length).toBe(3);
  expect(prioritization.totalAmount).toBe(700);
  expect(prioritization.totalTime).toBe(6);
});

function readFile() {
  const parsed: Transaction[] = [];
  let data = fs.readFileSync('./transactions.csv', 'utf8');
  data
    .split('\n')
    .slice(1)
    .map((transaction: string) => {
      const fields = transaction.split(',');
      parsed.push({
        id: fields[0],
        amount: Number(fields[1]),
        bank_country_code: fields[2],
      });
    });
  return parsed;
}
