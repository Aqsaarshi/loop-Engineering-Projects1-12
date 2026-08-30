import { test } from 'node:test';
import { add, subtract, multiply } from '../src/math.js';

test('add should return a + b', () => {
  const result = add(1, 2);
  if (result !== 3) throw new Error(`add expected 3, got ${result}`);
});

test('subtract should return a - b', () => {
  const result = subtract(5, 3);
  if (result !== 2) throw new Error(`subtract expected 2, got ${result}`);
});

test('multiply should return a * b', () => {
  const result = multiply(2, 3);
  if (result !== 6) throw new Error(`multiply expected 6, got ${result}`);
});