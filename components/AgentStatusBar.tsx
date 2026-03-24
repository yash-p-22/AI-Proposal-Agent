import React from 'react';
import { CheckCircle2, XCircle, Clock3, AlertTriangle, SkipForward } from 'lucide-react';
import type { AgentStep, AgentStepStatus } from '@/types';

interface Props {
  steps: AgentStep[];
}

const STATUS_CONFIG: Record<
  AgentStepStatus,
  { bg: string; color: string; Icon: React.ComponentType<{ size?: number | string }> }
> = {
  done:    { bg: '#dcfce7', color: '#15803d', Icon: CheckCircle2 },
  error:   { bg: '#fee2e2', color: '#dc2626', Icon: XCircle },
  pending: { bg: '#fef3c7', color: '#b45309', Icon: Clock3 },
  warning: { bg: '#fef3c7', color: '#b45309', Icon: AlertTriangle },
  skipped: { bg: '#f3f4f6', color: '#6b7280', Icon: SkipForward },
};

export default function AgentStatusBar({ steps }: Props) {
  if (!steps.length) return null;

  return (
    <div
      style={{
        background: '#18181b',
        borderRadius: 10,
        padding: '11px 14px',
        marginBottom: 14,
        border: '1px solid #27272a',
      }}
    >
      <p
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: '#71717a',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          margin: '0 0 9px',
        }}
      >
        Agent Pipeline
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {steps.map(s => {
          const cfg = STATUS_CONFIG[s.status];
          const { Icon } = cfg;
          return (
            <div
              key={s.step}
              title={s.error}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: cfg.bg,
                color: cfg.color,
                borderRadius: 5,
                padding: '3px 8px',
                fontSize: 11,
                fontWeight: 500,
              }}
            >
              <Icon size={10} />
              {s.step}. {s.name}
            </div>
          );
        })}
      </div>
    </div>
  );
}
