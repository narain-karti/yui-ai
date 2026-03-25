import { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Plane, Train, Car, Bus, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';

export default memo(function TransportNode({ data, isConnectable }: any) {
  const [isHovered, setIsHovered] = useState(false);

  const config = {
    flight: { icon: Plane, color: 'bg-[#185FA5]', border: 'border-[#185FA5]', shadow: 'shadow-[#185FA5]/20' },
    train: { icon: Train, color: 'bg-[#3B6D11]', border: 'border-[#3B6D11]', shadow: 'shadow-[#3B6D11]/20' },
    taxi: { icon: Car, color: 'bg-[#854F0B]', border: 'border-[#854F0B]', shadow: 'shadow-[#854F0B]/20' },
    bus: { icon: Bus, color: 'bg-[#444441]', border: 'border-[#444441]', shadow: 'shadow-[#444441]/20' },
  }[data.subtype as string] || { icon: Car, color: 'bg-accent', border: 'border-accent', shadow: 'shadow-accent/20' };

  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: 50 }}
      animate={{ opacity: 1, scale: isHovered ? 1.1 : 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20, delay: (data.index || 0) * 0.15 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={clsx(
        "relative w-48 rounded-none rounded-tr-xl rounded-br-xl border-y-2 border-r-2 border-l-[6px] bg-surface/80 backdrop-blur-md overflow-hidden shadow-lg transition-colors duration-300",
        config.border, config.shadow
      )}
    >
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-3 h-3 bg-white border-2 border-bg" />
      
      {/* Header */}
      <div className={clsx("px-3 py-2 flex items-center justify-between", config.color)}>
        <div className="flex items-center gap-2 text-white">
          <Icon size={14} />
          <span className="text-xs font-bold tracking-wider uppercase">{data.subtype}</span>
        </div>
        {data.status === 'ON_TIME' ? (
          <span className="text-[9px] font-bold bg-green-500/20 text-green-300 px-1.5 py-0.5 rounded-sm">ON TIME</span>
        ) : data.status === 'DELAYED' ? (
          <span className="flex items-center gap-1 text-[9px] font-bold bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded-sm animate-pulse">
            <AlertCircle size={10} /> DELAYED
          </span>
        ) : null}
      </div>

      {/* Body */}
      <div className="p-3 space-y-1">
        <div className="text-sm font-bold text-white truncate">{data.label}</div>
        <div className="flex items-center justify-between text-xs text-white/60">
          <span>{data.departure} - {data.arrival}</span>
          <span className="font-mono text-accent">₹{data.cost}</span>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isHovered && data.alternatives && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-3 pb-3 border-t border-white/10 bg-black/20"
          >
            <div className="text-[10px] text-white/40 uppercase tracking-wider mt-2 mb-1">Alternatives</div>
            <div className="space-y-1">
              {data.alternatives.map((alt: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-[10px] text-white/70 bg-white/5 px-2 py-1 rounded">
                  <span>{alt.flight || alt.mode}</span>
                  <span className="text-accent">₹{alt.cost}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="w-3 h-3 bg-white border-2 border-bg" />
    </motion.div>
  );
});
