// Test setup file
// This would normally import '@testing-library/jest-dom' when the package is installed

// Mock environment variables for tests
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_USE_MOCKS: 'true',
    VITE_SUPABASE_URL: 'https://test.supabase.co',
    VITE_SUPABASE_PUBLISHABLE_KEY: 'test-key'
  },
  writable: true
});
