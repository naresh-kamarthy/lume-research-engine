import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll, vi } from 'vitest';
import { setupServer } from 'msw/node';

// Mocking the GoogleGenAI SDK
export const generateContentMock = vi.fn().mockResolvedValue({
  text: 'AI, Future, Tech',
  candidates: [{ groundingMetadata: { groundingChunks: [] } }]
});

vi.mock('@google/genai', () => {
  class GoogleGenAI {
    models = {
      generateContent: generateContentMock,
    };
    constructor() {}
  }
  
  return {
    GoogleGenAI,
    generateContentMock,
  };
});

// Mocking window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mocking ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

export const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
  localStorage.clear();
});
afterAll(() => server.close());
