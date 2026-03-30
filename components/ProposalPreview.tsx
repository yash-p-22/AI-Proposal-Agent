import React from 'react';
import { FileText, Copy, Download, Loader2, Check, ExternalLink, ChevronRight, RotateCcw } from 'lucide-react';
import AgentStatusBar from './AgentStatusBar';
import ApprovalControls from './ApprovalControls';
import type { Proposal, AgentStep, ProposalOutput } from '@/types';

interface Props {
  proposal:    Proposal | null;
  agentSteps:  AgentStep[];
  loading:     boolean;
  client:      string;
  budget:      string;
  timeline:    string;
  tone:        string;
  regenLoadingId: number | null;
  sectionOverrides: Record<number, string>;
  disabled?: boolean;
  onApprove:   () => void;
  onRegenerate: (sectionId: number, instruction: 'regenerate' | 'shorten' | 'expand') => void;
  onReset?: () => void;
}

export default function ProposalPreview({
  proposal, agentSteps, loading, client, budget, timeline, tone,
  regenLoadingId, sectionOverrides, disabled, onApprove, onRegenerate, onReset,
}: Props) {
  const [copied, setCopied] = React.useState(false);

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (!loading && !proposal) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 }}>
        <div style={{ width: 60, height: 60, background: '#f4f4f5', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FileText size={26} color="#bbb" />
        </div>
        <p style={{ fontSize: 15, fontWeight: 600, color: '#666', margin: 0 }}>No proposal yet</p>
        <p style={{ fontSize: 12.5, color: '#aaa', textAlign: 'center', maxWidth: 280, margin: 0 }}>
          Fill in the job details and click "Generate Proposal" to launch the AI agent.
        </p>
      </div>
    );
  }

  // ── Loading state ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 40 }}>
        <div style={{ width: 52, height: 52, border: '3px solid #f0f0f0', borderTopColor: '#111', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <p style={{ fontSize: 15, fontWeight: 600, color: '#111', margin: 0 }}>AI Agent Running…</p>
        <p style={{ fontSize: 12.5, color: '#888', margin: 0, textAlign: 'center' }}>
          Parsing job post → Matching case studies → Generating proposal
        </p>
        {agentSteps.length > 0 && (
          <div style={{ width: '100%', maxWidth: 520 }}>
            <AgentStatusBar steps={agentSteps} />
          </div>
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!proposal) return null;

  const output: ProposalOutput | undefined = proposal.metadata?.proposal_output;

  const statusCfg =
    proposal.status === 'approved' ? { label: 'Approved', color: '#16a34a', bg: '#dcfce7' } :
    proposal.status === 'rejected' ? { label: 'Rejected', color: '#dc2626', bg: '#fee2e2' } :
    { label: 'Generated', color: '#16a34a', bg: '#dcfce7' };

  function copyAll() {
    let text = '';
    if (output) {
      text = [
        `# ${output.introduction.heading}\n${output.introduction.content}`,
        `# ${output.project_plan.heading}\n${output.project_plan.steps.map(s => `• ${s.title}: ${s.description}`).join('\n')}\n\nTimeline: ${output.project_plan.timeline}\n\nDeliverables:\n${output.project_plan.deliverables.map(d => `• ${d}`).join('\n')}`,
        `# ${output.case_studies.heading}\n${output.case_studies.items.map(cs => `• ${cs.title}: ${cs.outcome}`).join('\n')}`,
        `# ${output.questions.heading}\n${output.questions.items.map((q, i) => `${i + 1}. ${q}`).join('\n')}`,
      ].join('\n\n---\n\n');
    } else {
      text = proposal!.sections.map(s => `## ${s.title}\n\n${s.content}`).join('\n\n---\n\n');
    }
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  function exportPdf() {
    if (!proposal) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let bodyContent = '';
    if (output) {
      bodyContent = `
        <div class="section">
          <h2>${output.introduction.heading}</h2>
          <p>${output.introduction.content}</p>
        </div>
        <div class="section">
          <h2>${output.project_plan.heading}</h2>
          ${output.project_plan.steps.map(s => `<div class="step"><strong>${s.title}</strong><p>${s.description}</p></div>`).join('')}
          <p><strong>Timeline:</strong> ${output.project_plan.timeline}</p>
          <p><strong>Deliverables:</strong></p>
          <ul>${output.project_plan.deliverables.map(d => `<li>${d}</li>`).join('')}</ul>
        </div>
        ${output.case_studies.items.length ? `
        <div class="section">
          <h2>${output.case_studies.heading}</h2>
          ${output.case_studies.items.map(cs => `
            <div class="step">
              <strong>${cs.title}</strong>
              <p>${cs.description}</p>
              <p><em>Outcome: ${cs.outcome}</em></p>
              ${cs.link ? `<p><a href="${cs.link}">${cs.link}</a></p>` : ''}
            </div>`).join('')}
        </div>` : ''}
        <div class="section">
          <h2>${output.questions.heading}</h2>
          <ol>${output.questions.items.map(q => `<li>${q}</li>`).join('')}</ol>
        </div>`;
    } else {
      bodyContent = proposal.sections.map(s => `
        <div class="section">
          <h2>${s.title}</h2>
          <p style="white-space:pre-wrap">${s.content}</p>
        </div>`).join('');
    }

    const html = `<!DOCTYPE html><html><head>
      <title>Proposal - ${client}</title>
      <style>
        body { padding: 40px; max-width: 800px; margin: 0 auto; color: #333; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.65; }
        h1 { font-size: 24px; color: #111; margin-bottom: 4px; }
        h2 { font-size: 17px; color: #111; border-bottom: 1px solid #eee; padding-bottom: 6px; margin-top: 28px; }
        .section { margin-bottom: 28px; }
        .step { margin: 10px 0 10px 10px; }
        ul, ol { padding-left: 20px; }
        li { margin-bottom: 6px; }
        @media print { body { padding: 0; } @page { margin: 2cm; } }
      </style>
    </head>
    <body onload="window.print(); setTimeout(() => window.close(), 500);">
      <h1>Proposal</h1>
      <p style="color:#666;margin-top:0;margin-bottom:32px">For ${client || 'Client'} &bull; Budget: ${budget} &bull; Timeline: ${timeline}</p>
      ${bodyContent}
    </body></html>`;
    printWindow.document.write(html);
    printWindow.document.close();
  }

  const wordCount = proposal.sections.reduce((acc, s) => acc + s.content.split(/\s+/).length, 0);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid #ebebeb', background: '#fff', flexShrink: 0 }}>
        <div style={{ width: 36, height: 36, background: '#f4f4f5', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <FileText size={17} color="#666" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111', margin: 0 }}>Draft Proposal</h2>
          <p style={{ fontSize: 11.5, color: '#888', margin: 0 }}>
            For {client || 'Client'} &bull; {budget} &bull; {timeline} &bull; 4 sections
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: statusCfg.bg, color: statusCfg.color, borderRadius: 20, padding: '4px 12px', fontSize: 11.5, fontWeight: 600, flexShrink: 0 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusCfg.color }} />
          {statusCfg.label}
        </div>
        <HeaderBtn onClick={copyAll} icon={copied ? <Check size={12} color="#16a34a" /> : <Copy size={12} />} label={copied ? 'Copied!' : 'Copy'} />
        <HeaderBtn onClick={exportPdf} icon={<Download size={12} />} label="Export" />
        {onReset && (
          <HeaderBtn
            onClick={onReset}
            icon={<RotateCcw size={12} />}
            label="Reset"
            danger
          />
        )}
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {agentSteps.length > 0 && <AgentStatusBar steps={agentSteps} />}

        {output ? (
          /* ── Rich structured view ── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Introduction */}
            <Section
              id={1} num={1} heading={output.introduction.heading}
              badge={{ text: 'Ready', color: '#7c3aed' }}
              disabled={disabled} regenLoadingId={regenLoadingId} onRegenerate={onRegenerate}
            >
              <p style={{ fontSize: 13.5, lineHeight: 1.78, color: '#444', margin: 0, whiteSpace: 'pre-wrap' }}>
                {proposal.sections.find(s => s.id === 1)?.content ?? output.introduction.content}
              </p>
            </Section>

            {/* Project Plan */}
            <Section
              id={2} num={2} heading={output.project_plan.heading}
              badge={{ text: `${output.project_plan.steps.length} steps`, color: '#0ea5e9' }}
              disabled={disabled} regenLoadingId={regenLoadingId} onRegenerate={onRegenerate}
            >
              {(() => {
                const steps = sectionOverrides[2]
                  ? parseProjectPlanSteps(sectionOverrides[2])
                  : output.project_plan.steps;
                const isOverride = !!sectionOverrides[2];
                return (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {steps.length > 0 ? steps.map((step, i) => (
                        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                          <div style={{ width: 22, height: 22, borderRadius: 6, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#64748b', flexShrink: 0, marginTop: 1 }}>
                            {i + 1}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{step.title}</div>
                            <div style={{ fontSize: 12.5, color: '#666', lineHeight: 1.6, marginTop: 2 }}>{step.description}</div>
                          </div>
                        </div>
                      )) : (
                        /* Fallback if parsing yields nothing: show plain text */
                        <p style={{ fontSize: 13.5, lineHeight: 1.78, color: '#444', margin: 0, whiteSpace: 'pre-wrap' }}>{sectionOverrides[2]}</p>
                      )}
                    </div>
                    {/* Always show original timeline & deliverables */}
                    {output.project_plan.timeline && (
                      <div style={{ marginTop: 12, padding: '8px 12px', background: '#f8fafc', borderRadius: 8, fontSize: 12.5, color: '#555' }}>
                        <span style={{ fontWeight: 600, color: '#111' }}>Timeline: </span>{output.project_plan.timeline}
                      </div>
                    )}
                    {output.project_plan.deliverables.length > 0 && (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deliverables</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {output.project_plan.deliverables.map((d, i) => (
                            <span key={i} style={{ fontSize: 12, background: '#f1f5f9', borderRadius: 6, padding: '3px 9px', color: '#374151' }}>{d}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </Section>

            {/* Case Studies */}
            <Section
              id={3} num={3} heading={output.case_studies.heading}
              badge={{ text: `${output.case_studies.items.length} items`, color: '#d97706' }}
              disabled={disabled} regenLoadingId={regenLoadingId} onRegenerate={onRegenerate}
            >
              {sectionOverrides[3] ? (
                <p style={{ fontSize: 13.5, lineHeight: 1.78, color: '#444', margin: 0, whiteSpace: 'pre-wrap' }}>{sectionOverrides[3]}</p>
              ) : output.case_studies.items.length === 0 ? (
                <p style={{ fontSize: 12.5, color: '#aaa', margin: 0 }}>No matching case studies were found.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {output.case_studies.items.map((cs, i) => (
                    <div key={i} style={{ border: '1px solid #f0f0f0', borderRadius: 10, padding: '12px 14px', background: '#fafafa' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 5 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111' }}>{cs.title}</div>
                        {cs.link && (
                          <a href={cs.link} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 3, fontSize: 11.5, color: '#2563eb', textDecoration: 'none' }}>
                            <ExternalLink size={11} />View
                          </a>
                        )}
                      </div>
                      <p style={{ fontSize: 12.5, color: '#555', margin: '0 0 6px', lineHeight: 1.6 }}>{cs.description}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <ChevronRight size={12} color="#16a34a" />
                        <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 500 }}>{cs.outcome}</span>
                      </div>
                      {cs.tech_stack?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                          {cs.tech_stack.map((t, ti) => (
                            <span key={ti} style={{ fontSize: 11, background: '#ede9fe', color: '#6d28d9', borderRadius: 4, padding: '2px 7px', fontWeight: 500 }}>{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* Questions */}
            <Section
              id={4} num={4} heading={output.questions.heading}
              badge={{ text: `${output.questions.items.length} questions`, color: '#2563eb' }}
              disabled={disabled} regenLoadingId={regenLoadingId} onRegenerate={onRegenerate}
            >
              {(() => {
                const items = sectionOverrides[4]
                  ? parseQuestions(sectionOverrides[4])
                  : output.questions.items;
                return items.length > 0 ? (
                  <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {items.map((q, i) => (
                      <li key={i} style={{ fontSize: 13.5, color: '#444', lineHeight: 1.65 }}>{q}</li>
                    ))}
                  </ol>
                ) : (
                  <p style={{ fontSize: 13.5, lineHeight: 1.78, color: '#444', margin: 0, whiteSpace: 'pre-wrap' }}>{sectionOverrides[4]}</p>
                );
              })()}
            </Section>

          </div>
        ) : (
          /* ── Legacy flat section fallback ── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {proposal.sections.map((section, i) => (
              <Section
                key={section.id}
                id={section.id} num={i + 1} heading={section.title}
                badge={{ text: 'Ready', color: '#7c3aed' }}
                disabled={disabled} regenLoadingId={regenLoadingId} onRegenerate={onRegenerate}
              >
                <p style={{ fontSize: 13.5, lineHeight: 1.78, color: '#444', margin: 0, whiteSpace: 'pre-wrap' }}>
                  {section.content}
                </p>
              </Section>
            ))}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px', borderTop: '1px solid #ebebeb', background: '#fff', flexShrink: 0, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Loader2 size={15} color="#aaa" className="animate-spin-slow" />
          <span style={{ fontSize: 12.5, color: '#888' }}>4 Sections</span>
        </div>
        <Sep />
        <Stat>~{wordCount} Words</Stat>
        <Sep />
        <Stat>Tone: {tone}</Stat>

        {proposal.metadata?.clickup_task_url && (
          <>
            <Sep />
            <a
              href={proposal.metadata.clickup_task_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500, color: '#7c3aed', textDecoration: 'none', border: '1px solid #ddd6fe', borderRadius: 6, padding: '3px 9px', background: '#f5f3ff' }}
            >
              <ExternalLink size={11} />
              View in ClickUp
            </a>
          </>
        )}

        <div style={{ flex: 1 }} />
        <ApprovalControls status={proposal.status} proposal={proposal} onApprove={onApprove} />
      </div>
    </div>
  );
}

// ─── Markdown content parsers ────────────────────────────────────────────────

/** Parses '**Title**: description' lines into step objects */
function parseProjectPlanSteps(text: string): Array<{ title: string; description: string }> {
  const steps: Array<{ title: string; description: string }> = [];
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Match **Title**: description  OR  **Title**  (no colon)
    const m = trimmed.match(/^\*\*(.+?)\*\*[:\s]*(.*)$/);
    if (m) {
      steps.push({ title: m[1].trim(), description: m[2].trim() });
    }
  }
  return steps;
}

/** Parses '1. question text' lines into plain string array */
function parseQuestions(text: string): string[] {
  return text
    .split('\n')
    .map(l => l.trim().replace(/^\d+\.\s*/, '').trim())
    .filter(q => q.length > 0);
}

// ─── Section accordion card ──────────────────────────────────────────────────

function Section({
  id, num, heading, badge, disabled, regenLoadingId, onRegenerate, children,
}: {
  id: number;
  num: number;
  heading: string;
  badge: { text: string; color: string };
  disabled?: boolean;
  regenLoadingId: number | null;
  onRegenerate: (id: number, ins: 'regenerate' | 'shorten' | 'expand') => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(true);
  const isThisLoading = regenLoadingId === id;
  const anyLoading = regenLoadingId !== null;

  return (
    <div style={{ border: '1px solid #ebebeb', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '13px 16px', cursor: 'pointer', userSelect: 'none', background: open ? '#fff' : '#fafafa' }}
      >
        <div style={{ width: 28, height: 28, borderRadius: 7, background: '#f4f4f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 600, color: '#555', flexShrink: 0 }}>
          {num}
        </div>
        <span style={{ fontSize: 14.5, fontWeight: 600, color: '#111', flex: 1 }}>{heading}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 500, color: badge.color }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: badge.color }} />
          {badge.text}
        </div>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {open && (
        <div style={{ padding: '0 16px 15px', borderTop: '1px solid #f0f0f0' }}>
          <div style={{ marginTop: 13 }}>{children}</div>
          <div style={{ display: 'flex', gap: 7, marginTop: 12 }}>
            <RegenBtn
              onClick={() => onRegenerate(id, 'regenerate')}
              disabled={disabled || anyLoading}
              loading={isThisLoading}
              label="Regenerate"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function RegenBtn({ onClick, disabled, loading, label }: { onClick: () => void; disabled?: boolean; loading: boolean; label: string }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick(); }}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '5px 12px', border: '1px solid #e2e8f0', borderRadius: 6,
        background: '#fff', color: '#555', fontSize: 12, fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif',
        opacity: disabled ? 0.6 : 1, transition: 'background 0.1s',
      }}
    >
      {loading ? (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 0.7s linear infinite' }}>
          <path d="M21 12a9 9 0 11-6.219-8.56" />
        </svg>
      ) : (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
          <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
        </svg>
      )}
      {label}
    </button>
  );
}

function HeaderBtn({ onClick, icon, label, danger }: { onClick: () => void; icon: React.ReactNode; label: string; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '5px 11px',
        border: danger ? '1px solid #fca5a5' : '1px solid #e2e8f0',
        borderRadius: 7,
        background: danger ? '#fff5f5' : '#fff',
        cursor: 'pointer',
        fontSize: 12, fontWeight: 500,
        color: danger ? '#dc2626' : '#555',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {icon} {label}
    </button>
  );
}
function Stat({ children }: { children: React.ReactNode }) {
  return <span style={{ fontSize: 12.5, color: '#888' }}>{children}</span>;
}
function Sep() {
  return <span style={{ fontSize: 12, color: '#ddd' }}>•</span>;
}
