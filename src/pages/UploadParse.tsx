import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, File, X, ArrowRight, AlertTriangle } from 'lucide-react';
import { callEdgeFunction, TENANT_ID } from '@/lib/supabase';
import { useAppStore } from '@/stores/appStore';
import { useNavigate } from 'react-router-dom';
import { GeometricSpinner } from '@/components/ui/GeometricSpinner';

const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } } };

const LOADING_MESSAGES = [
  'Parsing document structure...',
  'Identifying integration requirements...',
  'Detecting external services...',
  'Analyzing field requirements...',
  'Generating insights...',
];

const FILE_ICONS: Record<string, typeof FileText> = {
  'application/pdf': FileText,
  'text/plain': File,
};

export default function UploadParse() {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const { setParsedResult } = useAppStore();
  const navigate = useNavigate();

  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    setResult(null);
    setError('');
    // Extract text for TXT files
    if (f.type === 'text/plain' || f.name.endsWith('.txt')) {
      const text = await f.text();
      setExtractedText(text);
    } else {
      setExtractedText(`[${f.name}] — Binary file detected. Click "Analyze with AI" to process.`);
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const analyzeWithAI = async () => {
    if (!extractedText) return;
    setLoading(true);
    setError('');
    setLoadingMsg(0);

    const interval = setInterval(() => {
      setLoadingMsg((m) => (m + 1) % LOADING_MESSAGES.length);
    }, 1500);

    try {
      const data = await callEdgeFunction('parse-document', {
        tenant_id: TENANT_ID,
        document_text: extractedText,
        file_name: file?.name || 'document.txt',
      });
      const parsed = data.parsed_result || data;
      setResult(parsed);
      setParsedResult(parsed);
    } catch (e: any) {
      setError(e.message || 'Analysis failed');
    } finally {
      setLoading(false);
      clearInterval(interval);
    }
  };

  const removeFile = () => {
    setFile(null);
    setExtractedText('');
    setResult(null);
    setError('');
  };

  const proceedToMatch = () => {
    navigate('/configure');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <h1 className="text-[28px] font-bold tracking-[-0.04em] text-foreground">Upload & Parse</h1>
      <p className="text-sm text-muted-foreground mt-1">Extract integration requirements from your documents</p>

      <div className="mt-6" style={{ display: 'grid', gridTemplateColumns: result ? '40fr 60fr' : '1fr', gap: '24px' }}>
        {/* Left column - Upload */}
        <div className="space-y-4">
          {!file ? (
            <motion.div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`border-2 border-dashed transition-colors flex flex-col items-center justify-center cursor-pointer
                ${dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
              style={{ minHeight: 280 }}
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.pdf,.docx,.txt';
                input.onchange = (e) => {
                  const f = (e.target as HTMLInputElement).files?.[0];
                  if (f) handleFile(f);
                };
                input.click();
              }}
            >
              <motion.div
                animate={dragOver ? { scale: 1.1 } : { scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <Upload size={40} className="text-muted-foreground mb-4" />
              </motion.div>
              <span className="text-sm font-medium text-foreground">Drop your BRD, SOW, or API Spec here</span>
              <span className="text-xs text-muted-foreground mt-1">Supports PDF, DOCX, TXT — up to 10MB</span>
              <div className="flex gap-2 mt-4">
                {['PDF', 'DOCX', 'TXT'].map((t) => (
                  <span key={t} className="text-[10px] px-2 py-0.5 border border-border text-muted-foreground font-medium">{t}</span>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {/* File card */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border border-border bg-card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 flex items-center justify-center ${
                      file.name.endsWith('.pdf') ? 'bg-iq-red/10 text-iq-red' :
                      file.name.endsWith('.docx') ? 'bg-primary/10 text-primary' :
                      'bg-iq-green/10 text-iq-green'
                    }`}>
                      <FileText size={20} />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-foreground block truncate max-w-[200px]">{file.name}</span>
                      <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                  <button onClick={removeFile} className="p-1 hover:bg-accent text-muted-foreground">
                    <X size={14} />
                  </button>
                </div>
              </motion.div>

              {/* Text preview */}
              <div className="border border-border bg-card p-4 max-h-48 overflow-y-auto">
                <span className="label-text text-muted-foreground block mb-2">Extracted Text Preview</span>
                <pre className="text-xs font-mono text-foreground whitespace-pre-wrap leading-relaxed">
                  {extractedText.substring(0, 500)}{extractedText.length > 500 ? '...' : ''}
                </pre>
              </div>

              {/* Analyze button or loading */}
              {!loading && !result && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={analyzeWithAI}
                  className="w-full py-3 bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
                >
                  Analyze with AI
                  <ArrowRight size={16} />
                </motion.button>
              )}

              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border border-border bg-card p-6 flex flex-col items-center">
                  <GeometricSpinner size={40} />
                  <motion.span
                    key={loadingMsg}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-muted-foreground mt-4"
                  >
                    {LOADING_MESSAGES[loadingMsg]}
                  </motion.span>
                  <div className="w-full h-1 bg-muted mt-4 overflow-hidden">
                    <motion.div
                      className="h-full bg-primary"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                      style={{ width: '40%' }}
                    />
                  </div>
                </motion.div>
              )}

              {error && (
                <div className="border border-iq-red/30 bg-iq-red/5 p-4 text-sm text-iq-red flex items-start gap-2">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">Analysis failed</span>
                    <p className="text-xs mt-1 opacity-80">{error}</p>
                    <button onClick={analyzeWithAI} className="text-xs underline mt-2">Retry</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right column - Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-4"
            >
              {/* Summary */}
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="border border-border bg-card p-5">
                <span className="label-text text-iq-cyan">Document Intelligence</span>
                <p className="text-sm text-foreground mt-2 leading-relaxed">{result.summary}</p>
                <div className="mt-3">
                  <span className="text-xs px-2 py-1 bg-primary/10 text-primary font-medium">
                    {result.detected_services?.length || 0} integrations detected
                  </span>
                </div>
              </motion.div>

              {/* Detected Services */}
              <div className="space-y-3">
                <span className="label-text text-muted-foreground">Detected Services</span>
                {result.detected_services?.map((svc: any, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, rotateY: 90 }}
                    animate={{ opacity: 1, rotateY: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                    className="border border-border bg-card p-4 relative"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full" style={{
                      background: CATEGORY_BG[svc.category] || 'hsl(var(--iq-violet))',
                    }} />
                    <div className="pl-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">{svc.provider}</span>
                        <span className={`text-[10px] px-2 py-0.5 font-semibold ${svc.mandatory ? 'bg-iq-red/10 text-iq-red' : 'bg-iq-green/10 text-iq-green'}`}>
                          {svc.mandatory ? 'MANDATORY' : 'OPTIONAL'}
                        </span>
                      </div>
                      <span className="label-text text-muted-foreground mt-1 inline-block capitalize">{svc.category?.replace(/_/g, ' ')}</span>

                      {/* Confidence bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Confidence</span>
                          <span className="font-medium text-foreground">{Math.round((svc.confidence || 0) * 100)}%</span>
                        </div>
                        <div className="h-1.5 bg-muted overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(svc.confidence || 0) * 100}%` }}
                            transition={{ duration: 0.8, delay: i * 0.1 }}
                            className={`h-full ${
                              svc.confidence > 0.8 ? 'bg-iq-green' :
                              svc.confidence > 0.6 ? 'bg-iq-amber' : 'bg-iq-red'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Fields */}
                      {svc.mentioned_fields?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {svc.mentioned_fields.map((f: string) => (
                            <span key={f} className="text-[10px] px-1.5 py-0.5 border border-border text-muted-foreground">{f}</span>
                          ))}
                        </div>
                      )}

                      {svc.purpose && (
                        <p className="text-xs text-muted-foreground mt-2 italic">{svc.purpose}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Global Fields */}
              {result.global_fields?.length > 0 && (
                <div className="border border-border bg-card p-4">
                  <span className="label-text text-muted-foreground">Extracted Global Fields</span>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {result.global_fields.map((f: string, i: number) => (
                      <motion.span
                        key={f}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="text-xs px-2 py-1 border border-border text-foreground font-medium"
                      >
                        {f}
                      </motion.span>
                    ))}
                  </div>
                </div>
              )}

              {/* Compliance */}
              {result.compliance_notes?.length > 0 && (
                <div className="border-l-4 border-iq-amber bg-iq-amber/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={14} className="text-iq-amber" />
                    <span className="text-xs font-semibold text-iq-amber uppercase tracking-wider">Compliance Notes</span>
                  </div>
                  <ul className="space-y-1">
                    {result.compliance_notes.map((n: string, i: number) => (
                      <li key={i} className="text-xs text-foreground flex items-start gap-2">
                        <span className="text-muted-foreground mt-0.5">•</span>
                        {n}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* CTA */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={proceedToMatch}
                className="w-full py-3 bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2 glow-primary"
                animate={{ boxShadow: ['0 0 15px hsl(245 89% 70% / 0.2)', '0 0 25px hsl(245 89% 70% / 0.4)', '0 0 15px hsl(245 89% 70% / 0.2)'] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Proceed to Match Adapters
                <ArrowRight size={16} />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

const CATEGORY_BG: Record<string, string> = {
  credit_bureau: 'hsl(192,100%,50%)',
  kyc: 'hsl(160,100%,45%)',
  payment: 'hsl(245,89%,70%)',
  gst: 'hsl(38,100%,56%)',
  banking: 'hsl(195,100%,46%)',
  esign: 'hsl(348,100%,60%)',
};
