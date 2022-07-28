import { prioritize, Transaction } from './maximizeAmount';
import fs from 'fs';

test('1', () => {
  const prioritized = prioritize(readFile());
});

test('first prioritization by amount per ms and secondly by amount', () => {
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

  expect(prioritization.totalAmount).toBe(400);
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
