import { createClient } from 'redis';

const redis = createClient({ url: 'redis://localhost:6379' });
redis.on('error', (err) => console.error('Redis error:', err));
await redis.connect();

// set مع TTL = 60 ثانية
await redis.set('user:42', JSON.stringify({ id: 42, name: 'Ali' }), { EX: 60 });

// get
const raw = await redis.get('user:42');
const data = raw ? JSON.parse(raw) : null;

export default redis;