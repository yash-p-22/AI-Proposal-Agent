import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { LayoutDashboard, History, FileText } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();

  const isActive = (path: string) => router.pathname === path;

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f5f5f5', borderRadius: 24, padding: '4px 4px' }}>
        <NavPillBtn href="/dashboard" active={isActive('/dashboard')} icon={<LayoutDashboard size={14} />} label="" title="Dashboard" />
        <NavPillBtn href="/" active={isActive('/')} icon={<FileText size={14} />} label="Generate Proposal" title="Proposal Workspace" pill />
        <NavPillBtn href="/audit" active={isActive('/audit')} icon={<History size={14} />} label="" title="Audit Logs" />
      </div>

      <div style={{ flex: 1 }} />
    </nav>
  );
}

function NavPillBtn({
  href, active, icon, label, title, pill,
}: {
  href: string; active: boolean; icon: React.ReactNode;
  label?: string; title?: string; pill?: boolean;
}) {
  return (
    <Link href={href} title={title} style={{ textDecoration: 'none' }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: pill ? '6px 14px' : '6px 10px',
          borderRadius: 20,
          background: active ? '#111' : 'transparent',
          color: active ? '#fff' : '#666',
          fontSize: 13, fontWeight: 500,
          cursor: 'pointer', transition: 'all 0.15s',
          whiteSpace: 'nowrap',
        }}
      >
        {icon}
        {label && <span>{label}</span>}
      </div>
    </Link>
  );
}
