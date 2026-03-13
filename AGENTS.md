# Agent Instructions: LUME Workspace

## Context
This is a React 19 / Vite research agent utilizing Gemini 3.1 Pro for orchestration and Gemini 3 Flash for high-throughput synthesis.

## State Management Rules
- **Healing Awareness**: Before modifying any data-fetching logic, check the `isHealing` status in the `useWorkspaceStore`. 
- **Emerald/Amber Transition**: Do not bypass the `performResearch` service wrapper; it contains the multi-tiered fallback logic (Tavily -> Gemini Grounding -> Mock).
- **Store Mutations**: Use the provided `store.ts` actions for all state updates to ensure FinOps tracking remains accurate.

## Styling & Interaction
- **Tailwind v4**: All styling must use Tailwind v4 utility classes.
- **Motion**: Use `motion/react` (Framer Motion) for all layout transitions and entrance animations.
- **Bento Grid**: Maintain the 12-column bento grid layout for information density.

## API Integration
- **Tavily**: Primary search provider (Server-side proxy).
- **Gemini Search Grounding**: Secondary live fallback (Client-side).
- **Mock Library**: Tertiary resilience fallback (Local).
