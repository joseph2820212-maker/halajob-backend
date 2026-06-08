import 'dotenv/config';
import mongoose from 'mongoose';
import { NotificationModel } from '../models/index.js';

const uri = process.env.CONNECTION_URL || process.env.MONGO_URI || process.env.DATABASE_URL;

if (!uri) {
  console.error('Missing CONNECTION_URL / MONGO_URI / DATABASE_URL');
  process.exit(1);
}

await mongoose.connect(uri);

try {
  const collection = NotificationModel.collection;
  const indexes = await collection.indexes();
  const oldUniqueIndex = indexes.find((idx) => {
    const key = JSON.stringify(idx.key || {});
    return idx.unique === true && key === JSON.stringify({ user_id: 1, dedupeKey: 1 }) && !idx.partialFilterExpression;
  });

  if (oldUniqueIndex) {
    await collection.dropIndex(oldUniqueIndex.name);
    console.log(`Dropped old notification unique index: ${oldUniqueIndex.name}`);
  }

  await NotificationModel.syncIndexes();
  console.log('Notification indexes are ready.');
} finally {
  await mongoose.disconnect();
}
