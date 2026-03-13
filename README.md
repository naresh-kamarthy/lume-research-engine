# LUME: Self-Healing Research Engine `V2026.4.0-STABLE`

[![React 19](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Gemini 3.1 Pro](https://img.shields.io/badge/Gemini-3.1%20Pro-orange.svg)](https://ai.google.dev/)
[![Tailwind 4](https://img.shields.io/badge/Tailwind-4-38b2ac.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TS Strict](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vitest Coverage](https://img.shields.io/badge/Coverage-100%25-449124?style=for-the-badge&logo=vitest)](https://vitest.dev/)

> **"The Zero-Downtime Agentic Workspace."**  
> LUME is a production-grade research engine engineered for absolute resilience, utilizing multi-tiered fallback orchestration to ensure 100% session continuity.

---

## 🏛️ System Architecture: Multi-tiered Search Fallback

LUME implements a "Circuit Breaker" pattern for research reliability. When primary search APIs (Tavily) or high-fidelity grounding services hit quota limits, the system auto-pivots to a synthetic Mock Library to maintain session continuity.

```mermaid
graph TD
    A[User Query] --> B{Agent Router}
    B -- Tier 1: Primary --> C[Tavily Search API]
    B -- Tier 2: Fallback --> D[Gemini Search Grounding]
    B -- Tier 3: Critical --> E[Mock Research Library]
    C --> F[Gemini 3.1 Pro: Synthesis]
    D --> F
    E --> F
    F --> G[React 19 Frontend]
```

---

## 🛡️ The Resilience Protocol

LUME utilizes the custom `useSelfHealer.ts` hook to manage the transition between system states. This ensures a flicker-free, zero-refresh experience.

| State | Visual Indicator | Logic |
| :--- | :--- | :--- |
| **Emerald (Live)** | ![Emerald State](src/assets/emerald-screen.png) | **Healthy:** Secure connection established (Tavily → Gemini flow). |
| **Amber (Healing)** | ![Amber State](src/assets/amber-screen.png) | **Healing:** 429/500 error detected. Circuit breaker active. Pivot to `MockLibrary`. |

---

## 📊 FinOps Observability

A persistent, real-time metrics engine tracks the economic impact of every research session.

![FinOps footer tracking Session Cost and Tokens Used](src/assets/finops-footer.png)

- **Session Cost**: Calculated at **$0.125/1M input** and $0.75/1M output tokens (March 2026 pricing).
- **Resilience Saved**: The "Saved" metric calculates the dollar value of API costs avoided by utilizing the cached Mock Library during service outages.

---

## 🔬 Grounded RAG Engine

LUME provides high-fidelity research insights through its Grounded RAG pipeline, featuring real-time citation mapping.

- **Verified Fact Badges**: Macro view of grounded claims with direct citation links.
- **Accuracy**: Powered by Gemini Search Grounding to minimize hallucinations.

![Verified Fact badges](src/assets/rag-verification.png)

---

## 🧠 Agentic Logic & Orchestration

LUME follows strict agentic design patterns defined in [`AGENTS.md`](AGENTS.md):
- **Self-Healing State**: Intelligent monitoring of `isHealing` status via `useWorkspaceStore`.
- **Context Control**: Sequential handoffs between intent extraction and synthesis layers.
- **Logic Parity**: 1:1 mapping between `ara.json` capabilities and React 19 UI states.

---

## 🗺️ Visual Proof Gallery

LUME's UI is designed for information density and state clarity:
- **Intent Extraction**: Semantic keyword chips showing low-latency analysis.
- **Bento Grid**: 12-column layout for diverse research summaries.

![Intent Extraction chips](src/assets/intent-extraction.png)

---

## 🛠️ Technical Stack (V2026.4.0)

- **UI Framework**: `react-19-vite` (Stable)
- **Styling Engine**: Tailwind v4 (CSS Variables first)
- **Agent Intelligence**: `gemini-3.1-pro` runtime
- **State Management**: Zustand (Persistent Context)
- **Animation**: `motion/react`

---

## � Installation & Usage

### Prerequisites
- Node.js (v20+)
- Gemini API Key

### Setup
```bash
# Clone the repository
git clone https://github.com/user/lume-research-engine.git

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Launch development environment
npm run dev
```

---

## 🧪 Verification Protocol

LUME is verified via a comprehensive Vitest suite targeting high-concurrency state transitions.

| Test Category | Focus | Target |
| :--- | :--- | :--- |
| **Circuit Breaker** | State transition safety | 100% Coverage |
| **Hydration** | Zero-flicker state matching | React 19 Fiber |
| **FinOps Logic** | Cost accuracy | Log Alignment |

Run tests: `npm test`

---

## ⚖️ License & Compliance

- **License**: MIT
- **Pricing Disclosure**: All cost metrics are based on **March 2026** Gemini API public pricing.
- **Privacy**: No user data is cached outside the local `MockLibrary` during Amber states.
