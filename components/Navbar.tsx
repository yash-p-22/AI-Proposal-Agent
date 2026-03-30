import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { LayoutDashboard, History, FileText } from 'lucide-react';

// ─── Nav items config ────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'dashboard', href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'proposal',  href: '/',          icon: FileText,        label: 'Generate Proposal' },
  { id: 'audit',     href: '/audit',     icon: History,         label: 'Audit Logs' },
] as const;

type NavId = (typeof NAV_ITEMS)[number]['id'];

// ─── Component ────────────────────────────────────────────────────────────────
export default function Navbar() {
  const router = useRouter();
  const [expanded, setExpanded] = useState<NavId | null>(null);

  const isActive = (href: string) => router.pathname === href;

  const handleExpand = (id: NavId) => {
    setExpanded(prev => (prev === id ? null : id));
  };

  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        height: 56,
        background: '#fff',
        borderBottom: '1px solid #ebebeb',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        gap: 10,
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <Link href="#" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', flex: 1 }}>
        <div
          style={{
            width: 32, height: 32, background: '#111', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#111', letterSpacing: '-0.3px' }}>Drafter ai</span>
      </Link>

      {/* Nav centre pill */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f5f5f5', borderRadius: 24, padding: '4px 4px' }}
        onMouseLeave={() => setExpanded(null)}
      >
        {NAV_ITEMS.map(({ id, href, icon: Icon, label }) => (
          <ExpandableNavBtn
            key={id}
            href={href}
            icon={<Icon size={15} strokeWidth={2} />}
            label={label}
            active={isActive(href)}
            isExpanded={expanded === id}
            onExpand={() => setExpanded(id)}
          />
        ))}
      </div>

      <div style={{ flex: 1 }} />
    </nav>
  );
}

// ─── Expandable button ────────────────────────────────────────────────────────
interface ExpandableNavBtnProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  isExpanded: boolean;
  onExpand: () => void;
}

function ExpandableNavBtn({ href, icon, label, active, isExpanded, onExpand }: ExpandableNavBtnProps) {
  const labelRef = useRef<HTMLSpanElement>(null);

  // Show label when expanded OR when the route is active
  const showLabel = isExpanded || active;

  return (
    <Link
      href={href}
      title={label}
      style={{ textDecoration: 'none' }}
      onClick={onExpand}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: showLabel ? 6 : 0,
          padding: '6px 10px',
          borderRadius: 20,
          background: active ? '#111' : isExpanded ? '#e8e8e8' : 'transparent',
          color: active ? '#fff' : '#555',
          fontSize: 13,
          fontWeight: 500,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          transition: 'background 0.2s ease, color 0.2s ease, gap 0.25s ease',
        }}
        onMouseEnter={onExpand}
      >
        {/* Icon — always visible */}
        <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {icon}
        </span>

        {/* Label — animated slide-in */}
        <span
          ref={labelRef}
          style={{
            display: 'inline-block',
            maxWidth: showLabel ? 160 : 0,
            opacity: showLabel ? 1 : 0,
            overflow: 'hidden',
            /**
             * Reveal  : opacity leads (0→1 instant), then max-width expands
             * Collapse: opacity fades first (0.1s), then max-width collapses after a tiny delay
             */
            transition: showLabel
              ? 'max-width 0.25s ease 0.05s, opacity 0.15s ease'
              : 'opacity 0.1s ease, max-width 0.22s ease 0.08s',
          }}
        >
          {label}
        </span>
      </div>
    </Link>
  );
}
