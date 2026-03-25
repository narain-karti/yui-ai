import { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { MapPin, Building, Briefcase, Coffee } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';

export default memo(function LocationNode({ data, isConnectable }: any) {
  const [isHovered, setIsHovered] = useState(false);

  const config = {
    airport: { icon: MapPin, color: 'bg-[#185FA5]', border: 'border-[#185FA5]', shadow: 'shadow-[#185FA5]/20' },
    hotel: { icon: Building, color: 'bg-[#0F6E56]', border: 'border-[#0F6E56]', shadow: 'shadow-[#0F6E56]/20' },
    venue: { icon: Briefcase, color: 'bg-accent', border: 'border-accent', shadow: 'shadow-accent/20' },
    restaurant: { icon: Coffee, color: 'bg-[#993C1D]', border: 'border-[#993C1D]', shadow: 'shadow-[#993C1D]/20' },
  }[data.subtype as string] || { icon: MapPin, color: 'bg-accent', border: 'border-accent', shadow: 'shadow-accent/20' };

  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: 50 }}
      animate={{ opacity: 1, scale: isHovered ? 1.1 : 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20, delay: (data.index || 0) * 0.15 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={clsx(
        "relative w-48 rounded-[24px] border-2 bg-surface/80 backdrop-blur-md overflow-hidden shadow-lg transition-colors duration-300",
        config.border, config.shadow
      )}
    >
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-3 h-3 bg-white border-2 border-bg" />
      
      {/* Header */}
      <div className={clsx("px-3 py-2 flex items-center gap-2 text-white", config.color)}>
        <Icon size={14} />
        <span className="text-xs font-bold tracking-wider uppercase">{data.subtype}</span>
      </div>

      {/* Body */}
      <div className="p-3 space-y-1">
        <div className="text-sm font-bold text-white truncate">{data.label}</div>
        <div className="text-xs text-white/60">ETA: {new Date(data.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isHovered && data.details && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-3 pb-3 border-t border-white/10 bg-black/20"
          >
            <div className="text-[10px] text-white/40 uppercase tracking-wider mt-2 mb-1">Details</div>
            <div className="text-[10px] text-white/70 bg-white/5 px-2 py-1.5 rounded leading-relaxed">
              {data.details}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="w-3 h-3 bg-white border-2 border-bg" />
    </motion.div>
  );
});
