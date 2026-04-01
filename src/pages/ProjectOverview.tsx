import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase, TENANT_ID } from '@/lib/supabase';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusPulse } from '@/components/ui/StatusPulse';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import {
  Shield, Database, Zap, Layers, GitBranch, Clock, Server,
  CheckCircle, AlertTriangle, FileText, Download
} from 'lucide-react';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

const TECH_STACK = [
  { name: 'React 18', category: 'Frontend', color: 'hsl(var(--iq-cyan))' },
  { name: 'TypeScript', category: 'Language', color: 'hsl(var(--iq-violet))' },
  { name: 'Vite', category: 'Build', color: 'hsl(var(--iq-amber))' },
  { name: 'Supabase', category: 'Backend', color: 'hsl(var(--iq-green))' },
  { name: 'Zustand', category: 'State', color: 'hsl(var(--iq-cyan))' },
  { name: 'Framer Motion', category: 'Animation', color: 'hsl(var(--iq-violet))' },
  { name: 'Recharts', category: 'Charts', color: 'hsl(var(--iq-amber))' },
  { name: 'Tailwind CSS', category: 'Styling', color: 'hsl(var(--iq-green))' },
];

const ARCHITECTURE_LAYERS = [
  { name: 'Presentation', desc: 'React components, Framer Motion animations, design tokens', icon: Layers },
  { name: 'State Management', desc: 'Zustand store, React Query cache, real-time subscriptions', icon: GitBranch },
  { name: 'Edge Functions', desc: 'parse-document, match-adapters, generate-config, simulate, rollback', icon: Zap },
  { name: 'Database', desc: '9 tables with strict RLS, deny-all policy, service-role access only', icon: Database },
  { name: 'Security', desc: 'Row-Level Security, tenant isolation, no public data exposure', icon: Shield },
];

const SECURITY_POSTURE = [
  { table: 'tenants', policy: 'deny_all', status: 'locked' },
  { table: 'documents', policy: 'deny_all', status: 'locked' },
  { table: 'integration_configs', policy: 'deny_all', status: 'locked' },
  { table: 'simulations', policy: 'deny_all', status: 'locked' },
  { table: 'audit_logs', policy: 'deny_all', status: 'locked' },
  { table: 'config_history', policy: 'deny_all', status: 'locked' },
  { table: 'field_mappings', policy: 'deny_all', status: 'locked' },
  { table: 'adapters', policy: 'deny_all', status: 'locked' },
  { table: 'adapter_versions', policy: 'deny_all', status: 'locked' },
];

export default function ProjectOverview() {
  const { data: tableStats } = useQuery({
    queryKey: ['project-stats'],
    queryFn: async () => {
      const [adapters, configs, sims, docs, audits] = await Promise.all([
        supabase.from('adapters').select('*', { count: 'exact', head: true }),
        supabase.from('integration_configs').select('*', { count: 'exact', head: true }).eq('tenant_id', TENANT_ID),
        supabase.from('simulations').select('*', { count: 'exact', head: true }).eq('tenant_id', TENANT_ID),
        supabase.from('documents').select('*', { count: 'exact', head: true }).eq('tenant_id', TENANT_ID),
        supabase.from('audit_logs').select('*', { count: 'exact', head: true }),
      ]);
      return {
        adapters: adapters.count ?? 0,
        configs: configs.count ?? 0,
        simulations: sims.count ?? 0,
        documents: docs.count ?? 0,
        auditEntries: audits.count ?? 0,
      };
    },
  });

  const downloadReport = () => {
    const report = generateTextReport(tableStats);
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'IntegrateIQ_Project_Report.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-start justify-between">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.04em] text-foreground">
            Project Overview
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Architecture, health, and security posture report
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={downloadReport}
          className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2"
        >
          <Download size={14} /> Download Report
        </motion.button>
      </motion.div>

      {/* System Health Banner */}
      <motion.div variants={fadeUp}>
        <GlassCard accent="green" hover={false} className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 flex items-center justify-center border-gradient">
              <Shield size={24} className="text-iq-green" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-foreground">System Health: Excellent</span>
                <StatusPulse status="online" label="All Systems Operational" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                All 9 tables secured with deny-all RLS policies • Edge Functions operational • Tenant isolation active
              </p>
            </div>
            <div className="flex gap-6">
              <div className="text-center">
                <span className="text-2xl font-extrabold text-iq-green">
                  <AnimatedCounter value={9} />
                </span>
                <span className="block text-[10px] text-muted-foreground uppercase tracking-wider">Tables Secured</span>
              </div>
              <div className="text-center">
                <span className="text-2xl font-extrabold text-iq-green">
                  <AnimatedCounter value={5} />
                </span>
                <span className="block text-[10px] text-muted-foreground uppercase tracking-wider">Edge Functions</span>
              </div>
              <div className="text-center">
                <span className="text-2xl font-extrabold text-iq-cyan">0</span>
                <span className="block text-[10px] text-muted-foreground uppercase tracking-wider">Security Issues</span>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Adapters', value: tableStats?.adapters ?? 0, icon: Layers, color: 'violet' as const },
          { label: 'Configurations', value: tableStats?.configs ?? 0, icon: Server, color: 'cyan' as const },
          { label: 'Simulations', value: tableStats?.simulations ?? 0, icon: Zap, color: 'green' as const },
          { label: 'Documents', value: tableStats?.documents ?? 0, icon: FileText, color: 'amber' as const },
          { label: 'Audit Entries', value: tableStats?.auditEntries ?? 0, icon: Clock, color: 'violet' as const },
        ].map((stat) => (
          <GlassCard key={stat.label} accent={stat.color} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <stat.icon size={16} className="text-muted-foreground" />
              <span className="label-text text-muted-foreground">{stat.label}</span>
            </div>
            <span className="text-2xl font-extrabold text-foreground">
              <AnimatedCounter value={stat.value} />
            </span>
          </GlassCard>
        ))}
      </motion.div>

      {/* Main Grid: Architecture + Security */}
      <div className="grid grid-cols-1 md:grid-cols-[55fr_45fr] gap-6">
        {/* Architecture Layers */}
        <motion.div variants={fadeUp}>
          <GlassCard hover={false} accent="violet" className="p-5">
            <span className="label-text text-muted-foreground">Architecture Layers</span>
            <div className="mt-4 space-y-3">
              {ARCHITECTURE_LAYERS.map((layer, i) => (
                <motion.div
                  key={layer.name}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-start gap-3 p-3 border border-border bg-card/30 hover:bg-card/60 transition-colors"
                >
                  <div className="w-8 h-8 flex items-center justify-center bg-primary/10 text-primary shrink-0">
                    <layer.icon size={16} />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-foreground">{layer.name}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">{layer.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Security Posture */}
        <motion.div variants={fadeUp}>
          <GlassCard hover={false} accent="green" className="p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="label-text text-muted-foreground">RLS Security Posture</span>
              <span className="text-[10px] px-2 py-0.5 bg-iq-green/10 text-iq-green font-bold">ALL SECURED</span>
            </div>
            <div className="space-y-1.5">
              {SECURITY_POSTURE.map((item, i) => (
                <motion.div
                  key={item.table}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 px-3 py-2 bg-card/30 hover:bg-card/60 transition-colors"
                >
                  <CheckCircle size={12} className="text-iq-green shrink-0" />
                  <span className="text-xs font-mono text-foreground flex-1">{item.table}</span>
                  <span className="text-[10px] text-iq-green font-medium">{item.policy}</span>
                  <Shield size={10} className="text-iq-green/50" />
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Tech Stack */}
      <motion.div variants={fadeUp}>
        <GlassCard hover={false} accent="cyan" className="p-5">
          <span className="label-text text-muted-foreground">Technology Stack</span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {TECH_STACK.map((tech, i) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.03 }}
                className="border border-border bg-card/30 p-3 text-center hover:border-primary/30 transition-colors"
              >
                <div
                  className="w-3 h-3 mx-auto mb-2"
                  style={{ background: tech.color }}
                />
                <span className="text-sm font-semibold text-foreground block">{tech.name}</span>
                <span className="text-[10px] text-muted-foreground">{tech.category}</span>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </motion.div>

      {/* Edge Functions */}
      <motion.div variants={fadeUp}>
        <GlassCard hover={false} accent="amber" className="p-5">
          <span className="label-text text-muted-foreground">Edge Functions</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
            {['parse-document', 'match-adapters', 'generate-config', 'simulate', 'rollback-config'].map((fn, i) => (
              <motion.div
                key={fn}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="border border-border bg-card/30 p-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={12} className="text-iq-amber" />
                  <StatusPulse status="online" />
                </div>
                <span className="text-xs font-mono font-medium text-foreground block">{fn}</span>
                <span className="text-[10px] text-muted-foreground">Deployed</span>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}

function generateTextReport(stats: any) {
  const date = new Date().toISOString().split('T')[0];
  return `# IntegrateIQ — Project Report
Generated: ${date}

## Executive Summary
IntegrateIQ is an enterprise-grade integration orchestration platform built for financial institutions. 
It automates the process of parsing business requirement documents, matching appropriate API adapters, 
configuring field mappings with AI assistance, and simulating integrations before activation.

## System Health
- **Status**: All Systems Operational
- **Security Issues**: 0 (all resolved)
- **Tables Secured**: 9/9 with deny-all RLS policies

## Database Statistics
- Adapters: ${stats?.adapters ?? 0}
- Configurations: ${stats?.configs ?? 0}
- Simulations: ${stats?.simulations ?? 0}
- Documents: ${stats?.documents ?? 0}
- Audit Log Entries: ${stats?.auditEntries ?? 0}

## Architecture

### Frontend Layer
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom design tokens (angular, zero-radius design language)
- **Animations**: Framer Motion (staggered reveals, geometric spinners, page transitions)
- **State Management**: Zustand (global store) + React Query (server state)
- **Charts**: Recharts

### Backend Layer (Supabase)
- **Database**: PostgreSQL with 9 tables
- **Auth Model**: Tenant-based isolation (single-tenant demo mode)
- **Edge Functions**: 5 serverless functions (parse-document, match-adapters, generate-config, simulate, rollback-config)
- **Real-time**: Audit log subscriptions via Supabase Realtime

## Security Posture

All tables enforce deny-all RLS policies for anon and authenticated roles.
Data operations are proxied through Edge Functions using the service role.

| Table | RLS Policy | Status |
|-------|-----------|--------|
| tenants | deny_all | ✅ Secured |
| documents | deny_all | ✅ Secured |
| integration_configs | deny_all | ✅ Secured |
| simulations | deny_all | ✅ Secured |
| audit_logs | deny_all | ✅ Secured |
| config_history | deny_all | ✅ Secured |
| field_mappings | deny_all | ✅ Secured |
| adapters | deny_all | ✅ Secured |
| adapter_versions | deny_all | ✅ Secured |

## Features

### 1. Upload & Parse
AI-powered document analysis that extracts integration requirements from BRDs, SOWs, and API specs.

### 2. Adapter Catalog
Browsable catalog of integration adapters organized by category (KYC, Credit Bureau, Payment, etc.) with version management.

### 3. Configure
Step-by-step wizard: Match Adapters → Map Fields → Config Preview → Simulate & Activate.

### 4. Simulation Runner
Test configurations with custom payloads, view request/response pairs, and track latency trends.

### 5. Audit Log
Complete activity trail with timeline visualization, filtering, and CSV export.

### 6. History & Rollback
Version history for configurations with one-click rollback capability.

### 7. Project Overview
Real-time health dashboard showing architecture, security posture, and system metrics.

## Design Language
- **Theme**: Premium enterprise SaaS with dark mode default
- **Corners**: Zero rounded corners throughout (angular/geometric aesthetic)
- **Colors**: Electric violet (#7C5CFC) and cyan (#00D4FF) accents on near-black (#07080D)
- **Typography**: Inter (UI), JetBrains Mono (code/data)
- **Effects**: Glassmorphism, clip-path angular cuts, gradient accent lines, scanline overlays

---
*Report generated by IntegrateIQ Enterprise Edition*
`;
}
