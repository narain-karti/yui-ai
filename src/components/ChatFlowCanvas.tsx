import { useState, useRef, useEffect } from 'react';
import { ReactFlow, Background, Controls, useNodesState, useEdgesState, Node, Edge, Handle, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { useAppSounds } from '../hooks/useAppSounds';

// Custom Minimalist Node
const LogicNode = ({ data }: any) => {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`px-4 py-3 rounded-xl border flex items-center justify-center text-center shadow-lg relative ${
        data.type === 'trigger' ? 'bg-red-500/10 border-red-500/50' :
        data.type === 'action' ? 'bg-accent/10 border-accent/50' :
        data.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/50' :
        'bg-surface border-white/10'
      }`}
    >
      <Handle type="target" position={Position.Left} className="opacity-0 w-full h-full absolute inset-0 z-0" />
      <span className="text-sm font-medium text-white relative z-10">{data.label}</span>
      <Handle type="source" position={Position.Right} className="opacity-0 w-full h-full absolute inset-0 z-0" />
    </motion.div>
  );
};

const nodeTypes = { logic: LogicNode };

const SCENARIOS = [
  {
    question: "What happens if I miss my connecting flight?",
    reply: "If you miss your connecting flight, Yui AI immediately detects the disruption via backend APIs. It analyzes alternative routes, automatically holds the best available seat, and alerts you with a rebooking option before you even reach the customer service desk.",
    nodes: [
      { id: '1', type: 'logic', position: { x: 50, y: 100 }, data: { label: '🚨 Missed Connection Detected', type: 'trigger' } },
      { id: '2', type: 'logic', position: { x: 300, y: 50 }, data: { label: '🔍 Analyzing Alternatives', type: 'action' } },
      { id: '3', type: 'logic', position: { x: 300, y: 150 }, data: { label: '🎫 Holding New Seat', type: 'action' } },
      { id: '4', type: 'logic', position: { x: 550, y: 100 }, data: { label: '✅ Instant Rebooking Alert', type: 'success' } },
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: 'rgba(255,255,255,0.3)', strokeWidth: 2 } },
      { id: 'e1-3', source: '1', target: '3', animated: true, style: { stroke: 'rgba(255,255,255,0.3)', strokeWidth: 2 } },
      { id: 'e2-4', source: '2', target: '4', animated: true, style: { stroke: 'rgba(255,255,255,0.3)', strokeWidth: 2 } },
      { id: 'e3-4', source: '3', target: '4', animated: true, style: { stroke: 'rgba(255,255,255,0.3)', strokeWidth: 2 } },
    ]
  },
  {
    question: "How does Yui handle a hotel overbooking?",
    reply: "Upon receiving overbooking data, Yui crosses geographical APIs to find a comparable or upgraded hotel within a 2-mile radius, books it using your saved corporate card, and updates your Uber drop-off location seamlessly.",
    nodes: [
      { id: 'h1', type: 'logic', position: { x: 50, y: 100 }, data: { label: '🚨 Overbooking Alert', type: 'trigger' } },
      { id: 'h2', type: 'logic', position: { x: 300, y: 50 }, data: { label: '🏨 Auto-Booking Upgrade', type: 'action' } },
      { id: 'h3', type: 'logic', position: { x: 300, y: 150 }, data: { label: '🚗 Updating Ride Drop-off', type: 'action' } },
      { id: 'h4', type: 'logic', position: { x: 550, y: 100 }, data: { label: '✅ Seamless Arrival', type: 'success' } },
    ],
    edges: [
      { id: 'eh1-h2', source: 'h1', target: 'h2', animated: true, style: { stroke: 'rgba(255,255,255,0.3)', strokeWidth: 2 } },
      { id: 'eh1-h3', source: 'h1', target: 'h3', animated: true, style: { stroke: 'rgba(255,255,255,0.3)', strokeWidth: 2 } },
      { id: 'eh2-h4', source: 'h2', target: 'h4', animated: true, style: { stroke: 'rgba(255,255,255,0.3)', strokeWidth: 2 } },
      { id: 'eh3-h4', source: 'h3', target: 'h4', animated: true, style: { stroke: 'rgba(255,255,255,0.3)', strokeWidth: 2 } },
    ]
  }
];

export default function ChatFlowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [messages, setMessages] = useState<{role: 'user' | 'bot', text: string}[]>([{
    role: 'bot', text: "Hello! I'm Yui. Ask me how I handle specific travel disruptions, or click one of the suggestions below to see my logic in action."
  }]);
  const [isTyping, setIsTyping] = useState(false);
  
  const { playClick, playHover, playPop, playSuccess } = useAppSounds();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleScenario = (scenarioIndex: number) => {
    playClick();
    const scenario = SCENARIOS[scenarioIndex];
    
    // Clear graph
    setNodes([]);
    setEdges([]);
    
    // Add User Message
    setMessages(prev => [...prev, { role: 'user', text: scenario.question }]);
    setIsTyping(true);

    // Simulate Network/Processing latency
    setTimeout(() => {
      setIsTyping(false);
      playSuccess();
      setMessages(prev => [...prev, { role: 'bot', text: scenario.reply }]);
      
      // Animate Nodes appearing one by one
      scenario.nodes.forEach((node, idx) => {
        setTimeout(() => {
          playPop();
          setNodes((nds) => [...nds, node]);
        }, idx * 500 + 400); // Stagger introduction
      });

      // Introduce edges slightly after nodes
      setTimeout(() => {
        setEdges(scenario.edges);
      }, scenario.nodes.length * 500 + 800);

    }, 1500);
  };

  return (
    <section id="chat-flow" className="section-padding bg-bg relative border-b border-white/5">
      <div className="container-custom">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6 group hover:bg-accent/20 transition-colors">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm font-bold text-accent uppercase tracking-wider">Dynamic Logic</span>
          </div>
          <h2 className="text-4xl font-display font-bold tracking-tighter mb-4">
            Ask Yui How It Thinks
          </h2>
          <p className="text-secondary">
            Interact with the chat below. As Yui answers, watch its cognitive reasoning engine map out the solution in real-time on the canvas.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[600px] border border-white/10 rounded-[2.5rem] bg-surface/50 overflow-hidden shadow-2xl">
          
          {/* Left Pane: Chat Interface */}
          <div className="col-span-1 lg:col-span-4 bg-[#111] border-r border-white/5 flex flex-col h-full">
            <div className="p-4 border-b border-white/5 bg-surface/80 backdrop-blur-md flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="font-bold text-white">Yui Support Simulation</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <AnimatePresence>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9, originY: 1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-accent/20 text-accent' : 'bg-surface border border-white/10 text-white'}`}>
                      {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed max-w-[85%] shadow-md ${msg.role === 'user' ? 'bg-accent text-white rounded-tr-none' : 'bg-surface border border-white/10 text-secondary rounded-tl-none'}`}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-surface border border-white/10 text-white flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-4 rounded-2xl bg-surface border border-white/10 text-secondary rounded-tl-none flex items-center gap-2">
                    <span className="w-2 h-2 bg-secondary/50 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 bg-secondary/50 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-secondary/50 rounded-full animate-bounce"></span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-surface/50 border-t border-white/5 space-y-2">
              <p className="text-xs text-secondary/60 font-medium mb-3 pl-2 uppercase tracking-wide">Suggested Queries</p>
              {SCENARIOS.map((s, idx) => (
                <button 
                  key={idx}
                  onClick={() => handleScenario(idx)}
                  onMouseEnter={playHover}
                  disabled={isTyping}
                  className="w-full text-left p-3 rounded-xl bg-bg border border-white/5 hover:border-accent/50 hover:bg-surface text-sm text-secondary hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group flex justify-between items-center"
                >
                  <span className="truncate pr-4">{s.question}</span>
                  <Send className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-accent shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Right Pane: React Flow Canvas */}
          <div className="col-span-1 lg:col-span-8 bg-[#0a0a0a] relative h-[400px] lg:h-full">
            {nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-secondary/30 pointer-events-none">
                <span className="font-mono text-sm tracking-wider">Awaiting query to build logic flow...</span>
              </div>
            )}
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              fitView
              panOnScroll={true}
              zoomOnScroll={false}
              proOptions={{ hideAttribution: true }}
            >
              <Background color="#222" gap={24} size={1} />
              <Controls className="bg-surface border-white/10 fill-white" showInteractive={false} />
            </ReactFlow>
          </div>

        </div>
      </div>
    </section>
  );
}
