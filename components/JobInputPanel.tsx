import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import type { ProposalTone } from '@/types';

const TONES: ProposalTone[] = ['Luxury', 'Professional', 'Minimal', 'Casual'];

interface Props {
  jobDescription: string;
  setJobDescription: (v: string) => void;
  budget: string;
  setBudget: (v: string) => void;
  timeline: string;
  setTimeline: (v: string) => void;
  client: string;
  setClient: (v: string) => void;
  tone: ProposalTone;
  setTone: (v: ProposalTone) => void;
  onGenerate: () => void;
  loading: boolean;
  disabled?: boolean;
}

const inputBase: React.CSSProperties = {
  width: '100%',
  border: '1.5px solid #e8e8e8',
  borderRadius: 8,
  padding: '9px 11px',
  fontSize: 13,
  color: '#222',
  fontFamily: 'Inter, sans-serif',
  background: '#fff',
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

export default function JobInputPanel({
  jobDescription, setJobDescription,
  budget, setBudget,
  timeline, setTimeline,
  client, setClient,
  tone, setTone,
  onGenerate, loading, disabled,
}: Props) {
  const canGenerate = jobDescription.trim().length > 0 && !loading && !disabled;

  const currentInputBase = {
    ...inputBase,
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? 'not-allowed' : 'text',
    background: disabled ? '#f5f5f5' : '#fff',
  };

  return (
    <aside
      style={{
        width: 338,
        minWidth: 300,
        flexShrink: 0,
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #ebebeb',
        padding: '22px 18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        height: '100%',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111', margin: 0, marginBottom: 4 }}>
          Job Post Input
        </h2>
        <p style={{ fontSize: 12.5, color: '#888', lineHeight: 1.55, margin: 0 }}>
          Fill in the details below to generate a tailored proposal.
        </p>
      </div>

      {/* Job Description */}
      <div>
        <Label>
          Job Description<span style={{ color: '#e53e3e', marginLeft: 2 }}>*</span>
        </Label>
        <textarea
          value={jobDescription}
          onChange={e => setJobDescription(e.target.value)}
          placeholder="Describe the project, required skills, features, and expectations..."
          rows={6}
          disabled={disabled}
          style={{ ...currentInputBase, resize: 'none', lineHeight: 1.65 }}
        />
      </div>

      {/* Budget + Timeline */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <Label>Budget</Label>
          <input
            type="text"
            value={budget}
            onChange={e => setBudget(e.target.value)}
            placeholder="$4,500"
            disabled={disabled}
            style={currentInputBase}
          />
        </div>
        <div>
          <Label>Timeline</Label>
          <input
            type="text"
            value={timeline}
            onChange={e => setTimeline(e.target.value)}
            placeholder="3 weeks"
            disabled={disabled}
            style={currentInputBase}
          />
        </div>
      </div>

      {/* Client */}
      <div>
        <Label>Client / Company</Label>
        <input
          type="text"
          value={client}
          onChange={e => setClient(e.target.value)}
          placeholder="Enter client/company name "
          disabled={disabled}
          style={currentInputBase}
        />
      </div>

      {/* Tone */}
      <div>
        <Label>Proposal Tone</Label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {TONES.map(t => (
            <button
              key={t}
              onClick={() => setTone(t)}
              disabled={disabled}
              style={{
                padding: '5px 13px',
                borderRadius: 20,
                fontSize: 12.5,
                fontWeight: 500,
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, sans-serif',
                border: tone === t ? '1.5px solid #111' : '1.5px solid #e0e0e0',
                background: tone === t ? '#111' : '#fff',
                color: tone === t ? '#fff' : '#555',
                opacity: disabled ? 0.6 : 1,
                transition: 'all 0.15s',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 12.5, color: '#888', marginTop: "25px" }}>
          GENERATING WITH GEMINI 2.5 FLASH MODEL
        </p>
      </div>

      {/* Generate */}
      <button
        onClick={onGenerate}
        disabled={!canGenerate}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: !canGenerate ? '#ccc' : '#111',
          color: '#fff',
          border: 'none',
          borderRadius: 10,
          fontSize: 13.5,
          fontWeight: 600,
          cursor: canGenerate ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          fontFamily: 'Inter, sans-serif',
          transition: 'background 0.2s',
        }}
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Generating…
          </>
        ) : (
          <>
            <Sparkles size={15} />
            Generate Proposal
          </>
        )}
      </button>
    </aside>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label
      style={{
        display: 'block',
        fontSize: 12.5,
        fontWeight: 500,
        color: '#444',
        marginBottom: 5,
      }}
    >
      {children}
    </label>
  );
}
