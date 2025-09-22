import { createClient } from 'redis';
export async function setupRedis() {
  const client = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
  await client.connect();
  return client;
}
export async function logQuery(redis, q) {
  const key = `trend:${new Date().toISOString().slice(0, 13)}`;
  await redis.zIncrBy(key, 1, q.toLowerCase());
  await redis.expire(key, 60*60*24*2);
}
export async function getTrending(redis, hours=6, limit=10) {
  const now = new Date();
  const scores = new Map();
  for (let i=0;i<hours;i++){
    const d = new Date(now.getTime()-i*3600*1000);
    const key = `trend:${d.toISOString().slice(0, 13)}`;
    const arr = await redis.zRangeWithScores(key, -limit, -1);
    arr.forEach(({value,score}) => scores.set(value,(scores.get(value)||0)+score));
  }
  return [...scores.entries()].sort((a,b)=>b[1]-a[1]).slice(0,limit).map(([v])=>v);
}
