import '@testing-library/jest-dom/vitest';

// Mock the Wails runtime bridge for tests
Object.defineProperty(window, 'go', {
  value: {
    main: {
      App: {
        Greet: (name: string) =>
          Promise.resolve(`Hello ${name}! mqtts frontend is running in browser preview mode.`),
      },
    },
  },
});
