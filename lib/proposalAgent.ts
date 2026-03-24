import { parseJobPost, generateProposal } from './aiService';
import {
  createJobPost, searchCaseStudies, createProposal, createAuditLog,
} from './firebaseService';
import { createClickUpTask } from './clickupService';
import { sendSlackNotification } from './slackService';
import type {
  AgentStep, AgentRunResult, RunAgentRequest,
  JobPost, CaseStudy, ParsedJob,
} from '@/types';

export async function runProposalAgent(
  input: RunAgentRequest,
): Promise<AgentRunResult> {
  const steps: AgentStep[]             = [];
  const errors: AgentRunResult['errors'] = [];

  const run_id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7);

  async function audit(action: string, agentStep: string, metadata: Record<string, unknown> = {}) {
    try { await createAuditLog({ action, agent_step: agentStep, metadata: { ...metadata, run_id, client: input.client } }); }
    catch { /* non-fatal */ }
  }

  function done(step: number, name: string, data?: unknown): AgentStep {
    const s: AgentStep = { step, name, status: 'done', data };
    steps.push(s);
    return s;
  }
  function fail(step: number, name: string, error: string): AgentStep {
    const s: AgentStep = { step, name, status: 'error', error };
    steps.push(s);
    errors.push({ step, error });
    return s;
  }
  function skip(step: number, name: string): AgentStep {
    const s: AgentStep = { step, name, status: 'skipped' };
    steps.push(s);
    return s;
  }

  // ── STEP 1 — receive ─────────────────────────────────────────────────────
  await audit('job_post_received', 'STEP_1_RECEIVE', {
    preview: input.raw_text.slice(0, 80),
  });
  done(1, 'Job Post Received');

  // ── STEP 2 — parse ───────────────────────────────────────────────────────
  let parsed: ParsedJob = {
    skills: [], timeline: input.timeline, budget: input.budget,
    industry: input.industry ?? '', complexity: 'medium',
    key_requirements: [], project_type: 'Custom project',
  };

  try {
    parsed = await parseJobPost(
      input.raw_text, input.budget, input.timeline, input.industry ?? '',
    );
    await audit('job_post_parsed', 'STEP_2_PARSE', { parsed });
    done(2, 'Job Post Parsed', parsed);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await audit('parse_error', 'STEP_2_PARSE', { error: msg });
    fail(2, 'Parse Failed (using defaults)', msg);
  }

  // Store job post in the Supabase database
  const jobPost = await createJobPost({
    raw_text:      input.raw_text,
    parsed_skills: parsed.skills,
    budget:        input.budget,
    timeline:      input.timeline,
    industry:      parsed.industry,
    client:        input.client,
    tone:          input.tone,
  });
  await audit('job_post_stored', 'STEP_2_STORE', { id: jobPost.id });

  // ── STEP 3 — search case studies ─────────────────────────────────────────
  let caseStudies: CaseStudy[] = [];
  try {
    caseStudies = await searchCaseStudies(parsed.skills, parsed.industry);
    await audit('case_studies_matched', 'STEP_3_SEARCH', {
      count: caseStudies.length,
      titles: caseStudies.map(cs => cs.title),
    });
    done(3, 'Case Studies Matched', { count: caseStudies.length });
  } catch (e) {
    fail(3, 'Case Study Search', e instanceof Error ? e.message : String(e));
  }

  // ── STEP 4 — top 3 selected ──────────────────────────────────────────────
  done(4, 'Top 3 Selected', { selected: caseStudies.length });

  // ── STEP 5 — generate proposal ───────────────────────────────────────────
  let proposalSections = [
    { id: 1, title: 'Introduction',     content: 'Thank you for this opportunity.' },
    { id: 2, title: 'Project Plan',     content: 'Here is my proposed approach.' },
    { id: 3, title: 'Case Study Links', content: 'Relevant past work...' },
    { id: 4, title: 'Questions to Ask', content: 'A few clarifying questions...' },
  ];
  let wordCount = 0;
  let proposalOutput: import('@/types').ProposalOutput | undefined;

  try {
    const result = await generateProposal(
      { ...input, parsed }, caseStudies, input.tone,
    );
    proposalSections = result.sections;
    wordCount        = result.word_count;
    proposalOutput   = result.output;
    await audit('proposal_generated', 'STEP_5_GENERATE', {
      sections: result.sections.length,
    });
    done(5, 'Proposal Generated');
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await audit('generation_error', 'STEP_5_GENERATE', { error: msg });
    fail(5, 'Generation Failed (using fallback)', msg);
  }

  // Store proposal
  const fullText = proposalSections
    .map(s => `## ${s.title}\n\n${s.content}`)
    .join('\n\n---\n\n');

  const proposal = await createProposal({
    job_post_id:       jobPost.id,
    case_studies_used: caseStudies,
    proposal_text:     fullText,
    sections:          proposalSections,
    metadata: {
      parsed,
      word_count:      wordCount,
      tone:            input.tone,
      client:          input.client,
      budget:          input.budget,
      timeline:        input.timeline,
      proposal_output: proposalOutput,
    },
  });

  // ── STEP 6 — ClickUp ─────────────────────────────────────────────────────
  try {
    const cu = await createClickUpTask(proposal, jobPost);
    await audit('clickup_task_created', 'STEP_6_CLICKUP', cu as unknown as Record<string, unknown>);
    if (cu.skipped) {
      skip(6, 'ClickUp (not configured)');
    } else if (cu.error) {
      fail(6, 'ClickUp Error', cu.error);
    } else {
      // Persist task link into the proposal metadata
      proposal.metadata.clickup_task_id  = cu.id  ?? undefined;
      proposal.metadata.clickup_task_url = cu.url ?? undefined;
      done(6, 'ClickUp Task Created', cu);
    }
  } catch (e) {
    fail(6, 'ClickUp Error', e instanceof Error ? e.message : String(e));
  }

  // ── STEP 7 — Slack ───────────────────────────────────────────────────────
  try {
    const sl = await sendSlackNotification(proposal, jobPost);
    await audit('slack_notification_sent', 'STEP_7_SLACK', sl as unknown as Record<string, unknown>);
    sl.skipped ? skip(7, 'Slack (not configured)') : done(7, 'Slack Notification Sent');
  } catch (e) {
    fail(7, 'Slack Error', e instanceof Error ? e.message : String(e));
  }

  // ── STEP 8 — await approval ──────────────────────────────────────────────
  steps.push({ step: 8, name: 'Awaiting Human Approval', status: 'pending' });
  await audit('awaiting_human_approval', 'STEP_8_APPROVAL', { proposal_id: proposal.id });

  return {
    success: true,
    steps,
    errors,
    proposal,
    jobPost,
    caseStudies,
    parsed,
  };
}
