// ARIA Agent — Two-phase: REASON → EXECUTE
// Phase 1: ARIA reads the prompt + tool registry, produces a plan with reasoning
// Phase 2: ARIA executes each planned step in order, emitting live events

async function callAI(prompt: string, jsonMode = false): Promise<string> {
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, jsonMode }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `AI proxy error ${res.status}`);
  }
  const data = await res.json();
  return data.text || '';
}

// Tool execution functions — each calls callAI with a specific prompt
const TOOL_EXECUTORS: Record<string, (params: any) => Promise<any>> = {
  CALENDAR_SCAN: async ({ query, origin, destination, calendarEvents }: any) => {
    const events = calendarEvents?.slice(0, 5).map((e: any) => `${e.summary} at ${e.start?.dateTime || e.start?.date}`).join(', ') || '';
    const text = await callAI(`Extract key travel context from: "${query}". From ${origin} to ${destination}.${events ? ` Calendar: ${events}` : ''} Summarize in 1 line.`);
    return { events: [text] };
  },

  FLIGHT_SEARCH: async ({ origin, destination }: any) => {
    const text = await callAI(`Find a realistic flight from ${origin || 'Origin'} to ${destination || 'Destination'}. Give airline, flight number, time, and cost in ONE line. Format: "Airline XY-123 | HH:MM | ₹X,XXX | Status"`);
    const alternatives = [
      { mode: 'Economy Flight', duration: '2h 30m', cost: Math.floor(Math.random() * 3000 + 2000) },
      { mode: 'Business Class', duration: '2h 30m', cost: Math.floor(Math.random() * 5000 + 8000) },
      { mode: 'Train (Rajdhani)', duration: '18h', cost: Math.floor(Math.random() * 1000 + 800) },
    ];
    return { flights: [text.split('\n')[0]], alternatives };
  },

  DISRUPTION_SIMULATION: async ({ origin, destination }: any) => {
    const text = await callAI(`Assess disruption risk for travel from ${origin || 'Origin'} to ${destination || 'Destination'}. Give a 1-line risk summary and one alternative transport.`);
    return { risk: text.split('\n')[0], alternatives: ['Train', 'Drive'] };
  },

  WEATHER_CHECK: async ({ destination }: any) => {
    const text = await callAI(`Current/seasonal weather in ${destination || 'the destination'}? Reply with just: "XX°C, Condition" (e.g. "29°C, Partly Cloudy").`);
    const parts = text.split(',');
    return { weather: { temp: parts[0]?.trim() || '25°C', condition: parts[1]?.trim() || 'Clear' } };
  },

  ROUTE_PLAN: async ({ destination }: any) => {
    const text = await callAI(`Estimate airport to city center distance and time for ${destination || 'destination'}. Reply in ONE line: "XX km · XX min via [route name]"`);
    const alternatives = [
      { mode: 'Taxi/Cab', duration: '35 min', cost: 450 },
      { mode: 'Metro/Rail', duration: '55 min', cost: 60 },
      { mode: 'Bus', duration: '75 min', cost: 25 },
    ];
    return { routes: [text.split('\n')[0]], alternatives };
  },

  PLACE_SUGGEST: async ({ destination }: any) => {
    const text = await callAI(`Top tourist attraction in ${destination || 'destination'}? Name, rating, 1-line description.`);
    return { places: [text.split('\n')[0]] };
  },

  CRITICALITY: async ({ tripPurpose, calendarEvents }: any) => {
    const score = calendarEvents?.length > 0 ? '9/10 CRITICAL' : '6/10 MODERATE';
    return { scores: [`${tripPurpose || 'Trip'} — ${score}`] };
  },
};

export async function generatePlan(
  params: {
    query: string, origin: string, destination: string,
    stops: string[], days: number, tripPurpose?: string,
    tags: string[], budget: string, calendarEvents?: any[]
  },
  onEvent: (event: any) => void
) {
  const { query, origin, destination, stops, days, tripPurpose, tags, budget, calendarEvents } = params;

  try {
    // ─── PHASE 1: REASON ────────────────────────────────────────────
    onEvent({ type: 'REASONING', status: 'thinking', data: { text: 'ARIA is analyzing your request...' } });

    let plan: any = null;
    try {
      const planRes = await fetch('/api/ai/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, origin, destination, days, budget, tags, stops }),
      });
      if (planRes.ok) plan = await planRes.json();
    } catch (e) {
      console.warn('Plan generation failed, using default steps');
    }

    // Fallback default steps if reasoning fails
    const defaultSteps = [
      { tool: 'CALENDAR_SCAN', reason: 'Analyze trip context and purpose', priority: 1 },
      { tool: 'FLIGHT_SEARCH', reason: 'Find available flights for the route', priority: 2 },
      { tool: 'DISRUPTION_SIMULATION', reason: 'Check for disruption risks', priority: 3 },
      { tool: 'WEATHER_CHECK', reason: 'Get destination weather forecast', priority: 4 },
      { tool: 'ROUTE_PLAN', reason: 'Calculate local transportation routes', priority: 5 },
      { tool: 'CRITICALITY', reason: 'Score trip importance', priority: 6 },
      ...(tags?.includes('Leisure') || tripPurpose?.toLowerCase().includes('leisure')
        ? [{ tool: 'PLACE_SUGGEST', reason: 'Suggest leisure places', priority: 7 }] : []),
    ];

    const steps = (plan?.steps && plan.steps.length > 0) ? plan.steps : defaultSteps;
    const reasoning = plan?.reasoning || `Planning a ${days}-day ${tripPurpose || 'trip'} from ${origin} to ${destination}. I will search for flights, check weather, optimize routes, and assess any disruption risks.`;

    onEvent({
      type: 'REASONING',
      status: 'done',
      data: {
        text: reasoning,
        steps: steps.map((s: any) => ({ tool: s.tool, reason: s.reason })),
        totalSteps: steps.length,
      }
    });

    // ─── PHASE 2: EXECUTE ─────────────────────────────────────────────
    const toolParams = { query, origin, destination, stops, days, tripPurpose, tags, budget, calendarEvents };
    const results: Record<string, any> = {};

    for (const step of steps.sort((a: any, b: any) => a.priority - b.priority)) {
      const toolId = step.tool;
      const executor = TOOL_EXECUTORS[toolId];
      if (!executor) continue;

      // Emit "active" state
      onEvent({ type: toolId, status: 'active', data: { text: step.reason, stepIndex: step.priority } });

      try {
        const result = await executor(toolParams);
        results[toolId] = result;
        onEvent({ type: toolId, status: 'done', data: { ...result, stepIndex: step.priority } });
      } catch (err: any) {
        onEvent({ type: toolId, status: 'error', data: { text: `Failed: ${err.message}`, stepIndex: step.priority } });
      }
    }

    // ─── PHASE 3: SYNTHESIZE GRAPH ─────────────────────────────────
    onEvent({ type: 'PLAN_COMPLETE', status: 'synthesizing', data: { text: 'Building your journey canvas...' } });

    const graphPrompt = `You are ARIA. Create a React Flow journey graph JSON for this trip.
Origin: ${origin || 'Chennai'} → Destination: ${destination || 'Delhi'}, ${days} days, ${budget} budget.
Stops: ${stops?.join(', ') || 'none'}. Purpose: ${tripPurpose || 'Business'}.
Flight info: ${results.FLIGHT_SEARCH?.flights?.[0] || 'TBD'}
Weather: ${results.WEATHER_CHECK?.weather?.temp}, ${results.WEATHER_CHECK?.weather?.condition}
Route: ${results.ROUTE_PLAN?.routes?.[0] || 'TBD'}

Return ONLY valid JSON:
{
  "nodes": [
    { "id": "n1", "type": "location", "subtype": "airport", "label": "Departure Airport", "data": { "city": "${origin}", "eta": "06:00 AM", "details": "Terminal 2", "weather": "" } },
    { "id": "n2", "type": "transport", "subtype": "flight", "label": "Flight", "data": { "carrier": "IndiGo", "departure": "07:00", "arrival": "09:30", "cost": 4200, "status": "ON TIME", "duration": "2h 30m", "alternatives": [{"mode":"Train","duration":"18h","cost":850},{"mode":"Bus","duration":"22h","cost":400}] } },
    { "id": "n3", "type": "location", "subtype": "airport", "label": "Arrival Airport", "data": { "city": "${destination}", "eta": "09:30 AM", "details": "Terminal 1" } }
  ],
  "edges": [
    { "id": "e1-2", "source": "n1", "target": "n2", "label": "Board", "type": "flight" },
    { "id": "e2-3", "source": "n2", "target": "n3", "label": "Arrive", "type": "flight" }
  ]
}
Create 5-8 nodes for a realistic journey with hotels, meetings, transport. Include alternatives array for all transport nodes.`;

    const graphRaw = await callAI(graphPrompt, true);
    const cleaned = graphRaw.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    const graphJson = JSON.parse(cleaned);

    onEvent({ type: 'PLAN_COMPLETE', status: 'done', data: { graph: graphJson } });
    return graphJson;

  } catch (error) {
    console.error('Agent error:', error);
    onEvent({ type: 'ERROR', status: 'failed', data: { message: 'Agent error: ' + (error as Error).message } });
    throw error;
  }
}

export async function updateNodeChat(
  params: { nodeId: string, userMessage: string, fullPlanContext: any },
  onEvent: (event: any) => void
) {
  const { nodeId, userMessage, fullPlanContext } = params;
  try {
    onEvent({ type: 'AGENT_THOUGHT', status: 'thinking', data: { text: 'Analyzing request for this leg...' } });
    const raw = await callAI(`You are ARIA modifying journey node ${nodeId}.
User request: "${userMessage}"
Context: ${JSON.stringify(fullPlanContext).slice(0, 1000)}
Return JSON: { "updatedNode": { "id": "${nodeId}", "type": "...", "subtype": "...", "label": "...", "data": { ... } } }`, true);
    const result = JSON.parse(raw.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim());
    onEvent({ type: 'NODE_UPDATED', status: 'done', data: { updatedNode: result.updatedNode } });
    return result.updatedNode;
  } catch (error) {
    onEvent({ type: 'ERROR', status: 'failed', data: { message: 'Failed to update node.' } });
    throw error;
  }
}
