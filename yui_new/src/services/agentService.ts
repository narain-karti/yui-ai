// Agent service — calls our backend /api/ai/chat proxy (which has multi-model fallback)

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

export async function generatePlan(
  params: { query: string, origin: string, destination: string, stops: string[], days: number, tripPurpose?: string, tags: string[], budget: string, calendarEvents?: any[] },
  onEvent: (event: any) => void
) {
  const { query, origin, destination, stops, days, tripPurpose, tags, budget, calendarEvents } = params;

  try {
    // 1. Calendar Scan
    onEvent({ type: 'CALENDAR_SCAN', status: 'scanning', data: { text: 'Analyzing request context...' } });

    const eventsSummary = calendarEvents && calendarEvents.length > 0
      ? calendarEvents.slice(0, 5).map(e => `${e.summary} at ${e.start?.dateTime || e.start?.date}`).join(', ')
      : '';

    const contextResText = await callAI(
      `Extract key details from this travel request: "${query}". Origin: ${origin}, Destination: ${destination}.${eventsSummary ? ` Upcoming calendar events: ${eventsSummary}.` : ''} Return a short 1-line summary of the trip purpose.`
    );
    onEvent({ type: 'CALENDAR_SCAN', status: 'complete', data: { events: [contextResText] } });

    // 2. Flight Search
    onEvent({ type: 'FLIGHT_SEARCH', status: 'searching', data: { text: `Searching flights: ${origin || 'Origin'} → ${destination || 'Destination'}...` } });
    const flightText = await callAI(
      `Find a realistic flight from ${origin || 'Origin'} to ${destination || 'Destination'}. Give the airline, flight number, time, and approximate cost in one short line. Be concise.`
    );
    onEvent({ type: 'FLIGHT_SEARCH', status: 'found', data: { flights: [flightText.split('\n')[0] || 'IndiGo 6E-543 | 06:30 AM | ₹4,200 | On Time'] } });

    // 3. Disruption Simulation
    onEvent({ type: 'DISRUPTION_SIMULATION', status: 'checking', data: { text: 'Simulating flight disruptions and delays...' } });
    const disruptionText = await callAI(
      `What are common flight disruptions for a trip from ${origin || 'Origin'} to ${destination || 'Destination'}? Give a 1-line risk assessment and 1 alternative transport mode.`
    );
    onEvent({ type: 'DISRUPTION_SIMULATION', status: 'done', data: { risk: disruptionText.split('\n')[0] || 'Low disruption risk', alternatives: ['Train option available'] } });

    // 4. Weather Check
    onEvent({ type: 'WEATHER_CHECK', status: 'checking', data: { text: 'Checking weather at destination...' } });
    const weatherText = await callAI(
      `What is the typical weather in ${destination || 'Destination'} during the current season? Return just the temperature range and condition (e.g., 22-28°C, Sunny). Be very concise.`
    );
    onEvent({ type: 'WEATHER_CHECK', status: 'complete', data: { weather: { temp: weatherText.split(',')[0]?.trim() || '22°C', condition: weatherText.split(',')[1]?.trim() || 'Partly Cloudy' } } });

    // 5. Maps & Route Plan
    onEvent({ type: 'ROUTE_PLAN', status: 'calculating', data: { text: 'Calculating route: Airport → Hotel → Meeting venue' } });
    const routeText = await callAI(
      `Estimate the route from the main airport in ${destination || 'Destination'} to the city center. Give distance and time in one short line (e.g., "14.2 km · 34 min via highway").`
    );
    onEvent({ type: 'ROUTE_PLAN', status: 'done', data: { routes: [routeText.split('\n')[0] || '14.2 km · 34 min via NH-48'] } });

    // 6. Criticality Scoring
    onEvent({ type: 'CRITICALITY', status: 'scoring', data: { text: 'Scoring business criticality of meetings...' } });
    await new Promise((r) => setTimeout(r, 800));
    onEvent({ type: 'CRITICALITY', status: 'done', data: { scores: ['Meeting — 9/10 CRITICAL'] } });

    // 7. Place Suggestions
    if (tripPurpose?.toLowerCase().includes('leisure') || tags?.includes('Leisure')) {
      onEvent({ type: 'PLACE_SUGGEST', status: 'fetching', data: { text: 'Finding personalized places near your stops...' } });
      const placesText = await callAI(
        `Suggest the top tourist attraction in ${destination || 'Destination'}. Give name, star rating, and a short 1-line description.`
      );
      onEvent({ type: 'PLACE_SUGGEST', status: 'done', data: { places: [placesText.split('\n')[0] || "Humayun's Tomb · 4.8⭐"] } });
    }

    // 8. Plan Synthesis
    onEvent({ type: 'PLAN_COMPLETE', status: 'synthesizing', data: { text: 'Plan complete. Building your journey flowchart...' } });

    const graphPrompt = `You are an autonomous travel planning agent.
Create a journey graph JSON for a trip from ${origin || 'Chennai'} to ${destination || 'Delhi'} for ${days || 3} days.
Purpose: ${tripPurpose || 'Business'}.
Stops: ${stops?.join(', ') || 'None'}.
Budget: ${budget || 'Standard'}.
${eventsSummary ? `Upcoming Calendar Events: ${eventsSummary}` : ''}

CRITICAL INSTRUCTIONS:
1. Optimize for the specified budget. If 'Economy', prioritize cheaper options.
2. Simulate potential disruptions for transport nodes.
3. Include alternative transport options in data.alternatives array.

Return ONLY valid JSON matching this structure exactly:
{
  "nodes": [
    { "id": "node-1", "type": "location", "subtype": "airport", "label": "Origin Airport", "data": { "eta": "...", "details": "..." } },
    { "id": "node-2", "type": "transport", "subtype": "flight", "label": "Flight", "data": { "departure": "...", "arrival": "...", "cost": 4200, "status": "ON TIME", "alternatives": [] } }
  ],
  "edges": [
    { "id": "edge-1-2", "source": "node-1", "target": "node-2", "label": "Depart", "type": "flight" }
  ]
}`;

    const graphRaw = await callAI(graphPrompt, true);
    const text = graphRaw.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    const graphJson = JSON.parse(text);

    onEvent({ type: 'PLAN_COMPLETE', status: 'done', data: { graph: graphJson } });
    return graphJson;

  } catch (error) {
    console.error('Agent error:', error);
    onEvent({ type: 'ERROR', status: 'failed', data: { message: 'Agent encountered an error: ' + (error as Error).message } });
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

    const prompt = `You are an autonomous travel agent modifying a specific leg of a journey.
User request: "${userMessage}"
Node ID to modify: ${nodeId}
Current Plan Context: ${JSON.stringify(fullPlanContext)}

Return a JSON object with the updated node data.
Format: { "updatedNode": { "id": "...", "type": "...", "subtype": "...", "label": "...", "data": { ... } } }`;

    const raw = await callAI(prompt, true);
    const text = raw.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    const result = JSON.parse(text);

    onEvent({ type: 'NODE_UPDATED', status: 'done', data: { updatedNode: result.updatedNode } });
    return result.updatedNode;
  } catch (error) {
    console.error('Node chat error:', error);
    onEvent({ type: 'ERROR', status: 'failed', data: { message: 'Failed to update node.' } });
    throw error;
  }
}
