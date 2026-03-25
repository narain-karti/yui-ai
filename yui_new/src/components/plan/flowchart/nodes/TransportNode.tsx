import { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Plane, Train, Car, Bus, AlertCircle, Clock, Zap, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';

const SUBTYPE_CONFIG: Record<string, any> = {
  flight: { icon: Plane, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/50', glow: 'shadow-blue-500/20' },
  train: { icon: Train, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/50', glow: 'shadow-emerald-500/20' },
  taxi: { icon: Car, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/50', glow: 'shadow-amber-500/20' },
  bus: { icon: Bus, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/50', glow: 'shadow-slate-500/20' },
};

export default memo(function TransportNode({ data, isConnectable }: any) {
  const [isHovered, setIsHovered] = useState(false);
  const cfg = SUBTYPE_CONFIG[data.subtype as string] || SUBTYPE_CONFIG.taxi;
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileHover={{ scale: 1.05, zIndex: 50 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={clsx(
        "relative min-w-[220px] rounded-2xl border bg-[#0A0A14]/90 backdrop-blur-xl transition-all duration-500",
        cfg.border, isHovered ? cfg.glow : 'shadow-xl shadow-black/50',
        "border-l-4"
      )}
      style={{ boxShadow: isHovered ? `0 0 30px ${cfg.accent}30` : '' }}
    >
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="!w-2 !h-2 !bg-white !border-none" />
      
      {/* Glow Effect on Hover */}
      {isHovered && (
        <motion.div
          layoutId="glow"
          className="absolute inset-0 rounded-2xl opacity-20 pointer-events-none"
          style={{ background: `radial-gradient(circle at center, ${cfg.accent}, transparent)` }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className={clsx("p-1.5 rounded-lg", cfg.bg)}>
            <Icon size={14} className={cfg.color} />
          </div>
          <span className="text-[10px] font-mono tracking-widest text-white/40 uppercase">{data.subtype}</span>
        </div>
        {data.status === 'ON TIME' ? (
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-bold text-emerald-400">LIVE</span>
          </div>
        ) : data.status === 'DELAYED' && (
          <div className="flex items-center gap-1">
            <AlertCircle size={10} className="text-red-400" />
            <span className="text-[9px] font-bold text-red-400">DELAYED</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-sm font-bold text-white mb-1 line-clamp-1">{data.label}</h3>
          <div className="flex items-center gap-2 text-[10px] text-white/40 font-mono">
            <Clock size={10} />
            <span>{data.departure} — {data.arrival}</span>
          </div>
        </div>

        <div className="flex items-center justify-between bg-black/40 rounded-xl px-3 py-2 border border-white/5">
          <div className="flex flex-col">
            <span className="text-[9px] text-white/30 uppercase tracking-tighter">Budget Est.</span>
            <span className="text-xs font-mono text-emerald-400">₹{data.cost?.toLocaleString()}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-white/30 uppercase tracking-tighter">Dur.</span>
            <span className="text-xs font-mono text-white/70">{data.duration || '2.5h'}</span>
          </div>
        </div>
      </div>

      {/* Expanded Details on Hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-4 border-t border-white/5 bg-black/20"
          >
            {/* Carrier/Details */}
            <div className="mt-3 space-y-3">
              {data.carrier && (
                <div className="text-[10px] text-white/60 bg-white/5 rounded-lg p-2 border border-white/5">
                  <span className="text-white/30 mr-2">Carrier:</span>
                  <span className="font-bold">{data.carrier}</span>
                </div>
              )}

              {/* Alternatives */}
              {data.alternatives && data.alternatives.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[9px] font-bold text-white/30 uppercase tracking-widest mt-4">
                    <Zap size={10} className="text-amber-400" /> Alternatives
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {data.alternatives.map((alt: any, i: number) => (
                      <motion.div
                        key={i}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center justify-between bg-white/5 hover:bg-white/10 p-2 rounded-lg border border-white/5 transition-colors group"
                      >
                        <div className="flex flex-col">
                          <span className="text-[10px] text-white/80 group-hover:text-white transition-colors">{alt.mode || alt.flight}</span>
                          <span className="text-[9px] text-white/40">{alt.duration || alt.time}</span>
                        </div>
                        <div className="text-[10px] font-mono text-emerald-400">₹{alt.cost?.toLocaleString()}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="!w-2 !h-2 !bg-white !border-none" />
    </motion.div>
  );
});
