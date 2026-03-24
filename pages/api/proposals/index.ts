import type { NextApiRequest, NextApiResponse } from 'next';
import { listProposals } from '@/lib/firebaseService';
import type { Proposal } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ proposals: Proposal[] } | { error: string }>,
) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const proposals = await listProposals();
    return res.status(200).json({ proposals });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Error' });
  }
}
