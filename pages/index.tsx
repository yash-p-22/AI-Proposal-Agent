import React, { useState, useCallback, useEffect } from 'react';
import Head from 'next/head';
import Navbar from '@/components/Navbar';
import JobInputPanel from '@/components/JobInputPanel';
import ProposalPreview from '@/components/ProposalPreview';
import { agentApi, proposalsApi } from '@/lib/apiClient';
import type { Proposal, AgentStep, ProposalTone } from '@/types';
import { useRouter } from 'next/router';

export default function ProposalWorkspace() {
  const router = useRouter();

  // ── form state ────────────────────────────────────────────────────────────
  const [jobDescription, setJobDescription] = useState('');
  const [budget,   setBudget]   = useState('$4,500');
  const [timeline, setTimeline] = useState('3 weeks');
  const [client,   setClient]   = useState('Acme Corp');
  const [tone,     setTone]     = useState<ProposalTone>('Luxury');

  // ── agent state ───────────────────────────────────────────────────────────
  const [loading,      setLoading]      = useState(false);
  const [regenLoading, setRegenLoading] = useState(false);
  const [proposal,     setProposal]     = useState<Proposal | null>(null);
  const [agentSteps,   setAgentSteps]   = useState<AgentStep[]>([]);
  const [error,        setError]        = useState('');

  // ── initial load from URL ──────────────────────────────────────────────────
  useEffect(() => {
    if (router.isReady && router.query.id && typeof router.query.id === 'string') {
      const id = router.query.id;
      setLoading(true);
      proposalsApi.get(id).then(p => {
        setProposal(p);
        if (p.metadata) {
          if (p.metadata.client) setClient(p.metadata.client);
          if (p.metadata.budget) setBudget(p.metadata.budget);
          if (p.metadata.timeline) setTimeline(p.metadata.timeline);
          if (p.metadata.tone) setTone(p.metadata.tone as ProposalTone);
        }
      }).catch(err => {
        setError(err.message || 'Failed to load proposal from link.');
      }).finally(() => {
        setLoading(false);
      });
    } else if (router.isReady && !router.query.id && !jobDescription) {
       // fallback default just in case it's a completely fresh start
       setJobDescription('We are looking for an experienced full-stack developer to build a SaaS dashboard with React and Node.js. The project includes user auth, analytics, and API integrations.');
    }
  }, [router.isReady, router.query.id]);

  // ── generate ──────────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setError('');
    setProposal(null);
    setAgentSteps([]);

    try {
      const result = await agentApi.run({
        raw_text: jobDescription,
        budget,
        timeline,
        client,
        tone,
      });
      setAgentSteps(result.steps ?? []);
      setProposal(result.proposal);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate proposal.');
    } finally {
      setLoading(false);
    }
  }, [jobDescription, budget, timeline, client, tone]);

  // ── approve / reject ──────────────────────────────────────────────────────
  const handleApprove = useCallback(async () => {
    if (!proposal) return;
    try {
      const updated = await proposalsApi.approve(proposal.id);
      setProposal(updated);
    } catch (err) {
      console.error('[approve]', err);
    }
  }, [proposal]);


  // ── regen section ─────────────────────────────────────────────────────────
  const handleRegenerate = useCallback(
    async (sectionId: number, instruction: 'regenerate' | 'shorten' | 'expand') => {
      if (!proposal) return;
      setRegenLoading(true);

      try {
        const section = proposal.sections.find(s => s.id === sectionId);
        if (!section) return;

        const newContent = await proposalsApi.regenerateSection(proposal.id, {
          sectionTitle:    section.title,
          originalContent: section.content,
          instruction,
          jobContext:      `${client} — ${budget} — ${timeline}`,
        });

        setProposal(prev =>
          prev
            ? {
                ...prev,
                sections: prev.sections.map(s =>
                  s.id === sectionId ? { ...s, content: newContent } : s,
                ),
              }
            : prev,
        );
      } catch (err) {
        console.error('[regenerate]', err);
      } finally {
        setRegenLoading(false);
      }
    },
    [proposal, client, budget, timeline],
  );

  const isReadOnly = !!router.query.id || (proposal?.status === 'approved' || proposal?.status === 'rejected');

  return (
    <>
      <Head>
        <title>Drafter.ai — Proposal Workspace</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          background: '#f5f5f5',
          overflow: 'hidden',
        }}
      >
        <Navbar />

        {/* error banner */}
        {error && (
          <div
            style={{
              background: '#fee2e2', color: '#dc2626',
              padding: '9px 20px', fontSize: 13, borderBottom: '1px solid #fca5a5',
              flexShrink: 0,
            }}
          >
            ⚠ {error}
          </div>
        )}

        {/* workspace */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            gap: 16,
            padding: 16,
            overflow: 'hidden',
            minHeight: 0,
          }}
        >
          {/* LEFT — input */}
          <JobInputPanel
            jobDescription={jobDescription} setJobDescription={setJobDescription}
            budget={budget}               setBudget={setBudget}
            timeline={timeline}           setTimeline={setTimeline}
            client={client}               setClient={setClient}
            tone={tone}                   setTone={setTone}
            onGenerate={handleGenerate}
            loading={loading}
            disabled={isReadOnly}
          />

          {/* RIGHT — preview */}
          <div
            style={{
              flex: 1,
              background: '#fff',
              borderRadius: 12,
              border: '1px solid #ebebeb',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              minWidth: 0,
            }}
          >
            <ProposalPreview
              proposal={proposal}
              agentSteps={agentSteps}
              loading={loading}
              client={client}
              budget={budget}
              timeline={timeline}
              tone={tone}
              regenLoading={regenLoading}
              disabled={isReadOnly}
              onApprove={handleApprove}
              onRegenerate={handleRegenerate}
            />
          </div>
        </div>
      </div>
    </>
  );
}
