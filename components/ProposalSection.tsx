import React, { useState } from 'react';
import {
  ChevronUp, ChevronDown,
  RefreshCw, Minimize2, Maximize2,
  Loader2,
} from 'lucide-react';
import type { ProposalSection as ISection } from '@/types';

interface SectionBadge {
  text: string;
  color: string;
}

interface Props {
  section: ISection;
  index: number;
  badge: SectionBadge;
  regenLoading: boolean;
  disabled?: boolean;
  onRegenerate: (sectionId: number, instruction: 'regenerate' | 'shorten' | 'expand') => void;
}

const ACTIONS: Array<{
  label: string;
  instruction: 'regenerate' | 'shorten' | 'expand';
  Icon: React.ComponentType<{ size?: number | string }>;
}> = [
  { label: 'Regenerate', instruction: 'regenerate', Icon: RefreshCw },
];

export default function ProposalSection({
  section, index, badge, regenLoading, disabled, onRegenerate,
}: Props) {
  const [open, setOpen] = useState(true);

  return (
    <div
      style={{
        border: '1px solid #ebebeb',
        borderRadius: 10,
        overflow: 'hidden',
        background: '#fff',
        marginBottom: 10,
      }}
    >
      {/* ── Header ── */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 11,
          padding: '13px 16px',
          cursor: 'pointer',
          userSelect: 'none',
          background: open ? '#fff' : '#fafafa',
        }}
      >
        {/* number chip */}
        <div
          style={{
            width: 28, height: 28,
            borderRadius: 7,
            background: '#f4f4f5',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12.5, fontWeight: 600, color: '#555', flexShrink: 0,
          }}
        >
          {index + 1}
        </div>

        <span style={{ fontSize: 14.5, fontWeight: 600, color: '#111', flex: 1 }}>
          {section.title}
        </span>

        {/* badge */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 11.5, fontWeight: 500, color: badge.color,
          }}
        >
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: badge.color }} />
          {badge.text}
        </div>

        {open
          ? <ChevronUp size={15} color="#aaa" />
          : <ChevronDown size={15} color="#aaa" />}
      </div>

      {/* ── Body ── */}
      {open && (
        <div style={{ padding: '0 16px 15px', borderTop: '1px solid #f0f0f0' }}>
          <p
            style={{
              fontSize: 13.5,
              lineHeight: 1.78,
              color: '#444',
              whiteSpace: 'pre-wrap',
              margin: '13px 0 13px',
            }}
          >
            {section.content}
          </p>

          {/* action buttons */}
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {ACTIONS.map(({ label, instruction, Icon }) => (
              <button
                key={label}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRegenerate(section.id, instruction);
                }}
                disabled={regenLoading || disabled}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: 6,
                  background: '#fff',
                  color: '#555',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: (regenLoading || disabled) ? 'not-allowed' : 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  opacity: (regenLoading || disabled) ? 0.6 : 1,
                  transition: 'background 0.1s',
                }}
              >
                {regenLoading && instruction === 'regenerate'
                  ? <Loader2 size={10} className="animate-spin" />
                  : <Icon size={10} />
                }
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
