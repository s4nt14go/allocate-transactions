import { prioritize, Transaction } from './maximizeAmount';
import fs from 'fs';

test('latency file', () => {
  const prioritization = prioritize(readFile());

  expect(prioritization.prioritized.length).toBe(47);
  expect(prioritization.totalAmount).toBe(35371.51999999999);
  expect(prioritization.totalTime).toBe(994);
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
