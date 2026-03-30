import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { ArrowLeft, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { auditApi } from '@/lib/apiClient';
import type { AuditLog } from '@/types';

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

export default function AuditLogs() {
  const [logs,      setLogs]      = useState<AuditLog[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [openRuns,   setOpenRuns]   = useState<Record<string, boolean>>({});

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await auditApi.list(200);
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

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
        if (t1 - t2 > 120000) { // 2 minutes gap starts a new run
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
        <title>Audit Logs — Drafter ai</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f5f5f5' }}>
        <Navbar />

        <main style={{ flex: 1, padding: '28px 28px 40px', width: '100%', maxWidth: '100%', margin: 0 }}>
          {/* header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
            <Link href="/dashboard" style={{ textDecoration: 'none' }}>
              <button
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'none', border: '1px solid #e2e8f0',
                  borderRadius: 8, padding: '7px 12px',
                  fontSize: 13, color: '#555', cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                <ArrowLeft size={14} />
                Back
              </button>
            </Link>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', margin: 0 }}>Audit Logs</h1>
              <p style={{ fontSize: 13, color: '#888', margin: 0, marginTop: 2 }}>
                Every AI agent action is recorded here — {logs.length} entries
              </p>
            </div>
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: '#fff', border: '1px solid #e2e8f0',
                borderRadius: 8, padding: '7px 12px',
                fontSize: 13, color: '#555', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <RefreshCw size={13} style={{ animation: refreshing ? 'spin 0.75s linear infinite' : 'none' }} />
              Refresh
            </button>
          </div>

          {/* table */}
          <div
            style={{
              background: '#fff', borderRadius: 12,
              border: '1px solid #ebebeb', overflow: 'hidden',
            }}
          >


            {loading ? (
              <p style={{ padding: '40px 20px', textAlign: 'center', color: '#aaa', fontSize: 13 }}>
                Loading…
              </p>
            ) : runs.length === 0 ? (
              <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                <p style={{ fontSize: 14, color: '#666', fontWeight: 600, margin: 0 }}>No logs yet</p>
                <p style={{ fontSize: 13, color: '#aaa', margin: '6px 0 0' }}>
                  Generate a proposal to see agent activity here.
                </p>
              </div>
            ) : (
              runs.map((run, runIndex) => {
                const isDefaultOpen = runIndex === 0;
                const isOpen = openRuns[run.id] ?? isDefaultOpen;
                return (
                  <div key={run.id} style={{ borderBottom: runIndex < runs.length - 1 ? '1px solid #ebebeb' : 'none' }}>
                    
                    {/* Accordion Header */}
                    <div 
                      onClick={() => setOpenRuns(prev => ({ ...prev, [run.id]: !isOpen }))}
                      style={{
                        padding: '16px 20px', 
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        cursor: 'pointer', background: '#fafafa',
                        borderBottom: isOpen ? '1px solid #ebebeb' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {isOpen ? <ChevronDown size={18} color="#666" /> : <ChevronRight size={18} color="#666" />}
                        <span style={{ fontWeight: 600, fontSize: 15, color: '#111' }}>{run.client}</span>
                        <span style={{ fontSize: 12, color: '#aaa', marginLeft: 8 }}>
                          {run.timestamp.toLocaleString('en-US', {
                            month: 'short', day: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: '#888' }}>
                        {run.logs.length} events
                      </div>
                    </div>

                    {/* Accordion Body */}
                    {isOpen && (
                      <div style={{ background: '#fff' }}>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 140px 160px',
                            padding: '10px 20px',
                            background: '#fafafa',
                            borderBottom: '1px solid #ebebeb',
                            fontSize: 11.5, fontWeight: 600, color: '#888',
                            letterSpacing: '0.04em', textTransform: 'uppercase',
                          }}
                        >
                          <span>Action</span>
                          <span>Step</span>
                          <span>Timestamp</span>
                        </div>

                        {run.logs.map((log, i) => (
                          <div
                            key={log.id}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 140px 160px',
                              padding: '13px 20px',
                              borderBottom: i < run.logs.length - 1 ? '1px solid #f5f5f5' : 'none',
                              alignItems: 'start',
                            }}
                          >
                            {/* action + metadata */}
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                                <div
                                  style={{
                                    width: 7, height: 7, borderRadius: '50%',
                                    background: STEP_COLORS[log.agent_step] ?? '#9ca3af',
                                    flexShrink: 0, marginTop: 1,
                                  }}
                                />
                                <span
                                  style={{
                                    fontSize: 13, fontWeight: 600, color: '#111',
                                    textTransform: 'capitalize',
                                  }}
                                >
                                  {log.action.replace(/_/g, ' ')}
                                </span>
                              </div>
                              {Object.keys(log.metadata).length > 0 && (
                                <pre
                                  style={{
                                    fontSize: 11, color: '#888',
                                    background: '#f8f8f8', borderRadius: 6,
                                    padding: '5px 9px', overflow: 'auto',
                                    maxHeight: 90, margin: '4px 0 0 15px',
                                    fontFamily: 'monospace',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                  }}
                                >
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              )}
                            </div>

                            {/* step badge */}
                            <div>
                              <span
                                style={{
                                  fontSize: 10.5, fontWeight: 600,
                                  padding: '2px 8px', borderRadius: 5,
                                  background: '#f0f0f0', color: '#555',
                                  fontFamily: 'monospace',
                                }}
                              >
                                {log.agent_step}
                              </span>
                            </div>

                            {/* timestamp */}
                            <span style={{ fontSize: 12, color: '#aaa' }}>
                              {new Date(log.timestamp).toLocaleString('en-US', {
                                month:  'short', day: 'numeric',
                                hour:   '2-digit', minute: '2-digit', second: '2-digit',
                              })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </main>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
