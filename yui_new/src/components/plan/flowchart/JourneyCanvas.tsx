import { useCallback, useMemo, useState, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
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
    if (!data) return;

    // Layout the nodes horizontally
    const layoutedNodes = (data.nodes || []).map((node: any, index: number) => ({
      ...node,
      position: { x: index * 350 + 100, y: 250 },
      type: node.type || 'location',
      data: { ...node.data, index }
    }));

    const formattedEdges = (data.edges || []).map((edge: any) => ({
      ...edge,
      type: 'animated',
      animated: true,
      style: { stroke: '#FF4F00', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#FF4F00' },
    }));

    setNodes(layoutedNodes);
    setEdges(formattedEdges);
  }, [data, setNodes, setEdges]);

  const onNodeClick = useCallback((event: any, node: any) => {
    setSelectedNode(node);
  }, []);

  return (
    <div className="w-full h-full relative bg-[#07070E]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        className="bg-[#07070E]"
      >
        <Background color="#ffffff" gap={16} size={1} opacity={0.05} />
        <Controls className="bg-surface border-white/10 fill-white/50" />
        <MiniMap 
          nodeColor={(node) => {
            switch (node.type) {
              case 'transport': return '#185FA5';
              case 'location': return '#0F6E56';
              case 'wait': return '#444441';
              default: return '#eee';
            }
          }}
          maskColor="rgba(0, 0, 0, 0.8)"
          className="bg-surface border border-white/10"
        />
      </ReactFlow>

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
