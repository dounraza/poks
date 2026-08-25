// Polyfill global process & assert for browser compatibility (poker-ts)
if (typeof (window as any).process === "undefined") {
  (window as any).process = { env: {} };
}
if (typeof (globalThis as any).process === "undefined") {
  (globalThis as any).process = { env: {} };
}

// Polyfill global crypto.randomInt for browser (poker-ts deck shuffle)
const randomIntFn = function (min: number, max?: number) {
  if (max === undefined) {
    max = min;
    min = 0;
  }
  const range = max - min;
  if (range <= 0) return min;
  const arr = new Uint32Array(1);
  ((globalThis as any).crypto || (window as any).crypto).getRandomValues(arr);
  return min + (arr[0] % range);
};

if (typeof (globalThis as any).crypto !== "undefined") {
  try {
    Object.defineProperty((globalThis as any).crypto, "randomInt", {
      value: randomIntFn,
      writable: true,
      configurable: true,
    });
  } catch (e) {
    (globalThis as any).crypto.randomInt = randomIntFn;
  }
}
if (typeof (window as any).crypto !== "undefined") {
  try {
    Object.defineProperty((window as any).crypto, "randomInt", {
      value: randomIntFn,
      writable: true,
      configurable: true,
    });
  } catch (e) {
    (window as any).crypto.randomInt = randomIntFn;
  }
}
(globalThis as any).randomInt = randomIntFn;
(window as any).randomInt = randomIntFn;

const assertShim = function (val: any, msg?: string) {
  if (!val) throw new Error(msg || "Assertion failed");
};
(assertShim as any).default = assertShim;
(assertShim as any).ok = assertShim;
(window as any).assert = assertShim;
(globalThis as any).assert = assertShim;

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
