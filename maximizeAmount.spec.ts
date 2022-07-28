import { prioritize, Transaction } from './maximizeAmount';
import fs from 'fs';

test('Test name', () => {
  const prioritized = prioritize(readFile());
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
