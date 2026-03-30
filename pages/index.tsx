import React, { useState, useCallback, useEffect } from "react";
import Head from "next/head";
import Navbar from "@/components/Navbar";
import JobInputPanel from "@/components/JobInputPanel";
import ProposalPreview from "@/components/ProposalPreview";
import { agentApi, proposalsApi } from "@/lib/apiClient";
import type { Proposal, AgentStep, ProposalTone } from "@/types";
import { useRouter } from "next/router";

export default function ProposalWorkspace() {
  const router = useRouter();

  // ── form state ────────────────────────────────────────────────────────────
  const [jobDescription, setJobDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  const [client, setClient] = useState("");
  const [tone, setTone] = useState<ProposalTone>("Luxury");

  // ── agent state ───────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [regenLoadingId, setRegenLoadingId] = useState<number | null>(null);
  const [sectionOverrides, setSectionOverrides] = useState<Record<number, string>>({});
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const [error, setError] = useState("");

  // ── initial load from URL ──────────────────────────────────────────────────
  useEffect(() => {
    if (
      router.isReady &&
      router.query.id &&
      typeof router.query.id === "string"
    ) {
      const id = router.query.id;
      setLoading(true);
      proposalsApi
        .get(id)
        .then((p) => {
          setProposal(p);
          if (p.metadata) {
            if (p.metadata.client) setClient(p.metadata.client);
            if (p.metadata.budget) setBudget(p.metadata.budget);
            if (p.metadata.timeline) setTimeline(p.metadata.timeline);
            if (p.metadata.tone) setTone(p.metadata.tone as ProposalTone);
          }
        })
        .catch((err) => {
          setError(err.message || "Failed to load proposal from link.");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [router.isReady, router.query.id]);

  // ── generate ──────────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setError("");
    setProposal(null);
    setAgentSteps([]);
    setSectionOverrides({});

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
      setError(
        err instanceof Error ? err.message : "Failed to generate proposal.",
      );
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
      console.error("[approve]", err);
    }
  }, [proposal]);

  // ── reset ─────────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setProposal(null);
    setAgentSteps([]);
    setError("");
    setRegenLoadingId(null);
    setSectionOverrides({});
  }, []);

  // ── regen section ─────────────────────────────────────────────────────────
  const handleRegenerate = useCallback(
    async (
      sectionId: number,
      instruction: "regenerate" | "shorten" | "expand",
    ) => {
      if (!proposal) return;
      setRegenLoadingId(sectionId);

      try {
        const section = proposal.sections.find((s) => s.id === sectionId);
        if (!section) return;

        const newContent = await proposalsApi.regenerateSection(proposal.id, {
          sectionTitle: section.title,
          originalContent: section.content,
          instruction,
          jobContext: `${client} — ${budget} — ${timeline}`,
        });

        setProposal((prev): Proposal | null => {
          if (!prev) return null;
          // Update flat sections array (used by legacy view + section-1 override in rich view)
          const updatedSections = prev.sections.map((s) =>
            s.id === sectionId ? { ...s, content: newContent } : s,
          );
          // Spread metadata so it's always defined (Proposal.metadata is required)
          const updatedMetadata = { ...prev.metadata };
          // Only introduction has a typed `content` field in ProposalOutput
          if (sectionId === 1 && updatedMetadata.proposal_output) {
            updatedMetadata.proposal_output = {
              ...updatedMetadata.proposal_output,
              introduction: {
                ...updatedMetadata.proposal_output.introduction,
                content: newContent,
              },
            };
          }
          return { ...prev, sections: updatedSections, metadata: updatedMetadata };
        });
        // Store plain-text override so all sections reflect regenerated content on screen
        setSectionOverrides((prev) => ({ ...prev, [sectionId]: newContent }));
      } catch (err) {
        console.error("[regenerate]", err);
      } finally {
        setRegenLoadingId(null);
      }
    },
    [proposal, client, budget, timeline],
  );

  const isReadOnly =
    !!router.query.id ||
    proposal?.status === "approved" ||
    proposal?.status === "rejected";

  return (
    <>
      <Head>
        <title>Drafter ai — Proposal Workspace</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="icon"
          href={`data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <rect width="24" height="24" rx="4" fill="black"/>
      <path d="M12 2L2 7l10 5 10-5-10-5z" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M2 12l10 5 10-5" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M2 17l10 5 10-5" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `)}`}
        />
      </Head>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          background: "#f5f5f5",
          overflow: "hidden",
        }}
      >
        <Navbar />

        {/* error banner */}
        {error && (
          <div
            style={{
              background: "#fee2e2",
              color: "#dc2626",
              padding: "9px 20px",
              fontSize: 13,
              borderBottom: "1px solid #fca5a5",
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
            display: "flex",
            gap: 16,
            padding: 16,
            overflow: "hidden",
            minHeight: 0,
          }}
        >
          {/* LEFT — input */}
          <JobInputPanel
            jobDescription={jobDescription}
            setJobDescription={setJobDescription}
            budget={budget}
            setBudget={setBudget}
            timeline={timeline}
            setTimeline={setTimeline}
            client={client}
            setClient={setClient}
            tone={tone}
            setTone={setTone}
            onGenerate={handleGenerate}
            loading={loading}
            disabled={isReadOnly}
          />

          {/* RIGHT — preview */}
          <div
            style={{
              flex: 1,
              background: "#fff",
              borderRadius: 12,
              border: "1px solid #ebebeb",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
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
              regenLoadingId={regenLoadingId}
              sectionOverrides={sectionOverrides}
              disabled={isReadOnly}
              onApprove={handleApprove}
              onRegenerate={handleRegenerate}
              onReset={router.query.id ? undefined : handleReset}
            />
          </div>
        </div>
      </div>
    </>
  );
}
