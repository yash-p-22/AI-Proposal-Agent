import type { Proposal, JobPost } from '@/types';

export async function sendSlackNotification(
  proposal: Proposal,
  jobPost:  Pick<JobPost, 'client' | 'budget' | 'timeline'>,
): Promise<{ sent: boolean; skipped?: boolean; error?: string }> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  const appUrl     = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  if (!webhookUrl) {
    console.info('[Slack] Webhook not configured — skipping notification.');
    return { sent: false, skipped: true };
  }

  const fullText    = proposal.proposal_text?.slice(0, 2900) ?? '';
  const approveUrl  = `${appUrl}/proposals/${proposal.id}?action=approve`;
  const rejectUrl   = `${appUrl}/proposals/${proposal.id}?action=reject`;

  const payload = {
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: '📝 New Proposal Ready for Review', emoji: true },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Client:*\n${jobPost.client ?? 'Unknown'}` },
          { type: 'mrkdwn', text: `*Budget:*\n${jobPost.budget ?? 'TBD'}` },
          { type: 'mrkdwn', text: `*Timeline:*\n${jobPost.timeline ?? 'TBD'}` },
          { type: 'mrkdwn', text: `*Proposal ID:*\n${proposal.id}` },
        ],
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*Full Proposal Content:*\n\n${fullText}` },
      },
      {
        type: 'actions',
        elements: [
          {
            type:  'button',
            text:  { type: 'plain_text', text: '✅ Approve', emoji: true },
            style: 'primary',
            url:   approveUrl,
          },
          {
            type:  'button',
            text:  { type: 'plain_text', text: '❌ Reject', emoji: true },
            style: 'danger',
            url:   rejectUrl,
          },
        ],
      },
    ],
  };

  try {
    const res = await fetch(webhookUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    return { sent: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Slack] Error:', message);
    return { sent: false, error: message };
  }
}
