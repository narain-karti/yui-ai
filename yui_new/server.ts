import express from 'express';
import 'dotenv/config';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { google } from 'googleapis';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes go here
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // OpenRouter AI proxy with multi-model fallback
  const FREE_MODELS = [
    'nvidia/nemotron-3-nano-30b-a3b:free',
    'mistralai/mistral-7b-instruct:free',
    'meta-llama/llama-3.1-8b-instruct:free',
    'google/gemma-3-4b-it:free',
    'deepseek/deepseek-r1-distill-qwen-14b:free',
    'microsoft/phi-3-mini-128k-instruct:free',
    'mistralai/mistral-small-3.1-24b-instruct:free',
  ];

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
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'Yui ARIA Agent',
          },
          body: JSON.stringify(body),
        });

        if (response.status === 429 || response.status === 503 || response.status === 404) {
          const errText = await response.text();
          console.warn(`[AI Proxy] Model ${model} failed (${response.status}), trying next...`);
          lastError = errText;
          continue;
        }

        if (!response.ok) {
          const errText = await response.text();
          lastError = errText;
          continue;
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || '';
        console.log(`[AI Proxy] Success with model: ${model}`);
        return res.json({ text, model });
      } catch (err: any) {
        console.warn(`[AI Proxy] Model ${model} threw: ${err.message}`);
        lastError = err.message;
      }
    }

    return res.status(503).json({ error: 'All models are rate-limited. Please try again shortly.', details: lastError });
  });



  // Google Calendar OAuth
  app.get('/api/auth/url', (req, res) => {
    const redirectUri = `${req.headers['x-forwarded-proto'] || req.protocol}://${req.headers.host}/auth/callback`;
    
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
    const redirectUri = `${req.headers['x-forwarded-proto'] || req.protocol}://${req.headers.host}/auth/callback`;
    
    try {
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        throw new Error('Missing Google OAuth credentials');
      }

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
      console.error('OAuth callback error:', error);
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
      console.error('Calendar events error:', error);
      res.status(500).json({ error: 'Failed to fetch calendar events' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
