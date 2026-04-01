<div align="center">

# 🔗 IntegrateIQ

### AI-Powered Integration Configuration & Orchestration Engine

*Transform requirement documents into production-ready integration configurations — eliminate manual integration bottlenecks.*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)

</div>

---

## 🌟 Overview

**IntegrateIQ** is an enterprise-grade platform that converts Business Requirement Documents (BRDs) into fully orchestrated integration configurations for lending platforms. It uses AI-assisted parsing, adapter matching, field mapping, and simulation — all governed by audit trails, rollback history, and tenant-aware workspace settings.

Designed for fintech teams who need to onboard new integration providers quickly without manually writing boilerplate configuration or chasing down field mappings across teams.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 📄 **BRD Upload & Parse** | Upload `.txt` / `.pdf` requirement documents. AI extracts providers, fields, compliance notes, and service categories. |
| 🔌 **Adapter Catalog** | Browse pre-built adapters for credit bureaus (CIBIL), KYC (Aadhaar eKYC), payments (Razorpay), GST verification, and more. |
| �� **AI Field Mapping** | Auto-generates source → target field mappings with confidence scores. Human review and override supported. |
| ⚙️ **Config Generation** | Produces deployment-ready JSON configuration from matched adapters and confirmed mappings. |
| 🧪 **Simulation Workspace** | Execute dry-run API simulations with latency measurement, request/response inspection, and pass/fail status. |
| 📋 **Audit Log & Governance** | Full event timeline with filtering, payload inspection, CSV and PDF export. |
| 🔄 **History & Rollback** | Version-controlled configuration snapshots with one-click rollback capability. |
| 🎨 **Tenant Settings** | Theme (dark/light), accent palette, layout density, motion preferences, tenant branding — all persisted and applied globally. |
| 🔔 **Real-time Notifications** | Live audit event streaming via Supabase Realtime subscriptions. |
| 📊 **Export & Reporting** | Dashboard and audit exports in PDF and Markdown formats. |

---

## 🏗️ Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  React SPA   │────▶│  Supabase Edge   │────▶│  PostgreSQL DB  │
│  (Vite + TS) │     │  Functions       │     │  (RLS Enabled)  │
└─────────────┘     └──────────────────┘     └─────────────────┘
       │                     │
       │              ┌──────┴──────┐
       │              │ AI Parsing  │
       │              │ & Matching  │
       │              └─────────────┘
       │
  ┌────┴────┐
  │ Zustand │  (Global state + localStorage persistence)
  └─────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript 5, Vite 5 |
| **Styling** | Tailwind CSS 3 with custom design tokens |
| **State** | Zustand with localStorage persistence |
| **Data Fetching** | TanStack React Query |
| **Animation** | Framer Motion |
| **Charts** | Recharts |
| **Backend** | Supabase (PostgreSQL, Edge Functions, Realtime) |
| **PDF Generation** | jsPDF |
| **Routing** | React Router 6 |

---

## 🗄️ Database Schema

| Table | Purpose |
|---|---|
| `tenants` | Multi-tenant workspace isolation |
| `documents` | Uploaded BRDs with parsed results |
| `adapters` | Integration adapter registry (provider, category, schemas) |
| `adapter_versions` | Versioned adapter endpoints with auth type and samples |
| `integration_configs` | Generated configuration payloads per document-adapter pair |
| `field_mappings` | AI-suggested source→target field mappings with confidence |
| `config_history` | Immutable configuration snapshots for rollback |
| `simulations` | Dry-run execution records with latency and status |
| `audit_logs` | Complete platform event trail |

---

## ⚡ Edge Functions

| Function | Purpose |
|---|---|
| `parse-document` | Extracts entities, providers, and compliance notes from BRD text |
| `match-adapters` | Maps parsed services to adapter catalog entries |
| `generate-config` | Produces integration config JSON from matched adapters |
| `simulate` | Executes dry-run simulation with mock payloads |
| `rollback-config` | Restores a previous configuration snapshot |
| `seed-demo-data` | Populates realistic demo records for demonstrations |

---

## 🔄 Working Flow

```
1. Upload  ──▶  2. Parse  ──▶  3. Match  ──▶  4. Configure  ──▶  5. Simulate  ──▶  6. Govern
```

1. **Upload** — Drop a BRD document (`.txt` or `.pdf`)
2. **Parse** — AI extracts integration requirements, providers, mandatory fields, compliance notes
3. **Match** — System matches requirements to adapter catalog with confidence scoring
4. **Configure** — Review AI field mappings, confirm or override, generate final config
5. **Simulate** — Run dry-run API calls, inspect latency, validate payloads
6. **Govern** — Audit trail tracks every action; rollback to any previous config version

---

## 🔒 Security

- **Row-Level Security (RLS)** enabled on all database tables
- **Tenant-scoped data isolation** via `tenant_id` foreign keys throughout
- **Edge Functions** use service role for controlled mutations only
- **Client UI** restricted to read-only access patterns
- **Sensitive operations** logged in tamper-evident audit trail
- **No PII exposure** — all personal data stays within tenant boundaries

---

## 📁 Project Structure

```
integrateiq-suite/
├── src/
│   ├── components/
│   │   ├── dashboard/       # MetricCard, DashboardSection, ContributionMatrix
│   │   ├── layout/          # AppLayout, Header, Sidebar, Logo, NotificationDrawer
│   │   └── ui/              # Reusable UI primitives (shadcn/ui based)
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utilities (supabase client, reporting, helpers)
│   ├── pages/               # Route-level page components
│   ├── stores/              # Zustand global state
│   └── integrations/        # Auto-generated Supabase types
├── supabase/
│   ├── functions/           # Edge Functions (Deno runtime)
│   └── migrations/          # Database migration SQL files
└── public/                  # Static assets
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com/) project

### Installation

```bash
# Clone the repository
git clone https://github.com/Ayushkr018/integrateiq-suite.git
cd integrateiq-suite

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Fill in your Supabase credentials in .env

# Start development server
npm run dev
```

### Build for Production

```bash
npm run build
npm run preview
```

### Run Tests

```bash
npm run test
```

---

## ⚙️ Environment Variables

Create a `.env` file in the project root with the following:

| Variable | Required | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | ✅ | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous/public key |

### Supabase Edge Function Secrets

Set these in your Supabase project dashboard under **Settings → Edge Functions**:

| Secret | Required | Purpose |
|---|---|---|
| `AI_API_KEY` | Optional | OpenAI-compatible API key for AI-powered document parsing |

> **Note:** If `AI_API_KEY` is not set, the platform falls back to a keyword-based rule engine for document parsing — all features remain fully functional.

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

Proprietary — Internal enterprise tool. All rights reserved.

---

<div align="center">
Built with ❤️ for enterprise fintech teams
</div>
