/// <reference types="vite/client" />
/// <reference types="@testing-library/jest-dom" />

declare global {
  interface Window {
    Buffer: typeof import('buffer').Buffer;
  }
}
