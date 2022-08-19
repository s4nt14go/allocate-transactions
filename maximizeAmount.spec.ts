import { prioritize, Transaction } from './maximizeAmount';
import fs from 'fs';

it('prioritizes 4 tests transactions', () => {
  const transactions = [
    {
      id: '1',
      amount: 10,
      bank_country_code: 'us',
    },
    {
      id: '2',
      amount: 20,
      bank_country_code: 'ar',
    },
    {
      id: '3',
      amount: 30,
      bank_country_code: 'ca',
    },
    {
      id: '4',
      amount: 40,
      bank_country_code: 'au',
    },
  ];
  const latencies = {
    us: 2,
    ar: 4,
    ca: 1,
    au: 3,
  };

  const prioritization = prioritize(transactions, 5, latencies);

  expect(prioritization.transactions.length).toBe(2);
  expect(prioritization.totalAmount).toBe(70);
  expect(prioritization.latency).toBe(4);
});

describe('prioritizes using sample files', () => {
  test.each([
    [1000, 48, 35471.81],
    [90, 8, 6972.29],
    [60, 5, 4675.71],
    [50, 5, 4139.43],
  ])(
    'for a maximum time of %ims gives %i transactions with a total amount of $%f',
    (totalTime, expectedLength, expectedTotalAmount) => {
      const prioritization = prioritize(readFile(), totalTime);

      expect(prioritization.transactions.length).toBe(expectedLength);
      expect(prioritization.totalAmount).toBe(expectedTotalAmount);
    }
  );
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
