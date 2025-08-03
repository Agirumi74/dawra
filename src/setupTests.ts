import '@testing-library/jest-dom';

// Mock global fetch for tests
global.fetch = jest.fn();

// Reset mocks after each test
afterEach(() => {
  jest.resetAllMocks();
});