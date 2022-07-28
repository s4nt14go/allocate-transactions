import { prioritize } from './maximizeAmount';

test('Test name', () => {
  const prioritized = prioritize([
    {
      id: 'dde3165e-a7e9-4dac-984b-4aa5f32a45e2',
      amount: 6.44,
      bank_country_code: 'tr',
    },
  ]);

  expect(prioritized).toStrictEqual([]);
});
