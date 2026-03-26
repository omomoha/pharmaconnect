import '@testing-library/jest-dom';

// Polyfills for Node.js environment (needed for Firebase Auth)
if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn();
}

if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body, options) {
      this.body = body;
      this.ok = options?.ok ?? true;
      this.status = options?.status ?? 200;
      this.statusText = options?.statusText ?? 'OK';
    }
    json() {
      return Promise.resolve(typeof this.body === 'string' ? JSON.parse(this.body) : this.body);
    }
    text() {
      return Promise.resolve(this.body);
    }
  };
}

if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder } = require('util');
  global.TextEncoder = TextEncoder;
}

if (typeof global.crypto === 'undefined') {
  global.crypto = {
    getRandomValues: (array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    },
  };
}
