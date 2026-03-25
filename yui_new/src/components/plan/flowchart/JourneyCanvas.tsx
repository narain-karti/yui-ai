import { useCallback, useState, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import TransportNode from './nodes/TransportNode';
import LocationNode from './nodes/LocationNode';
import WaitNode from './nodes/WaitNode';
import AnimatedEdge from './edges/AnimatedEdge';
import NodePopup from './NodePopup';

const nodeTypes = {
  transport: TransportNode,
  location: LocationNode,
  wait: WaitNode,
};

const edgeTypes = {
  animated: AnimatedEdge,
};

export default function JourneyCanvas({ data }: { data: any }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  useEffect(() => {
    if (!data || !data.nodes) return;

    // Layout nodes horizontally with spacing
    const layoutedNodes = data.nodes.map((node: any, index: number) => ({
      ...node,
      position: { x: index * 320 + 50, y: 150 + (index % 2 === 0 ? 0 : 80) }, // Staggered for futuristic look
      style: { opacity: 0 }, // Initial opacity for entrance animation
      data: { ...node.data, index }
    }));

    const formattedEdges = (data.edges || []).map((edge: any) => ({
      ...edge,
      type: 'animated',
      animated: true,
      style: { stroke: '#a855f7', strokeWidth: 3, filter: 'drop-shadow(0 0 8px #a855f760)' },
      markerEnd: { 
        type: MarkerType.ArrowClosed, 
        color: '#a855f7',
        width: 20,
        height: 20
      },
    }));

    setNodes(layoutedNodes);
    setEdges(formattedEdges);
  }, [data, setNodes, setEdges]);

  const onNodeClick = useCallback((event: any, node: any) => {
    setSelectedNode(node);
  }, []);

  return (
    <div className="w-full h-full relative bg-[#07070E] overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/30 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/30 blur-[120px] rounded-full" />
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        className="bg-transparent"
        minZoom={0.2}
        maxZoom={1.5}
      >
        <Background color="#ffffff" gap={20} size={1} opacity={0.03} />
        <Controls className="bg-[#0A0A14] border border-white/10 fill-white/50 text-white !rounded-xl overflow-hidden" />
        <MiniMap 
          nodeColor={(node) => {
            switch (node.type) {
              case 'transport': return '#3b82f6';
              case 'location': return '#10b981';
              case 'wait': return '#4b5563';
              default: return '#8b5cf6';
            }
          }}
          maskColor="rgba(7, 7, 14, 0.9)"
          className="bg-[#0A0A14] border border-white/10 rounded-2xl"
        />
      </ReactFlow>

      {/* Node Dialog/Popup handled by the component */}
      {selectedNode && (
        <NodePopup 
          node={selectedNode} 
          onClose={() => setSelectedNode(null)} 
          fullPlanContext={data}
          onUpdateNode={(updatedNode: any) => {
            setNodes((nds) => nds.map((n) => n.id === updatedNode.id ? { ...n, ...updatedNode } : n));
          }}
        />
      )}
    </div>
  );
}
