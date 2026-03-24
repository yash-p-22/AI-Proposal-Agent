import type { NextApiRequest, NextApiResponse } from 'next';
import { listAuditLogs } from '@/lib/firebaseService';
import type { AuditLog } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ logs: AuditLog[] } | { error: string }>,
) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const limit = parseInt((req.query.limit as string) ?? '100', 10);
    const logs  = await listAuditLogs(limit);
    return res.status(200).json({ logs });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Error' });
  }
}
