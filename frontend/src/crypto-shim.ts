// Universal crypto shim for browser and bundlers
export function randomInt(min: number, max?: number): number {
  if (max === undefined) {
    max = min;
    min = 0;
  }
  const range = max - min;
  if (range <= 0) return min;
  const arr = new Uint32Array(1);
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues(arr);
    return min + (arr[0] % range);
  }
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(arr);
    return min + (arr[0] % range);
  }
  return min + Math.floor(Math.random() * range);
}

export function getRandomValues<T extends ArrayBufferView | null>(array: T): T {
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.getRandomValues) {
    return globalThis.crypto.getRandomValues(array);
  }
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    return window.crypto.getRandomValues(array);
  }
  return array;
}

const cryptoShim = {
  randomInt,
  getRandomValues,
  default: {
    randomInt,
    getRandomValues,
  },
};

export default cryptoShim;
