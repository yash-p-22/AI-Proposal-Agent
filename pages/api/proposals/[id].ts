import type { NextApiRequest, NextApiResponse } from 'next';
import {
  getProposal, updateProposalStatus, createAuditLog,
} from '@/lib/firebaseService';
import { regenerateSection } from '@/lib/aiService';
import type { Proposal } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Proposal | { content: string } | { error: string }>,
) {
  const { id, action } = req.query;
  const proposalId = Array.isArray(id) ? id[0] : id;

  if (!proposalId) return res.status(400).json({ error: 'Missing id' });

  // ── GET ──────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const proposal = await getProposal(proposalId);
    if (!proposal) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json(proposal);
  }

  // ── POST /api/proposals/[id]?action=approve ───────────────────────────────
  if (req.method === 'POST' && action === 'approve') {
    try {
      const updated = await updateProposalStatus(proposalId, 'approved', {
        approved_at: new Date().toISOString(),
        approved_by: (req.body as { approved_by?: string }).approved_by ?? 'user',
      });
      if (!updated) return res.status(404).json({ error: 'Not found' });
      await createAuditLog({
        action:     'proposal_approved',
        agent_step: 'STEP_9_APPROVAL',
        metadata:   { proposal_id: proposalId, client: updated.metadata?.client },
      });
      return res.status(200).json(updated);
    } catch (err) {
      return res.status(500).json({ error: err instanceof Error ? err.message : 'Error' });
    }
  }

  // ── POST /api/proposals/[id]?action=reject ────────────────────────────────
  if (req.method === 'POST' && action === 'reject') {
    try {
      const { reason } = req.body as { reason?: string };
      const updated = await updateProposalStatus(proposalId, 'rejected', {
        rejected_at:      new Date().toISOString(),
        rejection_reason: reason ?? '',
      });
      if (!updated) return res.status(404).json({ error: 'Not found' });
      await createAuditLog({
        action:     'proposal_rejected',
        agent_step: 'STEP_9_APPROVAL',
        metadata:   { proposal_id: proposalId, reason, client: updated.metadata?.client },
      });
      return res.status(200).json(updated);
    } catch (err) {
      return res.status(500).json({ error: err instanceof Error ? err.message : 'Error' });
    }
  }

  // ── POST /api/proposals/[id]?action=regenerate ────────────────────────────
  if (req.method === 'POST' && action === 'regenerate') {
    try {
      const { sectionTitle, originalContent, instruction, jobContext } =
        req.body as {
          sectionTitle: string;
          originalContent: string;
          instruction: string;
          jobContext: string;
        };
      const content = await regenerateSection(
        sectionTitle, originalContent, instruction, jobContext,
      );
      return res.status(200).json({ content });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error';
      console.error('[regenerate] error:', msg);
      return res.status(500).json({ error: msg });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
