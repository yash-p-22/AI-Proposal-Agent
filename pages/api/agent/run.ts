import type { NextApiRequest, NextApiResponse } from 'next';
import { runProposalAgent } from '@/lib/proposalAgent';
import type { RunAgentRequest, AgentRunResult } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AgentRunResult | { error: string }>,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const input = req.body as RunAgentRequest;

    if (!input.raw_text?.trim()) {
      return res.status(400).json({ error: 'raw_text is required' });
    }

    const result = await runProposalAgent(input);
    return res.status(200).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[/api/agent/run]', message);
    return res.status(500).json({ error: message });
  }
}
