import jsPDF from 'jspdf';

interface MetricSummary {
  integrations: number;
  adapters: number;
  simulations: number;
  confidence: number;
}

interface AuditEntry {
  action: string;
  entity_type?: string | null;
  created_at?: string | null;
  payload?: unknown;
}

interface CategoryEntry {
  name: string;
  value: number;
}

interface ProjectReportPayload {
  tenantName: string;
  tenantSlug: string;
  metrics: MetricSummary;
  auditLogs: AuditEntry[];
  adaptersByCategory: CategoryEntry[];
  settings: {
    theme: string;
    accent: string;
    density: string;
    motionEnabled: boolean;
  };
}

const EDGE_FUNCTIONS = [
  'parse-document',
  'match-adapters',
  'generate-config',
  'simulate',
  'rollback-config',
  'seed-demo-data',
];

const PLATFORM_FEATURES = [
  'Intent-driven BRD parsing for enterprise lending integrations',
  'AI-assisted adapter discovery, mapping review, and config generation',
  'Simulation workspace for payload validation and latency observation',
  'Audit trail and rollback support for operational governance',
  'Tenant-aware settings for appearance, notifications, and workspace identity',
];

function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function buildLines(payload: ProjectReportPayload) {
  const now = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  return [
    '# IntegrateIQ Detailed Project Report',
    `Generated: ${now}`,
    '',
    '## Workspace Identity',
    `- Tenant Name: ${payload.tenantName}`,
    `- Tenant Slug: ${payload.tenantSlug}`,
    `- Theme: ${payload.settings.theme}`,
    `- Accent Palette: ${payload.settings.accent}`,
    `- Density: ${payload.settings.density}`,
    `- Motion Enabled: ${payload.settings.motionEnabled ? 'Yes' : 'No'}`,
    '',
    '## Executive Summary',
    'IntegrateIQ is an AI-assisted Integration Configuration & Orchestration Engine focused on enterprise lending flows. It converts requirement intent into adapter selection, AI mappings, simulation, governance history, and deployment-ready configuration workflows.',
    '',
    '## Live Metrics',
    `- Total Integrations: ${payload.metrics.integrations}`,
    `- Active Adapters: ${payload.metrics.adapters}`,
    `- Simulations Run: ${payload.metrics.simulations}`,
    `- Average AI Confidence: ${payload.metrics.confidence}%`,
    '',
    '## Key Features',
    ...PLATFORM_FEATURES.map((feature) => `- ${feature}`),
    '',
    '## Edge Functions',
    ...EDGE_FUNCTIONS.map((fn) => `- ${fn}`),
    '',
    '## Adapter Category Breakdown',
    ...payload.adaptersByCategory.map((entry) => `- ${entry.name}: ${entry.value}`),
    '',
    '## Working Flow',
    '1. Upload BRD / lending requirements document',
    '2. Parse entities, compliance notes, providers, and required fields',
    '3. Match suitable adapters and versions',
    '4. Review AI mapping confidence and generated configuration',
    '5. Simulate requests/responses and inspect latency',
    '6. Use audit + history pages for governance and rollback',
    '',
    '## Recent Operational History',
    ...payload.auditLogs.slice(0, 12).map((log, index) => `- ${index + 1}. ${log.action.replace(/_/g, ' ')} • ${log.entity_type ?? 'entity'} • ${log.created_at ?? 'n/a'}`),
    '',
    '## Security & Compliance Notes',
    '- Row-level security is enabled across the data model.',
    '- Client UI reads approved data, while mutations flow through controlled logic and auditing.',
    '- Cryptography dashboard highlights encryption posture for enterprise review.',
    '',
    '## UX / Settings Coverage',
    '- Theme, accent palette, density, motion preference, tenant identity, and notification preferences are persisted and applied across the workspace.',
    '- Export options now support PDF for reporting surfaces, not just a single file type.',
    '',
    '## Conclusion',
    'The project is positioned as a polished enterprise demo with reporting, governance visibility, configurable workspace behavior, and a more human-crafted interface system.',
  ];
}

export function downloadProjectMarkdownReport(payload: ProjectReportPayload) {
  const markdown = buildLines(payload).join('\n');
  saveBlob(new Blob([markdown], { type: 'text/markdown' }), 'IntegrateIQ_Detailed_Report.md');
}

export function downloadProjectPdfReport(payload: ProjectReportPayload) {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const lines = buildLines(payload);
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 48;
  const lineHeight = 16;
  let cursorY = 60;

  // White professional background
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // Top accent bar
  pdf.setFillColor(99, 102, 241);
  pdf.rect(0, 0, pageWidth, 4, 'F');

  const ensurePage = (requiredHeight = lineHeight) => {
    if (cursorY + requiredHeight <= pageHeight - margin) return;
    pdf.addPage();
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    pdf.setFillColor(99, 102, 241);
    pdf.rect(0, 0, pageWidth, 4, 'F');
    cursorY = 48;
  };

  lines.forEach((line) => {
    const isTitle = line.startsWith('# ');
    const isHeading = line.startsWith('## ');
    const content = line.replace(/^#+\s*/, '');

    if (!content) {
      cursorY += 8;
      return;
    }

    if (isTitle) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(22);
      pdf.setTextColor(17, 24, 39);
    } else if (isHeading) {
      cursorY += 6;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(99, 102, 241);
    } else if (content.startsWith('- ') || content.match(/^\d+\./)) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(55, 65, 81);
    } else {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(31, 41, 55);
    }

    const wrapped = pdf.splitTextToSize(content, pageWidth - margin * 2);
    ensurePage(wrapped.length * lineHeight + 8);
    pdf.text(wrapped, margin, cursorY);
    cursorY += wrapped.length * lineHeight + (isTitle ? 14 : isHeading ? 8 : 5);
  });

  // Footer on each page
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(156, 163, 175);
    pdf.text(`IntegrateIQ — Page ${i} of ${totalPages}`, margin, pageHeight - 24);
    pdf.text(new Date().toLocaleDateString(), pageWidth - margin - 60, pageHeight - 24);
  }

  pdf.save('IntegrateIQ_Detailed_Report.pdf');
}

export function downloadAuditPdf(logs: AuditEntry[]) {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 48;
  let cursorY = 60;

  // White professional background
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  pdf.setFillColor(99, 102, 241);
  pdf.rect(0, 0, pageWidth, 4, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.setTextColor(17, 24, 39);
  pdf.text('Audit Log Export', margin, cursorY);
  cursorY += 28;

  pdf.setFontSize(9);
  pdf.setTextColor(107, 114, 128);
  pdf.text(`Generated: ${new Date().toLocaleString()}  •  ${logs.length} entries`, margin, cursorY);
  cursorY += 20;

  const addPage = () => {
    pdf.addPage();
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    pdf.setFillColor(99, 102, 241);
    pdf.rect(0, 0, pageWidth, 4, 'F');
    cursorY = 48;
  };

  logs.forEach((log, index) => {
    const entry = `${index + 1}. ${log.action.replace(/_/g, ' ')} | ${log.entity_type ?? 'entity'} | ${log.created_at ?? 'n/a'}`;
    const details = JSON.stringify(log.payload ?? {}, null, 2);
    const lines = [...pdf.splitTextToSize(entry, pageWidth - margin * 2), ...pdf.splitTextToSize(details, pageWidth - margin * 2 - 12)];
    if (cursorY + lines.length * 14 > pageHeight - margin) addPage();

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(31, 41, 55);
    pdf.text(lines[0], margin, cursorY);
    cursorY += 16;

    if (lines.length > 1) {
      pdf.setFont('courier', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(107, 114, 128);
      pdf.text(lines.slice(1), margin + 10, cursorY);
      cursorY += (lines.length - 1) * 11 + 12;
    } else {
      cursorY += 10;
    }
  });

  // Footer
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(156, 163, 175);
    pdf.text(`IntegrateIQ Audit — Page ${i} of ${totalPages}`, margin, pageHeight - 24);
  }

  pdf.save('IntegrateIQ_Audit_Log.pdf');
}
