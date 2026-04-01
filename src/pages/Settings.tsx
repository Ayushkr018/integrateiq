import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Key, Bell, Palette, Building2, Lock, Eye, EyeOff, Copy, Plus, Trash2, Check, Fingerprint, PanelsTopLeft, Sparkles } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { useToast } from '@/hooks/use-toast';

const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };

const TABS = [
  { id: 'tenant', icon: Building2, label: 'Tenant' },
  { id: 'vault', icon: Key, label: 'API Key Vault' },
  { id: 'crypto', icon: Fingerprint, label: 'Cryptography' },
  { id: 'notifications', icon: Bell, label: 'Notifications' },
  { id: 'theme', icon: Palette, label: 'Appearance' },
  { id: 'security', icon: Shield, label: 'Security' },
];

interface VaultKey {
  id: string;
  name: string;
  provider: string;
  maskedValue: string;
  created: string;
  status: 'active' | 'expired' | 'rotating';
}

const MOCK_KEYS: VaultKey[] = [
  { id: '1', name: 'CIBIL_API_KEY', provider: 'TransUnion CIBIL', maskedValue: 'sk-****7f3d', created: '2026-03-15', status: 'active' },
  { id: '2', name: 'EXPERIAN_SECRET', provider: 'Experian India', maskedValue: 'exp-****a9c2', created: '2026-03-10', status: 'active' },
  { id: '3', name: 'UIDAI_AUTH_KEY', provider: 'UIDAI (Aadhaar)', maskedValue: 'uid-****3e1f', created: '2026-02-28', status: 'rotating' },
  { id: '4', name: 'RAZORPAY_KEY_ID', provider: 'Razorpay', maskedValue: 'rzp_****8b4a', created: '2026-03-20', status: 'active' },
  { id: '5', name: 'GSTN_TOKEN', provider: 'GSTN Portal', maskedValue: 'gst-****d5e7', created: '2026-01-15', status: 'expired' },
];

const CRYPTO_ALGORITHMS = [
  { name: 'AES-256-GCM', type: 'Symmetric', strength: 'Very High', use: 'Data at Rest Encryption', status: 'active' },
  { name: 'RSA-2048', type: 'Asymmetric', strength: 'High', use: 'Key Exchange & Digital Signatures', status: 'active' },
  { name: 'SHA-256', type: 'Hash', strength: 'High', use: 'Data Integrity Verification', status: 'active' },
  { name: 'HMAC-SHA512', type: 'MAC', strength: 'Very High', use: 'API Request Authentication', status: 'active' },
  { name: 'ECDSA P-256', type: 'Asymmetric', strength: 'Very High', use: 'JWT Token Signing', status: 'active' },
  { name: 'PBKDF2', type: 'KDF', strength: 'High', use: 'Password Hashing', status: 'active' },
  { name: 'ChaCha20-Poly1305', type: 'AEAD', strength: 'Very High', use: 'Data in Transit Encryption', status: 'standby' },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('tenant');
  const {
    theme, accent, density, motionEnabled,
    tenantName, tenantSlug, notificationPrefs,
    setTheme, setAccent, setDensity, setMotionEnabled,
    updateTenantInfo, setNotificationPref,
  } = useAppStore();
  const { toast } = useToast();
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [tenantDraft, setTenantDraft] = useState({ tenantName, tenantSlug });

  const toggleKeyVisibility = (id: string) => setShowKey((s) => ({ ...s, [id]: !s[id] }));

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={fadeUp}>
        <h1 className="text-[28px] font-bold tracking-[-0.04em] text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Workspace preferences, security posture, and UI behavior applied globally</p>
      </motion.div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-[220px_1fr]">
        <motion.div variants={fadeUp} className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
          {TABS.map((tab) => (
            <motion.button key={tab.id} whileHover={{ x: 3 }} whileTap={{ scale: 0.97 }}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 md:gap-3 px-3 py-2 md:py-2.5 text-sm transition-all whitespace-nowrap shrink-0 md:w-full rounded-lg md:rounded-none
                ${activeTab === tab.id ? 'bg-accent text-foreground md:border-l-2 md:border-primary' : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'}`}>
              <tab.icon size={16} />
              {tab.label}
            </motion.button>
          ))}
        </motion.div>

        <div className="min-w-0">
          {/* Tenant */}
          {activeTab === 'tenant' && (
            <motion.div key="tenant" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <div className="surface-panel p-5">
                <span className="label-text text-muted-foreground">Tenant Information</span>
                <p className="mt-1 text-xs text-muted-foreground">Branding and identity set here reflect across header, sidebar, and exported reports.</p>
                <div className="mt-4 space-y-4">
                  {[
                    { label: 'Organization Name', value: tenantDraft.tenantName, field: 'tenantName', editable: true },
                    { label: 'Tenant ID', value: '00000000-0000-0000-0000-000000000001', editable: false },
                    { label: 'Slug', value: tenantDraft.tenantSlug, field: 'tenantSlug', editable: true },
                    { label: 'Plan', value: 'Enterprise', editable: false },
                    { label: 'Region', value: 'ap-south-1 (Mumbai)', editable: false },
                  ].map((f) => (
                    <div key={f.label} className="grid gap-2 grid-cols-1 sm:grid-cols-[160px_1fr]">
                      <span className="text-xs text-muted-foreground sm:py-2">{f.label}</span>
                      <input value={f.value} readOnly={!f.editable}
                        onChange={(event) => {
                          if (!f.editable || !("field" in f) || !f.field) return;
                          setTenantDraft((current) => ({ ...current, [f.field]: event.target.value }));
                        }}
                        className={`px-3 py-2 text-sm border border-border bg-transparent text-foreground outline-none
                          ${f.editable ? 'focus:border-primary/50 rounded-[16px]' : 'opacity-60 cursor-not-allowed rounded-[16px]'}`} />
                    </div>
                  ))}
                </div>
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    updateTenantInfo(tenantDraft);
                    toast({ title: 'Tenant settings applied globally' });
                  }}
                  className="mt-4 px-5 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-full shadow-lg shadow-primary/20">
                  Save Changes
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* API Key Vault */}
          {activeTab === 'vault' && (
            <motion.div key="vault" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <div className="surface-panel p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="label-text text-muted-foreground">Encrypted API Key Vault</span>
                    <p className="text-xs text-muted-foreground mt-1">AES-256-GCM encrypted • Keys never leave the vault</p>
                  </div>
                  <motion.button whileTap={{ scale: 0.97 }}
                    className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1.5">
                    <Plus size={12} /> Add Key
                  </motion.button>
                </div>
                <div className="space-y-2">
                  {MOCK_KEYS.map((k, i) => (
                    <motion.div key={k.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-4 p-3 border border-border hover:border-primary/20 transition-colors rounded-[18px]">
                      <Lock size={14} className="text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-medium text-foreground">{k.name}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 font-bold uppercase tracking-wider
                            ${k.status === 'active' ? 'bg-iq-green/10 text-iq-green' :
                              k.status === 'rotating' ? 'bg-iq-amber/10 text-iq-amber' : 'bg-iq-red/10 text-iq-red'}`}>
                            {k.status}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">{k.provider}</span>
                      </div>
                       <span className="hidden sm:inline text-xs font-mono text-muted-foreground shrink-0">{showKey[k.id] ? 'sk-live-7f3d9a2e' : k.maskedValue}</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => toggleKeyVisibility(k.id)} className="p-1.5 hover:bg-accent text-muted-foreground transition-colors">
                          {showKey[k.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                        <button onClick={() => { navigator.clipboard.writeText(k.maskedValue); toast({ title: 'Key copied' }); }}
                          className="p-1.5 hover:bg-accent text-muted-foreground transition-colors"><Copy size={12} /></button>
                        <button className="p-1.5 hover:bg-accent text-muted-foreground hover:text-iq-red transition-colors"><Trash2 size={12} /></button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Cryptography */}
          {activeTab === 'crypto' && (
            <motion.div key="crypto" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <div className="surface-panel p-5">
                <div className="flex items-center justify-between mb-1">
                  <span className="label-text text-muted-foreground">Cryptographic Engine</span>
                  <span className="text-[10px] text-iq-green font-medium flex items-center gap-1"><Shield size={10} /> FIPS 140-2 Compliant</span>
                </div>
                <p className="text-xs text-muted-foreground mb-4">Enterprise-grade encryption for all data at rest & in transit</p>
                <div className="space-y-2">
                  {CRYPTO_ALGORITHMS.map((algo, i) => (
                    <motion.div key={algo.name} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-4 p-3 border border-border hover:border-primary/20 transition-colors rounded-[18px]">
                      <div className={`w-8 h-8 flex items-center justify-center border
                        ${algo.status === 'active' ? 'border-iq-green/40 bg-iq-green/5' : 'border-border bg-muted/20'}`}>
                        <Fingerprint size={14} className={algo.status === 'active' ? 'text-iq-green' : 'text-muted-foreground'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-semibold text-foreground">{algo.name}</span>
                          <span className="text-[9px] px-1.5 py-0.5 border border-border text-muted-foreground">{algo.type}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{algo.use}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-[10px] font-bold ${algo.strength === 'Very High' ? 'text-iq-green' : 'text-iq-cyan'}`}>{algo.strength}</span>
                        <div className={`mt-1 text-[9px] font-medium uppercase tracking-wider
                          ${algo.status === 'active' ? 'text-iq-green' : 'text-muted-foreground'}`}>{algo.status}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              <div className="surface-panel p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={14} className="text-primary" />
                  <span className="text-sm font-medium text-foreground">Encryption Status</span>
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Data at Rest', value: 'AES-256', status: 'Encrypted' },
                    { label: 'Data in Transit', value: 'TLS 1.3', status: 'Secured' },
                    { label: 'Key Rotation', value: '90 days', status: 'Auto-rotate' },
                  ].map((item) => (
                    <div key={item.label} className="border border-border bg-card p-3">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</span>
                      <div className="text-sm font-bold text-foreground mt-1">{item.value}</div>
                      <span className="text-[10px] text-iq-green font-medium">{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Notification Preferences */}
          {activeTab === 'notifications' && (
            <motion.div key="notif" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <div className="surface-panel p-5">
                <span className="label-text text-muted-foreground">Notification Preferences</span>
                <p className="mt-1 text-xs text-muted-foreground">These toggles directly control the notification drawer and workspace alert behavior.</p>
                <div className="mt-4 space-y-3">
                  {[
                    { key: 'simComplete', label: 'Simulation Completed', desc: 'Get notified when a simulation finishes' },
                    { key: 'configChange', label: 'Configuration Changes', desc: 'Alerts on config create, update, or rollback' },
                    { key: 'securityAlert', label: 'Security Alerts', desc: 'Critical security and compliance notifications' },
                    { key: 'auditEvents', label: 'All Audit Events', desc: 'Every platform event (high volume)' },
                    { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Summary email every Monday' },
                    { key: 'slackWebhook', label: 'Slack Integration', desc: 'Post notifications to a Slack channel' },
                  ].map((pref) => (
                    <div key={pref.key} className="flex items-center justify-between p-3 border border-border hover:border-primary/20 transition-colors">
                      <div>
                        <span className="text-sm font-medium text-foreground">{pref.label}</span>
                        <span className="text-xs text-muted-foreground block mt-0.5">{pref.desc}</span>
                      </div>
                      <button
                        onClick={() => {
                          const key = pref.key as keyof typeof notificationPrefs;
                          setNotificationPref(key, !notificationPrefs[key]);
                        }}
                        className={`w-10 h-5 relative transition-colors rounded-full ${(notificationPrefs[pref.key as keyof typeof notificationPrefs]) ? 'bg-primary' : 'bg-muted'}`}>
                        <motion.div animate={{ x: (notificationPrefs[pref.key as keyof typeof notificationPrefs]) ? 20 : 2 }}
                          className="absolute top-0.5 w-4 h-4 bg-primary-foreground rounded-full" transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Theme/Appearance */}
          {activeTab === 'theme' && (
            <motion.div key="theme" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <div className="surface-panel p-5">
                <span className="label-text text-muted-foreground">Appearance</span>
                <p className="mt-1 text-xs text-muted-foreground">Theme, palette, density, and motion preferences update the entire app immediately.</p>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {[
                    { value: 'dark' as const, label: 'Dark Mode', desc: 'Default enterprise theme', icon: PanelsTopLeft },
                    { value: 'light' as const, label: 'Light Mode', desc: 'High-contrast light theme', icon: Sparkles },
                  ].map((opt) => (
                    <motion.button key={opt.value} whileTap={{ scale: 0.97 }}
                      onClick={() => setTheme(opt.value)}
                      className={`p-4 border text-left transition-all
                        ${theme === opt.value ? 'border-primary glow-primary rounded-[22px]' : 'border-border hover:border-primary/30 rounded-[22px]'}`}>
                      <div className="surface-panel w-full h-20 mb-3 flex items-end justify-between p-3">
                        <opt.icon size={18} className="text-primary" />
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-iq-violet rounded-full" />
                          <div className="w-2 h-2 bg-iq-cyan rounded-full" />
                          <div className="w-2 h-2 bg-iq-green rounded-full" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {theme === opt.value && <Check size={12} className="text-primary" />}
                        <span className="text-sm font-medium text-foreground">{opt.label}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{opt.desc}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
              <div className="surface-panel p-5 space-y-5">
                <span className="label-text text-muted-foreground">Accent Colors</span>
                <p className="mt-1 text-xs text-muted-foreground">Choose the primary accent used across actions, highlights, and badges.</p>
                <div className="mt-3 flex gap-3 flex-wrap">
                  {[
                    { name: 'Violet', value: 'violet', color: 'bg-iq-violet' },
                    { name: 'Cyan', value: 'cyan', color: 'bg-iq-cyan' },
                    { name: 'Green', value: 'green', color: 'bg-iq-green' },
                    { name: 'Amber', value: 'amber', color: 'bg-iq-amber' },
                    { name: 'Red', value: 'red', color: 'bg-iq-red' },
                  ].map((c) => (
                    <button key={c.name} onClick={() => setAccent(c.value as typeof accent)} className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-[18px] border ${accent === c.value ? 'border-primary' : 'border-border'}`}>
                      <div className={`w-8 h-8 ${c.color} border border-border/30 rounded-full`} />
                      <span className="text-[10px] text-muted-foreground">{c.name}</span>
                    </button>
                  ))}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <span className="label-text text-muted-foreground">Layout Density</span>
                    <p className="mt-1 text-xs text-muted-foreground">Choose how tightly content is packed across pages.</p>
                    <div className="mt-3 flex gap-2">
                      {(['comfortable', 'compact'] as const).map((mode) => (
                        <button key={mode} onClick={() => setDensity(mode)} className={`surface-chip px-4 py-2 text-sm ${density === mode ? 'border-primary text-foreground' : 'text-muted-foreground'}`}>
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="label-text text-muted-foreground">Motion System</span>
                    <p className="mt-1 text-xs text-muted-foreground">Toggle animations and transitions for the whole workspace.</p>
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => setMotionEnabled(true)} className={`surface-chip px-4 py-2 text-sm ${motionEnabled ? 'border-primary text-foreground' : 'text-muted-foreground'}`}>
                        Enabled
                      </button>
                      <button onClick={() => setMotionEnabled(false)} className={`surface-chip px-4 py-2 text-sm ${!motionEnabled ? 'border-primary text-foreground' : 'text-muted-foreground'}`}>
                        Reduced
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Security */}
          {activeTab === 'security' && (
            <motion.div key="security" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <div className="surface-panel p-5">
                <span className="label-text text-muted-foreground">Security Posture</span>
                <p className="mt-1 text-xs text-muted-foreground">A compact view of platform safeguards, runtime protections, and governance controls.</p>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'RLS Policies', value: '9 tables protected', status: 'success' as const },
                    { label: 'Edge Function Auth', value: 'Service role enforced', status: 'success' as const },
                    { label: 'Data Encryption', value: 'AES-256-GCM active', status: 'success' as const },
                    { label: 'SQL Injection', value: 'Parameterized queries', status: 'success' as const },
                    { label: 'API Rate Limiting', value: '100 req/min/tenant', status: 'success' as const },
                    { label: 'Audit Logging', value: 'All mutations logged', status: 'success' as const },
                  ].map((item) => (
                    <div key={item.label} className="p-3 border border-border rounded-[18px]">
                      <div className="flex items-center gap-2">
                        <Check size={12} className="text-iq-green" />
                        <span className="text-sm font-medium text-foreground">{item.label}</span>
                      </div>
                      <span className="text-xs text-muted-foreground ml-5">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
