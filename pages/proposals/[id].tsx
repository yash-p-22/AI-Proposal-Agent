import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Check, X, FileText } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { proposalsApi } from '@/lib/apiClient';
import type { Proposal } from '@/types';

export default function ProposalPage() {
  const router  = useRouter();
  const { id, action } = router.query;

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [acting,   setActing]   = useState(false);
  const [done,     setDone]     = useState('');

  useEffect(() => {
    if (!id || typeof id !== 'string') return;
    proposalsApi.get(id)
      .then(setProposal)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  // Auto-trigger approve/reject from query param (Slack links)
  useEffect(() => {
    if (!proposal || acting || done) return;
    if (action === 'approve') handleApprove();
    if (action === 'reject')  handleReject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposal, action]);

  async function handleApprove() {
    if (!proposal) return;
    setActing(true);
    try {
      const updated = await proposalsApi.approve(proposal.id);
      setProposal(updated);
      setDone('approved');
    } finally { setActing(false); }
  }

  async function handleReject() {
    if (!proposal) return;
    setActing(true);
    try {
      const updated = await proposalsApi.reject(proposal.id);
      setProposal(updated);
      setDone('rejected');
    } finally { setActing(false); }
  }

  return (
    <>
      <Head><title>Proposal Review — Drafter.ai</title></Head>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f5f5f5' }}>
        <Navbar />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          {loading ? (
            <p style={{ color: '#888', fontSize: 14 }}>Loading proposal…</p>
          ) : !proposal ? (
            <p style={{ color: '#888', fontSize: 14 }}>Proposal not found.</p>
          ) : (
            <div
              style={{
                background: '#fff', borderRadius: 16, border: '1px solid #ebebeb',
                padding: '36px 40px', maxWidth: 620, width: '100%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
                <div style={{ width: 42, height: 42, background: '#f4f4f5', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={20} color="#555" />
                </div>
                <div>
                  <h1 style={{ fontSize: 18, fontWeight: 700, color: '#111', margin: 0 }}>
                    Proposal Review
                  </h1>
                  <p style={{ fontSize: 12.5, color: '#888', margin: 0 }}>
                    {proposal.metadata?.client} &bull; {proposal.metadata?.budget} &bull; {proposal.metadata?.timeline}
                  </p>
                </div>
              </div>

              {/* sections preview */}
              {proposal.sections.slice(0, 2).map(s => (
                <div key={s.id} style={{ marginBottom: 18, padding: '14px 16px', background: '#fafafa', borderRadius: 9, border: '1px solid #f0f0f0' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#111', margin: '0 0 6px' }}>{s.title}</p>
                  <p style={{ fontSize: 13, color: '#555', lineHeight: 1.7, margin: 0 }}>
                    {s.content.slice(0, 260)}{s.content.length > 260 ? '…' : ''}
                  </p>
                </div>
              ))}

              {/* actions */}
              {done ? (
                <div
                  style={{
                    padding: '16px 20px', borderRadius: 10, textAlign: 'center',
                    background: done === 'approved' ? '#dcfce7' : '#fee2e2',
                    color:      done === 'approved' ? '#15803d' : '#dc2626',
                    fontSize: 14, fontWeight: 600, marginTop: 6,
                  }}
                >
                  {done === 'approved' ? '✓ Proposal approved!' : '✕ Proposal rejected.'}
                </div>
              ) : proposal.status !== 'awaiting_approval' ? (
                <div
                  style={{
                    padding: '14px 20px', borderRadius: 10, textAlign: 'center',
                    background: '#f4f4f5', color: '#888',
                    fontSize: 13, fontWeight: 500,
                  }}
                >
                  This proposal has already been {proposal.status}.
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                  <button
                    onClick={handleReject}
                    disabled={acting}
                    style={{
                      flex: 1, padding: '12px', border: '1px solid #fca5a5',
                      borderRadius: 9, background: '#fff', color: '#dc2626',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    <X size={15} /> Reject
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={acting}
                    style={{
                      flex: 2, padding: '12px', border: 'none',
                      borderRadius: 9, background: '#111', color: '#fff',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    <Check size={15} /> Approve Proposal
                  </button>
                </div>
              )}

              <div style={{ marginTop: 20, textAlign: 'center' }}>
                <Link href="/" style={{ fontSize: 12.5, color: '#888', textDecoration: 'none' }}>
                  ← Back to workspace
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
