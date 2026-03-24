# Yui AI — Next Steps & Integration Guide

Now that the backend infrastructure and agent logic are verified, the next phase focuses on building the **Primary Visual Surface** (Next.js Application) and connecting it to the tri-agent brain.

## 1. Frontend Infrastructure Setup
*   **Initialize `package.json`**: Install core dependencies: `next`, `react`, `tailwind-css`, `framer-motion`, `lucide-react`, `zustand`, `cytoscape`, `supabase-js`.
*   **Theme Configuration**: Set up the "Command Center" aesthetic in `tailwind.config.js`:
    *   Primary Background: `#0D0D1A` (Deep Midnight)
    *   Primary Accent: `#E05A1A` (Yui Orange)
    *   Secondary Accents: `#22C55E` (Success), `#F59E0B` (Warning).

## 2. Real-Time Connectivity Layer
The frontend connects to the backend via two main paths:

### A. Supabase Realtime (The "Live Thought Stream")
*   **Mechanism**: The `AgentLog.tsx` component subscribes to the `agent_logs` table.
*   **Flow**: 
    1.  ARIA/LUMA/YUI performs an action (e.g., "Scanning alternative flights").
    2.  Backend calls `core.logger.log()`, which inserts a row into Supabase.
    3.  Supabase broadcasts the `INSERT` event to the `AgentLog.tsx` component.
    4.  The dashboard renders the new log line with a fade-in animation, creating a "Thinking AI" effect.

### B. REST API (The "Command Trigger")
*   **Mechanism**: The `lib/api.ts` client calls FastAPI endpoints.
*   **Flow**:
    1.  User clicks "Simulate Severe Delay" on the `/demo` page.
    2.  Frontend sends a POST request to `/api/demo/severe_delay`.
    3.  FastAPI triggers `agents.aria.process_disruption()`, which starts the cascade resolution.

## 3. Core Component Implementation
*   **`FlightRiskMeter.tsx`**: A real-time gauge connecting to the trip's risk score in the Trip Context Object.
*   **`KnowledgeGraph.tsx`**: Uses `cytoscape.js` to render the `itinerary` JSON as a nodes-and-edges graph, highlighting cascade failures in red.
*   **`TripTimeline.tsx`**: A vertically scrollable list of flights, meetings, and hotel events with real-time status badges.
*   **`LumaCard.tsx`**: A slide-in card that appears when a new entry is added to `last_luma_suggestion_ts` in Supabase.

## 4. Telegram Mini App (TMA) Integration
*   The `/tma` route in Next.js will use the `telegram-web-app.js` SDK.
*   **Functionality**:
    *   Detects the `user_id` from `Telegram.WebApp.initDataUnsafe`.
    *   Fetches the user's active trip from the FastAPI backend.
    *   Matches the Telegram theme colors (dark/light) automatically.
    *   Provides a "Rebook" button that calls `tg.sendData()` to send a JSON back to the bot.

## 5. Development Sequence
1.  **UI Layout**: Define the global layout with the dark high-stakes aesthetic.
2.  **Dashboard Shell**: Create the `/dashboard` route and populate with empty component placeholders.
3.  **Real-Time Log**: Implement the `AgentLog` component first, as it's the most impactful demo feature.
4.  **Demo Controller**: Build the `/demo` page to allow manual triggering of backend agent logic.
5.  **TMA View**: Optimize the `/tma` route for mobile mobile-webview usage.

---
**Status**: Backend Ready | Frontend Scaffolding Ready | **Next Action**: `npm init` and UI Component Buildout.
