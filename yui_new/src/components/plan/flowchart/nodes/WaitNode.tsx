import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Clock, Hourglass } from 'lucide-react';
import { motion } from 'motion/react';

export default memo(function WaitNode({ data, isConnectable }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, rotate: -20 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      whileHover={{ scale: 1.1, rotate: 5 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="relative w-20 h-20 rounded-full border border-white/10 bg-[#0A0A14]/80 backdrop-blur-xl shadow-xl shadow-black/50 flex flex-col items-center justify-center overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="!w-1.5 !h-1.5 !bg-white/40 !border-none" />
      
      <motion.div 
        animate={{ rotate: 360 }} 
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="relative"
      >
        <div className="absolute inset-0 blur-sm bg-white/10 rounded-full" />
        <Hourglass size={20} className="text-white/40 mb-1 relative z-10" />
      </motion.div>
      
      <div className="text-[9px] font-mono font-bold text-white/50 tracking-tighter uppercase mt-1">
        {data.duration || 'Wait'}
      </div>

      <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="!w-1.5 !h-1.5 !bg-white/40 !border-none" />
    </motion.div>
  );
});
