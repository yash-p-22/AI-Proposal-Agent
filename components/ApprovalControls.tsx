import React from 'react';
import { Check, X, Send } from 'lucide-react';
import type { Proposal, ProposalStatus } from '@/types';

interface Props {
  status: ProposalStatus;
  proposal?: Proposal | null;
  onApprove: () => void;
}

function buildMailtoHref(proposal?: Proposal | null): string {
  const subject = proposal?.metadata?.client
    ? `Proposal for ${proposal.metadata.client}`
    : 'Proposal';
  const body = proposal?.proposal_text ?? '';
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default function ApprovalControls({ status, proposal, onApprove }: Props) {
  const handleSend = () => {
    window.location.href = buildMailtoHref(proposal);
  };

  if (status === 'approved') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#16a34a', fontSize: 13, fontWeight: 600 }}>
          <Check size={14} />
          Approved
        </div>
        <Btn onClick={handleSend} icon={<Send size={12} />} label="Send" filled />
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#dc2626', fontSize: 13, fontWeight: 600 }}>
        <X size={14} />
        Rejected
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
      <Btn
        onClick={onApprove}
        icon={<Check size={12} />}
        label="Approve"
        color="#16a34a"
        borderColor="#86efac"
      />
      <Btn
        onClick={handleSend}
        icon={<Send size={12} />}
        label="Send"
        filled
      />
    </div>
  );
}

function Btn({
  onClick, icon, label, color, borderColor, filled,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  color?: string;
  borderColor?: string;
  filled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '7px 13px',
        border: `1px solid ${borderColor ?? (filled ? '#111' : '#e2e8f0')}`,
        borderRadius: 8,
        background: filled ? '#111' : '#fff',
        color: filled ? '#fff' : (color ?? '#555'),
        fontSize: 12.5, fontWeight: 500,
        cursor: 'pointer', fontFamily: 'Inter, sans-serif',
        transition: 'background 0.1s',
      }}
    >
      {icon}
      {label}
    </button>
  );
}
