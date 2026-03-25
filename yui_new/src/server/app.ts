import express from 'express';
import { google } from 'googleapis';

const ARIA_TOOLS = [
  { id: 'WEATHER_CHECK', name: 'Weather Intelligence', description: 'Fetches real-time weather and seasonal forecast for any location', icon: '🌤️' },
  { id: 'FLIGHT_SEARCH', name: 'Flight Discovery', description: 'Searches and ranks flights by cost, time, and reliability', icon: '✈️' },
  { id: 'ROUTE_PLAN', name: 'Route Optimizer', description: 'Calculates optimal road/transit routes using mapping APIs', icon: '🗺️' },
  { id: 'PLACE_SUGGEST', name: 'Place Intelligence', description: 'Suggests curated places, hotels, restaurants near stops', icon: '📍' },
  { id: 'DISRUPTION_SIMULATION', name: 'Disruption Engine', description: 'Simulates delays, cancellations and generates alternatives', icon: '⚡' },
  { id: 'CALENDAR_SCAN', name: 'Calendar Awareness', description: 'Reads calendar context to align travel with meetings', icon: '📅' },
  { id: 'CRITICALITY', name: 'Criticality Scorer', description: 'Rates the business importance of meetings and events', icon: '🧠' },
];

const FREE_MODELS = [
  'nvidia/nemotron-3-nano-30b-a3b:free',
  'mistralai/mistral-7b-instruct:free',
  'meta-llama/llama-3.1-8b-instruct:free',
  'google/gemma-3-4b-it:free',
  'deepseek/deepseek-r1-distill-qwen-14b:free',
  'microsoft/phi-3-mini-128k-instruct:free',
  'mistralai/mistral-small-3.1-24b-instruct:free',
];

const FREE_MODELS_PLAN = [
  'nvidia/nemotron-3-nano-30b-a3b:free',
  'mistralai/mistral-7b-instruct:free',
  'meta-llama/llama-3.1-8b-instruct:free',
];

export function createExpressApp() {
  const app = express();
  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post('/api/ai/plan', async (req, res) => {
    const { query, origin, destination, days, budget, tags, stops } = req.body;
    const toolList = ARIA_TOOLS.map(t => `- ${t.id}: ${t.description}`).join('\n');

    const prompt = `You are ARIA, an autonomous AI travel orchestrator. A user has requested:
"${query}"
Trip: ${origin || 'unknown'} → ${destination || 'unknown'}, ${days || 3} days, Budget: ${budget || 'standard'}, Tags: ${tags?.join(', ') || 'none'}, Stops: ${stops?.join(', ') || 'none'}

You have access to these tools:
${toolList}

First, reason step-by-step about what this trip needs. Then produce a JSON execution plan.
Return ONLY valid JSON:
{
  "reasoning": "2-3 sentences of your chain-of-thought analysis",
  "steps": [
    { "tool": "TOOL_ID", "reason": "Why this step is needed", "priority": 1 }
  ]
}
Order steps by priority (1=first). Include only relevant tools. Always include FLIGHT_SEARCH and ROUTE_PLAN. Include PLACE_SUGGEST only for leisure trips. Always end with CRITICALITY.`;

    const apiKey = process.env.OPENROUTER_API_KEY;

    for (const model of FREE_MODELS_PLAN) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'HTTP-Referer': `${req.headers['x-forwarded-proto'] || req.protocol}://${req.headers.host}` },
          body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' }, temperature: 0.4 }),
        });
        if (!response.ok) continue;
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || '{}';
        const plan = JSON.parse(text);
        plan.tools = ARIA_TOOLS;
        return res.json(plan);
      } catch (e) { }
    }
    return res.status(503).json({ error: 'Could not generate plan' });
  });

  app.get('/api/ai/tool-registry', (_req, res) => res.json(ARIA_TOOLS));

  app.post('/api/ai/chat', async (req, res) => {
    const { prompt, jsonMode } = req.body;
    if (!prompt) return res.status(400).json({ error: 'prompt is required' });

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'OPENROUTER_API_KEY not configured' });

    let lastError = '';
    for (const model of FREE_MODELS) {
      try {
        const body: any = {
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
        };
        if (jsonMode) body.response_format = { type: 'json_object' };

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': `${req.headers['x-forwarded-proto'] || req.protocol}://${req.headers.host}`,
            'X-Title': 'Yui ARIA Agent',
          },
          body: JSON.stringify(body),
        });

        if (response.status === 429 || response.status === 503 || response.status === 404) {
          lastError = await response.text();
          continue;
        }

        if (!response.ok) {
          lastError = await response.text();
          continue;
        }

        const data = await response.json();
        return res.json({ text: data.choices?.[0]?.message?.content || '', model });
      } catch (err: any) {
        lastError = err.message;
      }
    }
    return res.status(503).json({ error: 'All models are rate-limited.', details: lastError });
  });

  app.get('/api/auth/url', (req, res) => {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers.host;
    const redirectUri = `${protocol}://${host}/auth/callback`;
    
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar.readonly'],
      prompt: 'consent'
    });

    res.json({ url: authUrl });
  });

  app.get(['/auth/callback', '/auth/callback/'], async (req, res) => {
    const { code } = req.query;
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers.host;
    const redirectUri = `${protocol}://${host}/auth/callback`;
    
    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        redirectUri
      );

      const { tokens } = await oauth2Client.getToken(code as string);
      
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', tokens: ${JSON.stringify(tokens)} }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error) {
      res.status(500).send('Authentication failed');
    }
  });

  app.post('/api/calendar/events', async (req, res) => {
    try {
      const { tokens, timeMin, timeMax } = req.body;
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );
      oauth2Client.setCredentials(tokens);

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin || new Date().toISOString(),
        timeMax: timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime',
      });

      res.json({ events: response.data.items });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch calendar events' });
    }
  });

  return app;
}
