import { connectToDatabase } from './mongodb';

export async function ensureIndexes() {
  const { db } = await connectToDatabase();

  // Agents collection - workers register via API (no on-chain txId)
  try { await db.collection('agents').dropIndex('appId_1'); } catch (e) {}
  try { await db.collection('agents').dropIndex('txId_1'); } catch (e) {}
  await db.collection('agents').createIndexes([
    { key: { appId: 1 } },
    { key: { walletAddress: 1 } },
    { key: { algorandAddress: 1 } },
    { key: { category: 1 } },
    { key: { reputationScore: -1 } },
    { key: { createdAt: -1 } },
  ]);

  // Executions collection
  await db.collection('executions').createIndexes([
    { key: { txId: 1 }, unique: true },
    { key: { agentAppId: 1 } },
    { key: { callerAddress: 1 } },
    { key: { executedAt: -1 } },
  ]);

  // Reputations collection
  await db.collection('reputations').createIndexes([
    { key: { agentAppId: 1, raterAddress: 1 }, unique: true },
    { key: { agentAppId: 1 } },
  ]);

  // Users collection
  await db.collection('users').createIndexes([
    { key: { algorandAddress: 1 }, unique: true },
  ]);

  // Jobs collection
  await db.collection('jobs').createIndexes([
    { key: { _id: 1 } },
    { key: { status: 1 } },
    { key: { createdAt: -1 } },
    { key: { agentId: 1 } },
  ]);

  console.log('[MongoDB] All indexes ensured');
}
