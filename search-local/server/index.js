import 'dotenv/config';
import express from 'express';
import compression from 'compression';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { meili } from './search/client.js';
import { setupRedis, logQuery, getTrending } from './search/trending.js';

const app = express();
app.use(compression());
app.use(cors());
app.use(rateLimit({ windowMs: 10_000, max: 60 }));

const redis = await setupRedis();

app.get('/_health', (req,res)=>res.json({ ok: true }));

app.get('/suggest', async (req, res) => {
  const q = String(req.query.q || '').trim();
  const limit = Math.min(parseInt(req.query.limit || '8', 10), 16);
  if (!q) {
    return res.json({ suggestions: await getTrending(redis, 6, limit) });
  }
  const { hits } = await meili.index('suggestions').search(q, { limit });
  const trending = await getTrending(redis, 6, Math.max(3, Math.floor(limit/2)));
  const merged = Array.from(new Set([...hits.map(h=>h.q), ...trending]));
  res.json({ suggestions: merged.slice(0, limit) });
});

app.get('/search', async (req, res) => {
  const q = String(req.query.q || '').slice(0,128).trim();
  const limit = Math.min(parseInt(req.query.limit || '10', 10), 50);
  const sort = String(req.query.sort || 'popularity:desc,published_at:desc').split(',').filter(Boolean);
  if (!q) return res.json({ results: [] });

  await logQuery(redis, q);
  const { hits } = await meili.index('content').search(q, { limit, sort });
  res.json({ results: hits });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API http://localhost:${port}`));
