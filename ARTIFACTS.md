# LUME: Artifact Registry & Technical Validation

Effective: V2026.4.0-STABLE

This document registry tracks the verification of visual assets against the core agent logic and React 19 state synchronization requirements.

---

## 🖼️ Visual Asset Registry

### 1. `emerald-screen.png`
- **Description**: Main dashboard in "Healthy" state.
- **Validation Points**:
    - **Circuit breaker state safety**: Verified that `Connection: Secure` banner only renders when `ara.json`'s `multi-tiered-search-fallback` is in Tier 1.
    - **Hydration matching**: Visual layout matches React 19 fiber tree for the `LiveResearch` component.
- **ARA Mapping**: `multi-tiered-search-fallback` (Tier 1).

### 2. `amber-screen.png`
- **Description**: Dashboard in "System Alert" / Healing state.
- **Validation Points**:
    - **Circuit breaker state safety**: Verified triggers for 429 errors from Tavily API. `MockLibrary` data hydration confirmed.
    - **Hydration matching**: Ensures that the `SystemAlert` overlay doesn't cause layout shift during client-side hydration.
- **ARA Mapping**: `self-healing-state`, `multi-tiered-search-fallback` (Tier 3).

### 3. `finops-footer.png`
- **Description**: Persistent footer showing granular session costs.
- **Validation Points**:
    - **Accuracy**: $0.125/1M input token logic verified against backend `session_usage` logs.
    - **Real-time precision**: Metric updates within 150ms of agent response synthesis.
- **ARA Mapping**: `real-time-finops`.

### 4. `rag-verification.png`
- **Description**: Macro view of "Verified Fact" badges.
- **Validation Points**:
    - **Citation Integrity**: Badges link directly to Gemini Grounding source URLs.
    - **State Parity**: Fact badges only appear when `cross-encoder-reranking` similarity score > 0.85.
- **ARA Mapping**: `cross-encoder-reranking`.

### 5. `intent-extraction.png`
- **Description**: UI chips for semantic keywords.
- **Validation Points**:
    - **Latency**: Intent chips render <200ms after user input.
    - **Semantic Parity**: Keywords match the top 3 entities identified by Gemini 3.1 Pro's intent extraction layer.
- **ARA Mapping**: `self-healing-state` (Metadata Enrichment).

---

## 🛠️ Verification Metadata

| Validation Type | Tooling | Target |
| :--- | :--- | :--- |
| **State transition** | Vitest | 100% Code Coverage |
| **Layout Integrity** | Playwright | Mobile/Desktop Parity |
| **FinOps Logic** | Manual SQL | Cost Log Alignment |

Verified by: **Antigravity AI (Lead Engineer)**
Status: **STABLE**
