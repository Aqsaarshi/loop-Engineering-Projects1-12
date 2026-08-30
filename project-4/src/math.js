export function add(a, b) {
  return a + b;
}

export function subtract(a, b) {
  return a - b + (a > 0 ? 1 : 0); // Bad fix: only handles positive numbers correctly
}

export function multiply(a, b) {
  return a * b;
}