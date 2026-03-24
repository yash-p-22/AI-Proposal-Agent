import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  FileText, CheckCircle2, Clock3, TrendingUp,
  ArrowUpRight, Zap, Plus, ChevronDown, ChevronRight,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { proposalsApi, auditApi } from '@/lib/apiClient';
import type { Proposal, AuditLog } from '@/types';

// ─── helpers ─────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  approved:          { label: 'Approved', color: '#15803d', bg: '#dcfce7' },
  rejected:          { label: 'Rejected', color: '#dc2626', bg: '#fee2e2' },
  awaiting_approval: { label: 'Pending',  color: '#b45309', bg: '#fef3c7' },
  draft:             { label: 'Draft',    color: '#6b7280', bg: '#f3f4f6' },
};

const STEP_COLORS: Record<string, string> = {
  STEP_1_RECEIVE:  '#6366f1',
  STEP_2_PARSE:    '#0ea5e9',
  STEP_2_STORE:    '#0ea5e9',
  STEP_3_SEARCH:   '#d97706',
  STEP_5_GENERATE: '#16a34a',
  STEP_6_CLICKUP:  '#7c3aed',
  STEP_7_SLACK:    '#ec4899',
  STEP_8_APPROVAL: '#f59e0b',
  STEP_9_APPROVAL: '#16a34a',
  FATAL:           '#dc2626',
};

// ─── page ─────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [logs,      setLogs]      = useState<AuditLog[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [openRuns,  setOpenRuns]  = useState<Record<string, boolean>>({});

  useEffect(() => {
    Promise.all([proposalsApi.list(), auditApi.list(25)])
      .then(([p, l]) => { setProposals(p); setLogs(l); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const total     = proposals.length;
  const approved  = proposals.filter(p => p.status === 'approved').length;
  const pending   = proposals.filter(p => p.status === 'awaiting_approval').length;
  const rate      = total > 0 ? Math.round((approved / total) * 100) : 0;

  // Group logs into runs
  const runs: { id: string; client: string; timestamp: Date; logs: AuditLog[] }[] = [];
  let currentRun: { id: string; client: string; timestamp: Date; logs: AuditLog[] } | null = null;

  logs.forEach((log) => {
    const runId = (log.metadata as any)?.run_id;
    const client = (log.metadata as any)?.client || 'Unknown Business';

    let shouldStartNew = false;
    if (!currentRun) {
      shouldStartNew = true;
    } else {
      if (runId && currentRun.id === runId) {
        shouldStartNew = false;
      } else if (!runId && currentRun.id.startsWith('fallback-')) {
        const t1 = new Date(currentRun.logs[currentRun.logs.length - 1].timestamp).getTime();
        const t2 = new Date(log.timestamp).getTime();
        if (t1 - t2 > 120000) { 
          shouldStartNew = true;
        }
      } else {
        shouldStartNew = true;
      }
    }

    if (shouldStartNew) {
      currentRun = { id: runId || `fallback-${Math.random()}`, client, timestamp: new Date(log.timestamp), logs: [] };
      runs.push(currentRun);
    }
    
    currentRun!.logs.push(log);
    if ((log.metadata as any)?.client && currentRun!.client === 'Unknown Business') {
      currentRun!.client = (log.metadata as any)?.client;
    }
  });

  return (
    <>
      <Head>
        <title>Dashboard — Drafter.ai</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f5f5f5' }}>
        <Navbar />

        <main style={{ flex: 1, padding: '28px 28px 40px', width: '100%', maxWidth: '100%', margin: 0 }}>

          {/* page header */}
          <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111', margin: 0, marginBottom: 4 }}>
                Dashboard
              </h1>
              <p style={{ fontSize: 13.5, color: '#888', margin: 0 }}>
                Overview of your AI proposal agent activity
              </p>
            </div>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <button
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '9px 16px', background: '#111', color: '#fff',
                  border: 'none', borderRadius: 9, fontSize: 13,
                  fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                }}
              >
                <Plus size={14} />
                New Proposal
              </button>
            </Link>
          </div>

          {/* stat cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 14,
              marginBottom: 24,
            }}
          >
            <StatCard
              label="Total Proposals"
              value={loading ? '—' : String(total)}
              Icon={FileText}
              iconColor="#6366f1"
              iconBg="#eef2ff"
            />
            <StatCard
              label="Approved"
              value={loading ? '—' : String(approved)}
              Icon={CheckCircle2}
              iconColor="#16a34a"
              iconBg="#dcfce7"
            />
            <StatCard
              label="Pending Review"
              value={loading ? '—' : String(pending)}
              Icon={Clock3}
              iconColor="#d97706"
              iconBg="#fef3c7"
            />
            <StatCard
              label="Success Rate"
              value={loading ? '—' : `${rate}%`}
              Icon={TrendingUp}
              iconColor="#0ea5e9"
              iconBg="#e0f2fe"
            />
          </div>

          {/* two-column grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>

            {/* recent proposals */}
            <Card>
              <CardHeader title="Recent Proposals">
                <Link href="/" style={{ textDecoration: 'none' }}>
                  <span style={{ fontSize: 12, color: '#6366f1', fontWeight: 500 }}>+ New</span>
                </Link>
              </CardHeader>

              {loading ? (
                <EmptyMsg>Loading…</EmptyMsg>
              ) : proposals.length === 0 ? (
                <EmptyMsg>No proposals yet.</EmptyMsg>
              ) : (
                proposals.slice(0, 7).map(p => {
                  const cfg = STATUS_CFG[p.status] ?? STATUS_CFG.draft;
                  return (
                    <Link key={p.id} href={`/?id=${p.id}`} style={{ textDecoration: 'none' }}>
                      <div
                        style={{
                          display: 'flex', alignItems: 'center', gap: 11,
                          padding: '12px 18px', borderBottom: '1px solid #f5f5f5',
                          cursor: 'pointer', transition: 'background 0.1s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                        onMouseLeave={e => (e.currentTarget.style.background = '')}
                      >
                        <div
                          style={{
                            width: 30, height: 30, background: '#f4f4f5', borderRadius: 8,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}
                        >
                          <FileText size={13} color="#888" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#111', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.metadata?.client ?? 'Client'} — {p.metadata?.budget ?? 'TBD'}
                          </p>
                          <p style={{ fontSize: 11, color: '#aaa', margin: 0, marginTop: 1 }}>
                            {new Date(p.created_at).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <span
                          style={{
                            fontSize: 11, fontWeight: 600, padding: '2px 9px',
                            borderRadius: 12, background: cfg.bg, color: cfg.color,
                            flexShrink: 0,
                          }}
                        >
                          {cfg.label}
                        </span>
                        <ArrowUpRight size={13} color="#ccc" />
                      </div>
                    </Link>
                  );
                })
              )}
            </Card>

            {/* agent activity */}
            <Card>
              <CardHeader title="Agent Activity">
                <Link href="/audit" style={{ textDecoration: 'none' }}>
                  <span style={{ fontSize: 12, color: '#6366f1', fontWeight: 500 }}>View all</span>
                </Link>
              </CardHeader>

              <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                {loading ? (
                  <EmptyMsg>Loading…</EmptyMsg>
                ) : runs.length === 0 ? (
                  <EmptyMsg>No activity yet.</EmptyMsg>
                ) : (
                  runs.map((run, runIndex) => {
                    const isDefaultOpen = runIndex === 0;
                    const isOpen = openRuns[run.id] ?? isDefaultOpen;
                    return (
                      <div key={run.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                        
                        {/* Accordion Header */}
                        <div
                          onClick={() => setOpenRuns(prev => ({ ...prev, [run.id]: !isOpen }))}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '12px 18px', cursor: 'pointer', background: '#fafafa',
                            borderBottom: isOpen ? '1px solid #f5f5f5' : 'none',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {isOpen ? <ChevronDown size={14} color="#666" /> : <ChevronRight size={14} color="#666" />}
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{run.client}</span>
                          </div>
                          <span style={{ fontSize: 11, color: '#aaa' }}>
                            {run.logs.length} events &bull;{' '}
                            {run.timestamp.toLocaleTimeString('en-US', {
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {/* Accordion Body */}
                        {isOpen && (
                          <div style={{ padding: '4px 0', background: '#fff' }}>
                            {run.logs.map(log => (
                              <div
                                key={log.id}
                                style={{
                                  display: 'flex', gap: 12, padding: '8px 18px',
                                }}
                              >
                                <div
                                  style={{
                                    width: 6, height: 6, borderRadius: '50%',
                                    background: STEP_COLORS[log.agent_step] ?? '#9ca3af',
                                    marginTop: 6, flexShrink: 0,
                                  }}
                                />
                                <div style={{ flex: 1 }}>
                                  <p style={{ fontSize: 12, fontWeight: 600, color: '#111', margin: 0, textTransform: 'capitalize' }}>
                                    {log.action.replace(/_/g, ' ')}
                                  </p>
                                  <p style={{ fontSize: 10.5, color: '#aaa', margin: 0, marginTop: 2 }}>
                                    {log.agent_step} &bull;{' '}
                                    {new Date(log.timestamp).toLocaleTimeString('en-US', {
                                      hour: '2-digit', minute: '2-digit', second: '2-digit',
                                    })}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </Card>

            {/* approval queue */}
            <Card>
              <CardHeader title="Approval Queue">
                <span
                  style={{
                    fontSize: 11, fontWeight: 600, background: '#fef3c7',
                    color: '#b45309', borderRadius: 12, padding: '2px 9px',
                  }}
                >
                  {pending} pending
                </span>
              </CardHeader>

              {loading ? (
                <EmptyMsg>Loading…</EmptyMsg>
              ) : proposals.filter(p => p.status === 'awaiting_approval').length === 0 ? (
                <EmptyMsg>No proposals awaiting approval.</EmptyMsg>
              ) : (
                proposals
                  .filter(p => p.status === 'awaiting_approval')
                  .slice(0, 5)
                  .map(p => (
                    <Link key={p.id} href={`/?id=${p.id}`} style={{ textDecoration: 'none' }}>
                      <div
                        style={{
                          display: 'flex', alignItems: 'center', gap: 11,
                          padding: '12px 18px', borderBottom: '1px solid #f5f5f5', cursor: 'pointer',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                        onMouseLeave={e => (e.currentTarget.style.background = '')}
                      >
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#111', margin: 0 }}>
                            {p.metadata?.client ?? 'Client'} — {p.metadata?.budget ?? 'TBD'}
                          </p>
                          <p style={{ fontSize: 11, color: '#aaa', margin: 0, marginTop: 1 }}>
                            Created {new Date(p.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, background: '#fef3c7', color: '#b45309', borderRadius: 10, padding: '2px 9px' }}>
                          Pending
                        </span>
                      </div>
                    </Link>
                  ))
              )}
            </Card>

            {/* success metrics */}
            <Card>
              <CardHeader title="Proposal Metrics" />

              <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <MetricRow label="Total Generated" value={total} max={Math.max(total, 10)} color="#6366f1" />
                <MetricRow label="Approved"        value={approved} max={Math.max(total, 10)} color="#16a34a" />
                <MetricRow label="Rejected"        value={proposals.filter(p => p.status === 'rejected').length} max={Math.max(total, 10)} color="#dc2626" />
                <MetricRow label="Pending"         value={pending} max={Math.max(total, 10)} color="#d97706" />

                <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 14, marginTop: 2 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: '#888', fontWeight: 500 }}>Overall Success Rate</span>
                    <span style={{ fontSize: 20, fontWeight: 700, color: '#111' }}>{rate}%</span>
                  </div>
                  <div style={{ height: 6, background: '#f0f0f0', borderRadius: 99, marginTop: 8, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%', width: `${rate}%`,
                        background: 'linear-gradient(90deg, #6366f1, #818cf8)',
                        borderRadius: 99, transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                </div>
              </div>
            </Card>

          </div>
        </main>
      </div>
    </>
  );
}

// ─── sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label, value, Icon, iconColor, iconBg,
}: {
  label: string;
  value: string;
  Icon: React.ComponentType<{ size?: number | string; color?: string }>;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <div
      style={{
        background: '#fff', borderRadius: 12, border: '1px solid #ebebeb',
        padding: '18px 20px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 12.5, fontWeight: 500, color: '#888' }}>{label}</span>
        <div
          style={{
            width: 34, height: 34, borderRadius: 9,
            background: iconBg, color: iconColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Icon size={16} color={iconColor} />
        </div>
      </div>
      <p style={{ fontSize: 28, fontWeight: 700, color: '#111', margin: 0 }}>{value}</p>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#fff', borderRadius: 12,
        border: '1px solid #ebebeb', overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
}

function CardHeader({
  title, children,
}: { title: string; children?: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '15px 18px', borderBottom: '1px solid #f0f0f0',
      }}
    >
      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111', margin: 0 }}>{title}</h3>
      {children}
    </div>
  );
}

function EmptyMsg({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ padding: '28px 18px', textAlign: 'center', color: '#aaa', fontSize: 13, margin: 0 }}>
      {children}
    </p>
  );
}

function MetricRow({
  label, value, max, color,
}: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 12.5, color: '#666' }}>{label}</span>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: '#111' }}>{value}</span>
      </div>
      <div style={{ height: 5, background: '#f0f0f0', borderRadius: 99, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%', width: `${pct}%`,
            background: color, borderRadius: 99,
            transition: 'width 0.4s ease',
          }}
        />
      </div>
    </div>
  );
}
