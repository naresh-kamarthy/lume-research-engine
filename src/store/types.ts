export interface TokenWallet {
    inputTokens: number;
    outputTokens: number;
    tavilyBasicCredits: number;
    tavilyAdvancedCredits: number;
    mockRequestsServed: number;
}

export type SystemHealth = 'healthy' | 'healing' | 'error';
export type ActiveProvider = 'tavily' | 'gemini-grounding' | 'mock';
export type DataSource = 'live' | 'mock';
export type Theme = 'emerald' | 'amber';
