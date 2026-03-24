import type { Proposal, JobPost } from '@/types';

export interface ClickUpResult {
  id:      string | null;
  url:     string | null;
  skipped?: boolean;
  error?:  string;
}

export async function createClickUpTask(
  proposal: Proposal,
  jobPost:  Pick<JobPost, 'raw_text' | 'client' | 'budget' | 'timeline'>,
): Promise<ClickUpResult> {
  const apiKey = process.env.CLICKUP_API_KEY;
  const listId = process.env.CLICKUP_LIST_ID;

  if (!apiKey || !listId) {
    console.info('[ClickUp] Not configured — skipping. CLICKUP_API_KEY:', !!apiKey, 'CLICKUP_LIST_ID:', !!listId);
    return { id: null, url: null, skipped: true };
  }

  console.info('[ClickUp] Creating task for client:', jobPost.client, 'list:', listId);

  const description = [
    '## Job Post',
    (jobPost.raw_text ?? '').slice(0, 2000),
    '',
    '## Generated Proposal',
    (proposal.proposal_text ?? '').slice(0, 6000),
    '',
    '## Case Studies Used',
    (proposal.case_studies_used ?? [])
      .map(cs => `- ${cs.title}`)
      .join('\n') || 'None',
  ].join('\n');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(
      `https://api.clickup.com/api/v2/list/${listId}/task`,
      {
        method:  'POST',
        headers: {
          Authorization:  apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name:     `Proposal › ${jobPost.client ?? 'New Client'} — ${jobPost.budget}`,
          description,
          status:   'to do',
          priority: 2,
          due_date: Date.now() + 7 * 24 * 60 * 60 * 1000,
        }),
        signal: controller.signal,
      },
    );

    clearTimeout(timeout);

    const text = await res.text();
    if (!res.ok) {
      console.error('[ClickUp] API error:', res.status, text.slice(0, 300));
      throw new Error(`ClickUp API ${res.status}: ${text.slice(0, 200)}`);
    }

    const data = JSON.parse(text);
    console.info('[ClickUp] Task created:', data.id, data.url);
    return { id: data.id as string, url: data.url as string };

  } catch (err) {
    clearTimeout(timeout);
    const message = err instanceof Error ? err.message : String(err);
    console.error('[ClickUp] Error:', message);
    return { id: null, url: null, error: message };
  }
}
