import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from './setup';
import { performResearch, isQuotaError, rerankAndEvaluate } from '../services';
import { useWorkspaceStore } from '../store';
import { mockResearchLibrary } from '../mockResearchLibrary';
import { act } from '@testing-library/react';

describe('Resilience Protocol Branch Coverage', () => {
  beforeEach(() => {
    act(() => {
      useWorkspaceStore.getState().resetSession();
      useWorkspaceStore.setState({ activeProvider: 'tavily' });
    });
  });

  it('should hit Gemini Grounding fallback and succeed', async () => {
    const { generateContentMock } = await import('./setup');
    server.use(http.post('/api/research', () => HttpResponse.json({ error: '429' }, { status: 429 })));

    (generateContentMock as any).mockResolvedValue({
      text: 'Result',
      candidates: [{ groundingMetadata: { groundingChunks: [{ web: { title: 'S', uri: 'http://s.com' } }] } }]
    });

    const res = await performResearch(['test']);
    expect(useWorkspaceStore.getState().activeProvider).toBe('gemini-grounding');
    expect(res).toHaveLength(1);
  });

  it('should pivot to mock on 500 status', async () => {
    const { generateContentMock } = await import('./setup');
    server.use(http.post('/api/research', () => HttpResponse.json({ error: '500' }, { status: 500 })));
    (generateContentMock as any).mockResolvedValue({ text: '', candidates: [] });

    const res = await performResearch(['test']);
    expect(useWorkspaceStore.getState().activeProvider).toBe('mock');
    expect(res).toEqual(mockResearchLibrary);
  });

  it('should pivot to mock on 401 status', async () => {
    server.use(http.post('/api/research', () => HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })));
    await performResearch(['test']);
    expect(useWorkspaceStore.getState().activeProvider).toBe('mock');
  });

  it('should pivot to mock on 403 status', async () => {
    server.use(http.post('/api/research', () => HttpResponse.json({ error: 'Forbidden' }, { status: 403 })));
    await performResearch(['test']);
    expect(useWorkspaceStore.getState().activeProvider).toBe('mock');
  });

  it('should pivot to mock on limit error string', async () => {
    server.use(http.post('/api/research', () => HttpResponse.json({ error: 'Tier usage limit reached' }, { status: 400 })));
    await performResearch(['test']);
    expect(useWorkspaceStore.getState().activeProvider).toBe('mock');
  });

  it('should pivot to mock on configuraton error string', async () => {
    server.use(http.post('/api/research', () => HttpResponse.json({ error: 'search not configured properly' }, { status: 400 })));
    await performResearch(['test']);
    expect(useWorkspaceStore.getState().activeProvider).toBe('mock');
  });

  it('should handle Gemini Grounding error branch', async () => {
    const { generateContentMock } = await import('./setup');
    server.use(http.post('/api/research', () => HttpResponse.json({ error: '429' }, { status: 429 })));
    (generateContentMock as any).mockRejectedValue(new Error('Gemini Break'));

    const res = await performResearch(['test']);
    expect(useWorkspaceStore.getState().activeProvider).toBe('mock');
  });

  it('should filter out results with # URL from Gemini Grounding', async () => {
    const { generateContentMock } = await import('./setup');
    server.use(http.post('/api/research', () => HttpResponse.json({ error: '429' }, { status: 429 })));

    (generateContentMock as any).mockResolvedValue({
      text: 'Result',
      candidates: [{
        groundingMetadata: {
          groundingChunks: [
            { web: { title: 'Valid', uri: 'http://valid.com' } },
            { web: { title: 'Invalid', uri: '#' } }
          ]
        }
      }]
    });

    const res = await performResearch(['test']);
    expect(res).toHaveLength(1);
    expect(res[0].title).toBe('Valid');
  });

  describe('Direct Utility Coverage', () => {
    it('isQuotaError should hit all logical branches', () => {
      expect(isQuotaError({ status: 432 })).toBe(true);
      expect(isQuotaError({ status: 429 })).toBe(true);
      expect(isQuotaError({ message: 'Quota exceeded' })).toBe(true);
      expect(isQuotaError({ message: 'reached usage limit' })).toBe(true);
      expect(isQuotaError({ status: 400, message: 'Bad request' })).toBe(false);
      expect(isQuotaError({})).toBe(false);
    });

    it('rerankAndEvaluate should handle malformed JSON', async () => {
      const { generateContentMock } = await import('./setup');

      (generateContentMock as any).mockResolvedValue({
        text: 'Invalid JSON'
      });

      const res = await rerankAndEvaluate([], ['kw'], false, Date.now());
      expect(res).toEqual([]);
    });

    it('rerankAndEvaluate should handle results property in JSON', async () => {
      const { generateContentMock } = await import('./setup');

      (generateContentMock as any).mockResolvedValue({
        text: JSON.stringify({ results: [{ id: '1', relevanceScore: 0.9 }], lowRelevance: true })
      });

      const res = await rerankAndEvaluate([{ id: '1' }], ['kw'], true, Date.now());
      expect(res[0].isLowRelevance).toBe(true);
      expect(res[0].relevanceScore).toBe(0.9);
    });
  });
});
