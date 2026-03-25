import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';
import { motion } from 'motion/react';

export default function AnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
}: any) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      
      {/* Animated Dot */}
      <circle r="4" fill="#FF4F00">
        <animateMotion dur="3s" repeatCount="indefinite" path={edgePath} />
      </circle>

      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <motion.div 
              whileHover={{ scale: 1.1 }}
              className="px-2 py-1 rounded-md bg-black/80 border border-white/10 text-[10px] text-white/80 backdrop-blur-md shadow-lg"
            >
              {label}
            </motion.div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
