import { useState, useCallback, useEffect } from 'react';
import { ReactFlow, Background, Controls, MarkerType, useNodesState, useEdgesState, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion } from 'motion/react';
import { AlertTriangle, RefreshCw, CheckCircle2 } from 'lucide-react';

const defaultNodeStyle = {
  background: '#1a1a1a',
  color: '#fff',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '16px',
  padding: '16px',
  fontSize: '14px',
  fontFamily: 'Inter, sans-serif',
  width: 200,
  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
  transition: 'all 0.5s ease',
};

const disruptedNodeStyle = {
  ...defaultNodeStyle,
  background: 'rgba(239, 68, 68, 0.1)',
  border: '1px solid rgba(239, 68, 68, 0.5)',
  boxShadow: '0 0 30px rgba(239, 68, 68, 0.2)',
};

const impactedNodeStyle = {
  ...defaultNodeStyle,
  background: 'rgba(245, 158, 11, 0.1)',
  border: '1px solid rgba(245, 158, 11, 0.5)',
  boxShadow: '0 0 30px rgba(245, 158, 11, 0.2)',
};

const resolvedNodeStyle = {
  ...defaultNodeStyle,
  background: 'rgba(16, 185, 129, 0.1)',
  border: '1px solid rgba(16, 185, 129, 0.5)',
  boxShadow: '0 0 30px rgba(16, 185, 129, 0.2)',
};

const initialNodes: Node[] = [
  { id: 'flight', position: { x: 50, y: 150 }, data: { label: '✈️ Flight AI302 (BOM → BLR)' }, style: defaultNodeStyle },
  { id: 'meeting', position: { x: 350, y: 50 }, data: { label: '💼 Client Meeting (12:00 PM)' }, style: defaultNodeStyle },
  { id: 'hotel', position: { x: 350, y: 250 }, data: { label: '🏨 Hotel Check-in (2:00 PM)' }, style: defaultNodeStyle },
  { id: 'ride', position: { x: 650, y: 50 }, data: { label: '🚗 Uber to Office (11:15 AM)' }, style: defaultNodeStyle },
];

const initialEdges: Edge[] = [
  { id: 'e-flight-meeting', source: 'flight', target: 'meeting', animated: false, style: { stroke: 'rgba(255,255,255,0.2)', strokeWidth: 2 } },
  { id: 'e-flight-hotel', source: 'flight', target: 'hotel', animated: false, style: { stroke: 'rgba(255,255,255,0.2)', strokeWidth: 2 } },
  { id: 'e-meeting-ride', source: 'meeting', target: 'ride', animated: false, style: { stroke: 'rgba(255,255,255,0.2)', strokeWidth: 2 } },
];

export default function SystemArchitecture() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [status, setStatus] = useState<'normal' | 'disrupted' | 'resolving' | 'resolved'>('normal');

  const simulateDisruption = () => {
    setStatus('disrupted');
    
    // 1. Mark flight as disrupted
    setNodes((nds) => nds.map(n => {
      if (n.id === 'flight') return { ...n, style: disruptedNodeStyle, data: { label: '🚨 Flight AI302 (DELAYED 2h)' } };
      return n;
    }));

    // 2. Animate edges to show cascade
    setEdges((eds) => eds.map(e => ({
      ...e,
      animated: true,
      style: { stroke: '#ef4444', strokeWidth: 2 }
    })));

    // 3. Mark dependent nodes as impacted after a short delay
    setTimeout(() => {
      setNodes((nds) => nds.map(n => {
        if (n.id === 'meeting') return { ...n, style: impactedNodeStyle, data: { label: '⚠️ Meeting (At Risk)' } };
        if (n.id === 'hotel') return { ...n, style: impactedNodeStyle, data: { label: '⚠️ Hotel (Late Arrival)' } };
        if (n.id === 'ride') return { ...n, style: impactedNodeStyle, data: { label: '⚠️ Uber (Missed Pickup)' } };
        return n;
      }));
    }, 1000);
  };

  const resolveDisruption = () => {
    setStatus('resolving');
    
    // 1. Change edge colors to resolving
    setEdges((eds) => eds.map(e => ({
      ...e,
      animated: true,
      style: { stroke: '#10b981', strokeWidth: 2 }
    })));

    // 2. Resolve nodes
    setTimeout(() => {
      setNodes((nds) => nds.map(n => {
        if (n.id === 'flight') return { ...n, style: resolvedNodeStyle, data: { label: '✅ Rebooked: AI405 (10:00 AM)' } };
        if (n.id === 'meeting') return { ...n, style: resolvedNodeStyle, data: { label: '✅ Meeting Rescheduled (2:00 PM)' } };
        if (n.id === 'hotel') return { ...n, style: resolvedNodeStyle, data: { label: '✅ Hotel Notified (Late Check-in)' } };
        if (n.id === 'ride') return { ...n, style: resolvedNodeStyle, data: { label: '✅ Uber Updated (1:15 PM)' } };
        return n;
      }));
      
      setEdges((eds) => eds.map(e => ({
        ...e,
        animated: false,
        style: { stroke: 'rgba(16, 185, 129, 0.5)', strokeWidth: 2 }
      })));
      
      setStatus('resolved');
    }, 1500);
  };

  const resetGraph = () => {
    setStatus('normal');
    setNodes(initialNodes);
    setEdges(initialEdges);
  };

  return (
    <section id="architecture" className="section-padding bg-bg border-y border-white/5 relative">
      <div className="container-custom">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="tag mb-6">{'{ Knowledge Graph }'}</span>
          <h2 className="text-4xl md:text-6xl font-display font-bold tracking-tighter mb-6">
            Cascade Analysis Visualization
          </h2>
          <p className="text-secondary text-lg">
            Yui doesn't just see a delayed flight; it sees the entire interconnected web of your trip. Interact with the graph below to see how a single disruption cascades, and how Yui resolves it.
          </p>
        </div>

        <div className="flex justify-center gap-4 mb-8 relative z-10">
          <button
            onClick={simulateDisruption}
            disabled={status !== 'normal'}
            className="px-6 py-3 rounded-full bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" /> Simulate Disruption
          </button>
          <button
            onClick={resolveDisruption}
            disabled={status !== 'disrupted'}
            className="px-6 py-3 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${status === 'resolving' ? 'animate-spin' : ''}`} /> Auto-Resolve
          </button>
          <button
            onClick={resetGraph}
            disabled={status === 'normal'}
            className="px-6 py-3 rounded-full bg-surface text-secondary border border-white/10 hover:text-white transition-colors font-bold"
          >
            Reset
          </button>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, type: "spring", bounce: 0.2 }}
          className="w-full h-[500px] rounded-[2.5rem] border border-white/10 bg-[#0a0a0a] overflow-hidden relative"
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            attributionPosition="bottom-right"
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#333" gap={20} size={1} />
            <Controls className="bg-surface border-white/10 fill-white" />
          </ReactFlow>
        </motion.div>
      </div>
    </section>
  );
}
