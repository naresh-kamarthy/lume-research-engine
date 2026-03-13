import { describe, it, expect, vi, beforeEach } from 'vitest';
import { performResearch } from '../services';
import { useWorkspaceStore } from '../store';
import { generateContentMock } from './setup';
import { http, HttpResponse } from 'msw';
import { server } from './setup';

describe('Reranker Integration', () => {
  beforeEach(() => {
    useWorkspaceStore.getState().handleNewSession();
    vi.clearAllMocks();
  });

  it('should correctly identify "Grounded" facts vs "Low Relevance" noise', async () => {
    // 1. Mock Tavily API response
    const mockTavilyResults = [
      { id: 'tavily-1', title: 'Quantum Computing in Healthcare', summary: 'Quantum computing is revolutionizing healthcare...', url: 'https://example.com/1' },
      { id: 'tavily-2', title: 'Noise Result', summary: 'This is unrelated noise...', url: 'https://example.com/2' }
    ];

    server.use(
      http.post('/api/research', () => {
        return HttpResponse.json(mockTavilyResults);
      })
    );

    // 2. Mock LLM Reranker response
    const mockRerankResponse = [
      { id: 'tavily-1', relevanceScore: 0.95, reasoning: 'Highly relevant', synthesisSummary: 'Synthesized quantum healthcare summary', isGrounded: true },
      { id: 'tavily-2', relevanceScore: 0.1, reasoning: 'Unrelated noise', synthesisSummary: 'Noise', isGrounded: false }
    ];

    (generateContentMock as any).mockResolvedValue({
      text: JSON.stringify(mockRerankResponse),
      candidates: [{ groundingMetadata: { groundingChunks: [] } }]
    });

    // 3. Perform research
    const keywords = ['Quantum', 'Healthcare'];
    const results = await performResearch(keywords);

    // 4. Assert: The logic correctly identifies "Grounded" facts vs "Low Relevance" noise
    const groundedItem = results.find(r => r.id === 'tavily-1');
    const noiseItem = results.find(r => r.id === 'tavily-2');

    expect(groundedItem?.isGrounded).toBe(true);
    expect(groundedItem?.relevanceScore).toBe(0.95);
    expect(groundedItem?.summary).toBe('Synthesized quantum healthcare summary');

    expect(noiseItem?.isGrounded).toBe(false);
    expect(noiseItem?.relevanceScore).toBe(0.1);
  });
});
