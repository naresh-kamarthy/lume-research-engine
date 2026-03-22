import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server, generateContentMock } from './setup';
import { performResearch, isQuotaError, rerankAndEvaluate, extractKeywords } from '../services';
import { useWorkspaceStore } from '../store';
import { mockResearchLibrary } from '../mockResearchLibrary';
import { act } from '@testing-library/react';

describe('Resilience Protocol Branch Coverage', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        act(() => {
            useWorkspaceStore.getState().resetSession();
            useWorkspaceStore.setState({
                activeProvider: 'tavily',
                isHealing: false,
            });
        });
    });

    it('should hit Gemini Grounding fallback with variants', async () => {
        server.use(http.post('/api/research', () => HttpResponse.json({ error: '429' }, { status: 429 })));
        (generateContentMock as any).mockResolvedValue({
            text: null, 
            candidates: [{ 
                groundingMetadata: { 
                    groundingChunks: [
                        { web: null },
                        { web: { title: null, uri: null } }
                    ] 
                } 
            }]
        });

        const res = await performResearch(['test-ground-variants']);
        expect(useWorkspaceStore.getState().activeProvider).toBe('mock');
        expect(res).toBe(mockResearchLibrary);
    });

    it('should hit Gemini Grounding fallback and succeed', async () => {
        server.use(http.post('/api/research', () => HttpResponse.json({ error: '429' }, { status: 429 })));
        (generateContentMock as any).mockResolvedValue({
            text: 'Result',
            candidates: [{ groundingMetadata: { groundingChunks: [{ web: { title: 'S', uri: 'http://s.com' } }] } }]
        });

        const res = await performResearch(['test-success']);
        expect(res).toBeDefined();
    });

    it('should hit Gemini Grounding error path variants', async () => {
        server.use(http.post('/api/research', () => HttpResponse.json({ error: '429' }, { status: 429 })));
        (generateContentMock as any).mockRejectedValue(new Error('Grounding Error'));

        const res = await performResearch(['test-error']);
        expect(useWorkspaceStore.getState().activeProvider).toBe('mock');
    });

    it('should hit final mock fallback variants', async () => {
        server.use(http.post('/api/research', () => HttpResponse.json({ error: 'F' }, { status: 403 })));
        await performResearch(['test-403']);
        
        server.use(http.post('/api/research', () => HttpResponse.json({ error: 'configured' }, { status: 400 })));
        await performResearch(['test-config']);
    });

    describe('isQuotaError', () => {
        it('should cover all branches', () => {
            expect(isQuotaError({ status: 432 })).toBe(true);
            expect(isQuotaError({ status: 429 })).toBe(true);
            expect(isQuotaError({ response: { status: 429 } })).toBe(true);
            expect(isQuotaError({ message: 'Quota exceeded' })).toBe(true);
            expect(isQuotaError({ message: 'usage limit reached' })).toBe(true);
            expect(isQuotaError(null)).toBe(false);
            expect(isQuotaError({})).toBe(false);
            expect(isQuotaError({ message: null })).toBe(false);
        });
    });

    describe('rerankAndEvaluate coverage', () => {
        it('should handle malformed JSON from Gemini and hit CATCH', async () => {
             (generateContentMock as any).mockResolvedValue({ text: '{"bad": }' }); 
             const res = await rerankAndEvaluate([{ id: '1' }], ['kw'], false, Date.now());
             expect(res[0].relevanceScore).toBe(0.5);
        });

        it('should handle evaluation as an object WITH results and lowRelevance: true', async () => {
            (generateContentMock as any).mockResolvedValue({
                text: JSON.stringify({ 
                    results: [{ id: '1', relevanceScore: 0.95 }],
                    lowRelevance: true 
                })
            });
            const res = await rerankAndEvaluate([{ id: '1' }], ['kw'], true, Date.now());
            expect(res[0].relevanceScore).toBe(0.95);
            expect(res[0].isLowRelevance).toBe(true);
        });

        it('should handle evaluation results missing and default lowRelevance', async () => {
             (generateContentMock as any).mockResolvedValue({
                text: JSON.stringify({ somethingElse: [] })
            });
            const res = await rerankAndEvaluate([{ id: '1' }], ['kw'], false, Date.now());
            expect(res[0].relevanceScore).toBe(0.5);
            expect(res[0].isLowRelevance).toBe(false);
        });
    });

    describe('Keyword Extraction variants', () => {
        it('should cover response.text nullish branch and API key fallback', async () => {
            vi.stubEnv('VITE_GEMINI_API_KEY', '');
            vi.resetModules();
            const { extractKeywords: freshExtract } = await import('../services');
            
            (generateContentMock as any).mockResolvedValue({ text: null });
            await freshExtract('R');
            
            vi.unstubAllEnvs();
        });

        it('should cover splitting to empty branch', async () => {
            (generateContentMock as any).mockResolvedValue({ text: ' , ' });
            await extractKeywords('R');
        });

        it('should cover extractKeywords catch status check', async () => {
             (generateContentMock as any).mockImplementationOnce(() => { throw { status: 429 }; });
             await extractKeywords('a');
             (generateContentMock as any).mockImplementationOnce(() => { throw { status: 500 }; });
             await extractKeywords('a');
             (generateContentMock as any).mockImplementationOnce(() => { throw null; });
             await extractKeywords('a');
             (generateContentMock as any).mockImplementationOnce(() => { throw { status: 400, message: null }; });
             await extractKeywords('a');
        });

        it('should cover local fallback with no patterns', async () => {
            const res = await extractKeywords('xyz zyx abc'); 
            expect(res).toEqual(['AI', 'RESEARCH', 'LUME']);
        });
    });
});
