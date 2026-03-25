import { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { MapPin, Building, Briefcase, Coffee, Info, CloudRain, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';

const SUBTYPE_CONFIG: Record<string, any> = {
  airport: { icon: MapPin, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/50', glow: 'shadow-indigo-500/20' },
  hotel: { icon: Building, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/50', glow: 'shadow-emerald-500/20' },
  venue: { icon: Briefcase, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/50', glow: 'shadow-rose-500/20' },
  restaurant: { icon: Coffee, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/50', glow: 'shadow-amber-500/20' },
};

export default memo(function LocationNode({ data, isConnectable }: any) {
  const [isHovered, setIsHovered] = useState(false);
  const cfg = SUBTYPE_CONFIG[data.subtype as string] || SUBTYPE_CONFIG.venue;
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileHover={{ scale: 1.05, zIndex: 50 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={clsx(
        "relative min-w-[200px] rounded-3xl border bg-[#0A0A14]/90 backdrop-blur-xl transition-all duration-500",
        cfg.border, isHovered ? cfg.glow : 'shadow-xl shadow-black/50',
        "border-b-4"
      )}
    >
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="!w-2 !h-2 !bg-white !border-none" />
      
      {/* Glow Effect */}
      {isHovered && (
        <motion.div
          layoutId="loc-glow"
          className="absolute inset-0 rounded-3xl opacity-20 pointer-events-none"
          style={{ background: `radial-gradient(circle at top right, ${cfg.accent}, transparent)` }}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <div className={clsx("p-2 rounded-2xl", cfg.bg)}>
          <Icon size={18} className={cfg.color} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white line-clamp-1">{data.label}</h3>
          <span className="text-[9px] font-mono tracking-[0.2em] text-white/30 uppercase">{data.subtype}</span>
        </div>
      </div>

      {/* Preview Content */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between text-[10px] text-white/50 bg-black/40 rounded-full px-3 py-1.5 border border-white/5">
          <div className="flex items-center gap-1.5">
            <Clock size={10} className="text-white/30" />
            <span>ETA {data.eta || '10:00 AM'}</span>
          </div>
          {data.weather && <span className="font-mono text-cyan-400">{data.weather}</span>}
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
            <div className="mt-3 space-y-3">
              {/* Location Details */}
              <div className="text-[10px] text-white/60 leading-relaxed bg-white/5 rounded-xl p-3 border border-white/5">
                <div className="flex items-center gap-2 mb-2 text-white/30 font-bold uppercase tracking-widest text-[8px]">
                   <Info size={10} /> Intelligence
                </div>
                {data.details || 'Personalized location insight for your journey leg.'}
              </div>

              {/* Weather Insight if available */}
              {data.weather_insight && (
                <div className="flex items-start gap-3 bg-cyan-500/5 rounded-xl p-3 border border-cyan-500/10">
                  <CloudRain size={14} className="text-cyan-400 shrink-0" />
                  <div className="text-[10px] text-cyan-100/70">{data.weather_insight}</div>
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
