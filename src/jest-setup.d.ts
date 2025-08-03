import '@testing-library/jest-dom';

declare global {
  var fetch: jest.MockedFunction<typeof fetch>;
  
  namespace NodeJS {
    interface Global {
      fetch: jest.MockedFunction<typeof fetch>;
    }
  }
}

export {};