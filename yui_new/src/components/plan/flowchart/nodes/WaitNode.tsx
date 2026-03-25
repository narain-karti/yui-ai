import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Clock } from 'lucide-react';
import { motion } from 'motion/react';

export default memo(function WaitNode({ data, isConnectable }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileHover={{ scale: 1.1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20, delay: (data.index || 0) * 0.15 }}
      className="relative w-24 h-24 rounded-full border-2 border-[#444441] bg-surface/80 backdrop-blur-md shadow-lg shadow-[#444441]/20 flex flex-col items-center justify-center"
    >
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-2 h-2 bg-white border-2 border-bg" />
      
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}>
        <Clock size={24} className="text-white/50 mb-1" />
      </motion.div>
      <div className="text-[10px] font-bold text-white/80 text-center leading-tight">
        {data.duration}
      </div>

      <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="w-2 h-2 bg-white border-2 border-bg" />
    </motion.div>
  );
});
