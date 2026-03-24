/**
 * Seed sample case studies into Supabase.
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register scripts/seed.ts
 *
 * Or compile + run:
 *   npx tsc --outDir dist scripts/seed.ts && node dist/scripts/seed.js
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createCaseStudy } from '../lib/firebaseService';

const SAMPLES = [
  {
    title:       'E-Commerce SaaS Dashboard',
    description: 'Built a full-stack React + Node.js dashboard with real-time analytics, user authentication, and Stripe payment integration for a US-based SaaS startup.',
    skills:      ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Stripe', 'AWS'],
    industry:    'SaaS / E-Commerce',
    results:     '40% faster load times, 99.9% uptime, $2M ARR enabled',
    tags:        ['saas', 'dashboard', 'analytics', 'full-stack', 'react', 'nodejs'],
  },
  {
    title:       'Healthcare Patient Portal',
    description: 'Developed a HIPAA-compliant patient portal with appointment scheduling, telemedicine video, EHR integration, and role-based access control.',
    skills:      ['React', 'Python', 'Django', 'PostgreSQL', 'WebRTC', 'Docker'],
    industry:    'Healthcare',
    results:     'Reduced no-shows by 35%, serving 50,000+ patients monthly',
    tags:        ['healthcare', 'portal', 'hipaa', 'react', 'python', 'fullstack'],
  },
  {
    title:       'Fintech Mobile App',
    description: 'Designed and built a cross-platform React Native fintech app with biometric auth, real-time transaction feeds, budget tracking, and Open Banking API integration.',
    skills:      ['React Native', 'TypeScript', 'Node.js', 'GraphQL', 'Plaid API', 'Firebase'],
    industry:    'Fintech',
    results:     '4.8★ App Store rating, 100K+ downloads in 6 months',
    tags:        ['fintech', 'mobile', 'react-native', 'graphql', 'banking', 'typescript'],
  },
  {
    title:       'Real-Time Analytics Platform',
    description: 'Architected a scalable event-streaming analytics platform handling 50M+ events/day using Kafka, ClickHouse, and a React-based visualisation layer.',
    skills:      ['React', 'Python', 'Kafka', 'ClickHouse', 'Redis', 'Kubernetes', 'TypeScript'],
    industry:    'Data / Analytics',
    results:     'Sub-second query latency at 50M events/day, 60% infra cost reduction',
    tags:        ['analytics', 'data', 'kafka', 'clickhouse', 'react', 'realtime'],
  },
  {
    title:       'AI-Powered Content Platform',
    description: 'Built a Next.js + OpenAI content generation platform with semantic search, user personalisation, Stripe subscriptions, and a multi-tenant architecture.',
    skills:      ['Next.js', 'TypeScript', 'OpenAI', 'PostgreSQL', 'Stripe', 'Vercel'],
    industry:    'AI / SaaS',
    results:     '200% increase in content production, 3,000 paid subscribers in 90 days',
    tags:        ['ai', 'nextjs', 'openai', 'saas', 'typescript', 'content'],
  },
];

(async () => {
  console.log('🌱  Seeding case studies…');
  for (const cs of SAMPLES) {
    const created = await createCaseStudy(cs);
    console.log(`  ✓ ${created.title} (${created.id})`);
  }
  console.log('\n✅  Done. Seeded', SAMPLES.length, 'case studies.');
  process.exit(0);
})();
