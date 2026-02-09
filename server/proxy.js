import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8787;

const PROVIDER_ENDPOINTS = {
  gpt: 'https://api.openai.com/v1/chat/completions',
  kimi: 'https://api.moonshot.cn/v1/chat/completions',
  deepseek: 'https://api.deepseek.com/chat/completions',
  doubao: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'
};

const PROVIDER_KEYS = {
  gpt: process.env.OPENAI_API_KEY,
  kimi: process.env.KIMI_API_KEY,
  deepseek: process.env.DEEPSEEK_API_KEY,
  doubao: process.env.DOUBAO_API_KEY
};

app.post('/api/proxy', async (req, res) => {
  try {
    const { provider = 'gpt', prompt, isReview = false } = req.body;
    // Safer logging: do NOT log prompt content. Only record provider and prompt length/time.
    console.info(`[proxy] ${new Date().toISOString()} provider=${provider} promptLen=${(prompt || '').length}`);
    const endpoint = PROVIDER_ENDPOINTS[provider];
    const key = PROVIDER_KEYS[provider];
    if (!endpoint || !key) return res.status(400).json({ error: 'Invalid provider or API key not configured' });

    const body = {
      model: provider === 'gpt' ? 'gpt-4' : undefined,
      messages: [{ role: 'user', content: prompt }]
    };

    const r = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify(body)
    });
    const text = await r.text();
    // safer response log: status and size only, avoid full body logging
    console.info(`[proxy] ${new Date().toISOString()} provider=${provider} status=${r.status} respLen=${text.length}`);
    // try parse JSON
    try { return res.status(r.status).json(JSON.parse(text)); } catch { return res.status(r.status).send(text); }
  } catch (e) {
    console.error('Proxy error', e);
    return res.status(500).json({ error: 'Proxy internal error' });
  }
});

app.listen(PORT, () => console.log(`AI proxy listening on http://localhost:${PORT}`));
