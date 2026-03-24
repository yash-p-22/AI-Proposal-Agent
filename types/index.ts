// ─── Domain Models ────────────────────────────────────────────────────────────

export type ProposalTone = 'Luxury' | 'Professional' | 'Minimal' | 'Casual';

export type ProposalStatus = 'draft' | 'awaiting_approval' | 'approved' | 'rejected';

export interface ProposalSection {
  id: number;
  title: string;
  content: string;
}

// ─── Rich Proposal Output (new structured format) ─────────────────────────────

export interface ProposalStep {
  title: string;
  description: string;
}

export interface ProposalCaseStudyItem {
  title: string;
  description: string;
  tech_stack: string[];
  outcome: string;
  link: string;
}

export interface ProposalOutput {
  introduction: {
    heading: string;
    content: string;
  };
  project_plan: {
    heading: string;
    steps: ProposalStep[];
    timeline: string;
    deliverables: string[];
  };
  case_studies: {
    heading: string;
    items: ProposalCaseStudyItem[];
  };
  questions: {
    heading: string;
    items: string[];
  };
}

export interface JobPost {
  id: string;
  raw_text: string;
  parsed_skills: string[];
  budget: string;
  timeline: string;
  industry: string;
  client: string;
  tone: ProposalTone;
  created_at: string;
}

export interface CaseStudy {
  id: string;
  title: string;
  description: string;
  skills: string[];
  industry: string;
  results: string;
  tags: string[];
  _score?: number;
}

export interface ParsedJob {
  skills: string[];
  timeline: string;
  budget: string;
  industry: string;
  complexity: 'low' | 'medium' | 'high';
  key_requirements: string[];
  project_type: string;
}

export interface Proposal {
  id: string;
  job_post_id: string;
  case_studies_used: CaseStudy[];
  proposal_text: string;
  sections: ProposalSection[];
  status: ProposalStatus;
  metadata: {
    parsed?: ParsedJob;
    word_count?: number;
    tone?: ProposalTone;
    client?: string;
    budget?: string;
    timeline?: string;
    clickup_task_id?: string;
    clickup_task_url?: string;
    proposal_output?: ProposalOutput;
  };
  created_at: string;
  updated_at?: string;
  approved_at?: string;
  approved_by?: string;
  rejected_at?: string;
  rejection_reason?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  agent_step: string;
  metadata: Record<string, unknown>;
  timestamp: string;
}

// ─── Agent Pipeline ───────────────────────────────────────────────────────────

export type AgentStepStatus = 'done' | 'error' | 'pending' | 'skipped' | 'warning';

export interface AgentStep {
  step: number;
  name: string;
  status: AgentStepStatus;
  data?: unknown;
  error?: string;
}

export interface AgentRunResult {
  success: boolean;
  steps: AgentStep[];
  errors: Array<{ step: number; error: string }>;
  proposal: Proposal;
  jobPost: JobPost;
  caseStudies: CaseStudy[];
  parsed: ParsedJob;
}

// ─── API Request / Response ───────────────────────────────────────────────────

export interface RunAgentRequest {
  raw_text: string;
  budget: string;
  timeline: string;
  client: string;
  tone: ProposalTone;
  industry?: string;
}

export interface RegenerateSectionRequest {
  sectionTitle: string;
  originalContent: string;
  instruction: string;
  jobContext: string;
}

export interface ApproveRejectRequest {
  approved_by?: string;
  reason?: string;
}
