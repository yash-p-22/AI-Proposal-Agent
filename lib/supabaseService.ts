import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabase';
import type {
  JobPost, CaseStudy, Proposal, AuditLog,
  ProposalStatus,
} from '@/types';

function throwIfError(error: any) {
  if (error) throw new Error(error.message ?? String(error));
}

// ─── Job Posts ────────────────────────────────────────────────────────────────

export async function createJobPost(
  data: Omit<JobPost, 'id' | 'created_at'>,
): Promise<JobPost> {
  const doc: JobPost = {
    id:            uuidv4(),
    raw_text:      data.raw_text      ?? '',
    parsed_skills: data.parsed_skills ?? [],
    budget:        data.budget        ?? '',
    timeline:      data.timeline      ?? '',
    industry:      data.industry      ?? '',
    client:        data.client        ?? '',
    tone:          data.tone          ?? 'Professional',
    created_at:    new Date().toISOString(),
  };

  const { error } = await supabase.from('job_posts').insert(doc);
  throwIfError(error);
  return doc;
}

export async function getJobPost(id: string): Promise<JobPost | null> {
  const { data, error } = await supabase
    .from('job_posts')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  throwIfError(error);
  return data as JobPost | null;
}

export async function listJobPosts(): Promise<JobPost[]> {
  const { data, error } = await supabase
    .from('job_posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);
  throwIfError(error);
  return (data as JobPost[] | null) ?? [];
}

// ─── Case Studies ─────────────────────────────────────────────────────────────

export async function searchCaseStudies(
  skills: string[],
  industry: string,
): Promise<CaseStudy[]> {
  const { data, error } = await supabase
    .from('case_studies')
    .select('*');

  throwIfError(error);

  const all = (data as CaseStudy[] | null) ?? [];

  const scored = all.map(cs => {
    let score = 0;
    const csSkills = (cs.skills ?? []).map(s => s.toLowerCase());
    const csTags = (cs.tags ?? []).map(t => t.toLowerCase());

    skills.forEach(skill => {
      const s = skill.toLowerCase();
      if (csSkills.includes(s)) score += 3;
      if (csTags.includes(s)) score += 1;
      if (cs.description?.toLowerCase().includes(s)) score += 1;
    });

    if (industry && cs.industry?.toLowerCase() === industry.toLowerCase()) score += 2;

    return { ...cs, _score: score };
  });

  return scored
    .filter(cs => cs._score! > 0)
    .sort((a, b) => b._score! - a._score!)
    .slice(0, 3);
}

export async function createCaseStudy(
  data: Omit<CaseStudy, 'id'>,
): Promise<CaseStudy> {
  const doc: CaseStudy = { id: uuidv4(), ...data };
  const { error } = await supabase.from('case_studies').insert(doc);
  throwIfError(error);
  return doc;
}

// ─── Proposals ────────────────────────────────────────────────────────────────

export async function createProposal(
  data: Omit<Proposal, 'id' | 'status' | 'created_at'>,
): Promise<Proposal> {
  const doc: Proposal = {
    id:                uuidv4(),
    job_post_id:       data.job_post_id,
    case_studies_used: data.case_studies_used ?? [],
    proposal_text:     data.proposal_text ?? '',
    sections:          data.sections ?? [],
    status:            'awaiting_approval',
    metadata:          data.metadata ?? {},
    created_at:        new Date().toISOString(),
  };

  const { error } = await supabase.from('proposals').insert(doc);
  throwIfError(error);
  return doc;
}

export async function getProposal(id: string): Promise<Proposal | null> {
  const { data, error } = await supabase
    .from('proposals')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  throwIfError(error);
  return data as Proposal | null;
}

export async function listProposals(): Promise<Proposal[]> {
  const { data, error } = await supabase
    .from('proposals')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  throwIfError(error);
  return (data as Proposal[] | null) ?? [];
}

export async function updateProposalStatus(
  id: string,
  status: ProposalStatus,
  extra: Record<string, unknown> = {},
): Promise<Proposal | null> {
  const updates = {
    status,
    updated_at: new Date().toISOString(),
    ...extra,
  };

  const { data, error } = await supabase
    .from('proposals')
    .update(updates)
    .eq('id', id)
    .select('*')
    .maybeSingle();

  throwIfError(error);
  return data as Proposal | null;
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export async function createAuditLog(
  data: Omit<AuditLog, 'id' | 'timestamp'>,
): Promise<AuditLog> {
  const doc: AuditLog = {
    id:         uuidv4(),
    action:     data.action,
    agent_step: data.agent_step ?? '',
    metadata:   data.metadata ?? {},
    timestamp:  new Date().toISOString(),
  };
  const { error } = await supabase.from('audit_logs').insert(doc);
  throwIfError(error);
  return doc;
}

export async function listAuditLogs(limit = 100): Promise<AuditLog[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);
  throwIfError(error);
  return (data as AuditLog[] | null) ?? [];
}
