import { GoogleGenAI } from "@google/genai";
import { useWorkspaceStore } from "./store/index";
import { mockResearchLibrary, ResearchItem } from "./mockResearchLibrary";

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || "AI_STUDIO_FALLBACK"
});

export async function extractKeywords(text: string): Promise<string[]> {
  const store = useWorkspaceStore.getState();
  const { isHealing } = store;
  const startTime = Date.now();

  // Guard: If we are already in healing mode, don't hammer the API
  if (isHealing) {
    return localKeywordFallback(text);
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-flash-lite-latest",
      contents: `Extract exactly 3 highly relevant technical keywords from the following text for a research search. Return ONLY the keywords separated by commas: "${text}"`,
    });

    store.addTokens(100, 20);
    store.setThroughput(Date.now() - startTime);

    let keywords: string[] = [];
    if (response.text) {
      keywords = response.text.split(',').map(k => k.trim()).filter(k => k.length > 0);
    }
    
    if (keywords.length > 0) {
      return keywords.slice(0, 3);
    }
    return localKeywordFallback(text);
  } catch (error: any) {
    // Trigger global healing protocol on rate limit or server error
    const errStatus = error?.status;
    const isRateLimit = errStatus === 429;
    const isServerError = errStatus === 500;
    
    if (isRateLimit || isServerError) {
      store.setApiError(errStatus);
    }
    return localKeywordFallback(text);
  }
}

function localKeywordFallback(text: string): string[] {
  // Tertiary Fallback: Basic regex extraction for common technical patterns
  const patterns = [
    /\b(AI|ML|Quantum|Edge|Cloud|Blockchain|Web3|Security)\b/gi,
    /\b(React|Nextjs|Node|Python|Typescript|Rust|Go)\b/gi
  ];
  const found = new Set<string>();
  patterns.forEach(p => {
    const matches = text.match(p);
    if (matches) matches.forEach(m => found.add(m.toUpperCase()));
  });

  const results = Array.from(found).slice(0, 3);
  return results.length > 0 ? results : ["AI", "RESEARCH", "LUME"];
}

export async function performResearch(keywords: string[]): Promise<ResearchItem[]> {
  const store = useWorkspaceStore.getState();
  const { isDeepDive, isHealing } = store;
  const startTime = Date.now();

  // DEBUG: Simulate 429 error to verify Resilience Protocol
  // throw { status: 429, message: "Simulated Rate Limit Error" };

  if (isHealing) {
    store.incrementMockRequests();
    return mockResearchLibrary;
  }

  try {
    // 1. Primary: Tavily Search
    const response = await fetch("/api/research", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords, isDeepDive }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw { status: response.status, message: errorData.error };
    }

    const rawResults = await response.json();
    store.setActiveProvider('tavily');
    store.setLastError(null);
    return await rerankAndEvaluate(rawResults, keywords, isDeepDive, startTime);

  } catch (error: any) {
    const status = error?.status || error?.response?.status;
    const message = error?.message || "";
    const isQuota = isQuotaError(error);

    store.setLastError(message);

    // 2. Secondary Fallback: Gemini Search Grounding (if Tavily fails or quota exceeded)
    if (isQuota || status === 429 || status === 500) {
      console.warn(`[Resilience] Tavily failed (Status: ${status}), attempting Gemini Grounding fallback...`);
      try {
        const groundingResponse = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Perform a technical research search for these keywords: ${keywords.join(', ')}. Provide a list of recent developments, technical specifications, and industry trends.`,
          config: {
            tools: [{ googleSearch: {} }]
          }
        });

        // Extract grounding chunks as sources
        const metadata = groundingResponse.candidates?.[0]?.groundingMetadata;
        const chunks = metadata?.groundingChunks || [];

        console.log(`[Resilience] Gemini Grounding returned ${chunks.length} potential sources.`);

        const groundingResults = chunks.map((chunk: any, i: number) => {
          const title = chunk.web?.title || `Research Insight ${i + 1}`;
          const url = chunk.web?.uri || "#";
          return {
            id: `gemini-grounding-${i}-${Date.now()}`,
            title: title,
            summary: groundingResponse.text?.substring(0, 500) || "Detailed technical analysis based on live search grounding.",
            source: url !== "#" ? new URL(url).hostname : "Google Search",
            url: url,
            tags: keywords,
            relevanceScore: 0.95,
            isGrounded: true,
            reasoning: "Verified via Google Search Grounding"
          };
        }).filter((r: any) => r.url !== "#");

        if (groundingResults.length > 0) {
          console.log("[Resilience] Fallback successful. Serving live grounding data.");
          store.addTokens(8000, 4000);
          store.setThroughput(Date.now() - startTime);
          store.setHealing(false); // We found live data, so we're not in "healing" (mock) mode
          store.setActiveProvider('gemini-grounding');
          return groundingResults;
        }
        console.warn("[Resilience] Gemini Grounding returned no valid web sources.");
      } catch (groundingError) {
        console.error("[Resilience] Gemini Grounding fallback failed:", groundingError);
      }
    }

    // 3. Tertiary Fallback: Mock Data
    if (status === 401 || status === 403 || isQuotaError(error) || status === 429 || status === 500 || message.includes('configured')) {
      store.setApiError(status || 500);
      store.setActiveProvider('mock');
    }
    store.incrementMockRequests();
    return mockResearchLibrary;
  }
}

export async function rerankAndEvaluate(rawResults: any[], keywords: string[], isDeepDive: boolean, startTime: number): Promise<ResearchItem[]> {
  const store = useWorkspaceStore.getState();

  // 1. Reranker & Self-RAG Evaluation Step
  const rerankResponse = await ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: `Evaluate and rerank these research results for relevance to the keywords: ${keywords.join(', ')}. 
    Return a JSON array of objects with { id, relevanceScore (0-1), reasoning, synthesisSummary, isGrounded (boolean) }.
    Results: ${JSON.stringify(rawResults)}`,
    config: { responseMimeType: "application/json" }
  });

  let evaluation;
  try {
    evaluation = JSON.parse(rerankResponse.text || "[]");
  } catch (e) {
    console.error("[Reranker] JSON Error", e);
    evaluation = [];
  }
  const evalItems = Array.isArray(evaluation) ? evaluation : (evaluation.results || []);
  const isOverallLowRelevance = evaluation.lowRelevance || false;

  // 2. Synthesis & Citation Mapping
  const synthesizedResults = rawResults.map((item: any) => {
    const evalItem = evalItems.find((e: any) => e.id === item.id);
    return {
      ...item,
      relevanceScore: evalItem?.relevanceScore || 0.5,
      reasoning: evalItem?.reasoning || "Synthesized context",
      summary: evalItem?.synthesisSummary || item.summary,
      isGrounded: evalItem?.isGrounded || false,
      isLowRelevance: isOverallLowRelevance
    };
  }).sort((a: any, b: any) => b.relevanceScore - a.relevanceScore);

  store.addTavilyCredits(isDeepDive ? 'advanced' : 'basic');
  store.addTokens(isDeepDive ? 6000 : 3000, isDeepDive ? 3000 : 1500);
  store.setThroughput(Date.now() - startTime);
  store.setHealing(false);

  return synthesizedResults;
}

export function isQuotaError(error: any): boolean {
  const status = error?.status || error?.response?.status;
  const message = error?.message || "";

  return (
    status === 432 ||
    status === 429 ||
    message.toLowerCase().includes('usage limit') ||
    message.toLowerCase().includes('quota')
  );
}

