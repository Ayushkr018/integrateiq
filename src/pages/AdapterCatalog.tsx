import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { GeometricSpinner } from '@/components/ui/GeometricSpinner';

const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

const CATEGORIES = ['All', 'credit_bureau', 'kyc', 'payment', 'gst', 'banking', 'esign'];

const CATEGORY_COLORS: Record<string, string> = {
  credit_bureau: 'hsl(192,100%,50%)',
  kyc: 'hsl(160,100%,45%)',
  payment: 'hsl(245,89%,70%)',
  gst: 'hsl(38,100%,56%)',
  banking: 'hsl(195,100%,46%)',
  esign: 'hsl(348,100%,60%)',
};

export default function AdapterCatalog() {
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: adapters, isLoading } = useQuery({
    queryKey: ['adapters-catalog'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('adapters')
        .select('*, adapter_versions(*)')
        .order('category');
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    if (!adapters) return [];
    return adapters.filter((a) => {
      const matchCat = activeTab === 'All' || a.category === activeTab;
      const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.provider.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [adapters, activeTab, search]);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-[28px] font-bold tracking-[-0.04em] text-foreground">Adapter Catalog</h1>
      <p className="text-sm text-muted-foreground mt-1">Browse and select integration adapters</p>

      {/* Search */}
      <div className="mt-6 relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search adapters..."
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border text-sm text-foreground outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground"
        />
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 mt-4 relative overflow-x-auto">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`relative px-3 py-1.5 text-xs font-medium transition-colors
              ${activeTab === cat ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {activeTab === cat && (
              <motion.div layoutId="tab-indicator" className="absolute inset-x-0 bottom-0 h-[2px] bg-primary" />
            )}
            <span className="capitalize">{cat.replace(/_/g, ' ')}</span>
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16"><GeometricSpinner size={40} /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {filtered.map((adapter, i) => {
            const versions = adapter.adapter_versions || [];
            const latest = versions.find((v: any) => !v.deprecated) || versions[0];
            const expanded = expandedId === adapter.id;
            const color = CATEGORY_COLORS[adapter.category] || 'hsl(var(--iq-violet))';

            return (
              <motion.div
                key={adapter.id}
                variants={fadeUp}
                initial="hidden"
                animate="show"
                transition={{ delay: i * 0.04 }}
                whileHover={{ y: -3 }}
                className={`border border-border bg-card relative group transition-shadow hover:shadow-lg`}
                style={{ '--glow-color': color } as any}
              >
                {/* Top accent */}
                <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: color }} />

                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-sm font-semibold text-foreground">{adapter.name}</span>
                      <span className="text-xs text-muted-foreground block mt-0.5">{adapter.provider}</span>
                    </div>
                    {/* Letter avatar */}
                    <div className="w-9 h-9 flex items-center justify-center text-sm font-bold text-white" style={{ background: color }}>
                      {adapter.provider?.[0]?.toUpperCase() || 'A'}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <span className="label-text px-1.5 py-0.5 border border-border capitalize" style={{ color }}>{adapter.category.replace(/_/g, ' ')}</span>
                  </div>

                  {/* Version chips */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {versions.map((v: any) => (
                      <span
                        key={v.id}
                        className={`text-[10px] px-1.5 py-0.5 font-medium border
                          ${v.deprecated ? 'border-iq-red/30 text-iq-red line-through' :
                            v.id === latest?.id ? 'border-iq-cyan/50 text-iq-cyan glow-cyan' : 'border-border text-muted-foreground'}`}
                      >
                        {v.version}
                        {v.id === latest?.id && !v.deprecated && <span className="ml-1 text-[8px] opacity-70">LATEST</span>}
                      </span>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span>{Object.keys(latest?.input_schema || {}).length} input fields</span>
                    <span>→</span>
                    <span>{Object.keys(latest?.output_schema || {}).length} output fields</span>
                  </div>

                  {/* Expand toggle */}
                  <button
                    onClick={() => setExpandedId(expanded ? null : adapter.id)}
                    className="mt-3 text-xs text-primary flex items-center gap-1 hover:underline"
                  >
                    {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    {expanded ? 'Hide Schema' : 'View Schema'}
                  </button>

                  <AnimatePresence>
                    {expanded && latest && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 space-y-3">
                          <div>
                            <span className="label-text text-muted-foreground">Input Schema</span>
                            <pre className="text-xs font-mono bg-muted/50 p-3 mt-1 overflow-x-auto text-foreground">
                              {JSON.stringify(latest.input_schema, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <span className="label-text text-muted-foreground">Output Schema</span>
                            <pre className="text-xs font-mono bg-muted/50 p-3 mt-1 overflow-x-auto text-foreground">
                              {JSON.stringify(latest.output_schema, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full py-16 text-center text-sm text-muted-foreground">
              No adapters found matching your criteria.
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
