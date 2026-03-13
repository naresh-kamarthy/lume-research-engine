export interface ResearchItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  tags: string[];
  relevanceScore?: number;
  reasoning?: string;
  isLowRelevance?: boolean;
  isGrounded?: boolean;
}

export const mockResearchLibrary: ResearchItem[] = [
  {
    id: '1',
    title: 'Quantum Entanglement in 2026',
    summary: 'Recent breakthroughs in room-temperature superconductors have enabled stable quantum entanglement over long distances, revolutionizing encrypted communication.',
    source: 'Tech Journal Alpha',
    tags: ['Quantum', 'Physics', '2026']
  },
  {
    id: '2',
    title: 'Agentic Workflows: A New Paradigm',
    summary: 'The shift from passive LLMs to proactive agentic systems has increased developer productivity by 400% in the last 18 months.',
    source: 'AI Research Weekly',
    tags: ['AI', 'Agents', 'Productivity']
  },
  {
    id: '3',
    title: 'The Rise of Self-Healing Architectures',
    summary: 'Modern distributed systems now incorporate autonomous circuit breakers that can predict and mitigate failures before they impact end-users.',
    source: 'Systems Engineering Today',
    tags: ['Architecture', 'Resilience', 'Cloud']
  },
  {
    id: '4',
    title: 'Edge Computing and Real-time Search',
    summary: 'Latency-sensitive applications are moving towards edge-based search indexing, providing sub-10ms response times for contextual queries.',
    source: 'Edge Insider',
    tags: ['Edge', 'Search', 'Latency']
  }
];
